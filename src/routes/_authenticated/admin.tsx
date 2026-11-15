import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Role } from "@/lib/auth";
import { catalogQuery, materialTypeLabel, fmtDate } from "@/lib/queries";
import { buildReport } from "@/lib/teacher-report";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";
import { toBn } from "@/lib/i18n";
import { Container } from "@/components/page";
import { QueryState, LoadingState, EmptyState } from "@/components/states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "অ্যাডমিন ও শিক্ষক প্যানেল | Smart Education BD" }, { name: "description", content: "কনটেন্ট, প্রশ্ন, পরীক্ষা ও ফলাফল ব্যবস্থাপনা" }, { property: "og:title", content: "অ্যাডমিন প্যানেল" }, { property: "og:description", content: "ব্যবস্থাপনা প্যানেল" }] }),
  component: AdminPage,
});

const sel = "h-10 w-full rounded-md border bg-card px-3 text-sm";

function AdminPage() {
  const { ready, isStaff, isAdmin, perms } = useAuth();
  if (!ready) return <LoadingState />;
  if (!isStaff) return <Container><EmptyState title="প্রবেশাধিকার নেই" hint="এই প্যানেল শুধুমাত্র শিক্ষক ও অ্যাডমিনদের জন্য।" /></Container>;
  return (
    <Container>
      <h1 className="font-display text-3xl font-bold">{isAdmin ? "অ্যাডমিন প্যানেল" : "শিক্ষক প্যানেল"}</h1>
      <Tabs defaultValue="stats" className="mt-6">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="stats">পরিসংখ্যান</TabsTrigger>
          <TabsTrigger value="report">শিক্ষার্থী রিপোর্ট</TabsTrigger>
          <TabsTrigger value="grading">CQ মূল্যায়ন</TabsTrigger>
          <TabsTrigger value="questions">প্রশ্ন ব্যাংক</TabsTrigger>
          <TabsTrigger value="materials">ম্যাটেরিয়াল</TabsTrigger>
          {perms.can_create_exams && <TabsTrigger value="exams">পরীক্ষা</TabsTrigger>}
          {isAdmin && <TabsTrigger value="catalog">বিষয় ও অধ্যায়</TabsTrigger>}
          {isAdmin && <TabsTrigger value="notices">নোটিশ</TabsTrigger>}
          {isAdmin && <TabsTrigger value="users">ব্যবহারকারী ও রোল</TabsTrigger>}
          {isAdmin && <TabsTrigger value="messages">বার্তা</TabsTrigger>}
        </TabsList>
        <TabsContent value="stats"><Stats /></TabsContent>
        <TabsContent value="report"><StudentReport /></TabsContent>
        <TabsContent value="grading"><Grading /></TabsContent>
        <TabsContent value="questions"><Questions /></TabsContent>
        <TabsContent value="materials"><Materials /></TabsContent>
        {perms.can_create_exams && <TabsContent value="exams"><Exams /></TabsContent>}
        {isAdmin && <TabsContent value="catalog"><CatalogAdmin /></TabsContent>}
        {isAdmin && <TabsContent value="notices"><Notices /></TabsContent>}
        {isAdmin && <TabsContent value="users"><Users /></TabsContent>}
        {isAdmin && <TabsContent value="messages"><Messages /></TabsContent>}
      </Tabs>
    </Container>
  );
}

function Stats() {
  const q = useQuery({ queryKey: ["admin-stats"], queryFn: async () => { const { data, error } = await supabase.rpc("admin_stats"); if (error) throw error; return data as Record<string, number>; } });
  const labels: Record<string, string> = { students: "শিক্ষার্থী", teachers: "শিক্ষক", materials: "ম্যাটেরিয়াল", questions: "প্রশ্ন", exams: "পরীক্ষা", attempts: "অংশগ্রহণ", pending_cq: "মূল্যায়ন বাকি" };
  return <QueryState q={q}>{(d) => <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">{Object.entries(d).map(([k, v]) => <div key={k} className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">{labels[k] ?? k}</p><p className="text-3xl font-bold">{toBn(v)}</p></div>)}</div>}</QueryState>;
}

