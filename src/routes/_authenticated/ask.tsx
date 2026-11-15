import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { catalogQuery } from "@/lib/queries";
import { Sparkles, ImagePlus, X, LoaderCircle, Bookmark, MessageCircleQuestion } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Container } from "@/components/page";
import { useI18n } from "@/lib/i18n";
import { explainQuestion } from "@/lib/study-help.functions";

export const Route = createFileRoute("/_authenticated/ask")({
  head: () => ({ meta: [
    { title: "AI প্রশ্ন সমাধান | Smart Education BD" },
    { name: "description", content: "টেক্সট বা ছবির প্রশ্নের ধাপে ধাপে শিক্ষামূলক সমাধান।" },
    { property: "og:title", content: "AI প্রশ্ন সমাধান | Smart Education BD" },
    { property: "og:description", content: "SSC ও HSC প্রশ্নের ধাপে ধাপে সমাধান।" },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: AskPage,
});

function AskPage() {
  const { lang } = useI18n();
  const [question, setQuestion] = useState("");
  const [image, setImage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState("");
  const [asked, setAsked] = useState("");
  const [turns, setTurns] = useState<{ question: string; answer: string }[]>([]);
  const [followUp, setFollowUp] = useState("");
  const [saving, setSaving] = useState(false);
  const { userId } = useAuth();
  const [error, setError] = useState("");
  const explain = useServerFn(explainQuestion);
  const cat = useQuery(catalogQuery);
  const [level, setLevel] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const classIds = cat.data?.classes.filter((c) => c.level === level).map((c) => c.id) ?? [];
  const subjects = cat.data?.subjects.filter((s) => classIds.includes(s.class_id)) ?? [];
  const chapters = cat.data?.chapters.filter((c) => c.subject_id === subjectId) ?? [];
  const subject = subjects.find((s) => s.id === subjectId);
  const chapter = chapters.find((c) => c.id === chapterId);
  const bn = lang === "bn" || !!chapter;
  async function upload(file?: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError(bn ? "PNG, JPG বা WebP ছবি দিন (সর্বোচ্চ ৫ MB)।" : "Choose a PNG, JPG or WebP image, up to 5 MB."); return;
    }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") { setImage(reader.result); setError(""); } };
    reader.onerror = () => setError(bn ? "ছবি পড়া যায়নি।" : "Could not read the image.");
    reader.readAsDataURL(file);
  }
  async function ask() {
    if (!followUp.trim()) return;
    setBusy(true); setError("");
    const history = [{ question: asked, answer }, ...turns].slice(-6);
    try {
      const r = await explain({ data: { question: followUp, language: "bn", history, chapter: chapter && subject ? { level: level.toUpperCase(), subject: subject.name_bn, chapter: `${chapter.number}. ${chapter.name_bn}` } : undefined } });
      if (r.answer) { setTurns((t) => [...t, { question: followUp, answer: r.answer }]); setFollowUp(""); }
      setError(r.error ?? "");
    } catch { setError("ফলো-আপ উত্তর পাওয়া যায়নি। আবার চেষ্টা করুন।"); }
    finally { setBusy(false); }
  }
  async function save() {
    if (!userId) return;
    setSaving(true);
    const full = [answer, ...turns.map((t) => `\n— ফলো-আপ: ${t.question}\n${t.answer}`)].join("\n");
    const { error: e } = await supabase.from("saved_explanations").insert({ user_id: userId, question: asked.slice(0, 6000), answer: full.slice(0, 60000), chapter_label: chapter && subject ? `${level.toUpperCase()} · ${subject.name_bn} · ${chapter.number}. ${chapter.name_bn}` : null });
    setSaving(false);
    if (e) toast.error("সংরক্ষণ করা যায়নি"); else toast.success("সমাধান সংরক্ষিত হয়েছে");
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setAnswer("");
    try {
      const result = await explain({ data: { question, image, language: chapter ? "bn" : lang, chapter: chapter && subject ? { level, subject: subject.name_bn, chapter: `${chapter.number}. ${chapter.name_bn}` } : undefined } });
      setAnswer(result.answer); setError(result.error ?? "");
      if (result.answer) { setAsked(question || "(ছবির প্রশ্ন)"); setTurns([]); }
    } catch { setError(bn ? "সমাধান পাওয়া যায়নি। আবার চেষ্টা করুন।" : "Could not get a solution. Please try again."); }
    finally { setBusy(false); }
  }
  return <Container className="max-w-4xl">
    <div className="flex items-center gap-3"><Sparkles className="h-7 w-7 text-success" /><h1 className="font-display text-3xl font-bold">{bn ? "AI প্রশ্ন সমাধান" : "AI question help"}</h1></div>
    <form onSubmit={submit} className="mt-8 space-y-4">
      <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-3"><legend className="mb-2 text-sm text-muted-foreground">অধ্যায় নির্বাচন করলে ব্যাখ্যা সেই অধ্যায় অনুযায়ী বাংলায় হবে</legend>
        <select aria-label="শ্রেণি" className="border bg-card rounded-md px-3 py-2 text-sm w-full" value={level} onChange={(e) => { setLevel(e.target.value); setSubjectId(""); setChapterId(""); }}><option value="">শ্রেণি (SSC/HSC)</option><option value="ssc">SSC</option><option value="hsc">HSC</option></select>
        <select aria-label="বিষয়" className="border bg-card rounded-md px-3 py-2 text-sm w-full" value={subjectId} disabled={!level} onChange={(e) => { setSubjectId(e.target.value); setChapterId(""); }}><option value="">বিষয়</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name_bn}</option>)}</select>
        <select aria-label="অধ্যায়" className="border bg-card rounded-md px-3 py-2 text-sm w-full" value={chapterId} disabled={!subjectId} onChange={(e) => setChapterId(e.target.value)}><option value="">অধ্যায়</option>{chapters.map((c) => <option key={c.id} value={c.id}>{c.number}. {c.name_bn}</option>)}</select>
      </fieldset>
      <label htmlFor="question" className="font-medium">{bn ? "তোমার প্রশ্ন" : "Your question"}</label>
      <Textarea id="question" value={question} maxLength={6000} disabled={busy} onChange={(e) => setQuestion(e.target.value)} rows={6} placeholder={bn ? "প্রশ্ন লিখুন…" : "Enter a question…"} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-card px-4 py-2 text-sm"><ImagePlus className="h-4 w-4" />{bn ? "প্রশ্নের ছবি" : "Question image"}<input aria-label="Question image" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} className="sr-only" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ""; }} /></label>
        <Button type="submit" disabled={busy || (!question.trim() && !image)}>{busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{bn ? (busy ? "সমাধান তৈরি হচ্ছে…" : "সমাধান দেখুন") : (busy ? "Solving…" : "Explain solution")}</Button>
      </div>
      {image && <div className="relative w-fit"><img src={image} alt={bn ? "প্রশ্নের ছবি" : "Question image"} className="max-h-80 max-w-full rounded-md border object-contain" /><Button type="button" variant="outline" size="icon" aria-label="Remove image" className="absolute right-2 top-2" disabled={busy} onClick={() => setImage(undefined)}><X className="h-4 w-4" /></Button></div>}
    </form>
    {error && <p role="alert" className="mt-4 text-destructive">{error}</p>}
    {answer && <section aria-live="polite" className="mt-8 border-t pt-6"><h2 className="text-xl font-semibold">{bn ? "ধাপে ধাপে সমাধান" : "Step-by-step solution"}</h2><div className="mt-4 whitespace-pre-wrap break-words leading-8">{answer}</div>{turns.map((t, i) => <div key={i} className="mt-6 border-l-4 border-primary/40 pl-4"><p className="font-medium">ফলো-আপ: {t.question}</p><div className="mt-2 whitespace-pre-wrap break-words leading-8">{t.answer}</div></div>)}
      <div className="mt-6 space-y-2"><label htmlFor="followup" className="flex items-center gap-2 font-medium"><MessageCircleQuestion className="h-4 w-4" />আরও কিছু বুঝতে চাও? ফলো-আপ প্রশ্ন করো</label>
        <Textarea id="followup" rows={3} maxLength={6000} value={followUp} disabled={busy} onChange={(e) => setFollowUp(e.target.value)} placeholder="যেমন: ধাপ ২ আরও সহজ করে বুঝিয়ে দাও" />
        <div className="flex flex-wrap gap-2"><Button onClick={ask} disabled={busy || !followUp.trim()}>{busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}ব্যাখ্যা করো</Button>
        <Button variant="outline" onClick={save} disabled={saving || busy}><Bookmark className="mr-2 h-4 w-4" />সমাধান সংরক্ষণ</Button>
        <Button asChild variant="link"><Link to="/saved-explanations">সংরক্ষিত সমাধান</Link></Button></div></div>
      <p className="mt-6 text-sm text-muted-foreground">{bn ? "AI-এর উত্তরে ভুল থাকতে পারে। বই বা শিক্ষকের সাথে মিলিয়ে নিন।" : "AI can make mistakes. Check the answer with your textbook or teacher."}</p></section>}
  </Container>;
}