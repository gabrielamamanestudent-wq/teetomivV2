"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";

interface Step {
  icon: string;
  en: { title: string; body: string };
  fr: { title: string; body: string };
  href?: string;
}

const STEPS: Step[] = [
  {
    icon: "⛳",
    en: { title: "Last-minute tee times", body: "TEETOMIC is Montreal's standby list for golf. Empty tee times, up to 60% off — grabbed in seconds." },
    fr: { title: "Départs de dernière minute", body: "TEETOMIC est la liste d'attente golf de Montréal. Des départs vides, jusqu'à 60 % de rabais — saisis en secondes." },
  },
  {
    icon: "🔔",
    en: { title: "Set a standby alert", body: "Pick your days, time window, region and max price. We ping you the instant a matching slot goes live." },
    fr: { title: "Créez une alerte standby", body: "Choisissez vos jours, plage horaire, région et prix max. On vous ping dès qu'un départ correspond." },
  },
  {
    icon: "🎟️",
    en: { title: "Reserve for $10", body: "A $10 booking fee locks your spot — it comes back as TeeCredit at check-in, plus points toward Gold. Pay your green fee at the course." },
    fr: { title: "Réservez pour 10 $", body: "Des frais de 10 $ verrouillent votre place — remis en TeeCredit à l'enregistrement, avec des points vers Or. Payez le droit de jeu au club." },
  },
  {
    icon: "🏅",
    en: { title: "Earn Gold & Gold Plus", body: "Every check-in earns points. Hit Gold for waived fees and priority, Gold Plus for skill-based matchmaking." },
    fr: { title: "Atteignez Or et Or Plus", body: "Chaque enregistrement rapporte des points. Or pour les frais offerts et la priorité, Or Plus pour le jumelage selon le calibre." },
    href: "/rewards",
  },
  {
    icon: "🏪",
    en: { title: "Courses recover lost revenue", body: "Pro shops push empty slots in one tap and keep 100% of the green fee. That's the whole pitch — now go explore." },
    fr: { title: "Les clubs récupèrent leurs revenus", body: "Les boutiques publient les départs vides en un geste et gardent 100 % du droit de jeu. Voilà le pitch — explorez maintenant." },
    href: "/browse",
  },
];

export function Walkthrough() {
  const { showWalkthrough, finishWalkthrough } = useSession();
  const { t, locale } = useI18n();
  const router = useRouter();
  const [i, setI] = useState(0);

  if (!showWalkthrough) return null;

  const step = STEPS[i];
  const copy = locale === "fr" ? step.fr : step.en;
  const last = i === STEPS.length - 1;

  function next() {
    if (last) {
      finishWalkthrough();
      router.push("/browse");
      return;
    }
    if (step.href) router.push(step.href);
    setI((n) => n + 1);
  }

  function done() {
    finishWalkthrough();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-forest text-cream"
      onClick={next}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && next()}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex gap-1.5">
          {STEPS.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "h-1.5 rounded-full transition-all",
                idx === i ? "w-7 bg-lime" : idx < i ? "w-4 bg-lime/50" : "w-4 bg-cream/20",
              )}
            />
          ))}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            done();
          }}
          className="text-sm font-semibold text-cream/60 hover:text-cream"
        >
          {t("tour.skip")}
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div
          key={i}
          className="flex h-24 w-24 items-center justify-center rounded-3xl bg-lime/15 text-6xl animate-fade-in"
        >
          {step.icon}
        </div>
        <h2 key={`t${i}`} className="mt-8 max-w-sm font-display text-3xl font-bold leading-tight animate-fade-in">
          {copy.title}
        </h2>
        <p key={`b${i}`} className="mt-3 max-w-sm text-cream/75 animate-fade-in">
          {copy.body}
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 p-8">
        <button
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="btn-lime w-full max-w-sm text-base"
        >
          {last ? t("tour.start") : `${t("tour.next")} →`}
        </button>
        <span className="text-xs font-semibold uppercase tracking-wide text-cream/40">
          {t("tour.tap")}
        </span>
      </div>
    </div>
  );
}
