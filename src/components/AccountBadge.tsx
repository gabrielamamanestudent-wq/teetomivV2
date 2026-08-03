"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n/context";
import { api } from "@/lib/api-client";
import type { Tier } from "@/lib/data/types";
import { cn } from "@/lib/cn";

const TIER_STYLE: Record<Tier, string> = {
  standby: "bg-forest/10 text-forest",
  gold: "bg-amber-200 text-amber-900",
  "gold-plus": "bg-gradient-to-r from-amber-300 to-lime text-forest",
};

/** Compact points + tier chip shown in the header; links to /rewards. */
export function AccountBadge() {
  const { golfer } = useSession();
  const { t } = useI18n();
  const [tier, setTier] = useState<Tier>("standby");
  const [points, setPoints] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    api
      .account(golfer.id)
      .then((r) => {
        if (!active) return;
        setTier(r.tier);
        setPoints(r.account.lifetimePoints);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [golfer.id]);

  return (
    <Link
      href="/rewards"
      className={cn(
        "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold sm:inline-flex",
        TIER_STYLE[tier],
      )}
      aria-label={t("nav.rewards")}
    >
      <span>{tier === "gold-plus" ? "✦" : tier === "gold" ? "★" : "◇"}</span>
      <span className="tabular-nums">{points ?? "—"}</span>
    </Link>
  );
}
