"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { COURSE_DEMO_PIN } from "@/lib/session";
import { Logo } from "@/components/Logo";
import { api, setOperatorAuth } from "@/lib/api-client";
import type { Booking, Course, CourseAvailability, Notification, Slot } from "@/lib/data/types";
import type { OperatorStats } from "@/lib/data/repository";
import { formatBlackoutWindow } from "@/lib/availability";
import {
  formatLocalDate,
  formatLocalTime,
  formatCAD,
  formatCADCents,
} from "@/lib/time";
import { Badge, EmptyState, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";

// The pro shop manages ONE course. A master account created via signup stores
// its courseId here; the demo falls back to Héron Bleu (c1).
const OPERATOR_KEY = "teetomic.operatorCourseId";

type Tab = "add" | "teesheet" | "checkin" | "hours" | "settings" | "stats";

// The Business Corner is for course operators only. Reached via the business
// code (also entered on the welcome screen). Average golfers never land here.
function BusinessGate({ onAccess }: { onAccess: (courseId: string) => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<"code" | "login">("code");
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loginErr, setLoginErr] = useState(false);

  const check = (v: string) => {
    if (v === COURSE_DEMO_PIN) router.push("/operator/signup");
    else setErr(true);
  };

  async function login() {
    setLoginErr(false);
    try {
      const { user } = await api.operatorLogin(email.trim(), pin);
      if (user.role === "operator" && user.courseId) {
        // Persist credentials so course-management calls can prove ownership.
        setOperatorAuth(email.trim(), pin);
        window.localStorage.setItem(OPERATOR_KEY, user.courseId);
        onAccess(user.courseId);
      } else {
        setLoginErr(true);
      }
    } catch {
      setLoginErr(true);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 pt-10 text-center">
      <Logo className="text-2xl" />
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest text-3xl text-lime">🏪</div>
      <h1 className="font-display text-2xl font-bold text-forest">{t("nav.operator")}</h1>

      <div className="inline-flex rounded-full border border-forest/15 bg-white p-0.5 text-sm font-semibold">
        {(["code", "login"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn("rounded-full px-4 py-1.5", mode === m ? "bg-forest text-cream" : "text-forest/60")}
          >
            {m === "code" ? t("op.newBusiness") : t("op.haveBusiness")}
          </button>
        ))}
      </div>

      {mode === "code" ? (
        <>
          <p className="text-sm text-forest/60">{t("op.businessOnly")}</p>
          <input
            autoFocus
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            aria-label={t("op.enterCode")}
            className={cn(
              "input max-w-[12rem] text-center text-3xl font-bold tracking-[0.6em] tabular-nums",
              err && "border-red-400",
            )}
            value={code}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 4);
              setCode(v);
              setErr(false);
              if (v.length === 4) check(v);
            }}
          />
          {err && <p className="text-sm font-semibold text-red-600">{t("welcome.coursePinWrong")}</p>}
          <button onClick={() => check(code)} disabled={code.length !== 4} className="btn-lime w-full max-w-[12rem]">
            {t("welcome.coursePinGo")}
          </button>
        </>
      ) : (
        <div className="w-full max-w-xs space-y-3 text-left">
          <div>
            <label className="field-label">{t("op.signupEmail")}</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="field-label">{t("op.signupPin")}</label>
            <input
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              className="input text-center text-xl font-bold tracking-[0.4em] tabular-nums"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </div>
          {loginErr && <p className="text-sm font-semibold text-red-600">{t("op.loginFailed")}</p>}
          <button onClick={login} disabled={!email || pin.length !== 4} className="btn-lime w-full">
            {t("acct.login")}
          </button>
        </div>
      )}
    </div>
  );
}

function PendingApproval({ course }: { course: Course }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 pt-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl">⏳</div>
      <h1 className="font-display text-2xl font-bold text-forest">{t("op.pendingTitle")}</h1>
      <p className="text-sm text-forest/60">{t("op.pendingBody", { course: course.name })}</p>
      <span className="chip bg-amber-100 text-amber-800">{course.name}</span>
    </div>
  );
}

