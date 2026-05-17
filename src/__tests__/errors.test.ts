import { describe, it, expect } from "vitest";
import { MeinBueroApiError, formatApiError } from "../lib/errors.js";

describe("MeinBueroApiError", () => {
  it("sets name and exposes status", () => {
    const err = new MeinBueroApiError("Not found", 404);
    expect(err.name).toBe("MeinBueroApiError");
    expect(err.status).toBe(404);
    expect(err.message).toBe("Not found");
  });

  it("stores optional detail", () => {
    const err = new MeinBueroApiError("Bad request", 400, { field: "email" });
    expect(err.detail).toEqual({ field: "email" });
  });
});

describe("formatApiError", () => {
  it("formats MeinBueroApiError with status prefix", () => {
    const err = new MeinBueroApiError("Unauthorized", 401);
    expect(formatApiError(err)).toBe("MeinBüro API error 401: Unauthorized");
  });

  it("includes detail when present", () => {
    const err = new MeinBueroApiError("Validation failed", 422, { field: "email", code: "invalid" });
    const result = formatApiError(err);
    expect(result).toContain("MeinBüro API error 422: Validation failed");
    expect(result).toContain('"field":"email"');
  });

  it("omits detail separator when detail is absent", () => {
    const err = new MeinBueroApiError("Not found", 404);
    expect(formatApiError(err)).toBe("MeinBüro API error 404: Not found");
    expect(formatApiError(err)).not.toContain("—");
  });

  it("returns message for generic Error", () => {
    expect(formatApiError(new Error("something went wrong"))).toBe("something went wrong");
  });

  it("stringifies unknown values", () => {
    expect(formatApiError("plain string")).toBe("plain string");
    expect(formatApiError(42)).toBe("42");
  });
});
