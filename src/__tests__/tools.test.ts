import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { UserError } from "fastmcp";

describe("Tool registration smoke tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, MEINBUERO_OWNERSHIP_ID: "test-id" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("createServer registers all tools without throwing", async () => {
    const { createServer } = await import("../server.js");
    expect(() => createServer()).not.toThrow();
  });

  it("createServer fails without MEINBUERO_OWNERSHIP_ID", async () => {
    delete process.env["MEINBUERO_OWNERSHIP_ID"];
    const { createServer } = await import("../server.js");
    expect(() => createServer()).toThrow("MEINBUERO_OWNERSHIP_ID");
  });
});

describe("Customer tool execute handlers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, MEINBUERO_OWNERSHIP_ID: "test-id" };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("get_customers returns JSON of paged result", async () => {
    const mockResult = { data: [{ id: "1", companyName: "Acme" }], totalCount: 1 };
    vi.doMock("../lib/meinbuero-client.js", () => ({
      getClient: () => ({ listCustomers: vi.fn().mockResolvedValue(mockResult) }),
    }));
    const { registerCustomerTools } = await import("../tools/customers.js");
    const tools: Record<string, { execute: (args: unknown, ctx: unknown) => Promise<string> }> = {};
    const fakeServer = { addTool: (t: { name: string; execute: (args: unknown, ctx: unknown) => Promise<string> }) => { tools[t.name] = t; } };
    registerCustomerTools(fakeServer as never);
    const ctx = { log: { info: vi.fn() } };
    const result = JSON.parse(await tools["get_customers"]!.execute({}, ctx));
    expect(result.data[0].companyName).toBe("Acme");
  });

  it("get_customers wraps API errors as UserError", async () => {
    vi.doMock("../lib/meinbuero-client.js", () => ({
      getClient: () => ({ listCustomers: vi.fn().mockRejectedValue(new Error("network error")) }),
    }));
    const { registerCustomerTools } = await import("../tools/customers.js");
    const tools: Record<string, { execute: (args: unknown, ctx: unknown) => Promise<string> }> = {};
    const fakeServer = { addTool: (t: { name: string; execute: (args: unknown, ctx: unknown) => Promise<string> }) => { tools[t.name] = t; } };
    registerCustomerTools(fakeServer as never);
    const ctx = { log: { info: vi.fn() } };
    await expect(tools["get_customers"]!.execute({}, ctx)).rejects.toBeInstanceOf(UserError);
  });
});

describe("Invoice tool execute handlers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, MEINBUERO_OWNERSHIP_ID: "test-id" };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("get_invoice_pdf rejects oversized PDFs as UserError", async () => {
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024);
    vi.doMock("../lib/meinbuero-client.js", () => ({
      getClient: () => ({ getInvoiceDocument: vi.fn().mockResolvedValue(bigBuffer) }),
    }));
    const { registerInvoiceTools } = await import("../tools/invoices.js");
    const tools: Record<string, { execute: (args: unknown, ctx: unknown) => Promise<string> }> = {};
    const fakeServer = { addTool: (t: { name: string; execute: (args: unknown, ctx: unknown) => Promise<string> }) => { tools[t.name] = t; } };
    registerInvoiceTools(fakeServer as never);
    const ctx = { log: { info: vi.fn() } };
    await expect(tools["get_invoice_pdf"]!.execute({ id: "inv-1" }, ctx)).rejects.toBeInstanceOf(UserError);
  });

  it("get_invoice_pdf returns base64 and sizeBytes for valid PDF", async () => {
    const smallBuffer = Buffer.from("PDF content");
    vi.doMock("../lib/meinbuero-client.js", () => ({
      getClient: () => ({ getInvoiceDocument: vi.fn().mockResolvedValue(smallBuffer) }),
    }));
    const { registerInvoiceTools } = await import("../tools/invoices.js");
    const tools: Record<string, { execute: (args: unknown, ctx: unknown) => Promise<string> }> = {};
    const fakeServer = { addTool: (t: { name: string; execute: (args: unknown, ctx: unknown) => Promise<string> }) => { tools[t.name] = t; } };
    registerInvoiceTools(fakeServer as never);
    const ctx = { log: { info: vi.fn() } };
    const result = JSON.parse(await tools["get_invoice_pdf"]!.execute({ id: "inv-1" }, ctx));
    expect(result.mimeType).toBe("application/pdf");
    expect(result.sizeBytes).toBe(smallBuffer.length);
    expect(typeof result.base64).toBe("string");
  });
});

describe("Expense tool execute handlers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, MEINBUERO_OWNERSHIP_ID: "test-id" };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("delete_expense returns success", async () => {
    vi.doMock("../lib/meinbuero-client.js", () => ({
      getClient: () => ({ deleteExpense: vi.fn().mockResolvedValue(undefined) }),
    }));
    const { registerExpenseTools } = await import("../tools/expenses.js");
    const tools: Record<string, { execute: (args: unknown, ctx: unknown) => Promise<string> }> = {};
    const fakeServer = { addTool: (t: { name: string; execute: (args: unknown, ctx: unknown) => Promise<string> }) => { tools[t.name] = t; } };
    registerExpenseTools(fakeServer as never);
    const ctx = { log: { info: vi.fn() } };
    const result = JSON.parse(await tools["delete_expense"]!.execute({ id: "exp-1" }, ctx));
    expect(result.success).toBe(true);
    expect(result.id).toBe("exp-1");
  });

  it("delete_expense wraps API errors as UserError", async () => {
    vi.doMock("../lib/meinbuero-client.js", () => ({
      getClient: () => ({ deleteExpense: vi.fn().mockRejectedValue(new Error("not found")) }),
    }));
    const { registerExpenseTools } = await import("../tools/expenses.js");
    const tools: Record<string, { execute: (args: unknown, ctx: unknown) => Promise<string> }> = {};
    const fakeServer = { addTool: (t: { name: string; execute: (args: unknown, ctx: unknown) => Promise<string> }) => { tools[t.name] = t; } };
    registerExpenseTools(fakeServer as never);
    const ctx = { log: { info: vi.fn() } };
    await expect(tools["delete_expense"]!.execute({ id: "exp-1" }, ctx)).rejects.toBeInstanceOf(UserError);
  });
});
