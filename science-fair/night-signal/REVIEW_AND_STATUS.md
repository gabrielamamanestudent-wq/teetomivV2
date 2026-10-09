# Night Signal: scientific review and project status

**Prepared for:** Ms. Ireland (supervising teacher)
**Student:** Gabriel Mamane
**Date:** October 9, 2026
**Status:** Revised scope proposed. **Ms. Ireland's approval of the revised scope is pending.** No approval, consent or signature has been obtained, and no real data has been collected.

---

## 1. Summary

Ms. Ireland asked two questions about the original proposal: where the blood-oxygen and heart-rate data would come from, and how an oxygen drop would be distinguished from an actual sleep apnea event.

The second question exposed a real weakness. The original proposal claimed that oxygen dips detected by a fingertip sensor could be counted as apnea events, converted into an apnea–hypopnea index (AHI) and sorted into clinical severity bands. That claim is not supported. A fingertip sensor measures only oxygen saturation (SpO₂) and pulse. It cannot measure airflow, breathing effort or sleep, so it cannot identify apneas or calculate an AHI.

The project has therefore been narrowed, as proposed in the reply to Ms. Ireland:

- **Revised question:** How closely do SpO₂ and heart-rate readings from a low-cost wearable (MAX30102 + ESP32) agree with a Health Canada-licensed fingertip pulse oximeter, and can software reliably flag oxygen desaturation events (a drop of at least 3 percentage points lasting at least 10 s) in the wearable's recordings?
- **Revised hypothesis:** If the wearable is worn correctly and only good-quality readings are used, then its SpO₂ will agree with the reference oximeter within about ±3 percentage points (95% limits of agreement), because both measure red/infrared light absorption, and the software will flag the dips that the reference also shows.
- **Scope limit:** This project does not detect, diagnose or confirm sleep apnea, and it does not calculate an AHI.

Every part of the project (proposal, form, ethics package, analysis code, app, charts, presentation and speaker notes) has been revised to match.

## 2. Answers to Ms. Ireland's questions

**1. Where will the SpO₂ and heart-rate data come from?**
From the student's own wearable: a MAX30102 fingertip sensor (red and infrared light) read by an ESP32 microcontroller, which records one SpO₂ and heart-rate value per second and sends it over USB or Bluetooth to a laptop. For comparison, a separate commercial fingertip pulse oximeter with a Health Canada medical device licence is read every 2 minutes during the same session. The participant is the student, and optionally up to four adult volunteers for the seated accuracy session only. No testing will take place before approval and signed consent.

**2. How will an oxygen drop be distinguished from an actual apnea?**
It cannot be, with this design, and the project no longer tries to. Not every oxygen drop is an apnea (movement, poor contact and other conditions also cause drops), and not every apnea causes a large drop. Telling them apart requires airflow, breathing-effort and sleep measurements from a sleep study. The project now reports only **flagged oxygen desaturation events**, never apneas, and validates the measurement itself against a reference oximeter.

## 3. Inaccurate or unsupported claims found, and how each was corrected

