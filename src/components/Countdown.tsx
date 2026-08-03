"use client";

import { useEffect, useState } from "react";
import { countdown } from "@/lib/time";
import { cn } from "@/lib/cn";

/** Live-updating countdown badge that ticks every second. */
export function Countdown({
  toISO,
  className,
  prefix,
}: {
  toISO: string;
  className?: string;
  prefix?: string;
}) {
  const [label, setLabel] = useState(() => countdown(toISO));
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const tick = () => {
      setLabel(countdown(toISO));
      const ms = new Date(toISO).getTime() - Date.now();
      setUrgent(ms > 0 && ms < 3 * 60 * 60 * 1000);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [toISO]);

  return (
    <span
      className={cn(
        "chip tabular-nums",
        urgent ? "bg-red-100 text-red-700 animate-pulse-soft" : "bg-forest/10 text-forest",
        className,
      )}
    >
      ⏱ {prefix ? `${prefix} ` : ""}
      {label}
    </span>
  );
}
