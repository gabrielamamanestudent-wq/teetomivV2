#!/usr/bin/env python3
"""
Night Signal - accuracy validation  (upgrade #1)
================================================

Checks how well YOUR device agrees with a trusted reference oximeter (a cheap
fingertip pulse-ox you can buy). This is the step that proves the device
actually works — the first question any judge will ask.

It reports the standard numbers used in medical device papers:
  - Mean absolute error   (average difference, ignoring direction)
  - Bias                  (does your device read high or low on average?)
  - Limits of agreement   (Bland-Altman: the range 95% of readings fall in)
  - Correlation           (do the two rise and fall together?)

...and saves a Bland-Altman plot, the standard picture for this comparison.

HOW TO USE WITH REAL DATA
-------------------------
While recording a session, every couple of minutes read the reference
oximeter and write the time + its number into a CSV like:
    timestamp,ref_spo2
    2026-10-05T22:31:00,97
Then:
    python validate.py demo_night.csv demo_night_reference.csv

Educational prototype only. Not a medical diagnosis.
"""

import sys

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


def main():
    if len(sys.argv) < 3:
        sys.exit("Usage: python validate.py <device.csv> <reference.csv>")
    device_path, ref_path = sys.argv[1], sys.argv[2]

    dev = pd.read_csv(device_path)
    dev["timestamp"] = pd.to_datetime(dev["timestamp"])
    dev = dev[dev["spo2_valid"] == 1][["timestamp", "spo2"]].sort_values("timestamp")

    ref = pd.read_csv(ref_path)
    ref["timestamp"] = pd.to_datetime(ref["timestamp"])
    ref = ref.sort_values("timestamp")

    # Match each reference reading to the nearest device reading in time
    # (within 5 seconds).
    matched = pd.merge_asof(ref, dev, on="timestamp",
                            direction="nearest",
                            tolerance=pd.Timedelta("5s")).dropna()
    if len(matched) < 5:
        sys.exit("Not enough matched readings to compare.")

    device_vals = matched["spo2"].to_numpy(dtype=float)
    ref_vals = matched["ref_spo2"].to_numpy(dtype=float)
    diff = device_vals - ref_vals

    mae = float(np.mean(np.abs(diff)))
    bias = float(np.mean(diff))
    sd = float(np.std(diff, ddof=1))
    loa_low, loa_high = bias - 1.96 * sd, bias + 1.96 * sd
    corr = float(np.corrcoef(device_vals, ref_vals)[0, 1]) if len(device_vals) > 1 else float("nan")

    print("\n" + "=" * 54)
    print("  NIGHT SIGNAL - ACCURACY vs REFERENCE OXIMETER")
    print("=" * 54)
    print(f"  Paired readings compared : {len(matched)}")
    print(f"  Mean absolute error      : {mae:4.2f} %")
    print(f"  Bias (device - reference): {bias:+.2f} %")
    print(f"  Limits of agreement      : {loa_low:+.2f} to {loa_high:+.2f} %")
    print(f"  Correlation (r)          : {corr:.3f}")
    print("=" * 54)
    verdict = ("Excellent" if mae < 2 else "Reasonable" if mae < 4 else "Needs work")
    print(f"  Agreement: {verdict}  (medical pulse-ox target is within ~2-3%)")
    print("=" * 54 + "\n")

    # Bland-Altman plot: average of the two vs their difference.
    avg = (device_vals + ref_vals) / 2.0
    fig, ax = plt.subplots(figsize=(9, 5.5))
    ax.scatter(avg, diff, color="#1f8a9c", alpha=0.7, s=28, zorder=3)
    ax.axhline(bias, color="#42505f", lw=1.4, label=f"bias {bias:+.2f}%")
    ax.axhline(loa_high, color="#cf4747", ls="--", lw=1.2,
               label=f"+1.96 SD ({loa_high:+.2f}%)")
    ax.axhline(loa_low, color="#cf4747", ls="--", lw=1.2,
               label=f"-1.96 SD ({loa_low:+.2f}%)")
    ax.set_xlabel("Average of device & reference SpO₂ (%)", fontsize=12)
    ax.set_ylabel("Device − reference (%)", fontsize=12)
    ax.set_title("Bland-Altman: device vs reference oximeter",
                 fontsize=14, fontweight="bold")
    ax.legend(fontsize=10)
    ax.grid(alpha=0.2)
    fig.tight_layout()
    out = device_path.rsplit(".", 1)[0] + "_validation.png"
    fig.savefig(out, dpi=150)
    print(f"Saved Bland-Altman plot -> {out}")


if __name__ == "__main__":
    main()