| # | Where | Claim found | Correction |
|---|---|---|---|
| 1 | Original proposal, form, ethics package | Question asked whether the device could estimate apnea events per hour "the way a clinical sleep study measures them"; title "Apnea Detector" | New question and hypothesis about measurement agreement and desaturation flagging; title "Night Signal: SpO2 Accuracy" |
| 2 | Proposal, `analyze.py`, app | Calculated an "AHI estimate" and sorted nights into Normal / Mild / Moderate / Severe | AHI and severity bands removed. Reported instead: flagged desaturation events ÷ **hours of valid recording**, with an explicit "not an AHI" note |
| 3 | Code, app, charts, slides | Oxygen dips labelled "apnea events"; "signs of apnea"; "breathing looked healthy" verdicts | Relabelled "flagged desaturation events"; verdicts removed |
| 4 | `analyze.py`, app | Event rate divided by total recording time; events could span invalid gaps | Denominator is now valid-signal hours; events never span a gap in the valid data; every report states the % of valid signal |
| 5 | App | Invented "sleep score" | Removed; replaced by "% valid signal" |
| 6 | Slides, trailer, app | Simulated results (±0.5%, r = 0.88–0.89, 63–82% detection) presented as findings ("We proved it works", "Supported. So far.") | All simulated output is stamped **DEMONSTRATION DATA (simulated) · not a real recording**; the results slide shows a "Real result: pending" column; the conclusion slide now reads "No conclusion yet". The old trailer deck was withdrawn |
| 7 | Proposal, ethics, slides | Awake breath-holds described as creating "apnea events" that validate the detector | Breath-holds are now optional, only if approved, and described as checking only whether induced dips are flagged. They do not validate detecting sleep apnea during sleep |
| 8 | Slides, `position.py` | "3× more events on the back", "positional sleep apnea" | Descriptive, exploratory wording on simulated data only |
| 9 | `heart.py`, app | "Racing heart", "irregular rhythm", implied arrhythmia detection | "Fast / very slow / unsteady heart-rate stretches"; states that per-second optical heart rate cannot identify arrhythmias |
| 10 | `asthma.py`, app | Implied asthma detection; breathing rate presented as measured | Breathing rate described as an unverified estimate from heart-rate rhythm; "cannot detect asthma" |
| 11 | Trailer, 3D page | "Sleep apnea screening you can wear", "catches sleep apnea" | Removed |
| 12 | Slides | Battery life presented as a finding | Labelled "engineering estimate (to be measured)" |
| 13 | Ethics package, consent page | Benefits and summary framed around apnea screening | Rewritten around measurement accuracy; consent page states the device cannot detect or rule out sleep apnea |
| 14 | `validate.py` | "Excellent" accuracy verdict; reference treated as truth | Verdict removed; formal hypothesis check (95% limits within ±3 points); notes that the reference is itself about ±2 points, so this is device agreement, not absolute accuracy |

## 4. Planned method (nothing below has been carried out yet)

1. **Approvals first.** Ms. Ireland approves the revised scope, the ethics committee approves, and informed consent is signed (participant and parent/guardian). No data is collected from anyone, including the student, before all three.
2. **Build and device check.** The device must report READY on `check_device.py` before every session.
3. **Accuracy sessions (main test).** Seated, awake, at rest, warm hands. Wearable on one index finger, reference oximeter on the other hand. Every 2 minutes for 30 minutes, the time and both devices' SpO₂ and pulse are written down (15 pairs per session), on several different days.
4. **Agreement analysis.** `validate.py` pairs each reference reading with the nearest valid wearable reading (within 5 s) and reports bias, 95% limits of agreement (Bland–Altman) and mean absolute difference, for SpO₂ and heart rate.
5. **Overnight recordings (optional, only if approved).** Reports % valid signal and flagged desaturation events per hour of valid recording. The reference oximeter cannot record overnight, so these events cannot be verified, and they are not interpreted as apneas.
6. **Breath-hold test (optional, only if approved).** Awake, seated, adult-supervised, holds of at most 20 s, start and end times logged. It checks only whether induced dips are flagged at the logged times. Short holds may not lower SpO₂ by 3 points. If they do not, that result is reported and the holds are never lengthened.

### Signal-quality checks
A one-second reading is used only if all of these hold:
- a finger is detected on the sensor;
- the sensor marks the SpO₂ reading valid;
- SpO₂ is between 70 and 100%;
- there was no sudden movement (acceleration change > 0.25 g) within 5 seconds.

### Desaturation event definition
A desaturation event is SpO₂ at least 3 percentage points below a 120-second trailing-median baseline for at least 10 seconds, within continuous valid data (a gap of more than 3 s ends an event).

**Event rate = flagged events ÷ hours of valid recording.** It is not per hour of sleep, because the device cannot measure sleep, and it is not an AHI.

### Limitations
- Oxygen and heart rate alone cannot identify apnea (no airflow, breathing effort or sleep staging).
- The reference oximeter is accurate to only about ±2 points, so the comparison measures agreement, not truth.
- Movement, finger pressure, cold hands and ambient light distort optical readings.
- Pulse oximeters can overestimate SpO₂ in people with darker skin (Sjoding et al., 2020).
- Awake rest is not sleep, and a breath-hold is not an apnea.
- There is one main participant, so results cannot be generalized.
- Overnight events cannot be verified.
- The sensor's internal averaging can smooth very short dips.

