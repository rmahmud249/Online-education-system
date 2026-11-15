import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Container } from "@/components/page";
import { QueryState } from "@/components/states";
import { fmtDate } from "@/lib/queries";

export const Route = createFileRoute("/notices")({
  head: () => ({ meta: [{ title: "নোটিশ | Smart Education BD" }, { name: "description", content: "সর্বশেষ নোটিশ ও ঘোষণা।" }, { property: "og:title", content: "নোটিশ" }, { property: "og:description", content: "সর্বশেষ ঘোষণা" }] }),
  component: () => {
    const q = useQuery({ queryKey: ["notices"], queryFn: async () => { const { data, error } = await supabase.from("notices").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });
    return (<><PageHeader title="নোটিশ" /><Container className="max-w-3xl"><QueryState q={q} empty={(d) => !d.length}>{(d) => <div className="space-y-4">{d.map((n) => <div key={n.id} className="rounded-2xl border bg-card p-5"><h3 className="font-semibold">{n.title}</h3><p className="mt-1 text-xs text-muted-foreground">{fmtDate(n.created_at)}</p><p className="mt-3 whitespace-pre-line">{n.body}</p></div>)}</div>}</QueryState></Container></>);
  },
});
