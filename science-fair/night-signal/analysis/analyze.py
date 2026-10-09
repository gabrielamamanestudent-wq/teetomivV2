#!/usr/bin/env python3
"""
Night Signal - oxygen desaturation detector and recording report
================================================================

Reads a CSV recorded by record.py, checks signal quality, finds oxygen
DESATURATION EVENTS (short dips in SpO2) and reports how often they happened
per hour of VALID recording.

WHAT THIS DOES NOT DO
---------------------
It does not detect or diagnose sleep apnea and it does not calculate an
apnea-hypopnea index (AHI). An AHI needs airflow and breathing-effort sensors
and scored sleep time from a sleep study. Not every oxygen drop is an apnea,
and not every apnea causes a large oxygen drop. This project measures SpO2
and heart rate only, so it can only describe oxygen dips.

WHAT COUNTS AS A DESATURATION EVENT (adjustable with the options below)
------------------------------------------------------------------------
SpO2 at least DROP percentage points below a moving baseline (median of the
previous BASELINE seconds) for at least MIN_SECONDS in a row, using valid
samples only. An event is never allowed to span a gap in the valid data.

SIGNAL QUALITY (a sample is "valid" only if all are true)
---------------------------------------------------------
  - a finger is on the sensor (finger = 1)
  - the sensor marked the SpO2 reading as valid (spo2_valid = 1)
  - SpO2 is in a believable range (70-100 %)
  - not within 5 s of a sudden movement (acceleration change > 0.25 g)

Event rate = events / hours of valid recording (not hours in bed, not sleep time).

USAGE
-----
    pip install -r requirements.txt
    python analyze.py night_2026-10-20_2230.csv
    python analyze.py night.csv --drop 4 --min-seconds 10 --baseline-seconds 120

It prints a report and saves a PNG next to the CSV. Files whose name starts with
"demo" (made by simulate.py) are labelled DEMONSTRATION DATA everywhere.

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
    import chart_style as cs
    cs.apply()
except ImportError:
    sys.exit("Missing dependencies. Run:  pip install -r requirements.txt")


MOTION_JOLT_G = 0.25      # change in acceleration magnitude between samples that marks movement
MOTION_PAD_S = 5          # seconds excluded on each side of a movement
GAP_S = 3.0               # a jump in time bigger than this splits events


def quality_mask(raw: pd.DataFrame) -> pd.Series:
    """True for samples that pass every signal-quality check (see module docstring)."""
    ok = (raw["spo2_valid"] == 1) & raw["spo2"].between(70, 100)
    if "finger" in raw.columns:
        ok &= raw["finger"] == 1
    if {"ax", "ay", "az"} <= set(raw.columns):
        mag = np.sqrt(raw["ax"] ** 2 + raw["ay"] ** 2 + raw["az"] ** 2)
        jolt = mag.diff().abs() > MOTION_JOLT_G
        moving = jolt.rolling(2 * MOTION_PAD_S + 1, center=True, min_periods=1).max().astype(bool)
        ok &= ~moving
    return ok


def load(csv_path: str) -> pd.DataFrame:
    """Valid samples only. df.attrs holds total/valid seconds and a quality summary."""
    raw = pd.read_csv(csv_path)
    raw["timestamp"] = pd.to_datetime(raw["timestamp"])
    raw = raw.sort_values("timestamp").reset_index(drop=True)
    ok = quality_mask(raw)
    df = raw[ok].copy().reset_index(drop=True)
    if len(df) < 30:
        sys.exit("Not enough valid data to analyze. Check the sensor contact.")
    # Seconds since the recording started - used for durations.
    df["elapsed_s"] = (df["timestamp"] - raw["timestamp"].iloc[0]).dt.total_seconds()
    total_s = (raw["timestamp"].iloc[-1] - raw["timestamp"].iloc[0]).total_seconds() + 1
    df.attrs.update({
        "total_s": float(total_s),
        "valid_s": float(len(df)),                      # ~1 sample per second
        "valid_pct": 100.0 * len(df) / max(1, len(raw)),
        "excluded": {
            "no_finger": int((raw.get("finger", pd.Series(1, index=raw.index)) != 1).sum()),
            "sensor_invalid": int((raw["spo2_valid"] != 1).sum()),
            "out_of_range": int((~raw["spo2"].between(70, 100)).sum()),
        },
        "demo": is_demo(csv_path),
    })
    return df


def is_demo(path: str) -> bool:
    """Simulated files are named demo_*.csv by simulate.py (or set NS_DEMO=1)."""
    import os
    return os.path.basename(path).lower().startswith("demo") or os.environ.get("NS_DEMO") == "1"


def event_rate(df: pd.DataFrame, events) -> dict:
    """Events per hour of VALID recording, with the denominator spelled out."""
    valid_h = df.attrs["valid_s"] / 3600.0
    total_h = df.attrs["total_s"] / 3600.0
    return {"events": len(events), "valid_hours": valid_h, "total_hours": total_h,
            "valid_pct": df.attrs["valid_pct"],
            "rate": len(events) / valid_h if valid_h > 0 else float("nan")}


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
    # Never let an event run across a gap in the valid data (excluded or missing samples).
    gap_after = df["elapsed_s"].diff().shift(-1).fillna(1.0) > GAP_S

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
        if in_event and gap_after.iloc[i]:          # data stops here: close the event
            in_event = False
            events.append((start_i, i))
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
    """One simple chart: the blood-oxygen line over the recording, with each
    flagged desaturation event shown as a red band."""
    fig, ax = plt.subplots(figsize=(7.6, 3.9))
    for ev in events:                                   # event bands, behind the line
        ax.axvspan(ev["start_time"], ev["end_time"], color=cs.RED, alpha=0.3, lw=0, zorder=0)
    ax.plot(df["timestamp"], df["spo2_smooth"], color=cs.BLUE, lw=2.2, zorder=3)
    ax.axhline(90, color=cs.GRAY, lw=1.0, ls=(0, (4, 4)), zorder=1)
    cs.end_label(ax, 90, "90% low", cs.GRAY)
    cs.end_label(ax, float(df["spo2_smooth"].iloc[-60:].mean()), "SpO₂", cs.BLUE)
    cs.title(ax, "Blood oxygen through the night",
             title, demo=df.attrs.get("demo", False))
    ax.set_ylabel("SpO₂ %")
    ax.set_ylim(min(84, df["spo2"].min() - 2), 100.5)
    ax.margins(x=0)
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M"))
    ax.yaxis.set_major_locator(matplotlib.ticker.MaxNLocator(integer=True))
    fig.tight_layout()
    fig.savefig(out_png, dpi=180)
    print(f"Saved graph -> {out_png}")


def main():
    ap = argparse.ArgumentParser(description="Find oxygen desaturation events in a Night Signal log.")
    ap.add_argument("csv", help="CSV file recorded by record.py")
    ap.add_argument("--drop", type=float, default=3.0,
                    help="How many percentage points below baseline counts as a dip (default 3)")
    ap.add_argument("--min-seconds", type=float, default=10.0,
                    help="How long a dip must last to count (default 10 s)")
    ap.add_argument("--baseline-seconds", type=float, default=120.0,
                    help="Window for the moving baseline (default 120 s)")
    args = ap.parse_args()

    df = load(args.csv)
    events = find_events(df, args.drop, args.min_seconds, args.baseline_seconds)
    r = event_rate(df, events)
    q = df.attrs

    # --- text report ---
    print("\n" + "=" * 60)
    print("  NIGHT SIGNAL - RECORDING REPORT")
    if q["demo"]:
        print("  *** DEMONSTRATION DATA (simulated) - not a real recording ***")
    print("=" * 60)
    print(f"  Recording length          : {r['total_hours']:5.2f} h")
    print(f"  Valid signal              : {r['valid_hours']:5.2f} h  ({r['valid_pct']:.0f}% of samples)")
    ex = q["excluded"]
    print(f"  Excluded samples          : no finger {ex['no_finger']}, sensor-invalid {ex['sensor_invalid']}, "
          f"out of range {ex['out_of_range']} (+ movement)")
    print(f"  Average / lowest SpO₂      : {df['spo2'].mean():5.1f} % / {int(df['spo2'].min())} %")
    print(f"  Desaturation events       : {r['events']}  "
          f"(≥ {args.drop:g} points below baseline for ≥ {args.min_seconds:g} s)")
    print(f"  Desaturation event rate   : {r['rate']:5.1f} per hour of valid recording "
          f"({r['events']} events / {r['valid_hours']:.2f} valid h)")
    if r["valid_pct"] < 70:
        print("  WARNING: less than 70% valid signal - treat these numbers as unreliable.")
    print("  Note: this is NOT an apnea-hypopnea index (AHI) and cannot confirm sleep apnea.")
    print("=" * 60)
    if events:
        print("  Event details:")
        for i, ev in enumerate(events, 1):
            t = ev["start_time"].strftime("%H:%M:%S")
            print(f"   {i:2d}. {t}  lasted {ev['duration_s']:4.0f}s  "
                  f"low SpO₂ {ev['min_spo2']}%")
    print("=" * 60)
    print("  Educational prototype only. Not a medical diagnosis.\n")

    out_png = args.csv.rsplit(".", 1)[0] + "_report.png"
    d0 = df["timestamp"].iloc[0]
    title = f"{d0:%b} {d0.day}, {d0.year}  ·  {r['events']} flagged events / {r['valid_hours']:.1f} valid h"
    make_plot(df, events, out_png, title)


if __name__ == "__main__":
    main()
