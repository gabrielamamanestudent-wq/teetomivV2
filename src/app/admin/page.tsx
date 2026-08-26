"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { useI18n } from "@/lib/i18n/context";
import { api, setAdminAuth } from "@/lib/api-client";
import type { AdminMetrics } from "@/lib/data/repository";
import type { Course } from "@/lib/data/types";
import { formatCADCents } from "@/lib/time";
import { Badge, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";

const DEPOSIT_LABELS: Record<string, string> = {
  authorized: "Fee charged",
  refunded: "Returned to card",
  credited: "Returned as TeeCredit",
  forfeited: "Kept (no-show)",
  "refunded-on-refill": "Returned (re-filled)",
};

export default function AdminPage() {
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [pending, setPending] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [gate, setGate] = useState(false); // show login prompt when locked
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);

  const loadCourses = useCallback(() => {
    api.adminCourses().then((r) => setAllCourses(r.courses)).catch(() => {});
  }, []);

  const load = useCallback(() => {
    api
      .adminMetrics()
      .then(({ metrics, pending }) => {
        setMetrics(metrics);
        setPending(pending);
        setGate(false);
        loadCourses();
      })
      .catch((e) => {
        if (String(e?.message).includes("unauthorized")) setGate(true);
      });
  }, [loadCourses]);

  async function removeCourse(courseId: string, name: string) {
    if (!window.confirm(`Remove "${name}"? This deletes the course and its tee times.`)) return;
    await api.deleteCourse(courseId);
    load();
  }

  function submitPassword() {
    setAdminAuth(email.trim(), pw.trim());
    setPwError(false);
    api
      .adminMetrics()
      .then(({ metrics, pending }) => {
        setMetrics(metrics);
        setPending(pending);
        setGate(false);
        loadCourses();
      })
      .catch(() => {
        setPwError(true);
        setAdminAuth("", "");
      });
  }

  async function approve(courseId: string) {
    await api.approveCourse(courseId);
    load();
  }

  useEffect(() => {
    load();
  }, [load]);

  async function reset() {
    setResetting(true);
    await api.resetDemo();
    await load();
    setResetting(false);
    setToast(t("admin.resetDone"));
    setTimeout(() => setToast(null), 2500);
  }

  const funnelData = metrics
    ? [
        { name: t("admin.funnelViews"), value: metrics.funnel.views },
        { name: t("admin.funnelStarts"), value: metrics.funnel.starts },
        { name: t("admin.funnelCompleted"), value: metrics.funnel.completed },
      ]
    : [];

  if (gate) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="card w-full max-w-sm space-y-4 p-6 text-center">
          <div className="text-4xl">🔒</div>
          <h1 className="font-display text-xl font-bold text-forest">{t("admin.title")}</h1>
          <p className="text-sm text-forest/60">Sign in to the admin dashboard.</p>
          <input
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitPassword()}
            placeholder="Admin email"
            className="input text-center"
          />
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitPassword()}
            placeholder="Password"
            className="input text-center"
          />
          {pwError && <p className="text-sm font-semibold text-red-500">Wrong email or password.</p>}
          <button onClick={submitPassword} className="btn-lime w-full">
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-forest">{t("admin.title")}</h1>
        <button onClick={reset} disabled={resetting} className="btn-ghost text-sm">
          {resetting ? t("admin.resetting") : `↻ ${t("admin.reset")}`}
        </button>
      </div>

      {toast && (
        <div className="rounded-2xl bg-lime px-4 py-2 text-sm font-semibold text-forest animate-fade-in">
          ✓ {toast}
        </div>
      )}

      {pending.length > 0 && (
        <div className="card border-2 border-amber-200 p-5">
          <h2 className="mb-3 font-display font-bold text-forest">
            ⏳ {t("admin.pending")} <Badge tone="amber">{pending.length}</Badge>
          </h2>
          <div className="space-y-2">
            {pending.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
                <div>
                  <p className="font-semibold text-forest">{c.name}</p>
                  <p className="text-xs text-forest/50">{c.city}</p>
                </div>
                <button onClick={() => approve(c.id)} className="btn-lime px-4 py-2 text-sm">
                  {t("admin.approve")}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manage all courses — view + remove */}
      <div className="card p-5">
        <h2 className="mb-3 font-display font-bold text-forest">
          🏌️ All courses <Badge>{allCourses.length}</Badge>
        </h2>
        {allCourses.length === 0 ? (
          <p className="py-6 text-center text-sm text-forest/50">
            No courses yet — they’ll appear here when businesses sign up.
          </p>
        ) : (
          <div className="space-y-2">
            {allCourses.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-2xl bg-forest/5 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-forest">
                    {c.name}{" "}
                    {c.approved ? (
                      <Badge tone="lime">Live</Badge>
                    ) : (
                      <Badge tone="amber">Pending</Badge>
                    )}
                  </p>
                  <p className="truncate text-xs text-forest/50">
                    {c.city} · {t(`region.${c.region}` as never)}
                  </p>
                </div>
                <button
                  onClick={() => removeCourse(c.id, c.name)}
                  className="ml-3 shrink-0 rounded-full border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-500 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {!metrics ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label={t("admin.gmv")} value={formatCADCents(metrics.gmvCents)} accent />
            <Metric label={t("admin.bookings")} value={String(metrics.bookings)} />
            <Metric label={t("admin.alerts")} value={String(metrics.activeAlerts)} />
            <Metric label={t("admin.courses")} value={String(metrics.courses)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Funnel */}
            <div className="card p-5">
              <h2 className="mb-3 font-display font-bold text-forest">{t("admin.funnel")}</h2>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#0B3D2E99" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: "#0B3D2E0d" }}
                      contentStyle={{ borderRadius: 12, border: "1px solid #0B3D2E22", fontSize: 12 }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {funnelData.map((_, i) => (
                        <Cell key={i} fill={["#0B3D2E", "#0F4E3A", "#C6F432"][i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-center text-xs text-forest/50">
                {metrics.funnel.views} → {metrics.funnel.starts} →{" "}
                <span className="font-bold text-forest">{metrics.funnel.completed}</span> (
                {Math.round((metrics.funnel.completed / metrics.funnel.views) * 100)}% conversion)
              </p>
            </div>

            {/* Deposit states */}
            <div className="card p-5">
              <h2 className="mb-3 font-display font-bold text-forest">{t("admin.deposits")}</h2>
              <div className="space-y-2">
                {Object.entries(metrics.deposits).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between rounded-2xl bg-forest/5 px-4 py-3"
                  >
                    <span className="font-semibold text-forest/80">{DEPOSIT_LABELS[k] ?? k}</span>
                    <Badge
                      tone={
                        k === "refunded" || k === "credited"
                          ? "lime"
                          : k === "forfeited"
                            ? "red"
                            : k === "refunded-on-refill"
                              ? "sky"
                              : "amber"
                      }
                    >
                      {v}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("card p-5", accent && "bg-forest text-cream")}>
      <p className={cn("text-xs font-bold uppercase tracking-wide", accent ? "text-lime" : "text-forest/50")}>
        {label}
      </p>
      <p className={cn("mt-1 font-display text-3xl font-bold", accent ? "text-cream" : "text-forest")}>
        {value}
      </p>
    </div>
  );
}
