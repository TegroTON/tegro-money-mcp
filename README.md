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

## How it works

Each request is a JSON body (with a unique `nonce`) signed per the [official Tegro.Money API](https://tegro.money/api/):

```
sign = HMAC_SHA256(json_body, api_key)
POST https://tegro.money/api/<endpoint>/
Authorization: Bearer <sign>
```

## Development

```bash
git clone https://github.com/TegroTON/tegro-money-mcp.git
cd mcp-money
npm install
npm run build            # compile to dist/
TEGRO_API_KEY=... npm run dev   # run from source (tsx)
```

## Links

- 🌐 [Tegro.Money](https://tegro.money) · [API docs](https://tegro.money/api/)
- 📖 [Model Context Protocol](https://modelcontextprotocol.io)
- 🐛 [Issues](https://github.com/TegroTON/tegro-money-mcp/issues)

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
