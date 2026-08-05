"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";

interface QA {
  q: { en: string; fr: string };
  a: { en: string; fr: string };
  keys: string[];
}

const KB: QA[] = [
  {
    keys: ["deposit", "fee", "10", "$10", "money", "pay", "cost", "dépôt", "frais"],
    q: { en: "What's the $10 fee?", fr: "C'est quoi les frais de 10 $ ?" },
    a: {
      en: "A $10 booking fee holds your spot. When you check in at the course it comes back as $10 TeeCredit plus points. Your green fee is paid at the pro shop — never through TEETOMIC.",
      fr: "Des frais de 10 $ retiennent votre place. À l'enregistrement au club, ils reviennent en crédit TeeCredit de 10 $ plus des points. Le droit de jeu se paie à la boutique — jamais via TEETOMIC.",
    },
  },
  {
    keys: ["cancel", "refund", "no-show", "cancellation", "annul", "rembours"],
    q: { en: "How does cancellation work?", fr: "Comment fonctionne l'annulation ?" },
    a: {
      en: "Free cancellation until the deadline shown on your booking. Cancel late or no-show and the $10 isn't returned — unless the slot gets re-filled before tee time, then it's refunded automatically.",
      fr: "Annulation gratuite jusqu'au délai indiqué. Annulation tardive ou absence : les 10 $ ne sont pas remis — sauf si la place est reprise avant le départ, alors c'est remboursé automatiquement.",
    },
  },
  {
    keys: ["points", "gold", "tier", "reward", "teecredit", "credit", "or", "récompense"],
    q: { en: "How do points and Gold work?", fr: "Comment marchent les points et Or ?" },
    a: {
      en: "Every check-in earns points. Hit 300 for Gold (waived fees, priority) and 600 for Gold Plus (skill matchmaking). Or get there instantly with TEETOMIC+.",
      fr: "Chaque enregistrement rapporte des points. 300 pour Or (frais offerts, priorité), 600 pour Or Plus (jumelage). Ou passez-y d'un coup avec TEETOMIC+.",
    },
  },
  {
    keys: ["alert", "standby", "ping", "notify", "alerte"],
    q: { en: "What are standby alerts?", fr: "C'est quoi les alertes standby ?" },
    a: {
      en: "Set your days, time window, region and max price. The moment a matching tee time is released, we ping you instantly so you can grab it.",
      fr: "Choisissez jours, plage horaire, région et prix max. Dès qu'un départ correspond, on vous ping aussitôt pour le saisir.",
    },
  },
  {
    keys: ["business", "course", "operator", "pro shop", "list", "affaires", "club"],
    q: { en: "I run a course — how do I join?", fr: "Je gère un club — comment m'inscrire ?" },
    a: {
      en: "Tap 'I run a course' on the welcome screen and enter your business code. Create your Business Corner account; once approved you can release empty slots and set your hours.",
      fr: "Touchez « Je gère un club » à l'accueil et entrez votre code affaires. Créez votre Espace affaires ; une fois approuvé, publiez vos départs et réglez vos heures.",
    },
  },
];

export function HelpCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<QA | null>(null);

  if (!open) return null;

  function ask(q: string) {
    const low = q.toLowerCase();
    const match =
      KB.find((item) => item.keys.some((k) => low.includes(k))) ??
      KB.find((item) => item.q[locale].toLowerCase().includes(low));
    setAnswer(match ?? null);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-forest/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-cream shadow-card-lg animate-fade-in sm:h-[70vh] sm:rounded-3xl">
        <div className="flex items-center justify-between bg-forest px-5 py-4 text-cream">
          <span className="flex items-center gap-2 font-display font-bold">🤖 {t("help.title")}</span>
          <button onClick={onClose} aria-label={t("acct.close")} className="text-cream/70 hover:text-cream">✕</button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          <p className="text-sm text-forest/60">{t("help.intro")}</p>

          {answer && (
            <div className="rounded-2xl bg-lime-soft p-4 animate-fade-in">
              <p className="font-semibold text-forest">{answer.q[locale]}</p>
              <p className="mt-1 text-sm text-forest/75">{answer.a[locale]}</p>
            </div>
          )}
          {query && !answer && (
            <div className="rounded-2xl bg-white p-4 text-sm text-forest/70">{t("help.noMatch")}</div>
          )}

          <p className="pt-2 text-xs font-bold uppercase tracking-wide text-forest/40">{t("help.common")}</p>
          <div className="space-y-2">
            {KB.map((item, i) => (
              <button
                key={i}
                onClick={() => setAnswer(item)}
                className={cn(
                  "w-full rounded-2xl border border-forest/10 bg-white p-3 text-left text-sm font-semibold text-forest hover:border-forest/30",
                  answer === item && "border-forest/40 bg-lime-soft",
                )}
              >
                {item.q[locale]}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-forest/10 bg-white p-3">
          <div className="flex gap-2">
            <input
              className="input flex-1 py-2.5"
              placeholder={t("help.placeholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(query)}
            />
            <button onClick={() => ask(query)} className="btn-lime px-4 py-2.5">
              {t("help.send")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
