import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Container } from "@/components/page";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const schema = z.object({ name: z.string().trim().min(2, "নাম লিখুন").max(100), email: z.string().trim().email("সঠিক ইমেইল দিন").max(255), message: z.string().trim().min(5, "বার্তা লিখুন").max(2000) });

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "যোগাযোগ | Smart Education BD" }, { name: "description", content: "প্রশ্ন বা মতামত জানাতে আমাদের সাথে যোগাযোগ করুন।" }, { property: "og:title", content: "যোগাযোগ" }, { property: "og:description", content: "আমাদের সাথে যোগাযোগ" }] }),
  component: Contact,
});

function Contact() {
  const [f, setF] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);
  async function send(e: { preventDefault(): void }) {
    e.preventDefault();
    const p = schema.safeParse(f);
    if (!p.success) return toast.error(p.error.issues[0]?.message ?? "ভুল তথ্য");
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert(p.data as { name: string; email: string; message: string });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("বার্তা পাঠানো হয়েছে, ধন্যবাদ!");
    setF({ name: "", email: "", message: "" });
  }
  return (<><PageHeader title="যোগাযোগ" /><Container className="max-w-xl"><form onSubmit={send} className="space-y-4 rounded-2xl border bg-card p-6">
    <Input placeholder="নাম" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
    <Input placeholder="ইমেইল" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
    <Textarea placeholder="বার্তা" rows={5} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
    <Button disabled={busy} className="w-full">পাঠান</Button></form></Container></>);
}
