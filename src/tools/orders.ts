import { z } from "zod";
import { UserError, type FastMCP } from "fastmcp";
import { getClient } from "../lib/meinbuero-client.js";
import { formatApiError } from "../lib/errors.js";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be ISO 8601 (YYYY-MM-DD)");

export function registerOrderTools(server: FastMCP): void {
  server.addTool({
    name: "get_orders",
    description: "List orders with optional search and pagination.",
    annotations: { readOnlyHint: true },
    parameters: z.object({
      search:   z.string().optional().describe("Search term"),
      page:     z.number().int().positive().optional(),
      pageSize: z.number().int().positive().max(100).optional(),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("get_orders", { page: args.page, pageSize: args.pageSize });
      try {
        const result = await getClient().listOrders(args);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "get_order",
    description: "Get a single order by ID.",
    annotations: { readOnlyHint: true },
    parameters: z.object({
      id: z.string().describe("Order ID"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("get_order", { id: args.id });
      try {
        const result = await getClient().getOrder(args.id);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "create_order",
    description: "Create a new order.",
    parameters: z.object({
      customerId:  z.string().optional().describe("Customer ID"),
      orderNumber: z.string().optional().describe("Order number (auto-generated if omitted)"),
      date:        isoDate.optional().describe("Order date (ISO 8601)"),
      status:      z.string().optional().describe("Order status"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("create_order", { customerId: args.customerId });
      try {
        const result = await getClient().createOrder(args);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "create_invoice_from_order",
    description: "Create an invoice from an existing order. Creates a new document — cannot be undone.",
    annotations: { destructiveHint: true },
    parameters: z.object({
      orderId: z.string().describe("Order ID to create the invoice from"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("create_invoice_from_order", { orderId: args.orderId });
      try {
        const result = await getClient().createInvoiceFromOrder(args.orderId);
        return JSON.stringify(result ?? { success: true }, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "create_delivery_note_from_order",
    description: "Create a delivery note (Lieferschein) from an existing order. Creates a new document — cannot be undone.",
    annotations: { destructiveHint: true },
    parameters: z.object({
      orderId: z.string().describe("Order ID to create the delivery note from"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("create_delivery_note_from_order", { orderId: args.orderId });
      try {
        const result = await getClient().createDeliveryNoteFromOrder(args.orderId);
        return JSON.stringify(result ?? { success: true }, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });
}
