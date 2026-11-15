import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { catalogQuery, fmtDate } from "@/lib/queries";
import { countdown, dhakaDate } from "@/lib/scheduling";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/page";

const calendarQuery = queryOptions({ queryKey: ["exam-calendar"], queryFn: async () => {
  const { data, error } = await supabase.from("exams").select("*").eq("is_published", true).order("starts_at");
  if (error) throw error; return data;
} });
export const Route = createFileRoute("/exam-calendar")({
  loader: async ({ context }) => { await Promise.all([context.queryClient.ensureQueryData(catalogQuery), context.queryClient.ensureQueryData(calendarQuery)]); },
  head: () => ({ meta: [{ title: "পরীক্ষার ক্যালেন্ডার | Smart Education BD" }, { name: "description", content: "SSC ও HSC পরীক্ষার তারিখ, বিষয় এবং কাউন্টডাউন।" }, { property: "og:title", content: "পরীক্ষার ক্যালেন্ডার | Smart Education BD" }, { property: "og:description", content: "আসন্ন SSC ও HSC পরীক্ষার সময়সূচি।" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: CalendarPage,
});
function CalendarPage() {
  const { lang } = useI18n(); const bn = lang === "bn";
  const { data: cat } = useSuspenseQuery(catalogQuery); const { data: exams } = useSuspenseQuery(calendarQuery);
  const [month, setMonth] = useState(""); const [date, setDate] = useState(""); const [level, setLevel] = useState(""); const [subject, setSubject] = useState(""); const [now, setNow] = useState<number>();
  useEffect(() => { setNow(Date.now()); setMonth(dhakaDate(new Date().toISOString()).slice(0, 7)); const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const filtered = exams.filter((e) => (!level || cat.classes.find((c) => c.id === e.class_id)?.level === level) && (!subject || e.subject_id === subject));
  const dated = filtered.filter((e) => e.starts_at && dhakaDate(e.starts_at).startsWith(month) && (!date || dhakaDate(e.starts_at) === date));
  const [year = 0, m = 0] = month.split("-").map(Number); const count = month ? new Date(Date.UTC(year, m, 0)).getUTCDate() : 0; const offset = month ? new Date(Date.UTC(year, m - 1, 1)).getUTCDay() : 0;
  function shift(delta: number) { const d = new Date(Date.UTC(year, m - 1 + delta, 1)); setMonth(d.toISOString().slice(0, 7)); setDate(""); }
  const selectClass = "h-10 rounded-md border bg-card px-3 text-sm";
  return <Container><h1 className="font-display text-3xl font-bold">{bn ? "পরীক্ষার ক্যালেন্ডার" : "Exam calendar"}</h1>
    <div className="mt-6 flex flex-wrap gap-3"><select aria-label="Class" className={selectClass} value={level} onChange={(e) => { setLevel(e.target.value); setSubject(""); }}><option value="">{bn ? "সব শ্রেণি" : "All classes"}</option><option value="ssc">SSC</option><option value="hsc">HSC</option></select><select aria-label="Subject" className={selectClass} value={subject} onChange={(e) => setSubject(e.target.value)}><option value="">{bn ? "সব বিষয়" : "All subjects"}</option>{cat.subjects.filter((s) => !level || cat.classes.find((c) => c.id === s.class_id)?.level === level).map((s) => <option key={s.id} value={s.id}>{bn ? s.name_bn : s.name_en} · {cat.classes.find((c) => c.id === s.class_id)?.name_en}</option>)}</select><input aria-label="Exam date" type="date" className={selectClass} value={date} onChange={(e) => { setDate(e.target.value); if (e.target.value) setMonth(e.target.value.slice(0, 7)); }} />{date && <Button variant="ghost" onClick={() => setDate("")}>{bn ? "সব তারিখ" : "All dates"}</Button>}</div>
    <div className="mt-6 flex items-center justify-between"><Button variant="outline" size="icon" aria-label="Previous month" disabled={!month} onClick={() => shift(-1)}><ChevronLeft /></Button><h2 className="text-xl font-semibold">{month ? new Date(`${month}-01T00:00:00+06:00`).toLocaleDateString(bn ? "bn-BD" : "en-GB", { timeZone: "Asia/Dhaka", month: "long", year: "numeric" }) : "—"}</h2><Button variant="outline" size="icon" aria-label="Next month" disabled={!month} onClick={() => shift(1)}><ChevronRight /></Button></div>
    <div className="mt-4 grid grid-cols-7 border-l border-t">{(bn ? ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]).map((d) => <div key={d} className="border-b border-r bg-secondary py-2 text-center text-xs font-medium">{d}</div>)}{Array.from({ length: offset }, (_, i) => <div key={`blank${i}`} className="min-h-20 border-b border-r" />)}{Array.from({ length: count }, (_, i) => { const day = `${month}-${String(i + 1).padStart(2, "0")}`; const n = filtered.filter((e) => e.starts_at && dhakaDate(e.starts_at) === day).length; return <Button key={day} variant={date === day ? "secondary" : "ghost"} className="h-20 flex-col rounded-none border-b border-r" onClick={() => setDate(date === day ? "" : day)} aria-label={day}><span>{i + 1}</span>{n > 0 && <span className="text-xs text-primary">{n} {bn ? "পরীক্ষা" : "exams"}</span>}</Button>; })}</div>
    <div className="mt-8 grid gap-4 md:grid-cols-2">{dated.map((e) => { const timer = e.starts_at && now !== undefined ? countdown(e.starts_at, now) : null; const started = !!e.starts_at && now !== undefined && new Date(e.starts_at).getTime() <= now; const ended = !!e.ends_at && now !== undefined && new Date(e.ends_at).getTime() <= now; return <article key={e.id} className="rounded-lg border bg-card p-5"><div className="text-xs text-success">{cat.classes.find((c) => c.id === e.class_id)?.name_en} · {cat.subjects.find((s) => s.id === e.subject_id)?.[bn ? "name_bn" : "name_en"]}</div><h3 className="mt-2 text-lg font-semibold">{e.title}</h3><p className="mt-2 text-sm">{fmtDate(e.starts_at, lang)}</p><p className="mt-3 flex items-center gap-2 text-sm text-primary"><Clock className="h-4 w-4" />{ended ? (bn ? "সমাপ্ত" : "Ended") : started ? (bn ? "চলমান" : "Live") : timer ? `${timer.days}d ${timer.hours}h ${timer.minutes}m ${timer.seconds}s` : "—"}</p><Button asChild variant="outline" className="mt-4"><Link to="/exams">{bn ? "পরীক্ষা দেখুন" : "View exams"}</Link></Button></article>; })}</div>
    {!dated.length && <p className="py-8 text-center text-muted-foreground">{bn ? "এই সময়ে কোনো নির্ধারিত পরীক্ষা নেই।" : "No scheduled exams in this period."}</p>}
    {filtered.some((e) => !e.starts_at) && <section className="mt-8 border-t pt-5"><h2 className="font-semibold">{bn ? "তারিখ ঘোষণা বাকি" : "Date to be announced"}</h2>{filtered.filter((e) => !e.starts_at).map((e) => <p key={e.id} className="mt-2 text-sm">{e.title}</p>)}</section>}
  </Container>;
}