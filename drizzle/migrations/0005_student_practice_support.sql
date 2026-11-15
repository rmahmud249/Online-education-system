CREATE TABLE public.student_practice_preferences (user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE, weekly_goal integer NOT NULL DEFAULT 3 CHECK (weekly_goal BETWEEN 1 AND 20), reminders_enabled boolean NOT NULL DEFAULT false);
GRANT SELECT, INSERT, UPDATE ON public.student_practice_preferences TO authenticated;
GRANT ALL ON public.student_practice_preferences TO service_role;
ALTER TABLE public.student_practice_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own practice preferences" ON public.student_practice_preferences FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE TABLE public.exam_reminder_subjects (user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE, PRIMARY KEY(user_id,subject_id));
GRANT SELECT, INSERT, DELETE ON public.exam_reminder_subjects TO authenticated;
GRANT ALL ON public.exam_reminder_subjects TO service_role;
ALTER TABLE public.exam_reminder_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reminder subjects" ON public.exam_reminder_subjects FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE TABLE public.exam_reminder_deliveries (user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE, starts_at timestamptz NOT NULL, PRIMARY KEY(user_id,exam_id,starts_at));
GRANT ALL ON public.exam_reminder_deliveries TO service_role;
ALTER TABLE public.exam_reminder_deliveries ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.practice_plans (user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE, attempt_ids uuid[] NOT NULL, plan text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.practice_plans TO authenticated;
GRANT ALL ON public.practice_plans TO service_role;
ALTER TABLE public.practice_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own practice plans" ON public.practice_plans FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE OR REPLACE FUNCTION public.practice_result_evidence(p_attempts uuid[]) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT coalesce(jsonb_agg(evidence),'[]'::jsonb) FROM (
 SELECT jsonb_build_object('attempt_id',a.id,'exam',e.title,'subject',s.name_bn,'completed_at',a.submitted_at,'score',r.total_score,'total_marks',r.total_marks,'questions',(SELECT jsonb_agg(jsonb_build_object('topic',coalesce(c.name_bn,s.name_bn),'question',left(q.body,1500),'type',q.type,'marks',eq.marks,'awarded_marks',coalesce(sa.awarded_marks,0),'feedback',left(sa.feedback,1000))) FROM public.exam_questions eq JOIN public.questions q ON q.id=eq.question_id LEFT JOIN public.chapters c ON c.id=q.chapter_id LEFT JOIN public.student_answers sa ON sa.attempt_id=a.id AND sa.question_id=q.id WHERE eq.exam_id=e.id)) evidence
 FROM public.exam_attempts a JOIN public.results r ON r.attempt_id=a.id JOIN public.exams e ON e.id=a.exam_id LEFT JOIN public.subjects s ON s.id=e.subject_id WHERE a.id=ANY(p_attempts) AND a.student_id=auth.uid() AND a.status<>'in_progress' AND a.submitted_at IS NOT NULL AND r.is_published
) t $$;
REVOKE ALL ON FUNCTION public.practice_result_evidence(uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.practice_result_evidence(uuid[]) TO authenticated;
CREATE OR REPLACE FUNCTION public.send_exam_reminders() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n integer;
BEGIN
WITH due AS (SELECT p.user_id,e.id,e.title,e.starts_at FROM public.student_practice_preferences p JOIN public.profiles pr ON pr.id=p.user_id JOIN public.classes c ON c.level=pr.level JOIN public.exams e ON e.class_id=c.id JOIN public.exam_reminder_subjects rs ON rs.user_id=p.user_id AND rs.subject_id=e.subject_id WHERE p.reminders_enabled AND e.is_published AND e.starts_at>now() AND e.starts_at<=now()+interval '24 hours' AND NOT EXISTS(SELECT 1 FROM public.exam_attempts a WHERE a.student_id=p.user_id AND a.exam_id=e.id AND a.submitted_at IS NOT NULL)), inserted AS (INSERT INTO public.exam_reminder_deliveries(user_id,exam_id,starts_at) SELECT user_id,id,starts_at FROM due ON CONFLICT DO NOTHING RETURNING *) INSERT INTO public.notifications(user_id,title,body,link) SELECT i.user_id,'আসন্ন পরীক্ষার রিমাইন্ডার',e.title || ' — ' || to_char(i.starts_at AT TIME ZONE 'Asia/Dhaka','DD Mon YYYY HH24:MI') || ' (ঢাকা)','/exam-calendar' FROM inserted i JOIN public.exams e ON e.id=i.exam_id;
GET DIAGNOSTICS n=ROW_COUNT; RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.send_exam_reminders() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.send_exam_reminders() TO service_role;