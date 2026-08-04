"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useSession } from "@/lib/session";
import { api, type AccountResponse } from "@/lib/api-client";
import { GOLD_AT, GOLD_PLUS_AT } from "@/lib/loyalty";
import { formatCADCents, formatLocalDate } from "@/lib/time";
import { Badge, Skeleton, EmptyState } from "@/components/ui";
import { PinLock } from "@/components/PinLock";
import { cn } from "@/lib/cn";

const TIER_HERO: Record<string, string> = {
  standby: "from-forest-700 to-forest-600",
  gold: "from-amber-500 to-amber-400",
  "gold-plus": "from-amber-400 via-lime to-lime-dark",
};

export default function RewardsPage() {
  const { t, locale } = useI18n();
  const { golfer, mode, perksUnlocked } = useSession();
  const [data, setData] = useState<AccountResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [hcp, setHcp] = useState<string>("");

  const load = useCallback(() => {
    api.account(golfer.id).then((r) => {
      setData(r);
      setHcp(r.account.handicap != null ? String(r.account.handicap) : "");
    });
  }, [golfer.id]);

  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  async function act(action: "subscribe" | "unsubscribe" | "handicap", handicap?: number) {
    setBusy(true);
    await api.accountAction({ golferId: golfer.id, action, handicap });
    await load();
    setBusy(false);
  }

  // Members must enter their 4-digit PIN to unlock the exclusive perks area.
  // Demo explorers see everything (maxed out) with no lock.
  if (mode === "member" && !perksUnlocked) {
    return <PinLock />;
  }

  if (!data) {
    return (
      <div className="space-y-4 pt-2">
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  const { account, ledger, tier, perks, next, matchmaking } = data;
  const tierLabel = t(`tier.${tier}` as never);
  const progressMax = tier === "standby" ? GOLD_AT : GOLD_PLUS_AT;
  const progressPct = Math.min(100, (account.lifetimePoints / progressMax) * 100);

  return (
    <div className="space-y-5 pt-2">
      <div>
        <h1 className="font-display text-2xl font-bold text-forest">{t("rewards.title")}</h1>
        <p className="text-sm text-forest/60">{t("rewards.subtitle")}</p>
      </div>

      {/* Tier hero */}
      <div className={cn("rounded-3xl bg-gradient-to-br p-6 text-forest shadow-card-lg", TIER_HERO[tier])}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide opacity-70">{t("rewards.tier")}</p>
            <p className="font-display text-3xl font-bold">
              {tier === "gold-plus" ? "✦ " : tier === "gold" ? "★ " : "◇ "}
              {tierLabel}
            </p>
            {account.subscription === "plus" && tier === "gold-plus" && (
              <span className="mt-1 inline-block rounded-full bg-forest/15 px-2 py-0.5 text-[11px] font-bold">
                {t("rewards.viaPlus")}
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="font-display text-4xl font-bold tabular-nums">{account.lifetimePoints}</p>
            <p className="text-xs font-semibold opacity-70">{t("rewards.points")}</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="h-2.5 overflow-hidden rounded-full bg-forest/15">
            <div className="h-full rounded-full bg-forest/70" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="mt-1.5 text-xs font-semibold opacity-80">
            {next.next
              ? t("rewards.toNext", { n: String(next.remaining), tier: t(`tier.${next.next}` as never) })
              : t("rewards.topTier")}
          </p>
        </div>
      </div>

      {/* Credit + perks */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-forest/50">{t("rewards.credit")}</p>
          <p className="mt-1 font-display text-3xl font-bold text-forest">
            {formatCADCents(account.teeCreditCents)}
          </p>
          <p className="mt-0.5 text-xs text-forest/50">Spends on future booking fees.</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-forest/50">{t("rewards.perks")}</p>
          <ul className="mt-2 space-y-1.5 text-sm text-forest/80">
            {perks.priorityWindowMin > 0 && (
              <li>⚡ {t("rewards.perkPriority", { min: String(perks.priorityWindowMin) })}</li>
            )}
            {perks.feeWaived && <li>💸 {t("rewards.perkFee")}</li>}
            {perks.matchmaking && <li>🎯 {t("rewards.perkMatch")}</li>}
            {!perks.feeWaived && !perks.matchmaking && perks.priorityWindowMin === 0 && (
              <li className="text-forest/40">Reach Gold (300 pts) to unlock perks.</li>
            )}
          </ul>
        </div>
      </div>

      {/* TEETOMIC+ */}
      <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg font-bold text-forest">
            {t("rewards.plusTitle")}{" "}
            {account.subscription === "plus" && <Badge tone="lime">{t("rewards.subscribed")}</Badge>}
          </p>
          <p className="mt-0.5 max-w-md text-sm text-forest/60">{t("rewards.plusPitch")}</p>
        </div>
        {account.subscription === "plus" ? (
          <button onClick={() => act("unsubscribe")} disabled={busy} className="btn-ghost text-sm">
            {t("rewards.unsubscribe")}
          </button>
        ) : (
          <button onClick={() => act("subscribe")} disabled={busy} className="btn-lime whitespace-nowrap">
            {t("rewards.subscribe")}
          </button>
        )}
      </div>

      {/* Matchmaking (Gold Plus) */}
      {perks.matchmaking && (
        <div className="card p-5">
          <p className="font-display font-bold text-forest">🎯 {t("rewards.matchTitle")}</p>
          <p className="text-xs text-forest/50">{t("rewards.matchSub")}</p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div>
              <label className="field-label" htmlFor="hcp">{t("rewards.handicap")}</label>
              <input
                id="hcp"
                inputMode="numeric"
                value={hcp}
                onChange={(e) => setHcp(e.target.value)}
                className="input w-28"
              />
            </div>
            <button
              onClick={() => act("handicap", Number(hcp) || 18)}
              disabled={busy}
              className="btn-ghost text-sm"
            >
              {t("rewards.handicapSave")}
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {matchmaking.slice(0, 5).map((m) => (
              <div key={m.golferId} className="flex items-center justify-between rounded-2xl bg-forest/5 px-4 py-2.5">
                <span className="font-semibold text-forest">{m.name}</span>
                <span className="flex items-center gap-2 text-sm">
                  <Badge>{m.tier}</Badge>
                  <span className="font-mono text-forest/70">{m.handicap} {t("rewards.hcp")}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ledger */}
      <div className="card p-5">
        <p className="mb-3 font-display font-bold text-forest">{t("rewards.ledger")}</p>
        {ledger.length === 0 ? (
          <EmptyState icon="🏅" title={t("rewards.noLedger")} />
        ) : (
          <ul className="divide-y divide-forest/10">
            {ledger.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-semibold text-forest">{e.label[locale]}</p>
                  <p className="text-xs text-forest/50">{formatLocalDate(e.createdAtISO, locale)}</p>
                </div>
                <span className={cn("font-mono text-sm font-bold", e.delta >= 0 ? "text-lime-dark" : "text-red-500")}>
                  {e.delta >= 0 ? "+" : ""}
                  {e.delta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
