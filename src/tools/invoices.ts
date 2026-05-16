import { z } from "zod";
import { UserError, type FastMCP } from "fastmcp";
import { getClient } from "../lib/meinbuero-client.js";
import { formatApiError } from "../lib/errors.js";

export function registerInvoiceTools(server: FastMCP): void {
  server.addTool({
    name: "get_invoices",
    description: "List invoices with optional status filter and pagination.",
    annotations: { readOnlyHint: true },
    parameters: z.object({
      status:   z.enum(["draft", "sent", "paid", "cancelled"]).optional().describe("Filter by status"),
      search:   z.string().optional().describe("Search term"),
      page:     z.number().int().positive().optional(),
      pageSize: z.number().int().positive().max(100).optional(),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("get_invoices", { status: args.status, page: args.page });
      try {
        const result = await getClient().listInvoices(args);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "get_invoice",
    description: "Get a single invoice by ID.",
    annotations: { readOnlyHint: true },
    parameters: z.object({
      id: z.string().describe("Invoice ID"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("get_invoice", { id: args.id });
      try {
        const result = await getClient().getInvoice(args.id);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "get_invoice_pdf",
    description: "Download an invoice as a PDF (returns base64-encoded content).",
    annotations: { readOnlyHint: true },
    parameters: z.object({
      id: z.string().describe("Invoice ID"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("get_invoice_pdf", { id: args.id });
      try {
        const buffer = await getClient().getInvoiceDocument(args.id);
        return JSON.stringify({ base64: buffer.toString("base64"), mimeType: "application/pdf" });
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "create_invoice",
    description: "Create a new invoice draft.",
    parameters: z.object({
      customerId: z.string().describe("Customer ID"),
      date:       z.string().describe("Invoice date (ISO 8601, e.g. 2025-05-16)"),
      dueDate:    z.string().describe("Payment due date (ISO 8601)"),
      positions:  z.array(z.object({
        articleId:   z.string().optional().describe("Article ID (optional)"),
        description: z.string().describe("Line item description"),
        quantity:    z.number().positive().describe("Quantity"),
        unit:        z.string().describe("Unit of measure (e.g. Stk, h, kg)"),
        unitPrice:   z.number().nonnegative().describe("Unit price in EUR (net)"),
        vatRate:     z.number().nonnegative().describe("VAT rate as percentage (e.g. 19)"),
      })).min(1).describe("Invoice line items"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("create_invoice", { customerId: args.customerId, date: args.date });
      try {
        const result = await getClient().createInvoice(args);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "send_invoice",
    description:
      "Send an invoice to the customer by email. IRREVERSIBLE — this sends an actual email.",
    annotations: { destructiveHint: true },
    parameters: z.object({
      id:      z.string().describe("Invoice ID"),
      email:   z.string().email().describe("Recipient email address"),
      subject: z.string().optional().describe("Email subject"),
      message: z.string().optional().describe("Email body message"),
    }),
    execute: async ({ id, ...dto }, ctx) => {
      ctx.log.info("send_invoice", { id });
      try {
        const result = await getClient().sendInvoice(id, dto);
        return JSON.stringify(result ?? { success: true }, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "lock_invoice",
    description:
      "Lock (finalize) an invoice. IRREVERSIBLE — a locked invoice cannot be edited.",
    annotations: { destructiveHint: true },
    parameters: z.object({
      id: z.string().describe("Invoice ID"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("lock_invoice", { id: args.id });
      try {
        const result = await getClient().lockInvoice(args.id);
        return JSON.stringify(result ?? { success: true }, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "add_payment",
    description: "Record a payment against an invoice.",
    parameters: z.object({
      id:     z.string().describe("Invoice ID"),
      amount: z.number().positive().describe("Payment amount in EUR"),
      date:   z.string().describe("Payment date (ISO 8601, e.g. 2025-03-15)"),
      method: z.string().optional().describe("Payment method (e.g. bank_transfer, cash)"),
    }),
    execute: async ({ id, ...dto }, ctx) => {
      ctx.log.info("add_payment", { id, amount: dto.amount });
      try {
        const result = await getClient().addPayment(id, dto);
        return JSON.stringify(result ?? { success: true }, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });
}
