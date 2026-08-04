"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { GolferScene } from "./GolferScene";
import { cn } from "@/lib/cn";

type Art = "empty" | "ping" | "price" | "reward" | "gold" | "release" | "cash" | "count";

interface Beat {
  en: string;
  fr: string;
  art: Art;
  swing?: boolean;
  fly?: boolean;
  cta?: { en: string; fr: string };
}

const GOLFER_BEATS: Beat[] = [
  { en: "A 7 AM tee time just went empty.", fr: "Un départ de 7 h vient de se libérer.", art: "empty" },
  { en: "TEETOMIC pings golfers on standby.", fr: "TEETOMIC ping les golfeurs en attente.", art: "ping" },
  { en: "Grab it — up to 60% off.", fr: "Saisis-le — jusqu'à 60 % de rabais.", art: "price", swing: true, fly: true },
  { en: "Just a $10 fee — back as TeeCredit + points.", fr: "Juste 10 $ — remis en TeeCredit + points.", art: "reward" },
  {
    en: "Play. Earn. Reach Gold.",
    fr: "Jouez. Gagnez. Atteignez Or.",
    art: "gold",
    cta: { en: "Start exploring", fr: "Commencer" },
  },
];

const COURSE_BEATS: Beat[] = [
  { en: "Every night, empty tee times vanish.", fr: "Chaque soir, des départs vides disparaissent.", art: "empty" },
  { en: "Release them in one tap.", fr: "Publiez-les en un geste.", art: "release", swing: true, fly: true },
  { en: "Standby golfers get pinged instantly.", fr: "Les golfeurs en attente sont pingés aussitôt.", art: "ping" },
  { en: "They show up. You keep 100%.", fr: "Ils se présentent. Vous gardez 100 %.", art: "cash" },
  {
    en: "Recover ~$1,800 a month.",
    fr: "Récupérez ~1 800 $ par mois.",
    art: "count",
    cta: { en: "Create your pro shop", fr: "Créer votre boutique" },
  },
];

const BEAT_MS = 3600;

