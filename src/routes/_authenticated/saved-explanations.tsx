import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fmtDate } from "@/lib/queries";
import { Container } from "@/components/page";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/saved-explanations")({
  head: () => ({ meta: [
    { title: "সংরক্ষিত সমাধান | Smart Education BD" },
    { name: "description", content: "সংরক্ষিত AI প্রশ্ন সমাধান আবার দেখুন।" },
    { property: "og:title", content: "সংরক্ষিত সমাধান | Smart Education BD" },
    { property: "og:description", content: "পড়ার সময় সংরক্ষিত AI সমাধান দেখুন।" },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: SavedPage,
});

function SavedPage() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["saved-explanations", userId], enabled: !!userId, queryFn: async () => {
    const { data, error } = await supabase.from("saved_explanations").select("*").eq("user_id", userId!).order("created_at", { ascending: false });
    if (error) throw error; return data;
  } });
  async function remove(id: string) {
    const { error } = await supabase.from("saved_explanations").delete().eq("id", id);
    if (error) return toast.error("মুছে ফেলা যায়নি");
    await qc.invalidateQueries({ queryKey: ["saved-explanations", userId] }); toast.success("মুছে ফেলা হয়েছে");
  }
  return <Container className="max-w-4xl">
    <h1 className="flex items-center gap-3 font-display text-3xl font-bold"><Bookmark className="h-7 w-7 text-success" />সংরক্ষিত সমাধান</h1>
    {q.isPending && <p className="mt-8 text-muted-foreground">লোড হচ্ছে…</p>}
    {q.error && <p role="alert" className="mt-8 text-destructive">পড়া যায়নি। <Button variant="link" onClick={() => q.refetch()}>আবার চেষ্টা করুন</Button></p>}
    {q.data && !q.data.length && <p className="mt-8 text-muted-foreground">এখনো কিছু সংরক্ষণ করা হয়নি। <Link to="/ask" className="text-primary underline">AI প্রশ্ন সমাধান</Link> থেকে সমাধান সংরক্ষণ করো।</p>}
    <div className="mt-8 space-y-4">{q.data?.map((s) => <details key={s.id} className="rounded-2xl border bg-card p-5">
      <summary className="cursor-pointer"><span className="font-semibold">{s.question}</span><span className="mt-1 block text-xs text-muted-foreground">{s.chapter_label ? `${s.chapter_label} · ` : ""}{fmtDate(s.created_at)}</span></summary>
      <div className="mt-4 whitespace-pre-wrap break-words leading-8">{s.answer}</div>
      <Button variant="outline" size="sm" className="mt-4" onClick={() => remove(s.id)}><Trash2 className="mr-2 h-4 w-4" />মুছুন</Button>
    </details>)}</div>
  </Container>;
}
