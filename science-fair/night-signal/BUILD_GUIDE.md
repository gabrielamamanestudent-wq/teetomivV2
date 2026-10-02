# Night Signal: build guide

This guide covers assembly and the Bluetooth link. Total time is about **3–4 hours**, and you can split it over a few evenings.

> ⚠️ **Educational prototype only, not a medical device.** LiPo batteries can catch
> fire if they are shorted, punctured or charged the wrong way. Solder with an
> adult nearby in a ventilated room.

---

## 0. What you need

**Parts:** everything on the Amazon.ca shopping list (see `README.md`).

**Tools (borrow them from the school tech lab if you can):**

| Tool | Used for |
|---|---|
| Soldering iron + solder | header pins, splices, power wires (the sensor boards ship with loose pins) |
| Wire stripper or scissors | stripping jumper wires |
| Hot glue gun | fixing boards, strap and finger cuff |
| Craft knife or drill (6 mm bit) | holes in the case |
| Electrical tape (black) | insulation + blocking room light at the finger |
| USB-C **data** cable | flashing the ESP32 (charge-only cables don't work) |
| Multimeter (optional, recommended) | checking the 3.3 V before connecting the ESP32 |

**Wire colours.** Pick one colour for each signal and use it everywhere:
- **red** = 3V3
- **black** = GND
- **blue** = SDA
- **yellow** = SCL
- **purple** = battery sense

---

## Phase A: test on the table (≈ 45 min)

Get it working with loose wires first, then put it in the case. This way, a bad
sensor shows up before anything is glued.

1. **Solder header pins** onto the MAX30102 and the GY-521. Put the short side through
   the board, solder one pin, check that it's straight, then solder the rest.
2. **Install the software** (this is a one-time setup):
   1. Install the Arduino IDE from arduino.cc/en/software.
   2. Add the ESP32 boards. Go to *Arduino IDE ▸ Settings ▸ Additional boards manager URLs* and paste
      `https://espressif.github.io/arduino-esp32/package_esp32_index.json`.
      Then open *Tools ▸ Board ▸ Boards Manager* and install **esp32 by Espressif Systems**.
   3. Open *Sketch ▸ Include Library ▸ Manage Libraries* and install
      **SparkFun MAX3010x Pulse and Proximity Sensor Library**.
3. **Wire one sensor at a time** with female–female jumpers. Start with the MAX30102:

   | MAX30102 | ESP32 |
   |---|---|
   | VIN | 3V3 (never 5 V / VIN) |
   | GND | GND |
   | SDA | GPIO 21 (D21) |
   | SCL | GPIO 22 (D22) |

4. **Flash the firmware:**
   1. Open `firmware/night_signal_esp32.ino`.
   2. Choose *Tools ▸ Board ▸ esp32 ▸ ESP32 Dev Module*.
   3. Choose *Tools ▸ Port*. On a Mac the port looks like `/dev/cu.usbserial-0001`. If no port appears, install the Silicon Labs **CP210x** driver.
   4. Click **Upload**. If it sticks on `Connecting....`, hold the **BOOT** button until it starts.
5. **Check it.** Open *Tools ▸ Serial Monitor* at **115200** baud. You should see:
   ```
   #STATUS,fw=3.0,max30102=OK,mpu6050=FAIL,battery=-1
   ```
   `mpu6050=FAIL` is expected because the motion sensor isn't connected yet.
   Rest a fingertip on the sensor. After about 15 s, lines like `372145,68,1,97,1,...` appear.
6. **Swap to the GY-521.** Unplug the MAX30102 and plug the GY-521 into the same four pins (VCC → 3V3).
   Leave AD0 unconnected. Press the ESP32's EN button and check that the status shows `mpu6050=OK`.

✅ **Phase A is done when** both sensors have shown `OK` on their own.

---

## Phase B: final wiring (≈ 60 min)

Both sensors and the power supply share four lines: **3V3, GND, SDA and SCL**. The case is only
**25 mm tall inside**, so in the final build you solder wires straight onto the
ESP32's pins. Plastic jumper plugs are too tall for the lid to close.

1. **Make four splices** (3V3, GND, SDA, SCL). For each one, strip the ends of the wires,
   twist them together, solder, and cover with tape or heat-shrink.

   | Splice | Joins |
   |---|---|
   | **3V3** (red) | ESP32 3V3 · MAX30102 VIN · GY-521 VCC · regulator VOUT |
   | **GND** (black) | ESP32 GND · MAX30102 GND · GY-521 GND · regulator GND · bottom resistor |
   | **SDA** (blue) | ESP32 GPIO 21 · MAX30102 SDA · GY-521 SDA |
   | **SCL** (yellow) | ESP32 GPIO 22 · MAX30102 SCL · GY-521 SCL |

2. **Finger cable.** Run the MAX30102's four wires out of the case. Make them about **25 cm** long
   (wrist to fingertip, with slack) and twist them together so they stay neat.
3. **Power chain.** Cut the battery's wires **one at a time** so the two cut ends never touch:

   ```
   Battery red  → TP4056 B+        Battery black → TP4056 B−
   TP4056 OUT+  → [on/off plug] → TPS63020 VIN
   TP4056 OUT−  → TPS63020 GND
   TPS63020 VOUT → 3V3 splice      TPS63020 GND → GND splice
   ```
   - **On/off plug:** solder a header pin to the regulator's VIN. The wire from TP4056 OUT+
     ends in a female jumper plug that pushes onto that pin. Pull it off to switch the device off.
   - **Check before connecting:** with the plug in, the regulator's VOUT should read **3.2–3.4 V** on the multimeter.
4. **Battery sense.** Wire TP4056 B+ → 100 kΩ → **GPIO 34** → 100 kΩ → GND.
   Then change the firmware line `#define HAS_BATTERY_DIV 0` to **`1`** and flash it again.
5. **Rule:** never plug the ESP32's USB in while the on/off plug is in. Pull the plug first.
   For full nights, keep the plug out and power the ESP32's USB-C from a power bank.

---

## Phase C: case, strap and finger cuff (≈ 60 min)

The case is the HoHaing box: **70 × 45 × 29 mm outside**, **66 × 41 × 25 mm inside**.

1. **Test-fit, then cut.** Put the parts in the box, mark where the two USB-C ports meet the
   end walls, and cut a **≈ 10 × 5 mm slot** for each:
   - the ESP32 USB-C, for flashing and the power bank
   - the TP4056 USB-C, for charging

   Drill a **6 mm hole** in a side wall for the finger cable.
2. **Layer the parts, bottom to top.** The total is about 22 mm of the 25 mm.

   | Layer | Parts | Height |
   |---|---|---|
   | Floor | battery (35 × 30) + TP4056 (28 × 17) side by side, regulator in the gap | 6 mm |
   | Middle | tape over the battery, then the ESP32 resting on its pins | ≈ 13 mm |
   | Lid | GY-521 glued flat to the inside of the lid | ≈ 3 mm |

   Fix the boards with small dots of hot glue on the **box**, never on the battery. Use double-sided tape for the battery.
3. **Strap.** Cut **≈ 300 mm** of the VELCRO roll and hot-glue the middle of it to the outside
   of the box's bottom. Wear the box on the **forearm, just above the wrist**.
4. **Finger cuff.** Cut **≈ 80 mm** of VELCRO.
   1. Hot-glue the back of the MAX30102 to the middle of the soft side, with the sensor window facing the finger.
   2. Tape over the solder joints so no metal touches skin. Leave the sensor window uncovered.
   3. Wrap black electrical tape around the outside to block room light.
   4. Wear it on the **index-finger pad**, snug but not tight. A tight cuff squeezes the blood out and the readings get worse.

### Sleep position: where the motion sensor should go
`position.py` assumes the motion sensor lies flat on your **chest** (sternum) with its
chips facing outward and the printed **X arrow pointing to your right side**.
On the forearm, your arm moves on its own, so the position chart won't mean much.

- **Demos and the oxygen/apnea tests:** leave the GY-521 inside the case.
- **The sleep-position nights:** move the GY-521 to the chest.
  1. Extend its four wires to about 50 cm and tape the board to the sternum with medical tape.
  2. Change `#define I2C_SPEED I2C_SPEED_FAST` to `I2C_SPEED_STANDARD` in the firmware, since slower is more reliable on long wires.
  3. **Check it:** lie on your back, left side, right side and stomach for 1 minute each, then run
     `position.py`. It should name all four positions correctly.

---

## Phase D: link with Bluetooth

The ESP32 appears as a Bluetooth device named **NightSignal**. Your computer
treats it like a serial port, so the scripts and the app read it the same way as a USB cable.

### Mac
1. **Turn it on:** push the on/off plug in, or plug in the power bank. The blue LED blinks **once per
   second** when it is working. Fast blinking means a sensor fault.
2. **Pair it:** open **System Settings ▸ Bluetooth**, find **NightSignal** under *Nearby Devices* and click **Connect**.
   If it asks for a PIN, try `1234`.
3. **Find the port** in Terminal:
   ```bash
   ls /dev/cu.*
   ```
   Look for `/dev/cu.NightSignal`. Use the **cu.** name, not tty.
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
   1. Run `python3 start_app.py` in the `3 - App` folder.
   2. Open **Chrome** at `http://localhost:8000` and go to the **Live** tab.
   3. Click **Connect device** and pick NightSignal.

> In Bluetooth settings the Mac often shows NightSignal as "Not connected". That is normal.
> The link opens when a program opens the port.

### Windows
1. Open *Settings ▸ Bluetooth & devices ▸ Add device ▸ Bluetooth* and choose **NightSignal**.
2. Open *More Bluetooth settings ▸ COM Ports*. The **Outgoing** port (for example `COM5`) is the one to use.
3. Run `python check_device.py --port COM5`, then `python record.py --port COM5`.

### If Bluetooth won't cooperate
1. *Forget This Device*, switch the ESP32 off and on, and pair it again.
2. Some macOS versions are fussy with ESP32 Bluetooth serial. **The USB cable always works:**
   use the same commands with the `/dev/cu.usbserial-…` port, with the laptop beside the bed.
   The data is identical.

---

## Before every night (checklist)

- [ ] The device is charged, or the power bank is plugged into the ESP32
- [ ] `check_device.py` says **READY**
- [ ] The finger cuff is snug on the index-finger pad and the strap is on the forearm
- [ ] The laptop is plugged in, within about 5 m, and running `caffeinate -i python3 record.py …`

## Troubleshooting

| Symptom | Fix |
|---|---|
| `max30102=FAIL` | Check the wiring: SDA/SCL swapped, a loose wire, or VIN not on 3V3. Some purple MAX30102 boards pull the data lines to 1.8 V. Send a photo of the board and we'll fix it. |
| `mpu6050=FAIL` | Same wiring checks. AD0 must be unconnected (address 0x68). |
| `finger=0` the whole time | The cuff is loose or the sensor window is covered. A cold finger can also cause it, so warm your hands. |
| Readings jump around | Movement, a cuff that's too tight, or room light reaching the sensor. Add black tape. |
| No port when plugged in by USB | Use a data cable. Install the CP210x driver. |
| Upload stuck on `Connecting...` | Hold **BOOT** while it uploads. |
| Data stops after 4–5 h | The battery is empty. That is the engineering finding in the slides, so use the power bank. |
| `battery=-1` | Set `HAS_BATTERY_DIV` to 1 and flash again. |
