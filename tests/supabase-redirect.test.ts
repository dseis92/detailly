import { describe, expect, it } from "vitest";
import { safeInternalPath } from "@/infrastructure/auth/supabase/redirect";

describe("Supabase callback redirect", () => {
  it("keeps a requested same-site path and query", () => {
    expect(safeInternalPath("/admin?tab=requests#today")).toBe(
      "/admin?tab=requests#today"
    );
  });

  it.each([
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "account"
  ])("rejects an unsafe redirect %s", (path) => {
    expect(safeInternalPath(path)).toBe("/account");
  });

  it("uses the supplied role-aware fallback", () => {
    expect(safeInternalPath(null, "/admin")).toBe("/admin");
  });
});
