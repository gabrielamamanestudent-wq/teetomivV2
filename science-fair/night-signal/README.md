# Night Signal 🌙

A low-cost wearable that records blood oxygen (SpO₂), heart rate and sleeping
position all night, streams it over **Bluetooth**, and automatically detects
**sleep-apnea events** — plus two spin-offs that screen the **heart** and
**night-time asthma** with the same hardware.

> ⚠️ **Educational prototype only. Not a medical device. Never use it to
> diagnose or treat anyone.**

---

## What's in here

```
night-signal/
├── Night_Signal_Presentation.pptx   # final deck (school format, 8:40 spoken + appendix)
├── Night_Signal_Ethics.docx         # ethics package: protocol, risk assessment, consent, data sheets
├── BUILD_GUIDE.md                   # no-solder assembly, Bluetooth pairing, troubleshooting
├── firmware/
│   └── night_signal_esp32.ino        # v3.1: sensors + self-test + finger, 1 reading/s
├── analysis/
│   ├── protocol.py        # the device's line format (shared by every script)
│   ├── check_device.py    # ✅ run before every recording: proves the device works
│   ├── record.py          # logs a night from the device (USB or Bluetooth)
│   ├── analyze.py         # apnea events, AHI, the night chart
│   ├── validate.py        # #1 accuracy vs a reference oximeter (Bland–Altman)
│   ├── signals.py         # #4 breathing rate + heart-rate variability
│   ├── position.py        # #3 apnea rate by sleeping position
│   ├── train_model.py     # #2 machine learning vs the rule-based detector
│   ├── heart.py           # spin-off: racing / slow / irregular heart episodes
│   ├── asthma.py          # spin-off: breathing rate, coughs, early-morning worsening
│   ├── simulate.py        # fake nights for testing (--profile apnea | heart | asthma)
│   └── fake_device.py     # fake wearable on a virtual serial port (Mac/Linux)
├── app/
│   ├── index.html         # the companion app (built — open with start_app.py)
│   ├── start_app.py       # serves the app at http://localhost:8000 (needed for Live mode)
│   ├── build_app.py       # rebuilds index.html from your recorded nights
│   ├── app_template.html  # the app's design + code
│   ├── 3d.html            # the interactive 3D model (exploded view, real sizes)
│   ├── screenshots/       # pictures used in the app's Progress gallery
│   └── photos/            # put prototype-1.jpg, prototype-2.jpg … here
└── slides/
    ├── build_deck.js      # rebuilds the presentation from slides/assets/
    ├── speaker_script.md  # timed script for the 7–10 minute talk
    └── assets/            # charts, 3D renders, app screenshots, QR codes
```

---

## Public links (QR codes)

The slides' QR codes open these pages in Safari or any phone browser, with no login:

- App: https://gabrielamamanestudent-wq.github.io/teetomivV2/science-fair/night-signal/app/
- 3D model (click **Present full screen**): https://gabrielamamanestudent-wq.github.io/teetomivV2/science-fair/night-signal/app/3d.html
- Buy, build, connect: https://gabrielamamanestudent-wq.github.io/teetomivV2/science-fair/night-signal/build-kit.html

They are served by **GitHub Pages**, which must be switched on once: repository **Settings → Pages →
Deploy from a branch → `claude/science-fair-medical-project-7k0wk4`, folder `/ (root)` → Save**.
Regenerate the QR images with `python slides/make_qr.py`.

---

## Try everything right now (no hardware)

```bash
cd analysis
pip install -r requirements.txt
python simulate.py --hours 7 --events 22 --out night.csv          # apnea night (+ reference + labels)
python simulate.py --hours 7 --events 6 --profile heart  --out heart_night.csv
python simulate.py --hours 7 --events 6 --profile asthma --out asthma_night.csv

python analyze.py night.csv
python validate.py night.csv night_reference.csv
python position.py night.csv
python signals.py night.csv
python train_model.py night.csv night_labels.csv
python heart.py heart_night.csv
python asthma.py asthma_night.csv
```

Test the device pipeline with the fake wearable (Mac/Linux):

```bash
python fake_device.py            # prints a port such as /dev/pts/3
python check_device.py --port /dev/pts/3 --seconds 10
python fake_device.py --broken-mpu   # check_device should now say NOT READY
```

---

## The real device

**Step-by-step assembly (no soldering except 4 pins) and Bluetooth pairing: see [`BUILD_GUIDE.md`](BUILD_GUIDE.md).**

### Parts (exact sizes) — the no-solder kit

