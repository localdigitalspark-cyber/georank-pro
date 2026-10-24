#!/usr/bin/env node
/**
 * GeoRank Pro - MCP CLI Launcher (Stdio Transport)
 * Path: /src/mcp/cli-launcher.ts
 *
 * Runs the GeoRank Pro MCP Server over stdio for local agent integrations:
 * - Claude Desktop (claude_desktop_config.json)
 * - Cursor IDE
 * - Gemini CLI / Local agent runners
 *
 * NOTE: All diagnostic output MUST be directed to stderr (console.error)
 * to keep stdout pristine for JSON-RPC framing.
 */

import dotenv from 'dotenv';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './server.ts';

// Load environment variables (.env)
dotenv.config();

async function main() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();

  // Handle process shutdown cleanly
  process.on('SIGINT', async () => {
    console.error('[georank-pro-mcp] Received SIGINT, shutting down stdio transport...');
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('[georank-pro-mcp] Received SIGTERM, shutting down stdio transport...');
    await server.close();
    process.exit(0);
  });

  await server.connect(transport);
  console.error('[georank-pro-mcp] GeoRank Pro MCP Server running on stdio');
}

main().catch((err) => {
  console.error('[georank-pro-mcp] Fatal error starting MCP server:', err);
  process.exit(1);
});
