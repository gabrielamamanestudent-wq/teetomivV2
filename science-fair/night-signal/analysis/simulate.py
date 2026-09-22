#!/usr/bin/env python3
"""
Night Signal - fake-night generator (advanced)
==============================================

Makes a realistic night of data in the same format record.py produces —
now including body position (accelerometer) — plus a separate "reference
oximeter" file so you can test the accuracy-validation code too.

It even bakes in the sleep-position effect: apnea events happen MORE often
when the sleeper is on their back, so position.py and the analysis have a
real pattern to find.

USAGE
-----
    python simulate.py                          # 6-hour night
    python simulate.py --hours 8 --events 25 --out demo_night.csv

Outputs:
    demo_night.csv          (device log: SpO2, heart rate, ax/ay/az)
    demo_night_reference.csv (spot readings from a "reference" oximeter)

Educational prototype only. Not real patient data.
"""

import argparse
import csv
import datetime as dt
import random

import numpy as np

# Body positions and the gravity vector (ax, ay, az in g) each produces
# when the sensor is worn on the chest. One axis reads ~±1 (gravity).
POSITIONS = {
    "back":    (0.0, 0.0, 1.0),    # supine, facing up
    "left":    (1.0, 0.0, 0.0),    # on left side
    "right":   (-1.0, 0.0, 0.0),   # on right side
    "stomach": (0.0, 0.0, -1.0),   # prone, facing down
}


def build_position_timeline(total_s):
    """Return an array naming the body position at each second. The sleeper
    changes position a handful of times through the night."""
    labels = np.empty(total_s, dtype=object)
    t = 0
    names = list(POSITIONS.keys())
    current = random.choice(names)
    while t < total_s:
        # Each posture lasts 20-90 minutes.
        seg = random.randint(20 * 60, 90 * 60)
        labels[t:t + seg] = current
        t += seg
        current = random.choice(names)
    return labels


def main():
    ap = argparse.ArgumentParser(description="Generate a fake night of data.")
    ap.add_argument("--hours", type=float, default=6.0)
    ap.add_argument("--events", type=int, default=18)
    ap.add_argument("--out", default="demo_night.csv")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    random.seed(args.seed)
    np.random.seed(args.seed)

    total_s = int(args.hours * 3600)
    start = dt.datetime.now().replace(microsecond=0) - dt.timedelta(seconds=total_s)

    # "True" oxygen wanders gently around 97%; heart rate around 60 bpm.
    true_spo2 = 97 + np.cumsum(np.random.normal(0, 0.03, total_s))
    true_spo2 = np.clip(true_spo2, 94, 99)
    hr = 60 + np.cumsum(np.random.normal(0, 0.05, total_s))
    hr = np.clip(hr, 48, 80)

    # Breathing rhythm: the heart speeds up and slows down slightly with each
    # breath (respiratory sinus arrhythmia). ~0.22 Hz = about 13 breaths/min.
    # signals.py recovers this to estimate breathing rate.
    breath_hz = 0.22
    hr = hr + 3.0 * np.sin(2 * np.pi * breath_hz * np.arange(total_s))

    positions = build_position_timeline(total_s)
    is_back = positions == "back"

    # Place apnea events, biased toward times when the sleeper is on their back.
    weights = np.where(is_back, 3.0, 1.0)
    weights[:60] = 0            # not in the first minute
    weights[-60:] = 0
    weights /= weights.sum()
    event_times = np.random.choice(total_s, size=args.events, replace=False, p=weights)

    event_intervals = []   # ground-truth (start, end) seconds, for ML labels
    for t in event_times:
        dur = random.randint(12, 30)
        depth = random.uniform(4, 9)
        for k in range(dur):
            if t + k < total_s:
                shape = np.sin(np.pi * k / dur)
                true_spo2[t + k] -= depth * shape
                hr[t + k] -= 6 * shape
        for k in range(dur, dur + 15):     # rebound tachycardia
            if t + k < total_s:
                hr[t + k] += 10 * np.sin(np.pi * (k - dur) / 15)
        event_intervals.append((t, min(t + dur, total_s - 1)))
    event_intervals.sort()

    # The DEVICE reading = truth + a little sensor error (what we validate).
    device_spo2 = np.clip(np.round(true_spo2 + np.random.normal(0, 0.6, total_s)),
                          70, 100).astype(int)
    hr = np.clip(np.round(hr), 40, 140).astype(int)

    # Write the main device log.
    with open(args.out, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["timestamp", "device_ms", "heart_rate", "hr_valid",
                    "spo2", "spo2_valid", "ax", "ay", "az"])
        for i in range(total_s):
            ts = (start + dt.timedelta(seconds=i)).isoformat(timespec="seconds")
            valid = 0 if random.random() < 0.01 else 1
            gx, gy, gz = POSITIONS[positions[i]]
            ax = round(gx + random.gauss(0, 0.05), 2)
            ay = round(gy + random.gauss(0, 0.05), 2)
            az = round(gz + random.gauss(0, 0.05), 2)
            w.writerow([ts, i * 1000, hr[i], valid, device_spo2[i], valid, ax, ay, az])

    # Write a separate "reference oximeter" file: spot readings every ~2 min,
    # close to the truth (this is the gold standard you compare against).
    ref_out = args.out.rsplit(".", 1)[0] + "_reference.csv"
    with open(ref_out, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["timestamp", "ref_spo2"])
        for i in range(0, total_s, 120):
            ts = (start + dt.timedelta(seconds=i)).isoformat(timespec="seconds")
            ref = int(np.clip(round(true_spo2[i] + random.gauss(0, 0.3)), 70, 100))
            w.writerow([ts, ref])

    # Write ground-truth event labels. In a real project this is your
    # "breath-hold log" — the times you know an event happened.
    labels_out = args.out.rsplit(".", 1)[0] + "_labels.csv"
    with open(labels_out, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["event_start", "event_end"])
        for a, b in event_intervals:
            ts0 = (start + dt.timedelta(seconds=int(a))).isoformat(timespec="seconds")
            ts1 = (start + dt.timedelta(seconds=int(b))).isoformat(timespec="seconds")
            w.writerow([ts0, ts1])

    n_back = int(is_back.sum())
    print(f"Wrote {total_s} rows and {args.events} events to {args.out}")
    print(f"  ({100*n_back/total_s:.0f}% of the night on the back)")
    print(f"Wrote reference oximeter spot-readings to {ref_out}")
    print(f"Wrote {len(event_intervals)} ground-truth event labels to {labels_out}")


if __name__ == "__main__":
    main()
