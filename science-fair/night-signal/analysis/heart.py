#!/usr/bin/env python3
"""
Night Signal - HEART spin-off
=============================

The same fingertip sensor that watches oxygen also tracks the heart all night.
This script screens a recording for heart patterns worth mentioning to a
doctor:

  - Resting heart rate (lowest steady 10-minute stretch)
  - Racing heart (tachycardia): above 100 bpm for at least 1 minute
  - Very slow heart (bradycardia): below 40 bpm for at least 1 minute
  - Irregular rhythm: minutes where the beat rate jumps around much more
    than normal from second to second
  - Heart-rate variability (SDNN, RMSSD)

USAGE
-----
    python simulate.py --profile heart --out heart_night.csv
    python heart.py heart_night.csv

Screening concept only — real arrhythmia diagnosis (for example atrial
fibrillation) needs beat-by-beat ECG. Not a medical device.
"""

import sys

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.patches import Patch

from signals import hrv

FAST, SLOW = 100, 40          # bpm thresholds
MIN_EPISODE_S = 60            # an episode must last at least this long
IRREG_JUMP = 8.0              # mean |change| in bpm per second that counts as irregular


def runs(mask, t, min_len):
    """Group consecutive True values into (start_idx, end_idx) runs lasting >= min_len s."""
    out, start = [], None
    for i, m in enumerate(mask):
        if m and start is None:
            start = i
        if (not m or i == len(mask) - 1) and start is not None:
            end = i if m else i - 1
            if t[end] - t[start] >= min_len:
                out.append((start, end))
            start = None
    return out


def analyze_heart(df):
    df = df[df["hr_valid"] == 1].sort_values("timestamp").reset_index(drop=True)
    t = (df["timestamp"] - df["timestamp"].iloc[0]).dt.total_seconds().to_numpy()
    hr = df["heart_rate"].to_numpy(dtype=float)
    smooth = pd.Series(hr).rolling(15, center=True, min_periods=1).median().to_numpy()

    resting = float(pd.Series(hr).rolling(600, min_periods=300).median().min())
    fast = runs(smooth > FAST, t, MIN_EPISODE_S)
    slow = runs(smooth < SLOW, t, MIN_EPISODE_S)
    jump = pd.Series(np.abs(np.diff(hr, prepend=hr[0]))).rolling(60, center=True, min_periods=30).mean().to_numpy()
    irregular = runs(jump > IRREG_JUMP, t, MIN_EPISODE_S)
    sdnn, rmssd = hrv(hr)
    return {"df": df, "t": t, "hr": hr, "smooth": smooth, "resting": resting,
            "fast": fast, "slow": slow, "irregular": irregular, "sdnn": sdnn, "rmssd": rmssd}


def describe(r, eps, name):
    df, t = r["df"], r["t"]
    for a, b in eps:
        when = df["timestamp"].iloc[a].strftime("%H:%M")
        mins = (t[b] - t[a]) / 60
        peak = r["hr"][a:b + 1]
        print(f"     - {name} at {when}, {mins:.1f} min, {int(peak.min())}-{int(peak.max())} bpm")


def plot(r, out_png):
    df = r["df"]
    fig, ax = plt.subplots(figsize=(12, 5.2))
    ts = df["timestamp"]
    for eps, col in ((r["fast"], "#cf4747"), (r["slow"], "#3b6fd6"), (r["irregular"], "#e0a020")):
        for a, b in eps:
            ax.axvspan(ts.iloc[a], ts.iloc[b], color=col, alpha=0.22, lw=0)
    ax.plot(ts, r["smooth"], color="#e4568a", lw=1.6)
    ax.axhline(FAST, color="#cf4747", ls="--", lw=1)
    ax.axhline(SLOW, color="#3b6fd6", ls="--", lw=1)
    ax.axhline(r["resting"], color="#6b7889", ls=":", lw=1.2)
    ax.text(ts.iloc[5], FAST + 2, "  100 bpm = racing", color="#cf4747", fontsize=9)
    ax.text(ts.iloc[5], SLOW - 6, "  40 bpm = very slow", color="#3b6fd6", fontsize=9)
    ax.text(ts.iloc[5], r["resting"] + 1.5, f"  resting {r['resting']:.0f} bpm", color="#6b7889", fontsize=9)
    ax.set_ylim(25, 135)
    ax.set_ylabel("Heart rate (bpm)", fontsize=12)
    ax.set_xlabel("Time", fontsize=12)
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M"))
    ax.grid(axis="y", alpha=0.2)
    ax.legend(handles=[Patch(color="#cf4747", alpha=.35, label="Racing heart"),
                       Patch(color="#3b6fd6", alpha=.35, label="Very slow heart"),
                       Patch(color="#e0a020", alpha=.35, label="Irregular rhythm")],
              loc="upper right", fontsize=10, framealpha=.9)
    fig.suptitle("Heart spin-off: what the same sensor sees", fontsize=15, fontweight="bold")
    fig.tight_layout(rect=[0, 0, 1, .95])
    fig.savefig(out_png, dpi=150)
    print(f"Saved chart -> {out_png}")


def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python heart.py <night.csv>")
    path = sys.argv[1]
    df = pd.read_csv(path)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    r = analyze_heart(df)
    print("\n" + "=" * 56)
    print("  NIGHT SIGNAL - HEART SPIN-OFF")
    print("=" * 56)
    print(f"  Resting heart rate    : {r['resting']:.0f} bpm")
    print(f"  Range (smoothed)      : {r['smooth'].min():.0f}-{r['smooth'].max():.0f} bpm")
    print(f"  HRV  SDNN / RMSSD     : {r['sdnn']:.0f} / {r['rmssd']:.0f} ms")
    print(f"  Racing-heart episodes : {len(r['fast'])}");     describe(r, r["fast"], "racing")
    print(f"  Very-slow episodes    : {len(r['slow'])}");     describe(r, r["slow"], "slow")
    print(f"  Irregular-rhythm      : {len(r['irregular'])}"); describe(r, r["irregular"], "irregular")
    print("=" * 56)
    print("  Screening only — see a doctor about any repeated pattern.")
    print("=" * 56 + "\n")
    plot(r, path.rsplit(".", 1)[0] + "_heart.png")


if __name__ == "__main__":
    main()
