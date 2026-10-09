# Night Signal — speaker script

Target: 8 min 40 s spoken (limit 7–10 min) + 3 min questions.

| # | Slide | Time | Running |
|---|---|---|---|
| 1 | Title | 15 s | 0:15 |
| 2 | Purpose & hypothesis | 45 s | 1:00 |
| 3 | Scientific background | 50 s | 1:50 |
| 4 | Design | 40 s | 2:30 |
| 5 | How it works | 35 s | 3:05 |
| 6 | Protocol | 50 s | 3:55 |
| 7 | The app | 30 s | 4:25 |
| 8 | Results table | 40 s | 5:05 |
| 9 | Demonstration charts | 30 s | 5:35 |
| 10 | Signal quality | 35 s | 6:10 |
| 11 | Analysis: interpretation | 45 s | 6:55 |
| 12 | Sources of error | 40 s | 7:35 |
| 13 | Status | 35 s | 8:10 |
| 14 | Conclusion | 30 s | 8:40 |

## 1. Title  (15 s)

Good morning. My name is Gabriel Mamane. My project, Night Signal, asks how accurately a low-cost wearable can measure blood oxygen and heart rate, and whether software can flag drops in oxygen. It is not a test for sleep apnea.

## 2. Purpose & hypothesis  (45 s)

My question is how closely my wearable's oxygen and heart-rate readings agree with a Health Canada-authorized fingertip oximeter, and whether software can reliably flag oxygen desaturation events. My hypothesis is that, when it is worn properly and only good-quality readings are used, it will agree within about three percentage points, because both devices measure how blood absorbs red and infrared light. What I change is the measuring device and the test condition; what I measure is the difference between the two devices, the events flagged, and how much of the signal is valid.

## 3. Scientific background  (50 s)

A pulse oximeter shines red and infrared light through the fingertip; oxygen-rich and oxygen-poor blood absorb them differently, which gives the oxygen saturation, SpO2. A desaturation is a short drop in SpO2, and sleep studies count drops of three percent or more, but only together with other signals. Sleep apnea is diagnosed with a sleep study that measures airflow, breathing effort and sleep itself. My device measures only oxygen and heart rate, so it cannot tell an apnea from other causes of a dip, and it would miss apneas that cause little or no drop. That is why my project is about measurement accuracy and oxygen dips, not about diagnosing sleep apnea.

## 4. Design  (40 s)

This is the design. The first prototype keeps things simple: an ESP32 board in a running armband, a MAX30102 sensor in a velcro finger cuff, and a USB cable for power, with every wire plugged in. It reads oxygen and heart rate once per second. The 3D model shows a possible later version in a sealed case. The prototype has not been built yet; the parts list and build guide are ready.

## 5. How it works  (35 s)

The finger sensor's light readings go to the ESP32, which calculates oxygen and pulse once per second and sends each reading over Bluetooth or USB to my app and analysis code. Every session will start with a device check that must say READY. So far I have tested this check only on a simulated device, where it also correctly reported a broken sensor; it still has to be tested on the real hardware.

## 6. Protocol  (50 s)

This is my planned protocol. Nothing will be tested on anyone, including me, until my teacher approves the revised scope, the ethics committee approves, and consent is signed. The main test is accuracy: seated at rest, I wear my device on one finger and the reference oximeter on the other hand, and I record both oxygen and heart rate every two minutes for thirty minutes, over several sessions. Every reading must pass signal-quality checks. If approved, overnight recordings will measure signal quality and desaturation events, but those events cannot be verified because the reference oximeter does not record overnight. An optional breath-hold test, only if approved, would check whether short, awake dips are flagged; it does not test sleep apnea.

## 7. The app  (30 s)

This is my companion app. The Night tab shows the oxygen chart, the desaturation events it flagged, the event rate per hour of valid recording and how much of the signal was valid. The Live tab connects to the wearable and runs the device checks. Everything you see so far is clearly labelled demonstration data.

## 8. Results table  (40 s)

These are the results I will collect. I have not collected any real data yet. The table shows each measure, how it is calculated, and a demonstration value from simulated data, which only proves that my analysis code runs; they are not findings. The event rate is the number of desaturation events divided by the hours of valid signal, not hours in bed, and it is not an apnea-hypopnea index. The last column will be filled in with real results before January eleventh.

## 9. Demonstration charts  (30 s)

These two charts show how the results will be presented, using simulated data. On the left, the oxygen line with each flagged desaturation event as a red band. On the right, a Bland-Altman chart, the standard way to compare two measuring devices: each dot is a pair of readings, and the dashed lines show the range that ninety-five percent of differences fall in. With real data, that range is what tests my hypothesis.

## 10. Signal quality  (35 s)

Only good readings count. A reading is used only if a finger is on the sensor, the sensor marks it valid, it is in a believable range, and there was no sudden movement within five seconds. The event rate is the number of flagged events divided by the hours of valid signal. It is not per hour of sleep, because my device cannot measure sleep, and every report states how much of the signal was valid.

## 11. Analysis: interpretation  (45 s)

This is how I will interpret the results. If ninety-five percent of the oxygen differences fall within three points of the reference at rest, my hypothesis is supported for those conditions, keeping in mind that the reference is itself accurate to about two points. A flagged event means an oxygen dip, not an apnea, and overnight events cannot be checked because the reference does not record overnight. The breath-hold test, if approved, shows only whether awake dips are flagged. Wider limits, a consistent bias, too little valid signal, or missed dips would count against my hypothesis.

## 12. Sources of error  (40 s)

Sources of error in measurement: movement, finger pressure, cold hands and room light can distort the light signal; research has shown pulse oximeters can be less accurate on darker skin; and the reference is only accurate to about two points. In the method: my device measures only oxygen and heart rate, so it cannot identify apnea; sitting awake is not the same as sleep, and a breath-hold is not an apnea; there is only one participant; and overnight events cannot be verified. I also estimated that a small battery would last only four to five hours, which is why the first prototype is planned to use USB power; I still have to measure that.

## 13. Status  (35 s)

To be clear about where the project stands: the design, firmware, analysis software, app and 3D model are done, and the software has been tested only on simulated data. Still pending are my teacher's approval of the revised scope, ethics approval and consent, building the prototype, and all of the real measurements.

## 14. Conclusion  (30 s)

I do not have a conclusion yet, because no real data has been collected. After the accuracy sessions, this project will show how closely the wearable agrees with a reference oximeter at rest, how much of a recording gives a valid signal, and, if approved, whether flagged dips match logged ones. It cannot show whether anyone has sleep apnea. Thank you; I am happy to take questions.

## Appendix slides (A–D) and bibliography are in the deck but not presented.
