import { z } from "zod";
import { UserError, type FastMCP } from "fastmcp";
import { getClient } from "../lib/meinbuero-client.js";
import { formatApiError } from "../lib/errors.js";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be ISO 8601 (YYYY-MM-DD)");

export function registerExpenseTools(server: FastMCP): void {
  server.addTool({
    name: "get_expenses",
    description: "List expenses with optional search and pagination.",
    annotations: { readOnlyHint: true },
    parameters: z.object({
      search:   z.string().optional().describe("Search term"),
      page:     z.number().int().positive().optional(),
      pageSize: z.number().int().positive().max(100).optional(),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("get_expenses", { page: args.page, pageSize: args.pageSize });
      try {
        const result = await getClient().listExpenses(args);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "get_expense",
    description: "Get a single expense by ID.",
    annotations: { readOnlyHint: true },
    parameters: z.object({
      id: z.string().describe("Expense ID"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("get_expense", { id: args.id });
      try {
        const result = await getClient().getExpense(args.id);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "create_expense",
    description: "Create a new expense entry.",
    parameters: z.object({
      amount:      z.number().positive().describe("Expense amount in EUR"),
      date:        isoDate.describe("Expense date (ISO 8601, e.g. 2025-03-15)"),
      category:    z.string().optional().describe("Expense category"),
      description: z.string().optional().describe("Expense description"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("create_expense", { amount: args.amount, date: args.date });
      try {
        const result = await getClient().createExpense(args);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "update_expense",
    description: "Update an existing expense entry.",
    parameters: z.object({
      id:          z.string().describe("Expense ID"),
      amount:      z.number().positive().optional().describe("Expense amount in EUR"),
      date:        isoDate.optional().describe("Expense date (ISO 8601)"),
      category:    z.string().optional().describe("Expense category"),
      description: z.string().optional().describe("Expense description"),
    }),
    execute: async ({ id, ...dto }, ctx) => {
      ctx.log.info("update_expense", { id });
      try {
        const result = await getClient().updateExpense(id, dto);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "delete_expense",
    description: "Delete an expense entry. IRREVERSIBLE.",
    annotations: { destructiveHint: true },
    parameters: z.object({
      id: z.string().describe("Expense ID to delete"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("delete_expense", { id: args.id });
      try {
        await getClient().deleteExpense(args.id);
        return JSON.stringify({ success: true, id: args.id });
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });
}
