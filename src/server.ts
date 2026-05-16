import { FastMCP } from "fastmcp";
import type { IncomingMessage } from "node:http";
import { getClient }             from "./lib/meinbuero-client.js";
import { registerCustomerTools } from "./tools/customers.js";
import { registerInvoiceTools }  from "./tools/invoices.js";
import { registerArticleTools }  from "./tools/articles.js";
import { registerOrderTools }    from "./tools/orders.js";
import { registerExpenseTools }  from "./tools/expenses.js";
import { registerTodoTools }     from "./tools/todos.js";
import { registerOfferTools }    from "./tools/offers.js";
import { registerResources }     from "./resources/api-info.js";
import { registerPrompts }       from "./prompts/accounting.js";

export function createServer(): FastMCP {
  // Eagerly validate MEINBUERO_OWNERSHIP_ID — fail at startup, not on first tool call
  getClient();

  const mcpApiKey = process.env["MEINBUERO_MCP_API_KEY"];
  const server = new FastMCP({
    name: "meinbuero-mcp",
    version: "1.0.0",
    instructions:
      "MeinBüro API via MCP. Amounts in EUR, dates ISO 8601. " +
      "Kunden=Customers, Rechnungen=Invoices, Artikel=Articles, " +
      "Aufträge=Orders, Ausgaben=Expenses, Angebote=Offers.",
    health: { enabled: true, message: "ok", path: "/health" },
    ...(mcpApiKey
      ? {
          authenticate: async (request: IncomingMessage) => {
            const key = request.headers["x-api-key"];
            const provided = Array.isArray(key) ? key[0] : key;
            if (provided !== mcpApiKey)
              throw new Response(null, { status: 401, statusText: "Unauthorized" });
            return undefined;
          },
        }
      : {}),
  });

  registerCustomerTools(server);
  registerInvoiceTools(server);
  registerArticleTools(server);
  registerOrderTools(server);
  registerExpenseTools(server);
  registerTodoTools(server);
  registerOfferTools(server);
  registerResources(server);
  registerPrompts(server);

  return server;
}
