import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Container } from "@/components/page";
import { QueryState } from "@/components/states";
import { toBn } from "@/lib/i18n";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "লিডারবোর্ড | Smart Education BD" }, { name: "description", content: "প্রকাশিত ফলাফলের ভিত্তিতে শীর্ষ শিক্ষার্থী।" }, { property: "og:title", content: "লিডারবোর্ড" }, { property: "og:description", content: "শীর্ষ শিক্ষার্থী" }] }),
  component: () => {
    const q = useQuery({ queryKey: ["leaderboard"], queryFn: async () => { const { data, error } = await supabase.rpc("leaderboard", {}); if (error) throw error; return data; } });
    return (<><PageHeader title="লিডারবোর্ড" /><Container className="max-w-3xl"><QueryState q={q} empty={(d) => !d.length}>{(d) => <ol className="divide-y rounded-2xl border bg-card">{d.map((r, i) => <li key={r.student_id} className="flex items-center gap-4 p-4"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary font-bold text-primary">{toBn(i + 1)}</span><span className="flex-1 font-medium">{r.full_name}</span><span className="text-sm text-muted-foreground">{toBn(r.exams)} পরীক্ষা</span><span className="font-bold">{toBn(Number(r.total))}</span></li>)}</ol>}</QueryState></Container></>);
  },
});
