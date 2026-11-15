import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Container } from "@/components/page";
import { QueryState } from "@/components/states";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/materials/$id")({
  head: () => ({ meta: [
    { title: "লেসন | Smart Education BD" },
    { name: "description", content: "অধ্যায়ভিত্তিক নোট ও লেসন।" },
    { property: "og:title", content: "লেসন" },
    { property: "og:description", content: "Smart Education BD লেসন" },
  ] }),
  component: MaterialPage,
});

function MaterialPage() {
  const { id } = Route.useParams();
  const { userId } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["material", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("study_materials").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("পাওয়া যায়নি");
      let url: string | null = null;
      if (data.file_path) url = (await supabase.storage.from("materials").createSignedUrl(data.file_path, 3600)).data?.signedUrl ?? null;
      return { ...data, url };
    },
  });
  const bm = useQuery({
    queryKey: ["bookmark", id, userId], enabled: !!userId,
    queryFn: async () => !!(await supabase.from("bookmarks").select("material_id").eq("material_id", id).maybeSingle()).data,
  });
  useEffect(() => { supabase.rpc("increment_material_view", { p_material: id }); }, [id]);

  async function toggle() {
    if (!userId) return toast.error("সংরক্ষণ করতে লগইন করুন");
    const { error } = bm.data
      ? await supabase.from("bookmarks").delete().eq("material_id", id).eq("user_id", userId)
      : await supabase.from("bookmarks").insert({ material_id: id, user_id: userId });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["bookmark", id] });
    toast.success(bm.data ? "সরানো হয়েছে" : "সংরক্ষিত হয়েছে");
  }

  return (
    <Container className="max-w-4xl">
      <QueryState q={q}>
        {(m) => (
          <article className="rounded-3xl border bg-card p-6 shadow-card md:p-10">
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-2xl font-bold md:text-3xl">{m.title}</h1>
              <Button variant={bm.data ? "default" : "outline"} size="sm" onClick={toggle}><Bookmark className="mr-1 h-4 w-4" />{bm.data ? "সংরক্ষিত" : "সংরক্ষণ"}</Button>
            </div>
            {m.description && <p className="mt-2 text-muted-foreground">{m.description}</p>}
            <div className="prose-lesson mt-6 whitespace-pre-line">{m.content}</div>
            {m.url && (
              <div className="mt-6 space-y-3">
                <iframe src={m.url} title={m.title} className="h-[70vh] w-full rounded-xl border" />
                {m.allow_download && <Button asChild><a href={m.url} download>PDF ডাউনলোড</a></Button>}
              </div>
            )}
          </article>
        )}
      </QueryState>
    </Container>
  );
}
