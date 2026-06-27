import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TegroClient } from "./client.js";

const json = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

const fail = (e: unknown) => ({
  content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }],
  isError: true,
});

/**
 * Registers all READ-ONLY tools. This server intentionally exposes no
 * money-moving actions (no order creation, no payouts) — see README §Security.
 */
export function registerTools(server: McpServer, client: TegroClient): void {
  server.registerTool(
    "get_balance",
    {
      description: "Get the balance of all your Tegro.Money wallets (per currency, e.g. RUB/USD).",
      inputSchema: {},
    },
    async () => {
      try {
        return json(await client.call("balance"));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "list_shops",
    {
      description:
        "List your Tegro.Money projects (shops): id, name, url, public key (Shop ID) and status.",
      inputSchema: {},
    },
    async () => {
      try {
        return json(await client.call("shops"));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "list_orders",
    {
      description:
        "List payment orders for a shop. Returns id, amount, currency, status, payment system, email and dates.",
      inputSchema: {
        shop_id: z.string().optional().describe("Shop ID (public key). Optional if TEGRO_SHOP_ID is set."),
        page: z.number().optional().describe("Page number (1-based), for pagination."),
      },
    },
    async ({ shop_id, page }) => {
      try {
        return json(
          await client.call("orders", {
            shop_id: client.resolveShopId(shop_id),
            ...(page ? { page } : {}),
          }),
        );
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_order",
    {
      description: "Get the status and details of a single payment order by its order id.",
      inputSchema: {
        order_id: z.string().describe("The merchant order id (order_id) to look up."),
        shop_id: z.string().optional().describe("Shop ID (public key). Optional if TEGRO_SHOP_ID is set."),
      },
    },
    async ({ order_id, shop_id }) => {
      try {
        return json(await client.call("order", { shop_id: client.resolveShopId(shop_id), order_id }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "list_withdrawals",
    {
      description: "List payout (withdrawal) requests for a shop, with their status and amounts.",
      inputSchema: {
        shop_id: z.string().optional().describe("Shop ID (public key). Optional if TEGRO_SHOP_ID is set."),
        page: z.number().optional().describe("Page number (1-based)."),
      },
    },
    async ({ shop_id, page }) => {
      try {
        return json(
          await client.call("withdrawals", {
            shop_id: client.resolveShopId(shop_id),
            ...(page ? { page } : {}),
          }),
        );
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_withdrawal",
    {
      description: "Get the status and details of a single payout (withdrawal) by its order id.",
      inputSchema: {
        order_id: z.string().describe("The withdrawal/order id to look up."),
        shop_id: z.string().optional().describe("Shop ID (public key). Optional if TEGRO_SHOP_ID is set."),
      },
    },
    async ({ order_id, shop_id }) => {
      try {
        return json(await client.call("withdrawal", { shop_id: client.resolveShopId(shop_id), order_id }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_rates",
    {
      description: "Get the current exchange rate between two currencies (e.g. from RUB to USD).",
      inputSchema: {
        from: z.string().optional().describe('Source currency code, e.g. "RUB".'),
        to: z.string().optional().describe('Target currency code, e.g. "USD".'),
      },
    },
    async ({ from, to }) => {
      try {
        return json(await client.call("rates", { ...(from ? { from } : {}), ...(to ? { to } : {}) }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "list_payment_systems",
    {
      description: "List the payment methods (modules) available for a shop.",
      inputSchema: {
        shop_id: z.string().optional().describe("Shop ID (public key). Optional if TEGRO_SHOP_ID is set."),
      },
    },
    async ({ shop_id }) => {
      try {
        return json(await client.call("modules", { shop_id: client.resolveShopId(shop_id) }));
      } catch (e) {
        return fail(e);
      }
    },
  );
}
