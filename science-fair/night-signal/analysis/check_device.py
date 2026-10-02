#!/usr/bin/env python3
"""
Night Signal - device self-check
================================

Run this before every recording (and at the science fair) to prove the
wearable is working and that the data reaching the computer is real.

It listens to the device for a short time and checks:
  1. Data is arriving, about once per second
  2. The device's own self-test passed (oxygen sensor + motion sensor)
  3. A finger is on the sensor
  4. Readings are valid and in a believable range
  5. The motion sensor feels gravity (~1 g)
  6. Battery level (if the battery divider is fitted), otherwise USB power

USAGE
-----
    python check_device.py --port COM5               # Windows
    python3 check_device.py --port /dev/cu.NightSignal   # Mac (ls /dev/cu.* to find it)
    python check_device.py --port /dev/rfcomm0       # Linux
    python check_device.py --port COM5 --seconds 40  # listen longer

Exit code 0 = all checks passed, 1 = something needs attention.
"""

import argparse
import math
import sys
import time

try:
    import serial
except ImportError:
    sys.exit("Missing dependency. Run:  pip install pyserial")

from protocol import parse_data, parse_status

PASS, WARN, FAIL = "PASS", "WARN", "FAIL"


def run_checks(rows, statuses, seconds):
    """Turn what we heard into a list of (result, check, detail)."""
    out = []
    n = len(rows)
    rate = n / seconds if seconds else 0
    if n == 0:
        out.append((FAIL, "Data arriving", "no data lines received — is the device on and paired?"))
        return out
    out.append((PASS if 0.7 <= rate <= 1.4 else WARN, "Data arriving",
                f"{n} readings in {seconds:.0f} s ({rate:.2f}/s, expected ~1/s)"))

    if statuses:
        last = statuses[-1]
        for part in ("max30102", "mpu6050"):
            ok = last.get(part) == "OK"
            out.append((PASS if ok else FAIL, f"Self-test: {part}", last.get(part, "not reported")))
        out.append((PASS, "Firmware", f"v{last.get('fw', '?')}"))
    else:
        out.append((WARN, "Self-test", "no #STATUS line heard (it repeats every 30 s — listen longer)"))

    finger = sum(r["finger"] for r in rows) / n
    out.append((PASS if finger >= 0.8 else FAIL, "Finger on sensor",
                f"{finger:.0%} of readings"))

    valid = [r for r in rows if r["spo2_valid"] and r["hr_valid"]]
    vfrac = len(valid) / n
    out.append((PASS if vfrac >= 0.7 else WARN if vfrac >= 0.4 else FAIL,
                "Valid readings", f"{vfrac:.0%} (keep the finger still)"))

    if valid:
        spo2 = [r["spo2"] for r in valid]
        hr = [r["heart_rate"] for r in valid]
        ok = all(85 <= s <= 100 for s in spo2) and all(40 <= h <= 150 for h in hr)
        out.append((PASS if ok else WARN, "Believable values",
                    f"SpO2 {min(spo2)}-{max(spo2)}%, heart rate {min(hr)}-{max(hr)} bpm"))

    mags = [math.sqrt(r["ax"] ** 2 + r["ay"] ** 2 + r["az"] ** 2) for r in rows]
    g_ok = sum(0.8 <= m <= 1.2 for m in mags) / n
    out.append((PASS if g_ok >= 0.9 else FAIL, "Motion sensor feels gravity",
                f"{g_ok:.0%} of readings near 1 g"))

    batt = [r["battery"] for r in rows if r["battery"] >= 0]
    if batt:
        b = batt[-1]
        out.append((PASS if b >= 30 else WARN if b >= 15 else FAIL, "Battery", f"{b}%"))
    else:
        out.append((PASS, "Power", "USB power (no battery measured)"))
    return out


def main():
    ap = argparse.ArgumentParser(description="Check that the Night Signal wearable is working.")
    ap.add_argument("--port", required=True)
    ap.add_argument("--baud", type=int, default=115200)
    ap.add_argument("--seconds", type=float, default=35)
    args = ap.parse_args()

    try:
        ser = serial.Serial(args.port, args.baud, timeout=1)
    except serial.SerialException as e:
        print(f"[FAIL] Connection: could not open {args.port} ({e})")
        sys.exit(1)

    print(f"Listening to {args.port} for {args.seconds:.0f} s — keep your finger on the sensor...")
    rows, statuses = [], []
    start = time.time()
    while time.time() - start < args.seconds:
        raw = ser.readline().decode("utf-8", errors="ignore")
        if not raw:
            continue
        st = parse_status(raw)
        if st is not None:
            statuses.append(st)
            continue
        row = parse_data(raw)
        if row is not None:
            rows.append(row)
    ser.close()

    results = run_checks(rows, statuses, args.seconds)
    print()
    for res, name, detail in results:
        print(f"  [{res}] {name:<28} {detail}")
    fails = sum(r[0] == FAIL for r in results)
    warns = sum(r[0] == WARN for r in results)
    print()
    if fails:
        print(f"RESULT: NOT READY — {fails} check(s) failed. Fix those before recording.")
    elif warns:
        print(f"RESULT: READY, with {warns} warning(s).")
    else:
        print("RESULT: READY — the device is working and sending real data.")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
