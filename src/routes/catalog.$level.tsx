import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { catalogQuery } from "@/lib/queries";
import { useI18n, toBn } from "@/lib/i18n";
import { PageHeader, Container } from "@/components/page";
import { QueryState, EmptyState } from "@/components/states";

export const Route = createFileRoute("/catalog/$level")({
  beforeLoad: ({ params }) => {
    if (params.level !== "ssc" && params.level !== "hsc") throw notFound();
  },
  head: ({ params }) => {
    const n = params.level === "hsc" ? "এইচএসসি (HSC)" : "এসএসসি (SSC)";
    return {
      meta: [
        { title: `${n} বিষয়সমূহ | Smart Education BD` },
        { name: "description", content: `${n} বিজ্ঞান, ব্যবসায় শিক্ষা ও মানবিক বিভাগের বিষয় ও অধ্যায়ভিত্তিক লেসন।` },
        { property: "og:title", content: `${n} বিষয়সমূহ` },
        { property: "og:description", content: `${n} সকল বিষয়ের নোট ও পরীক্ষা।` },
      ],
    };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: LevelPage,
});

function LevelPage() {
  const { level } = Route.useParams();
  const { t, lang } = useI18n();
  const q = useQuery(catalogQuery);
  const [group, setGroup] = useState<string>("all");
  const cls = q.data?.classes.find((c) => c.level === level);

  return (
    <>
      <PageHeader title={cls ? (lang === "bn" ? cls.name_bn : cls.name_en) : level.toUpperCase()} subtitle={t("subjects")}>
        <div className="mt-6 flex flex-wrap gap-2">
          {[{ id: "all", name_bn: "সকল", name_en: "All" }, { id: "common", name_bn: "আবশ্যিক", name_en: "Compulsory" }, ...(q.data?.groups ?? [])].map((g) => (
            <button key={g.id} onClick={() => setGroup(g.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${group === g.id ? "bg-card text-primary" : "bg-navy-foreground/10 hover:bg-navy-foreground/20"}`}>
              {lang === "bn" ? g.name_bn : g.name_en}
            </button>
          ))}
        </div>
      </PageHeader>
      <Container>
        <QueryState q={q}>
          {(d) => {
            const subs = d.subjects.filter((s) => s.class_id === cls?.id && (group === "all" || (group === "common" ? !s.group_id : s.group_id === group)));
            if (!subs.length) return <EmptyState />;
            return (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subs.map((s) => {
                  const chs = d.chapters.filter((c) => c.subject_id === s.id);
                  const g = d.groups.find((x) => x.id === s.group_id);
                  return (
                    <Link key={s.id} to="/subjects/$id" params={{ id: s.id }} className="group rounded-2xl border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary"><BookOpen className="h-5 w-5" /></span>
                        <div>
                          <h3 className="font-semibold group-hover:text-primary">{lang === "bn" ? s.name_bn : s.name_en}</h3>
                          <p className="text-xs text-muted-foreground">{g ? (lang === "bn" ? g.name_bn : g.name_en) : t("common")} {s.code && `· ${s.code}`}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">{toBn(chs.length, lang)} {t("chapters")}</p>
                    </Link>
                  );
                })}
              </div>
            );
          }}
        </QueryState>
      </Container>
    </>
  );
}
