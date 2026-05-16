import { z } from "zod";
import { UserError, type FastMCP } from "fastmcp";
import { getClient } from "../lib/meinbuero-client.js";
import { formatApiError } from "../lib/errors.js";

export function registerArticleTools(server: FastMCP): void {
  server.addTool({
    name: "get_articles",
    description: "List articles/products with optional search and pagination.",
    annotations: { readOnlyHint: true },
    parameters: z.object({
      search:   z.string().optional().describe("Search term (name, article number)"),
      page:     z.number().int().positive().optional(),
      pageSize: z.number().int().positive().max(100).optional(),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("get_articles", { page: args.page, pageSize: args.pageSize });
      try {
        const result = await getClient().listArticles(args);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "get_article",
    description: "Get a single article by ID.",
    annotations: { readOnlyHint: true },
    parameters: z.object({
      id: z.string().describe("Article ID"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("get_article", { id: args.id });
      try {
        const result = await getClient().getArticle(args.id);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "create_article",
    description: "Create a new article/product.",
    parameters: z.object({
      name:        z.string().describe("Article name"),
      description: z.string().optional().describe("Article description"),
      unitPrice:   z.number().nonnegative().describe("Unit price in EUR (net)"),
      vatRate:     z.number().nonnegative().describe("VAT rate as percentage (e.g. 19 for 19%)"),
      unit:        z.string().optional().describe("Unit of measure (e.g. Stk, h, kg)"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("create_article", { name: args.name });
      try {
        const result = await getClient().createArticle(args);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "update_article",
    description: "Update an existing article.",
    parameters: z.object({
      id:          z.string().describe("Article ID"),
      name:        z.string().optional().describe("Article name"),
      description: z.string().optional().describe("Article description"),
      unitPrice:   z.number().nonnegative().optional().describe("Unit price in EUR (net)"),
      vatRate:     z.number().nonnegative().optional().describe("VAT rate as percentage"),
      unit:        z.string().optional().describe("Unit of measure"),
    }),
    execute: async ({ id, ...dto }, ctx) => {
      ctx.log.info("update_article", { id });
      try {
        const result = await getClient().updateArticle(id, dto);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });
}
