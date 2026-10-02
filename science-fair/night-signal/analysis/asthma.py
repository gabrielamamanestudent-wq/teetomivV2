#!/usr/bin/env python3
"""
Night Signal - ASTHMA spin-off
==============================

Night-time asthma often gets worse in the early morning (around 4 a.m.):
breathing speeds up, oxygen dips a little, and people cough. The wearable
already measures the signals needed to watch for that:

  - Breathing rate, every 5 minutes (from the heart-rate rhythm, see signals.py)
  - Fast-breathing periods: above 20 breaths/min, or 25% above the person's
    own baseline
  - Oxygen dips per hour (ODI): drops of 3% or more
  - Cough-like jolts picked up by the motion sensor
  - Early-morning check: is the last part of the night worse than the start?

USAGE
-----
    python simulate.py --profile asthma --out asthma_night.csv
    python asthma.py asthma_night.csv

Screening concept only. Real asthma monitoring would add a microphone for
wheeze and cough sounds. Not a medical device.
"""

import sys

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

import analyze
from signals import breathing_rate

WIN = 300               # 5-minute windows (seconds / samples)
FAST_BREATHING = 20     # breaths per minute
COUGH_JOLT_G = 0.3      # sudden change in acceleration that counts as a jolt


def analyze_asthma(path):
    raw = pd.read_csv(path)
    raw["timestamp"] = pd.to_datetime(raw["timestamp"])
    raw = raw.sort_values("timestamp").reset_index(drop=True)
    hrdf = raw[raw["hr_valid"] == 1].reset_index(drop=True)
    hr = hrdf["heart_rate"].to_numpy(dtype=float)

    # breathing rate per 5-minute window
    times, rates = [], []
    for i in range(0, len(hr) - WIN, WIN):
        br = breathing_rate(hr[i:i + WIN])
        if br is not None:
            times.append(hrdf["timestamp"].iloc[i + WIN // 2]); rates.append(br)
    rates = np.array(rates)
    baseline = float(np.median(rates[: max(1, len(rates) // 2)]))
    limit = max(FAST_BREATHING, baseline * 1.25)
    fast = rates > limit

    # early morning (last quarter of the night) vs the rest
    q = int(len(rates) * 0.75)
    late, early = float(np.median(rates[q:])), float(np.median(rates[:q]))

    # oxygen dips per hour (ODI)
    df = analyze.load(path)
    dips = analyze.find_events(df, drop=3.0, min_seconds=10.0, baseline_seconds=120.0)
    hours = df["elapsed_s"].iloc[-1] / 3600
    odi = len(dips) / hours

    # cough-like jolts from the motion sensor (merge jolts within 5 s)
    mag = np.sqrt(raw["ax"] ** 2 + raw["ay"] ** 2 + raw["az"] ** 2).to_numpy()
    jolt = np.abs(np.diff(mag, prepend=mag[0])) > COUGH_JOLT_G
    coughs, last = [], -99
    for i in np.flatnonzero(jolt):
        if i - last > 5:
            coughs.append(raw["timestamp"].iloc[i])
        last = i
    return {"times": times, "rates": rates, "baseline": baseline, "limit": limit, "fast": fast,
            "early": early, "late": late, "odi": odi, "dips": len(dips), "coughs": coughs, "hours": hours}


def plot(r, out_png):
    fig, ax = plt.subplots(figsize=(12, 5.2))
    t = r["times"]
    step = pd.Timedelta(seconds=WIN)
    for ti, f in zip(t, r["fast"]):
        if f:
            ax.axvspan(ti - step / 2, ti + step / 2, color="#cf4747", alpha=0.18, lw=0)
    ax.plot(t, r["rates"], color="#1f8a9c", lw=2.2, marker="o", ms=3.5)
    ax.axhline(r["limit"], color="#cf4747", ls="--", lw=1)
    ax.text(t[0], r["limit"] + 0.4, f"  fast breathing (> {r['limit']:.0f}/min)", color="#cf4747", fontsize=9)
    for c in r["coughs"]:
        ax.plot([c, c], [6.2, 7.4], color="#e0a020", lw=1.6)
    ax.text(t[0], 7.7, "  cough-like jolts (motion sensor)", color="#b07a10", fontsize=9)
    ax.set_ylim(5.5, max(26, r["rates"].max() + 2))
    ax.set_ylabel("Breaths per minute", fontsize=12)
    ax.set_xlabel("Time", fontsize=12)
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M"))
    ax.grid(axis="y", alpha=0.2)
    fig.suptitle("Asthma spin-off: breathing through the night", fontsize=15, fontweight="bold")
    fig.tight_layout(rect=[0, 0, 1, .95])
    fig.savefig(out_png, dpi=150)
    print(f"Saved chart -> {out_png}")


def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python asthma.py <night.csv>")
    path = sys.argv[1]
    r = analyze_asthma(path)
    fast_min = int(r["fast"].sum() * WIN / 60)
    print("\n" + "=" * 56)
    print("  NIGHT SIGNAL - ASTHMA SPIN-OFF")
    print("=" * 56)
    print(f"  Normal breathing rate    : {r['baseline']:.1f} /min")
    print(f"  Fast-breathing time      : {fast_min} min  (> {r['limit']:.0f}/min)")
    print(f"  Early-morning breathing  : {r['late']:.1f} /min  vs {r['early']:.1f} earlier")
    print(f"  Oxygen dips per hour     : {r['odi']:.1f}  ({r['dips']} dips of 3%+)")
    print(f"  Cough-like jolts         : {len(r['coughs'])}  ({len(r['coughs']) / r['hours']:.1f}/h)")
    worse = r["late"] > r["early"] * 1.2
    print("  -> Breathing got WORSE toward morning (classic night-time asthma pattern)."
          if worse else "  -> No early-morning worsening found.")
    print("=" * 56)
    print("  Screening only — not a diagnosis.")
    print("=" * 56 + "\n")
    plot(r, path.rsplit(".", 1)[0] + "_asthma.png")


if __name__ == "__main__":
    main()
