"use client";

import Link from "next/link";
import type { Course, Slot } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/context";
import { formatLocalDate, formatLocalTime, formatCAD } from "@/lib/time";
import { Countdown } from "./Countdown";
import { CourseImage } from "./CourseImage";
import { Badge } from "./ui";

export function DealCard({ slot, course }: { slot: Slot; course: Course }) {
  const { t, locale } = useI18n();
  const discountPct = Math.round(((slot.rackRate - slot.currentPrice) / slot.rackRate) * 100);

  return (
    <Link
      href={`/deal/${slot.id}`}
      className="card group block overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-card-lg"
    >
      <div className="relative h-40 w-full overflow-hidden bg-forest/10">
        <CourseImage
          src={course.photoUrl}
          alt={course.name}
          label={course.logoLabel}
          sizes="(max-width: 768px) 100vw, 384px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/70 via-transparent to-transparent" />
        {discountPct > 0 && (
          <div className="absolute left-3 top-3">
            <Badge tone="lime" className="text-sm font-bold shadow-card">
              −{discountPct}%
            </Badge>
          </div>
        )}
        <div className="absolute right-3 top-3">
          <Countdown toISO={slot.teeTimeISO} prefix={t("deal.expiresIn")} />
        </div>
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between text-cream">
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold leading-tight drop-shadow">
              {course.name}
            </p>
            <p className="text-xs text-cream/90 drop-shadow">
              {t(`region.${course.region}` as never)} · {course.city}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="neutral">{t(`band.${slot.band}` as never)}</Badge>
          <Badge tone="neutral">
            {slot.holes} {t("common.holes")}
          </Badge>
          <Badge tone="neutral">{slot.cart ? t("common.cart") : t("common.walking")}</Badge>
          {slot.weather === "rain" && <Badge tone="sky">🌧</Badge>}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-forest/50">
              {formatLocalDate(slot.teeTimeISO, locale)} · {formatLocalTime(slot.teeTimeISO, locale)}
            </p>
            <p className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-forest">
                {formatCAD(slot.currentPrice)}
              </span>
              <span className="text-sm text-forest/40 line-through">
                {t("common.was")} {formatCAD(slot.rackRate)}
              </span>
              <span className="text-xs text-forest/50">{t("common.perPlayer")}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-forest/60">
              {slot.spotsLeft} {slot.spotsLeft === 1 ? t("common.spotLeft") : t("common.spotsLeft")}
            </p>
            <span className="mt-1 inline-block rounded-full bg-forest px-3 py-1 text-xs font-bold text-lime">
              {t("common.viewDeal")} →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
