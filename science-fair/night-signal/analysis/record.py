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
     - Mac:     something like  /dev/cu.NightSignal   (list them with: ls /dev/cu.*)
     - Linux:   bind an rfcomm port, e.g. /dev/rfcomm0
2. Install the one dependency:
     pip install pyserial
3. Run it, passing your port:
     python record.py --port COM5
     python3 record.py --port /dev/cu.NightSignal
   On a Mac, stop the laptop sleeping during the night with:
     caffeinate -i python3 record.py --port /dev/cu.NightSignal

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


from protocol import COLUMNS, parse_data, parse_status


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
        writer.writerow(COLUMNS)
        try:
            while True:
                raw = ser.readline().decode("utf-8", errors="ignore")
                status = parse_status(raw)
                if status is not None:
                    # Self-test report from the device (start-up and every 30 s).
                    print(f"\n[device status] {status}")
                    continue
                row = parse_data(raw)
                if row is None:
                    continue
                row["timestamp"] = dt.datetime.now().isoformat(timespec="seconds")
                writer.writerow([row[c] for c in COLUMNS])
                f.flush()  # save each line immediately, in case of crash
                rows_written += 1

                # Show a live readout so you know it's working.
                if not row["finger"]:
                    flag = "  (no finger on sensor!)"
                elif not (row["spo2_valid"] and row["hr_valid"]):
                    flag = "  (settling...)"
                else:
                    flag = ""
                print(f"\r{row['timestamp']}   SpO2 {row['spo2']:3d}%   "
                      f"HR {row['heart_rate']:3d} bpm   rows {rows_written}{flag}   ",
                      end="", flush=True)
        except KeyboardInterrupt:
            print("\n\nStopped.")
        finally:
            ser.close()

    print(f"Saved {rows_written} rows to {args.out}")
    print(f"Now run:  python analyze.py {args.out}")


if __name__ == "__main__":
    main()
