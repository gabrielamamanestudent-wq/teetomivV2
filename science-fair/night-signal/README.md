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
├── BUILD_GUIDE.md                   # assembly, wiring, case, Bluetooth pairing, troubleshooting
├── firmware/
│   └── night_signal_esp32.ino        # v3: sensors + self-test + finger + battery, 1 reading/s
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

**Step-by-step assembly and Bluetooth pairing: see [`BUILD_GUIDE.md`](BUILD_GUIDE.md).**

### Parts (exact sizes)

| Part (Amazon.ca) | Size |
|------|------|
| [AITRIP ESP32 ESP-WROOM-32 (30-pin, CP2102, USB-C)](https://www.amazon.ca/AITRIP-ESP-WROOM-32-Development-Microcontroller-Compatible/dp/B0DF2YJSHN) | ≈ 52 × 28 mm · 13 mm tall with pins |
| [HiLetgo MAX30102 sensor](https://www.amazon.ca/HiLetgo-MAX30102-Breakout-Oximetry-Solution/dp/B07QC67KMQ) | 14 × 14 mm |
| [HiLetgo GY-521 MPU-6050 (3-pack)](https://www.amazon.ca/Hiletgo-MPU6050-Acc%C3%A9l%C3%A9rom%C3%A8tre-gyroscope-convertisseur/dp/B00LP25V1A) | ≈ 21 × 16 mm |
| [LiPo 3.7 V 500 mAh 503035, JST PH2.0](https://www.amazon.ca/Battery-Rechargeable-Lithium-Polymer-Connector/dp/B07S84SBV3) | 35 × 30 × 6 mm |
| [Treedix TP4056 USB-C charger (6-pack)](https://www.amazon.ca/Treedix-Lithium-Charging-Protection-Functions/dp/B09LTVTY5J) | ≈ 28 × 17 mm |
| [Rakstore TPS63020 3.3 V buck-boost](https://www.amazon.ca/Rakstore-TPS63020-Automatic-Buck-Boost-Converter/dp/B09V4SHLTJ) | 1.8–5 V in → 3.3 V out |
| [HoHaing ABS project box (8-pack)](https://www.amazon.ca/HoHaing-Electrical-Junction-Enclosure-Electronic/dp/B0CGV22KKG) | 70 × 45 × 29 mm · inside 66 × 41 × 25 mm |
| [VELCRO Brand 1 in × 30 ft roll](https://www.amazon.ca/VELCRO-Brand-VEL-30768-AMS-Self-Gripping-Organization/dp/B09QH2NVM1) | 25 mm wide · cut ≈ 300 mm + ≈ 80 mm |
| [100 kΩ resistors (2) + jumper wires](https://www.amazon.ca/s?k=100k+ohm+resistor+1%2F4w) | 1/4 W |
| [Elite Medica fingertip pulse oximeter](https://www.amazon.ca/Elite-Medica-Fingertip-Saturation-Batteries/dp/B0DSGP91PB) | Health Canada authorized |

All parts on Amazon.ca. Prices change — check each listing. Several items come in multi-packs, so you'll have spares. Sizes are from the listings; clone boards can vary by about ±2 mm, so measure yours. Inside the box the stack is about 22 mm (battery 6 + ESP32 with pins ≈ 13 + GY-521 ≈ 3), which fits the 25 mm inside height. The resistor link is an Amazon.ca search.

### Wiring

| From | To (ESP32) |
|------|------------|
| MAX30102 + MPU-6050 VIN/VCC, GND | 3V3, GND |
| MAX30102 + MPU-6050 SDA, SCL | GPIO 21, GPIO 22 (shared) |
| Battery → TP4056 → regulator VOUT | 3V3 |
| Battery+ → 100 kΩ → **GPIO 34** → 100 kΩ → GND | battery % (set `HAS_BATTERY_DIV 1`) |

### Power — an honest note
Bluetooth draws roughly 100 mA, so a 500 mAh battery lasts about **4–5 hours**,
not a whole night. Measure it with the battery runtime test (protocol step 3);
for full nights, plug the case into a small USB power bank.

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
