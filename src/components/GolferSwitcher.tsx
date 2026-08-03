"use client";

import { useState } from "react";
import { useSession, DEMO_GOLFERS } from "@/lib/session";
import { cn } from "@/lib/cn";

export function GolferSwitcher() {
  const { golfer, setGolfer } = useSession();
  const [open, setOpen] = useState(false);
  const initials = golfer.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-xs font-bold text-lime"
        aria-label="Switch demo golfer"
        aria-expanded={open}
      >
        {initials}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-forest/10 bg-white p-1.5 shadow-card-lg animate-fade-in">
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-forest/40">
              Demo golfer
            </p>
            {DEMO_GOLFERS.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setGolfer(g);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm",
                  g.id === golfer.id ? "bg-forest/5 font-semibold" : "hover:bg-forest/5",
                )}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest/10 text-[10px] font-bold text-forest">
                  {g.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </span>
                <span className="min-w-0">
                  <span className="block truncate">{g.name}</span>
                  <span className="block truncate text-[11px] text-forest/50">{g.email}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
