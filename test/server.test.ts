import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { TegroClient } from "../src/client.js";
import { registerTools } from "../src/tools.js";

const KEY = "test_api_key_123";
const cfg = { apiKey: KEY, apiBase: "https://tegro.money", shopId: "SHOP1" } as const;

/** Swap global fetch for the duration of a test; returns a restore fn. */
function mockFetch(handler: typeof fetch): () => void {
  const orig = globalThis.fetch;
  globalThis.fetch = handler;
  return () => {
    globalThis.fetch = orig;
  };
}

const ok = (data: unknown) =>
  new Response(JSON.stringify({ type: "success", data }), { status: 200 });

test("signs the EXACT body it sends (HMAC-SHA256, hex)", async () => {
  let captured: { body: string; auth: string } | undefined;
  const restore = mockFetch(async (_url, init) => {
    captured = {
      body: String((init as RequestInit).body),
      auth: ((init as RequestInit).headers as Record<string, string>).Authorization,
    };
    return ok({ RUB: "1.00" });
  });
  try {
    await new TegroClient(cfg).call("balance");
    assert.ok(captured, "fetch was called");
    const expected = "Bearer " + createHmac("sha256", KEY).update(captured.body).digest("hex");
    assert.equal(captured.auth, expected, "Authorization must be HMAC of the exact sent body");
    assert.equal(typeof JSON.parse(captured.body).nonce, "number", "body carries a numeric nonce");
  } finally {
    restore();
  }
});

test("nonce is strictly increasing across calls", async () => {
  const nonces: number[] = [];
  const restore = mockFetch(async (_url, init) => {
    nonces.push(JSON.parse(String((init as RequestInit).body)).nonce);
    return ok({});
  });
  try {
    const c = new TegroClient(cfg);
    for (let i = 0; i < 8; i++) await c.call("balance");
    for (let i = 1; i < nonces.length; i++) {
      assert.ok(nonces[i] > nonces[i - 1], `nonce[${i}] must be > nonce[${i - 1}]`);
    }
  } finally {
    restore();
  }
});

test("builds the correct URL and is POST + JSON", async () => {
  let url: string | undefined;
  let method: string | undefined;
  const restore = mockFetch(async (u, init) => {
    url = String(u);
    method = (init as RequestInit).method;
    return ok({});
  });
  try {
    await new TegroClient(cfg).call("shops");
    assert.equal(url, "https://tegro.money/api/shops/");
    assert.equal(method, "POST");
  } finally {
    restore();
  }
});

test("throws on API error (type !== success), surfacing desc", async () => {
  const restore = mockFetch(async () =>
    new Response(JSON.stringify({ type: "error", desc: "Wrong authorization token" }), { status: 200 }),
  );
  try {
    await assert.rejects(() => new TegroClient(cfg).call("balance"), /Wrong authorization token/);
  } finally {
    restore();
  }
});

test("throws on non-JSON response", async () => {
  const restore = mockFetch(async () => new Response("<html>502 Bad Gateway</html>", { status: 502 }));
  try {
    await assert.rejects(() => new TegroClient(cfg).call("balance"), /non-JSON/);
  } finally {
    restore();
  }
});

test("throws on success with no data (instead of returning undefined)", async () => {
  const restore = mockFetch(async () => new Response(JSON.stringify({ type: "success" }), { status: 200 }));
  try {
    await assert.rejects(() => new TegroClient(cfg).call("balance"), /no data/);
  } finally {
    restore();
  }
});

test("network errors are wrapped with endpoint context", async () => {
  const restore = mockFetch(async () => {
    throw new Error("ECONNREFUSED");
  });
  try {
    await assert.rejects(() => new TegroClient(cfg).call("balance"), /Network error calling balance/);
  } finally {
    restore();
  }
});

test("resolveShopId: explicit arg > config default > throws", () => {
  const c = new TegroClient(cfg);
  assert.equal(c.resolveShopId("EXPLICIT"), "EXPLICIT");
  assert.equal(c.resolveShopId(), "SHOP1");
  const noShop = new TegroClient({ apiKey: KEY, apiBase: "https://tegro.money" });
  assert.throws(() => noShop.resolveShopId(), /shop_id is required/);
});

test("registers exactly the 8 READ-ONLY tools — no mutating endpoints", () => {
  const names: string[] = [];
  const fakeServer = { registerTool: (name: string) => names.push(name) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerTools(fakeServer as any, new TegroClient(cfg));

  assert.deepEqual(
    [...names].sort(),
    [
      "get_balance",
      "get_order",
      "get_rates",
      "get_withdrawal",
      "list_orders",
      "list_payment_systems",
      "list_shops",
      "list_withdrawals",
    ],
  );
  for (const n of names) {
    assert.ok(!/create|payout|refund|delete|cancel/i.test(n), `unexpected mutating tool: ${n}`);
  }
});
