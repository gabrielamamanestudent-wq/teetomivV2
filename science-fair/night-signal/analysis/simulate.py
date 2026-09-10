#!/usr/bin/env python3
"""
Night Signal - fake-night generator (for testing WITHOUT the hardware)
======================================================================

Makes a realistic CSV in the same format record.py produces, including a few
apnea-style desaturation events. Use it to test analyze.py and to build a
demo graph for your poster before your parts arrive.

USAGE
-----
    python simulate.py                 # 6-hour night, 8 events
    python simulate.py --hours 8 --events 20 --out demo_night.csv

Then:
    python analyze.py demo_night.csv

Educational prototype only. Not real patient data.
"""

import argparse
import csv
import datetime as dt
import random

import numpy as np


def main():
    ap = argparse.ArgumentParser(description="Generate a fake night of data.")
    ap.add_argument("--hours", type=float, default=6.0, help="Night length")
    ap.add_argument("--events", type=int, default=8, help="Apnea events to add")
    ap.add_argument("--out", default="demo_night.csv", help="Output CSV file")
    ap.add_argument("--seed", type=int, default=42, help="Random seed")
    args = ap.parse_args()

    random.seed(args.seed)
    np.random.seed(args.seed)

    total_s = int(args.hours * 3600)
    start = dt.datetime.now().replace(microsecond=0) - dt.timedelta(seconds=total_s)

    # Baseline SpO2 wanders gently around 97%; heart rate around 60 bpm.
    spo2 = 97 + np.cumsum(np.random.normal(0, 0.03, total_s))
    spo2 = np.clip(spo2, 94, 99)
    hr = 60 + np.cumsum(np.random.normal(0, 0.05, total_s))
    hr = np.clip(hr, 48, 80)

    # Drop in a few desaturation events: SpO2 dips, HR dips then rebounds.
    for _ in range(args.events):
        t = random.randint(60, total_s - 60)
        dur = random.randint(12, 30)          # seconds
        depth = random.uniform(4, 9)          # % drop
        for k in range(dur):
            if t + k < total_s:
                shape = np.sin(np.pi * k / dur)      # smooth dip
                spo2[t + k] -= depth * shape
                hr[t + k] -= 6 * shape               # bradycardia during pause
        # Rebound tachycardia right after the event.
        for k in range(dur, dur + 15):
            if t + k < total_s:
                hr[t + k] += 10 * np.sin(np.pi * (k - dur) / 15)

    spo2 = np.clip(np.round(spo2), 70, 100).astype(int)
    hr = np.clip(np.round(hr), 40, 140).astype(int)

    with open(args.out, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["timestamp", "device_ms", "heart_rate",
                    "hr_valid", "spo2", "spo2_valid"])
        for i in range(total_s):
            ts = (start + dt.timedelta(seconds=i)).isoformat(timespec="seconds")
            # Occasionally mark a sample invalid, like the real sensor does.
            valid = 0 if random.random() < 0.01 else 1
            w.writerow([ts, i * 1000, hr[i], valid, spo2[i], valid])

    print(f"Wrote {total_s} rows with {args.events} events to {args.out}")
    print(f"Now run:  python analyze.py {args.out}")


if __name__ == "__main__":
    main()
