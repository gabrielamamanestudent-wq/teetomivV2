#!/usr/bin/env python3
"""
Night Signal - sleep position analysis  (upgrade #3)
====================================================

Uses the accelerometer to work out which way the body was facing all night,
then tests the hypothesis: do apnea events happen more often on the back?

For each body position it reports the apnea rate (events per hour) — the same
kind of number a sleep doctor uses — so you can see if position matters.

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


def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python position.py <night.csv>")
    csv_path = sys.argv[1]

    raw = pd.read_csv(csv_path)
    if "ax" not in raw.columns:
        sys.exit("This file has no accelerometer data (ax/ay/az). Record with "
                 "the advanced firmware to use position analysis.")
    raw["timestamp"] = pd.to_datetime(raw["timestamp"])
    raw["position"] = [classify(a, b, c)
                       for a, b, c in zip(raw["ax"], raw["ay"], raw["az"])]

    # Hours spent in each position (rows are ~1 second apart).
    hours = raw["position"].value_counts() / 3600.0

    # Detect apnea events, then tag each with the position at that moment.
    df = analyze.load(csv_path)
    events = analyze.find_events(df, drop=3.0, min_seconds=10.0, baseline_seconds=120.0)
    pos_by_time = raw.set_index("timestamp")["position"]
    ev_positions = []
    for ev in events:
        idx = pos_by_time.index.get_indexer([ev["start_time"]], method="nearest")[0]
        ev_positions.append(pos_by_time.iloc[idx])
    ev_counts = pd.Series(ev_positions).value_counts()

    # Build the results table: events per hour in each position.
    print("\n" + "=" * 56)
    print("  SLEEP POSITION vs APNEA")
    print("=" * 56)
    print(f"  {'Position':<10}{'Hours':>8}{'Events':>9}{'Events/hr':>12}")
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
        print("  -> Apnea happened MOST on the back. Hypothesis supported.")
    elif back > 0 and others:
        print("  -> The back was not the worst position here.")
    print("=" * 56 + "\n")

    # Bar chart.
    fig, ax = plt.subplots(figsize=(8, 5))
    ps = [p for p in ORDER if float(hours.get(p, 0)) > 0.05]
    vals = [rates[p] for p in ps]
    ax.bar(ps, vals, color=[COLORS[p] for p in ps], width=0.6)
    ax.set_ylabel("Apnea events per hour", fontsize=12)
    ax.set_title("Does sleeping position affect apnea?", fontsize=14, fontweight="bold")
    for i, v in enumerate(vals):
        ax.text(i, v + 0.05, f"{v:.1f}", ha="center", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.2)
    fig.tight_layout()
    out = csv_path.rsplit(".", 1)[0] + "_position.png"
    fig.savefig(out, dpi=150)
    print(f"Saved chart -> {out}")


if __name__ == "__main__":
    main()
