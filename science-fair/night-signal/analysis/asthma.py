#!/usr/bin/env python3
"""
Night Signal - ASTHMA spin-off
==============================

EXPLORATORY idea, not part of the tested project (shown so far only on
simulated demonstration data). Night-time asthma often gets worse in the early
morning; this script estimates signals that might be related:

  - Breathing rate, every 5 minutes (from the heart-rate rhythm, see signals.py)
  - Fast-breathing periods: above 20 breaths/min, or 25% above the person's
    own baseline
  - Oxygen desaturation events per hour of valid recording (3-point drops)
  - Cough-like jolts picked up by the motion sensor
  - Early-morning check: is the last part of the night worse than the start?

USAGE
-----
    python simulate.py --profile asthma --out asthma_night.csv
    python asthma.py asthma_night.csv

Exploratory concept only. Real asthma monitoring would add a microphone for
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
import chart_style as cs
cs.apply()

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

    # oxygen desaturation events per hour of VALID recording
    df = analyze.load(path)
    dips = analyze.find_events(df, drop=3.0, min_seconds=10.0, baseline_seconds=120.0)
    hours = df.attrs["valid_s"] / 3600
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
    fig, ax = plt.subplots(figsize=(7.4, 3.9))
    t = r["times"]
    step = pd.Timedelta(seconds=WIN)
    for ti, f in zip(t, r["fast"]):
        if f:
            ax.axvspan(ti - step / 2, ti + step / 2, color=cs.RED, alpha=0.13, lw=0, zorder=0)
    ax.plot(t, r["rates"], color=cs.BLUE, lw=2.2, marker="o", ms=4, mec="white", mew=0.8, zorder=3)
    ax.axhline(r["limit"], color=cs.RED, ls=(0, (4, 4)), lw=1.1)
    cs.end_label(ax, r["limit"], f"{r['limit']:.0f} fast", cs.RED)
    for c in r["coughs"]:
        ax.plot([c, c], [6.2, 7.6], color=cs.ORANGE, lw=1.8, solid_capstyle="round")
    ax.text(t[0], 8.0, "Cough-like jolts (motion sensor)", color=cs.ORANGE, fontsize=10.5, fontweight="bold")
    ax.set_ylim(5.5, max(26, r["rates"].max() + 2))
    ax.set_ylabel("Breaths per minute")
    ax.yaxis.set_major_locator(matplotlib.ticker.MaxNLocator(integer=True))
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M"))
    cs.title(ax, "Estimated breathing rate", "Exploratory idea: breathing rate estimated from heart-rate rhythm",
             demo=analyze.is_demo(out_png))
    fig.tight_layout()
    fig.savefig(out_png, dpi=180)
    print(f"Saved chart -> {out_png}")


def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python asthma.py <night.csv>")
    path = sys.argv[1]
    r = analyze_asthma(path)
    fast_min = int(r["fast"].sum() * WIN / 60)
    print("\n" + "=" * 56)
    print("  NIGHT SIGNAL - BREATHING-RATE ESTIMATE (exploratory)")
    if analyze.is_demo(path):
        print("  *** DEMONSTRATION DATA (simulated) ***")
    print("=" * 56)
    print(f"  Baseline (estimated)     : {r['baseline']:.1f} breaths/min")
    print(f"  Fast-breathing time      : {fast_min} min  (> {r['limit']:.0f}/min)")
    print(f"  Early-morning breathing  : {r['late']:.1f} /min  vs {r['early']:.1f} earlier")
    print(f"  Desaturation events      : {r['dips']}  ({r['odi']:.1f} per valid hour)")
    print(f"  Cough-like jolts         : {len(r['coughs'])}  ({len(r['coughs']) / r['hours']:.1f}/h)")
    worse = r["late"] > r["early"] * 1.2
    print("  -> Estimated breathing rate was higher late in the recording (descriptive only)."
          if worse else "  -> No late-recording rise in estimated breathing rate.")
    print("=" * 56)
    print("  Exploratory only: breathing rate is estimated, not measured; this cannot detect asthma.")
    print("=" * 56 + "\n")
    plot(r, path.rsplit(".", 1)[0] + "_asthma.png")


if __name__ == "__main__":
    main()
