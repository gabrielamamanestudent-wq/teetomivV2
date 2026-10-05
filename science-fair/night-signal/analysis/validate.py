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

import chart_style as cs
cs.apply()


def agreement(device_path, ref_path):
    """Compare device SpO2 with reference spot readings. Returns a dict of
    Bland-Altman statistics, or None if fewer than 5 readings could be paired."""
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
        return None

    device_vals = matched["spo2"].to_numpy(dtype=float)
    ref_vals = matched["ref_spo2"].to_numpy(dtype=float)
    diff = device_vals - ref_vals

    mae = float(np.mean(np.abs(diff)))
    bias = float(np.mean(diff))
    sd = float(np.std(diff, ddof=1))
    loa_low, loa_high = bias - 1.96 * sd, bias + 1.96 * sd
    corr = float(np.corrcoef(device_vals, ref_vals)[0, 1]) if len(device_vals) > 1 else float("nan")
    return {"n": len(matched), "device": device_vals, "ref": ref_vals, "diff": diff,
            "mae": mae, "bias": bias, "sd": sd, "loa_low": loa_low, "loa_high": loa_high, "r": corr}


def main():
    if len(sys.argv) < 3:
        sys.exit("Usage: python validate.py <device.csv> <reference.csv>")
    device_path, ref_path = sys.argv[1], sys.argv[2]
    a = agreement(device_path, ref_path)
    if a is None:
        sys.exit("Not enough matched readings to compare.")
    matched_n, device_vals, ref_vals, diff = a["n"], a["device"], a["ref"], a["diff"]
    mae, bias, loa_low, loa_high, corr = a["mae"], a["bias"], a["loa_low"], a["loa_high"], a["r"]

    print("\n" + "=" * 54)
    print("  NIGHT SIGNAL - ACCURACY vs REFERENCE OXIMETER")
    print("=" * 54)
    print(f"  Paired readings compared : {matched_n}")
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
    fig, ax = plt.subplots(figsize=(5.8, 4.2))
    ax.scatter(avg, diff, color=cs.BLUE, alpha=0.55, s=40, lw=0, zorder=3)
    ax.axhline(bias, color=cs.INK, lw=1.6)
    ax.axhline(loa_high, color=cs.PINK, ls=(0, (4, 4)), lw=1.4)
    ax.axhline(loa_low, color=cs.PINK, ls=(0, (4, 4)), lw=1.4)
    cs.end_label(ax, bias, f"bias {bias:+.2f}%", cs.INK)
    cs.end_label(ax, loa_high, f"+1.96 SD {loa_high:+.2f}%", cs.PINK)
    cs.end_label(ax, loa_low, f"−1.96 SD {loa_low:+.2f}%", cs.PINK)
    cs.title(ax, "Device vs reference oximeter", "Bland–Altman agreement: each dot is one paired reading")
    ax.set_xlabel("Average of device and reference SpO₂ (%)")
    ax.set_ylabel("Device − reference (%)")
    fig.tight_layout()
    out = device_path.rsplit(".", 1)[0] + "_validation.png"
    fig.savefig(out, dpi=180)
    print(f"Saved Bland-Altman plot -> {out}")


if __name__ == "__main__":
    main()
