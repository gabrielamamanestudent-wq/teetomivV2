/*
  Night Signal — ESP32 wearable firmware  (v3.1: self-test + live status, no-solder wiring)
  ---------------------------------------------------------------------
  Streams blood oxygen (SpO2), heart rate, body position, finger contact and
  battery level over Bluetooth, once per second, and reports its own health so
  the app can prove the device is working at all times.

  HARDWARE
    - ESP32 dev board (classic ESP32-WROOM-32 — needed for Bluetooth Classic)
    - MAX30102 pulse-oximeter / heart-rate sensor (I2C, in the finger cuff)
    - MPU-6050 accelerometer on a GY-521 board (I2C — gives sleep position)
    - Power: USB cable from a phone charger or power bank (lasts all night)
    - Optional: 2 x 100 kΩ resistors as a battery divider (BAT+ -> 100k -> GPIO34 -> 100k -> GND)

  WIRING  (no soldering, no splitting: each sensor has its own pins and its own I2C bus)
    MAX30102     ESP32 (right side)        GY-521 / MPU-6050   ESP32 (left side)
    VIN  ------> 3V3                       VCC  -------------> VIN  (5 V from USB; the GY-521 has its own 3.3 V regulator)
    GND  ------> GND                       GND  -------------> GND
    SDA  ------> GPIO 21                   SDA  -------------> GPIO 33
    SCL  ------> GPIO 22                   SCL  -------------> GPIO 32
    Status LED: on-board LED on GPIO 2

  LIBRARY: "SparkFun MAX3010x Pulse and Proximity Sensor Library" (Library Manager)

  DATA LINE (one per second, Bluetooth name "NightSignal", 115200 baud on USB)
        millis,heartRate,hrValid,spo2,spo2Valid,ax,ay,az,finger,battery
    e.g. 372145,68,1,97,1,0.02,-0.98,0.05,1,84
      finger  = 1 when a fingertip is on the sensor, else 0
      battery = percent (0-100), or -1 if no battery divider is fitted

  STATUS LINE (at start-up and every 30 s; lines starting with # are not data)
        #STATUS,fw=3.1,max30102=OK,mpu6050=OK,battery=-1

  NOTE: Educational prototype only. Not a medical device.
*/

#include <Wire.h>
#include "MAX30105.h"          // SparkFun library (works with MAX30102)
#include "spo2_algorithm.h"    // Maxim SpO2 + heart-rate algorithm (expects 25 samples/s)
#include "BluetoothSerial.h"

#define FW_VERSION       "3.1"
#define HAS_BATTERY_DIV  0      // set to 1 after fitting the 2 x 100k divider to GPIO34
#define BATTERY_PIN      34
#define LED_PIN          2
#define FINGER_IR_MIN    50000  // IR level above this means a finger is on the sensor
#define MPU_SDA          33     // the motion sensor has its own I2C bus (Wire1),
#define MPU_SCL          32     // so the two sensors never share wires

BluetoothSerial SerialBT;
MAX30105 sensor;
bool maxOK = false, mpuOK = false;

// The Maxim algorithm uses a 100-sample window at 25 samples/s (4 seconds).
// We slide that window forward by 25 samples each loop -> one new reading per second.
#define WINDOW 100
#define STEP    25
uint32_t irBuffer[WINDOW], redBuffer[WINDOW];
int32_t spo2, heartRate;
int8_t  validSPO2, validHeartRate;

const uint8_t MPU_ADDR = 0x68;
unsigned long lastStatus = 0;

// ---------- helpers ----------
void both(const String &s) { SerialBT.println(s); Serial.println(s); }

void mpuWake() {
  Wire1.beginTransmission(MPU_ADDR);
  Wire1.write(0x6B); Wire1.write(0);               // wake up (it boots asleep)
  mpuOK = (Wire1.endTransmission() == 0);
}

void mpuReadG(float &ax, float &ay, float &az) {   // acceleration in g
  ax = ay = az = 0.0;
  if (!mpuOK) return;
  Wire1.beginTransmission(MPU_ADDR);
  Wire1.write(0x3B);
  if (Wire1.endTransmission(false) != 0) { mpuOK = false; return; }
  Wire1.requestFrom(MPU_ADDR, (uint8_t)6);
  if (Wire1.available() < 6) { mpuOK = false; return; }
  int16_t rx = (Wire1.read() << 8) | Wire1.read();
  int16_t ry = (Wire1.read() << 8) | Wire1.read();
  int16_t rz = (Wire1.read() << 8) | Wire1.read();
  ax = rx / 16384.0; ay = ry / 16384.0; az = rz / 16384.0;
}

