import type { FastMCP } from "fastmcp";

export function registerPrompts(server: FastMCP): void {
  server.addPrompt({
    name: "create_invoice_workflow",
    description: "Step-by-step guide to create and send a MeinBüro invoice.",
    arguments: [
      { name: "customer_name", description: "Customer name or company", required: true },
      { name: "service",       description: "Service or product",       required: true },
      { name: "amount",        description: "Net amount in EUR",         required: true },
      { name: "due_days",      description: "Payment due in X days (default 14)", required: false },
    ],
    load: async (args) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Create a MeinBüro invoice for "${args["customer_name"]}" for "${args["service"]}" (${args["amount"]} EUR net).

Steps:
1. Find or create customer: use get_customers (search "${args["customer_name"]}"); if absent, use create_customer.
2. Find or create article: use get_articles (search "${args["service"]}"); if absent, use create_article with name="${args["service"]}", unitPrice=${args["amount"]}, vatRate=19.
3. Create invoice: use create_invoice with:
   - customerId: <id from step 1>
   - date: today (ISO 8601, e.g. 2025-05-16)
   - dueDate: today + ${args["due_days"] ?? 14} days (ISO 8601)
   - positions: [{ description: "${args["service"]}", quantity: 1, unit: "Stk", unitPrice: ${args["amount"]}, vatRate: 19, articleId: <id from step 2> }]
4. Lock invoice: use lock_invoice with the returned invoice ID (IRREVERSIBLE — confirm with user before calling).
5. Send invoice: use send_invoice with the returned invoice ID and customer email (DESTRUCTIVE — sends actual email; confirm with user first).
6. Confirm: use get_invoice with the returned ID and show the result to the user.`,
          },
        },
      ],
    }),
  });

  server.addPrompt({
    name: "outstanding_invoices_report",
    description: "Summarise unpaid sent invoices and suggest payment reminders (Mahnungen).",
    arguments: [
      { name: "days_overdue", description: "Minimum days overdue (default 0)", required: false },
    ],
    load: async (args) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Generate an outstanding invoices report (minimum ${args["days_overdue"] ?? 0} days overdue).

Steps:
1. get_invoices with status=sent (sent but not paid).
2. Filter: dueDate more than ${args["days_overdue"] ?? 0} days ago.
3. For each overdue invoice: get_customer for contact details.
4. Output table: Invoice # | Customer | Due date | Gross amount | Days overdue.
5. Recommend which need a payment reminder (Mahnung) today.`,
          },
        },
      ],
    }),
  });

  server.addPrompt({
    name: "expense_report",
    description: "Summarise expenses for a date range, grouped by category.",
    arguments: [
      { name: "from_date", description: "Start date ISO 8601 (e.g. 2025-01-01)", required: true },
      { name: "to_date",   description: "End date ISO 8601 (e.g. 2025-03-31)",   required: true },
    ],
    load: async (args) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Generate an expense report from ${args["from_date"]} to ${args["to_date"]}.

Steps:
1. get_expenses (paginate until all loaded).
2. Filter: date between ${args["from_date"]} and ${args["to_date"]}.
3. Group by category; sum amounts per group.
4. Output summary table: Category | Count | Total EUR.
5. Flag any category where total > 20% of period total (potential anomaly).`,
          },
        },
      ],
    }),
  });
}
