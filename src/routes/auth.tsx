import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ mode: s['mode'] === "register" ? "register" : undefined }) as { mode?: "register" | undefined },
  head: () => ({ meta: [
    { title: "লগইন / রেজিস্টার | Smart Education BD" },
    { name: "description", content: "আপনার অ্যাকাউন্টে প্রবেশ করুন বা নতুন অ্যাকাউন্ট খুলুন।" },
    { property: "og:title", content: "লগইন" },
    { property: "og:description", content: "Smart Education BD অ্যাকাউন্ট" },
  ] }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("সঠিক ইমেইল দিন").max(255),
  password: z.string().min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষর").max(72),
  name: z.string().trim().max(100).optional(),
});

function AuthPage() {
  const { mode: m } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "register">(m === "register" ? "register" : "login");
  const [form, setForm] = useState({ email: "", password: "", name: "", level: "ssc" });
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: { preventDefault(): void }) {
    e.preventDefault();
    const p = schema.safeParse(form);
    if (!p.success) return toast.error(p.error.issues[0]?.message ?? "ভুল তথ্য");
    if (mode === "register" && (form.name.trim().length < 2)) return toast.error("নাম লিখুন");
    setBusy(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      setBusy(false);
      if (error) return toast.error(error.message);
      navigate({ to: "/dashboard" });
    } else {
      const { error } = await supabase.auth.signUp({ email: form.email, password: form.password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: form.name.trim(), level: form.level } } });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("নিশ্চিতকরণ লিংক আপনার ইমেইলে পাঠানো হয়েছে।");
      setMode("login");
    }
  }
  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
  }
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-3xl border bg-card p-8 shadow-card">
        <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "register")}>
          <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">লগইন</TabsTrigger><TabsTrigger value="register">রেজিস্টার</TabsTrigger></TabsList>
        </Tabs>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "register" && (
            <>
              <div><Label>পূর্ণ নাম</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} /></div>
              <div><Label>শ্রেণি</Label>
                <select className="h-10 w-full rounded-md border bg-card px-3 text-sm" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                  <option value="ssc">SSC</option><option value="hsc">HSC</option>
                </select></div>
            </>
          )}
          <div><Label>ইমেইল</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>পাসওয়ার্ড</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "অপেক্ষা করুন..." : mode === "login" ? "লগইন" : "অ্যাকাউন্ট খুলুন"}</Button>
        </form>
        <Button variant="outline" className="mt-3 w-full" onClick={google}>Google দিয়ে চালিয়ে যান</Button>
      </div>
    </div>
  );
}
