"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { api } from "@/lib/api-client";
import type { Course, Slot } from "@/lib/data/types";
import { formatLocalDate, formatLocalTime, formatCAD } from "@/lib/time";
import { Countdown } from "@/components/Countdown";
import { Badge, EmptyState, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";

export default function DealDetailPage({ params }: { params: { id: string } }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [data, setData] = useState<{ slot: Slot; course: Course } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [players, setPlayers] = useState(2);

  useEffect(() => {
    api
      .slot(params.id)
      .then(setData)
      .catch(() => setNotFound(true));
  }, [params.id]);

  if (notFound) {
    return (
      <div className="pt-6">
        <EmptyState icon="⛳" title={t("deal.notFound")} action={
          <Link href="/browse" className="btn-primary mt-2 text-sm">{t("nav.browse")}</Link>
        } />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4 pt-2">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const { slot, course } = data;
  const soldOut = slot.spotsLeft <= 0 || slot.status !== "released";
  const discountPct = Math.round(((slot.rackRate - slot.currentPrice) / slot.rackRate) * 100);
  const maxPlayers = Math.min(4, slot.spotsLeft || 1);

  return (
    <div className="space-y-5 pt-1">
      <button onClick={() => router.back()} className="text-sm font-semibold text-forest/60">
        ← {t("common.back")}
      </button>

      <div className="relative h-56 overflow-hidden rounded-3xl bg-forest/10 sm:h-72">
        <Image src={course.photoUrl} alt={course.name} fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-forest/10 to-transparent" />
        <div className="absolute left-4 right-4 top-4 flex items-start justify-between">
          {discountPct > 0 && <Badge tone="lime" className="text-sm font-bold">−{discountPct}%</Badge>}
          <Countdown toISO={slot.teeTimeISO} prefix={t("deal.expiresIn")} />
        </div>
        <div className="absolute bottom-4 left-4 right-4 text-cream">
          <h1 className="font-display text-2xl font-bold drop-shadow">{course.name}</h1>
          <p className="text-sm text-cream/90">
            {t(`region.${course.region}` as never)} · {course.city} · ★ {course.rating}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge>{t(`band.${slot.band}` as never)}</Badge>
        <Badge>{slot.holes} {t("common.holes")}</Badge>
        <Badge>{slot.cart ? t("common.cart") : t("common.walking")}</Badge>
        <Badge>
          {formatLocalDate(slot.teeTimeISO, locale)} · {formatLocalTime(slot.teeTimeISO, locale)}
        </Badge>
      </div>

      <p className="text-forest/70">{course.description[locale]}</p>

      {/* Price + reserve panel */}
      <div className="card space-y-5 p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-forest/50">
              {t("deal.dueAtCourse")}
            </p>
            <p className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold text-forest">
                {formatCAD(slot.currentPrice)}
              </span>
              <span className="text-forest/40 line-through">
                {t("common.was")} {formatCAD(slot.rackRate)}
              </span>
              <span className="text-sm text-forest/50">{t("common.perPlayer")}</span>
            </p>
          </div>
          <Badge tone={slot.spotsLeft <= 1 ? "red" : "neutral"}>
            {slot.spotsLeft} {slot.spotsLeft === 1 ? t("common.spotLeft") : t("common.spotsLeft")}
          </Badge>
        </div>

        {/* Players */}
        <div>
          <p className="field-label">{t("deal.players")}</p>
          <div className="flex gap-2">
            {Array.from({ length: maxPlayers }).map((_, i) => {
              const n = i + 1;
              return (
                <button
                  key={n}
                  onClick={() => setPlayers(n)}
                  aria-pressed={players === n}
                  className={cn(
                    "h-12 flex-1 rounded-2xl border text-lg font-bold transition-colors",
                    players === n
                      ? "border-forest bg-forest text-cream"
                      : "border-forest/15 bg-white text-forest/70",
                  )}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        {/* Deposit reassurance */}
        <div className="rounded-2xl bg-lime-soft p-4">
          <p className="font-display font-bold text-forest">{t("deal.depositLine")}</p>
          <p className="mt-1 text-sm text-forest/70">{t("deal.depositExplain")}</p>
        </div>

        {soldOut ? (
          <div className="rounded-2xl bg-forest/5 p-4 text-center text-sm font-semibold text-forest/60">
            {t("deal.notFound")}
          </div>
        ) : (
          <button
            onClick={() => router.push(`/book/${slot.id}?players=${players}`)}
            className="btn-lime w-full text-base"
          >
            {t("deal.reserve")} · {formatCAD(slot.currentPrice * players)} {t("deal.dueAtCourse").toLowerCase()}
          </button>
        )}
      </div>
    </div>
  );
}
