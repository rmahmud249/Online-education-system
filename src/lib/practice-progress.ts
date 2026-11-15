import { z } from "zod";

export const weeklyGoalInput = z.number().int().min(1).max(20);
export const practiceAnalysisInput = z.object({ attemptIds: z.array(z.string().uuid()).min(1).max(10), language: z.enum(["bn", "en"]) });

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

/** Start (UTC ms) of the Dhaka Monday–Sunday week containing `now`. */
export function dhakaWeekStart(now: number) {
  const local = new Date(now + DHAKA_OFFSET_MS);
  const day = local.getUTCDay();
  local.setUTCDate(local.getUTCDate() - (day + 6) % 7);
  local.setUTCHours(0, 0, 0, 0);
  return local.getTime() - DHAKA_OFFSET_MS;
}

export function weeklyCompletions(rows: { submitted_at: string | null; status: string }[], now: number) {
  const start = dhakaWeekStart(now);
  const end = start + WEEK_MS;
  return rows.filter((r) => r.status !== "in_progress" && r.submitted_at && new Date(r.submitted_at).getTime() >= start && new Date(r.submitted_at).getTime() < end && new Date(r.submitted_at).getTime() <= now).length;
}

export function goalProgress(completed: number, goal: number) {
  return Math.min(100, Math.max(0, completed / goal * 100));
}

/** Consecutive Dhaka weeks with at least one completed exam, ending at the current or previous week. */
export function weeklyStreak(rows: { submitted_at: string | null; status: string }[], now: number) {
  const weeks = new Set<number>();
  for (const r of rows) {
    if (r.status === "in_progress" || !r.submitted_at) continue;
    const t = new Date(r.submitted_at).getTime();
    if (t > now) continue;
    weeks.add(dhakaWeekStart(t));
  }
  let cursor = dhakaWeekStart(now);
  if (!weeks.has(cursor)) cursor -= WEEK_MS; // current week still in progress — streak counts through last week
  let streak = 0;
  while (weeks.has(cursor)) { streak++; cursor -= WEEK_MS; }
  return streak;
}

export const STREAK_BADGES = [
  { weeks: 1, bn: "সূচনা", en: "Starter", descBn: "প্রথম সপ্তাহে অনুশীলন সম্পন্ন", descEn: "First week of practice done" },
  { weeks: 4, bn: "ধারাবাহিক", en: "Consistent", descBn: "টানা ৪ সপ্তাহ অনুশীলন", descEn: "4 weeks in a row" },
  { weeks: 8, bn: "অদম্য", en: "Unstoppable", descBn: "টানা ৮ সপ্তাহ অনুশীলন", descEn: "8 weeks in a row" },
  { weeks: 12, bn: "চ্যাম্পিয়ন", en: "Champion", descBn: "টানা ১২ সপ্তাহ অনুশীলন", descEn: "12 weeks in a row" },
] as const;
