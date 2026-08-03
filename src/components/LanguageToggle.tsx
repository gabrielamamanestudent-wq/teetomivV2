"use client";

import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-forest/15 bg-white p-0.5 text-xs font-bold",
        compact && "text-[11px]",
      )}
      role="group"
      aria-label="Language"
    >
      {(["en", "fr"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            "rounded-full px-2.5 py-1 transition-colors",
            locale === l ? "bg-forest text-cream" : "text-forest/60 hover:text-forest",
          )}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
