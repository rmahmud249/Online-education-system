CREATE TABLE public.saved_explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question text NOT NULL CHECK (char_length(question) <= 6000),
  answer text NOT NULL CHECK (char_length(answer) <= 60000),
  chapter_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.saved_explanations TO authenticated;
GRANT ALL ON public.saved_explanations TO service_role;
ALTER TABLE public.saved_explanations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own saved explanations" ON public.saved_explanations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX saved_explanations_user_idx ON public.saved_explanations(user_id, created_at DESC);