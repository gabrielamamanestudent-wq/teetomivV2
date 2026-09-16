#!/usr/bin/env python3
"""
Night Signal - apnea-event detector and night report
=====================================================

Reads a CSV recorded by record.py, finds oxygen-desaturation events (the
signature of sleep apnea), estimates an AHI-style score, classifies the
night, and draws the headline graph for your poster.

WHAT COUNTS AS AN EVENT (adjustable with the options below)
-----------------------------------------------------------
A "desaturation event" is when blood oxygen drops at least DROP percent
below a slowly-moving baseline for at least MIN_SECONDS in a row. This is a
simplified version of what a real sleep study looks for.

USAGE
-----
    pip install -r requirements.txt
    python analyze.py night_2026-09-10_2230.csv

    # tune the sensitivity if you like:
    python analyze.py night.csv --drop 4 --min-seconds 10 --baseline-seconds 120

It prints a report and saves a PNG next to the CSV.

Educational prototype only. Not a medical device / not for diagnosis.
"""

import argparse
import sys

try:
    import numpy as np
    import pandas as pd
    import matplotlib
    matplotlib.use("Agg")  # save to file without needing a display
    import matplotlib.pyplot as plt
    import matplotlib.dates as mdates
except ImportError:
    sys.exit("Missing dependencies. Run:  pip install -r requirements.txt")


# Severity bands, matching the plan (events per hour).
def severity_band(ahi: float) -> str:
    if ahi < 5:
        return "Normal"
    if ahi < 15:
        return "Mild"
    if ahi < 30:
        return "Moderate"
    return "Severe"


