import { describe, expect, it } from "vitest";
import { weeklyCompletions, goalProgress, weeklyGoalInput, practiceAnalysisInput, weeklyStreak } from "@/lib/practice-progress";

describe("weekly practice progress", () => {
  it("counts completed exams, not active attempts", () => {
    expect(weeklyCompletions([{ status: "submitted", submitted_at: "2026-11-05T06:00:00Z" }, { status: "in_progress", submitted_at: "2026-11-05T06:00:00Z" }], Date.parse("2026-11-05T07:00:00Z"))).toBe(1);
  });
  it("resets at Monday midnight in Dhaka", () => {
    expect(weeklyCompletions([{ status: "evaluated", submitted_at: "2026-11-01T17:59:59Z" }, { status: "submitted", submitted_at: "2026-11-01T18:00:00Z" }], Date.parse("2026-11-05T07:00:00Z"))).toBe(1);
  });
  it("caps goal progress at completion", () => { expect(goalProgress(4, 3)).toBe(100); expect(goalProgress(1, 4)).toBe(25); });
  it("requires a positive whole weekly goal", () => { expect(weeklyGoalInput.safeParse(0).success).toBe(false); expect(weeklyGoalInput.safeParse(3).success).toBe(true); });
  it("requires selected result ids for analysis", () => { expect(practiceAnalysisInput.safeParse({ attemptIds: [], language: "bn" }).success).toBe(false); });
});

describe("weekly streak", () => {
  const at = (iso: string) => ({ status: "submitted", submitted_at: iso });
  const now = Date.parse("2026-11-05T07:00:00Z"); // Thursday; Dhaka week started Mon 2026-11-01T18:00Z
  it("counts consecutive weeks with a completed exam", () => {
    expect(weeklyStreak([at("2026-11-03T06:00:00Z"), at("2026-10-28T06:00:00Z")], now)).toBe(2);
  });
  it("keeps the streak when the current week has no exam yet", () => {
    expect(weeklyStreak([at("2026-10-28T06:00:00Z")], now)).toBe(1);
  });
  it("breaks on a missed week", () => {
    expect(weeklyStreak([at("2026-11-03T06:00:00Z"), at("2026-10-20T06:00:00Z")], now)).toBe(1);
  });
  it("ignores in-progress attempts", () => {
    expect(weeklyStreak([{ status: "in_progress", submitted_at: "2026-11-03T06:00:00Z" }], now)).toBe(0);
  });
});