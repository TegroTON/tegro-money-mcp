# Contributing to tegro-money-mcp

Thanks for helping improve the Tegro.Money MCP server! This is a small, focused,
**read-only** project — contributions that keep it that way are very welcome.

## Ground rules

- **Read-only contract.** Tools must only *read*. Pull requests that add order
  creation, payouts, or any money-moving action will be declined (a separate,
  clearly-scoped package would handle write actions). See [SECURITY.md](./SECURITY.md).
- **No secrets, ever.** Credentials come only from environment variables. Never
  commit a key, never log one.
- **The API is the contract.** Endpoints and field names follow the official docs at
  <https://tegro.money/api/>. Mirror them; don't invent.

## Development

```bash
git clone https://github.com/TegroTON/tegro-money-mcp.git
cd tegro-money-mcp
npm install
npm run typecheck     # tsc --noEmit
npm run build         # compile to dist/
npm test              # node:test via tsx (mocked fetch — no API key needed)
TEGRO_API_KEY=... npm run dev   # run the server from source
```

## Pull requests

1. Branch from `main`.
2. Keep changes small and focused; one concern per PR.
3. Add or update tests for any behavior change (`test/`). The suite mocks `fetch`,
   so it runs without an API key — keep it that way.
4. `npm run typecheck && npm run build && npm test` must all pass (CI enforces this).
5. Update `README.md` / `CHANGELOG.md` when user-facing behavior changes.

## Adding a tool

New **read** tools go in `src/tools.ts` via `server.registerTool(...)`, call the
endpoint through `client.call(...)`, and get a test in `test/server.test.ts`
(at minimum: it’s registered, and it isn’t a mutating endpoint).

## Reporting issues

Use the issue templates. For anything security-sensitive, follow
[SECURITY.md](./SECURITY.md) instead of opening a public issue.
