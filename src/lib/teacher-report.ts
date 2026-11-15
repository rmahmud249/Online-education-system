import { dhakaDate } from "@/lib/scheduling";

type Attempt = { id: string; student_id: string; started_at: string; submitted_at: string | null };
type Result = { attempt_id: string; total_score: number; total_marks: number };
type Profile = { id: string; full_name: string };

/** Monday (Dhaka) of the week containing the timestamp, as YYYY-MM-DD. */
export function dhakaWeekStart(iso: string) {
  const d = new Date(`${dhakaDate(iso)}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

const pct = (r: Result) => (Number(r.total_marks) > 0 ? (Number(r.total_score) / Number(r.total_marks)) * 100 : 0);
const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

export function buildReport(attempts: Attempt[], results: Result[], profiles: Profile[]) {
  const byAttempt = new Map(results.map((r) => [r.attempt_id, r]));
  const names = new Map(profiles.map((p) => [p.id, p.full_name]));
  const students = new Map<string, { scores: number[]; count: number; last: string }>();
  const weeks = new Map<string, { scores: number[]; count: number }>();
  for (const a of attempts) {
    const at = a.submitted_at ?? a.started_at;
    const r = byAttempt.get(a.id);
    const s = students.get(a.student_id) ?? { scores: [], count: 0, last: at };
    s.count++; if (at > s.last) s.last = at; if (r) s.scores.push(pct(r));
    students.set(a.student_id, s);
    const wk = dhakaWeekStart(at);
    const w = weeks.get(wk) ?? { scores: [], count: 0 };
    w.count++; if (r) w.scores.push(pct(r));
    weeks.set(wk, w);
  }
  const all = [...students.values()].flatMap((s) => s.scores);
  return {
    total: attempts.length,
    avg: mean(all),
    students: [...students.entries()]
      .map(([id, s]) => ({ id, name: names.get(id) || "নামহীন", count: s.count, avg: mean(s.scores), last: s.last }))
      .sort((a, b) => b.count - a.count),
    weeks: [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([week, w]) => ({ week, count: w.count, avg: mean(w.scores) })),
  };
}
