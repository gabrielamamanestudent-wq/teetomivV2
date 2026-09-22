#!/usr/bin/env python3
"""
Night Signal - overnight data logger
=====================================

Connects to the ESP32 wearable over its Bluetooth serial port, reads the
SpO2 + heart-rate lines it sends, and saves them to a CSV file (one row per
second) with a real wall-clock timestamp added.

Leave this running all night. In the morning, stop it with Ctrl+C, then run
analyze.py on the file it created.

SETUP
-----
1. Pair your computer with the Bluetooth device named "NightSignal"
   (Windows/Mac Bluetooth settings). Pairing creates a serial port:
     - Windows: something like  COM5
     - Mac:     something like  /dev/tty.NightSignal-SPPSlave  (or similar)
     - Linux:   bind an rfcomm port, e.g. /dev/rfcomm0
2. Install the one dependency:
     pip install pyserial
3. Run it, passing your port:
     python record.py --port COM5
     python record.py --port /dev/tty.NightSignal-SPPSlave

It writes a file like  night_2026-09-10_2230.csv  in this folder.

Educational prototype only. Not a medical device.
"""

import argparse
import csv
import datetime as dt
import sys
import time

try:
    import serial  # from the "pyserial" package
except ImportError:
    sys.exit("Missing dependency. Run:  pip install pyserial")


def parse_line(raw: str):
    """Turn one CSV line from the ESP32 into numbers, or return None if it
    isn't a valid data row (e.g. the header, or noise).

    Accepts both the basic format (5 fields) and the advanced format with the
    accelerometer (8 fields). Missing accel values default to 0."""
    parts = raw.strip().split(",")
    if len(parts) not in (5, 8):
        return None
    try:
        device_ms = int(parts[0])
        heart_rate = int(parts[1])
        hr_valid = int(parts[2])
        spo2 = int(parts[3])
        spo2_valid = int(parts[4])
        if len(parts) == 8:
            ax, ay, az = float(parts[5]), float(parts[6]), float(parts[7])
        else:
            ax = ay = az = 0.0
    except ValueError:
        return None  # this was probably the header line
    return device_ms, heart_rate, hr_valid, spo2, spo2_valid, ax, ay, az


def main():
    ap = argparse.ArgumentParser(description="Log Night Signal data to CSV.")
    ap.add_argument("--port", required=True,
                    help="Bluetooth serial port (e.g. COM5 or /dev/rfcomm0)")
    ap.add_argument("--baud", type=int, default=115200, help="Baud rate")
    ap.add_argument("--out", default=None,
                    help="Output CSV filename (default: auto-named by date)")
    args = ap.parse_args()

    if args.out is None:
        stamp = dt.datetime.now().strftime("%Y-%m-%d_%H%M")
        args.out = f"night_{stamp}.csv"

    print(f"Connecting to {args.port} ...")
    try:
        ser = serial.Serial(args.port, args.baud, timeout=2)
    except serial.SerialException as e:
        sys.exit(f"Could not open {args.port}: {e}")

    print(f"Connected. Logging to {args.out}")
    print("Press Ctrl+C to stop (do this in the morning).\n")

    rows_written = 0
    with open(args.out, "w", newline="") as f:
        writer = csv.writer(f)
        # Our log format: real timestamp + everything the device sent.
        writer.writerow(["timestamp", "device_ms", "heart_rate",
                         "hr_valid", "spo2", "spo2_valid", "ax", "ay", "az"])
        try:
            while True:
                raw = ser.readline().decode("utf-8", errors="ignore")
                parsed = parse_line(raw)
                if parsed is None:
                    continue
                device_ms, hr, hr_valid, spo2, spo2_valid, ax, ay, az = parsed
                now = dt.datetime.now().isoformat(timespec="seconds")
                writer.writerow([now, device_ms, hr, hr_valid, spo2,
                                 spo2_valid, ax, ay, az])
                f.flush()  # save each line immediately, in case of crash
                rows_written += 1

                # Show a live readout so you know it's working.
                flag = "" if (spo2_valid and hr_valid) else "  (settling...)"
                print(f"\r{now}   SpO2 {spo2:3d}%   HR {hr:3d} bpm   "
                      f"rows {rows_written}{flag}   ", end="", flush=True)
        except KeyboardInterrupt:
            print("\n\nStopped.")
        finally:
            ser.close()

    print(f"Saved {rows_written} rows to {args.out}")
    print(f"Now run:  python analyze.py {args.out}")


if __name__ == "__main__":
    main()
