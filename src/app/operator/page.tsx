"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { api } from "@/lib/api-client";
import type { Booking, Course, Slot } from "@/lib/data/types";
import type { OperatorStats } from "@/lib/data/repository";
import { computePrice } from "@/lib/pricing";
import {
  formatLocalDate,
  formatLocalTime,
  formatCAD,
  formatCADCents,
  localDayOfWeek,
  localHour,
  hoursUntil,
} from "@/lib/time";
import { PriceDecayChart } from "@/components/PriceDecayChart";
import { Badge, EmptyState, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";

const COURSE_ID = "c1"; // demo operator = Héron Bleu pro shop

type Tab = "release" | "teesheet" | "checkin" | "stats";

export default function OperatorPage() {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<Tab>("release");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

  const loadSlots = useCallback(() => {
    api.operatorSlots(COURSE_ID).then(({ slots, course }) => {
      setSlots(slots);
      setCourse(course);
    });
  }, []);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const TABS: { id: Tab; key: string }[] = [
    { id: "release", key: "op.release" },
    { id: "teesheet", key: "op.teesheet" },
    { id: "checkin", key: "op.checkin" },
    { id: "stats", key: "op.stats" },
  ];

  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest">{t("op.title")}</h1>
          <p className="text-sm text-forest/60">{course?.name ?? <span className="inline-block h-4 w-32 skeleton" />}</p>
        </div>
        <Badge tone="forest">Pro shop</Badge>
      </div>

      <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
        <div className="inline-flex gap-1 rounded-full border border-forest/15 bg-white p-0.5 text-sm font-semibold">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-1.5 transition-colors",
                tab === tb.id ? "bg-forest text-cream" : "text-forest/60",
              )}
            >
              {t(tb.key as never)}
            </button>
          ))}
        </div>
      </div>

      {tab === "release" && <ReleaseTab slots={slots} onReleased={loadSlots} />}
      {tab === "teesheet" && <TeeSheetTab slots={slots} />}
      {tab === "checkin" && <CheckinTab />}
      {tab === "stats" && <StatsTab />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Release tab — the one-tap killer workflow
// ---------------------------------------------------------------------------
function ReleaseTab({ slots, onReleased }: { slots: Slot[] | null; onReleased: () => void }) {
  const { t, locale } = useI18n();
  const [selected, setSelected] = useState<Slot | null>(null);
  const [floor, setFloor] = useState(0);
  const [livePrice, setLivePrice] = useState(0);
  const [pushing, setPushing] = useState(false);
  const [result, setResult] = useState<{ notified: number } | null>(null);

  // Open gaps = future slots not yet booked.
  const gaps = useMemo(
    () =>
      (slots ?? [])
        .filter(
          (s) =>
            s.status !== "booked" &&
            new Date(s.teeTimeISO).getTime() > Date.now(),
        )
        .slice(0, 12),
    [slots],
  );

  const suggested = useMemo(() => {
    if (!selected) return 0;
    return computePrice({
      hoursUntilTeeTime: hoursUntil(selected.teeTimeISO),
      rackRate: selected.rackRate,
      floorPrice: floor || selected.floorPrice,
      dayOfWeek: localDayOfWeek(selected.teeTimeISO),
      band: selected.band,
      teeHour: localHour(selected.teeTimeISO),
      weather: selected.weather,
      fillRate: selected.fillRate,
    }).price;
  }, [selected, floor]);

  function pick(s: Slot) {
    setSelected(s);
    setFloor(s.floorPrice);
    setResult(null);
    const sug = computePrice({
      hoursUntilTeeTime: hoursUntil(s.teeTimeISO),
      rackRate: s.rackRate,
      floorPrice: s.floorPrice,
      dayOfWeek: localDayOfWeek(s.teeTimeISO),
      band: s.band,
      teeHour: localHour(s.teeTimeISO),
      weather: s.weather,
      fillRate: s.fillRate,
    }).price;
    setLivePrice(sug);
  }

  async function push() {
    if (!selected) return;
    setPushing(true);
    const res = await api.releaseSlot({
      slotId: selected.id,
      floorPrice: floor,
      livePrice: Math.max(livePrice, floor),
    });
    setResult({ notified: res.notified });
    setPushing(false);
    onReleased();
  }

  if (!slots) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <p className="mb-2 text-sm text-forest/60">{t("op.releaseHint")}</p>
        <div className="grid grid-cols-2 gap-2">
          {gaps.map((s) => (
            <button
              key={s.id}
              onClick={() => pick(s)}
              className={cn(
                "rounded-2xl border p-3 text-left transition-all",
                selected?.id === s.id
                  ? "border-forest bg-forest text-cream shadow-card"
                  : "border-forest/15 bg-white hover:border-forest/40",
              )}
            >
              <p className="font-display font-bold">
                {formatLocalTime(s.teeTimeISO, locale)}
              </p>
              <p className={cn("text-xs", selected?.id === s.id ? "text-cream/70" : "text-forest/50")}>
                {formatLocalDate(s.teeTimeISO, locale)} · {s.holes}h
              </p>
              <p className={cn("mt-1 text-xs", selected?.id === s.id ? "text-lime" : "text-forest/60")}>
                {s.status === "released" ? "● Live" : "○ Unlisted"} · rack {formatCAD(s.rackRate)}
              </p>
            </button>
          ))}
          {gaps.length === 0 && (
            <div className="col-span-2">
              <EmptyState icon="✅" title="No open gaps — you're all booked up." />
            </div>
          )}
        </div>
      </div>

      {/* Release panel */}
      <div className="card p-5">
        {!selected ? (
          <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center text-forest/50">
            <span className="text-4xl">👆</span>
            <p className="mt-2 text-sm font-semibold">Tap an open slot to release it.</p>
          </div>
        ) : result ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center animate-fade-in">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lime text-2xl">
              ⚡
            </span>
            <p className="font-display text-lg font-bold text-forest">
              {t("op.pushed", { n: String(result.notified) })}
            </p>
            <p className="text-sm text-forest/60">
              {formatLocalTime(selected.teeTimeISO, locale)} · {formatCAD(Math.max(livePrice, floor))}
            </p>
            <button onClick={() => setSelected(null)} className="btn-ghost mt-2 text-sm">
              {t("op.release")}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-lg font-bold text-forest">
                  {formatLocalTime(selected.teeTimeISO, locale)}
                </p>
                <p className="text-xs text-forest/50">
                  {formatLocalDate(selected.teeTimeISO, locale)} · rack {formatCAD(selected.rackRate)}
                </p>
              </div>
              <Badge tone="lime">{t("op.suggested")} {formatCAD(suggested)}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">{t("op.floorPrice")}</label>
                <div className="flex items-center rounded-2xl border border-forest/15 bg-white px-3">
                  <span className="text-forest/50">$</span>
                  <input
                    type="number"
                    value={floor}
                    min={1}
                    onChange={(e) => setFloor(Number(e.target.value))}
                    className="w-full bg-transparent py-3 pl-1 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="field-label">{t("op.pushAt")}</label>
                <div className="flex items-center rounded-2xl border border-forest/15 bg-white px-3">
                  <span className="text-forest/50">$</span>
                  <input
                    type="number"
                    value={livePrice}
                    min={floor}
                    onChange={(e) => setLivePrice(Number(e.target.value))}
                    className="w-full bg-transparent py-3 pl-1 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="field-label">{t("op.decayPreview")}</p>
              <PriceDecayChart slot={selected} floorPrice={floor || selected.floorPrice} />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setLivePrice(suggested)}
                className="btn-ghost flex-1 text-sm"
              >
                {t("op.suggested")}
              </button>
              <button onClick={push} disabled={pushing} className="btn-lime flex-[2] text-base">
                {pushing ? t("op.pushing") : `${t("op.pushLive")} · ${formatCAD(Math.max(livePrice, floor))}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tee sheet tab — 7-day color-coded grid
// ---------------------------------------------------------------------------
function TeeSheetTab({ slots }: { slots: Slot[] | null }) {
  const { t, locale } = useI18n();
  if (!slots) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  // Group by local date.
  const byDay = new Map<string, Slot[]>();
  for (const s of slots) {
    const key = new Date(s.teeTimeISO).toLocaleDateString("en-CA", {
      timeZone: "America/Toronto",
    });
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(s);
  }
  const days = Array.from(byDay.keys()).sort().slice(0, 7);

  const color = (s: Slot) =>
    s.status === "booked"
      ? "bg-forest text-cream"
      : s.status === "released"
        ? "bg-lime text-forest"
        : "bg-forest/10 text-forest/60";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-xs font-semibold text-forest/60">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-forest" /> {t("op.legendBooked")}</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-lime" /> {t("op.legendReleased")}</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-forest/10" /> {t("op.legendUnlisted")}</span>
      </div>
      {days.map((d) => (
        <div key={d} className="card p-4">
          <p className="mb-2 font-display font-bold text-forest">
            {formatLocalDate(byDay.get(d)![0].teeTimeISO, locale)}
          </p>
          <div className="flex flex-wrap gap-2">
            {byDay
              .get(d)!
              .sort((a, b) => new Date(a.teeTimeISO).getTime() - new Date(b.teeTimeISO).getTime())
              .map((s) => (
                <span
                  key={s.id}
                  className={cn("rounded-xl px-3 py-1.5 text-xs font-bold", color(s))}
                  title={`${s.status} · ${formatCAD(s.currentPrice)}`}
                >
                  {formatLocalTime(s.teeTimeISO, locale)}
                </span>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Check-in tab
// ---------------------------------------------------------------------------
function CheckinTab() {
  const { t, locale } = useI18n();
  const [checkins, setCheckins] = useState<Booking[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    api.operatorCheckins(COURSE_ID).then(({ checkins }) => setCheckins(checkins));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function checkIn(id: string) {
    setBusy(id);
    await api.bookingAction(id, "checkin");
    await load();
    setBusy(null);
  }

  if (!checkins) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  if (checkins.length === 0) {
    return <EmptyState icon="📋" title={t("op.noCheckins")} />;
  }

  return (
    <div className="space-y-3">
      {checkins.map((b) => {
        const done = b.status === "checked-in";
        return (
          <div key={b.id} className="card flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-display font-bold text-forest">{b.golferName}</p>
              <p className="text-sm text-forest/60">
                {formatLocalTime(b.teeTimeISO, locale)} · {b.players} players · {b.reference}
              </p>
              {done && <p className="mt-1 text-xs font-semibold text-forest/70">💸 {t("op.refundTriggered")}</p>}
            </div>
            {done ? (
              <Badge tone="lime">{t("op.checkedIn")}</Badge>
            ) : (
              <button
                onClick={() => checkIn(b.id)}
                disabled={busy === b.id}
                className="btn-lime px-4 py-2 text-sm"
              >
                {busy === b.id ? t("common.loading") : `✓ ${t("op.checkInBtn")}`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stats tab
// ---------------------------------------------------------------------------
function StatsTab() {
  const { t } = useI18n();
  const [stats, setStats] = useState<OperatorStats | null>(null);

  useEffect(() => {
    api.operatorStats(COURSE_ID).then(({ stats }) => setStats(stats));
  }, []);

  if (!stats) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Retention hook — prominent */}
      <div className="rounded-3xl bg-forest p-6 text-cream shadow-card-lg">
        <p className="text-sm font-semibold text-lime">{t("op.recovered")}</p>
        <p className="mt-1 font-display text-4xl font-bold">
          {formatCADCents(stats.recoveredCents)}
        </p>
        <p className="mt-1 text-sm text-cream/70">{t("op.recoveredSub")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label={t("op.grossBookings")} value={formatCADCents(stats.grossBookingsCents)} />
        <StatCard
          label={t("op.teetomicFee")}
          value={formatCADCents(stats.teetomicFeeCents)}
          sub="$199/mo + $1/booking"
        />
        <StatCard
          label={t("op.noShowRate")}
          value={`${(stats.noShowRate * 100).toFixed(0)}%`}
          sub={t("op.noShowSub")}
          tone="lime"
        />
        <StatCard
          label={t("op.forfeitShare")}
          value={formatCADCents(stats.forfeitShareCents)}
          sub="50/50 split"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "lime";
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-forest/50">{label}</p>
      <p className={cn("mt-1 font-display text-3xl font-bold", tone === "lime" ? "text-lime-dark" : "text-forest")}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-forest/50">{sub}</p>}
    </div>
  );
}
