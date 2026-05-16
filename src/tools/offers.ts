import { z } from "zod";
import { UserError, type FastMCP } from "fastmcp";
import { getClient } from "../lib/meinbuero-client.js";
import { formatApiError } from "../lib/errors.js";

export function registerOfferTools(server: FastMCP): void {
  server.addTool({
    name: "get_offers",
    description: "List offers/quotes with optional search and pagination.",
    annotations: { readOnlyHint: true },
    parameters: z.object({
      search:   z.string().optional().describe("Search term"),
      page:     z.number().int().positive().optional(),
      pageSize: z.number().int().positive().max(100).optional(),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("get_offers", { page: args.page, pageSize: args.pageSize });
      try {
        const result = await getClient().listOffers(args);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "get_offer",
    description: "Get a single offer/quote by ID.",
    annotations: { readOnlyHint: true },
    parameters: z.object({
      id: z.string().describe("Offer ID"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("get_offer", { id: args.id });
      try {
        const result = await getClient().getOffer(args.id);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });
}
