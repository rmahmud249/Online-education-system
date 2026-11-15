import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const materialTypeLabel: Record<string, [string, string]> = {
  note: ["নোট", "Note"],
  pdf: ["PDF নোট", "PDF"],
  book: ["বই", "Book"],
  guide: ["গাইড", "Guide"],
  test_paper: ["টেস্ট পেপার", "Test paper"],
  suggestion: ["সাজেশন", "Suggestion"],
  solution: ["সমাধান", "Solution"],
};

export const examTypeLabel: Record<string, string> = { mcq: "MCQ", cq: "CQ", combined: "MCQ + CQ" };
export const scopeLabel: Record<string, [string, string]> = {
  chapter: ["অধ্যায়ভিত্তিক", "Chapter-wise"],
  subject: ["বিষয়ভিত্তিক", "Subject-wise"],
  model_test: ["মডেল টেস্ট", "Model test"],
  board: ["বোর্ড প্রস্তুতি", "Board practice"],
};

export const BOARDS = ["ঢাকা", "রাজশাহী", "চট্টগ্রাম", "কুমিল্লা", "যশোর", "সিলেট", "বরিশাল", "দিনাজপুর", "ময়মনসিংহ", "মাদ্রাসা", "কারিগরি"];

export const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  staleTime: 5 * 60_000,
  queryFn: async () => {
    const [c, g, s, ch] = await Promise.all([
      supabase.from("classes").select("*").order("position"),
      supabase.from("groups").select("*").order("position"),
      supabase.from("subjects").select("*").order("position"),
      supabase.from("chapters").select("*").order("number"),
    ]);
    const err = c.error || g.error || s.error || ch.error;
    if (err) throw err;
    return { classes: c.data!, groups: g.data!, subjects: s.data!, chapters: ch.data! };
  },
});

export type Catalog = Awaited<ReturnType<NonNullable<typeof catalogQuery.queryFn>>>;

export function fmtDate(d: string | null | undefined, lang: "bn" | "en" = "bn") {
  if (!d) return "";
  return new Date(d).toLocaleString(lang === "bn" ? "bn-BD" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" });
}