function StudentReport() {
  const { userId } = useAuth();
  const q = useQuery({
    queryKey: ["teacher-report", userId],
    queryFn: async () => {
      // Row security limits these rows to exams in the teacher's assigned subjects (all for admins).
      const [{ data: att, error: e1 }, { data: res, error: e2 }] = await Promise.all([
        supabase.from("exam_attempts").select("id,exam_id,student_id,status,started_at,submitted_at,exams(title)").neq("status", "in_progress"),
        supabase.from("results").select("attempt_id,student_id,total_score,total_marks"),
      ]);
      if (e1 || e2) throw e1 ?? e2;
      const ids = [...new Set((att ?? []).map((a) => a.student_id))];
      const { data: profs } = ids.length ? await supabase.from("profiles").select("id,full_name").in("id", ids) : { data: [] };
      return buildReport(att ?? [], res ?? [], profs ?? []);
    },
  });
  return (
    <QueryState q={q} empty={(d) => !d.students.length}>
      {(d) => (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">অংশগ্রহণকারী শিক্ষার্থী</p><p className="text-3xl font-bold">{toBn(d.students.length)}</p></div>
            <div className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">সম্পন্ন পরীক্ষা</p><p className="text-3xl font-bold">{toBn(d.total)}</p></div>
            <div className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">গড় স্কোর</p><p className="text-3xl font-bold">{d.avg == null ? "—" : `${toBn(d.avg)}%`}</p></div>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="font-semibold">সাপ্তাহিক অংশগ্রহণ ও গড় স্কোর</h3>
            <div className="mt-4 h-64"><ResponsiveContainer><ComposedChart data={d.weeks}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="week" fontSize={11} /><YAxis yAxisId="l" allowDecimals={false} /><YAxis yAxisId="r" orientation="right" domain={[0, 100]} /><Tooltip /><Legend />
              <Bar yAxisId="l" dataKey="count" name="সম্পন্ন" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="r" dataKey="avg" name="গড় %" stroke="var(--color-success)" strokeWidth={3} connectNulls />
            </ComposedChart></ResponsiveContainer></div>
          </div>
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left"><tr><th className="p-3">শিক্ষার্থী</th><th className="p-3">সম্পন্ন</th><th className="p-3">গড় স্কোর</th><th className="p-3">সর্বশেষ</th></tr></thead>
              <tbody>{d.students.map((s) => <tr key={s.id} className="border-t"><td className="p-3">{s.name}</td><td className="p-3">{toBn(s.count)}</td><td className="p-3">{s.avg == null ? "মূল্যায়ন বাকি" : `${toBn(s.avg)}%`}</td><td className="p-3">{fmtDate(s.last)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
    </QueryState>
  );
}

function useSubjectOptions() {
  const cat = useQuery(catalogQuery);
  const { isAdmin, userId } = useAuth();
  const mine = useQuery({ queryKey: ["my-subjects", userId], queryFn: async () => (await supabase.from("teacher_subjects").select("subject_id").eq("teacher_id", userId!)).data ?? [] });
  const subs = (cat.data?.subjects ?? []).filter((s) => isAdmin || mine.data?.some((m) => m.subject_id === s.id));
  return { cat: cat.data, subs };
}

function Grading() {
  const { perms } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["grading"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_attempts").select("id,exam_id,status,submitted_at,profiles(full_name),exams(title)").neq("status", "in_progress").order("submitted_at", { ascending: false });
      if (error) throw error;
      const { data: res } = await supabase.from("results").select("attempt_id,is_published,total_score,total_marks");
      return (data ?? []).map((a) => ({ ...a, r: res?.find((x) => x.attempt_id === a.id) }));
    },
  });
  const [open, setOpen] = useState<string | null>(null);
  async function publish(examId: string) {
    const { data, error } = await supabase.rpc("publish_exam_results", { p_exam: examId });
    if (error) return toast.error(error.message);
    toast.success(`${toBn(data ?? 0)}টি ফলাফল প্রকাশিত`); qc.invalidateQueries({ queryKey: ["grading"] });
  }
  return (
    <QueryState q={q} empty={(d) => !d.length}>
      {(rows) => (
        <div className="divide-y rounded-2xl border bg-card">
          {rows.map((a) => (
            <div key={a.id} className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1"><p className="font-medium">{(a.exams as unknown as { title: string })?.title}</p>
                  <p className="text-xs text-muted-foreground">{(a.profiles as unknown as { full_name: string })?.full_name || "শিক্ষার্থী"} · {fmtDate(a.submitted_at)}</p></div>
                <span className="text-sm">{a.status === "submitted" ? "মূল্যায়ন বাকি" : a.r?.is_published ? "প্রকাশিত" : "মূল্যায়িত"} · {toBn(Number(a.r?.total_score ?? 0))}/{toBn(Number(a.r?.total_marks ?? 0))}</span>
                <Button size="sm" variant="outline" onClick={() => setOpen(open === a.id ? null : a.id)}>মূল্যায়ন</Button>
                {perms.can_publish_results && a.status === "evaluated" && !a.r?.is_published && <Button size="sm" onClick={() => publish(a.exam_id)}>প্রকাশ</Button>}
              </div>
              {open === a.id && <GradeAttempt attemptId={a.id} onDone={() => qc.invalidateQueries({ queryKey: ["grading"] })} />}
            </div>
          ))}
        </div>
      )}
    </QueryState>
  );
}

function GradeAttempt({ attemptId, onDone }: { attemptId: string; onDone: () => void }) {
  const q = useQuery({ queryKey: ["review", attemptId], queryFn: async () => { const { data, error } = await supabase.rpc("get_attempt_review", { p_attempt: attemptId }); if (error) throw error; return data as unknown as { questions: { id: string; type: string; body: string; marks: number; answer_id: string | null; answer_text: string | null; awarded_marks: number | null; feedback: string | null }[] }; } });
  const [m, setM] = useState<Record<string, { marks: string; fb: string }>>({});
  async function grade(answerId: string, max: number) {
    const v = m[answerId];
    const n = Number(v?.marks);
    if (!v || Number.isNaN(n) || n < 0 || n > max) return toast.error(`০ থেকে ${toBn(max)} এর মধ্যে নম্বর দিন`);
    const { error } = await supabase.rpc("grade_answer", { p_answer: answerId, p_marks: n, p_feedback: (v.fb ?? "").slice(0, 1000) });
    if (error) return toast.error(error.message);
    toast.success("নম্বর সংরক্ষিত"); q.refetch(); onDone();
  }
  return (
    <QueryState q={q}>
      {(d) => {
        const cqs = d.questions.filter((x) => x.type === "cq");
        if (!cqs.length) return <p className="mt-3 text-sm text-muted-foreground">এই পরীক্ষায় CQ নেই — MCQ স্বয়ংক্রিয়ভাবে মূল্যায়িত।</p>;
        return <div className="mt-4 space-y-4">{cqs.map((x) => (
          <div key={x.id} className="rounded-xl bg-muted p-4">
            <p className="whitespace-pre-line text-sm font-medium">{x.body}</p>
            <p className="mt-2 whitespace-pre-line rounded-lg bg-card p-3 text-sm">{x.answer_text || "উত্তর নেই"}</p>
            {x.answer_id ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-[120px_1fr_auto]">
                <Input type="number" min={0} max={x.marks} placeholder={`/${x.marks}`} defaultValue={x.awarded_marks ?? ""} onChange={(e) => setM({ ...m, [x.answer_id!]: { marks: e.target.value, fb: m[x.answer_id!]?.fb ?? x.feedback ?? "" } })} />
                <Input placeholder="মন্তব্য" defaultValue={x.feedback ?? ""} onChange={(e) => setM({ ...m, [x.answer_id!]: { marks: m[x.answer_id!]?.marks ?? String(x.awarded_marks ?? ""), fb: e.target.value } })} />
                <Button onClick={() => grade(x.answer_id!, x.marks)}>সংরক্ষণ</Button>
              </div>
            ) : <p className="mt-2 text-xs text-muted-foreground">উত্তর জমা দেওয়া হয়নি (০ নম্বর)।</p>}
          </div>
        ))}</div>;
      }}
    </QueryState>
  );
}

function Questions() {
  const { cat, subs } = useSubjectOptions();
  const { userId } = useAuth();
  const [subject, setSubject] = useState("");
  const [f, setF] = useState({ type: "mcq", body: "", marks: "1", explanation: "", chapter_id: "", options: ["", "", "", ""], correct: 0 });
  const list = useQuery({ queryKey: ["qbank", subject], enabled: !!subject, queryFn: async () => (await supabase.from("questions").select("id,type,body,marks").eq("subject_id", subject).order("created_at", { ascending: false })).data ?? [] });
  async function create() {
    if (!subject) return toast.error("বিষয় নির্বাচন করুন");
    if (f.body.trim().length < 3) return toast.error("প্রশ্ন লিখুন");
    const marks = Number(f.marks);
    if (!(marks > 0 && marks <= 100)) return toast.error("সঠিক নম্বর দিন");
    if (f.type === "mcq" && f.options.some((o) => !o.trim())) return toast.error("৪টি অপশন লিখুন");
    const { data, error } = await supabase.from("questions").insert({ subject_id: subject, chapter_id: f.chapter_id || null, type: f.type as "mcq" | "cq", body: f.body.trim(), marks, explanation: f.explanation || null, created_by: userId }).select("id").single();
    if (error) return toast.error(error.message);
    if (f.type === "mcq") {
      const { error: e2 } = await supabase.from("question_options").insert(f.options.map((o, i) => ({ question_id: data.id, option_text: o.trim(), is_correct: i === f.correct, position: i + 1 })));
      if (e2) return toast.error(e2.message);
    }
    toast.success("প্রশ্ন যুক্ত হয়েছে");
    setF({ ...f, body: "", explanation: "", options: ["", "", "", ""], correct: 0 }); list.refetch();
  }
  async function remove(id: string) { const { error } = await supabase.from("questions").delete().eq("id", id); if (error) toast.error(error.message); else list.refetch(); }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border bg-card p-5">
        <h3 className="font-semibold">নতুন প্রশ্ন</h3>
        <select className={sel} value={subject} onChange={(e) => setSubject(e.target.value)}><option value="">বিষয় নির্বাচন</option>{subs.map((s) => <option key={s.id} value={s.id}>{s.name_bn} ({cat?.classes.find((c) => c.id === s.class_id)?.name_en})</option>)}</select>
        {!subs.length && <p className="text-sm text-muted-foreground">আপনাকে এখনও কোনো বিষয় দেওয়া হয়নি। অ্যাডমিনের সাথে যোগাযোগ করুন।</p>}
        <div className="grid grid-cols-3 gap-2">
          <select className={sel} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="mcq">MCQ</option><option value="cq">CQ</option></select>
          <select className={sel} value={f.chapter_id} onChange={(e) => setF({ ...f, chapter_id: e.target.value })}><option value="">অধ্যায়</option>{cat?.chapters.filter((c) => c.subject_id === subject).map((c) => <option key={c.id} value={c.id}>{c.number}. {c.name_bn}</option>)}</select>
          <Input type="number" value={f.marks} onChange={(e) => setF({ ...f, marks: e.target.value })} />
        </div>
        <Textarea placeholder="প্রশ্ন" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
        {f.type === "mcq" && f.options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" checked={f.correct === i} onChange={() => setF({ ...f, correct: i })} aria-label="সঠিক উত্তর" />
            <Input placeholder={`অপশন ${"কখগঘ"[i]}`} value={o} onChange={(e) => { const op = [...f.options]; op[i] = e.target.value; setF({ ...f, options: op }); }} />
          </div>
        ))}
        <Textarea placeholder="ব্যাখ্যা / সমাধান" value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} />
        <Button onClick={create}>যুক্ত করুন</Button>
      </div>
      <div className="rounded-2xl border bg-card p-5">
        <h3 className="font-semibold">প্রশ্নসমূহ</h3>
        {!subject ? <p className="mt-2 text-sm text-muted-foreground">বিষয় নির্বাচন করুন</p> : list.isLoading ? <LoadingState /> : (
          <ul className="mt-2 divide-y">{list.data?.map((x) => <li key={x.id} className="flex items-start gap-2 py-2 text-sm"><span className="rounded bg-secondary px-1.5 text-xs">{x.type.toUpperCase()}</span><span className="flex-1 line-clamp-2">{x.body}</span><Button size="sm" variant="ghost" onClick={() => remove(x.id)}>মুছুন</Button></li>)}</ul>
        )}
      </div>
    </div>
  );
}

