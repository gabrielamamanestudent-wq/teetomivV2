"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api-client";
import type { Booking, Course } from "@/lib/data/types";
import { formatLocalDateTime, formatLocalTime, formatCAD } from "@/lib/time";
import { isWithinFreeWindow } from "@/lib/policy";
import { Badge, EmptyState, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";

const depositTone: Record<string, "neutral" | "lime" | "amber" | "red" | "sky"> = {
  authorized: "amber",
  refunded: "lime",
  forfeited: "red",
  "refunded-on-refill": "sky",
};

export default function MyBookingsPage() {
  const { t, locale } = useI18n();
  const { golfer } = useSession();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    api.bookings(golfer.id).then(({ bookings, courses }) => {
      setBookings(bookings);
      setCourses(courses);
    });
  }, [golfer.id]);

  useEffect(() => {
    setBookings(null);
    load();
  }, [load]);

  const now = Date.now();
  const courseById = (id: string) => courses.find((c) => c.id === id);
  const upcoming = bookings?.filter(
    (b) => new Date(b.teeTimeISO).getTime() > now && b.status !== "cancelled",
  );
  const past = bookings?.filter(
    (b) => new Date(b.teeTimeISO).getTime() <= now || b.status === "cancelled",
  );
  const shown = tab === "upcoming" ? upcoming : past;

  async function cancel(b: Booking) {
    if (!window.confirm(t("bookings.cancelConfirm"))) return;
    setBusy(b.id);
    await api.bookingAction(b.id, "cancel");
    await load();
    setBusy(null);
  }

  return (
    <div className="space-y-5 pt-2">
      <h1 className="font-display text-2xl font-bold text-forest">{t("bookings.title")}</h1>

      <div className="inline-flex rounded-full border border-forest/15 bg-white p-0.5 text-sm font-semibold">
        {(["upcoming", "past"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={cn(
              "rounded-full px-4 py-1.5",
              tab === v ? "bg-forest text-cream" : "text-forest/60",
            )}
          >
            {t(`bookings.${v}` as never)}
          </button>
        ))}
      </div>

      {!bookings ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : !shown || shown.length === 0 ? (
        <EmptyState
          icon="🎟️"
          title={t("bookings.empty")}
          action={
            <Link href="/browse" className="btn-primary mt-2 text-sm">
              {t("nav.browse")}
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {shown.map((b) => {
            const course = courseById(b.courseId);
            const freeWindow = isWithinFreeWindow(
              new Date(),
              new Date(b.createdAtISO),
              new Date(b.teeTimeISO),
            );
            const isUpcoming = new Date(b.teeTimeISO).getTime() > now && b.status !== "cancelled";
            return (
              <div key={b.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-forest">{course?.name}</p>
                    <p className="text-sm text-forest/60">
                      {formatLocalDateTime(b.teeTimeISO, locale)}
                    </p>
                    <p className="mt-1 text-sm text-forest/70">
                      {b.players} × {formatCAD(b.pricePerPlayer)} · {b.reference}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge tone={b.status === "cancelled" ? "red" : b.status === "checked-in" ? "lime" : "neutral"}>
                      {t(`status.${b.status}` as never)}
                    </Badge>
                    <Badge tone={depositTone[b.depositStatus]}>
                      {t(`deposit.${b.depositStatus}` as never)}
                    </Badge>
                  </div>
                </div>

                {isUpcoming && (
                  <div className="mt-3 flex flex-col gap-2 border-t border-forest/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-semibold text-forest/60">
                      {freeWindow
                        ? t("bookings.freeUntil", {
                            time: formatLocalTime(b.freeCancellationDeadlineISO, locale),
                          })
                        : t("bookings.lateCancel")}
                    </p>
                    <div className="flex gap-2">
                      <Link href={`/deal/${b.slotId}`} className="btn-ghost px-3 py-1.5 text-xs">
                        {t("bookings.rebook")}
                      </Link>
                      <button
                        onClick={() => cancel(b)}
                        disabled={busy === b.id}
                        className="rounded-2xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        {busy === b.id ? t("common.loading") : t("bookings.cancel")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
