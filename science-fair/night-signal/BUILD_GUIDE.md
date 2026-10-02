# Night Signal: build guide (easy version, no tools)

This is the easy version. **Everything plugs together with wires**: there is no
splicing, no gluing and no battery wiring, and the only tool you need is scissors.
It takes about **1½ hours**.

The only soldering is 4 pins on the oxygen sensor. Ask a teacher (the science or
tech lab will have a soldering iron) or anyone handy to do it. It takes about
5 minutes. Getting help with one build step is normal at a science fair: thank
them in your acknowledgements.

> ⚠️ **Educational prototype only, not a medical device.**

---

## 0. What you need

- **Parts:** everything on the Amazon.ca shopping list (`README.md`)
- **From home:** a USB phone charger (the wall plug), scissors, black electrical tape

---

## Step 1: Get the 4 pins soldered on the oxygen sensor (5 min, with a helper)

Give your helper the MAX30102 board and its strip of pins. Tell them:

1. Solder header pins to at least **VIN, SDA, SCL and GND**. Doing all 7 is fine.
2. The pins must stick out of the **back**, which is the side *without* the small black sensor window.

The GY-521 motion sensor and the ESP32 already come with pins.

## Step 2: Install the software (15 min, one time)

1. Install the **Arduino IDE** from arduino.cc/en/software.
2. Go to *Arduino IDE ▸ Settings ▸ Additional boards manager URLs* and paste
   `https://espressif.github.io/arduino-esp32/package_esp32_index.json`.
   Then open *Tools ▸ Board ▸ Boards Manager* and install **esp32 by Espressif Systems**.
3. Open *Sketch ▸ Include Library ▸ Manage Libraries* and install
   **SparkFun MAX3010x Pulse and Proximity Sensor Library**.

## Step 3: Plug in the wires (15 min)

Each sensor has **its own pins** on the ESP32, so nothing is shared.
- **Every pin has its name printed next to it.** Match the names, not the positions.
- **Push each plug all the way on.**

**Oxygen sensor (MAX30102), on the right side of the ESP32.** These wires go to your finger, so make
them about 40 cm long by joining two wires end to end:
1. Push a **male–female** wire's female end onto the ESP32 pin.
2. Push its male end into a **female–female** wire.
3. Push the female–female wire's other end onto the sensor.

| MAX30102 | ESP32 | Colour (suggested) |
|---|---|---|
| VIN | **3V3** (never VIN or 5 V) | red |
| GND | **GND** | black |
| SDA | **D21** | blue |
| SCL | **D22** | yellow |

**Motion sensor (GY-521), on the left side of the ESP32.** A single female–female wire (20 cm) for each pin is enough.

| GY-521 | ESP32 | Colour (suggested) |
|---|---|---|
| VCC | **VIN** | orange |
| GND | **GND** (the one on the left side) | black |
| SDA | **D33** | blue |
| SCL | **D32** | yellow |

Leave the GY-521's other pins (XDA, XCL, AD0, INT) empty.
Wrap a small piece of tape around each place where two wires join, so they can't pull apart.

## Step 4: Upload the code (10 min)

1. Connect the ESP32 to your MacBook with the **3 m cable plus the USB-C adapter**.
2. Open `firmware/night_signal_esp32.ino` in the Arduino IDE.
3. Choose *Tools ▸ Board ▸ esp32 ▸ ESP32 Dev Module*.
4. Choose *Tools ▸ Port*. The port looks like `/dev/cu.usbserial-0001`. If nothing appears, install the Silicon Labs **CP210x** driver and try again.
5. Click **Upload** (the → arrow). If it sticks on `Connecting....`, hold the **BOOT** button on the ESP32 until it starts.
6. Open *Tools ▸ Serial Monitor* and set it to **115200**. You should see:
   ```
   #STATUS,fw=3.1,max30102=OK,mpu6050=OK,battery=-1
   ```
   `battery=-1` just means it is running on USB power.
7. Rest a fingertip on the sensor. After about 15 s, numbers like `372145,68,1,97,1,…` appear.

✅ **Two `OK`s means the electronics work.**

## Step 5: Make the finger cuff (10 min, scissors only)

1. Cut **≈ 80 mm** of the VELCRO roll.
2. Cut a small **1 cm slit** in the middle of it.
3. Hold the sensor on the **soft side** with its black window facing up, and push its plugs through the slit.
   - **If the plugs are already on the sensor's pins:** unplug them first, push the bare pins through the slit, then plug them back in.
4. Wrap it around the pad of your **index finger** with the window touching the skin. It should be snug, not tight, because a tight cuff squeezes the blood out and the readings get worse.
5. Wrap one layer of **black electrical tape** around the outside to block room light.

