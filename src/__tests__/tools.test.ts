import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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
