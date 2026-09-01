"use client";

import { useState } from "react";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n/context";
import { api } from "@/lib/api-client";

/** Shown right after account creation — the TEETOMIC+ upsell. */
export function PlusOfferModal() {
  const { showPlusOffer, dismissPlusOffer, golfer } = useSession();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!showPlusOffer) return null;

  async function subscribe() {
    setBusy(true);
    try {
      const res = await api.accountAction({
        golferId: golfer.id,
        action: "subscribe",
        golferEmail: golfer.email || undefined,
      });
      // Real Stripe path returns a hosted Checkout URL — send them there to pay.
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
        return;
      }
      // Demo / no-price path: subscription flipped server-side.
      setBusy(false);
      setDone(true);
      setTimeout(() => dismissPlusOffer(), 1400);
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[69] flex items-center justify-center bg-forest/95 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-cream shadow-card-lg animate-fade-in">
        <div className="bg-gradient-to-br from-amber-300 via-lime to-lime-dark px-6 py-7 text-center">
          <p className="font-display text-3xl font-bold text-forest">✦ TEETOMIC+</p>
          <p className="mt-1 text-sm font-semibold text-forest/70">Gold Plus</p>
        </div>
        <div className="p-6">
          {done ? (
            <p className="py-6 text-center font-display text-xl font-bold text-forest">{t("plus.done")}</p>
          ) : (
            <>
              <h2 className="font-display text-lg font-bold text-forest">{t("plus.title")}</h2>
              <p className="mt-1 text-sm text-forest/60">{t("plus.sub")}</p>
              <ul className="mt-4 space-y-2 text-sm font-semibold text-forest/80">
                <li>💸 {t("plus.perk1")}</li>
                <li>⚡ {t("plus.perk2")}</li>
                <li>🎯 {t("plus.perk3")}</li>
              </ul>
              <button onClick={subscribe} disabled={busy} className="btn-lime mt-5 w-full">
                {busy ? t("common.loading") : t("plus.get")}
              </button>
              <button
                onClick={dismissPlusOffer}
                className="mt-2 w-full text-center text-sm font-semibold text-forest/50"
              >
                {t("plus.later")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