## Step 6: Put it on (5 min)

1. Put the ESP32 in the **armband pouch** and wear it on your **forearm**.
2. Let the finger wires and the USB cable come out through the zip.
3. Plug the 3 m cable into a **USB phone charger** next to the bed. That powers it all night.

The motion sensor can ride in the pouch, lying flat, for demos and oxygen tests.
**For the sleep-position nights it must be on your chest** (see below).

### Sleep-position nights: motion sensor on the chest
`position.py` expects the GY-521 flat on your **chest** (breastbone), with its chips facing
out and the printed **X arrow pointing to your right side**.
1. Lengthen its 4 wires to about **60 cm**: plug two male–female wires into each other, then a female–female wire on the end.
2. Tape the board to your chest with medical tape. No code change is needed, because its connection already runs at a slower speed that works on long wires.
3. **Check it:** lie on your back, left side, right side and stomach for 1 minute each, then run
   `position.py`. It should name all four positions correctly.

---

## Step 7: Connect to your Mac by Bluetooth

The ESP32 appears as a Bluetooth device named **NightSignal**. Your computer treats it like
a cable connection, so the scripts and the app read it the same way.

1. **Turn it on:** plug the USB cable into the charger. The blue LED blinks **once per second**
   when it is working. Fast blinking means a sensor isn't plugged in properly.
2. **Pair it:** open **System Settings ▸ Bluetooth**, find **NightSignal** under *Nearby Devices* and click **Connect**.
   If it asks for a PIN, try `1234`.
3. **Find its name** in Terminal:
   ```bash
   ls /dev/cu.*
   ```
   Look for `/dev/cu.NightSignal`.
4. **Check that the device works.** It must say **READY**:
   ```bash
   cd "4 - Code/analysis"
   pip3 install -r requirements.txt
   python3 check_device.py --port /dev/cu.NightSignal
   ```
5. **Record a night.** `caffeinate` stops the Mac from sleeping. Press Ctrl+C in the morning.
   ```bash
   caffeinate -i python3 record.py --port /dev/cu.NightSignal
   ```
6. **Watch it live in the app:**
   1. In the `3 - App` folder, run `python3 start_app.py`.
   2. Open **Chrome** at `http://localhost:8000` and go to the **Live** tab.
   3. Click **Connect device** and pick NightSignal.

> In Bluetooth settings the Mac often shows NightSignal as "Not connected". That is normal.
> The link opens when a program opens the port.

### Windows
1. Open *Settings ▸ Bluetooth & devices ▸ Add device ▸ Bluetooth* and choose **NightSignal**.
2. Open *More Bluetooth settings ▸ COM Ports*. The **Outgoing** port (for example `COM5`) is the one to use.
3. Run `python check_device.py --port COM5`, then `python record.py --port COM5`.

### If Bluetooth won't cooperate
1. *Forget This Device*, unplug the ESP32 and plug it back in, then pair it again.
2. Some macOS versions are fussy with ESP32 Bluetooth. **The USB cable always works:** plug the 3 m
   cable into the Mac (with the adapter) instead of the charger, and use the same commands with the
   `/dev/cu.usbserial-…` port. The data is identical.

---

## Before every night (checklist)

- [ ] The USB cable is plugged into the charger (or into the Mac)
- [ ] `check_device.py` says **READY**
- [ ] The finger cuff is snug on the index-finger pad, and the armband is on the forearm
- [ ] The laptop is plugged in, within about 5 m, and running `caffeinate -i python3 record.py …`

## Troubleshooting

| Symptom | Fix |
|---|---|
| `max30102=FAIL` | A plug is loose, or SDA/SCL are swapped. VIN must go to **3V3**. Some purple MAX30102 boards need a small fix: send a photo and we'll sort it out. |
| `mpu6050=FAIL` | A plug is loose, or SDA/SCL are swapped (SDA→D33, SCL→D32). VCC goes to **VIN**. |
| `finger=0` the whole time | The cuff is loose or the sensor window is covered. A cold finger can also cause it, so warm your hands. |
| Readings jump around | Movement, a cuff that's too tight, or room light reaching the sensor. Add black tape. |
| No port in *Tools ▸ Port* | Use the Anker cable (some cables only charge). Install the CP210x driver. |
| Upload stuck on `Connecting...` | Hold **BOOT** while it uploads. |
| Data stops in the night | A plug came loose or the Mac slept. Tape the joins, and use `caffeinate`. |

---

## Later (optional): the v2 sealed case
The 3D model shows version 2: a 70 × 45 × 29 mm box with its own battery on a velcro strap.
Building it needs soldering (a battery, a charger board and a 3.3 V regulator), so do it
with help only if you have time after your nights are recorded. Prototype v1 is enough for
the fair.
