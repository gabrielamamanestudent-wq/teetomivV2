"use client";

import { useState } from "react";
import { useSession, COURSE_DEMO_PIN } from "@/lib/session";
import { useI18n } from "@/lib/i18n/context";
import { Logo } from "./Logo";
import { cn } from "@/lib/cn";

export function WelcomeGate() {
  const { showWelcome, createAccount, playConcept } = useSession();
  const { t } = useI18n();
  const [step, setStep] = useState<"choose" | "create" | "coursePin">("choose");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [coursePin, setCoursePin] = useState("");
  const [coursePinErr, setCoursePinErr] = useState(false);
  const [err, setErr] = useState(false);

  if (!showWelcome) return null;

  const canCreate = name.trim() && /.+@.+\..+/.test(email) && /^\d{4}$/.test(pin);

  function submit() {
    if (!canCreate) {
      setErr(true);
      return;
    }
    createAccount(name.trim(), email.trim(), pin);
  }

  function checkCoursePin() {
    if (coursePin === COURSE_DEMO_PIN) {
      playConcept("course");
    } else {
      setCoursePinErr(true);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-forest/95 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-cream p-6 shadow-card-lg animate-fade-in sm:p-8">
        <div className="flex justify-center">
          <Logo className="text-2xl" />
        </div>

        {step === "choose" && (
          <>
            <h1 className="mt-4 text-center font-display text-2xl font-bold text-forest">
              {t("welcome.title")}
            </h1>
            <p className="mx-auto mt-2 max-w-xs text-center text-sm text-forest/60">
              {t("welcome.sub")}
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => playConcept("golfer")}
                className="w-full rounded-2xl bg-forest p-4 text-left text-cream transition-transform active:scale-[0.99]"
              >
                <span className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold">▶ {t("welcome.seeHow")}</span>
                  <span aria-hidden>→</span>
                </span>
                <span className="mt-0.5 block text-sm text-cream/70">{t("welcome.seeHowDesc")}</span>
              </button>
              <button
                onClick={() => setStep("create")}
                className="w-full rounded-2xl border-2 border-forest/15 bg-white p-4 text-left transition-transform active:scale-[0.99]"
              >
                <span className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-forest">
                    ⭐ {t("welcome.createBtn")}
                  </span>
                  <span aria-hidden className="text-forest/40">→</span>
                </span>
                <span className="mt-0.5 block text-sm text-forest/60">{t("welcome.createDesc")}</span>
              </button>
              <button
                onClick={() => setStep("coursePin")}
                className="w-full rounded-2xl border-2 border-forest/15 bg-white p-4 text-left transition-transform active:scale-[0.99]"
              >
                <span className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-forest">
                    🏪 {t("op.forCourses")}
                  </span>
                  <span className="chip bg-lime text-forest">PIN</span>
                </span>
                <span className="mt-0.5 block text-sm text-forest/60">{t("op.forCoursesDesc")}</span>
              </button>
            </div>
          </>
        )}

        {step === "create" && (
          <>
            <h1 className="mt-4 text-center font-display text-2xl font-bold text-forest">
              {t("welcome.formTitle")}
            </h1>
            <div className="mt-5 space-y-4">
              <div>
                <label className="field-label" htmlFor="w-name">{t("welcome.name")}</label>
                <input id="w-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="field-label" htmlFor="w-email">{t("welcome.email")}</label>
                <input id="w-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="field-label" htmlFor="w-pin">{t("welcome.pin")}</label>
                <input
                  id="w-pin"
                  inputMode="numeric"
                  maxLength={4}
                  className="input text-center text-2xl font-bold tracking-[0.5em] tabular-nums"
                  value={pin}
                  placeholder="••••"
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
                <p className="mt-1 text-xs text-forest/50">{t("welcome.pinHint")}</p>
              </div>
              {err && !canCreate && (
                <p className="text-sm font-semibold text-red-600">
                  {t("welcome.name")} · {t("welcome.email")} · {t("welcome.pin")}
                </p>
              )}
              <button onClick={submit} className={cn("btn-lime w-full", !canCreate && "opacity-60")}>
                {t("welcome.create")}
              </button>
              <button onClick={() => setStep("choose")} className="w-full text-center text-sm font-semibold text-forest/50">
                ← {t("welcome.back")}
              </button>
            </div>
          </>
        )}

        {step === "coursePin" && (
          <>
            <h1 className="mt-4 text-center font-display text-2xl font-bold text-forest">
              {t("welcome.coursePinTitle")}
            </h1>
            <p className="mx-auto mt-2 max-w-xs text-center text-sm text-forest/60">
              {t("welcome.coursePinSub")}
            </p>
            <div className="mt-5 space-y-4">
              <input
                autoFocus
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                className={cn(
                  "input mx-auto max-w-[12rem] text-center text-3xl font-bold tracking-[0.6em] tabular-nums",
                  coursePinErr && "border-red-400",
                )}
                value={coursePin}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setCoursePin(v);
                  setCoursePinErr(false);
                  if (v.length === 4 && v === COURSE_DEMO_PIN) playConcept("course");
                }}
              />
              {coursePinErr && (
                <p className="text-center text-sm font-semibold text-red-600">{t("welcome.coursePinWrong")}</p>
              )}
              <button
                onClick={checkCoursePin}
                disabled={coursePin.length !== 4}
                className="btn-lime w-full"
              >
                {t("welcome.coursePinGo")}
              </button>
              <button onClick={() => setStep("choose")} className="w-full text-center text-sm font-semibold text-forest/50">
                ← {t("welcome.back")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
