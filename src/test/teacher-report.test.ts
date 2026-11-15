import { describe, expect, it } from "vitest";
import { buildReport, dhakaWeekStart } from "@/lib/teacher-report";

describe("teacher report", () => {
  it("groups by Dhaka Monday week", () => {
    // Sunday 20:00 UTC = Monday 02:00 Dhaka
    expect(dhakaWeekStart("2026-11-08T20:00:00Z")).toBe("2026-11-09");
  });
  it("counts participation and averages score percentages per student", () => {
    const r = buildReport(
      [
        { id: "a1", student_id: "s1", started_at: "2026-11-09T04:00:00Z", submitted_at: "2026-11-09T05:00:00Z" },
        { id: "a2", student_id: "s1", started_at: "2026-11-10T04:00:00Z", submitted_at: "2026-11-10T05:00:00Z" },
      ],
      [{ attempt_id: "a1", total_score: 8, total_marks: 10 }, { attempt_id: "a2", total_score: 6, total_marks: 10 }],
      [{ id: "s1", full_name: "Rina" }],
    );
    expect(r.students[0]).toMatchObject({ name: "Rina", count: 2, avg: 70 });
    expect(r.weeks).toEqual([{ week: "2026-11-09", count: 2, avg: 70 }]);
  });
});
