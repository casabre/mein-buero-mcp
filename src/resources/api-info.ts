import type { FastMCP } from "fastmcp";
import { getClient } from "../lib/meinbuero-client.js";

export function registerResources(server: FastMCP): void {
  server.addResource({
    uri: "meinbuero://api-info",
    name: "MeinBüro API Info",
    mimeType: "text/markdown",
    load: async () => ({
      text: `# MeinBüro API
Base: ${process.env["MEINBUERO_API_BASE_URL"] ?? "https://api.meinbuero.de/openapi"}
Auth: Bearer token via POST /auth/token with ownershipId
Docs: https://api.meinbuero.de/openapi/documentation/

Endpoints: /customer, /invoice, /article, /order, /expense, /offer, /todo
Amounts: EUR. Dates: ISO 8601. VAT: 19% standard / 7% reduced.

Key tools: get_customers, create_customer, get_invoices, get_invoice, create_invoice, send_invoice (destructive), lock_invoice (destructive), add_payment, get_invoice_pdf, get_articles, create_article, get_orders, create_order, create_invoice_from_order, create_delivery_note_from_order, get_expenses, create_expense, delete_expense (destructive), get_todos, create_todo, set_todo_status, get_offers.`,
    }),
  });

  server.addResource({
    uri: "meinbuero://account-settings",
    name: "Account Settings",
    mimeType: "application/json",
    load: async () => ({
      text: JSON.stringify(await getClient().getAccountSettings(), null, 2),
    }),
  });

  server.addResourceTemplate({
    uriTemplate: "meinbuero://invoices/{id}",
    name: "Invoice by ID",
    mimeType: "application/json",
    arguments: [{ name: "id", description: "Invoice ID", required: true }],
    load: async ({ id }) => ({
      text: JSON.stringify(await getClient().getInvoice(id), null, 2),
    }),
  });

  server.addResourceTemplate({
    uriTemplate: "meinbuero://customers/{id}",
    name: "Customer by ID",
    mimeType: "application/json",
    arguments: [{ name: "id", description: "Customer ID", required: true }],
    load: async ({ id }) => ({
      text: JSON.stringify(await getClient().getCustomer(id), null, 2),
    }),
  });
}
