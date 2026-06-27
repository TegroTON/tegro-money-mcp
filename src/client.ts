import { createHmac } from "node:crypto";
import type { Config } from "./config.js";

/** Safe message extraction — handles non-Error throws (strings, DOMException, …). */
function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Tegro.Money REST API client.
 *
 * Auth (per the official docs, https://tegro.money/api/):
 *   - body  = JSON of the params, MUST include a unique `nonce`
 *   - sign  = HMAC_SHA256(body, apiKey)  (hex)
 *   - headers: `Authorization: Bearer <sign>`, `Content-Type: application/json`
 *
 * The signature is computed over the EXACT body string that is sent, so we
 * serialize once and reuse that string for both signing and the request.
 */
export class TegroClient {
  private lastNonce = 0;

  constructor(private readonly cfg: Config) {}

  /**
   * Strictly increasing, unique-per-request nonce. Based on the ms clock, but
   * bumped by at least 1 on every call so it can never repeat or go backwards —
   * even for many calls within the same millisecond or under a backward clock step.
   */
  private nextNonce(): number {
    const n = Math.max(Date.now(), this.lastNonce + 1);
    this.lastNonce = n;
    return n;
  }

  /**
   * POST to /api/<endpoint>/ with an HMAC-signed body.
   * Returns the `data` field on success; throws Error with the API `desc` on failure.
   */
  async call<T = unknown>(
    endpoint: string,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    const payload = { ...params, nonce: this.nextNonce() };
    const body = JSON.stringify(payload);
    const sign = createHmac("sha256", this.cfg.apiKey).update(body).digest("hex");

    const url = `${this.cfg.apiBase}/api/${endpoint}/`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sign}`,
          "Content-Type": "application/json",
          // A descriptive UA — the API's CDN (Cloudflare) rejects requests with the
          // default runtime user-agent (error 1010).
          "User-Agent":
            "Mozilla/5.0 (compatible; tegro-money-mcp/0.1; +https://github.com/TegroTON/tegro-money-mcp)",
          Accept: "application/json",
        },
        body,
      });
    } catch (e) {
      throw new Error(`Network error calling ${endpoint}: ${errMsg(e)}`, { cause: e });
    }

    let text: string;
    try {
      text = await res.text();
    } catch (e) {
      throw new Error(`Failed to read response body from ${endpoint} (HTTP ${res.status}): ${errMsg(e)}`);
    }

    let json: { type?: string; desc?: string; data?: unknown };
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(
        `Tegro.Money API returned non-JSON (HTTP ${res.status}) for ${endpoint}: ${text.slice(0, 300)}`,
      );
    }

    if (json.type !== "success") {
      throw new Error(
        json.desc || `Tegro.Money API error on ${endpoint} (HTTP ${res.status}): ${text.slice(0, 300)}`,
      );
    }
    if (json.data === undefined) {
      throw new Error(`Tegro.Money API returned success with no data on ${endpoint}.`);
    }
    return json.data as T;
  }

  /** Resolve a shop_id from the call arg or the configured default. */
  resolveShopId(shopId?: string): string {
    const id = shopId?.trim() || this.cfg.shopId;
    if (!id) {
      throw new Error(
        "shop_id is required for this tool. Pass it explicitly or set TEGRO_SHOP_ID.",
      );
    }
    return id;
  }
}
