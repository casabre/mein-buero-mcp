import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";

vi.mock("axios");

describe("MeinBueroClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws on missing MEINBUERO_OWNERSHIP_ID", async () => {
    delete process.env["MEINBUERO_OWNERSHIP_ID"];
    const { MeinBueroClient } = await import("../lib/meinbuero-client.js");
    expect(() => new MeinBueroClient()).toThrow("MEINBUERO_OWNERSHIP_ID");
  });

  it("deduplicates concurrent auth calls (promise-lock)", async () => {
    process.env["MEINBUERO_OWNERSHIP_ID"] = "test-id";

    const mockInterceptors = {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    };
    const postSpy = vi.spyOn(axios, "post").mockResolvedValue({ data: { token: "tok" } });
    vi.spyOn(axios, "create").mockReturnValue({
      interceptors: mockInterceptors,
    } as unknown as ReturnType<typeof axios.create>);

    const { MeinBueroClient } = await import("../lib/meinbuero-client.js");
    const client = new MeinBueroClient();

    type ClientInternal = { ensureAuthenticated(): Promise<void> };
    const internal = client as unknown as ClientInternal;

    await Promise.all([internal.ensureAuthenticated(), internal.ensureAuthenticated()]);

    expect(postSpy).toHaveBeenCalledTimes(1);
  });
});
