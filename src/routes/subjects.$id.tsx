import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { ChevronRight, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { catalogQuery, materialTypeLabel } from "@/lib/queries";
import { useI18n, toBn } from "@/lib/i18n";
import { PageHeader, Container } from "@/components/page";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ExamCard } from "@/components/cards";
import { Button } from "@/components/ui/button";

const subjectMaterialsQuery = (id: string) => queryOptions({
  queryKey: ["subject-materials", id],
  queryFn: async () => {
    const { data, error } = await supabase.from("study_materials").select("id,title,type,chapter_id,year").eq("subject_id", id).order("created_at");
    if (error) throw error;
    return data;
  },
});
const subjectExamsQuery = (id: string) => queryOptions({
  queryKey: ["subject-exams", id],
  queryFn: async () => {
    const { data, error } = await supabase.from("exams").select("*").eq("subject_id", id).eq("is_published", true);
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/subjects/$id")({
  loader: ({ context, params }) => Promise.all([
    context.queryClient.ensureQueryData(catalogQuery),
    context.queryClient.ensureQueryData(subjectMaterialsQuery(params.id)),
    context.queryClient.ensureQueryData(subjectExamsQuery(params.id)),
  ]).then(() => undefined),
  head: () => ({
    meta: [
      { title: "বিষয়ের অধ্যায় ও লেসন | Smart Education BD" },
      { name: "description", content: "অধ্যায়ভিত্তিক নোট, গাইড, সাজেশন ও পরীক্ষা।" },
      { property: "og:title", content: "অধ্যায়ভিত্তিক লেসন" },
      { property: "og:description", content: "বিষয়ের সকল অধ্যায় ও স্টাডি ম্যাটেরিয়াল।" },
    ],
  }),
  component: SubjectPage,
});

function SubjectPage() {
  const { id } = Route.useParams();
  const { t, lang } = useI18n();
  const cat = useQuery(catalogQuery);
  const mats = useQuery(subjectMaterialsQuery(id));
  const exams = useQuery(subjectExamsQuery(id));

  if (cat.isLoading) return <LoadingState />;
  if (cat.error) return <ErrorState error={cat.error} />;
  const s = cat.data!.subjects.find((x) => x.id === id);
  if (!s) return <Container><EmptyState /></Container>;
  const cls = cat.data!.classes.find((c) => c.id === s.class_id);
  const chapters = cat.data!.chapters.filter((c) => c.subject_id === id);
  const general = mats.data?.filter((m) => !m.chapter_id) ?? [];

  return (
    <>
      <PageHeader title={lang === "bn" ? s.name_bn : s.name_en}>
        <div className="mt-3 flex items-center gap-1 text-sm opacity-85">
          <Link to="/catalog">{t("catalog")}</Link><ChevronRight className="h-4 w-4" />
          {cls && <Link to="/catalog/$level" params={{ level: cls.level }}>{lang === "bn" ? cls.name_bn : cls.name_en}</Link>}
        </div>
      </PageHeader>
      <Container className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="mb-4 font-display text-xl font-bold">{t("chapters")} ({toBn(chapters.length, lang)})</h2>
          {mats.isLoading ? <LoadingState /> : chapters.length === 0 ? <EmptyState /> : (
            <Accordion type="multiple" defaultValue={[chapters[0]?.id ?? ""]} className="space-y-3">
              {chapters.map((c) => {
                const ls = mats.data?.filter((m) => m.chapter_id === c.id) ?? [];
                return (
                  <AccordionItem key={c.id} value={c.id} className="rounded-2xl border bg-card px-5">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">{toBn(c.number, lang)}</span>
                        <span className="font-semibold">{lang === "bn" ? c.name_bn : c.name_en || c.name_bn}</span>
                        <Badge variant="secondary" className="ml-2">{toBn(ls.length, lang)} {t("lessons")}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {ls.length === 0 ? <p className="pb-2 text-sm text-muted-foreground">{t("empty")}</p> : (
                        <ul className="divide-y">
                          {ls.map((m) => (
                            <li key={m.id}>
                              <Link to="/materials/$id" params={{ id: m.id }} className="flex items-center gap-3 py-3 hover:text-primary">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="flex-1">{m.title}</span>
                                <Badge variant="outline">{materialTypeLabel[m.type]?.[lang === "bn" ? 0 : 1]}</Badge>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
          {general.length > 0 && (
            <div className="mt-6 rounded-2xl border bg-card p-5">
              <h3 className="font-semibold">{lang === "bn" ? "অন্যান্য ম্যাটেরিয়াল" : "Other materials"}</h3>
              <ul className="mt-2 divide-y">{general.map((m) => (
                <li key={m.id}><Link to="/materials/$id" params={{ id: m.id }} className="flex justify-between py-3 hover:text-primary"><span>{m.title}</span><Badge variant="outline">{materialTypeLabel[m.type]?.[lang === "bn" ? 0 : 1]}</Badge></Link></li>
              ))}</ul>
            </div>
          )}
        </div>
        <aside className="space-y-4">
          <h2 className="font-display text-xl font-bold">{t("exams")}</h2>
          {exams.data?.length ? exams.data.map((e) => <ExamCard key={e.id} e={e} action={<Button asChild size="sm" className="w-full"><Link to="/exams">{t("start")}</Link></Button>} />) : <EmptyState />}
          <Button asChild variant="outline" className="w-full"><Link to="/board-questions" search={{ subject: id }}>{t("boardQuestions")}</Link></Button>
        </aside>
      </Container>
    </>
  );
}
