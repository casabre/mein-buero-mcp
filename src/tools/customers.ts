import { z } from "zod";
import { UserError, type FastMCP } from "fastmcp";
import { getClient } from "../lib/meinbuero-client.js";
import { formatApiError } from "../lib/errors.js";

export function registerCustomerTools(server: FastMCP): void {
  server.addTool({
    name: "get_customers",
    description: "List customers with optional search and pagination.",
    annotations: { readOnlyHint: true },
    parameters: z.object({
      search:   z.string().optional().describe("Search term (name, email, company)"),
      page:     z.number().int().positive().optional().describe("Page number (default 1)"),
      pageSize: z.number().int().positive().max(100).optional().describe("Results per page (default 20)"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("get_customers", { page: args.page, pageSize: args.pageSize });
      try {
        const result = await getClient().listCustomers(args);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "get_customer",
    description: "Get a single customer by ID.",
    annotations: { readOnlyHint: true },
    parameters: z.object({
      id: z.string().describe("Customer ID"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("get_customer", { id: args.id });
      try {
        const result = await getClient().getCustomer(args.id);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "create_customer",
    description: "Create a new customer.",
    parameters: z.object({
      companyName: z.string().optional().describe("Company name"),
      firstName:   z.string().optional().describe("First name"),
      lastName:    z.string().optional().describe("Last name"),
      email:       z.string().email().optional().describe("Email address"),
      phone:       z.string().optional().describe("Phone number"),
    }),
    execute: async (args, ctx) => {
      ctx.log.info("create_customer", { companyName: args.companyName });
      try {
        const result = await getClient().createCustomer(args);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });

  server.addTool({
    name: "update_customer",
    description: "Update an existing customer.",
    parameters: z.object({
      id:          z.string().describe("Customer ID"),
      companyName: z.string().optional().describe("Company name"),
      firstName:   z.string().optional().describe("First name"),
      lastName:    z.string().optional().describe("Last name"),
      email:       z.string().email().optional().describe("Email address"),
      phone:       z.string().optional().describe("Phone number"),
    }).refine(
      ({ id: _id, ...fields }) => Object.values(fields).some((v) => v !== undefined),
      { message: "At least one field to update must be provided" },
    ),
    execute: async ({ id, ...dto }, ctx) => {
      ctx.log.info("update_customer", { id });
      try {
        const result = await getClient().updateCustomer(id, dto);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        throw new UserError(formatApiError(err));
      }
    },
  });
}