function Materials() {
  const { cat, subs } = useSubjectOptions();
  const { userId } = useAuth();
  const [f, setF] = useState({ title: "", description: "", type: "note", subject_id: "", chapter_id: "", content: "", year: "", board: "", allow_download: true });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const list = useQuery({ queryKey: ["admin-materials"], queryFn: async () => (await supabase.from("study_materials").select("id,title,type,is_published,subject_id").order("created_at", { ascending: false }).limit(50)).data ?? [] });
  async function create() {
    if (f.title.trim().length < 3) return toast.error("শিরোনাম লিখুন");
    if (!f.subject_id) return toast.error("বিষয় নির্বাচন করুন");
    if (file && (file.type !== "application/pdf" || file.size > 50 * 1024 * 1024)) return toast.error("শুধু ৫০MB পর্যন্ত PDF");
    setBusy(true);
    let file_path: string | null = null;
    if (file) {
      file_path = `${f.subject_id}/${crypto.randomUUID()}.pdf`;
      const { error } = await supabase.storage.from("materials").upload(file_path, file, { contentType: "application/pdf" });
      if (error) { setBusy(false); return toast.error(error.message); }
    }
    const s = subs.find((x) => x.id === f.subject_id)!;
    const { error } = await supabase.from("study_materials").insert({
      title: f.title.trim(), description: f.description || null, type: f.type as "note", subject_id: f.subject_id, class_id: s.class_id, group_id: s.group_id,
      chapter_id: f.chapter_id || null, content: f.content || null, year: f.year ? Number(f.year) : null, board: f.board || null, allow_download: f.allow_download, file_path, created_by: userId,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("ম্যাটেরিয়াল যুক্ত হয়েছে"); setF({ ...f, title: "", description: "", content: "" }); setFile(null); list.refetch();
  }
  async function togglePub(id: string, v: boolean) { const { error } = await supabase.from("study_materials").update({ is_published: v }).eq("id", id); if (error) toast.error(error.message); else list.refetch(); }
  async function remove(id: string) { const { error } = await supabase.from("study_materials").delete().eq("id", id); if (error) toast.error(error.message); else list.refetch(); }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border bg-card p-5">
        <h3 className="font-semibold">নতুন ম্যাটেরিয়াল / লেসন</h3>
        <Input placeholder="শিরোনাম" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={200} />
        <Input placeholder="সংক্ষিপ্ত বিবরণ" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={300} />
        <div className="grid grid-cols-2 gap-2">
          <select className={sel} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{Object.entries(materialTypeLabel).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}</select>
          <select className={sel} value={f.subject_id} onChange={(e) => setF({ ...f, subject_id: e.target.value, chapter_id: "" })}><option value="">বিষয়</option>{subs.map((s) => <option key={s.id} value={s.id}>{s.name_bn} ({cat?.classes.find((c) => c.id === s.class_id)?.name_en})</option>)}</select>
          <select className={sel} value={f.chapter_id} onChange={(e) => setF({ ...f, chapter_id: e.target.value })}><option value="">অধ্যায়</option>{cat?.chapters.filter((c) => c.subject_id === f.subject_id).map((c) => <option key={c.id} value={c.id}>{c.number}. {c.name_bn}</option>)}</select>
          <Input placeholder="সাল" type="number" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} />
        </div>
        <Textarea rows={6} placeholder="লেসনের বিষয়বস্তু (## দিয়ে শিরোনাম)" value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} />
        <div><Label>PDF (ঐচ্ছিক)</Label><Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
        <label className="flex items-center gap-2 text-sm"><Switch checked={f.allow_download} onCheckedChange={(v) => setF({ ...f, allow_download: v })} /> ডাউনলোড অনুমতি</label>
        <Button onClick={create} disabled={busy}>{busy ? "আপলোড হচ্ছে..." : "যুক্ত করুন"}</Button>
      </div>
      <div className="rounded-2xl border bg-card p-5">
        <h3 className="font-semibold">সাম্প্রতিক ম্যাটেরিয়াল</h3>
        <ul className="mt-2 divide-y">{list.data?.map((m) => (
          <li key={m.id} className="flex items-center gap-2 py-2 text-sm">
            <Link to="/materials/$id" params={{ id: m.id }} className="flex-1 hover:text-primary">{m.title}</Link>
            <Switch checked={m.is_published} onCheckedChange={(v) => togglePub(m.id, v)} aria-label="প্রকাশিত" />
            <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>মুছুন</Button>
          </li>
        ))}</ul>
      </div>
    </div>
  );
}

