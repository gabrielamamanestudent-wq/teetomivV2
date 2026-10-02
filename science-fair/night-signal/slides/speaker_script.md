# Night Signal — speaker script

Target: 8 min 40 s spoken (limit 7–10 min) + 3 min questions.

| # | Slide | Time | Running |
|---|---|---|---|
| 1 | Title | 15 s | 0:15 |
| 2 | Purpose & hypothesis | 40 s | 0:55 |
| 3 | Scientific background | 50 s | 1:45 |
| 4 | Design | 40 s | 2:25 |
| 5 | How it works | 35 s | 3:00 |
| 6 | Protocol | 45 s | 3:45 |
| 7 | The app | 35 s | 4:20 |
| 8 | Results summary | 40 s | 5:00 |
| 9 | Results: detection + accuracy | 35 s | 5:35 |
| 10 | Results: position + ML | 30 s | 6:05 |
| 11 | Analysis: interpretation | 45 s | 6:50 |
| 12 | Analysis: sources of error | 35 s | 7:25 |
| 13 | Spin-offs | 40 s | 8:05 |
| 14 | Conclusion | 35 s | 8:40 |

## 1. Title  (15 s)

Hi, I'm Gabriela. My project is Night Signal: a wearable I designed that watches your blood oxygen while you sleep to catch sleep apnea — and it turns out the same sensor can screen the heart and breathing too.

## 2. Purpose & hypothesis  (40 s)

My question: can a wearable that costs about sixty-five dollars catch sleep apnea? My hypothesis: if each breathing pause makes oxygen dip, a fingertip sensor reading once per second will see the dips, and software can count them per hour — the AHI doctors use. What I change is breath-hold length and sleeping position; what I measure is events, the AHI, and how closely my device agrees with a real oximeter.

## 3. Scientific background  (50 s)

Sleep apnea is when the airway collapses during sleep and breathing stops for ten seconds or more, over and over. About 936 million adults have it, and most don't know. Every pause drops blood oxygen. A pulse oximeter measures that by shining red and infrared light through the fingertip — oxygen-rich blood absorbs the two colours differently. Doctors count the events per hour — the AHI — and grade it from normal to severe. The problem: the standard test is an overnight lab study that costs thousands.

## 4. Design  (40 s)

Here's the design. A small case — a 70 by 45 millimetre project box — rides on a velcro strap and holds the ESP32 processor, battery, charger and a motion sensor. A cable runs to a velcro finger clip with the MAX30102 oxygen sensor. On the right is the exploded view with every part at its real size; you can spin the interactive version with this QR code.

## 5. How it works  (35 s)

The data path: the finger sensor's light readings go to the ESP32, which calculates oxygen and pulse and reads body position, then sends one line per second over Bluetooth or USB to my app and analysis code. To make sure it's really working, I built a self-test: every recording starts with a device check that has to say READY — and when I tested with a broken motion sensor, it correctly said NOT READY.

## 6. Protocol  (45 s)

My key manipulations: one, a device check before every session. Two, an accuracy test — I wear my device and a store-bought oximeter at the same time and compare. Three, a detection test: supervised, awake breath-holds of 10, 15 and 20 seconds — I know exactly when they happened, so I can score my software. Four, a battery runtime test. Five, full recorded nights. Safety first: breath-holds only while awake and supervised, with consent and ethics approval.

## 7. The app  (35 s)

This is my companion app. On the Live tab it connects directly to the wearable and shows oxygen, heart rate and position every second, with health checks running the whole time. Saving a session gives the exact CSV my analysis uses, so every number is traceable. Scan the code to try it — there's a demo device built in.

## 8. Results summary  (40 s)

Here's the summary. Over a seven-hour night, the software found 19 events — an AHI of 2.7, which is in the normal range. Oxygen averaged 97.5% and dropped to 84% at the lowest. Against a reference oximeter, my device was within about half a percent. The detector caught 63% of known events with zero false alarms. And events were about three times more frequent on the back than on the sides.

## 9. Results: detection + accuracy  (35 s)

On the left, a whole night of oxygen — every red band is an event my code found on its own. On the right is a Bland–Altman plot, the standard way medical papers compare two devices: the average difference is almost zero, and 95% of my readings fall within about one and a half percent of the reference.

## 10. Results: position + ML  (30 s)

Two more results. Events happened most on the back — 3.8 per hour versus about 1 on the sides. And I compared my simple rule with a machine-learning model: on new data, both caught the same share of events, but the rule had no false alarms, so for now the simpler method wins.

## 11. Analysis: interpretation  (45 s)

What does it mean? First, accuracy within about one and a half percent is in the same range as store-bought oximeters, so the dips are real. Second, the detector is cautious — no false alarms but it misses shallow events, so my AHI is probably an underestimate, which is the safer mistake for a screening tool. Third, the back-sleeping result matches what doctors call positional sleep apnea. And fourth, machine learning didn't win yet because it only had one night to learn from — more data matters more than fancier code.

## 12. Analysis: sources of error  (35 s)

Sources of error: movement, finger pressure and cold hands can distort the light signal; the four-second averaging can blur very short dips; even the reference oximeter is only plus or minus two percent. On the method side, awake breath-holds aren't identical to real apnea, I only measure oxygen — not airflow or brain waves like a sleep lab — and one person isn't enough to generalize. I also caught an engineering problem: the battery only lasts four to five hours with Bluetooth, so I added a runtime test and use a power bank for full nights.

## 13. Spin-offs  (40 s)

The same hardware opened two spin-offs. Heart: it flags racing, very slow and irregular-rhythm episodes. Asthma: night-time asthma often gets worse around 4 a.m., and my code tracks breathing rate from the heart's rhythm plus coughs from sudden jolts of the motion sensor — here it caught breathing climbing from 13 to 22 breaths a minute. These are screening ideas, not diagnoses.

## 14. Conclusion  (35 s)

Back to my hypothesis: so far it's supported — a low-cost wearable measured oxygen within about half a percent of a reference, found apnea events by itself, scored the night, and showed back-sleeping triples events. Next I'd test more people and nights, add an airflow sensor, fix the battery life, and shrink it into a ring to compare against a real sleep lab. Thank you — I'm happy to take questions.

## Appendix slides (A–D) and bibliography are in the deck but not presented.