export function ConceptDemo({
  mode,
  onDone,
}: {
  mode: "golfer" | "course";
  onDone: () => void;
}) {
  const { t, locale } = useI18n();
  const beats = mode === "course" ? COURSE_BEATS : GOLFER_BEATS;
  const [i, setI] = useState(0);
  const [swinging, setSwinging] = useState(false);
  const [flying, setFlying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const beat = beats[i];
  const last = i === beats.length - 1;

  // Fire the swing/ball on beats that call for it.
  useEffect(() => {
    setSwinging(false);
    setFlying(false);
    const raf = requestAnimationFrame(() => {
      if (beat.swing) setSwinging(true);
      if (beat.fly) setFlying(true);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  // Auto-advance until the last beat.
  useEffect(() => {
    if (last) return;
    timer.current = setTimeout(() => setI((n) => n + 1), BEAT_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [i, last]);

  function advance() {
    if (timer.current) clearTimeout(timer.current);
    if (last) onDone();
    else setI((n) => n + 1);
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-forest">
      {/* top bar */}
      <div className="flex items-center justify-between p-4">
        <div className="flex gap-1.5">
          {beats.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "h-1.5 rounded-full transition-all",
                idx === i ? "w-7 bg-lime" : idx < i ? "w-4 bg-lime/50" : "w-4 bg-cream/20",
              )}
            />
          ))}
        </div>
        <button onClick={onDone} className="text-sm font-semibold text-cream/60 hover:text-cream">
          {t("tour.skip")}
        </button>
      </div>

      {/* scene */}
      <div className="relative mx-4 h-[42vh] min-h-[260px] overflow-hidden rounded-3xl shadow-card-lg">
        <GolferScene swinging={swinging} flying={flying} />
        <ArtOverlay key={i} art={beat.art} mode={mode} locale={locale} />
      </div>

      {/* caption */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-8 text-center"
        onClick={advance}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && advance()}
      >
        <h2 key={i} className="max-w-md font-display text-3xl font-bold leading-tight text-cream anim-pop">
          {locale === "fr" ? beat.fr : beat.en}
        </h2>
      </div>

      {/* cta */}
      <div className="flex flex-col items-center gap-3 p-8">
        <button onClick={advance} className="btn-lime w-full max-w-sm text-base">
          {last && beat.cta ? (locale === "fr" ? beat.cta.fr : beat.cta.en) + " →" : `${t("tour.next")} →`}
        </button>
        {!last && (
          <span className="text-xs font-semibold uppercase tracking-wide text-cream/40">
            {t("tour.tap")}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-beat visual accents layered over the scene
// ---------------------------------------------------------------------------
function ArtOverlay({ art, mode, locale }: { art: Art; mode: string; locale: string }) {
  if (art === "empty") {
    return (
      <div className="pointer-events-none absolute left-4 top-4 anim-pop">
        <div className="rounded-2xl bg-white/95 px-3 py-2 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-wide text-forest/50">
            {mode === "course" ? (locale === "fr" ? "Départ vide" : "Empty slot") : "7:10 AM"}
          </p>
          <p className="font-display text-lg font-bold text-forest/40 line-through">7:10 · —</p>
        </div>
      </div>
    );
  }
  if (art === "ping") {
    return (
      <div className="pointer-events-none absolute inset-0">
        <div className="ping-dot" style={{ left: "22%", top: "24%" }} />
        <div className="ping-dot" style={{ left: "60%", top: "18%", animationDelay: "0.4s" }} />
        <div className="ping-dot" style={{ left: "44%", top: "36%", animationDelay: "0.7s" }} />
        <div className="absolute right-4 top-4 anim-pop rounded-2xl bg-lime px-3 py-1.5 text-sm font-bold text-forest shadow-card">
          🔔 {locale === "fr" ? "Nouvelle alerte" : "New match"}
        </div>
      </div>
    );
  }
  if (art === "price" || art === "release") {
    return (
      <div className="pointer-events-none absolute right-4 top-4 anim-pop">
        <div className="rounded-2xl bg-white/95 px-3 py-2 text-right shadow-card">
          {art === "release" ? (
            <p className="font-display text-sm font-bold text-lime-dark">● LIVE</p>
          ) : null}
          <p className="flex items-baseline gap-1.5">
            <span className="text-xs text-forest/40 line-through">$95</span>
            <span className="font-display text-2xl font-bold text-forest">$42</span>
          </p>
        </div>
      </div>
    );
  }
  if (art === "reward") {
    return (
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-6 top-6 anim-pop rounded-2xl bg-white/95 px-3 py-2 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-wide text-forest/50">
            {locale === "fr" ? "À l'enregistrement" : "At check-in"}
          </p>
          <p className="font-display text-base font-bold text-forest">$10 → TeeCredit</p>
        </div>
        <div
          className="anim-rise absolute right-10 top-1/2 font-display text-2xl font-bold text-lime"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,.3)" }}
        >
          +60 pts
        </div>
      </div>
    );
  }
  if (art === "gold") {
    return (
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-6">
        <div className="anim-pop rounded-full bg-gradient-to-r from-amber-300 to-lime px-5 py-2 font-display text-xl font-bold text-forest shadow-card-lg">
          ★ {locale === "fr" ? "Or Plus" : "Gold Plus"}
        </div>
      </div>
    );
  }
  if (art === "cash") {
    return (
      <div className="pointer-events-none absolute right-6 top-6 anim-pop rounded-2xl bg-forest px-4 py-2 text-cream shadow-card-lg">
        <p className="text-[10px] font-bold uppercase tracking-wide text-lime">
          {locale === "fr" ? "Vous gardez" : "You keep"}
        </p>
        <p className="font-display text-2xl font-bold">100%</p>
      </div>
    );
  }
  if (art === "count") {
    return <CountUp />;
  }
  return null;
}

function CountUp() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const target = 1800;
    const start = performance.now();
    const dur = 1600;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-6 flex justify-center">
      <div className="anim-pop rounded-2xl bg-white/95 px-5 py-2 text-center shadow-card-lg">
        <p className="font-display text-3xl font-bold tabular-nums text-forest">
          ${n.toLocaleString()}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-wide text-forest/50">recovered / mo</p>
      </div>
    </div>
  );
}
