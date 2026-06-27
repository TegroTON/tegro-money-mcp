#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { TegroClient } from "./client.js";
import { registerTools } from "./tools.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const client = new TegroClient(config);

  const server = new McpServer({
    name: "tegro-money",
    version: "0.1.0",
  });

  registerTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Logs go to stderr so they never corrupt the stdio JSON-RPC stream on stdout.
  console.error("tegro-money MCP server running (read-only).");
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