function Exams() {
  const { cat, subs } = useSubjectOptions();
  const { userId } = useAuth();
  const [f, setF] = useState({ title: "", type: "mcq", scope: "subject", subject_id: "", duration: "20", negative: "0", starts_at: "", ends_at: "" });
  const [picked, setPicked] = useState<string[]>([]);
  const qs = useQuery({ queryKey: ["exam-qbank", f.subject_id], enabled: !!f.subject_id, queryFn: async () => (await supabase.from("questions").select("id,type,body,marks").eq("subject_id", f.subject_id)).data ?? [] });
  const list = useQuery({ queryKey: ["admin-exams"], queryFn: async () => (await supabase.from("exams").select("*").order("created_at", { ascending: false })).data ?? [] });
  async function create() {
    if (f.title.trim().length < 3 || !f.subject_id) return toast.error("শিরোনাম ও বিষয় দিন");
    const dur = Number(f.duration);
    if (!(dur >= 1 && dur <= 600)) return toast.error("সময় ১–৬০০ মিনিট");
    if (!picked.length) return toast.error("অন্তত একটি প্রশ্ন নির্বাচন করুন");
    if (f.starts_at && f.ends_at && f.ends_at <= f.starts_at) return toast.error("শেষ সময় শুরুর পরে হতে হবে");
    const chosen = qs.data!.filter((q) => picked.includes(q.id));
    const total = chosen.reduce((s, q) => s + Number(q.marks), 0);
    const s = subs.find((x) => x.id === f.subject_id)!;
    const { data, error } = await supabase.from("exams").insert({
      title: f.title.trim(), type: f.type as "mcq", scope: f.scope as "subject", subject_id: f.subject_id, class_id: s.class_id, duration_minutes: dur, total_marks: total,
      negative_marking: Number(f.negative) || 0, starts_at: f.starts_at ? new Date(f.starts_at).toISOString() : null, ends_at: f.ends_at ? new Date(f.ends_at).toISOString() : null, created_by: userId,
    }).select("id").single();
    if (error) return toast.error(error.message);
    const { error: e2 } = await supabase.from("exam_questions").insert(chosen.map((q, i) => ({ exam_id: data.id, question_id: q.id, position: i + 1, marks: q.marks })));
    if (e2) return toast.error(e2.message);
    toast.success("পরীক্ষা তৈরি হয়েছে (খসড়া)"); setPicked([]); list.refetch();
  }
  async function pub(id: string, v: boolean) { const { error } = await supabase.from("exams").update({ is_published: v }).eq("id", id); if (error) toast.error(error.message); else list.refetch(); }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border bg-card p-5">
        <h3 className="font-semibold">নতুন পরীক্ষা</h3>
        <Input placeholder="শিরোনাম" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <select className={sel} value={f.subject_id} onChange={(e) => { setF({ ...f, subject_id: e.target.value }); setPicked([]); }}><option value="">বিষয়</option>{subs.map((s) => <option key={s.id} value={s.id}>{s.name_bn} ({cat?.classes.find((c) => c.id === s.class_id)?.name_en})</option>)}</select>
          <select className={sel} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="mcq">MCQ</option><option value="cq">CQ</option><option value="combined">MCQ + CQ</option></select>
          <select className={sel} value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })}><option value="chapter">অধ্যায়ভিত্তিক</option><option value="subject">বিষয়ভিত্তিক</option><option value="model_test">মডেল টেস্ট</option><option value="board">বোর্ড প্রস্তুতি</option></select>
          <div><Label>সময় (মিনিট)</Label><Input type="number" value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} /></div>
          <div><Label>নেগেটিভ মার্ক</Label><Input type="number" step="0.25" value={f.negative} onChange={(e) => setF({ ...f, negative: e.target.value })} /></div>
          <div />
          <div><Label>শুরু</Label><Input type="datetime-local" value={f.starts_at} onChange={(e) => setF({ ...f, starts_at: e.target.value })} /></div>
          <div><Label>শেষ</Label><Input type="datetime-local" value={f.ends_at} onChange={(e) => setF({ ...f, ends_at: e.target.value })} /></div>
        </div>
        <div className="max-h-64 overflow-auto rounded-lg border p-2">
          {qs.data?.filter((q) => f.type === "combined" || q.type === f.type).map((q) => (
            <label key={q.id} className="flex items-start gap-2 py-1 text-sm"><input type="checkbox" checked={picked.includes(q.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, q.id] : picked.filter((x) => x !== q.id))} /><span className="line-clamp-1">[{q.type.toUpperCase()} · {q.marks}] {q.body}</span></label>
          )) ?? <p className="text-sm text-muted-foreground">বিষয় নির্বাচন করুন</p>}
        </div>
        <Button onClick={create}>তৈরি করুন</Button>
      </div>
      <div className="rounded-2xl border bg-card p-5">
        <h3 className="font-semibold">পরীক্ষাসমূহ</h3>
        <ul className="mt-2 divide-y">{list.data?.map((e) => <li key={e.id} className="flex items-center gap-2 py-2 text-sm"><span className="flex-1">{e.title} · {toBn(e.duration_minutes)} মি.</span><Switch checked={e.is_published} onCheckedChange={(v) => pub(e.id, v)} aria-label="প্রকাশিত" /></li>)}</ul>
      </div>
    </div>
  );
}

