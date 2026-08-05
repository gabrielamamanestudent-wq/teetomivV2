"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n/context";
import { api } from "@/lib/api-client";
import type { Tier } from "@/lib/data/types";
import { formatCADCents } from "@/lib/time";
import { HelpCenter } from "./HelpCenter";
import { cn } from "@/lib/cn";

const TIER_STYLE: Record<Tier, string> = {
  standby: "bg-forest/10 text-forest",
  gold: "bg-amber-200 text-amber-900",
  "gold-plus": "bg-gradient-to-r from-amber-300 to-lime text-forest",
};
const TIER_MARK: Record<Tier, string> = { standby: "◇", gold: "★", "gold-plus": "✦" };

export function AccountMenu() {
  const { golfer, member, logout, openCreate } = useSession();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [tier, setTier] = useState<Tier>("standby");
  const [points, setPoints] = useState<number | null>(null);
  const [creditCents, setCreditCents] = useState(0);

  useEffect(() => {
    if (!member) return;
    let active = true;
    api.account(golfer.id).then((r) => {
      if (!active) return;
      setTier(r.tier);
      setPoints(r.account.lifetimePoints);
      setCreditCents(r.account.teeCreditCents);
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [golfer.id, member]);

  const initials = member
    ? member.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold",
            member ? "bg-forest text-lime" : "border border-forest/20 bg-white text-forest/50",
          )}
          aria-label={t("menu.account")}
          aria-expanded={open}
        >
          {member ? initials : "👤"}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-forest/10 bg-white p-2 shadow-card-lg animate-fade-in">
              {member ? (
                <>
                  <div className="flex items-center gap-3 rounded-xl bg-forest/5 p-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-sm font-bold text-lime">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-forest">{member.name}</p>
                      <p className="truncate text-xs text-forest/50">{member.email}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between px-2 py-1.5">
                    <span className="text-xs font-semibold text-forest/50">{t("menu.membership")}</span>
                    <span className={cn("chip", TIER_STYLE[tier])}>
                      {TIER_MARK[tier]} {t(`tier.${tier}` as never)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 text-xs">
                    <span className="text-forest/50">{t("rewards.points")}</span>
                    <span className="font-bold text-forest tabular-nums">{points ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 text-xs">
                    <span className="text-forest/50">{t("rewards.credit")}</span>
                    <span className="font-bold text-forest">{formatCADCents(creditCents)}</span>
                  </div>
                  <div className="my-1.5 border-t border-forest/10" />
                </>
              ) : (
                <button
                  onClick={() => {
                    setOpen(false);
                    openCreate();
                  }}
                  className="mb-1 w-full rounded-xl bg-forest px-3 py-2.5 text-left text-sm font-bold text-cream"
                >
                  ⭐ {t("menu.login")}
                </button>
              )}

              <button
                onClick={() => {
                  setOpen(false);
                  setHelp(true);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-forest hover:bg-forest/5"
              >
                🤖 {t("menu.help")}
              </button>
              {member && (
                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  ⎋ {t("menu.logout")}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <HelpCenter open={help} onClose={() => setHelp(false)} />
    </>
  );
}
