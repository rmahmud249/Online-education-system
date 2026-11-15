import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function LoadingState({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /> {label ?? t("loading")}
    </div>
  );
}

export function EmptyState({ title, hint }: { title?: string; hint?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-12 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground" />
      <p className="font-medium">{title ?? t("empty")}</p>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useI18n();
  const msg = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error);
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-10 text-center">
      <AlertTriangle className="h-7 w-7 text-destructive" />
      <p className="font-medium">{t("error")}</p>
      <p className="max-w-md text-sm text-muted-foreground">{msg}</p>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>{t("retry")}</Button>}
    </div>
  );
}

export function QueryState<T>({ q, children, empty }: {
  q: { isLoading: boolean; error: unknown; data: T | undefined; refetch: () => unknown };
  children: (d: T) => ReactNode;
  empty?: (d: T) => boolean;
}) {
  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (q.data === undefined || (empty && empty(q.data))) return <EmptyState />;
  return <>{children(q.data)}</>;
}
