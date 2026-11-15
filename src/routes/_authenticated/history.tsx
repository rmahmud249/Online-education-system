import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { useMyResults } from "@/lib/my-results";
import { catalogQuery, fmtDate } from "@/lib/queries";
import { toBn } from "@/lib/i18n";
import { Container } from "@/components/page";
import { QueryState, EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StreakBadges } from "@/components/practice-support";

type Search = { subject?: string | undefined };

export const Route = createFileRoute("/_authenticated/history")({
  validateSearch: (s: Record<string, unknown>): Search => ({ subject: typeof s["subject"] === "string" && s["subject"] ? (s["subject"] as string) : undefined }),
  head: () => ({
    meta: [
      { title: "অনুশীলন ইতিহাস | Smart Education BD" },
      { name: "description", content: "সম্পন্ন পরীক্ষা, স্কোর, বিষয় ও সম্পন্নের তারিখ এক জায়গায়" },
      { property: "og:title", content: "অনুশীলন ইতিহাস" },
      { property: "og:description", content: "সম্পন্ন পরীক্ষার ইতিহাস ও স্টাডি স্ট্রিক ব্যাজ" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PracticeHistory,
});

function PracticeHistory() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/history" });
  const q = useMyResults();
  const cat = useQuery(catalogQuery);
  const subjectName = (id: string | null) => cat.data?.subjects.find((s) => s.id === id)?.name_bn ?? "সাধারণ";

  return (
    <Container>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-hero text-navy-foreground"><History className="h-5 w-5" /></span>
        <div>
          <h1 className="font-display text-3xl font-bold">অনুশীলন ইতিহাস</h1>
          <p className="text-muted-foreground">সম্পন্ন পরীক্ষা, স্কোর, বিষয় ও সম্পন্নের তারিখ</p>
        </div>
      </div>

      <QueryState q={q}>
        {(rows) => {
          const done = rows.filter((r) => r.status !== "in_progress");
          const filtered = done.filter((r) => !search.subject || r.subject_id === search.subject).reverse();
          const scored = filtered.filter((r) => r.pct != null);
          const avg = scored.length ? Math.round(scored.reduce((s, r) => s + (r.pct ?? 0), 0) / scored.length) : null;
          const best = scored.length ? Math.max(...scored.map((r) => r.pct ?? 0)) : null;
          const subjectIds = Array.from(new Set(done.map((r) => r.subject_id).filter(Boolean))) as string[];
          return (
            <div className="mt-6 grid gap-6">
              <StreakBadges rows={rows} />

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">সম্পন্ন পরীক্ষা</p><p className="mt-1 text-3xl font-bold">{toBn(done.length)}</p></div>
                <div className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">গড় স্কোর</p><p className="mt-1 text-3xl font-bold">{avg == null ? "—" : `${toBn(avg)}%`}</p></div>
                <div className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">সেরা স্কোর</p><p className="mt-1 text-3xl font-bold">{best == null ? "—" : `${toBn(best)}%`}</p></div>
              </div>

              <div className="max-w-xs">
                <Label>বিষয় অনুযায়ী দেখুন</Label>
                <select
                  className="mt-1 h-10 w-full rounded-md border bg-card px-3 text-sm"
                  value={search.subject ?? ""}
                  onChange={(e) => navigate({ search: { subject: e.target.value || undefined }, replace: true })}
                >
                  <option value="">সব বিষয়</option>
                  {subjectIds.map((id) => <option key={id} value={id}>{subjectName(id)}</option>)}
                </select>
              </div>

              {filtered.length === 0 ? <EmptyState /> : (
                <div className="divide-y rounded-2xl border bg-card">
                  {filtered.map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{subjectName(r.subject_id)} · {fmtDate(r.submitted_at ?? r.started_at)}</p>
                      </div>
                      <span className="text-sm font-medium">
                        {r.result?.is_published ? `${toBn(Number(r.result.total_score))}/${toBn(Number(r.result.total_marks))} (${toBn(r.pct ?? 0)}%)` : "মূল্যায়ন/প্রকাশ বাকি"}
                      </span>
                      <Button size="sm" variant="outline" asChild><Link to="/results/$attemptId" params={{ attemptId: r.id }}>বিস্তারিত</Link></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }}
      </QueryState>
    </Container>
  );
}
