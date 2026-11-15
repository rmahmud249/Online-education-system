import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Sparkles, LoaderCircle, Target, Bell, Flame, Sprout, Zap, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n, toBn } from "@/lib/i18n";
import { catalogQuery, fmtDate } from "@/lib/queries";
import { analyzePracticeResults } from "@/lib/practice-plan.functions";
import { weeklyCompletions, goalProgress, weeklyGoalInput, weeklyStreak, STREAK_BADGES } from "@/lib/practice-progress";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

function usePreferences() {
  const { userId } = useAuth();
  return useQuery({ queryKey: ["practice-preferences", userId], enabled: !!userId, queryFn: async () => {
    if (!userId) throw new Error("Sign in required");
    const { data, error } = await supabase.from("student_practice_preferences").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw error; return data;
  } });
}

export function WeeklyPractice({ rows }: { rows: { status: string; submitted_at: string | null }[] }) {
  const { userId } = useAuth();
  const q = usePreferences();
  const qc = useQueryClient();
  const [goal, setGoal] = useState(3);
  const [now, setNow] = useState<number>();
  const [saving, setSaving] = useState(false);
  useEffect(() => { setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(id); }, []);
  useEffect(() => { if (q.data) setGoal(q.data.weekly_goal); }, [q.data]);
  const completed = now ? weeklyCompletions(rows, now) : 0;
  const savedGoal = q.data?.weekly_goal ?? 3;
  async function save() {
    if (!userId || !weeklyGoalInput.safeParse(goal).success) return toast.error("লক্ষ্য ১–২০টি পরীক্ষা হতে হবে");
    setSaving(true);
    const { error } = await supabase.from("student_practice_preferences").upsert({ user_id: userId, weekly_goal: goal });
    setSaving(false);
    if (error) return toast.error("লক্ষ্য সংরক্ষণ করা যায়নি");
    await qc.invalidateQueries({ queryKey: ["practice-preferences", userId] }); toast.success("সাপ্তাহিক লক্ষ্য সংরক্ষিত");
  }
  return <section className="border-b py-5" aria-label="Weekly practice progress">
    <h2 className="flex items-center gap-2 text-xl font-semibold"><Target className="h-5 w-5 text-success" />এই সপ্তাহের অনুশীলন</h2>
    <div className="mt-4 flex flex-wrap items-end justify-between gap-4"><div><p className="text-3xl font-bold">{now == null || q.isPending ? "—" : `${toBn(completed)} / ${toBn(savedGoal)}`}</p><p className="text-sm text-muted-foreground">সম্পন্ন পরীক্ষা · সোমবার–রবিবার (ঢাকা)</p></div>
      <div className="flex items-end gap-2"><label className="text-sm" htmlFor="weekly-goal">সাপ্তাহিক লক্ষ্য<Input id="weekly-goal" type="number" min={1} max={20} value={goal} className="mt-1 w-24" onChange={(e) => setGoal(Number(e.target.value))} /></label><Button variant="outline" disabled={saving || q.isPending || !!q.error} onClick={save}>সংরক্ষণ</Button></div></div>
    <Progress className="mt-4" value={goalProgress(completed, savedGoal)} aria-label="Weekly goal progress" />
    {now != null && completed >= savedGoal && <p className="mt-2 text-sm text-success">এই সপ্তাহের লক্ষ্য পূরণ হয়েছে!</p>}
    {q.error && <p role="alert" className="mt-2 text-destructive">লক্ষ্য পড়া যায়নি। <Button variant="link" onClick={() => q.refetch()}>আবার চেষ্টা করুন</Button></p>}
  </section>;
}

