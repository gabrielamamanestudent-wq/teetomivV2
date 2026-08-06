"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";

interface Msg {
  role: "user" | "bot";
  text: string;
}

const CHIPS: { en: string; fr: string }[] = [
  { en: "What's the $10 fee?", fr: "C'est quoi les frais de 10 $ ?" },
  { en: "How do cancellations work?", fr: "Comment fonctionne l'annulation ?" },
  { en: "How do points & Gold work?", fr: "Comment marchent les points et Or ?" },
  { en: "What are standby alerts?", fr: "C'est quoi les alertes standby ?" },
  { en: "I run a course — how do I join?", fr: "Je gère un club — comment m'inscrire ?" },
];

export function HelpCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, locale } = useI18n();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Greeting on open.
  useEffect(() => {
    if (open && msgs.length === 0) {
      setMsgs([{ role: "bot", text: t("help.greeting") }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, thinking]);

  if (!open) return null;

  async function send(text: string) {
    const q = text.trim();
    if (!q || thinking) return;
    setInput("");
    // Snapshot the thread before this turn so the assistant gets prior context.
    const history = msgs.filter((m) => m.text.trim());
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setThinking(true);
    try {
      const res = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, locale, history }),
      });
      const data = await res.json();
      setMsgs((m) => [...m, { role: "bot", text: data.reply || t("help.noMatch") }]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: t("help.noMatch") }]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-forest/80 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex h-[86vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-cream shadow-card-lg animate-fade-in sm:h-[72vh] sm:rounded-3xl">
        <div className="flex items-center justify-between bg-forest px-5 py-4 text-cream">
          <span className="flex items-center gap-2 font-display font-bold">
            🤖 {t("help.title")}
          </span>
          <button onClick={onClose} aria-label={t("acct.close")} className="text-cream/70 hover:text-cream">
            ✕
          </button>
        </div>

        {/* thread */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[82%] rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "user"
                    ? "bg-forest text-cream"
                    : "bg-white text-forest/85 shadow-card",
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex justify-start">
              <div className="flex gap-1 rounded-2xl bg-white px-4 py-3 shadow-card">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-forest/40"
                    style={{ animationDelay: `${d * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* quick-reply chips (only before the first question) */}
          {msgs.length <= 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {CHIPS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => send(locale === "fr" ? c.fr : c.en)}
                  className="rounded-full border border-forest/15 bg-white px-3 py-1.5 text-xs font-semibold text-forest/80 hover:border-forest/30"
                >
                  {locale === "fr" ? c.fr : c.en}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* input */}
        <div className="border-t border-forest/10 bg-white p-3">
          <div className="flex gap-2">
            <input
              className="input flex-1 py-2.5"
              placeholder={t("help.placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
            />
            <button onClick={() => send(input)} disabled={thinking} className="btn-lime px-4 py-2.5">
              {t("help.send")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
