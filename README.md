# Tegro.Money MCP Server

[![npm version](https://img.shields.io/npm/v/@tegroton/tegro-money-mcp.svg)](https://www.npmjs.com/package/@tegroton/tegro-money-mcp)
[![CI](https://github.com/TegroTON/tegro-money-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/TegroTON/tegro-money-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![MCP](https://img.shields.io/badge/MCP-server-blue.svg)](https://modelcontextprotocol.io)

Connect **Claude**, **Cursor**, and any other [Model Context Protocol](https://modelcontextprotocol.io) client to the **[Tegro.Money](https://tegro.money)** payment API. Ask your AI assistant about your balances, projects, payment orders, payouts and exchange rates — in plain language.

> **Read-only and safe by design.** This server exposes information tools only — no payment creation, no payouts, no money movement. Your API key is used **locally** to sign requests and **never leaves your machine**.

```
You:  "What's my Tegro.Money balance and how many orders were paid today?"
Claude: → calls get_balance, list_orders → answers with your real data.
```

## Tools

| Tool | What it does |
|------|--------------|
| `get_balance` | Balance of all your wallets, per currency (RUB/USD/…) |
| `list_shops` | Your projects (shops): id, name, url, Shop ID, status |
| `list_orders` | Payment orders for a shop (amount, status, method, dates) |
| `get_order` | Status & details of one order by `order_id` |
| `list_withdrawals` | Payout requests for a shop |
| `get_withdrawal` | Status & details of one payout by `order_id` |
| `get_rates` | Exchange rate between two currencies |
| `list_payment_systems` | Payment methods available for a shop |

## Quick start

You need your **REST API key** from the Tegro.Money dashboard → your project → **Settings → Keys → API KEY** (this is the key for the REST API; it is different from the Shop ID / Secret Key used for the payment form).

### Claude Desktop

Add to your `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "tegro-money": {
      "command": "npx",
      "args": ["-y", "@tegroton/tegro-money-mcp"],
      "env": {
        "TEGRO_API_KEY": "your_rest_api_key",
        "TEGRO_SHOP_ID": "your_shop_id_optional"
      }
    }
  }
}
```

Restart Claude Desktop — the tools appear under the 🔌 menu.

### Cursor

`Settings → MCP → Add new server`, or add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "tegro-money": {
      "command": "npx",
      "args": ["-y", "@tegroton/tegro-money-mcp"],
      "env": { "TEGRO_API_KEY": "your_rest_api_key" }
    }
  }
}
```

### Any MCP client

Run over stdio:

```bash
TEGRO_API_KEY=your_rest_api_key npx -y @tegroton/tegro-money-mcp
```

## Configuration

| Env var | Required | Default | Description |
|---------|----------|---------|-------------|
| `TEGRO_API_KEY` | ✅ | — | Your REST API key. Used only to sign requests locally (HMAC-SHA256); never sent over the network. |
| `TEGRO_SHOP_ID` | — | — | Default Shop ID for shop-scoped tools, so you don't pass it each time. |
| `TEGRO_API_BASE` | — | `https://tegro.money` | API base URL. |

## Security

- **Read-only.** No tool can create an order, move funds, or change anything. It only reads.
- **Your key stays local.** The API key signs each request body with HMAC-SHA256 right on your machine; only the signature (`Authorization: Bearer <hmac>`) goes to the API — the key itself is never transmitted.
- **No secrets in this repo.** You provide your own key via environment variables.
- **Open source (MIT).** Read every line — it's small on purpose.

Found a security issue? See [SECURITY.md](./SECURITY.md).

## Examples

Once connected, just ask in natural language — the assistant picks the tool. A few
things it can answer:

| You ask | Tool(s) used | Example answer |
|---------|--------------|----------------|
| "What's my balance?" | `get_balance` | "RUB 12 480.50, USD 0.00." |
| "Did order 777 get paid?" | `get_order` | "Order 777: **paid** on 2026-06-20, 1 200 ₽." |
| "Revenue today?" | `list_orders` | sums paid orders by `date_payed`. |
| "Which payment methods are on shop X?" | `list_payment_systems` | lists the enabled methods. |
| "RUB to USD rate?" | `get_rates` | the current rate. |

A raw tool result is the API's `data` object, pretty-printed JSON — e.g. `get_balance`:

```json
{ "user_id": 1, "balance": { "RUB": "12480.50", "USD": "0.00" } }
```

## How it works

Each request is a JSON body (with a unique `nonce`) signed per the [official Tegro.Money API](https://tegro.money/api/):

```
sign = HMAC_SHA256(json_body, api_key)
POST https://tegro.money/api/<endpoint>/
Authorization: Bearer <sign>
```

The signed body is byte-identical to the body sent, so the signature always matches. The key
only ever feeds the local HMAC — it is never placed in a URL, body, or log.

## Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| `TEGRO_API_KEY is not set` | Set the env var to your **REST API key** (dashboard → project → Settings → Keys → **API KEY**) — not the Shop ID / Secret Key. |
| `Wrong authorization token` | The key is incorrect, or the request body was altered between signing and sending. Double-check `TEGRO_API_KEY`. |
| `Empty required param shop_id` | The endpoint needs a shop. Pass `shop_id`, or set `TEGRO_SHOP_ID`. |
| `non-JSON … error 1010` / Cloudflare block | The API is behind Cloudflare, which rejects unusual clients. This server already sends a descriptive `User-Agent`; if you still see 1010, your IP/network may be filtered — try another network or contact support. |
| Tools don't appear in the client | Restart the client after editing its config; confirm `npx` can reach the package (`npx -y @tegroton/tegro-money-mcp` should start and print to stderr). |

## FAQ

**Is this safe to run? Can it spend my money?**
No. Every tool is read-only — there is no order-creation or payout tool. The worst it can do
is *read* your account data.

**Where does my API key go?**
Nowhere. It signs each request locally (HMAC-SHA256); only the resulting signature is sent.
The key is never transmitted or logged.

**Which key do I use?**
The **REST API key** (dashboard → project → Settings → Keys → **API KEY**). The Shop ID and
Secret Key are for the payment form and are *not* used here.

**Does it work with ChatGPT?**
MCP is the protocol used by Claude Desktop, Cursor, Claude Code, and other MCP clients. ChatGPT
uses a different connector system, so this stdio server isn't a drop-in there.

**Can it create payment links / invoices?**
Not in this package — it's read-only on purpose. That belongs in a separate, clearly-scoped tool.

## Development

```bash
git clone https://github.com/TegroTON/tegro-money-mcp.git
cd tegro-money-mcp
npm install
npm run typecheck                 # tsc --noEmit
npm run build                     # compile to dist/
npm test                          # node:test via tsx (mocked fetch — no API key needed)
TEGRO_API_KEY=... npm run dev     # run the server from source
```

## Contributing

PRs welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) and our
[Code of Conduct](./CODE_OF_CONDUCT.md). Keep it read-only, tested, and secret-free.

## Links

- 🌐 [Tegro.Money](https://tegro.money) · [API docs](https://tegro.money/api/)
- 📖 [Model Context Protocol](https://modelcontextprotocol.io)
- 🐛 [Issues](https://github.com/TegroTON/tegro-money-mcp/issues) · 🔒 [Security](./SECURITY.md)

## Community

Follow Tegro.Money:

- 💬 Telegram — [@TegroMoney](https://t.me/TegroMoney) · bot: [@TegroMoneybot](https://t.me/TegroMoneybot)
- 𝕏 Twitter/X — [@TegroTON](https://twitter.com/TegroTON)
- 🟦 VK — [vk.com/tegro](https://vk.com/tegro)
- 💼 LinkedIn — [tegromoney](https://www.linkedin.com/company/tegromoney/)
- 📸 Instagram — [@tegromoney](https://www.instagram.com/tegromoney/)
- ✍️ Teletype — [@tegro](https://teletype.in/@tegro)
- 🐙 GitHub — [TegroTON](https://github.com/TegroTON)

## License

[MIT](./LICENSE) © Tegro.Money
