import { createHmac } from "node:crypto";
import type { Config } from "./config.js";

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
  private nonceCounter = 0;

  constructor(private readonly cfg: Config) {}

  /** Monotonic, unique-per-request nonce (ms timestamp + counter). */
  private nextNonce(): number {
    const base = Date.now();
    this.nonceCounter = (this.nonceCounter + 1) % 1000;
    return base * 1000 + this.nonceCounter;
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
        },
        body,
      });
    } catch (e) {
      throw new Error(`Network error calling ${endpoint}: ${(e as Error).message}`);
    }

    const text = await res.text();
    let json: { type?: string; desc?: string; data?: unknown };
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(
        `Tegro.Money API returned non-JSON (HTTP ${res.status}) for ${endpoint}: ${text.slice(0, 300)}`,
      );
    }

    if (json.type !== "success") {
      throw new Error(json.desc || `Tegro.Money API error on ${endpoint} (HTTP ${res.status})`);
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
