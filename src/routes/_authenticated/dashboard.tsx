import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useMyResults } from "@/lib/my-results";
import { StreakBadges } from "@/components/practice-support";
import { catalogQuery, fmtDate } from "@/lib/queries";
import { toBn } from "@/lib/i18n";
import { Container } from "@/components/page";
import { QueryState, EmptyState } from "@/components/states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Search = { tab?: string | undefined; subject?: string | undefined; exam?: string | undefined; from?: string | undefined; to?: string | undefined; highlight?: string | undefined };

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
    return { tab: str(s['tab']), subject: str(s['subject']), exam: str(s['exam']), from: str(s['from']), to: str(s['to']), highlight: str(s['highlight']) };
  },
  head: () => ({ meta: [{ title: "আমার ড্যাশবোর্ড | Smart Education BD" }, { name: "description", content: "পরীক্ষা, ফলাফল, অগ্রগতি ও নোটিফিকেশন" }, { property: "og:title", content: "ড্যাশবোর্ড" }, { property: "og:description", content: "শিক্ষার্থী ড্যাশবোর্ড" }] }),
  component: Dashboard,
});

function Dashboard() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/dashboard" });
  const tab = search.tab ?? "overview";
  const { userId, isStaff } = useAuth();
  const profile = useQuery({ queryKey: ["profile", userId], queryFn: async () => (await supabase.from("profiles").select("*").eq("id", userId!).single()).data });
  const adminExists = useQuery({ queryKey: ["admin-exists"], queryFn: async () => (await supabase.rpc("admin_exists")).data });
  const qc = useQueryClient();

  return (
    <Container>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">স্বাগতম, {profile.data?.full_name || "শিক্ষার্থী"}</h1>
          <p className="text-muted-foreground">{profile.data?.level?.toUpperCase() ?? "শ্রেণি নির্বাচন করো"}</p>
        </div>
        {adminExists.data === false && !isStaff && (
          <Button variant="outline" onClick={async () => {
            const { data, error } = await supabase.rpc("claim_first_admin");
            if (error || !data) return toast.error(error?.message ?? "ইতিমধ্যে অ্যাডমিন আছে");
            toast.success("আপনি এখন অ্যাডমিন"); qc.invalidateQueries();
          }}>প্রথম অ্যাডমিন হিসেবে সেটআপ করুন</Button>
        )}
      </div>
      <Tabs value={tab} onValueChange={(v) => navigate({ search: (p) => ({ ...p, tab: v }) })} className="mt-6">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="overview">অগ্রগতি</TabsTrigger>
          <TabsTrigger value="results">ফলাফল</TabsTrigger>
          <TabsTrigger value="saved">সংরক্ষিত</TabsTrigger>
          <TabsTrigger value="notifications">নোটিফিকেশন</TabsTrigger>
          <TabsTrigger value="profile">প্রোফাইল</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><Overview /></TabsContent>
        <TabsContent value="results"><Results search={search} /></TabsContent>
        <TabsContent value="saved"><Saved /></TabsContent>
        <TabsContent value="notifications"><Notifications /></TabsContent>
        <TabsContent value="profile"><Profile /></TabsContent>
      </Tabs>
    </Container>
  );
}

