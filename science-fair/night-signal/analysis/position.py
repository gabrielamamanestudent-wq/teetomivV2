#!/usr/bin/env python3
"""
Night Signal - sleep position analysis  (upgrade #3)
====================================================

EXPLORATORY (not part of the main research question).
Uses the accelerometer to estimate body position, then reports how many oxygen
DESATURATION events happened per hour of VALID recording in each position.
Position is only meaningful if the motion sensor is worn on the chest; on the
forearm it mostly reflects arm angle. This does not measure sleep apnea.

USAGE
-----
    python position.py demo_night.csv

Saves a bar chart (events/hour by position) next to the CSV.

Educational prototype only. Not a medical diagnosis.
"""

import sys

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

import analyze   # reuse the event detector
import chart_style as cs
cs.apply()

# Canonical gravity vectors for each position (ax, ay, az in g).
REFS = {
    "Back":    (0.0, 0.0, 1.0),
    "Left":    (1.0, 0.0, 0.0),
    "Right":   (-1.0, 0.0, 0.0),
    "Stomach": (0.0, 0.0, -1.0),
}
ORDER = ["Back", "Left", "Right", "Stomach"]
COLORS = {"Back": "#cf4747", "Left": "#1f8a9c", "Right": "#3fb8cc", "Stomach": "#c98a1e"}


def classify(ax, ay, az):
    """Return the position whose gravity vector is closest to this reading."""
    best, best_d = None, 1e9
    for name, (rx, ry, rz) in REFS.items():
        d = (ax - rx) ** 2 + (ay - ry) ** 2 + (az - rz) ** 2
        if d < best_d:
            best, best_d = name, d
    return best


def position_stats(csv_path):
    """Valid hours, desaturation events and events per valid hour for each position."""
    if "ax" not in pd.read_csv(csv_path, nrows=1).columns:
        return None
    df = analyze.load(csv_path)                       # valid samples only (same as the event detector)
    df["position"] = [classify(a, b, c) for a, b, c in zip(df["ax"], df["ay"], df["az"])]
    hours = df["position"].value_counts() / 3600.0    # valid samples are ~1 second apart
    events = analyze.find_events(df, drop=3.0, min_seconds=10.0, baseline_seconds=120.0)
    pos_by_time = df.set_index("timestamp")["position"]
    ev_positions = []
    for ev in events:
        idx = pos_by_time.index.get_indexer([ev["start_time"]], method="nearest")[0]
        ev_positions.append(pos_by_time.iloc[idx])
    ev_counts = pd.Series(ev_positions).value_counts()
    out = {}
    for p in ORDER:
        h = float(hours.get(p, 0.0)); n = int(ev_counts.get(p, 0))
        out[p] = {"hours": h, "events": n, "rate": n / h if h > 0.05 else 0.0}
    return out


def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python position.py <night.csv>")
    csv_path = sys.argv[1]
    stats = position_stats(csv_path)
    if stats is None:
        sys.exit("This file has no accelerometer data (ax/ay/az). Record with "
                 "the advanced firmware to use position analysis.")
    hours = pd.Series({p: v["hours"] for p, v in stats.items()})
    ev_counts = pd.Series({p: v["events"] for p, v in stats.items()})

    # Build the results table: events per hour in each position.
    print("\n" + "=" * 56)
    print("  BODY POSITION vs DESATURATION EVENTS (exploratory)")
    if analyze.is_demo(csv_path):
        print("  *** DEMONSTRATION DATA (simulated) ***")
    print("=" * 56)
    print(f"  {'Position':<10}{'Valid h':>8}{'Events':>9}{'Per valid h':>12}")
    print("  " + "-" * 39)
    rates = {}
    for p in ORDER:
        h = float(hours.get(p, 0.0))
        n = int(ev_counts.get(p, 0))
        rate = n / h if h > 0.05 else 0.0
        rates[p] = rate
        if h > 0.05:
            print(f"  {p:<10}{h:>8.2f}{n:>9}{rate:>12.1f}")
    print("=" * 56)
    back = rates.get("Back", 0)
    others = [rates[p] for p in ORDER if p != "Back" and rates[p] > 0]
    if back > 0 and others and back > max(others):
        print("  -> The highest desaturation-event rate was on the back (descriptive only).")
    elif back > 0 and others:
        print("  -> The back did not have the highest desaturation-event rate here.")
    print("  Few hours per position = large uncertainty. Not a sleep-apnea measurement.")
    print("=" * 56 + "\n")

    # Bar chart: the back is highlighted, the other positions are muted.
    fig, ax = plt.subplots(figsize=(6.0, 4.4))
    ps = [p for p in ORDER if float(hours.get(p, 0)) > 0.05]
    vals = [rates[p] for p in ps]
    top = max(vals) if vals else 1
    ax.bar(ps, vals, color=[cs.PINK if p == "Back" else cs.MUTED for p in ps], width=0.58, zorder=3)
    for i, v in enumerate(vals):
        ax.text(i, v + top * 0.03, f"{v:.1f}", ha="center", fontsize=14, fontweight="bold",
                color=cs.PINK if ps[i] == "Back" else cs.INK)
    cs.title(ax, "Desaturation events by position", "Events per hour of valid recording in each position (exploratory)",
             demo=analyze.is_demo(csv_path))
    ax.set_ylim(0, top * 1.18)
    ax.tick_params(axis="x", labelsize=12.5, colors=cs.INK)
    ax.set_ylabel("Events per valid hour")
    fig.tight_layout()
    out = csv_path.rsplit(".", 1)[0] + "_position.png"
    fig.savefig(out, dpi=180)
    print(f"Saved chart -> {out}")


if __name__ == "__main__":
    main()
