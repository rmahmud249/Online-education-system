import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Clock, FileText, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n, toBn } from "@/lib/i18n";
import { materialTypeLabel, examTypeLabel, scopeLabel, fmtDate } from "@/lib/queries";

type Material = { id: string; title: string; description: string | null; type: string; views: number; year: number | null };

export function MaterialCard({ m, subject, backgroundColor }: { m: Material; subject?: string; backgroundColor?: string }) {
  const { lang } = useI18n();
  return (
    <Link to="/materials/$id" params={{ id: m.id }}
      className="group flex flex-col rounded-2xl border p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40"
      style={{ backgroundColor: backgroundColor ?? "var(--color-card)" }}>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary"><FileText className="h-4 w-4" /></span>
        <Badge variant="secondary">{materialTypeLabel[m.type]?.[lang === "bn" ? 0 : 1] ?? m.type}</Badge>
        {m.year && <Badge variant="outline">{toBn(m.year, lang)}</Badge>}
      </div>
      <h3 className="mt-3 font-semibold leading-snug group-hover:text-primary">{m.title}</h3>
      {m.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.description}</p>}
      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{subject}</span>
        <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{toBn(m.views, lang)}</span>
      </div>
    </Link>
  );
}

type Exam = { id: string; title: string; type: string; scope: string; duration_minutes: number; total_marks: number; starts_at: string | null; ends_at: string | null };

export function examStatus(e: Pick<Exam, "starts_at" | "ends_at">) {
  const now = Date.now();
  if (e.starts_at && new Date(e.starts_at).getTime() > now) return "upcoming";
  if (e.ends_at && new Date(e.ends_at).getTime() < now) return "ended";
  return "live";
}

export function ExamCard({ e, action }: { e: Exam; action?: ReactNode }) {
  const { lang, t } = useI18n();
  const st = examStatus(e);
  return (
    <div className="flex flex-col rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={st === "live" ? "bg-success text-success-foreground" : st === "upcoming" ? "bg-warning text-navy" : ""} variant={st === "ended" ? "outline" : "default"}>
          {st === "live" ? (lang === "bn" ? "চলমান" : "Live") : st === "upcoming" ? (lang === "bn" ? "আসন্ন" : "Upcoming") : (lang === "bn" ? "শেষ" : "Ended")}
        </Badge>
        <Badge variant="secondary">{examTypeLabel[e.type]}</Badge>
        <Badge variant="outline">{scopeLabel[e.scope]?.[lang === "bn" ? 0 : 1]}</Badge>
      </div>
      <h3 className="mt-3 font-semibold">{e.title}</h3>
      <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{toBn(e.duration_minutes, lang)} {t("minutes")}</span>
        <span>{toBn(e.total_marks, lang)} {t("marks")}</span>
      </div>
      {st === "upcoming" && e.starts_at && <p className="mt-1 text-xs text-muted-foreground">{fmtDate(e.starts_at, lang)}</p>}
      {action && <div className="mt-auto pt-4">{action}</div>}
    </div>
  );
}
