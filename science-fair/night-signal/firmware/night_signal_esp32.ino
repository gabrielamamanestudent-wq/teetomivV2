/*
  Night Signal — ESP32 wearable firmware  (advanced version)
  ----------------------------------------------------------
  A low-cost wearable that streams blood-oxygen (SpO2), heart-rate, AND body
  position over Bluetooth, so a laptop can log them all night and later:
    - detect sleep-apnea events
    - measure breathing rate + heart-rate variability
    - test whether sleeping position changes how often apnea happens

  HARDWARE
    - ESP32 dev board (classic ESP32-WROOM-32 — needed for Bluetooth Classic)
    - MAX30102 pulse-oximeter / heart-rate sensor (I2C)
    - MPU-6050 accelerometer (I2C) — for body position

  WIRING
    Both sensors share the same two I2C wires (SDA/SCL). Wire them in parallel.

    MAX30102 / MPU-6050      ESP32
    ------------------       -----
    VIN / VCC  ----------->  3V3
    GND        ----------->  GND
    SDA        ----------->  GPIO 21   (default I2C data)
    SCL        ----------->  GPIO 22   (default I2C clock)

  LIBRARIES (Arduino IDE -> Library Manager)
    - "SparkFun MAX3010x Pulse and Proximity Sensor Library"
    (The MPU-6050 is read directly over I2C below, so it needs NO library.
     BluetoothSerial and Wire ship with the ESP32 board package.)

  WHAT IT SENDS  (one CSV line ~once per second, Bluetooth name "NightSignal")
        millis,heartRate,hrValid,spo2,spo2Valid,ax,ay,az
    e.g. 372145,68,1,97,1,0.02,-0.98,0.05
    (ax/ay/az are acceleration in g; at rest one axis reads about ±1.0 = gravity,
     which tells us which way the body is facing.)

  NOTE: Educational prototype only. Not a medical device.
*/

#include <Wire.h>
#include "MAX30105.h"          // SparkFun library (works with MAX30102)
#include "spo2_algorithm.h"    // Maxim SpO2 + heart-rate algorithm
#include "BluetoothSerial.h"

// --- Bluetooth setup -------------------------------------------------------
BluetoothSerial SerialBT;
const char* DEVICE_NAME = "NightSignal";

// --- Oxygen / heart-rate sensor -------------------------------------------
MAX30105 sensor;

#define SAMPLE_WINDOW 100
uint32_t irBuffer[SAMPLE_WINDOW];
uint32_t redBuffer[SAMPLE_WINDOW];
int32_t  spo2;
int8_t   validSPO2;
int32_t  heartRate;
int8_t   validHeartRate;

// --- Accelerometer (MPU-6050) ---------------------------------------------
// Read directly over I2C — no library needed.
const uint8_t MPU_ADDR = 0x68;   // default MPU-6050 address
bool mpuOK = false;

void mpuWake() {
  // Wake the MPU-6050 up (it boots in sleep mode).
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);   // PWR_MGMT_1 register
  Wire.write(0);      // 0 = wake up
  mpuOK = (Wire.endTransmission() == 0);
}

// Read acceleration in g for each axis (±2g range -> divide raw by 16384).
void mpuReadG(float &ax, float &ay, float &az) {
  ax = ay = az = 0.0;
  if (!mpuOK) return;
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);   // ACCEL_XOUT_H — first accel register
  if (Wire.endTransmission(false) != 0) return;
  Wire.requestFrom(MPU_ADDR, (uint8_t)6);
  if (Wire.available() < 6) return;
  int16_t rx = (Wire.read() << 8) | Wire.read();
  int16_t ry = (Wire.read() << 8) | Wire.read();
  int16_t rz = (Wire.read() << 8) | Wire.read();
  ax = rx / 16384.0;
  ay = ry / 16384.0;
  az = rz / 16384.0;
}

void setup() {
  Serial.begin(115200);
  SerialBT.begin(DEVICE_NAME);
  Serial.println("Night Signal starting...");

  if (!sensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 not found. Check wiring and power.");
    while (1) { delay(1000); }
  }

  // Recommended MAX30102 settings for SpO2 (from SparkFun's example).
  byte ledBrightness = 60, sampleAverage = 4, ledMode = 2;
  int  sampleRate = 100, pulseWidth = 411, adcRange = 4096;
  sensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);

  mpuWake();
  if (!mpuOK) Serial.println("MPU-6050 not found — position column will be 0.");

  Serial.println("Sensors ready. Put a fingertip on the MAX30102.");
  SerialBT.println("millis,heartRate,hrValid,spo2,spo2Valid,ax,ay,az");
}

void loop() {
  // 1) Fill a window of 100 samples from the oxygen sensor.
  for (int i = 0; i < SAMPLE_WINDOW; i++) {
    while (!sensor.available()) sensor.check();
    redBuffer[i] = sensor.getRed();
    irBuffer[i]  = sensor.getIR();
    sensor.nextSample();
  }

  // 2) Compute SpO2 + heart rate from that window.
  maxim_heart_rate_and_oxygen_saturation(
      irBuffer, SAMPLE_WINDOW, redBuffer,
      &spo2, &validSPO2, &heartRate, &validHeartRate);

  // 3) Read body position from the accelerometer.
  float ax, ay, az;
  mpuReadG(ax, ay, az);

  // 4) Send one CSV line over Bluetooth (mirrored to USB serial).
  String line = String(millis()) + "," +
                String(heartRate) + "," + String(validHeartRate) + "," +
                String(spo2)      + "," + String(validSPO2) + "," +
                String(ax, 2) + "," + String(ay, 2) + "," + String(az, 2);

  SerialBT.println(line);
  Serial.println(line);

  delay(50);
}