function CatalogAdmin() {
  const qc = useQueryClient();
  const cat = useQuery(catalogQuery);
  const [s, setS] = useState({ name_bn: "", name_en: "", class_id: "", group_id: "" });
  const [c, setC] = useState({ subject_id: "", number: "1", name_bn: "" });
  async function addSubject() {
    if (s.name_bn.trim().length < 2 || s.name_en.trim().length < 2 || !s.class_id) return toast.error("সব তথ্য দিন");
    const { error } = await supabase.from("subjects").insert({ name_bn: s.name_bn.trim(), name_en: s.name_en.trim(), class_id: s.class_id, group_id: s.group_id || null });
    if (error) return toast.error(error.message);
    toast.success("বিষয় যুক্ত"); qc.invalidateQueries({ queryKey: ["catalog"] });
  }
  async function addChapter() {
    if (!c.subject_id || c.name_bn.trim().length < 2) return toast.error("সব তথ্য দিন");
    const { error } = await supabase.from("chapters").insert({ subject_id: c.subject_id, number: Number(c.number) || 1, name_bn: c.name_bn.trim() });
    if (error) return toast.error(error.message);
    toast.success("অধ্যায় যুক্ত"); qc.invalidateQueries({ queryKey: ["catalog"] });
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border bg-card p-5"><h3 className="font-semibold">নতুন বিষয়</h3>
        <Input placeholder="নাম (বাংলা)" value={s.name_bn} onChange={(e) => setS({ ...s, name_bn: e.target.value })} />
        <Input placeholder="Name (English)" value={s.name_en} onChange={(e) => setS({ ...s, name_en: e.target.value })} />
        <select className={sel} value={s.class_id} onChange={(e) => setS({ ...s, class_id: e.target.value })}><option value="">শ্রেণি</option>{cat.data?.classes.map((x) => <option key={x.id} value={x.id}>{x.name_en}</option>)}</select>
        <select className={sel} value={s.group_id} onChange={(e) => setS({ ...s, group_id: e.target.value })}><option value="">আবশ্যিক</option>{cat.data?.groups.map((x) => <option key={x.id} value={x.id}>{x.name_bn}</option>)}</select>
        <Button onClick={addSubject}>যুক্ত করুন</Button></div>
      <div className="space-y-3 rounded-2xl border bg-card p-5"><h3 className="font-semibold">নতুন অধ্যায়</h3>
        <select className={sel} value={c.subject_id} onChange={(e) => setC({ ...c, subject_id: e.target.value })}><option value="">বিষয়</option>{cat.data?.subjects.map((x) => <option key={x.id} value={x.id}>{x.name_bn} ({cat.data?.classes.find((k) => k.id === x.class_id)?.name_en})</option>)}</select>
        <Input type="number" placeholder="অধ্যায় নং" value={c.number} onChange={(e) => setC({ ...c, number: e.target.value })} />
        <Input placeholder="অধ্যায়ের নাম" value={c.name_bn} onChange={(e) => setC({ ...c, name_bn: e.target.value })} />
        <Button onClick={addChapter}>যুক্ত করুন</Button></div>
    </div>
  );
}

