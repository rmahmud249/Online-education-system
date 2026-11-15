import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useMyResults() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["my-results", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: attempts, error } = await supabase.from("exam_attempts").select("id,exam_id,status,submitted_at,started_at,exams(title,subject_id)").eq("student_id", userId!).order("started_at");
      if (error) throw error;
      const { data: results } = await supabase.from("results").select("*").eq("student_id", userId!);
      return (attempts ?? []).map((a) => {
        const r = results?.find((x) => x.attempt_id === a.id);
        const ex = a.exams as unknown as { title: string; subject_id: string | null } | null;
        return { ...a, title: ex?.title ?? "", subject_id: ex?.subject_id ?? null, result: r, pct: r ? Math.round((Number(r.total_score) / Math.max(1, Number(r.total_marks))) * 100) : null };
      });
    },
  });
}
