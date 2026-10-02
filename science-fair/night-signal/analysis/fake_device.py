#!/usr/bin/env python3
"""
Night Signal - fake wearable (for testing without hardware, Mac/Linux)
=====================================================================

Creates a virtual serial port that talks exactly like the real ESP32
firmware (v3): a #STATUS self-test line, then one data line per second.
Point record.py or check_device.py at the port it prints.

USAGE
-----
    python fake_device.py                 # healthy device
    python fake_device.py --no-finger     # finger off the sensor
    python fake_device.py --broken-mpu    # motion sensor fault

Then, in another terminal:
    python check_device.py --port /dev/pts/5 --seconds 15

(Virtual ports need Mac or Linux. On Windows, use simulate.py instead.)
"""

import argparse
import math
import os
import random
import sys
import time


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-finger", action="store_true")
    ap.add_argument("--broken-mpu", action="store_true")
    ap.add_argument("--rate", type=float, default=1.0, help="lines per second")
    ap.add_argument("--battery", type=int, default=82)
    args = ap.parse_args()

    if not hasattr(os, "openpty"):
        sys.exit("Virtual serial ports need Mac or Linux.")
    master, slave = os.openpty()
    print(os.ttyname(slave), flush=True)          # the port to connect to

    def send(line):
        os.write(master, (line + "\r\n").encode())

    mpu = "FAIL" if args.broken_mpu else "OK"
    send(f"#STATUS,fw=3.0,max30102=OK,mpu6050={mpu},battery={args.battery}")
    send("millis,heartRate,hrValid,spo2,spo2Valid,ax,ay,az,finger,battery")
    t0, i = time.time(), 0
    try:
        while True:
            i += 1
            finger = 0 if args.no_finger else 1
            hr = int(60 + 3 * math.sin(i / 4) + random.gauss(0, 1))
            spo2 = int(round(97 + random.gauss(0, 0.6)))
            ok = 1 if finger and i > 3 else 0
            if args.broken_mpu:
                ax = ay = az = 0.0
            else:
                ax, ay, az = (random.gauss(0, .03), random.gauss(0, .03), 1 + random.gauss(0, .03))
            ms = int((time.time() - t0) * 1000)
            send(f"{ms},{hr},{ok},{spo2},{ok},{ax:.2f},{ay:.2f},{az:.2f},{finger},{args.battery}")
            if i % 30 == 0:
                send(f"#STATUS,fw=3.0,max30102=OK,mpu6050={mpu},battery={args.battery}")
            time.sleep(1 / args.rate)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
