import { describe, expect, it } from "vitest";
import { countdown, dhakaDate, dhakaInputToIso } from "@/lib/scheduling";

describe("exam and consultation scheduling", () => {
  it("assigns exams to the Dhaka date across midnight", () => {
    expect(dhakaDate("2026-11-03T20:00:00Z")).toBe("2026-11-04");
  });
  it("counts down every event and never goes negative", () => {
    expect(countdown("2026-11-04T01:02:03Z", Date.parse("2026-11-03T00:00:00Z"))).toEqual({ days: 1, hours: 1, minutes: 2, seconds: 3 });
    expect(countdown("2026-11-02T00:00:00Z", Date.parse("2026-11-03T00:00:00Z"))).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });
  it("interprets office-hour input in Dhaka rather than the browser zone", () => {
    expect(dhakaInputToIso("2026-11-04T15:30")).toBe("2026-11-04T09:30:00.000Z");
  });
});