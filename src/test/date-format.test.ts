import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { fmtDate } from "@/lib/queries";

describe("display timestamps", () => {
  it("uses the same Dhaka timestamp regardless of the browser time zone", () => {
    const expected = new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka",
    }).format(new Date("2026-11-02T14:04:00Z"));
    expect(fmtDate("2026-11-02T14:04:00Z", "en")).toBe(expected);
    expect(expected).toContain("20:04");
  });

  it("omits missing timestamps", () => {
    expect(fmtDate(null)).toBe("");
    expect(fmtDate(undefined)).toBe("");
  });
});