"use client";

import { useState } from "react";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";

/** 4-digit PIN gate that unlocks a member's exclusive perks (Rewards) area. */
export function PinLock() {
  const { unlockPerks } = useSession();
  const { t } = useI18n();
  const [pin, setPin] = useState("");
  const [wrong, setWrong] = useState(false);

  function tryUnlock(value: string) {
    if (value.length === 4) {
      if (!unlockPerks(value)) {
        setWrong(true);
        setPin("");
      }
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 pt-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-forest text-3xl text-lime">
        🔒
      </div>
      <h1 className="font-display text-2xl font-bold text-forest">{t("pin.lockTitle")}</h1>
      <p className="text-sm text-forest/60">{t("pin.lockSub")}</p>

      <input
        autoFocus
        inputMode="numeric"
        maxLength={4}
        value={pin}
        placeholder="••••"
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, 4);
          setPin(v);
          setWrong(false);
          tryUnlock(v);
        }}
        className={cn(
          "input max-w-[12rem] text-center text-3xl font-bold tracking-[0.6em] tabular-nums",
          wrong && "border-red-400",
        )}
        aria-label={t("pin.lockSub")}
      />
      {wrong && <p className="text-sm font-semibold text-red-600">{t("pin.wrong")}</p>}
      <button
        onClick={() => tryUnlock(pin)}
        disabled={pin.length !== 4}
        className="btn-primary w-full max-w-[12rem]"
      >
        {t("pin.unlock")}
      </button>
    </div>
  );
}
