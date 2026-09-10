# Night Signal 🌙

A low-cost wearable that records blood oxygen (SpO₂) and heart rate through
the night, streams it to a laptop over **Bluetooth**, and automatically
detects **sleep-apnea events** — a science-fair project modeled on a clinical
sleep study.

> ⚠️ **Educational prototype only. This is NOT a medical device and must never
> be used to diagnose or treat anyone.**

---

## What's in here

```
night-signal/
├── firmware/
│   └── night_signal_esp32.ino   # runs on the ESP32 wearable
└── analysis/
    ├── record.py                # logs a night of data from the device
    ├── analyze.py               # finds apnea events, makes the graph
    ├── simulate.py              # fake night for testing WITHOUT hardware
    └── requirements.txt
```

---

## Try it right now (no hardware needed)

You can test the whole analysis and make a demo graph before your parts
arrive:

```bash
cd analysis
pip install -r requirements.txt
python simulate.py            # creates demo_night.csv (a fake 6-hour night)
python analyze.py demo_night.csv
```

This prints a report and saves `demo_night_report.png` — a graph of SpO₂ and
heart rate with apnea events marked in red. That graph is your poster's
centerpiece.

---

## Building the real device

### Wiring (only 4 wires)

| MAX30102 pin | connects to ESP32 |
|--------------|-------------------|
| VIN          | 3V3               |
| GND          | GND               |
| SDA          | GPIO 21           |
| SCL          | GPIO 22           |

### Flashing the firmware

1. Install the **Arduino IDE** and add ESP32 board support
   (Boards Manager → "esp32").
2. In **Library Manager**, install
   *"SparkFun MAX3010x Pulse and Proximity Sensor Library"*.
3. Open `firmware/night_signal_esp32.ino`, select your ESP32 board, and Upload.
4. Open the Serial Monitor at **115200 baud** — you should see CSV lines once
   you rest a fingertip on the sensor.

### Recording a night

1. Pair your computer with the Bluetooth device named **`NightSignal`**.
   Pairing creates a serial port:
   - Windows: e.g. `COM5`
   - Mac: e.g. `/dev/tty.NightSignal-SPPSlave`
   - Linux: bind an rfcomm port, e.g. `/dev/rfcomm0`
2. Run the logger overnight:
   ```bash
   cd analysis
   python record.py --port COM5        # use your actual port
   ```
3. In the morning, press **Ctrl+C** to stop. It saves a file like
   `night_2026-09-10_2230.csv`.

### Analyzing it

```bash
python analyze.py night_2026-09-10_2230.csv
```

You'll get a printed report (average SpO₂, lowest SpO₂, events detected,
estimated AHI, severity band) and a `..._report.png` graph.

---

## Tuning the detector

An event = SpO₂ dips at least `--drop` percent below a moving baseline for at
least `--min-seconds`. Defaults match the project plan; adjust to explore
sensitivity (a great thing to discuss in your results):

```bash
python analyze.py night.csv --drop 4 --min-seconds 10 --baseline-seconds 120
```

## Severity bands (events per hour, "AHI")

| AHI    | Band     |
|--------|----------|
| < 5    | Normal   |
| 5–15   | Mild     |
| 15–30  | Moderate |
| > 30   | Severe   |

---

## Safety & testing

- Never ask anyone to stop breathing while asleep. To create test events
  safely, do short **voluntary breath-holds while awake and supervised**.
- If you test on another person, get a parent/guardian's permission and check
  your science fair's rules on human subjects.
