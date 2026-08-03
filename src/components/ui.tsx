"use client";

import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/context";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function DealCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export function EmptyState({
  icon = "🏌️",
  title,
  body,
  action,
}: {
  icon?: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-forest/20 bg-white/50 px-6 py-14 text-center">
      <span className="text-4xl" aria-hidden>
        {icon}
      </span>
      <h3 className="font-display text-lg font-bold text-forest">{title}</h3>
      {body && <p className="max-w-sm text-sm text-forest/60">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
      <span className="text-3xl" aria-hidden>
        ⚠️
      </span>
      <h3 className="font-display font-bold text-red-800">{t("common.errorTitle")}</h3>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost text-sm">
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "lime" | "forest" | "amber" | "red" | "sky";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-forest/10 text-forest",
    lime: "bg-lime text-forest",
    forest: "bg-forest text-cream",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
    sky: "bg-sky-100 text-sky-800",
  };
  return <span className={cn("chip", tones[tone], className)}>{children}</span>;
}
