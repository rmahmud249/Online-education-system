import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { PageHeader, Container } from "@/components/page";
import { QueryState } from "@/components/states";
import { ExamCard, examStatus } from "@/components/cards";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/exams")({
  head: () => ({ meta: [
    { title: "অনলাইন পরীক্ষা — MCQ ও CQ | Smart Education BD" },
    { name: "description", content: "অধ্যায়ভিত্তিক, বিষয়ভিত্তিক ও মডেল টেস্ট — লাইভ টাইমারসহ।" },
    { property: "og:title", content: "অনলাইন পরীক্ষা" },
    { property: "og:description", content: "MCQ ও সৃজনশীল অনলাইন পরীক্ষা।" },
  ] }),
  component: ExamsPage,
});

function ExamsPage() {
  const { t } = useI18n();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const exams = useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exams").select("*").eq("is_published", true).order("starts_at");
      if (error) throw error;
      return data;
    },
  });
  const mine = useQuery({
    queryKey: ["my-attempts", userId], enabled: !!userId,
    queryFn: async () => (await supabase.from("exam_attempts").select("id,exam_id,status")).data ?? [],
  });
  async function start(examId: string) {
    if (!userId) return navigate({ to: "/auth" });
    const { data, error } = await supabase.rpc("start_exam", { p_exam: examId });
    if (error) return toast.error(error.message);
    navigate({ to: "/exam/$attemptId", params: { attemptId: data } });
  }
  return (
    <>
      <PageHeader title={t("exams")} />
      <Container>
        <QueryState q={exams} empty={(d) => !d.length}>
          {(d) => <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{d.map((e) => {
            const a = mine.data?.find((x) => x.exam_id === e.id);
            const st = examStatus(e);
            return <ExamCard key={e.id} e={e} action={
              a && a.status !== "in_progress"
                ? <Button variant="outline" className="w-full" onClick={() => navigate({ to: "/results/$attemptId", params: { attemptId: a.id } })}>{t("results")}</Button>
                : <Button className="w-full" disabled={st !== "live"} onClick={() => start(e.id)}>{a ? "চালিয়ে যান" : t("start")}</Button>
            } />;
          })}</div>}
        </QueryState>
      </Container>
    </>
  );
}