| Part (Amazon.ca) | Size |
|------|------|
| [AITRIP ESP32 ESP-WROOM-32 (30-pin, CP2102, USB-C)](https://www.amazon.ca/AITRIP-ESP-WROOM-32-Development-Microcontroller-Compatible/dp/B0DF2YJSHN) | ≈ 52 × 28 mm · pins pre-soldered |
| [HiLetgo MAX30102 sensor](https://www.amazon.ca/HiLetgo-MAX30102-Breakout-Oximetry-Solution/dp/B07QC67KMQ) | 14 × 14 mm · 4 header pins to solder |
| [SHILLEHTEK GY-521 MPU-6050, pre-soldered (2-pack)](https://www.amazon.ca/Pre-Soldered-Accelerometer-Raspberry-Compatible-Arduino/dp/B0BMY15TC4) | ≈ 21 × 16 mm |
| [ELEGOO 120 Dupont jumper wires (F-F, M-F, M-M)](https://www.amazon.ca/Elegoo-120pcs-Multicolored-Breadboard-arduino/dp/B01EV70C78) | 20 cm each |
| [Running armband phone pouch](https://www.amazon.ca/Running-Armband-Samsung-Resistant-Emergency/dp/B08HZ3BPK4) | fits phones up to 6.9 in |
| [Anker Powerline+ USB-A to USB-C cable](https://www.amazon.ca/Anker-Powerline-Double-Braided-Charging-Samsung/dp/B07G148YMS) | 3 m (10 ft) |
| [Anker USB-C to USB-A adapter (2-pack)](https://www.amazon.ca/Adapter-Anker-High-Speed-Transfer-Notebook/dp/B08HZ6PS61) | for a USB-C-only MacBook |
| [VELCRO Brand 1 in × 30 ft roll](https://www.amazon.ca/VELCRO-Brand-VEL-30768-AMS-Self-Gripping-Organization/dp/B09QH2NVM1) | 25 mm wide · cut ≈ 80 mm |
| [Elite Medica fingertip pulse oximeter](https://www.amazon.ca/Elite-Medica-Fingertip-Saturation-Batteries/dp/B0DSGP91PB) | Health Canada authorized |

You probably already have a USB phone charger (the wall plug) and black electrical tape.
Everything plugs together with jumper wires. Only the MAX30102's 4 header pins need
soldering, which takes about 5 minutes for a teacher or anyone with a soldering iron.

### Wiring (each sensor gets its own pins — nothing is shared or spliced)

| Sensor pin | ESP32 pin | Notes |
|------|------------|-------|
| MAX30102 VIN / GND | 3V3 / GND | right-hand side of the board |
| MAX30102 SDA / SCL | GPIO 21 / GPIO 22 | I²C bus 0 |
| GY-521 VCC / GND | VIN / GND | left-hand side; 5 V from USB, the GY-521 has its own 3.3 V regulator |
| GY-521 SDA / SCL | GPIO 33 / GPIO 32 | I²C bus 1 (100 kHz, fine on a long chest wire) |

### Power
Bluetooth draws roughly 100 mA, so a small 500 mAh battery would last only about
**4–5 hours**. Prototype v1 therefore runs from a USB phone charger through a 3 m cable,
which lasts all night. The 3D model shows the planned v2: a sealed case with its own battery.

### Every session

1. Flash `firmware/night_signal_esp32.ino` (see `BUILD_GUIDE.md`, Phase A).
2. Pair **NightSignal** over Bluetooth (or use the USB cable). On a Mac the port is `/dev/cu.NightSignal`; on Windows a COM port such as `COM5`.
3. `python check_device.py --port COM5` → must say **READY**.
4. `python record.py --port COM5` all night, Ctrl+C in the morning (Mac: `caffeinate -i python3 record.py --port /dev/cu.NightSignal`).
5. Run the analysis scripts, then rebuild the app and slides with your real data:

```bash
cd app
python build_app.py --night ../analysis/night.csv --reference ../analysis/night_reference.csv \
  --labels ../analysis/night_labels.csv --heart ../analysis/heart_night.csv \
  --asthma ../analysis/asthma_night.csv --images screenshots
python start_app.py          # Chrome/Edge: Live tab connects to the device
```

Copy the new chart PNGs into `slides/assets/` and run `node build_deck.js` to
rebuild the presentation.

---

## Safety & testing

- Never hold your breath while asleep. Test events only with short, voluntary
  breath-holds **while awake and supervised**.
- Get parent/guardian consent and ethics-committee approval (human subject)
  before testing on anyone.
