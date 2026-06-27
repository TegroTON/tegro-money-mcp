# CLAUDE.md — tegro-money-mcp

MCP server (Model Context Protocol) exposing the **Tegro.Money** REST API to AI
clients (Claude Desktop, Cursor, …). **Read-only** — no money-moving tools.

## Layout
- `src/config.ts` — env config (`TEGRO_API_KEY` required; `TEGRO_SHOP_ID`, `TEGRO_API_BASE` optional).
- `src/client.ts` — API client. Auth = `HMAC_SHA256(json_body, apiKey)` → `Authorization: Bearer <sign>`. Body signed = body sent (serialize once). Unique `nonce` per request.
- `src/tools.ts` — read-only tool definitions (zod schemas + handlers). **Add new READ tools here.**
- `src/index.ts` — server entry (stdio transport). Logs to stderr only (stdout is the JSON-RPC channel).

## Run / build
`npm install` → `npm run build` (→ dist/) → `npm run dev` (tsx, from source).
Entry: `dist/index.js` (bin: `tegro-money-mcp`).

## Rules
- 🔴 **Read-only contract.** Do NOT add order-creation or payout tools to this
  package without explicit owner sign-off + money-review. Keep it informational.
- Secrets come only from env; never hardcode or log the API key.
- The API contract is the official docs: https://tegro.money/api/ — mirror it.