function Notices() {
  const [f, setF] = useState({ title: "", body: "" });
  const list = useQuery({ queryKey: ["admin-notices"], queryFn: async () => (await supabase.from("notices").select("*").order("created_at", { ascending: false })).data ?? [] });
  async function add() {
    if (f.title.trim().length < 3 || f.body.trim().length < 3) return toast.error("শিরোনাম ও বিবরণ লিখুন");
    const { error } = await supabase.from("notices").insert({ title: f.title.trim().slice(0, 200), body: f.body.trim().slice(0, 5000) });
    if (error) return toast.error(error.message);
    toast.success("নোটিশ প্রকাশিত"); setF({ title: "", body: "" }); list.refetch();
  }
  async function remove(id: string) { const { error } = await supabase.from("notices").delete().eq("id", id); if (error) toast.error(error.message); else list.refetch(); }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border bg-card p-5"><Input placeholder="শিরোনাম" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /><Textarea rows={5} placeholder="বিবরণ" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /><Button onClick={add}>প্রকাশ করুন</Button></div>
      <ul className="divide-y rounded-2xl border bg-card">{list.data?.map((n) => <li key={n.id} className="flex items-center gap-2 p-3 text-sm"><span className="flex-1">{n.title}</span><Button size="sm" variant="ghost" onClick={() => remove(n.id)}>মুছুন</Button></li>)}</ul>
    </div>
  );
}

