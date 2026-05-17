import { z } from "zod";
import { UserError, type FastMCP } from "fastmcp";
import { getClient } from "../lib/meinbuero-client.js";
import { formatApiError } from "../lib/errors.js";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be ISO 8601 (YYYY-MM-DD)");

export function registerTodoTools(server: FastMCP): void {
  server.addTool({
    name: "get_todos",
    description: "List todos with optional search and pagination.",
    annotations: { readOnlyHint: true },
    parameters: z.object({
      search:   z.string().optional().describe("Search term"),
      page:     z.number().int().positive().optional(),
      pageSize: z.number().int().positive().max(100).optional(),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("get_todos", { page: args.page, pageSize: args.pageSize });
      try {
        const result = await getClient().listTodos(args);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "create_todo",
    description: "Create a new todo item.",
    parameters: z.object({
      title:   z.string().describe("Todo title"),
      status:  z.string().optional().describe("Initial status"),
      dueDate: isoDate.optional().describe("Due date (ISO 8601)"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("create_todo", { title: args.title });
      try {
        const result = await getClient().createTodo(args);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "set_todo_status",
    description: "Update the status of a todo item.",
    parameters: z.object({
      id:     z.string().describe("Todo ID"),
      status: z.string().describe("New status value"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("set_todo_status", { id: args.id, status: args.status });
      try {
        const result = await getClient().setTodoStatus(args.id, args.status);
        return JSON.stringify(result ?? { success: true }, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "create_todo_message",
    description: "Add a message/comment to a todo item.",
    parameters: z.object({
      id:      z.string().describe("Todo ID"),
      message: z.string().describe("Message text to add"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("create_todo_message", { id: args.id });
      try {
        const result = await getClient().createTodoMessage(args.id, args.message);
        return JSON.stringify(result ?? { success: true }, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });
}