def load(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    # Keep only samples the sensor was confident about, in a sane range.
    df = df[(df["spo2_valid"] == 1) & (df["spo2"].between(70, 100))].copy()
    df = df.sort_values("timestamp").reset_index(drop=True)
    if len(df) < 30:
        sys.exit("Not enough valid data to analyze. Check the sensor contact.")
    # Seconds since the recording started - used for durations.
    df["elapsed_s"] = (df["timestamp"] - df["timestamp"].iloc[0]).dt.total_seconds()
    return df


def find_events(df: pd.DataFrame, drop: float, min_seconds: float,
                baseline_seconds: float):
    """Return a list of events. Each event is a dict with start/end time,
    duration, and the lowest SpO2 reached."""
    # Smooth a little to reduce single-sample noise from finger movement.
    spo2 = df["spo2"].rolling(5, center=True, min_periods=1).median()

    # Baseline = trailing median over the last `baseline_seconds`. We compute
    # it over a sample count that matches that time span (~1 sample/second).
    win = max(5, int(baseline_seconds))
    baseline = spo2.rolling(win, min_periods=win // 2).median()
    baseline = baseline.bfill()  # fill the very start
    df["spo2_smooth"] = spo2
    df["baseline"] = baseline

    # A sample is "below" when it dips at least `drop` % under baseline.
    below = spo2 <= (baseline - drop)

    events = []
    in_event = False
    start_i = 0
    for i, flag in enumerate(below.to_numpy()):
        if flag and not in_event:
            in_event = True
            start_i = i
        elif not flag and in_event:
            in_event = False
            events.append((start_i, i - 1))
    if in_event:
        events.append((start_i, len(below) - 1))

    # Keep only runs that lasted at least `min_seconds`.
    result = []
    for a, b in events:
        t0 = df["elapsed_s"].iloc[a]
        t1 = df["elapsed_s"].iloc[b]
        duration = t1 - t0
        if duration >= min_seconds:
            result.append({
                "start_time": df["timestamp"].iloc[a],
                "end_time": df["timestamp"].iloc[b],
                "start_elapsed": t0,
                "end_elapsed": t1,
                "duration_s": duration,
                "min_spo2": int(df["spo2"].iloc[a:b + 1].min()),
            })
    return result


def make_plot(df, events, out_png, title):
    """One combined chart: SpO2 (left axis) and heart rate (right axis) on the
    same time line, so each apnea event's oxygen drop and heart-rate reaction
    line up under the same red band."""
    from matplotlib.patches import Patch

    TEAL = "#1f8a9c"    # SpO2
    PULSE = "#e4568a"   # heart rate
    GREY = "#6b7889"    # baseline
    RED = "#cf4747"     # events

    fig, ax1 = plt.subplots(figsize=(12, 5.5))
    fig.suptitle(title, fontsize=14, fontweight="bold")
    ax1.set_title(f"{len(events)} desaturation event(s) marked in red — "
                  f"oxygen drop and heart-rate reaction shown together",
                  fontsize=10, color="#42505f")

    # Red event bands drawn first, behind the lines.
    for ev in events:
        ax1.axvspan(ev["start_time"], ev["end_time"], color=RED, alpha=0.22, zorder=0)

    # --- Left axis: SpO2 ---
    l_spo2, = ax1.plot(df["timestamp"], df["spo2_smooth"], color=TEAL, lw=1.6,
                       label="SpO₂ (%)", zorder=3)
    l_base, = ax1.plot(df["timestamp"], df["baseline"], color=GREY, lw=1.0,
                       ls="--", label="SpO₂ baseline", zorder=2)
    ax1.set_ylabel("SpO₂ (%)", color=TEAL)
    ax1.tick_params(axis="y", labelcolor=TEAL)
    ax1.set_ylim(min(80, df["spo2"].min() - 2), 100)
    ax1.set_xlabel("Time")
    ax1.grid(alpha=0.2)
    ax1.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M"))

    # --- Right axis: heart rate (same time line) ---
    ax2 = ax1.twinx()
    hr = df[df["hr_valid"] == 1]
    l_hr, = ax2.plot(hr["timestamp"], hr["heart_rate"], color=PULSE, lw=1.2,
                     alpha=0.9, label="Heart rate (bpm)", zorder=3)
    ax2.set_ylabel("Heart rate (bpm)", color=PULSE)
    ax2.tick_params(axis="y", labelcolor=PULSE)

    # One combined legend, including a swatch for the event bands.
    event_patch = Patch(facecolor=RED, alpha=0.22, label="Apnea event")
    ax1.legend(handles=[l_spo2, l_base, l_hr, event_patch],
               loc="lower left", fontsize=9, framealpha=0.9)

    fig.tight_layout(rect=[0, 0, 1, 0.95])
    fig.savefig(out_png, dpi=150)
    print(f"Saved graph -> {out_png}")


def main():
    ap = argparse.ArgumentParser(description="Detect apnea events in a Night Signal log.")
    ap.add_argument("csv", help="CSV file recorded by record.py")
    ap.add_argument("--drop", type=float, default=3.0,
                    help="How many %% below baseline counts as a dip (default 3)")
    ap.add_argument("--min-seconds", type=float, default=10.0,
                    help="How long a dip must last to count (default 10 s)")
    ap.add_argument("--baseline-seconds", type=float, default=120.0,
                    help="Window for the moving baseline (default 120 s)")
    args = ap.parse_args()

    df = load(args.csv)
    events = find_events(df, args.drop, args.min_seconds, args.baseline_seconds)

    total_seconds = df["elapsed_s"].iloc[-1]
    hours = total_seconds / 3600.0
    ahi = len(events) / hours if hours > 0 else 0.0
    band = severity_band(ahi)

    # --- text report ---
    print("\n" + "=" * 52)
    print("  NIGHT SIGNAL - REPORT")
    print("=" * 52)
    print(f"  Recording length : {hours:5.2f} hours")
    print(f"  Valid samples    : {len(df)}")
    print(f"  Average SpO₂      : {df['spo2'].mean():5.1f} %")
    print(f"  Lowest SpO₂       : {int(df['spo2'].min())} %")
    print(f"  Events detected   : {len(events)}")
    print(f"  Estimated AHI     : {ahi:5.1f} events/hour")
    print(f"  Severity band     : {band}")
    print("=" * 52)
    if events:
        print("  Event details:")
        for i, ev in enumerate(events, 1):
            t = ev["start_time"].strftime("%H:%M:%S")
            print(f"   {i:2d}. {t}  lasted {ev['duration_s']:4.0f}s  "
                  f"low SpO₂ {ev['min_spo2']}%")
    print("=" * 52)
    print("  Educational prototype only. Not a medical diagnosis.\n")

    out_png = args.csv.rsplit(".", 1)[0] + "_report.png"
    title = f"Night Signal - {df['timestamp'].iloc[0].strftime('%Y-%m-%d')}  " \
            f"(AHI ~{ahi:.1f}, {band})"
    make_plot(df, events, out_png, title)


if __name__ == "__main__":
    main()
