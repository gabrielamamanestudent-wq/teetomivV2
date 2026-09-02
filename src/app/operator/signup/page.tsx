"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { api, setOperatorAuth } from "@/lib/api-client";
import { ALL_REGIONS, type Region } from "@/lib/data/types";
import { cn } from "@/lib/cn";

const REGIONS: Region[] = ALL_REGIONS;

export default function OperatorSignupPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [courseName, setCourseName] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState<Region>("west-island");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(false);

  const valid =
    courseName.trim().length > 1 &&
    city.trim() &&
    contactName.trim() &&
    /.+@.+\..+/.test(email) &&
    /^\d{4}$/.test(pin);

  async function submit() {
    if (!valid) {
      setErr(true);
      return;
    }
    setSubmitting(true);
    try {
      const { courseId } = await api.operatorSignup({
        courseName: courseName.trim(),
        city: city.trim(),
        region,
        contactName: contactName.trim(),
        email: email.trim(),
        pin,
      });
      setOperatorAuth(email.trim(), pin);
      window.localStorage.setItem("teetomic.operatorCourseId", courseId);
      router.push("/operator");
    } catch {
      setSubmitting(false);
      setErr(true);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-2">
      <div>
        <h1 className="font-display text-2xl font-bold text-forest">{t("op.signupTitle")}</h1>
        <p className="text-sm text-forest/60">{t("op.signupSub")}</p>
      </div>

      <div className="card space-y-4 p-5">
        <div>
          <label className="field-label" htmlFor="cn">{t("op.courseName")}</label>
          <input id="cn" className="input" value={courseName} onChange={(e) => setCourseName(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="city">{t("op.city")}</label>
            <input id="city" className="input" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="region">{t("op.region")}</label>
            <select
              id="region"
              className="input"
              value={region}
              onChange={(e) => setRegion(e.target.value as Region)}
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {t(`region.${r}` as never)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="contact">{t("op.contactName")}</label>
            <input id="contact" className="input" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="oemail">{t("op.signupEmail")}</label>
            <input id="oemail" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="opin">{t("op.signupPin")}</label>
          <input
            id="opin"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            className="input max-w-[10rem] text-center text-xl font-bold tracking-[0.4em] tabular-nums"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
        </div>
        {err && !valid && (
          <p className="text-sm font-semibold text-red-600">
            {t("common.errorTitle")} — {t("op.courseName")}, {t("op.city")}, {t("op.signupEmail")}, {t("op.signupPin")}.
          </p>
        )}
        <button onClick={submit} disabled={submitting} className={cn("btn-lime w-full", !valid && "opacity-60")}>
          {submitting ? t("common.loading") : t("op.createCourse")}
        </button>
      </div>
    </div>
  );
}
