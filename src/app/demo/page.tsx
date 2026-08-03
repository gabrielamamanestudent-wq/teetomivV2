"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

const ACCOUNTS = [
  { role: "Golfer", email: "alex@demo.golf", password: "golf1234", note: "Has alerts + bookings" },
  { role: "Golfer", email: "marie@demo.golf", password: "golf1234", note: "Refund-on-refill example" },
  { role: "Golfer", email: "sam@demo.golf", password: "golf1234", note: "No-show example" },
  { role: "Operator", email: "operator@demo.golf", password: "shop1234", note: "Héron Bleu pro shop" },
  { role: "Admin", email: "admin@demo.golf", password: "admin1234", note: "Internal metrics + reset" },
];

const SCRIPT = [
  { t: "0:00", en: "Open the landing page. Point at the live ticker of just-released deals and the ‘$15 refundable deposit’ promise.", fr: "Ouvrez la page d'accueil. Montrez le bandeau d'offres et la promesse « dépôt remboursable de 15 $ »." },
  { t: "0:10", en: "Tap Browse. Filter to ‘Dawn patrol’ + your region. Watch the countdown badges tick.", fr: "Touchez Parcourir. Filtrez « Aube » + votre région. Les comptes à rebours défilent." },
  { t: "0:25", en: "Open a deal. Show struck-through rack price vs live price, pick 2 players, tap Reserve.", fr: "Ouvrez une offre. Montrez le prix barré vs prix en direct, choisissez 2 joueurs, touchez Réserver." },
  { t: "0:35", en: "On the deposit screen say: ‘Only $15 now, green fee is paid at the course.’ Pay with 4242. Land on the QR confirmation.", fr: "À l'écran de dépôt : « Seulement 15 $ maintenant, le droit de jeu se paie au club. » Payez avec 4242. Confirmation QR." },
  { t: "0:55", en: "Switch to the Pro shop tab. Tap an open slot → accept the suggested price → Push to TEETOMIC. Show ‘alert-holders notified’.", fr: "Onglet Boutique. Touchez un créneau → acceptez le prix suggéré → Publier. Montrez « détenteurs d'alertes notifiés »." },
  { t: "1:15", en: "Open the Check-in queue. Tap ‘Checked in’ on your booking → deposit auto-refunds. Point at the confirmation.", fr: "File d'enregistrement. Touchez « Enregistrer » → le dépôt est remboursé automatiquement." },
  { t: "1:25", en: "Flip to Stats: ‘$1,240 of dead inventory recovered this month.’ That's the retention hook. Done.", fr: "Onglet Stats : « 1 240 $ d'inventaire mort récupéré ce mois-ci. » C'est le hook de rétention. Fin." },
];

export default function DemoPage() {
  const { t, locale } = useI18n();
  return (
    <div className="space-y-6 pt-2">
      <div>
        <h1 className="font-display text-2xl font-bold text-forest">{t("demo.title")}</h1>
        <p className="text-sm text-forest/60">{t("demo.subtitle")}</p>
      </div>

      <section className="card p-5">
        <h2 className="mb-3 font-display font-bold text-forest">{t("demo.accounts")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-forest/50">
                <th className="pb-2 pr-4">Role</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Password</th>
                <th className="pb-2">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/10">
              {ACCOUNTS.map((a) => (
                <tr key={a.email}>
                  <td className="py-2 pr-4 font-semibold text-forest">{a.role}</td>
                  <td className="py-2 pr-4 font-mono text-forest/80">{a.email}</td>
                  <td className="py-2 pr-4 font-mono text-forest/80">{a.password}</td>
                  <td className="py-2 text-forest/60">{a.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-forest/50">
          The header avatar switches the active demo golfer instantly — no login needed for the pitch.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-display font-bold text-forest">{t("demo.script")}</h2>
        <ol className="space-y-3">
          {SCRIPT.map((s) => (
            <li key={s.t} className="flex gap-3">
              <span className="mt-0.5 shrink-0 rounded-full bg-forest px-2 py-0.5 font-mono text-xs font-bold text-lime">
                {s.t}
              </span>
              <span className="text-sm text-forest/80">{locale === "fr" ? s.fr : s.en}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href="/" className="btn-ghost text-sm">🏠 Landing</Link>
        <Link href="/browse" className="btn-ghost text-sm">⛳ Browse</Link>
        <Link href="/operator" className="btn-ghost text-sm">🏪 Pro shop</Link>
        <Link href="/admin" className="btn-ghost text-sm">📊 Admin</Link>
      </div>
    </div>
  );
}
