# Security Policy

## Design

- **Read-only.** This MCP server exposes only information tools. It cannot create
  orders, initiate payouts, or change anything in your Tegro.Money account.
- **Local signing.** Your `TEGRO_API_KEY` is used to compute an HMAC-SHA256
  signature of each request body on your machine. Only the signature is sent
  (`Authorization: Bearer <hmac>`) — the key itself is never transmitted.
- **No bundled secrets.** Credentials come exclusively from environment variables
  you control.

## Reporting a vulnerability

Please do not open a public issue for security reports. Email
**security@tegro.money** with details and a way to reproduce. We aim to respond
within 72 hours.
