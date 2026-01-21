#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express, { Request, Response } from "express";
import { DEFAULT_PORT } from "./constants.js";
import { registerCoverageTools } from "./tools/coverage.js";
import { registerRepositoryTools } from "./tools/repository.js";
import { registerComparisonTools } from "./tools/comparison.js";

// Parse command line arguments
function parseArgs(): { transport: "stdio" | "http"; port: number } {
  const args = process.argv.slice(2);
  let transport: "stdio" | "http" = "stdio";
  let port = DEFAULT_PORT;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--transport" || arg === "-t") {
      const value = args[++i];
      if (value === "stdio" || value === "http") {
        transport = value;
      } else {
        console.error(`Invalid transport: ${value}. Use 'stdio' or 'http'.`);
        process.exit(1);
      }
    } else if (arg === "--port" || arg === "-p") {
      const value = parseInt(args[++i], 10);
      if (!isNaN(value) && value > 0 && value < 65536) {
        port = value;
      } else {
        console.error(`Invalid port: ${args[i]}. Use a number between 1-65535.`);
        process.exit(1);
      }
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Codecov MCP Server

Usage: codecov-mcp-server [options]

Options:
  -t, --transport <type>  Transport type: stdio (default) or http
  -p, --port <number>     Port for HTTP transport (default: ${DEFAULT_PORT})
  -h, --help              Show this help message

Environment Variables:
  CODECOV_API_TOKEN       Required. Your Codecov API token.
  PORT                    Alternative way to set the HTTP port.

Examples:
  # Run with stdio transport (for Claude Code)
  CODECOV_API_TOKEN=xxx codecov-mcp-server

  # Run with HTTP transport
  CODECOV_API_TOKEN=xxx codecov-mcp-server --transport http --port 3000
`);
      process.exit(0);
    }
  }

  // Also check PORT environment variable for HTTP transport
  if (transport === "http" && process.env.PORT) {
    const envPort = parseInt(process.env.PORT, 10);
    if (!isNaN(envPort) && envPort > 0 && envPort < 65536) {
      port = envPort;
    }
  }

  return { transport, port };
}

// Create and configure the MCP server
function createServer(): McpServer {
  const server = new McpServer({
    name: "codecov",
    version: "1.0.0",
  });

  // Register all tools
  registerCoverageTools(server);
  registerRepositoryTools(server);
  registerComparisonTools(server);

  return server;
}

// Run with stdio transport
async function runStdio(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Codecov MCP Server running on stdio");
}

// Run with HTTP transport using SSE
async function runHttp(server: McpServer, port: number): Promise<void> {
  const app = express();

  // Store active transports by session ID
  const transports = new Map<string, SSEServerTransport>();

  // SSE endpoint for MCP communication
  app.get("/sse", (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string || crypto.randomUUID();

    console.error(`New SSE connection: ${sessionId}`);

    const transport = new SSEServerTransport("/messages", res);
    transports.set(sessionId, transport);

    // Handle connection close
    res.on("close", () => {
      console.error(`SSE connection closed: ${sessionId}`);
      transports.delete(sessionId);
    });

    // Connect the server to this transport
    server.connect(transport).catch((error) => {
      console.error(`Error connecting transport: ${error}`);
    });
  });

  // Messages endpoint for client-to-server communication
  app.post("/messages", express.json(), (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      res.status(400).json({ error: "sessionId query parameter required" });
      return;
    }

    const transport = transports.get(sessionId);
    if (!transport) {
      res.status(404).json({ error: "Session not found. Connect to /sse first." });
      return;
    }

    // Handle the message
    transport.handlePostMessage(req, res);
  });

  // Health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", server: "codecov-mcp-server", version: "1.0.0" });
  });

  // Start the server
  app.listen(port, () => {
    console.error(`Codecov MCP Server running on http://localhost:${port}`);
    console.error(`  SSE endpoint: http://localhost:${port}/sse`);
    console.error(`  Messages endpoint: http://localhost:${port}/messages`);
    console.error(`  Health check: http://localhost:${port}/health`);
  });
}

// Main entry point
async function main(): Promise<void> {
  // Validate environment
  if (!process.env.CODECOV_API_TOKEN) {
    console.error("Error: CODECOV_API_TOKEN environment variable is required.");
    console.error("Get your token from: https://app.codecov.io/account/access");
    process.exit(1);
  }

  const { transport, port } = parseArgs();
  const server = createServer();

  if (transport === "stdio") {
    await runStdio(server);
  } else {
    await runHttp(server, port);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