function Overview() {
  const q = useMyResults();
  const cat = useQuery(catalogQuery);
  const navigate = useNavigate();
  const recent = useQuery({ queryKey: ["recent-views"], queryFn: async () => (await supabase.from("recent_views").select("viewed_at, study_materials(id,title)").order("viewed_at", { ascending: false }).limit(5)).data ?? [] });
  return (
    <QueryState q={q}>
      {(rows) => {
        const pub = rows.filter((r) => r.pct != null);
        const line = pub.map((r) => ({ name: r.title.slice(0, 18), pct: r.pct, attemptId: r.id, subject: r.subject_id, exam: r.exam_id, date: r.submitted_at }));
        const bySub = Object.values(pub.reduce<Record<string, { name: string; avg: number; n: number; subject: string }>>((acc, r) => {
          const k = r.subject_id ?? "x";
          const s = cat.data?.subjects.find((x) => x.id === k);
          acc[k] ??= { name: s?.name_bn ?? "অন্যান্য", avg: 0, n: 0, subject: k };
          acc[k].avg = (acc[k].avg * acc[k].n + (r.pct ?? 0)) / (acc[k].n + 1); acc[k].n++;
          return acc;
        }, {})).map((x) => ({ ...x, avg: Math.round(x.avg) }));
        const open = (p: { attemptId: string; subject: string | null; exam: string }) =>
          navigate({ to: "/dashboard", search: { tab: "results", subject: p.subject ?? undefined, exam: p.exam, highlight: p.attemptId } });
        return (
          <div className="grid gap-6">
            <StreakBadges rows={rows} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="মোট পরীক্ষা" v={rows.length} /><Stat label="প্রকাশিত ফলাফল" v={pub.length} />
              <Stat label="গড় স্কোর" v={pub.length ? `${Math.round(pub.reduce((s, r) => s + (r.pct ?? 0), 0) / pub.length)}%` : "—"} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border bg-card p-5">
                <h3 className="font-semibold">সময়ের সাথে স্কোর (%) — পয়েন্টে ক্লিক করো</h3>
                {line.length ? <div className="mt-4 h-64"><ResponsiveContainer><LineChart data={line}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis domain={[0, 100]} /><Tooltip />
                  <Line type="monotone" dataKey="pct" stroke="var(--color-primary)" strokeWidth={3}
                    dot={{ r: 6, cursor: "pointer" }}
                    activeDot={{ r: 8, cursor: "pointer", onClick: (_e: unknown, p: unknown) => open((p as { payload: { attemptId: string; subject: string | null; exam: string } }).payload) }} />
                </LineChart></ResponsiveContainer></div> : <EmptyState />}
              </div>
              <div className="rounded-2xl border bg-card p-5">
                <h3 className="font-semibold">বিষয়ভিত্তিক গড় (%)</h3>
                {bySub.length ? <div className="mt-4 h-64"><ResponsiveContainer><BarChart data={bySub}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis domain={[0, 100]} /><Tooltip />
                  <Bar dataKey="avg" fill="var(--color-success)" radius={[6, 6, 0, 0]} cursor="pointer" onClick={(d: { subject?: string }) => navigate({ to: "/dashboard", search: { tab: "results", subject: d.subject } })} />
                </BarChart></ResponsiveContainer></div> : <EmptyState />}
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" asChild><Link to="/history" search={{ subject: undefined }}>সম্পূর্ণ অনুশীলন ইতিহাস →</Link></Button>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <h3 className="font-semibold">সম্প্রতি দেখা</h3>
              <ul className="mt-2 divide-y">{recent.data?.map((r) => { const m = r.study_materials as unknown as { id: string; title: string }; return m && <li key={m.id}><Link to="/materials/$id" params={{ id: m.id }} className="block py-2 hover:text-primary">{m.title}</Link></li>; })}</ul>
              {!recent.data?.length && <p className="text-sm text-muted-foreground">এখনও কিছু দেখা হয়নি।</p>}
            </div>
          </div>
        );
      }}
    </QueryState>
  );
}

function Stat({ label, v }: { label: string; v: number | string }) {
  return <div className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-bold">{toBn(v)}</p></div>;
}

