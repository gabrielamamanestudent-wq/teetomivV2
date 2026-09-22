#!/usr/bin/env python3
"""
Night Signal - signal processing  (upgrade #4)
==============================================

Pulls two extra measurements out of the SAME sensor data, without any new
hardware:

  1. Breathing rate  - the heart speeds up and slows slightly with every
     breath (respiratory sinus arrhythmia). We find that rhythm in the
     heart-rate signal with a Fourier transform and turn it into breaths/min.

  2. Heart-rate variability (HRV) - how much the time between beats varies.
     Higher HRV is generally a sign of a relaxed, healthy heart. We report
     SDNN and RMSSD, the two most common HRV numbers.

USAGE
-----
    python signals.py demo_night.csv

Educational prototype only. Not a medical diagnosis.
"""

import sys

import numpy as np
import pandas as pd


def breathing_rate(hr, fs=1.0):
    """Estimate breaths per minute from the heart-rate signal using an FFT,
    looking only in the human breathing band (6-30 breaths/min)."""
    x = hr - np.mean(hr)
    # Taper the ends so the FFT is clean.
    x = x * np.hanning(len(x))
    spectrum = np.abs(np.fft.rfft(x))
    freqs = np.fft.rfftfreq(len(x), d=1.0 / fs)   # in Hz

    # Breathing band: 0.1 Hz (6/min) to 0.5 Hz (30/min).
    band = (freqs >= 0.1) & (freqs <= 0.5)
    if not band.any():
        return None
    peak_hz = freqs[band][np.argmax(spectrum[band])]
    return peak_hz * 60.0   # breaths per minute


def hrv(hr):
    """Compute SDNN and RMSSD (ms) from a heart-rate series in bpm."""
    rr = 60000.0 / hr        # time between beats, in milliseconds
    sdnn = float(np.std(rr))
    rmssd = float(np.sqrt(np.mean(np.diff(rr) ** 2)))
    return sdnn, rmssd


def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python signals.py <night.csv>")
    csv_path = sys.argv[1]

    df = pd.read_csv(csv_path)
    df = df[df["hr_valid"] == 1]
    hr = df["heart_rate"].to_numpy(dtype=float)
    if len(hr) < 120:
        sys.exit("Not enough valid heart-rate data to analyze.")

    # Breathing rate: average the estimate over 2-minute windows for stability.
    win = 120
    est = [breathing_rate(hr[i:i + win]) for i in range(0, len(hr) - win, win)]
    est = [e for e in est if e is not None]
    br = float(np.median(est)) if est else float("nan")

    sdnn, rmssd = hrv(hr)

    print("\n" + "=" * 50)
    print("  NIGHT SIGNAL - SIGNAL PROCESSING")
    print("=" * 50)
    print(f"  Breathing rate (est.) : {br:5.1f} breaths/min")
    print(f"  Average heart rate    : {np.mean(hr):5.1f} bpm")
    print(f"  Lowest heart rate     : {int(np.min(hr))} bpm")
    print("  --- Heart-rate variability ---")
    print(f"  SDNN                  : {sdnn:5.1f} ms")
    print(f"  RMSSD                 : {rmssd:5.1f} ms")
    print("=" * 50)
    print("  Note: breathing rate is estimated from heart-rate rhythm;")
    print("  HRV here is approximate (from per-second heart rate).")
    print("=" * 50 + "\n")


if __name__ == "__main__":
    main()
