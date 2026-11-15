import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Hourglass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Container } from "@/components/page";
import { QueryState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { toBn } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/results/$attemptId")({
  head: () => ({ meta: [{ title: "ফলাফল ও উত্তর পর্যালোচনা | Smart Education BD" }, { name: "description", content: "পরীক্ষার ফলাফল, ব্যাখ্যা ও মূল্যায়ন" }, { property: "og:title", content: "ফলাফল" }, { property: "og:description", content: "পরীক্ষার ফলাফল" }] }),
  component: ResultPage,
});

type RQ = { id: string; type: string; body: string; marks: number; explanation: string | null; options: { id: string; text: string; is_correct: boolean }[]; selected_option_id: string | null; answer_text: string | null; awarded_marks: number | null; feedback: string | null };
type Review = { published: boolean; status: string; exam: { title: string }; result?: { mcq: number; cq: number; total: number; total_marks: number } | null; questions?: RQ[] };

function ResultPage() {
  const { attemptId } = Route.useParams();
  const q = useQuery({
    queryKey: ["review", attemptId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_attempt_review", { p_attempt: attemptId });
      if (error) throw error;
      return data as unknown as Review;
    },
  });
  return (
    <Container className="max-w-4xl">
      <QueryState q={q}>
        {(r) => !r.published && !r.questions ? (
          <div className="rounded-3xl border bg-card p-10 text-center">
            <Hourglass className="mx-auto h-10 w-10 text-warning" />
            <h1 className="mt-4 text-2xl font-bold">{r.exam.title}</h1>
            <p className="mt-2 text-muted-foreground">তোমার উত্তর জমা হয়েছে। সৃজনশীল অংশ মূল্যায়ন ও ফলাফল প্রকাশের পর এখানে দেখতে পাবে।</p>
            <Button asChild className="mt-6"><Link to="/dashboard">ড্যাশবোর্ডে যাও</Link></Button>
          </div>
        ) : (
          <>
            <div className="rounded-3xl bg-hero p-8 text-navy-foreground">
              <h1 className="font-display text-2xl font-bold">{r.exam.title}</h1>
              {r.result && (
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div><div className="text-4xl font-bold">{toBn(Number(r.result.total))}</div><div className="text-sm opacity-80">মোট / {toBn(Number(r.result.total_marks))}</div></div>
                  <div><div className="text-2xl font-bold">{toBn(Number(r.result.mcq))}</div><div className="text-sm opacity-80">MCQ</div></div>
                  <div><div className="text-2xl font-bold">{toBn(Number(r.result.cq))}</div><div className="text-sm opacity-80">CQ</div></div>
                </div>
              )}
              {!r.published && <p className="mt-4 text-sm opacity-80">ফলাফল এখনও প্রকাশিত হয়নি (শিক্ষক ভিউ)।</p>}
            </div>
            <div className="mt-6 space-y-4">
              {r.questions?.map((x, i) => (
                <div key={x.id} className="rounded-2xl border bg-card p-5">
                  <div className="flex justify-between text-sm text-muted-foreground"><span>প্রশ্ন {toBn(i + 1)}</span><span>{x.awarded_marks == null ? "মূল্যায়ন বাকি" : `${toBn(Number(x.awarded_marks))} / ${toBn(x.marks)}`}</span></div>
                  <p className="mt-2 whitespace-pre-line font-medium">{x.body}</p>
                  {x.type === "mcq" ? (
                    <ul className="mt-3 space-y-2">{x.options.map((o) => {
                      const mine = o.id === x.selected_option_id;
                      return <li key={o.id} className={`flex items-center gap-2 rounded-lg border p-3 ${o.is_correct ? "border-success bg-success/10" : mine ? "border-destructive bg-destructive/10" : ""}`}>
                        {o.is_correct ? <CheckCircle2 className="h-4 w-4 text-success" /> : mine ? <XCircle className="h-4 w-4 text-destructive" /> : <span className="w-4" />}{o.text}{mine && <span className="ml-auto text-xs">তোমার উত্তর</span>}
                      </li>;
                    })}{!x.selected_option_id && <li className="text-sm text-muted-foreground">উত্তর দেওয়া হয়নি</li>}</ul>
                  ) : (
                    <div className="mt-3 rounded-lg bg-muted p-3 text-sm whitespace-pre-line">{x.answer_text || "উত্তর দেওয়া হয়নি"}</div>
                  )}
                  {x.feedback && <p className="mt-3 rounded-lg bg-secondary p-3 text-sm"><b>শিক্ষকের মন্তব্য:</b> {x.feedback}</p>}
                  {x.explanation && <p className="mt-3 rounded-lg bg-accent p-3 text-sm text-accent-foreground"><b>ব্যাখ্যা:</b> {x.explanation}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </QueryState>
    </Container>
  );
}
