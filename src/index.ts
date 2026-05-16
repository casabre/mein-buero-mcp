import { createServer } from "./server.js";

const transport = process.env["TRANSPORT"] ?? "stdio";
const port = parseInt(process.env["PORT"] ?? "3000", 10);

let server;
try {
  server = createServer();
} catch (err) {
  console.error(
    "[meinbuero-mcp] Startup failed:",
    err instanceof Error ? err.message : err,
  );
  process.exit(1);
}

switch (transport) {
  case "http":
  case "sse":
    server.start({ transportType: "httpStream", httpStream: { port } });
    console.error(
      `[meinbuero-mcp] v${process.env["npm_package_version"] ?? "?"} | HTTP on :${port}/mcp | health: /health`,
    );
    break;
  default:
    server.start({ transportType: "stdio" });
    console.error("[meinbuero-mcp] stdio transport ready");
}
