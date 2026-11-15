import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Container } from "@/components/page";
import { QueryState } from "@/components/states";
import { toBn } from "@/lib/i18n";

export const Route = createFileRoute("/board-questions")({
  validateSearch: (s: Record<string, unknown>): { subject?: string | undefined } => ({ subject: typeof s['subject'] === "string" ? s['subject'] : undefined }),
  head: () => ({ meta: [{ title: "বোর্ড প্রশ্ন ও সমাধান | Smart Education BD" }, { name: "description", content: "বিগত বছরের বোর্ড প্রশ্ন ও বিস্তারিত সমাধান।" }, { property: "og:title", content: "বোর্ড প্রশ্ন" }, { property: "og:description", content: "বোর্ড প্রশ্ন ও সমাধান" }] }),
  component: () => {
    const { subject } = Route.useSearch();
    const q = useQuery({ queryKey: ["bq", subject], queryFn: async () => { let r = supabase.from("board_questions").select("*").order("year", { ascending: false }); if (subject) r = r.eq("subject_id", subject); const { data, error } = await r; if (error) throw error; return data; } });
    return (<><PageHeader title="বোর্ড প্রশ্ন ও সমাধান" /><Container className="max-w-4xl"><QueryState q={q} empty={(d) => !d.length}>{(d) => <div className="space-y-4">{d.map((b) => <details key={b.id} className="rounded-2xl border bg-card p-5"><summary className="cursor-pointer font-semibold">{b.title} · {b.board} {toBn(b.year)}</summary><p className="mt-3 whitespace-pre-line">{b.content}</p>{b.solution && <div className="mt-3 rounded-xl bg-accent p-4 text-accent-foreground"><b>সমাধান:</b> {b.solution}</div>}</details>)}</div>}</QueryState></Container></>);
  },
});