export function PracticePlan({ results, initialIds = [] }: { results: { id: string; title: string }[]; initialIds?: string[] }) {
  const { userId } = useAuth();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const saved = useQuery({ queryKey: ["practice-plan", userId], enabled: !!userId, queryFn: async () => {
    if (!userId) throw new Error("Sign in required");
    const { data, error } = await supabase.from("practice_plans").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw error; return data;
  } });
  const [ids, setIds] = useState<string[]>(initialIds);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState("");
  const [error, setError] = useState("");
  const analyze = useServerFn(analyzePracticeResults);
  async function submit() {
    setBusy(true); setError("");
    try { const r = await analyze({ data: { attemptIds: ids, language: lang } }); if (r.plan) setPlan(r.plan); setError(r.error ?? ""); await qc.invalidateQueries({ queryKey: ["practice-plan", userId] }); }
    catch { setError("নির্বাচিত প্রকাশিত ফলাফল থেকে পরিকল্পনা তৈরি করা যায়নি।"); }
    finally { setBusy(false); }
  }
  const text = plan || saved.data?.plan;
  return <section className="my-6 border-y py-6">
    <h2 className="flex items-center gap-2 text-xl font-semibold"><Sparkles className="h-5 w-5 text-success" />দুর্বল বিষয় ও অনুশীলন পরিকল্পনা</h2>
    {results.length ? <><fieldset disabled={busy} className="my-4 max-h-64 space-y-3 overflow-auto"><legend className="mb-3 text-sm text-muted-foreground">AI বিশ্লেষণের জন্য ফলাফল নির্বাচন (সর্বোচ্চ ১০টি)</legend>{results.map((r) => <label key={r.id} className="flex items-center gap-3 text-sm"><Checkbox checked={ids.includes(r.id)} disabled={!ids.includes(r.id) && ids.length >= 10} onCheckedChange={(checked) => setIds((p) => checked ? [...p, r.id] : p.filter((id) => id !== r.id))} />{r.title}</label>)}</fieldset>
      <p className="mb-3 text-sm text-muted-foreground">নির্বাচিত পরীক্ষার নম্বর ও প্রশ্নের তথ্য AI-কে পাঠানো হবে। নাম বা ইমেইল পাঠানো হবে না।</p>
      <Button onClick={submit} disabled={busy || !ids.length}>{busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{busy ? "বিশ্লেষণ হচ্ছে…" : "ফলাফল শেয়ার করে পরিকল্পনা তৈরি"}</Button></> : <p className="my-4 text-muted-foreground">প্রকাশিত পরীক্ষার ফলাফল পাওয়ার পর পরিকল্পনা তৈরি করা যাবে।</p>}
    {error && <p role="alert" className="mt-3 text-destructive">{error}</p>}
    {saved.error && <p role="alert" className="mt-3 text-destructive">সংরক্ষিত পরিকল্পনা পড়া যায়নি। <Button variant="link" onClick={() => saved.refetch()}>আবার চেষ্টা করুন</Button></p>}
    {text && <div aria-live="polite" className="mt-6"><p className="mb-3 text-sm text-muted-foreground">সর্বশেষ পরিকল্পনা {saved.data && fmtDate(saved.data.created_at)}</p><div className="whitespace-pre-wrap break-words leading-8">{text}</div><p className="mt-4 text-sm text-muted-foreground">AI-এর বিশ্লেষণ শিক্ষকের মূল্যায়নের বিকল্প নয়।</p><Button asChild variant="outline" className="mt-4"><Link to="/exams">অনুশীলন পরীক্ষা</Link></Button></div>}
  </section>;
}

const badgeIcons = [Sprout, Flame, Zap, Trophy];

export function StreakBadges({ rows }: { rows: { status: string; submitted_at: string | null }[] }) {
  const [now, setNow] = useState<number>();
  useEffect(() => { setNow(Date.now()); }, []);
  const streak = now ? weeklyStreak(rows, now) : 0;
  return (
    <section aria-label="Study streak badges" className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Flame className="h-5 w-5 text-warning" />
        <h2 className="text-xl font-semibold">স্টাডি স্ট্রিক</h2>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold">{toBn(streak)} সপ্তাহ</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">প্রতি সপ্তাহে অন্তত একটি পরীক্ষা সম্পন্ন করলে স্ট্রিক বাড়ে (সোমবার–রবিবার, ঢাকা সময়)।</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STREAK_BADGES.map((b, i) => {
          const earned = streak >= b.weeks;
          const Icon = badgeIcons[i]!;
          return (
            <div key={b.weeks} className={`rounded-2xl border p-4 text-center ${earned ? "border-success bg-success/10" : "opacity-50"}`}>
              <Icon className={`mx-auto h-7 w-7 ${earned ? "text-success" : "text-muted-foreground"}`} />
              <p className="mt-2 font-semibold">{b.bn}</p>
              <p className="text-xs text-muted-foreground">{b.descBn}</p>
              <p className="mt-1 text-xs font-medium">{earned ? "অর্জিত ✓" : `${toBn(b.weeks)} সপ্তাহ প্রয়োজন`}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ExamReminders() {
  const { userId } = useAuth();
  const cat = useQuery(catalogQuery);
  const q = usePreferences();
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["profile", userId], enabled: !!userId, queryFn: async () => {
    if (!userId) throw new Error("Sign in required");
    const { data, error } = await supabase.from("profiles").select("level").eq("id", userId).single(); if (error) throw error; return data;
  } });
  const subjects = useQuery({ queryKey: ["reminder-subjects", userId], enabled: !!userId, queryFn: async () => {
    if (!userId) throw new Error("Sign in required");
    const { data, error } = await supabase.from("exam_reminder_subjects").select("subject_id").eq("user_id", userId); if (error) throw error; return data;
  } });
  const [busy, setBusy] = useState(false);
  async function toggle(enabled: boolean) {
    if (!userId) return;
    if (enabled && (!profile.data?.level || !subjects.data?.length)) return toast.error("প্রোফাইলে শ্রেণি এবং নিচে বিষয় নির্বাচন করুন");
    setBusy(true); const { error } = await supabase.from("student_practice_preferences").upsert({ user_id: userId, reminders_enabled: enabled }); setBusy(false);
    if (error) return toast.error("রিমাইন্ডার সংরক্ষণ করা যায়নি"); await qc.invalidateQueries({ queryKey: ["practice-preferences", userId] });
  }
  async function select(subjectId: string, checked: boolean) {
    if (!userId) return; setBusy(true);
    const response = checked ? await supabase.from("exam_reminder_subjects").insert({ user_id: userId, subject_id: subjectId }) : await supabase.from("exam_reminder_subjects").delete().eq("user_id", userId).eq("subject_id", subjectId);
    setBusy(false); if (response.error) return toast.error("বিষয় সংরক্ষণ করা যায়নি"); await qc.invalidateQueries({ queryKey: ["reminder-subjects", userId] });
  }
  const classId = cat.data?.classes.find((c) => c.level === profile.data?.level)?.id;
  const failed = q.error || subjects.error || cat.error || profile.error;
  return <section className="mb-6 border-b py-5"><div className="flex items-center justify-between gap-4"><h2 className="flex items-center gap-2 text-xl font-semibold"><Bell className="h-5 w-5 text-primary" />পরীক্ষার রিমাইন্ডার</h2><Switch aria-label="Exam reminders" checked={q.data?.reminders_enabled ?? false} disabled={busy || q.isPending || subjects.isPending || !!failed} onCheckedChange={toggle} /></div>
    <p className="mt-2 text-sm text-muted-foreground">নির্বাচিত বিষয় ও প্রোফাইলের শ্রেণির পরীক্ষার আগের ২৪ ঘণ্টায় এখানে নোটিফিকেশন।</p>
    {!profile.data?.level && <p className="mt-3 text-sm text-warning">প্রোফাইলে SSC বা HSC নির্বাচন করুন।</p>}
    <div className="mt-4 grid gap-3 sm:grid-cols-2">{cat.data?.subjects.filter((s) => s.class_id === classId).map((s) => <label key={s.id} className="flex items-center gap-3 text-sm"><Checkbox disabled={busy || subjects.isPending || !!failed} checked={subjects.data?.some((r) => r.subject_id === s.id) ?? false} onCheckedChange={(v) => select(s.id, v === true)} />{s.name_bn}</label>)}</div>
    {failed && <p role="alert" className="mt-3 text-destructive">রিমাইন্ডার সেটিংস পড়া যায়নি। <Button variant="link" onClick={() => { void q.refetch(); void subjects.refetch(); void profile.refetch(); void cat.refetch(); }}>আবার চেষ্টা করুন</Button></p>}
  </section>;
}