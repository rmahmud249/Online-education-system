import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { catalogQuery, materialTypeLabel } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import { PageHeader, Container } from "@/components/page";
import { QueryState } from "@/components/states";
import { MaterialCard } from "@/components/cards";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/materials/")({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined } => ({ q: typeof s['q'] === "string" ? s['q'] : undefined }),
  head: () => ({ meta: [
    { title: "স্টাডি ম্যাটেরিয়াল | Smart Education BD" },
    { name: "description", content: "নোট, গাইড, সাজেশন ও টেস্ট পেপার খুঁজুন।" },
    { property: "og:title", content: "স্টাডি ম্যাটেরিয়াল" },
    { property: "og:description", content: "শ্রেণি, বিষয় ও অধ্যায়ভিত্তিক ফিল্টার।" },
  ] }),
  component: MaterialsPage,
});

function MaterialsPage() {
  const { q: initial } = Route.useSearch();
  const { t, lang } = useI18n();
  const cat = useQuery(catalogQuery);
  const [q, setQ] = useState(initial ?? "");
  const [cls, setCls] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("");
  const mats = useQuery({
    queryKey: ["materials", q, cls, subject, type],
    queryFn: async () => {
      let r = supabase.from("study_materials").select("id,title,description,type,views,year,subject_id").order("created_at", { ascending: false }).limit(60);
      if (q.trim()) r = r.ilike("title", `%${q.trim().slice(0, 100)}%`);
      if (cls) r = r.eq("class_id", cls);
      if (subject) r = r.eq("subject_id", subject);
      if (type) r = r.eq("type", type as never);
      const { data, error } = await r;
      if (error) throw error;
      return data;
    },
  });
  const sel = "h-10 rounded-md border bg-card px-3 text-sm";
  return (
    <>
      <PageHeader title={t("materials")} />
      <Container>
        <div className="mb-6 grid gap-3 md:grid-cols-4">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} maxLength={100} />
          <select className={sel} value={cls} onChange={(e) => { setCls(e.target.value); setSubject(""); }}>
            <option value="">SSC / HSC</option>
            {cat.data?.classes.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
          </select>
          <select className={sel} value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">{t("subjects")}</option>
            {cat.data?.subjects.filter((s) => !cls || s.class_id === cls).map((s) => <option key={s.id} value={s.id}>{lang === "bn" ? s.name_bn : s.name_en}</option>)}
          </select>
          <select className={sel} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">—</option>
            {Object.entries(materialTypeLabel).map(([k, v]) => <option key={k} value={k}>{v[lang === "bn" ? 0 : 1]}</option>)}
          </select>
        </div>
        <QueryState q={mats} empty={(d) => d.length === 0}>
          {(d) => <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{d.map((m) => {
            const s = cat.data?.subjects.find((x) => x.id === m.subject_id);
            return <MaterialCard key={m.id} m={m} subject={s ? (lang === "bn" ? s.name_bn : s.name_en) : ""} />;
          })}</div>}
        </QueryState>
      </Container>
    </>
  );
}