function Users() {
  const cat = useQuery(catalogQuery);
  const q = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [p, r, ts, sp] = await Promise.all([
        supabase.from("profiles").select("id,full_name,email,level").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id,role"),
        supabase.from("teacher_subjects").select("*"),
        supabase.from("staff_permissions").select("*"),
      ]);
      if (p.error) throw p.error;
      return p.data.map((u) => ({ ...u, roles: (r.data ?? []).filter((x) => x.user_id === u.id).map((x) => x.role as Role), subjects: (ts.data ?? []).filter((x) => x.teacher_id === u.id).map((x) => x.subject_id), perm: sp.data?.find((x) => x.user_id === u.id) }));
    },
  });
  const [filter, setFilter] = useState("");
  async function toggleRole(uid: string, role: Role, has: boolean) {
    const { error } = has ? await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role) : await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) return toast.error(error.message);
    q.refetch();
  }
  async function setPerm(uid: string, patch: { can_create_exams?: boolean; can_publish_results?: boolean }, cur?: { can_create_exams: boolean; can_publish_results: boolean }) {
    const { error } = await supabase.from("staff_permissions").upsert({ user_id: uid, can_create_exams: cur?.can_create_exams ?? false, can_publish_results: cur?.can_publish_results ?? false, ...patch });
    if (error) return toast.error(error.message);
    q.refetch();
  }
  async function assign(uid: string, sid: string) {
    if (!sid) return;
    const { error } = await supabase.from("teacher_subjects").insert({ teacher_id: uid, subject_id: sid });
    if (error) return toast.error(error.message);
    q.refetch();
  }
  async function unassign(uid: string, sid: string) { await supabase.from("teacher_subjects").delete().eq("teacher_id", uid).eq("subject_id", sid); q.refetch(); }
  return (
    <div>
      <Input className="mb-4 max-w-sm" placeholder="নাম বা ইমেইল খুঁজুন" value={filter} onChange={(e) => setFilter(e.target.value)} />
      <QueryState q={q} empty={(d) => !d.length}>
        {(users) => (
          <div className="divide-y rounded-2xl border bg-card">
            {users.filter((u) => !filter || `${u.full_name} ${u.email}`.toLowerCase().includes(filter.toLowerCase())).map((u) => (
              <div key={u.id} className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1"><p className="font-medium">{u.full_name || "—"}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                  {(["student", "teacher", "admin"] as Role[]).map((r) => (
                    <label key={r} className="flex items-center gap-1 text-sm"><Switch checked={u.roles.includes(r)} onCheckedChange={() => toggleRole(u.id, r, u.roles.includes(r))} />{r === "student" ? "শিক্ষার্থী" : r === "teacher" ? "শিক্ষক" : "অ্যাডমিন"}</label>
                  ))}
                </div>
                {u.roles.includes("teacher") && (
                  <div className="rounded-xl bg-muted p-3 text-sm">
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-1"><Switch checked={!!u.perm?.can_create_exams} onCheckedChange={(v) => setPerm(u.id, { can_create_exams: v }, u.perm)} />পরীক্ষা তৈরি</label>
                      <label className="flex items-center gap-1"><Switch checked={!!u.perm?.can_publish_results} onCheckedChange={(v) => setPerm(u.id, { can_publish_results: v }, u.perm)} />ফলাফল প্রকাশ</label>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {u.subjects.map((sid) => <button key={sid} onClick={() => unassign(u.id, sid)} className="rounded-full bg-card px-2 py-0.5 text-xs">{cat.data?.subjects.find((s) => s.id === sid)?.name_bn} ✕</button>)}
                      <select className="h-8 rounded-md border bg-card px-2 text-xs" value="" onChange={(e) => assign(u.id, e.target.value)}><option value="">+ বিষয় দিন</option>{cat.data?.subjects.filter((s) => !u.subjects.includes(s.id)).map((s) => <option key={s.id} value={s.id}>{s.name_bn} ({cat.data?.classes.find((c) => c.id === s.class_id)?.name_en})</option>)}</select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}

function Messages() {
  const q = useQuery({ queryKey: ["contact-messages"], queryFn: async () => { const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });
  return <QueryState q={q} empty={(d) => !d.length}>{(d) => <ul className="divide-y rounded-2xl border bg-card">{d.map((m) => <li key={m.id} className="p-4"><p className="font-medium">{m.name} · <span className="text-sm text-muted-foreground">{m.email}</span></p><p className="mt-1 text-sm">{m.message}</p><p className="text-xs text-muted-foreground">{fmtDate(m.created_at)}</p></li>)}</ul>}</QueryState>;
}
