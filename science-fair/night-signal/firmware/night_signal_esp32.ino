/*
  Night Signal — ESP32 wearable pulse-oximeter firmware
  ------------------------------------------------------
  Science-fair project: a low-cost wearable that streams blood-oxygen (SpO2)
  and heart-rate readings over Bluetooth so a laptop can log them all night
  and later detect sleep-apnea events.

  HARDWARE
    - ESP32 dev board (has Bluetooth built in)
    - MAX30102 pulse-oximeter / heart-rate sensor (I2C)

  WIRING (only 4 wires)
    MAX30102        ESP32
    --------        -----
    VIN  ---------> 3V3
    GND  ---------> GND
    SDA  ---------> GPIO 21   (default I2C data)
    SCL  ---------> GPIO 22   (default I2C clock)

  LIBRARIES (install in Arduino IDE -> Library Manager)
    - "SparkFun MAX3010x Pulse and Proximity Sensor Library"
    (BluetoothSerial and Wire ship with the ESP32 board package.)

  WHAT IT SENDS
    One CSV line about once per second, over Bluetooth (device name "NightSignal"):

        millis,heartRate,hrValid,spo2,spo2Valid

    e.g.  372145,68,1,97,1
    (hrValid / spo2Valid are 1 when the sensor is confident, 0 otherwise.)

  The matching laptop program (analysis/record.py) reads these lines and
  saves them to a CSV file for the night.

  NOTE: Educational prototype only. Not a medical device.
*/

#include <Wire.h>
#include "MAX30105.h"          // SparkFun library (works with MAX30102)
#include "spo2_algorithm.h"    // Maxim SpO2 + heart-rate algorithm
#include "BluetoothSerial.h"

// --- Bluetooth setup -------------------------------------------------------
BluetoothSerial SerialBT;
const char* DEVICE_NAME = "NightSignal";   // this is the name you pair to

// --- Sensor setup ----------------------------------------------------------
MAX30105 sensor;

// The Maxim algorithm works on a window of 100 samples at a time.
#define SAMPLE_WINDOW 100
uint32_t irBuffer[SAMPLE_WINDOW];    // infrared LED readings
uint32_t redBuffer[SAMPLE_WINDOW];   // red LED readings

int32_t  spo2;            // calculated SpO2 value
int8_t   validSPO2;       // 1 = algorithm is confident in the SpO2 value
int32_t  heartRate;       // calculated heart rate
int8_t   validHeartRate;  // 1 = algorithm is confident in the heart rate

void setup() {
  Serial.begin(115200);          // USB serial, handy for debugging
  SerialBT.begin(DEVICE_NAME);   // start Bluetooth
  Serial.println("Night Signal starting...");

  // Start the sensor on the default I2C pins at fast speed.
  if (!sensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 not found. Check wiring and power.");
    while (1) { delay(1000); }   // stop here if the sensor is missing
  }

  // Recommended settings for SpO2 sensing (from SparkFun's example).
  byte ledBrightness = 60;   // 0=off .. 255=max
  byte sampleAverage = 4;    // average this many samples
  byte ledMode       = 2;    // 2 = red + infrared (needed for SpO2)
  int  sampleRate    = 100;  // samples per second
  int  pulseWidth    = 411;  // longer = more sensitive
  int  adcRange      = 4096; // sensor ADC range
  sensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);

  Serial.println("Sensor ready. Put a fingertip on it.");
  // CSV header (also sent over Bluetooth so the log file is self-describing)
  SerialBT.println("millis,heartRate,hrValid,spo2,spo2Valid");
}

void loop() {
  // 1) Fill the buffer with 100 fresh samples from the sensor.
  for (int i = 0; i < SAMPLE_WINDOW; i++) {
    while (!sensor.available()) {
      sensor.check();   // wait for the next reading
    }
    redBuffer[i] = sensor.getRed();
    irBuffer[i]  = sensor.getIR();
    sensor.nextSample();
  }

  // 2) Run the Maxim algorithm on that window to get SpO2 + heart rate.
  maxim_heart_rate_and_oxygen_saturation(
      irBuffer, SAMPLE_WINDOW, redBuffer,
      &spo2, &validSPO2, &heartRate, &validHeartRate);

  // 3) Send one CSV line over Bluetooth (and mirror it to USB serial).
  String line = String(millis()) + "," +
                String(heartRate) + "," + String(validHeartRate) + "," +
                String(spo2)      + "," + String(validSPO2);

  SerialBT.println(line);
  Serial.println(line);

  // Small pause; the 100-sample window already takes about a second.
  delay(50);
}