function Results({ search }: { search: Search }) {
  const { userId } = useAuth();
  const navigate = useNavigate({ from: "/dashboard" });
  const q = useMyResults();
  const cat = useQuery(catalogQuery);
  const key = `seb-result-filters-${userId}`;
  const hasUrl = !!(search.subject || search.exam || search.from || search.to);

  // restore remembered filters when arriving without any
  useEffect(() => {
    if (hasUrl) return;
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null");
      if (saved && (saved.subject || saved.exam || saved.from || saved.to)) navigate({ search: (p) => ({ ...p, ...saved }), replace: true });
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (hasUrl) localStorage.setItem(key, JSON.stringify({ subject: search.subject, exam: search.exam, from: search.from, to: search.to }));
  }, [key, hasUrl, search.subject, search.exam, search.from, search.to]);

  const set = (patch: Partial<Search>) => {
    const next = { subject: search.subject, exam: search.exam, from: search.from, to: search.to, ...patch };
    localStorage.setItem(key, JSON.stringify(next));
    navigate({ search: (p) => ({ ...p, ...patch, highlight: undefined }) });
  };
  const sel = "h-10 w-full rounded-md border bg-card px-3 text-sm";

  return (
    <QueryState q={q}>
      {(rows) => {
        const examOpts = Array.from(new Map(rows.filter((r) => !search.subject || r.subject_id === search.subject).map((r) => [r.exam_id, r.title])).entries());
        const list = rows.filter((r) => (!search.subject || r.subject_id === search.subject) && (!search.exam || r.exam_id === search.exam)
          && (!search.from || (r.submitted_at ?? r.started_at) >= search.from) && (!search.to || (r.submitted_at ?? r.started_at).slice(0, 10) <= search.to)).reverse();
        return (
          <div>
            <div className="mb-4 grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-5">
              <div><Label>বিষয়</Label><select className={sel} value={search.subject ?? ""} onChange={(e) => set({ subject: e.target.value || undefined, exam: undefined })}>
                <option value="">সব</option>{Array.from(new Set(rows.map((r) => r.subject_id).filter(Boolean))).map((s) => <option key={s} value={s!}>{cat.data?.subjects.find((x) => x.id === s)?.name_bn}</option>)}</select></div>
              <div><Label>পরীক্ষা</Label><select className={sel} value={search.exam ?? ""} onChange={(e) => set({ exam: e.target.value || undefined })}>
                <option value="">সব</option>{examOpts.map(([id, t]) => <option key={id} value={id}>{t}</option>)}</select></div>
              <div><Label>শুরুর তারিখ</Label><Input type="date" value={search.from ?? ""} onChange={(e) => set({ from: e.target.value || undefined })} /></div>
              <div><Label>শেষ তারিখ</Label><Input type="date" value={search.to ?? ""} onChange={(e) => set({ to: e.target.value || undefined })} /></div>
              <div className="flex items-end"><Button variant="outline" className="w-full" onClick={() => set({ subject: undefined, exam: undefined, from: undefined, to: undefined })}>রিসেট</Button></div>
            </div>
            {list.length === 0 ? <EmptyState /> : (
              <div className="divide-y rounded-2xl border bg-card">
                {list.map((r) => (
                  <div key={r.id} className={`flex flex-wrap items-center gap-3 p-4 ${search.highlight === r.id ? "bg-secondary" : ""}`}>
                    <div className="flex-1"><p className="font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{fmtDate(r.submitted_at ?? r.started_at)}</p></div>
                    <span className="text-sm">{r.status === "in_progress" ? "চলমান" : r.result?.is_published ? `${toBn(Number(r.result.total_score))}/${toBn(Number(r.result.total_marks))}` : "মূল্যায়ন/প্রকাশ বাকি"}</span>
                    {r.status === "in_progress"
                      ? <Button size="sm" asChild><Link to="/exam/$attemptId" params={{ attemptId: r.id }}>চালিয়ে যাও</Link></Button>
                      : <Button size="sm" variant={search.highlight === r.id ? "default" : "outline"} asChild><Link to="/results/$attemptId" params={{ attemptId: r.id }}>বিস্তারিত</Link></Button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }}
    </QueryState>
  );
}

function Saved() {
  const q = useQuery({ queryKey: ["bookmarks"], queryFn: async () => { const { data, error } = await supabase.from("bookmarks").select("material_id, study_materials(id,title)"); if (error) throw error; return data; } });
  return <QueryState q={q} empty={(d) => !d.length}>{(d) => <ul className="divide-y rounded-2xl border bg-card">{d.map((b) => { const m = b.study_materials as unknown as { id: string; title: string }; return <li key={b.material_id}><Link to="/materials/$id" params={{ id: m.id }} className="block p-4 hover:text-primary">{m.title}</Link></li>; })}</ul>}</QueryState>;
}

function Notifications() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["notifications"], queryFn: async () => { const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });
  useEffect(() => {
    if (q.data?.some((n) => !n.is_read)) supabase.from("notifications").update({ is_read: true }).eq("is_read", false).then(() => qc.invalidateQueries({ queryKey: ["unread"] }));
  }, [q.data, qc]);
  return <QueryState q={q} empty={(d) => !d.length}>{(d) => <ul className="divide-y rounded-2xl border bg-card">{d.map((n) => <li key={n.id} className="p-4"><p className="font-medium">{n.title}</p><p className="text-sm text-muted-foreground">{n.body}</p>{n.link && <a href={n.link} className="text-sm text-primary">দেখো →</a>}</li>)}</ul>}</QueryState>;
}

function Profile() {
  const { userId } = useAuth();
  const cat = useQuery(catalogQuery);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["profile", userId], queryFn: async () => (await supabase.from("profiles").select("*").eq("id", userId!).single()).data });
  const [f, setF] = useState({ full_name: "", phone: "", institution: "", level: "", group_id: "" });
  useEffect(() => { if (q.data) setF({ full_name: q.data.full_name, phone: q.data.phone ?? "", institution: q.data.institution ?? "", level: q.data.level ?? "", group_id: q.data.group_id ?? "" }); }, [q.data]);
  const groups = useMemo(() => cat.data?.groups ?? [], [cat.data]);
  async function save() {
    if (f.full_name.trim().length < 2 || f.full_name.length > 100) return toast.error("সঠিক নাম লিখুন");
    if (f.phone && !/^\+?[0-9\- ]{6,20}$/.test(f.phone)) return toast.error("সঠিক ফোন নম্বর দিন");
    const { error } = await supabase.from("profiles").update({ full_name: f.full_name.trim(), phone: f.phone || null, institution: f.institution.slice(0, 200) || null, level: (f.level || null) as "ssc" | "hsc" | null, group_id: f.group_id || null }).eq("id", userId!);
    if (error) return toast.error(error.message);
    toast.success("প্রোফাইল সংরক্ষিত"); qc.invalidateQueries({ queryKey: ["profile"] });
  }
  const sel = "h-10 w-full rounded-md border bg-card px-3 text-sm";
  return (
    <div className="grid max-w-xl gap-4 rounded-2xl border bg-card p-6">
      <div><Label>নাম</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
      <div><Label>ফোন</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
      <div><Label>শিক্ষা প্রতিষ্ঠান</Label><Input value={f.institution} onChange={(e) => setF({ ...f, institution: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>শ্রেণি</Label><select className={sel} value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}><option value="">—</option><option value="ssc">SSC</option><option value="hsc">HSC</option></select></div>
        <div><Label>বিভাগ</Label><select className={sel} value={f.group_id} onChange={(e) => setF({ ...f, group_id: e.target.value })}><option value="">—</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name_bn}</option>)}</select></div>
      </div>
      <Button onClick={save}>সংরক্ষণ</Button>
    </div>
  );
}
