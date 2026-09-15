"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import type { Region } from "@/lib/data/types";

// South-Florida-first standby list. This is the demand-side capture we run
// BEFORE a market has live supply — the roster of local golfers we show pro
// shops so they'll list their empty tee times. Kept self-contained (no i18n
// wiring) so it can ship and be linked from social posts immediately.

const AREAS: { value: Region; label: string }[] = [
  { value: "miami-dade", label: "Miami-Dade" },
  { value: "broward", label: "Broward (Fort Lauderdale)" },
  { value: "other", label: "Elsewhere" },
];

export default function WaitlistPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState<Region>("miami-dade");
  const [homeArea, setHomeArea] = useState("");
  const [source, setSource] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  // Track where a signup came from (?src=reddit, ?src=fb, ?src=ig …).
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("src");
    if (s) setSource(s.slice(0, 40));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim() || !email.trim()) {
      setErr("Please add your name and email.");
      return;
    }
    setBusy(true);
    try {
      await api.joinWaitlist({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        region,
        homeArea: homeArea.trim() || undefined,
        source,
      });
      setDone(true);
    } catch {
      setErr("Something went wrong — please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md pt-10">
        <div className="card p-8 text-center">
          <p className="text-4xl">⛳️</p>
          <h1 className="mt-3 font-display text-2xl font-bold text-forest">You&apos;re on the list.</h1>
          <p className="mt-2 text-forest/70">
            We&apos;ll text you the moment last-minute tee times open up near you. Early members get
            first crack at every deal — no booking fees while we launch.
          </p>
          <p className="mt-4 text-sm text-forest/60">
            Know a golf buddy who never plans ahead? Forward them{" "}
            <span className="font-semibold text-forest">teetomic.golf/waitlist</span> — the more
            golfers we bring, the more courses open their sheets.
          </p>
          <Link href="/browse" className="btn-ghost mt-6 inline-block">
            Peek at how it works →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 pt-6">
      <section className="rounded-3xl bg-forest px-6 py-9 text-cream shadow-card-lg">
        <span className="chip bg-lime text-forest">South Florida · Free early access</span>
        <h1 className="mt-4 font-display text-3xl font-bold leading-tight">
          Play more golf, pay less — last-minute.
        </h1>
        <p className="mt-3 text-cream/80">
          TEETOMIC texts you when nearby courses drop their empty tee times at a discount. Grab a
          same-day round for less than the rack rate. Join the standby list and we&apos;ll ping you
          the second deals go live in your area.
        </p>
        <p className="mt-3 text-sm text-lime">✓ No cost to join ✓ No spam — just tee-time alerts</p>
      </section>

      <form onSubmit={submit} className="card space-y-4 p-6">
        <div>
          <label className="field-label" htmlFor="wl-name">Name</label>
          <input id="wl-name" className="input w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" />
        </div>
        <div>
          <label className="field-label" htmlFor="wl-email">Email</label>
          <input id="wl-email" type="email" className="input w-full" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        </div>
        <div>
          <label className="field-label" htmlFor="wl-phone">Mobile (for text alerts) <span className="font-normal text-forest/40">— optional</span></label>
          <input id="wl-phone" type="tel" className="input w-full" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(305) 555-0142" />
        </div>
        <div>
          <label className="field-label" htmlFor="wl-region">Where do you play?</label>
          <select id="wl-region" className="input w-full" value={region} onChange={(e) => setRegion(e.target.value as Region)}>
            {AREAS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="wl-area">Home course or neighbourhood <span className="font-normal text-forest/40">— optional</span></label>
          <input id="wl-area" className="input w-full" value={homeArea} onChange={(e) => setHomeArea(e.target.value)} placeholder="Doral, Kendall, Miami Beach…" />
        </div>

        {err && <p className="text-sm font-semibold text-red-500">{err}</p>}

        <button type="submit" disabled={busy} className="btn-lime w-full">
          {busy ? "Joining…" : "Join the standby list"}
        </button>
        <p className="text-center text-xs text-forest/50">
          We only use your info to send you tee-time deals. Unsubscribe anytime.
        </p>
      </form>
    </div>
  );
}
