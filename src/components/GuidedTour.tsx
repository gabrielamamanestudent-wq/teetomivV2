"use client";

import { useLayoutEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n/context";
import type { DictKey } from "@/lib/i18n/dictionary";

const STEPS: { tour: string; t: DictKey; b: DictKey }[] = [
  { tour: "browse", t: "tour.b.browse.t", b: "tour.b.browse.b" },
  { tour: "alerts", t: "tour.b.alerts.t", b: "tour.b.alerts.b" },
  { tour: "rewards", t: "tour.b.rewards.t", b: "tour.b.rewards.b" },
  { tour: "bookings", t: "tour.b.bookings.t", b: "tour.b.bookings.b" },
];

interface Spot {
  top: number;
  left: number;
  width: number;
  height: number;
  centerX: number;
  tipBottom: number;
}

/** Arrow-guided coach marks that spotlight each function in the bottom nav,
 *  ending with a lead into account creation. */
export function GuidedTour() {
  const { showTour, openCreate, endTour } = useSession();
  const { t } = useI18n();
  const [i, setI] = useState(0);
  const [spot, setSpot] = useState<Spot | null>(null);
  const finish = i >= STEPS.length;

  useLayoutEffect(() => {
    if (!showTour || finish) {
      setSpot(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector(`[data-tour="${STEPS[i].tour}"]`) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0) {
          setSpot({
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
            centerX: r.left + r.width / 2,
            tipBottom: window.innerHeight - r.top + 14,
          });
          return;
        }
      }
      setSpot(null);
    };
    measure();
    const id = setTimeout(measure, 150);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(id);
      window.removeEventListener("resize", measure);
    };
  }, [i, showTour, finish]);

  if (!showTour) return null;

  const advance = () => setI((n) => n + 1);

  // Finish card — leads into account creation.
  if (finish) {
    return (
      <div className="fixed inset-0 z-[65] flex items-center justify-center bg-forest/85 p-6 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-3xl bg-cream p-7 text-center shadow-card-lg animate-fade-in">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lime text-3xl">
            ⛳
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold text-forest">{t("tour.finishTitle")}</h2>
          <p className="mt-2 text-sm text-forest/60">{t("tour.finishBody")}</p>
          <button onClick={openCreate} className="btn-lime mt-5 w-full">
            {t("tour.finishCta")}
          </button>
        </div>
      </div>
    );
  }

  const step = STEPS[i];

  return (
    <div className="fixed inset-0 z-[65]" onClick={advance} role="button" tabIndex={-1}>
      {/* dim + spotlight */}
      {spot ? (
        <div
          className="pointer-events-none absolute rounded-2xl border-[3px] border-lime transition-all duration-300"
          style={{
            top: spot.top - 4,
            left: spot.left - 2,
            width: spot.width + 4,
            height: spot.height + 8,
            boxShadow: "0 0 0 9999px rgba(11,61,46,0.86)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-forest/86" />
      )}

      {/* tooltip */}
      <div
        className="absolute animate-fade-in"
        style={
          spot
            ? { left: 16, right: 16, bottom: spot.tipBottom }
            : { left: 16, right: 16, top: "40%" }
        }
      >
        <div className="relative mx-auto max-w-sm rounded-2xl bg-cream p-4 shadow-card-lg">
          <p className="text-[11px] font-bold uppercase tracking-wide text-forest/40">
            {t("tour.stepOf", { n: String(i + 1), total: String(STEPS.length) })}
          </p>
          <h3 className="mt-0.5 font-display text-lg font-bold text-forest">{t(step.t)}</h3>
          <p className="mt-0.5 text-sm text-forest/65">{t(step.b)}</p>
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                endTour();
              }}
              className="text-xs font-semibold text-forest/50"
            >
              {t("tour.skip")}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                advance();
              }}
              className="rounded-full bg-forest px-4 py-1.5 text-sm font-bold text-lime"
            >
              {t("tour.next")} →
            </button>
          </div>
          {/* downward caret pointing at the nav item */}
          {spot && (
            <div
              className="absolute h-4 w-4 rotate-45 bg-cream"
              style={{
                bottom: -6,
                left: Math.max(12, Math.min(spot.centerX - 16, 300)),
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