function OpPing({ n }: { n: Notification }) {
  const { locale } = useI18n();
  return (
    <div className={cn("rounded-xl px-3 py-2 text-sm", n.read ? "bg-forest/5" : "bg-lime-soft")}>
      <span className="font-semibold text-forest">{n.title[locale]}</span>{" "}
      <span className="text-forest/60">{n.body[locale]}</span>
    </div>
  );
}

export default function OperatorPage() {
  const { t } = useI18n();
  const [courseId, setCourseId] = useState("c1");
  const [access, setAccess] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("add");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [availability, setAvailability] = useState<CourseAvailability | null>(null);
  const [opNotifs, setOpNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem(OPERATOR_KEY);
    setAccess(!!stored);
    if (stored) setCourseId(stored);
  }, []);

  const loadSlots = useCallback(() => {
    api.operatorSlots(courseId).then(({ slots, course }) => {
      // Recover gracefully if a stored course no longer exists (e.g. after a
      // demo reset) — fall back to the demo pro shop instead of hanging.
      if (!course && courseId !== "c1") {
        window.localStorage.removeItem(OPERATOR_KEY);
        setCourseId("c1");
        return;
      }
      setSlots(slots);
      setCourse(course);
    });
    api.operatorAvailability(courseId).then(({ availability }) => setAvailability(availability));
    api.notifications(`op:${courseId}`).then(({ notifications }) => setOpNotifs(notifications));
  }, [courseId]);

  // Poll for business pings (new bookings / fulfilments).
  useEffect(() => {
    if (access !== true) return;
    const id = setInterval(() => {
      api.notifications(`op:${courseId}`).then(({ notifications }) => setOpNotifs(notifications));
    }, 8000);
    return () => clearInterval(id);
  }, [courseId, access]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const TABS: { id: Tab; key: string }[] = [
    { id: "add", key: "op.add" },
    { id: "teesheet", key: "op.teesheet" },
    { id: "checkin", key: "op.checkin" },
    { id: "hours", key: "op.hours" },
    { id: "settings", key: "op.settings" },
    { id: "stats", key: "op.stats" },
  ];

  if (access === null) return <div className="skeleton mt-6 h-48 w-full" />;
  if (!access)
    return (
      <BusinessGate
        onAccess={(cid) => {
          setCourseId(cid);
          setAccess(true);
        }}
      />
    );
  if (course && !course.approved) return <PendingApproval course={course} />;

  const unread = opNotifs.filter((n) => !n.read).length;

  return (
    <div className="space-y-5 pt-2">
      {opNotifs.length > 0 && (
        <div className="card p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-forest/50">
            🔔 {t("op.activity")}
            {unread > 0 && (
              <span className="rounded-full bg-lime px-2 py-0.5 text-[10px] text-forest">{unread}</span>
            )}
          </p>
          <div className="space-y-1.5">
            {opNotifs.slice(0, 3).map((n) => (
              <OpPing key={n.id} n={n} />
            ))}
          </div>
        </div>
      )}
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

      {tab === "add" && <AddSlotTab courseId={courseId} slots={slots} onCreated={loadSlots} />}
      {tab === "teesheet" && <TeeSheetTab slots={slots} />}
      {tab === "checkin" && <CheckinTab courseId={courseId} />}
      {tab === "hours" && (
        <HoursTab courseId={courseId} availability={availability} onSaved={loadSlots} />
      )}
      {tab === "settings" && <SettingsTab course={course} onSaved={loadSlots} />}
      {tab === "stats" && <StatsTab courseId={courseId} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add slot — the business creates a bookable tee time at THEIR price
// ---------------------------------------------------------------------------
function AddSlotTab({
  courseId,
  slots,
  onCreated,
}: {
  courseId: string;
  slots: Slot[] | null;
  onCreated: () => void;
}) {
  const { t, locale } = useI18n();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [holes, setHoles] = useState<9 | 18>(18);
  const [price, setPrice] = useState("");
  const [rack, setRack] = useState("");
  const [players, setPlayers] = useState(4);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<number | null>(null);

  useEffect(() => {
    const d = new Date(Date.now() + 2 * 3600000);
    setDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
    setTime(`${String(d.getHours()).padStart(2, "0")}:00`);
  }, []);

  const teeISO = date && time ? new Date(`${date}T${time}`).toISOString() : "";
  const tooSoon = teeISO ? new Date(teeISO).getTime() < Date.now() + 90 * 60000 : false;
  const priceN = Number(price);
  const valid = !!teeISO && !tooSoon && priceN >= 1;

  async function submit() {
    if (!valid) {
      setErr(tooSoon ? t("op.tooSoon") : t("op.fillPrice"));
      return;
    }
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      const { notified } = await api.createSlot({
        courseId,
        teeTimeISO: teeISO,
        holes,
        pricePerPlayer: priceN,
        rackRate: rack ? Number(rack) : undefined,
        players,
      });
      setOk(notified);
      setPrice("");
      setRack("");
      onCreated();
    } catch (e) {
      setErr(String((e as Error).message).includes("too_soon") ? t("op.tooSoon") : t("common.errorTitle"));
    } finally {
      setBusy(false);
    }
  }

  const mySlots = (slots ?? [])
    .filter((s) => new Date(s.teeTimeISO).getTime() > Date.now())
    .sort((a, b) => new Date(a.teeTimeISO).getTime() - new Date(b.teeTimeISO).getTime());

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="card space-y-4 p-5">
        <div>
          <h2 className="font-display text-lg font-bold text-forest">{t("op.addTitle")}</h2>
          <p className="text-sm text-forest/60">{t("op.addHint")}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">{t("op.date")}</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="field-label">{t("op.time")}</label>
            <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="field-label">{t("op.holesLabel")}</label>
          <div className="flex gap-2">
            {[9, 18].map((h) => (
              <button
                key={h}
                onClick={() => setHoles(h as 9 | 18)}
                className={cn(
                  "flex-1 rounded-2xl border py-2.5 font-bold",
                  holes === h ? "border-forest bg-forest text-cream" : "border-forest/15 bg-white text-forest/70",
                )}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">{t("op.yourPrice")}</label>
            <div className="flex items-center rounded-2xl border border-forest/15 bg-white px-3">
              <span className="text-forest/50">$</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="45"
                className="w-full bg-transparent py-3 pl-1 outline-none"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="field-label">{t("op.rackOptional")}</label>
            <div className="flex items-center rounded-2xl border border-forest/15 bg-white px-3">
              <span className="text-forest/50">$</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="95"
                className="w-full bg-transparent py-3 pl-1 outline-none"
                value={rack}
                onChange={(e) => setRack(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div>
          <label className="field-label">{t("deal.players")}</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setPlayers(n)}
                className={cn(
                  "h-11 flex-1 rounded-2xl border font-bold",
                  players === n ? "border-forest bg-forest text-cream" : "border-forest/15 bg-white text-forest/70",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        {tooSoon && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
            ⏱ {t("op.tooSoon")}
          </p>
        )}
        {err && !tooSoon && <p className="text-sm font-semibold text-red-600">{err}</p>}
        {ok !== null && (
          <p className="rounded-xl bg-lime-soft px-3 py-2 text-sm font-semibold text-forest">
            ✓ {t("op.slotLive", { n: String(ok) })}
          </p>
        )}
        <button onClick={submit} disabled={busy || !valid} className="btn-lime w-full">
          {busy ? t("op.pushing") : t("op.addSlot")}
        </button>
        <p className="text-xs text-forest/50">{t("op.addRule")}</p>
      </div>

      <div>
        <p className="field-label">{t("op.yourLive")}</p>
        <div className="space-y-2">
          {mySlots.length === 0 && <EmptyState icon="🕳️" title={t("op.noSlots")} />}
          {mySlots.map((s) => (
            <div key={s.id} className="card flex items-center justify-between p-3">
              <div>
                <p className="font-display font-bold text-forest">{formatLocalTime(s.teeTimeISO, locale)}</p>
                <p className="text-xs text-forest/50">
                  {formatLocalDate(s.teeTimeISO, locale)} · {s.holes}h · {s.spotsLeft}/{s.players}
                </p>
              </div>
              <div className="text-right">
                <span className="font-display text-lg font-bold text-forest">{formatCAD(s.currentPrice)}</span>
                <Badge
                  tone={s.status === "booked" ? "forest" : s.status === "released" ? "lime" : "neutral"}
                  className="ml-2"
                >
                  {s.status === "booked" ? t("op.legendBooked") : s.status === "released" ? "● Live" : t("op.legendUnlisted")}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings — update course info
// ---------------------------------------------------------------------------
function SettingsTab({ course, onSaved }: { course: Course | null; onSaved: () => void }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imgErr, setImgErr] = useState<string | null>(null);

  useEffect(() => {
    if (course) {
      setName(course.name);
      setCity(course.city);
      setPhoto(course.photoUrl);
    }
  }, [course]);

  if (!course) return <Skeleton className="h-40 w-full" />;

  async function save() {
    setBusy(true);
    await api.updateCourse({ courseId: course!.id, name, city });
    setBusy(false);
    setOk(true);
    onSaved();
    setTimeout(() => setOk(false), 2000);
  }

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setImgErr(null);
    if (file.size > 4 * 1024 * 1024) {
      setImgErr(t("op.photoTooLarge"));
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      setUploading(true);
      try {
        const { course: updated } = await api.uploadCourseImage(course!.id, dataUrl);
        setPhoto(updated.photoUrl);
        onSaved();
      } catch {
        setImgErr(t("op.photoFailed"));
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="card max-w-lg space-y-5 p-5">
      <h2 className="font-display text-lg font-bold text-forest">{t("op.settingsTitle")}</h2>

      {/* Course photo — golfers see this on your listings */}
      <div>
        <label className="field-label">{t("op.photo")}</label>
        <div className="mt-1 overflow-hidden rounded-2xl border border-forest/10 bg-forest/5">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={course.name} className="h-40 w-full object-cover" />
          ) : (
            <div className="flex h-40 items-center justify-center text-4xl text-forest/30">🏌️</div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <label className="btn-ghost cursor-pointer text-sm">
            {uploading ? t("op.uploading") : t("op.updatePhoto")}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onPickImage}
              disabled={uploading}
            />
          </label>
          <span className="text-xs text-forest/50">{t("op.photoHint")}</span>
        </div>
        {imgErr && <p className="mt-1 text-xs font-semibold text-red-500">{imgErr}</p>}
      </div>

      <div>
        <label className="field-label">{t("op.courseName")}</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="field-label">{t("op.city")}</label>
        <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy} className="btn-lime">
          {busy ? t("common.loading") : t("op.saveCourse")}
        </button>
        {ok && <span className="text-sm font-semibold text-lime-dark">✓ {t("op.saved")}</span>}
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
function CheckinTab({ courseId }: { courseId: string }) {
  const { t, locale } = useI18n();
  const [checkins, setCheckins] = useState<Booking[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    api.operatorCheckins(courseId).then(({ checkins }) => setCheckins(checkins));
  }, [courseId]);

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
// Hours tab — operator sets the days / windows they CAN'T fill (blackout)
// ---------------------------------------------------------------------------
const DAY_LABELS = [
  { n: 0, en: "Sun", fr: "Dim" },
  { n: 1, en: "Mon", fr: "Lun" },
  { n: 2, en: "Tue", fr: "Mar" },
  { n: 3, en: "Wed", fr: "Mer" },
  { n: 4, en: "Thu", fr: "Jeu" },
  { n: 5, en: "Fri", fr: "Ven" },
  { n: 6, en: "Sat", fr: "Sam" },
];

function HoursTab({
  courseId,
  availability,
  onSaved,
}: {
  courseId: string;
  availability: CourseAvailability | null;
  onSaved: () => void;
}) {
  const { t, locale } = useI18n();
  const [closedDays, setClosedDays] = useState<number[]>([]);
  const [blackout, setBlackout] = useState<CourseAvailability["blackout"]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (availability) {
      setClosedDays(availability.closedDays);
      setBlackout(availability.blackout);
    }
  }, [availability]);

  if (!availability) {
    return <Skeleton className="h-64 w-full" />;
  }

  const toggleDay = (n: number) =>
    setClosedDays((d) => (d.includes(n) ? d.filter((x) => x !== n) : [...d, n]));

  const addWindow = () => setBlackout((b) => [...b, { startHour: 11, endHour: 13 }]);
  const removeWindow = (i: number) => setBlackout((b) => b.filter((_, idx) => idx !== i));
  const updateWindow = (i: number, patch: Partial<CourseAvailability["blackout"][number]>) =>
    setBlackout((b) => b.map((w, idx) => (idx === i ? { ...w, ...patch } : w)));

  async function save() {
    setSaving(true);
    await api.setAvailability({ courseId, closedDays, blackout });
    setSaving(false);
    setSaved(true);
    onSaved();
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-forest/60">{t("op.hoursHint")}</p>

      {/* Closed days */}
      <div className="card p-5">
        <p className="field-label">{t("op.closedDays")}</p>
        <div className="flex flex-wrap gap-2">
          {DAY_LABELS.map((d) => (
            <button
              key={d.n}
              onClick={() => toggleDay(d.n)}
              aria-pressed={closedDays.includes(d.n)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                closedDays.includes(d.n)
                  ? "bg-red-500 text-white"
                  : "border border-forest/15 bg-white text-forest/70 hover:bg-forest/5",
              )}
            >
              {locale === "fr" ? d.fr : d.en}
            </button>
          ))}
        </div>
      </div>

      {/* Blackout windows */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="field-label mb-0">{t("op.blackoutWindows")}</p>
          <button onClick={addWindow} className="btn-ghost px-3 py-1.5 text-xs">
            + {t("op.addWindow")}
          </button>
        </div>
        {blackout.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-forest/20 px-4 py-6 text-center text-sm text-forest/50">
            {t("op.noBlackout")}
          </p>
        ) : (
          <div className="space-y-2">
            {blackout.map((w, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-2xl bg-forest/5 p-3">
                <HourSelect value={w.startHour} onChange={(v) => updateWindow(i, { startHour: v })} max={23} />
                <span className="text-forest/50">→</span>
                <HourSelect value={w.endHour} onChange={(v) => updateWindow(i, { endHour: v })} min={1} max={24} />
                <input
                  className="input min-w-0 flex-1 py-2 text-sm"
                  placeholder={t("op.windowLabel")}
                  value={w.label ?? ""}
                  onChange={(e) => updateWindow(i, { label: e.target.value })}
                />
                <button
                  onClick={() => removeWindow(i)}
                  className="rounded-lg px-2 py-1 text-red-500 hover:bg-red-50"
                  aria-label="remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-forest/50">
          {t("op.blackoutExplain")}
          {blackout.length > 0 && (
            <> {blackout.map((w) => formatBlackoutWindow(w)).join(", ")}.</>
          )}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-lime">
          {saving ? t("common.loading") : t("op.saveHours")}
        </button>
        {saved && <span className="text-sm font-semibold text-lime-dark">✓ {t("op.hoursSaved")}</span>}
      </div>
    </div>
  );
}

function HourSelect({
  value,
  onChange,
  min = 0,
  max = 23,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const opts: number[] = [];
  for (let h = min; h <= max; h++) opts.push(h);
  const label = (h: number) => {
    const hh = ((h % 24) + 24) % 24;
    const period = hh < 12 ? "AM" : "PM";
    const disp = hh % 12 === 0 ? 12 : hh % 12;
    return `${disp}:00 ${period}`;
  };
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-xl border border-forest/15 bg-white px-2 py-2 text-sm font-semibold text-forest outline-none"
    >
      {opts.map((h) => (
        <option key={h} value={h}>
          {label(h)}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Stats tab
// ---------------------------------------------------------------------------
function StatsTab({ courseId }: { courseId: string }) {
  const { t } = useI18n();
  const [stats, setStats] = useState<OperatorStats | null>(null);

  useEffect(() => {
    api.operatorStats(courseId).then(({ stats }) => setStats(stats));
  }, [courseId]);

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
