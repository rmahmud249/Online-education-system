import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { catalogQuery } from "@/lib/queries";
import { useI18n, toBn } from "@/lib/i18n";
import { PageHeader, Container } from "@/components/page";
import { QueryState } from "@/components/states";

export const Route = createFileRoute("/catalog/")({
  head: () => ({
    meta: [
      { title: "পাঠ্যক্রম — SSC ও HSC বিষয় ও অধ্যায় | Smart Education BD" },
      { name: "description", content: "এসএসসি ও এইচএসসি — বিজ্ঞান, ব্যবসায় শিক্ষা ও মানবিক বিভাগের সকল বিষয় ও অধ্যায়।" },
      { property: "og:title", content: "SSC ও HSC পাঠ্যক্রম" },
      { property: "og:description", content: "বিভাগ, বিষয় ও অধ্যায়ভিত্তিক লেসন।" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: CatalogPage,
});

function CatalogPage() {
  const { t, lang } = useI18n();
  const q = useQuery(catalogQuery);
  return (
    <>
      <PageHeader title={t("catalog")} subtitle={lang === "bn" ? "শ্রেণি → বিভাগ → বিষয় → অধ্যায় → লেসন" : "Class → Group → Subject → Chapter → Lesson"} />
      <Container>
        <QueryState q={q}>
          {(d) => (
            <div className="grid gap-6 md:grid-cols-2">
              {d.classes.map((c) => (
                <div key={c.id} className="rounded-3xl border bg-card p-6 shadow-card">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl font-bold">{lang === "bn" ? c.name_bn : c.name_en}</h2>
                    <Link to="/catalog/$level" params={{ level: c.level }} className="flex items-center gap-1 text-sm font-medium text-primary">{t("viewAll")} <ArrowRight className="h-4 w-4" /></Link>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {[{ id: null as string | null, name_bn: "আবশ্যিক", name_en: "Compulsory" }, ...d.groups].map((g) => {
                      const subs = d.subjects.filter((s) => s.class_id === c.id && s.group_id === g.id);
                      if (!subs.length) return null;
                      return (
                        <div key={g.id ?? "common"} className="rounded-xl bg-muted p-4">
                          <p className="text-sm font-semibold text-muted-foreground">{lang === "bn" ? g.name_bn : g.name_en} · {toBn(subs.length, lang)}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {subs.map((s) => (
                              <Link key={s.id} to="/subjects/$id" params={{ id: s.id }} className="rounded-lg border bg-card px-3 py-1.5 text-sm hover:border-primary hover:text-primary">
                                {lang === "bn" ? s.name_bn : s.name_en}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </QueryState>
      </Container>
    </>
  );
}
