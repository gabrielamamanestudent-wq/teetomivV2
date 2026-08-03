"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { api } from "@/lib/api-client";
import type { Booking, Course } from "@/lib/data/types";
import { formatLocalDateTime, formatLocalTime, formatCAD } from "@/lib/time";
import { QRCode } from "@/components/QRCode";
import { EmptyState, Skeleton, Badge } from "@/components/ui";

export default function ConfirmationPage({ params }: { params: { reference: string } }) {
  const { t, locale } = useI18n();
  const [data, setData] = useState<{ booking: Booking; course: Course } | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.bookingByRef(params.reference).then(setData).catch(() => setNotFound(true));
  }, [params.reference]);

  if (notFound) {
    return (
      <div className="pt-6">
        <EmptyState icon="🎟️" title={t("deal.notFound")} action={
          <Link href="/browse" className="btn-primary mt-2 text-sm">{t("nav.browse")}</Link>
        } />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-md space-y-4 pt-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mx-auto h-44 w-44" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const { booking, course } = data;

  return (
    <div className="mx-auto max-w-md space-y-5 pt-3 text-center">
      <div className="animate-fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime text-3xl">
          🏌️
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold text-forest">{t("confirm.title")}</h1>
        <p className="mt-1 text-forest/70">
          {course.name} · {formatLocalDateTime(booking.teeTimeISO, locale)}
        </p>
      </div>

      {/* Ticket */}
      <div className="card overflow-hidden text-left">
        <div className="flex items-center justify-between bg-forest px-5 py-3 text-cream">
          <span className="font-display font-bold">TEE<span className="text-lime">TOMIC</span></span>
          <Badge tone="lime">{t("status.confirmed")}</Badge>
        </div>
        <div className="flex flex-col items-center gap-3 border-b border-dashed border-forest/15 p-5">
          <QRCode value={booking.reference} />
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-forest/50">
              {t("confirm.reference")}
            </p>
            <p className="font-display text-2xl font-bold tracking-widest text-forest">
              {booking.reference}
            </p>
          </div>
          <p className="text-center text-sm text-forest/60">{t("confirm.showQr")}</p>
        </div>
        <div className="space-y-3 p-5">
          <div className="rounded-2xl bg-lime-soft p-4">
            <p className="font-semibold text-forest">
              {t("confirm.dueLine", { price: formatCAD(booking.pricePerPlayer) })}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-forest px-4 py-3 text-cream">
            <span className="text-lg">🏅</span>
            <span className="text-sm font-semibold">{t("confirm.earned", { pts: "60" })}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-forest/5 px-4 py-3">
            <span className="text-sm font-semibold text-forest/70">
              {t("confirm.cancelLine", {
                time: formatLocalTime(booking.freeCancellationDeadlineISO, locale),
              })}
            </span>
            <span className="text-lg">🕒</span>
          </div>
          <p className="text-center text-xs text-forest/50">
            {t("confirm.emailSent", { email: booking.golferEmail })}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Link href="/my-bookings" className="btn-primary">{t("confirm.viewBookings")}</Link>
        <Link href="/browse" className="btn-ghost">{t("nav.browse")}</Link>
      </div>
    </div>
  );
}
