import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Menu, X, Bell, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useI18n, type DictKey } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const nav: { to: string; k: DictKey }[] = [
  { to: "/", k: "home" },
  { to: "/catalog", k: "catalog" },
  { to: "/materials", k: "materials" },
  { to: "/exams", k: "exams" },
  { to: "/board-questions", k: "boardQuestions" },
  { to: "/notices", k: "notices" },
  { to: "/leaderboard", k: "leaderboard" },
];

export function SiteHeader() {
  const { t, lang, setLang } = useI18n();
  const { session, isStaff, isAdmin, userId } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const unread = useQuery({
    queryKey: ["unread", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false);
      return count ?? 0;
    },
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-navy dark:text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-hero text-navy-foreground"><GraduationCap className="h-5 w-5" /></span>
          Smart Education <span className="text-success">BD</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-primary" }}>
              {t(n.k)}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLang(lang === "bn" ? "en" : "bn")} aria-label="Language">
            {lang === "bn" ? "EN" : "বাং"}
          </Button>
          {session ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden xl:inline-flex"><Link to="/ask">{lang === "bn" ? "AI সমাধান" : "AI help"}</Link></Button>
              <Button asChild variant="ghost" size="sm" className="hidden xl:inline-flex"><Link to="/consultations">{lang === "bn" ? "পরামর্শ" : "Consultations"}</Link></Button>
              <Link to="/dashboard" search={{ tab: "notifications" }} className="relative rounded-lg p-2 hover:bg-secondary" aria-label={t("notifications")}>
                <Bell className="h-5 w-5" />
                {!!unread.data && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />}
              </Link>
              {isStaff && (
                <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
                  <Link to="/admin"><ShieldCheck className="mr-1 h-4 w-4" />{isAdmin ? t("admin") : t("teacher")}</Link>
                </Button>
              )}
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/dashboard"><LayoutDashboard className="mr-1 h-4 w-4" />{t("dashboard")}</Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label={t("logout")}><LogOut className="h-4 w-4" /></Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/auth">{t("login")}</Link></Button>
              <Button asChild size="sm"><Link to="/auth" search={{ mode: "register" }}>{t("register")}</Link></Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <div className="border-t bg-background px-4 py-3 lg:hidden">
          <div className="grid gap-1">
            {[...nav, { to: "/about", k: "about" as DictKey }, { to: "/contact", k: "contact" as DictKey }].map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary">{t(n.k)}</Link>
            ))}
            {session && <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary">{t("dashboard")}</Link>}
            {session && <Link to="/history" search={{ subject: undefined }} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary">{lang === "bn" ? "অনুশীলন ইতিহাস" : "Practice history"}</Link>}
            <Link to="/exam-calendar" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary">{lang === "bn" ? "পরীক্ষার ক্যালেন্ডার" : "Exam calendar"}</Link>
            {session && <Link to="/ask" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary">{lang === "bn" ? "AI প্রশ্ন সমাধান" : "AI question help"}</Link>}
            {session && <Link to="/saved-explanations" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary">{lang === "bn" ? "সংরক্ষিত সমাধান" : "Saved explanations"}</Link>}
            {session && <Link to="/consultations" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary">{lang === "bn" ? "শিক্ষক পরামর্শ" : "Teacher consultations"}</Link>}
            {isStaff && <Link to="/admin" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary">{isAdmin ? t("admin") : t("teacher")}</Link>}
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-20 bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-display text-lg font-bold"><GraduationCap className="h-5 w-5" /> Smart Education BD</div>
          <p className="mt-3 max-w-sm text-sm opacity-75">{t("footerTag")}</p>
        </div>
        <div className="grid gap-2 text-sm opacity-85">
          <Link to="/catalog">{t("catalog")}</Link>
          <Link to="/materials">{t("materials")}</Link>
          <Link to="/exams">{t("exams")}</Link>
          <Link to="/exam-calendar">পরীক্ষার ক্যালেন্ডার / Exam calendar</Link>
          <Link to="/history" search={{ subject: undefined }}>অনুশীলন ইতিহাস / Practice history</Link>
          <Link to="/ask">AI প্রশ্ন সমাধান / AI help</Link>
          <Link to="/consultations">শিক্ষক পরামর্শ / Consultations</Link>
          <Link to="/board-questions">{t("boardQuestions")}</Link>
        </div>
        <div className="grid gap-2 text-sm opacity-85">
          <Link to="/about">{t("about")}</Link>
          <Link to="/contact">{t("contact")}</Link>
          <Link to="/notices">{t("notices")}</Link>
          <Link to="/leaderboard">{t("leaderboard")}</Link>
        </div>
      </div>
      <div className="border-t border-navy-foreground/10 py-4 text-center text-xs opacity-60">© {new Date().getFullYear()} Smart Education BD</div>
    </footer>
  );
}
