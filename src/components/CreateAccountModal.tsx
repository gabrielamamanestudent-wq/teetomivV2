"use client";

import { useState } from "react";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n/context";
import { Logo } from "./Logo";
import { cn } from "@/lib/cn";

export function CreateAccountModal() {
  const { showCreate, createAccount, login, closeCreate } = useSession();
  const { t } = useI18n();
  const [tab, setTab] = useState<"create" | "login">("create");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);

  if (!showCreate) return null;

  const emailOk = /.+@.+\..+/.test(email);
  const pinOk = /^\d{4}$/.test(pin);
  const canCreate = name.trim() && emailOk && pinOk;
  const canLogin = emailOk && pinOk;

  function submit() {
    if (tab === "create") {
      if (!canCreate) return setErr(true);
      createAccount(name.trim(), email.trim(), pin);
    } else {
      if (!canLogin) return setErr(true);
      login(email.trim(), pin);
    }
  }

  return (
    <div className="fixed inset-0 z-[68] flex items-center justify-center bg-forest/95 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-cream p-6 shadow-card-lg animate-fade-in sm:p-8">
        <div className="flex items-center justify-between">
          <Logo className="text-xl" />
          <button onClick={closeCreate} className="text-sm font-semibold text-forest/40" aria-label={t("acct.close")}>
            ✕
          </button>
        </div>

        {/* tabs */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-forest/5 p-1">
          {(["create", "login"] as const).map((tb) => (
            <button
              key={tb}
              onClick={() => {
                setTab(tb);
                setErr(false);
              }}
              className={cn(
                "rounded-xl py-2 text-sm font-bold transition-colors",
                tab === tb ? "bg-forest text-cream" : "text-forest/60",
              )}
            >
              {tb === "create" ? t("acct.createTab") : t("acct.loginTab")}
            </button>
          ))}
        </div>

        <h1 className="mt-5 font-display text-xl font-bold text-forest">
          {tab === "create" ? t("acct.createTitle") : t("acct.loginTitle")}
        </h1>

        <div className="mt-4 space-y-4">
          {tab === "create" && (
            <div>
              <label className="field-label" htmlFor="a-name">{t("welcome.name")}</label>
              <input id="a-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label className="field-label" htmlFor="a-email">{t("welcome.email")}</label>
            <input id="a-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="a-pin">{t("welcome.pin")}</label>
            <input
              id="a-pin"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              className="input text-center text-2xl font-bold tracking-[0.5em] tabular-nums"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
            {tab === "create" && <p className="mt-1 text-xs text-forest/50">{t("welcome.pinHint")}</p>}
          </div>
          {err && (
            <p className="text-sm font-semibold text-red-600">
              {t("welcome.email")} · {t("welcome.pin")}
              {tab === "create" ? ` · ${t("welcome.name")}` : ""}
            </p>
          )}
          <button
            onClick={submit}
            className={cn("btn-lime w-full", !(tab === "create" ? canCreate : canLogin) && "opacity-60")}
          >
            {tab === "create" ? t("acct.create") : t("acct.login")}
          </button>
        </div>
      </div>
    </div>
  );
}