## 5. Completed vs. planned work

| Completed | Planned / pending |
|---|---|
| Design, parts list, build guide | Ms. Ireland's approval of the revised scope |
| Firmware written (not yet run on real hardware) | Ethics approval and signed consent |
| Analysis software and simulator, tested **only on simulated data** | Building and checking the prototype |
| Companion app and 3D model (show demonstration data only) | Accuracy sessions against the reference |
| Original proposal submitted (Sep 25) | Optional overnight recordings and breath-hold test, if approved |
| Revised proposal form, ethics package and presentation drafted (this review) | Real results, analysis and conclusion (before January 11) |

All numbers that currently appear in the app, charts and slides come from simulated **demonstration data** and only show that the analysis code works. The simulated "reference" readings were generated from the same invented data, so they cannot say anything about the real device's accuracy.

## 6. Items requiring the student's information or Ms. Ireland's approval

- [ ] **Ms. Ireland's approval of the revised scope** (pending).
- [ ] Whether a revised proposal form must be resubmitted, and in what format (PDF overlay or Word version).
- [ ] **Grade level** (left blank on the form, title slide and ethics package).
- [ ] Scientific supervisor's name, role, institution and contact details for the ethics package (yellow fields).
- [ ] Ethics committee / Technoscience approval (not obtained). Check the pre-questionnaire answers against the real platform.
- [ ] Signatures and consent: participant, parent/guardian and student. **None have been filled in.**
- [ ] Whether up to four adult volunteers may take part, or the study should be limited to the student.
- [ ] Whether the optional breath-hold test and overnight recordings should be kept in the protocol.
- [ ] Model and Health Canada licence number of the reference pulse oximeter.
- [ ] Whether parts have been bought or built. The slides currently say "Not built yet".
- [ ] Confirmation that building the device and checking the electronics, without wearing it, is acceptable before approval.
- [ ] Enabling GitHub Pages so the QR codes in the slides open the app and 3D model.
- [ ] Submission of the form and ethics package: **left for the student.**

## 7. Draft note to Ms. Ireland (not sent)

> Dear Ms. Ireland,
>
> Thank you for your questions about my project. In line with my earlier reply, I have revised the project to focus on how accurately a low-cost wearable measures blood oxygen and heart rate compared with a Health Canada-licensed pulse oximeter, and on whether software can flag oxygen desaturation events. I have removed all claims that the device detects sleep apnea or calculates an apnea–hypopnea index, since oxygen and heart rate alone cannot confirm apnea. Simulated data is now clearly labelled as demonstration data only.
>
> I have attached the revised proposal form and a summary of the changes. No testing will take place until you have approved the revised scope and the ethics approval and consent are in place. Could you please let me know whether the revised scope is acceptable, and whether I should resubmit the proposal form?
>
> Thank you for your guidance.
>
> Gabriel Mamane

## References

- Bland, J. M., & Altman, D. G. (1986). Statistical methods for assessing agreement between two methods of clinical measurement. *The Lancet, 327*(8476), 307–310.
- Berry, R. B., et al. (2012). Rules for scoring respiratory events in sleep. *Journal of Clinical Sleep Medicine, 8*(5), 597–619.
- International Organization for Standardization. (2017). *ISO 80601-2-61:2017 Medical electrical equipment — Part 2-61: Particular requirements for basic safety and essential performance of pulse oximeter equipment.*
- Kapur, V. K., et al. (2017). Clinical practice guideline for diagnostic testing for adult obstructive sleep apnea. *Journal of Clinical Sleep Medicine, 13*(3), 479–504.
- Sjoding, M. W., Dickson, R. P., Iwashyna, T. J., Gay, S. E., & Valley, T. S. (2020). Racial bias in pulse oximetry measurement. *New England Journal of Medicine, 383*(25), 2477–2478.
