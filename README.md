# mein-buero-mcp

MCP server for the [Buhl MeinBüro](https://www.buhl.de/mein-buero/) accounting API. Exposes customers, invoices, articles, orders, expenses, todos, and offers as MCP tools, resources, and prompts — ready for Claude Desktop, any MCP client, or Kubernetes.

## Quick start

### Get your ownershipId

1. Log into MeinBüro → Marketplace → create or open an extension
2. Click **"Erweiterung testen"** — the callback URL contains `?iid=<ownershipId>`
3. Copy that value as `MEINBUERO_OWNERSHIP_ID`

### Claude Desktop (stdio)

```json
{
  "mcpServers": {
    "meinbuero": {
      "command": "node",
      "args": ["/absolute/path/to/mein-buero-mcp/dist/index.js"],
      "env": { "MEINBUERO_OWNERSHIP_ID": "your_ownership_id_here" }
    }
  }
}
```

Config file location: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Pre-built binary

Download from [Releases](../../releases/latest):

```bash
# macOS Apple Silicon
chmod +x v1.0.0-mein-buero-mcp-macos-arm64
MEINBUERO_OWNERSHIP_ID=xxx ./v1.0.0-mein-buero-mcp-macos-arm64
```

Claude Desktop config with binary:

```json
{
  "mcpServers": {
    "meinbuero": {
      "command": "/path/to/v1.0.0-mein-buero-mcp-macos-arm64",
      "env": { "MEINBUERO_OWNERSHIP_ID": "your_ownership_id_here" }
    }
  }
}
```

### Docker

```bash
docker run -e MEINBUERO_OWNERSHIP_ID=xxx -p 3000:3000 \
  ghcr.io/YOUR_GITHUB_USERNAME/mein-buero-mcp:latest
```

### Helm

```bash
helm install mcp helm/mein-buero-mcp \
  --set secrets.ownershipId=your_ownership_id_here \
  --set image.repository=ghcr.io/YOUR_GITHUB_USERNAME/mein-buero-mcp
```

## Transport modes

| `TRANSPORT` | Use case |
|-------------|----------|
| `stdio` (default) | Claude Desktop, local CLI |
| `http` or `sse` | Web clients, Kubernetes, Docker |

HTTP transport starts on port `3000` (configurable via `PORT`). The MCP endpoint is `/mcp` and health check is `/health`.

## Available tools

| Category | Tools |
|----------|-------|
| Customers | `get_customers`, `get_customer`, `create_customer`, `update_customer` |
| Invoices | `get_invoices`, `get_invoice`, `get_invoice_pdf`, `create_invoice`, `send_invoice`*, `lock_invoice`*, `add_payment` |
| Articles | `get_articles`, `get_article`, `create_article`, `update_article` |
| Orders | `get_orders`, `get_order`, `create_order`, `create_invoice_from_order`, `create_delivery_note_from_order` |
| Expenses | `get_expenses`, `get_expense`, `create_expense`, `update_expense`, `delete_expense`* |
| Todos | `get_todos`, `create_todo`, `set_todo_status`, `create_todo_message` |
| Offers | `get_offers`, `get_offer` |

\* Marked `destructiveHint: true` — irreversible actions (sends email / deletes data).

## Prompts

- `create_invoice_workflow` — step-by-step invoice creation and sending
- `outstanding_invoices_report` — overdue invoices summary with Mahnung suggestions
- `expense_report` — expense summary grouped by category for a date range

## Development

```bash
npm install
cp .env.example .env   # fill in MEINBUERO_OWNERSHIP_ID

npm run dev            # FastMCP dev server with hot reload
npm test               # run tests
npm run lint           # ESLint
npm run type-check     # TypeScript compiler check
npm run build          # compile to dist/
```

Test with MCP Inspector:

```bash
MEINBUERO_OWNERSHIP_ID=xxx npx @modelcontextprotocol/inspector node dist/index.js
```

## Authentication flow

```
Developer registers → API key + API secret
Creates extension → clicks "Erweiterung testen"
Callback URL: ?iid=<ownershipId>
Server: POST /auth/token { ownershipId } → bearer token
All requests: Authorization: Bearer <token>
On 401: auto-refresh token (promise-lock prevents storms)
```

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MEINBUERO_OWNERSHIP_ID` | Yes | — | ownershipId from MeinBüro Marketplace |
| `MEINBUERO_API_BASE_URL` | No | `https://api.meinbuero.de/openapi` | API base URL |
| `TRANSPORT` | No | `stdio` | Transport: `stdio`, `http`, or `sse` |
| `PORT` | No | `3000` | HTTP port (ignored for stdio) |
| `MEINBUERO_MCP_API_KEY` | No | — | Optional x-api-key guard on the MCP server |

## Building a binary

```bash
bash .github/scripts/build-binary.sh v1.0.0-mein-buero-mcp-macos-arm64
```

## License

See [LICENSE](LICENSE).
