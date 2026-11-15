import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Container } from "@/components/page";
import { LoadingState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toBn } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/exam/$attemptId")({
  head: () => ({ meta: [{ title: "পরীক্ষা চলছে | Smart Education BD" }, { name: "description", content: "অনলাইন পরীক্ষা" }, { property: "og:title", content: "পরীক্ষা" }, { property: "og:description", content: "অনলাইন পরীক্ষা" }] }),
  component: ExamScreen,
});

type Q = { id: string; type: "mcq" | "cq"; body: string; marks: number; options: { id: string; text: string }[]; selected_option_id: string | null; answer_text: string | null };
type Attempt = { attempt_id: string; status: string; expires_at: string; server_now: string; exam: { title: string; total_marks: number; negative_marking: number }; questions: Q[] };

function ExamScreen() {
  const { attemptId } = Route.useParams();
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["attempt", attemptId], staleTime: Infinity, refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_attempt", { p_attempt: attemptId });
      if (error) throw error;
      return data as unknown as Attempt;
    },
  });
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { opt: string | null; text: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [left, setLeft] = useState<number | null>(null);
  const [confirm, setConfirm] = useState(false);
  const submitted = useRef(false);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!q.data) return;
    if (q.data.status !== "in_progress") { navigate({ to: "/results/$attemptId", params: { attemptId }, replace: true }); return; }
    const a: typeof answers = {};
    q.data.questions.forEach((x) => (a[x.id] = { opt: x.selected_option_id, text: x.answer_text ?? "" }));
    setAnswers(a);
    const offset = Date.now() - new Date(q.data.server_now).getTime();
    const end = new Date(q.data.expires_at).getTime() + offset;
    const tick = () => setLeft(Math.max(0, Math.floor((end - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [q.data, attemptId, navigate]);

  const save = useCallback(async (qid: string, opt: string | null, text: string | null) => {
    setSaving((s) => ({ ...s, [qid]: true }));
    const { error } = await supabase.rpc("save_answer", { p_attempt: attemptId, p_question: qid, p_option: opt as string, p_text: text as string });
    setSaving((s) => ({ ...s, [qid]: false }));
    if (error) toast.error(error.message);
  }, [attemptId]);

  const submit = useCallback(async () => {
    if (submitted.current) return;
    submitted.current = true;
    await Promise.all(Object.entries(timers.current).map(([qid, t]) => { clearTimeout(t); return save(qid, null, answers[qid]?.text ?? ""); }));
    timers.current = {};
    const { error } = await supabase.rpc("submit_attempt", { p_attempt: attemptId });
    if (error) { submitted.current = false; return toast.error(error.message); }
    toast.success("পরীক্ষা জমা হয়েছে");
    navigate({ to: "/results/$attemptId", params: { attemptId }, replace: true });
  }, [attemptId, navigate, save, answers, left, q.data]);

  useEffect(() => { if (left === 0) { toast.info("সময় শেষ — স্বয়ংক্রিয়ভাবে জমা হচ্ছে"); submit(); } }, [left, submit]);

  if (q.isLoading) return <LoadingState />;
  if (q.error) return <Container><ErrorState error={q.error} onRetry={() => q.refetch()} /></Container>;
  const d = q.data!;
  const cur = d.questions[idx];
  if (!cur) return <Container><ErrorState error="এই পরীক্ষায় কোনো প্রশ্ন নেই" /></Container>;
  const answered = (x: Q) => !!answers[x.id]?.opt || !!answers[x.id]?.text?.trim();
  const count = d.questions.filter(answered).length;
  const mm = Math.floor((left ?? 0) / 60), ss = (left ?? 0) % 60;

  return (
    <Container className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div>
        <div className="sticky top-16 z-10 -mx-4 mb-4 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
          <h1 className="font-semibold">{d.exam.title}</h1>
          <span className={`flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-lg font-bold ${(left ?? 999) < 60 ? "bg-destructive text-destructive-foreground" : "bg-secondary text-primary"}`}>
            <Clock className="h-4 w-4" />{toBn(String(mm).padStart(2, "0"))}:{toBn(String(ss).padStart(2, "0"))}
          </span>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>প্রশ্ন {toBn(idx + 1)} / {toBn(d.questions.length)} · {cur.type === "mcq" ? "MCQ" : "সৃজনশীল"}</span>
            <span>{toBn(cur.marks)} নম্বর {saving[cur.id] && "· সংরক্ষণ হচ্ছে..."}</span>
          </div>
          <p className="mt-4 whitespace-pre-line text-lg font-medium">{cur.body}</p>
          {cur.type === "mcq" ? (
            <div className="mt-5 grid gap-3">
              {cur.options.map((o, i) => {
                const on = answers[cur.id]?.opt === o.id;
                return (
                  <button key={o.id} onClick={() => { setAnswers({ ...answers, [cur.id]: { opt: o.id, text: "" } }); save(cur.id, o.id, null); }}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${on ? "border-primary bg-secondary" : "hover:border-primary/40"}`}>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-sm font-bold ${on ? "bg-primary text-primary-foreground" : ""}`}>{"কখগঘ"[i]}</span>{o.text}
                  </button>
                );
              })}
            </div>
          ) : (
            <Textarea className="mt-5" rows={10} maxLength={20000} placeholder="তোমার উত্তর লেখো..." value={answers[cur.id]?.text ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setAnswers({ ...answers, [cur.id]: { opt: null, text: v } });
                clearTimeout(timers.current[cur.id]);
                timers.current[cur.id] = setTimeout(() => { delete timers.current[cur.id]; save(cur.id, null, v); }, 800);
              }} />
          )}
          <div className="mt-6 flex justify-between">
            <Button variant="outline" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>আগের</Button>
            {idx < d.questions.length - 1 ? <Button onClick={() => setIdx(idx + 1)}>পরের</Button> : <Button className="bg-success text-success-foreground hover:bg-success/90" onClick={() => setConfirm(true)}>রিভিউ ও জমা</Button>}
          </div>
        </div>
      </div>
      <aside className="h-fit rounded-2xl border bg-card p-5 lg:sticky lg:top-20">
        <p className="font-semibold">উত্তর দেওয়া হয়েছে: {toBn(count)} / {toBn(d.questions.length)}</p>
        <div className="mt-4 grid grid-cols-6 gap-2">
          {d.questions.map((x, i) => (
            <button key={x.id} onClick={() => setIdx(i)} aria-label={`প্রশ্ন ${i + 1}`}
              className={`h-9 rounded-lg text-sm font-semibold ${i === idx ? "ring-2 ring-primary" : ""} ${answered(x) ? "bg-success text-success-foreground" : "bg-muted"}`}>{toBn(i + 1)}</button>
          ))}
        </div>
        <Button className="mt-5 w-full" onClick={() => setConfirm(true)}><CheckCircle2 className="mr-1 h-4 w-4" />জমা দিন</Button>
      </aside>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>পরীক্ষা জমা দেবে?</AlertDialogTitle>
            <AlertDialogDescription>{toBn(d.questions.length - count)}টি প্রশ্নের উত্তর বাকি। জমা দেওয়ার পর আর পরিবর্তন করা যাবে না।</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>ফিরে যাও</AlertDialogCancel><AlertDialogAction onClick={submit}>জমা দাও</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}
