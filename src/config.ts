/**
 * Configuration, read from environment variables.
 *
 * TEGRO_API_KEY  (required) — your Tegro.Money REST API key (the "API KEY" from
 *                 your dashboard → project settings → Keys). Used ONLY to sign
 *                 requests locally (HMAC-SHA256); it is never sent over the network
 *                 and never leaves your machine.
 * TEGRO_SHOP_ID  (optional) — default Shop ID for shop-scoped tools, so you don't
 *                 have to pass it every time. Tools still accept an explicit shop_id.
 * TEGRO_API_BASE (optional) — API base URL. Default: https://tegro.money
 */
export interface Config {
  apiKey: string;
  shopId?: string;
  apiBase: string;
}

export function loadConfig(): Config {
  const apiKey = process.env.TEGRO_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "TEGRO_API_KEY is not set. Set it to your Tegro.Money REST API key " +
        "(dashboard → project settings → Keys → API KEY). See README for setup.",
    );
  }
  return {
    apiKey,
    shopId: process.env.TEGRO_SHOP_ID?.trim() || undefined,
    apiBase: (process.env.TEGRO_API_BASE?.trim() || "https://tegro.money").replace(/\/+$/, ""),
  };
}
