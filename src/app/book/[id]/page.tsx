"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api-client";
import type { Course, Slot } from "@/lib/data/types";
import { freeCancellationDeadline } from "@/lib/policy";
import { formatLocalDateTime, formatLocalTime, formatCAD, formatCADCents } from "@/lib/time";
import { Skeleton, EmptyState, Badge } from "@/components/ui";
import Link from "next/link";

export default function BookPage({ params }: { params: { id: string } }) {
  const { t, locale } = useI18n();
  const { golfer } = useSession();
  const router = useRouter();
  const search = useSearchParams();
  const players = Math.min(4, Math.max(1, Number(search.get("players")) || 1));

  const [data, setData] = useState<{ slot: Slot; course: Course } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState(golfer.name);
  const [email, setEmail] = useState(golfer.email);
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Loyalty context for this golfer.
  const [feeWaived, setFeeWaived] = useState(false);
  const [creditCents, setCreditCents] = useState(0);
  const [pointsPreview, setPointsPreview] = useState(60);
  const [useCredit, setUseCredit] = useState(false);

  useEffect(() => {
    setName(golfer.name);
    setEmail(golfer.email);
    api
      .account(golfer.id)
      .then((r) => {
        setFeeWaived(r.perks.feeWaived);
        setCreditCents(r.account.teeCreditCents);
        setUseCredit(r.account.teeCreditCents > 0 && !r.perks.feeWaived);
      })
      .catch(() => {});
  }, [golfer]);

  useEffect(() => {
    api.slot(params.id).then(setData).catch(() => setNotFound(true));
  }, [params.id]);

  const baseFeeCents = feeWaived ? 0 : 1000;
  const creditApplied = useCredit ? Math.min(baseFeeCents, creditCents) : 0;
  const chargeCents = baseFeeCents - creditApplied;

  const deadlineLabel = useMemo(() => {
    if (!data) return "";
    const d = freeCancellationDeadline(new Date(), new Date(data.slot.teeTimeISO));
    return formatLocalDateTime(d.toISOString(), locale);
  }, [data, locale]);

  const hasStripe = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  async function submit() {
    if (!data) return;
    setSubmitting(true);
    setError(null);
    try {
      const { booking } = await api.createBooking({
        slotId: data.slot.id,
        players,
        golferId: golfer.id,
        golferName: name,
        golferEmail: email,
        applyCredit: useCredit,
      });
      router.push(`/booking/${booking.reference}`);
    } catch (e) {
      setError(String((e as Error).message));
      setSubmitting(false);
    }
  }

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
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const { slot, course } = data;
  const greenFeeTotal = slot.currentPrice * players;

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-1">
      <button onClick={() => router.back()} className="text-sm font-semibold text-forest/60">
        ← {t("common.back")}
      </button>
      <h1 className="font-display text-2xl font-bold text-forest">{t("book.title")}</h1>

      {/* Summary */}
      <div className="card space-y-3 p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-forest/50">{t("book.summary")}</p>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-forest">{course.name}</span>
          <span className="text-sm text-forest/70">
            {formatLocalDateTime(slot.teeTimeISO, locale)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-forest/60">
            {players} × {formatCAD(slot.currentPrice)} {t("book.greenFee")}
          </span>
          <span className="font-semibold text-forest">{formatCAD(greenFeeTotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-forest/60">{t("book.deposit")}</span>
          {feeWaived ? (
            <Badge tone="lime">{t("rewards.perkFee")}</Badge>
          ) : (
            <span className="font-semibold text-forest">{formatCADCents(baseFeeCents)}</span>
          )}
        </div>
        {creditCents > 0 && !feeWaived && (
          <label className="flex cursor-pointer items-center justify-between text-sm">
            <span className="text-forest/70">
              {t("book.applyCredit")}{" "}
              <span className="text-forest/45">({formatCADCents(creditCents)})</span>
            </span>
            <input
              type="checkbox"
              checked={useCredit}
              onChange={(e) => setUseCredit(e.target.checked)}
              className="h-4 w-4 accent-forest"
            />
          </label>
        )}
        {creditApplied > 0 && (
          <div className="flex items-center justify-between text-sm font-semibold text-lime-dark">
            <span>{t("book.creditApplied")}</span>
            <span>−{formatCADCents(creditApplied)}</span>
          </div>
        )}
        <div className="border-t border-forest/10 pt-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-forest">{t("book.totalNow")}</span>
            <span className="font-display text-xl font-bold text-forest">
              {formatCADCents(chargeCents)}
            </span>
          </div>
          <p className="mt-1 text-xs text-forest/50">
            {t("book.greenFee")}: {formatCAD(greenFeeTotal)} — {t("deal.dueAtCourse").toLowerCase()}.
          </p>
        </div>
        <div className="rounded-xl bg-lime-soft px-3 py-2 text-sm font-semibold text-forest">
          🏅 {t("book.earnLine", { pts: String(pointsPreview) })}
        </div>
        <div className="rounded-xl bg-forest/5 px-3 py-2 text-sm font-semibold text-forest/70">
          {t("book.freeCancelUntil")} {deadlineLabel}
        </div>
      </div>

      {/* Deposit form */}
      <div className="card space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="name">{t("book.name")}</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="email">{t("book.email")}</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="card">{t("book.cardLabel")}</label>
          <input
            id="card"
            className="input tabular-nums tracking-wide"
            value={card}
            onChange={(e) => setCard(e.target.value)}
            inputMode="numeric"
          />
          <p className="mt-1 text-xs text-forest/50">💳 {t("book.testCardHint")}</p>
          {!hasStripe && (
            <p className="mt-1 text-xs font-semibold text-amber-700">{t("book.mockNote")}</p>
          )}
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <button onClick={submit} disabled={submitting || !email} className="btn-lime w-full text-base">
          {submitting
            ? t("book.processing")
            : chargeCents === 0
              ? t("book.payWaived")
              : t("book.pay")}
        </button>
        <p className="text-center text-xs text-forest/50">{t("deal.depositExplain")}</p>
      </div>
    </div>
  );
}
