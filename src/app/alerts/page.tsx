"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api-client";
import { ALL_REGIONS, type Alert, type Notification } from "@/lib/data/types";
import { Badge, EmptyState, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";

const REGIONS = ALL_REGIONS;
const BANDS = ["dawn", "morning", "midday", "twilight"] as const;
const DAYS = [
  { n: 0, en: "Sun", fr: "Dim" },
  { n: 1, en: "Mon", fr: "Lun" },
  { n: 2, en: "Tue", fr: "Mar" },
  { n: 3, en: "Wed", fr: "Mer" },
  { n: 4, en: "Thu", fr: "Jeu" },
  { n: 5, en: "Fri", fr: "Ven" },
  { n: 6, en: "Sat", fr: "Sam" },
];

export default function AlertsPage() {
  const { t, locale } = useI18n();
  const { golfer } = useSession();
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [label, setLabel] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  const [bands, setBands] = useState<string[]>([]);
  const [days, setDays] = useState<number[]>([]);
  const [maxPrice, setMaxPrice] = useState(60);
  const [saving, setSaving] = useState(false);

  const loadAlerts = useCallback(() => {
    api.alerts(golfer.id).then(({ alerts }) => setAlerts(alerts));
  }, [golfer.id]);

  const loadNotifs = useCallback(() => {
    api.notifications(golfer.id).then(({ notifications }) => setNotifications(notifications));
  }, [golfer.id]);

  useEffect(() => {
    loadAlerts();
    loadNotifs();
  }, [loadAlerts, loadNotifs]);

  // Poll for new pings (simulated realtime).
  useEffect(() => {
    const id = setInterval(loadNotifs, 6000);
    return () => clearInterval(id);
  }, [loadNotifs]);

  const toggle = <T,>(arr: T[], set: (v: T[]) => void, val: T) =>
    set(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);

  async function save() {
    if (!label.trim()) return;
    setSaving(true);
    await api.createAlert({
      golferId: golfer.id,
      label: label.trim(),
      regions: regions as never,
      bands: bands as never,
      days,
      maxPrice,
      active: true,
    });
    setLabel("");
    setRegions([]);
    setBands([]);
    setDays([]);
    setMaxPrice(60);
    setSaving(false);
    loadAlerts();
  }

  return (
    <div className="space-y-6 pt-2">
      <div>
        <h1 className="font-display text-2xl font-bold text-forest">{t("alerts.title")}</h1>
        <p className="text-sm text-forest/60">{t("alerts.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create */}
        <section className="card space-y-5 p-5">
          <h2 className="font-display text-lg font-bold text-forest">{t("alerts.create")}</h2>

          <div>
            <label className="field-label" htmlFor="label">{t("alerts.label")}</label>
            <input
              id="label"
              className="input"
              placeholder={t("alerts.labelPlaceholder")}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div>
            <p className="field-label">{t("alerts.regions")}</p>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <Chip key={r} active={regions.includes(r)} onClick={() => toggle(regions, setRegions, r)}>
                  {t(`region.${r}` as never)}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="field-label">{t("alerts.bands")}</p>
            <div className="flex flex-wrap gap-2">
              {BANDS.map((b) => (
                <Chip key={b} active={bands.includes(b)} onClick={() => toggle(bands, setBands, b)}>
                  {t(`band.${b}` as never)}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="field-label">{t("alerts.days")}</p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <Chip key={d.n} active={days.includes(d.n)} onClick={() => toggle(days, setDays, d.n)}>
                  {locale === "fr" ? d.fr : d.en}
                </Chip>
              ))}
            </div>
            <p className="mt-1 text-xs text-forest/50">{days.length === 0 && t("alerts.anyDay")}</p>
          </div>

          <div>
            <p className="field-label">
              {t("alerts.maxPrice")}: <span className="text-forest">${maxPrice}</span>
            </p>
            <input
              type="range"
              min={20}
              max={140}
              step={5}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-forest"
            />
          </div>

          <button onClick={save} disabled={saving || !label.trim()} className="btn-lime w-full">
            {saving ? t("common.loading") : t("alerts.save")}
          </button>
        </section>

        {/* Existing + pings */}
        <div className="space-y-6">
          <section className="space-y-3">
            {!alerts &&
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
            {alerts && alerts.length === 0 && (
              <EmptyState icon="🔔" title={t("alerts.empty")} />
            )}
            {alerts?.map((a) => (
              <div key={a.id} className="card flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-display font-bold text-forest">{a.label}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {a.regions.map((r) => (
                      <Badge key={r}>{t(`region.${r}` as never)}</Badge>
                    ))}
                    {a.bands.map((b) => (
                      <Badge key={b} tone="sky">{t(`band.${b}` as never)}</Badge>
                    ))}
                    <Badge tone="lime">≤ ${a.maxPrice}</Badge>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={async () => {
                      await api.toggleAlert(a.id);
                      loadAlerts();
                    }}
                    className={cn(
                      "chip",
                      a.active ? "bg-lime text-forest" : "bg-forest/10 text-forest/50",
                    )}
                  >
                    {a.active ? t("alerts.active") : t("alerts.paused")}
                  </button>
                  <button
                    onClick={async () => {
                      await api.deleteAlert(a.id);
                      loadAlerts();
                    }}
                    className="text-xs font-semibold text-red-500/80 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-2 w-2">
                <span className="absolute h-2 w-2 animate-ping rounded-full bg-lime-dark/60" />
                <span className="h-2 w-2 rounded-full bg-lime-dark" />
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wide text-forest/60">
                {t("alerts.notifications")}
              </h2>
            </div>
            <div className="space-y-2">
              {notifications.length === 0 && (
                <p className="rounded-2xl border border-dashed border-forest/20 px-4 py-6 text-center text-sm text-forest/50">
                  {t("alerts.noNotifications")}
                </p>
              )}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "card p-4",
                    !n.read && "ring-2 ring-lime",
                    n.kind === "refill-refund" && "bg-lime-soft",
                  )}
                >
                  <p className="font-semibold text-forest">
                    {n.kind === "refill-refund" ? "💸 " : "⚡ "}
                    {n.title[locale]}
                  </p>
                  <p className="mt-0.5 text-sm text-forest/70">{n.body[locale]}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
        active
          ? "bg-forest text-cream"
          : "border border-forest/15 bg-white text-forest/70 hover:bg-forest/5",
      )}
    >
      {children}
    </button>
  );
}
