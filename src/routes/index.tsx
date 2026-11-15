import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Search,
  BookOpenCheck,
  Timer,
  Trophy,
  FileQuestion,
  Atom,
  Briefcase,
  Landmark,
  Megaphone,
  ArrowRight,
  BookOpen,
  Languages,
  Calculator,
  FlaskConical,
  Dna,
  ChartNoAxesCombined,
  Laptop,
  CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, toBn } from "@/lib/i18n";
import { catalogQuery, fmtDate } from "@/lib/queries";
import { MaterialCard, ExamCard } from "@/components/cards";
import { EmptyState } from "@/components/states";

const notesQuery = queryOptions({
  queryKey: ["home-notes"],
  queryFn: async () => {
    const { data, error } = await supabase.from("study_materials").select("id,title,description,type,views,year,subject_id").order("created_at", { ascending: false }).limit(6);
    if (error) throw error;
    return data;
},
});
const examsQuery = queryOptions({
  queryKey: ["home-exams"],
  queryFn: async () => {
    const { data, error } = await supabase.from("exams").select("*").eq("is_published", true).order("starts_at").limit(3);
    if (error) throw error;
    return data;
},
});
const noticesQuery = queryOptions({
  queryKey: ["home-notices"],
  queryFn: async () => (await supabase.from("notices").select("*").order("created_at", { ascending: false }).limit(4)).data ?? [],
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Education BD — এসএসসি ও এইচএসসি অনলাইন প্রস্তুতি" },
      { name: "description", content: "অধ্যায়ভিত্তিক নোট, বোর্ড প্রশ্ন, সাজেশন ও লাইভ MCQ/CQ পরীক্ষা — বাংলাদেশের SSC ও HSC শিক্ষার্থীদের জন্য।" },
      { property: "og:title", content: "Smart Education BD" },
      { property: "og:description", content: "SSC ও HSC শিক্ষার্থীদের জন্য সম্পূর্ণ অনলাইন শিক্ষা প্ল্যাটফর্ম।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(catalogQuery),
      context.queryClient.ensureQueryData(notesQuery),
      context.queryClient.ensureQueryData(examsQuery),
      context.queryClient.ensureQueryData(noticesQuery),
    ]);
  },
  component: Home,
});

const groupIcon: Record<string, typeof Atom> = { science: Atom, business: Briefcase, humanities: Landmark };
const subjectIcons: Record<string, typeof Atom> = {
  bangla: Languages,
  english: Languages,
  math: Calculator,
  physics: Atom,
  chemistry: FlaskConical,
  biology: Dna,
  accounting: ChartNoAxesCombined,
  history: Landmark,
  ict: Laptop,
  economics: CircleDollarSign,
};
const classColors: Record<string, string> = {
  ssc: "#d8f3dc",
  hsc: "#dbeafe",
};
const subjectColors = [
  "#cfe8ff",
  "#d8f3dc",
  "#fff0b3",
  "#ffd6e7",
  "#e9d5ff",
  "#d9f0ff",
];
const noteColors = [
  "#e0f2fe",
  "#dcfce7",
  "#fef3c7",
  "#fce7f3",
  "#ede9fe",
  "#e0f2fe",
];

function getSubjectIcon(name: string) {
  const normalizedName = name.toLowerCase();
  const match = Object.keys(subjectIcons).find((key) => normalizedName.includes(key));
  return match ? subjectIcons[match] : BookOpen;
}