int batteryPercent() {
#if HAS_BATTERY_DIV
  float v = analogReadMilliVolts(BATTERY_PIN) * 2.0 / 1000.0;   // undo the 1:2 divider
  int pct = (int)((v - 3.30) / (4.20 - 3.30) * 100.0);          // rough LiPo curve
  return constrain(pct, 0, 100);
#else
  return -1;
#endif
}

void sendStatus() {
  both(String("#STATUS,fw=") + FW_VERSION +
       ",max30102=" + (maxOK ? "OK" : "FAIL") +
       ",mpu6050="  + (mpuOK ? "OK" : "FAIL") +
       ",battery="  + String(batteryPercent()));
  lastStatus = millis();
}

void readSamples(int from, int to) {
  for (int i = from; i < to; i++) {
    while (!sensor.available()) sensor.check();
    redBuffer[i] = sensor.getRed();
    irBuffer[i]  = sensor.getIR();
    sensor.nextSample();
  }
}

// ---------- setup ----------
void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  SerialBT.begin("NightSignal");
  Wire.begin();                                    // oxygen sensor: GPIO 21 / 22
  Wire1.begin(MPU_SDA, MPU_SCL, 100000);           // motion sensor: SDA 33 / SCL 32, 100 kHz (fine on a long chest wire)

  maxOK = sensor.begin(Wire, I2C_SPEED_FAST);
  if (maxOK) {
    // SparkFun's recommended SpO2 settings: 100 Hz sampling averaged by 4 = 25 samples/s.
    sensor.setup(60, 4, 2, 100, 411, 4096);
  }
  mpuWake();
  sendStatus();                                    // self-test result, first thing

  // If the oxygen sensor is missing, keep reporting the fault instead of freezing,
  // so the app can show exactly what is wrong.
  while (!maxOK) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));  // fast blink = fault
    delay(250);
    if (millis() - lastStatus > 2000) {
      maxOK = sensor.begin(Wire, I2C_SPEED_FAST);
      if (maxOK) sensor.setup(60, 4, 2, 100, 411, 4096);
      sendStatus();
    }
  }

  both("millis,heartRate,hrValid,spo2,spo2Valid,ax,ay,az,finger,battery");
  readSamples(0, WINDOW);                          // fill the first 4-second window
}

// ---------- loop: one data line per second ----------
void loop() {
  // slide the window: drop the oldest 25 samples, read 25 new ones (1 second)
  for (int i = STEP; i < WINDOW; i++) {
    redBuffer[i - STEP] = redBuffer[i];
    irBuffer[i - STEP]  = irBuffer[i];
  }
  readSamples(WINDOW - STEP, WINDOW);

  maxim_heart_rate_and_oxygen_saturation(irBuffer, WINDOW, redBuffer,
                                         &spo2, &validSPO2, &heartRate, &validHeartRate);

  // finger contact: average infrared level of the newest second
  uint32_t irSum = 0;
  for (int i = WINDOW - STEP; i < WINDOW; i++) irSum += irBuffer[i];
  int finger = (irSum / STEP) > FINGER_IR_MIN ? 1 : 0;
  if (!finger) { validSPO2 = 0; validHeartRate = 0; }   // never trust readings without a finger

  float ax, ay, az;
  mpuReadG(ax, ay, az);

  both(String(millis()) + "," +
       String(heartRate) + "," + String(validHeartRate) + "," +
       String(spo2) + "," + String(validSPO2) + "," +
       String(ax, 2) + "," + String(ay, 2) + "," + String(az, 2) + "," +
       String(finger) + "," + String(batteryPercent()));

  digitalWrite(LED_PIN, HIGH); delay(20); digitalWrite(LED_PIN, LOW);   // heartbeat blink

  if (millis() - lastStatus > 30000) {             // periodic self-test
    if (!mpuOK) mpuWake();
    sendStatus();
  }
}