function Home() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const cat = useSuspenseQuery(catalogQuery);
  const notes = useSuspenseQuery(notesQuery);
  const exams = useSuspenseQuery(examsQuery);
  const notices = useSuspenseQuery(noticesQuery);
  const subjName = (id: string | null) => {
    const s = cat.data?.subjects.find((x) => x.id === id);
    return s ? (lang === "bn" ? s.name_bn : s.name_en) : "";
  };

  return (
    <>
      <section className="relative overflow-hidden bg-hero text-navy-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="inline-flex rounded-full bg-navy-foreground/10 px-3 py-1 text-xs font-medium">SSC • HSC • {lang === "bn" ? "বিজ্ঞান • ব্যবসায় • মানবিক" : "Science • Business • Humanities"}</span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight md:text-5xl">{t("heroTitle")}</h1>
            <p className="mt-4 max-w-xl text-lg opacity-85">{t("heroSub")}</p>
            <form className="mt-8 flex max-w-xl gap-2 rounded-2xl bg-card p-2 shadow-card"
              onSubmit={(e) => { e.preventDefault(); navigate({ to: "/materials", search: { q: q.trim() } }); }}>
              <Search className="ml-2 mt-2.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} className="border-0 text-foreground shadow-none focus-visible:ring-0" maxLength={100} />
              <Button type="submit">{t("search")}</Button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary"><Link to="/catalog">{t("startLearning")}</Link></Button>
              <Button asChild size="lg" className="bg-success text-success-foreground hover:bg-success/90"><Link to="/exams">{t("takeExam")}</Link></Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 self-center">
            {[
              { icon: BookOpenCheck, n: "৫০০+", l: lang === "bn" ? "অধ্যায়ভিত্তিক নোট" : "Chapter notes" },
              { icon: FileQuestion, n: "১০ বোর্ড", l: lang === "bn" ? "বোর্ড প্রশ্ন ও সমাধান" : "Board questions" },
              { icon: Timer, n: "লাইভ", l: lang === "bn" ? "MCQ ও CQ পরীক্ষা" : "MCQ & CQ exams" },
              { icon: Trophy, n: "র‍্যাংক", l: lang === "bn" ? "লিডারবোর্ড" : "Leaderboard" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-navy-foreground/10 p-5 backdrop-blur">
                <s.icon className="h-6 w-6" />
                <div className="mt-3 text-2xl font-bold">{s.n}</div>
                <div className="text-sm opacity-80">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-6 md:grid-cols-2">
          {(cat.data?.classes ?? []).map((c) => (
            <Link key={c.id} to="/catalog/$level" params={{ level: c.level }}
              className="group rounded-3xl border p-7 shadow-card transition hover:-translate-y-1 hover:border-primary/40"
              style={{ backgroundColor: classColors[c.level] ?? "var(--color-card)" }}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl font-bold text-navy dark:text-foreground">{lang === "bn" ? c.name_bn : c.name_en}</h2>
                <ArrowRight className="h-6 w-6 text-primary transition group-hover:translate-x-1" />
              </div>
              <p className="mt-1 text-muted-foreground">{toBn(cat.data.subjects.filter((s) => s.class_id === c.id).length, lang)} {t("subjects")}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {cat.data.groups.map((g) => {
                  const Icon = groupIcon[g.slug] ?? Atom;
                  return <span key={g.id} className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground"><Icon className="h-4 w-4" />{lang === "bn" ? g.name_bn : g.name_en}</span>;
                })}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4"><div className="rounded-3xl bg-muted/70 p-6 md:p-8 text-foreground">
        <SectionTitle title={t("popularSubjects")} to="/catalog" />
        {(
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {cat.data?.subjects.slice(0, 12).map((s, index) => {
              const Icon = getSubjectIcon(s.name_en);
              return (
                <Link
                  key={s.id}
                  to="/subjects/$id"
                  params={{ id: s.id }}
                  className="rounded-xl border p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:text-primary"
                  style={{ backgroundColor: subjectColors[index % subjectColors.length], borderColor: "transparent" }}
                >
                  <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-primary shadow-sm dark:bg-background/70">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div className="text-sm font-semibold">{lang === "bn" ? s.name_bn : s.name_en}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{cat.data.classes.find((c) => c.id === s.class_id)?.name_en}</div>
                </Link>
              );
            })}
          </div>
        )}
      </div></section>

      <section className="mx-auto mt-14 max-w-7xl px-4"><div className="rounded-3xl p-6 md:p-8 bg-panel-notes text-foreground">
        <SectionTitle title={t("latestNotes")} to="/materials" />
        {notes.data?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{notes.data.map((m, index) => <MaterialCard key={m.id} m={m} subject={subjName(m.subject_id)} backgroundColor={noteColors[index % noteColors.length]} />)}</div>
        ) : <EmptyState />}
      </div></section>

      <section className="mx-auto mt-14 grid max-w-7xl gap-8 px-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl p-6 md:p-8 bg-panel-exams text-foreground">
          <SectionTitle title={t("upcomingExams")} to="/exams" />
          <div className="grid gap-4 sm:grid-cols-2">{exams.data?.map((e) => <ExamCard key={e.id} e={e} action={<Button asChild size="sm" className="w-full"><Link to="/exams">{t("start")}</Link></Button>} />)}</div>
        </div>
        <div className="rounded-3xl p-6 md:p-8 bg-panel-notices text-foreground">
          <SectionTitle title={t("notices")} to="/notices" />
          <div className="space-y-3">
            {notices.data?.map((n) => (
              <div key={n.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start gap-2"><Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-success" /><div>
                  <p className="font-medium leading-snug">{n.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{fmtDate(n.created_at, lang)}</p>
                </div></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function SectionTitle({ title, to }: { title: string; to: string }) {
  const { t } = useI18n();
  return (
    <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <h2 className="min-w-0 font-display text-xl font-bold text-navy dark:text-foreground sm:text-2xl">{title}</h2>
      <Button asChild size="sm" className="shrink-0 shadow-sm"><Link to={to}>{t("viewAll")} →</Link></Button>
    </div>
  );
}
