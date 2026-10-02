// Night Signal — final science-fair presentation (school format, 7–10 min).
// Rebuild after recording real nights:  node build_deck.js ../Night_Signal_Presentation.pptx
// Images are read from ./assets (regenerate the charts with the analysis scripts first).
const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

const A = (f) => path.join(__dirname, "assets", f);
function dims(file) {                       // read width/height from PNG or JPEG headers
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  let i = 2; while (i < b.length) { const m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xc3) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }; i += 2 + len; }
  throw new Error("unknown image " + file);
}
const ratio = (f) => { const d = dims(A(f)); return d.h / d.w; };

const LINKS = {
  app: "https://claude.ai/artifact/KCkbwVKfmBhQoC9cxCn7qZ",
  d3: "https://claude.ai/artifact/7wqAASJ8qWxBBKBuVHAqLt",
  guide: "https://claude.ai/artifact/4xLvQVUaMqndpLeRDXtp4A",
  code: "https://github.com/gabrielamamanestudent-wq/teetomivV2/tree/claude/science-fair-medical-project-7k0wk4/science-fair/night-signal",
};

const p = new pptxgen();
p.defineLayout({ name: "W", width: 13.333, height: 7.5 }); p.layout = "W";
p.title = "Night Signal — science fair presentation";

const C = { NIGHT: "0E1830", NIGHT2: "18233F", TEAL: "1F8A9C", TEALL: "3FB8CC", PULSE: "E4568A", INK: "141A26",
  SOFT: "44515F", FAINT: "6B7889", WHITE: "FFFFFF", NSOFT: "A9B8D2", OK: "2F8F5B", GOLD: "C98A1E", CRIT: "CF4747",
  LIGHT: "F3F5F9", LINE: "DBE1EC" };
const F = "Calibri";
const NOTES = [];                           // [title, seconds, script] — also written to speaker_script.md

function slide(dark) { const s = p.addSlide(); s.background = { color: dark ? C.NIGHT : C.WHITE }; return s; }
function eyebrow(s, t, c) { s.addText(t, { isTextBox: true, x: 0.7, y: 0.42, w: 9, h: 0.3, margin: 0, fontFace: F, fontSize: 12, bold: true, color: c, charSpacing: 3 }); }
function title(s, t, c, sz) { s.addText(t, { isTextBox: true, x: 0.7, y: 0.78, w: 11.9, h: 0.9, margin: 0, fontFace: F, fontSize: sz || 32, bold: true, color: c, valign: "top" }); }
function tag(s, text, fill, color) { s.addShape(p.ShapeType.roundRect, { x: 10.55, y: 0.38, w: 2.1, h: 0.36, rectRadius: 0.18, fill: { color: fill }, line: { color, width: 1 } });
  s.addText(text, { isTextBox: true, x: 10.55, y: 0.38, w: 2.1, h: 0.36, margin: 0, align: "center", valign: "middle", fontFace: F, fontSize: 9, bold: true, color }); }
const prelim = (s) => tag(s, "EXAMPLE DATA", "FBF2DF", C.GOLD);
const appendix = (s) => tag(s, "APPENDIX · NOT PRESENTED", "EEF1F7", C.FAINT);
function bullets(s, items, x, y, w, color, size, gap) { let yy = y; items.forEach((it) => {
  s.addShape(p.ShapeType.ellipse, { x, y: yy + 0.09, w: 0.13, h: 0.13, fill: { color: C.TEAL } });
  const lines = Math.ceil(it.length / Math.floor(w * 10.5 * 14 / (size || 15)));
  s.addText(it, { isTextBox: true, x: x + 0.3, y: yy - 0.02, w: w - 0.3, h: 0.36 * lines + 0.1, margin: 0, fontFace: F, fontSize: size || 15, color, valign: "top" });
  yy += 0.36 * lines * ((size || 15) / 15) + (gap || 0.22); }); return yy; }
function card(s, x, y, w, h, fill, line) { s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.1, fill: { color: fill }, line: { color: line || fill, width: 1 } }); }
function img(s, f, x, y, w, opts) { const h = w * ratio(f); s.addImage(Object.assign({ path: A(f), x, y, w, h }, opts || {})); return h; }
function caption(s, t, x, y, w, color) { s.addText(t, { isTextBox: true, x, y, w, h: 0.3, margin: 0, align: "center", fontFace: F, fontSize: 11, italic: true, color: color || C.FAINT }); }
function link(s, label, url, x, y, w, color, size) { s.addText([{ text: label, options: { hyperlink: { url, tooltip: url }, color: color || C.TEAL, underline: true } }],
  { isTextBox: true, x, y, w, h: 0.32, margin: 0, fontFace: F, fontSize: size || 13 }); }
function notes(s, t, secs, script) { NOTES.push([t, secs, script]); s.addNotes(`[${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}] ${script}`); }
function phone(s, f, x, y, w) { const h = w * ratio(f); card(s, x - 0.1, y - 0.1, w + 0.2, h + 0.2, C.NIGHT, C.NIGHT2); s.addImage({ path: A(f), x, y, w, h }); return h; }

/* ---------------- 1. TITLE ---------------- */
let s = slide(true);
eyebrow(s, "SCIENCE FAIR · HEALTH AND MEDICAL SCIENCES · EXPERIMENTAL PROJECT", C.TEALL);
s.addText("Night Signal", { isTextBox: true, x: 0.7, y: 1.6, w: 6.4, h: 1.2, margin: 0, fontFace: F, fontSize: 60, bold: true, color: C.WHITE });
s.addText("A low-cost wearable that detects sleep apnea — and screens the heart and breathing too.",
  { isTextBox: true, x: 0.7, y: 2.9, w: 5.9, h: 1.1, margin: 0, fontFace: F, fontSize: 19, color: C.NSOFT, valign: "top" });
s.addText([{ text: "Gabriel Mamane", options: { bold: true, color: C.WHITE } }, { text: "   ·   Grade ___", options: { color: C.NSOFT } }],
  { isTextBox: true, x: 0.7, y: 4.6, w: 6, h: 0.4, margin: 0, fontFace: F, fontSize: 16 });
img(s, "3d_assembled.jpg", 6.75, 1.25, 6.1);
s.addText("Educational prototype — not a medical device.", { isTextBox: true, x: 0.7, y: 6.95, w: 8, h: 0.3, margin: 0, fontFace: F, fontSize: 11, color: C.FAINT });
notes(s, "Title", 15, "Hi, I’m Gabriel. My project is Night Signal: a wearable I designed that watches your blood oxygen while you sleep to catch sleep apnea — and it turns out the same sensor can screen the heart and breathing too.");

/* ---------------- 2. PURPOSE & HYPOTHESIS ---------------- */
s = slide(false); eyebrow(s, "PURPOSE & HYPOTHESIS", C.TEAL); title(s, "Can a ~$65 wearable catch sleep apnea?", C.INK);
card(s, 0.7, 1.8, 11.9, 1.25, C.LIGHT, C.LINE);
s.addText([{ text: "Purpose  ", options: { bold: true, color: C.TEAL } }, { text: "Find out whether a low-cost wearable can detect the oxygen drops caused by sleep apnea accurately enough to estimate how many events happen per hour — the number doctors use (AHI).", options: { color: C.INK } }],
  { isTextBox: true, x: 1.0, y: 1.95, w: 11.3, h: 1.0, margin: 0, fontFace: F, fontSize: 16, valign: "top" });
s.addText([{ text: "Hypothesis  ", options: { bold: true, color: C.PULSE } }, { text: "If breathing pauses make blood oxygen dip, then a fingertip sensor read once per second will reveal those dips, and software can count them to sort a night into Normal, Mild, Moderate or Severe — because oxygen-rich and oxygen-poor blood absorb red and infrared light differently.", options: { color: C.SOFT } }],
  { isTextBox: true, x: 0.7, y: 3.3, w: 11.9, h: 1.2, margin: 0, fontFace: F, fontSize: 16, valign: "top" });
[["Independent variables", "Breath-hold length (10 / 15 / 20 s) and sleeping position", C.PULSE],
 ["Dependent variables", "Events detected, AHI score, agreement with a reference oximeter", C.TEAL],
 ["Controls", "Same finger, cuff tightness, room, firmware and detection settings", C.FAINT]].forEach((v, i) => {
  const x = 0.7 + i * 4.03; card(s, x, 4.85, 3.83, 1.55, C.WHITE, C.LINE);
  s.addText(v[0].toUpperCase(), { isTextBox: true, x: x + 0.22, y: 5.0, w: 3.4, h: 0.3, margin: 0, fontFace: F, fontSize: 11, bold: true, color: v[2], charSpacing: 2 });
  s.addText(v[1], { isTextBox: true, x: x + 0.22, y: 5.35, w: 3.45, h: 0.95, margin: 0, fontFace: F, fontSize: 14, color: C.INK, valign: "top" }); });
notes(s, "Purpose & hypothesis", 40, "My question: can a wearable that costs about sixty-five dollars catch sleep apnea? My hypothesis: if each breathing pause makes oxygen dip, a fingertip sensor reading once per second will see the dips, and software can count them per hour — the AHI doctors use. What I change is breath-hold length and sleeping position; what I measure is events, the AHI, and how closely my device agrees with a real oximeter.");

/* ---------------- 3. BACKGROUND ---------------- */
s = slide(false); eyebrow(s, "SCIENTIFIC BACKGROUND", C.TEAL); title(s, "Sleep apnea: breathing stops, oxygen drops", C.INK);
bullets(s, [
  "Obstructive sleep apnea: the airway collapses during sleep and breathing pauses for 10 seconds or more, many times a night.",
  "Each pause lowers blood oxygen (a desaturation) and makes the heart speed up and slow down.",
  "Pulse oximetry: red (660 nm) and infrared (880 nm) light shine through the fingertip; oxygen-rich blood absorbs them differently, giving SpO₂.",
  "Doctors count events per hour of sleep: the Apnea–Hypopnea Index (AHI). A clinical sleep study costs thousands and needs a lab.",
], 0.7, 1.85, 7.3, C.SOFT, 15, 0.18);
card(s, 8.4, 1.8, 4.2, 2.35, C.NIGHT);
s.addText("≈ 936 million", { isTextBox: true, x: 8.6, y: 2.0, w: 3.9, h: 0.75, margin: 0, fontFace: F, fontSize: 40, bold: true, color: C.TEALL });
s.addText("adults worldwide have obstructive sleep apnea — most don’t know it (Benjafield et al., 2019).", { isTextBox: true, x: 8.6, y: 2.8, w: 3.85, h: 1.2, margin: 0, fontFace: F, fontSize: 14, color: C.NSOFT, valign: "top" });
[["< 5", "Normal", C.OK], ["5–15", "Mild", C.GOLD], ["15–30", "Moderate", "D9741F"], ["> 30", "Severe", C.CRIT]].forEach((b, i) => {
  const x = 0.7 + i * 3.0; card(s, x, 5.55, 2.8, 1.15, C.LIGHT, C.LINE);
  s.addText(b[0], { isTextBox: true, x, y: 5.62, w: 2.8, h: 0.6, margin: 0, align: "center", fontFace: F, fontSize: 26, bold: true, color: b[2] });
  s.addText(b[1] + " · events/hour", { isTextBox: true, x, y: 6.2, w: 2.8, h: 0.35, margin: 0, align: "center", fontFace: F, fontSize: 12, color: C.SOFT }); });
notes(s, "Scientific background", 50, "Sleep apnea is when the airway collapses during sleep and breathing stops for ten seconds or more, over and over. About 936 million adults have it, and most don't know. Every pause drops blood oxygen. A pulse oximeter measures that by shining red and infrared light through the fingertip — oxygen-rich blood absorbs the two colours differently. Doctors count the events per hour — the AHI — and grade it from normal to severe. The problem: the standard test is an overnight lab study that costs thousands.");

/* ---------------- 4. DESIGN ---------------- */
s = slide(true); eyebrow(s, "DESIGN PROTOTYPE", C.TEALL); title(s, "The wearable", C.WHITE);
const dh = img(s, "3d_assembled.jpg", 0.7, 1.75, 5.85); caption(s, "3D design (v2) — sealed case on a velcro strap", 0.7, 1.75 + dh + 0.05, 5.85, C.NSOFT);
img(s, "3d_exploded.jpg", 6.75, 1.75, 5.85); caption(s, "Exploded — every v2 part at its real size", 6.75, 1.75 + dh + 0.05, 5.85, C.NSOFT);
[["Prototype v1", "armband + plug-in wires"], ["All night", "USB power"], ["14 × 14 mm", "finger sensor"], ["1 / second", "readings"]].forEach((k, i) => {
  const x = 0.7 + i * 2.55; s.addText(k[0], { isTextBox: true, x, y: 6.0, w: 2.45, h: 0.45, margin: 0, fontFace: F, fontSize: 20, bold: true, color: C.TEALL });
  s.addText(k[1], { isTextBox: true, x, y: 6.45, w: 2.45, h: 0.3, margin: 0, fontFace: F, fontSize: 12, color: C.NSOFT }); });
s.addImage({ path: A("qr_3d.png"), x: 11.55, y: 5.9, w: 1.05, h: 1.05, hyperlink: { url: LINKS.d3, tooltip: "Interactive 3D model" } });
link(s, "Interactive 3D →", LINKS.d3, 10.15, 6.25, 1.35, C.TEALL, 12);
notes(s, "Design", 40, "Here's the design. My working prototype, version 1, is built to be simple and reliable: the ESP32 sits in a running armband, each sensor plugs into its own pins with no soldered splices, and a USB cable powers it all night. A velcro finger clip holds the MAX30102 oxygen sensor. The 3D model shows version 2 — a 70 by 45 millimetre sealed case with its own battery on a velcro strap. On the right is the exploded view with every part at its real size; you can spin the interactive version with this QR code.");

/* ---------------- 5. HOW IT WORKS ---------------- */
s = slide(false); eyebrow(s, "DESIGN PROTOTYPE · HOW IT WORKS", C.TEAL); title(s, "From fingertip to sleep report", C.INK);
const flow = [["Finger sensor", "MAX30102 · red + infrared light"], ["ESP32 on the arm", "computes SpO₂ + pulse, reads position"], ["Bluetooth / USB", "one line of data every second"], ["App + analysis", "events, AHI, heart, breathing"]];
flow.forEach((f, i) => { const x = 0.7 + i * 3.1; card(s, x, 1.85, 2.75, 1.35, C.LIGHT, C.LINE);
  s.addText(f[0], { isTextBox: true, x: x + 0.15, y: 2.0, w: 2.45, h: 0.45, margin: 0, align: "center", fontFace: F, fontSize: 16, bold: true, color: C.INK });
  s.addText(f[1], { isTextBox: true, x: x + 0.15, y: 2.45, w: 2.45, h: 0.6, margin: 0, align: "center", fontFace: F, fontSize: 12, color: C.SOFT, valign: "top" });
  if (i < 3) s.addText("›", { isTextBox: true, x: x + 2.75, y: 1.85, w: 0.35, h: 1.35, margin: 0, align: "center", valign: "middle", fontFace: F, fontSize: 30, bold: true, color: C.PULSE }); });
s.addText("Built-in self-test — proves it’s working before every recording", { isTextBox: true, x: 0.7, y: 3.55, w: 7, h: 0.4, margin: 0, fontFace: F, fontSize: 16, bold: true, color: C.INK });
card(s, 0.7, 4.0, 7.0, 2.75, C.NIGHT);
s.addText([
  { text: "$ python check_device.py --port COM5", options: { color: C.NSOFT, breakLine: true } },
  { text: "[PASS] Data arriving        1 reading/s", options: { color: "7FD8A6", breakLine: true } },
  { text: "[PASS] Self-test            oxygen OK · motion OK", options: { color: "7FD8A6", breakLine: true } },
  { text: "[PASS] Finger on sensor     100%", options: { color: "7FD8A6", breakLine: true } },
  { text: "[PASS] Believable values    SpO2 97–98%, HR 60–64", options: { color: "7FD8A6", breakLine: true } },
  { text: "[PASS] Motion sensor        100% near 1 g", options: { color: "7FD8A6", breakLine: true } },
  { text: "RESULT: READY — sending real data", options: { color: C.WHITE, bold: true } }],
  { isTextBox: true, x: 0.95, y: 4.15, w: 6.6, h: 2.5, margin: 0, fontFace: "Courier New", fontSize: 13, valign: "top", paraSpaceAfter: 3 });
bullets(s, ["Firmware re-checks both sensors every 30 s and reports it.", "No finger → readings are marked invalid, never trusted.", "The app shows the same checks live, every second.", "A broken sensor is caught: “NOT READY”."], 8.1, 4.05, 4.5, C.SOFT, 14, 0.16);
notes(s, "How it works", 35, "The data path: the finger sensor's light readings go to the ESP32, which calculates oxygen and pulse and reads body position, then sends one line per second over Bluetooth or USB to my app and analysis code. To make sure it's really working, I built a self-test: every recording starts with a device check that has to say READY — and when I tested with a broken motion sensor, it correctly said NOT READY.");

/* ---------------- 6. PROTOCOL ---------------- */
s = slide(false); eyebrow(s, "EXPERIMENTAL PROTOCOL · KEY MANIPULATIONS", C.TEAL); title(s, "How I test it", C.INK);
[["Device check", "every session must pass check_device.py"],
 ["Accuracy test", "awake, side-by-side with a store-bought oximeter every 2 min for 30 min"],
 ["Detection test", "supervised, awake breath-holds of 10, 15 and 20 s — known events"],
 ["Full-night power test", "USB power → 8 h of data with no gaps"],
 ["Recorded nights", "≥ 5 nights; armband on forearm, clip on index finger"]].forEach((st, i) => {
  const y = 1.9 + i * 0.95; s.addShape(p.ShapeType.roundRect, { x: 0.7, y, w: 0.55, h: 0.55, rectRadius: 0.1, fill: { color: C.TEAL } });
  s.addText(String(i + 1), { isTextBox: true, x: 0.7, y, w: 0.55, h: 0.55, margin: 0, align: "center", valign: "middle", fontFace: F, fontSize: 18, bold: true, color: C.WHITE });
  s.addText([{ text: st[0] + "  ", options: { bold: true, color: C.INK } }, { text: st[1], options: { color: C.SOFT } }], { isTextBox: true, x: 1.45, y: y + 0.07, w: 6.9, h: 0.5, margin: 0, fontFace: F, fontSize: 15 }); });
card(s, 8.7, 1.85, 3.9, 4.6, C.LIGHT, C.LINE);
s.addText("SAFETY", { isTextBox: true, x: 8.95, y: 2.05, w: 3.4, h: 0.3, margin: 0, fontFace: F, fontSize: 12, bold: true, color: C.CRIT, charSpacing: 2 });
bullets(s, ["Breath-holds only while awake and supervised — never asleep", "Stop at any dizziness", "Parent/guardian consent", "Ethics committee form (human subject) submitted"], 8.95, 2.5, 3.5, C.INK, 14, 0.18);
notes(s, "Protocol", 45, "My key manipulations: one, a device check before every session. Two, an accuracy test — I wear my device and a store-bought oximeter at the same time and compare. Three, a detection test: supervised, awake breath-holds of 10, 15 and 20 seconds — I know exactly when they happened, so I can score my software. Four, a full-night power test — eight hours with no gaps. Five, full recorded nights. Safety first: breath-holds only while awake and supervised, with consent and ethics approval.");

/* ---------------- 7. THE APP ---------------- */
s = slide(false); eyebrow(s, "DESIGN PROTOTYPE · THE APP", C.TEAL); title(s, "The companion app measures real data", C.INK);
const ph = phone(s, "phone_sleep.png", 0.85, 1.75, 2.55); phone(s, "phone_live.png", 3.75, 1.75, 2.55);
caption(s, "Sleep report", 0.85, 1.75 + ph + 0.15, 2.55); caption(s, "Live + device health", 3.75, 1.75 + ph + 0.15, 2.55);
bullets(s, ["Live tab connects straight to the wearable (USB or Bluetooth) and shows oxygen, heart rate and position every second.",
  "Device health checks run continuously — data flowing, self-test, finger on, battery.",
  "Save a session → the same CSV the analysis uses, so every number is traceable.",
  "Heart, Asthma and Progress tabs for the spin-offs and my build log."], 6.85, 1.9, 5.75, C.SOFT, 15, 0.2);
s.addImage({ path: A("qr_app.png"), x: 6.95, y: 5.55, w: 1.15, h: 1.15, hyperlink: { url: LINKS.app, tooltip: "Open the app" } });
link(s, "Open the app →", LINKS.app, 8.3, 5.85, 3, C.TEAL, 15);
s.addText("Scan to try it (demo device built in).", { isTextBox: true, x: 8.3, y: 6.2, w: 4, h: 0.3, margin: 0, fontFace: F, fontSize: 12, color: C.FAINT });
notes(s, "The app", 35, "This is my companion app. On the Live tab it connects directly to the wearable and shows oxygen, heart rate and position every second, with health checks running the whole time. Saving a session gives the exact CSV my analysis uses, so every number is traceable. Scan the code to try it — there's a demo device built in.");

/* ---------------- 8. RESULTS TABLE ---------------- */
s = slide(false); eyebrow(s, "RESULTS · SUMMARY", C.TEAL); title(s, "What one night showed", C.INK); prelim(s);
const H = (t) => ({ text: t, options: { bold: true, color: C.WHITE, fill: { color: C.TEAL } } });
s.addTable([[H("Measure"), H("Result"), H("Meaning")],
  ["Recording", "7.0 h · 25,200 readings", "a full night captured"],
  ["Apnea events", "19  →  AHI 2.7 / hour", "Normal range (< 5)"],
  ["Blood oxygen (avg / lowest)", "97.5 % / 84 %", "lowest point during an event"],
  ["Accuracy vs reference", "± 0.56 %  (r = 0.88)", "210 paired readings"],
  ["Events caught: rule / ML", "63 % / 63 %", "precision 1.00 / 0.92"],
  ["Sleep position", "back 3.8 / h  vs  sides 1.1–1.3 / h", "≈ 3 × more events on the back"],
  ["Spin-offs", "3 heart episodes · breathing 13 → 22 / min", "patterns flagged correctly"]],
  { x: 0.7, y: 1.85, w: 11.9, colW: [3.4, 4.3, 4.2], fontFace: F, fontSize: 14, color: C.INK, border: { type: "solid", color: C.LINE, pt: 1 }, valign: "middle", rowH: 0.52 });
s.addText("Example data from my simulator — replaced with my own recorded nights before the final submission.", { isTextBox: true, x: 0.7, y: 6.6, w: 11.9, h: 0.3, margin: 0, fontFace: F, fontSize: 12, italic: true, color: C.FAINT });
notes(s, "Results summary", 40, "Here's the summary. Over a seven-hour night, the software found 19 events — an AHI of 2.7, which is in the normal range. Oxygen averaged 97.5% and dropped to 84% at the lowest. Against a reference oximeter, my device was within about half a percent. The detector caught 63% of known events with zero false alarms. And events were about three times more frequent on the back than on the sides.");

/* ---------------- 9. RESULTS: NIGHT + ACCURACY ---------------- */
s = slide(false); eyebrow(s, "RESULTS · DETECTION AND ACCURACY", C.TEAL); title(s, "Every dip found, and the readings agree", C.INK); prelim(s);
const oh = img(s, "oxygen.png", 0.7, 1.85, 6.95); caption(s, "One night: each red band is an apnea event found automatically", 0.7, 1.85 + oh + 0.08, 6.95);
img(s, "validation.png", 7.9, 1.85, 4.7); caption(s, "Bland–Altman: 95% of readings within −1.5 to +1.7 %", 7.9, 1.85 + 4.7 * ratio("validation.png") + 0.08, 4.7);
notes(s, "Results: detection + accuracy", 35, "On the left, a whole night of oxygen — every red band is an event my code found on its own. On the right is a Bland–Altman plot, the standard way medical papers compare two devices: the average difference is almost zero, and 95% of my readings fall within about one and a half percent of the reference.");

/* ---------------- 10. RESULTS: POSITION + ML ---------------- */
s = slide(false); eyebrow(s, "RESULTS · SLEEP POSITION AND MACHINE LEARNING", C.TEAL); title(s, "Back-sleeping and two detectors", C.INK); prelim(s);
const poh = img(s, "position.png", 0.7, 1.85, 5.8); caption(s, "Apnea events per hour by position", 0.7, 1.85 + poh + 0.05, 5.8);
s.addChart(p.charts.BAR, [{ name: "Precision", labels: ["Rule-based", "Machine learning"], values: [1.0, 0.92] },
  { name: "Recall (events caught)", labels: ["Rule-based", "Machine learning"], values: [0.63, 0.63] }],
  { x: 6.9, y: 1.85, w: 5.7, h: 3.65, barDir: "col", barGrouping: "clustered", chartColors: [C.TEAL, C.PULSE], showValue: true,
    dataLabelPosition: "outEnd", dataLabelFormatCode: "0.00", dataLabelFontSize: 12, valAxisMaxVal: 1.2, valAxisMinVal: 0, valAxisLabelFormatCode: "0.0",
    showLegend: true, legendPos: "b", legendFontSize: 12, catAxisLabelFontSize: 13, catAxisLabelColor: C.SOFT, valAxisLabelColor: C.FAINT,
    valGridLine: { color: "E6EAF1", size: 0.5 }, catGridLine: { style: "none" }, showTitle: true, title: "Detector scores on unseen data", titleFontSize: 14, titleColor: C.INK });
notes(s, "Results: position + ML", 30, "Two more results. Events happened most on the back — 3.8 per hour versus about 1 on the sides. And I compared my simple rule with a machine-learning model: on new data, both caught the same share of events, but the rule had no false alarms, so for now the simpler method wins.");

/* ---------------- 11. ANALYSIS: INTERPRETATION ---------------- */
s = slide(true); eyebrow(s, "MAIN ANALYSIS · INTERPRETATION", C.TEALL); title(s, "What the results mean", C.WHITE);
[["Accurate enough to trust", "Agreement within about ±1.6 % is in line with commercial fingertip oximeters (about ±2–3 %), so the drops it sees are real, not sensor noise."],
 ["Cautious, not over-eager", "Perfect precision but 63 % recall means it misses shallow events — so my AHI is probably an under-estimate, the safe direction for a screening tool."],
 ["Position matters", "Three times more events on the back matches “positional” sleep apnea in the literature — a simple, free change (side-sleeping) could help."],
 ["More data beats fancier code", "Machine learning only tied the rule because it trained on one night; it needs many labeled nights to learn more than a rule."]].forEach((k, i) => {
  const x = 0.7 + (i % 2) * 6.05, y = 1.85 + Math.floor(i / 2) * 2.45; card(s, x, y, 5.85, 2.2, C.NIGHT2, "2C3D60");
  s.addText(k[0], { isTextBox: true, x: x + 0.3, y: y + 0.22, w: 5.3, h: 0.45, margin: 0, fontFace: F, fontSize: 18, bold: true, color: C.TEALL });
  s.addText(k[1], { isTextBox: true, x: x + 0.3, y: y + 0.75, w: 5.3, h: 1.35, margin: 0, fontFace: F, fontSize: 14, color: C.NSOFT, valign: "top" }); });
notes(s, "Analysis: interpretation", 45, "What does it mean? First, accuracy within about one and a half percent is in the same range as store-bought oximeters, so the dips are real. Second, the detector is cautious — no false alarms but it misses shallow events, so my AHI is probably an underestimate, which is the safer mistake for a screening tool. Third, the back-sleeping result matches what doctors call positional sleep apnea. And fourth, machine learning didn't win yet because it only had one night to learn from — more data matters more than fancier code.");

/* ---------------- 12. ANALYSIS: SOURCES OF ERROR ---------------- */
s = slide(true); eyebrow(s, "MAIN ANALYSIS · SOURCES OF ERROR", C.TEALL); title(s, "What could make it wrong", C.WHITE);
s.addText("Measurement", { isTextBox: true, x: 0.7, y: 1.8, w: 5.6, h: 0.4, margin: 0, fontFace: F, fontSize: 17, bold: true, color: C.PULSE });
bullets(s, ["Finger movement, pressure and cold hands distort the light signal", "4-second averaging window smooths very short dips", "The reference oximeter itself is only ±2 %", "Arm angle approximates body position"], 0.7, 2.3, 5.7, C.NSOFT, 14, 0.15);
s.addText("Method", { isTextBox: true, x: 6.75, y: 1.8, w: 5.6, h: 0.4, margin: 0, fontFace: F, fontSize: 17, bold: true, color: C.PULSE });
bullets(s, ["Awake breath-holds aren’t the same as real obstructive apnea", "Oxygen only — no airflow or brain-wave sensors like a lab study", "One person, few nights: can’t generalize yet", "Results so far use simulated example data"], 6.75, 2.3, 5.85, C.NSOFT, 14, 0.15);
card(s, 0.7, 5.3, 11.9, 1.35, C.NIGHT2, C.GOLD);
s.addText([{ text: "Engineering finding:  ", options: { bold: true, color: C.GOLD } }, { text: "Bluetooth draws about 100 mA, so a 500 mAh battery would last only 4–5 hours — not a full night. So prototype v1 runs on USB power, and the sealed v2 case needs a bigger battery or Bluetooth Low Energy.", options: { color: C.WHITE } }],
  { isTextBox: true, x: 1.0, y: 5.45, w: 11.3, h: 1.1, margin: 0, fontFace: F, fontSize: 15, valign: "top" });
notes(s, "Analysis: sources of error", 35, "Sources of error: movement, finger pressure and cold hands can distort the light signal; the four-second averaging can blur very short dips; even the reference oximeter is only plus or minus two percent. On the method side, awake breath-holds aren't identical to real apnea, I only measure oxygen — not airflow or brain waves like a sleep lab — and one person isn't enough to generalize. I also caught an engineering problem: Bluetooth draws about 100 milliamps, so a small 500 milliamp-hour battery would last only four to five hours. That's why version 1 runs on USB power all night, and version 2 needs a bigger battery or Bluetooth Low Energy.");

/* ---------------- 13. SPIN-OFFS ---------------- */
s = slide(false); eyebrow(s, "FURTHER CONSIDERATIONS · SPIN-OFFS", C.TEAL); title(s, "Same sensor, two more uses", C.INK); prelim(s);
const hh = img(s, "heart.png", 0.7, 1.8, 5.85); img(s, "asthma.png", 6.75, 1.8, 5.85);
s.addText([{ text: "Heart  ", options: { bold: true, color: C.PULSE } }, { text: "flags racing (>100 bpm), very slow (<40 bpm) and irregular-rhythm episodes, plus resting heart rate and HRV.", options: { color: C.SOFT } }],
  { isTextBox: true, x: 0.7, y: 1.95 + hh, w: 5.85, h: 1.0, margin: 0, fontFace: F, fontSize: 14, valign: "top" });
s.addText([{ text: "Asthma  ", options: { bold: true, color: C.TEAL } }, { text: "tracks breathing rate from the heart’s rhythm and coughs from the motion sensor — catching early-morning worsening (13 → 22 breaths/min).", options: { color: C.SOFT } }],
  { isTextBox: true, x: 6.75, y: 1.95 + hh, w: 5.85, h: 1.0, margin: 0, fontFace: F, fontSize: 14, valign: "top" });
s.addText("Screening ideas only — confirming an arrhythmia or asthma needs a doctor.", { isTextBox: true, x: 0.7, y: 6.75, w: 11.9, h: 0.3, margin: 0, fontFace: F, fontSize: 12, italic: true, color: C.FAINT });
notes(s, "Spin-offs", 40, "The same hardware opened two spin-offs. Heart: it flags racing, very slow and irregular-rhythm episodes. Asthma: night-time asthma often gets worse around 4 a.m., and my code tracks breathing rate from the heart's rhythm plus coughs from sudden jolts of the motion sensor — here it caught breathing climbing from 13 to 22 breaths a minute. These are screening ideas, not diagnoses.");

/* ---------------- 14. CONCLUSION ---------------- */
s = slide(true); eyebrow(s, "CONCLUSION", C.TEALL); title(s, "Back to the hypothesis", C.WHITE);
card(s, 0.7, 1.75, 11.9, 1.5, C.NIGHT2, C.TEAL);
s.addText([{ text: "Supported (so far). ", options: { bold: true, color: C.TEALL } }, { text: "A low-cost wearable measured blood oxygen within about half a percent of a reference, found apnea events on its own, scored the night’s severity, and showed back-sleeping triples events.", options: { color: C.WHITE } }],
  { isTextBox: true, x: 1.0, y: 1.92, w: 11.3, h: 1.2, margin: 0, fontFace: F, fontSize: 17, valign: "top" });
s.addText("Improvements", { isTextBox: true, x: 0.7, y: 3.55, w: 6, h: 0.4, margin: 0, fontFace: F, fontSize: 17, bold: true, color: C.PULSE });
bullets(s, ["Record more people and many more nights", "Add a nasal airflow sensor to separate apnea from hypopnea", "Bigger battery or Bluetooth Low Energy for full nights", "Shrink it into a finger-ring and compare with a real sleep lab"], 0.7, 4.05, 7.4, C.NSOFT, 15, 0.16);
s.addImage({ path: A("qr_app.png"), x: 8.75, y: 3.7, w: 1.6, h: 1.6, hyperlink: { url: LINKS.app, tooltip: "App" } });
s.addImage({ path: A("qr_3d.png"), x: 10.85, y: 3.7, w: 1.6, h: 1.6, hyperlink: { url: LINKS.d3, tooltip: "3D model" } });
s.addText("App", { isTextBox: true, x: 8.75, y: 5.38, w: 1.6, h: 0.3, margin: 0, align: "center", fontFace: F, fontSize: 13, color: C.NSOFT });
s.addText("3D model", { isTextBox: true, x: 10.85, y: 5.38, w: 1.6, h: 0.3, margin: 0, align: "center", fontFace: F, fontSize: 13, color: C.NSOFT });
s.addText("Thank you — questions?", { isTextBox: true, x: 0.7, y: 6.55, w: 11.9, h: 0.5, margin: 0, fontFace: F, fontSize: 22, bold: true, color: C.WHITE });
notes(s, "Conclusion", 35, "Back to my hypothesis: so far it's supported — a low-cost wearable measured oxygen within about half a percent of a reference, found apnea events by itself, scored the night, and showed back-sleeping triples events. Next I'd test more people and nights, add an airflow sensor, fix the battery life, and shrink it into a ring to compare against a real sleep lab. Thank you — I'm happy to take questions.");

/* ================= APPENDIX (in slides, not presented) ================= */
s = slide(false); appendix(s); eyebrow(s, "APPENDIX A · MATERIALS", C.TEAL); title(s, "Parts, exact sizes and where to buy", C.INK, 28);
const L = (t, u) => ({ text: t, options: { hyperlink: { url: u, tooltip: u }, color: C.TEAL } });
const parts = [
  ["AITRIP ESP32 ESP-WROOM-32 (30-pin, CP2102, USB-C)", "≈ 52 × 28 mm · pins pre-soldered", "Processor + Bluetooth Classic", L("Amazon.ca", "https://www.amazon.ca/AITRIP-ESP-WROOM-32-Development-Microcontroller-Compatible/dp/B0DF2YJSHN")],
  ["HiLetgo MAX30102 sensor", "14 × 14 mm · 4 pins to solder", "SpO₂ + heart rate (finger clip)", L("Amazon.ca", "https://www.amazon.ca/HiLetgo-MAX30102-Breakout-Oximetry-Solution/dp/B07QC67KMQ")],
  ["SHILLEHTEK GY-521 MPU-6050, pre-soldered (2-pack)", "≈ 21 × 16 mm", "Sleep position + cough jolts", L("Amazon.ca", "https://www.amazon.ca/Pre-Soldered-Accelerometer-Raspberry-Compatible-Arduino/dp/B0BMY15TC4")],
  ["ELEGOO 120 Dupont jumper wires (F-F, M-F, M-M)", "20 cm each", "Plug-in wiring, no soldering", L("Amazon.ca", "https://www.amazon.ca/Elegoo-120pcs-Multicolored-Breadboard-arduino/dp/B01EV70C78")],
  ["Running armband phone pouch", "fits phones up to 6.9 in", "Holds the ESP32 on the forearm", L("Amazon.ca", "https://www.amazon.ca/Running-Armband-Samsung-Resistant-Emergency/dp/B08HZ3BPK4")],
  ["Anker Powerline+ USB-A to USB-C cable", "3 m (10 ft)", "All-night power from a phone charger", L("Amazon.ca", "https://www.amazon.ca/Anker-Powerline-Double-Braided-Charging-Samsung/dp/B07G148YMS")],
  ["Anker USB-C to USB-A adapter (2-pack)", "USB-C → USB-A", "Plug the cable into a MacBook", L("Amazon.ca", "https://www.amazon.ca/Adapter-Anker-High-Speed-Transfer-Notebook/dp/B08HZ6PS61")],
  ["VELCRO Brand 1 in × 30 ft roll", "25 mm wide · cut ≈ 80 mm", "Finger loop", L("Amazon.ca", "https://www.amazon.ca/VELCRO-Brand-VEL-30768-AMS-Self-Gripping-Organization/dp/B09QH2NVM1")],
  ["Elite Medica fingertip pulse oximeter", "Health Canada authorized", "Reference for the accuracy test", L("Amazon.ca", "https://www.amazon.ca/Elite-Medica-Fingertip-Saturation-Batteries/dp/B0DSGP91PB")]];
s.addTable([[H("Part"), H("Size"), H("Purpose"), H("Buy")]].concat(parts.map((r) => [r[0], r[1], r[2], { text: [r[3]] }])),
  { x: 0.7, y: 1.6, w: 11.9, colW: [4.2, 3.5, 2.8, 1.4], fontFace: F, fontSize: 11, color: C.INK, border: { type: "solid", color: C.LINE, pt: 1 }, valign: "middle", rowH: 0.42 });
s.addText("Every part is on Amazon.ca (click Buy). Prices change and several items are multi-packs. Only the MAX30102's 4 header pins need soldering (about 5 minutes); everything else plugs in.", { isTextBox: true, x: 0.7, y: 6.35, w: 11.9, h: 0.5, margin: 0, fontFace: F, fontSize: 11.5, italic: true, color: C.FAINT });
notes(s, "Appendix A — materials", 0, "Appendix — not presented. Full parts list with exact dimensions, links and prices.");

s = slide(false); appendix(s); eyebrow(s, "APPENDIX B · FULL PROTOCOL", C.TEAL); title(s, "Full experimental protocol", C.INK, 28);
const proto = [
  "Build: plug the MAX30102 into 3V3 / GND / GPIO 21 / 22 and the GY-521 into VIN / GND / SDA→GPIO 33 / SCL→GPIO 32 (two separate I²C buses, no splices); ESP32 in the armband, USB power. Flash firmware v3.1.",
  "Device check: run check_device.py; record the result. Do not continue unless it says READY.",
  "Full-night power test: on USB power, stream with a finger on the sensor for 8 h; confirm there are no gaps in the data.",
  "Accuracy test: seated, awake, 30 min. Every 2 min write down the reference oximeter value with the time. Analyse with validate.py (Bland–Altman, r).",
  "Detection test: supervised, awake; 5 breath-holds each of 10, 15 and 20 s, 2 min apart; log start/end times as ground-truth labels. Score with train_model.py.",
  "Recorded nights: ≥ 5 nights; armband on the forearm, finger clip on the index finger; record.py logs all night; note bedtime and wake time.",
  "Analysis: analyze.py, signals.py, position.py, heart.py, asthma.py on each night; rebuild the app and slides with build_app.py and build_deck.js.",
  "Controls: same finger, cuff tightness, room temperature, firmware v3.1 and detection settings (3 % drop, 10 s, 120 s baseline)."];
proto.forEach((t, i) => { const y = 1.6 + i * 0.64;
  s.addText(String(i + 1), { isTextBox: true, x: 0.7, y, w: 0.4, h: 0.4, margin: 0, fontFace: F, fontSize: 14, bold: true, color: C.TEAL });
  s.addText(t, { isTextBox: true, x: 1.1, y, w: 11.5, h: 0.6, margin: 0, fontFace: F, fontSize: 12.5, color: C.INK, valign: "top" }); });
notes(s, "Appendix B — protocol", 0, "Appendix — not presented. Step-by-step protocol including controls.");

s = slide(false); appendix(s); eyebrow(s, "APPENDIX C · DESIGN PLANS", C.TEAL); title(s, "Wiring (v1) and case layout (v2)", C.INK, 28);
s.addTable([[H("From"), H("To (ESP32)"), H("Notes")],
  ["MAX30102 VIN / GND", "3V3 / GND", "never 5 V"], ["MAX30102 SDA / SCL", "GPIO 21 / 22", "I²C bus 0"],
  ["GY-521 (MPU-6050) VCC / GND", "VIN / GND", "5 V from USB"], ["GY-521 SDA / SCL", "GPIO 33 / 32", "I²C bus 1, 100 kHz"],
  ["Power", "USB-C port", "3 m cable to charger"], ["Status LED", "GPIO 2", "blinks each reading"]],
  { x: 0.7, y: 1.6, w: 6.7, colW: [3.0, 1.9, 1.8], fontFace: F, fontSize: 11.5, color: C.INK, border: { type: "solid", color: C.LINE, pt: 1 }, valign: "middle", rowH: 0.42 });
img(s, "wiring_v1.png", 2.1, 4.75, 3.9);
const eh = img(s, "3d_exploded.jpg", 7.7, 1.6, 4.9); caption(s, "v2: stack inside the 25 mm-tall case", 7.7, 1.6 + eh + 0.05, 4.9);
s.addText("Planned v2: a 70 × 45 × 29 mm box with its own battery. Layer heights: battery 6 mm + ESP32 with pins ≈ 13 mm + GY-521 ≈ 3 mm ≈ 22 mm, inside the box’s 25 mm. v1 uses each sensor’s own pins, so nothing needs splicing.",
  { isTextBox: true, x: 7.7, y: 1.6 + eh + 0.45, w: 4.9, h: 1.2, margin: 0, fontFace: F, fontSize: 12, color: C.SOFT, valign: "top" });
notes(s, "Appendix C — design plans", 0, "Appendix — not presented. Prototype v1 wiring table, and the planned v2 case layout with layer heights.");

s = slide(false); appendix(s); eyebrow(s, "APPENDIX D · DATA AND ADDITIONAL PICTURES", C.TEAL); title(s, "More data and pictures", C.INK, 28);
const p1 = phone(s, "phone_heart.png", 0.85, 1.65, 2.3); caption(s, "App · heart tab", 0.85, 1.65 + p1 + 0.12, 2.3);
s.addTable([[H("Analysis"), H("Result (example data)")],
  ["Breathing rate (signals.py)", "13.5 breaths/min"], ["HRV (SDNN / RMSSD)", "69 / 50 ms"], ["Lowest heart rate", "46 bpm"],
  ["Heart spin-off", "racing 3.3 min (106–118 bpm) · slow 2.5 min (34–39) · irregular 5.9 min"],
  ["Asthma spin-off", "normal 13.4 → early morning 21.6 /min · 85 min fast · 24 cough-like jolts"],
  ["ML model relies on", "heart-rate swing and jitter, then oxygen swing"],
  ["Device check (simulated device)", "healthy → READY · broken motion sensor → NOT READY"]],
  { x: 3.6, y: 1.65, w: 9.0, colW: [3.1, 5.9], fontFace: F, fontSize: 12, color: C.INK, border: { type: "solid", color: C.LINE, pt: 1 }, valign: "middle", rowH: 0.48 });
link(s, "All code, data tools and raw CSV format on GitHub →", LINKS.code, 3.6, 5.8, 7, C.TEAL, 13);
link(s, "Arduino setup guide →", LINKS.guide, 3.6, 6.2, 7, C.TEAL, 13);
notes(s, "Appendix D — data", 0, "Appendix — not presented. Remaining numbers, app screenshot and links to all data and code.");

s = slide(false); appendix(s); eyebrow(s, "BIBLIOGRAPHY · APA", C.TEAL); title(s, "References", C.INK, 28);
["American Academy of Sleep Medicine. (2014). International classification of sleep disorders (3rd ed.).",
 "Benjafield, A. V., et al. (2019). Estimation of the global prevalence and burden of obstructive sleep apnoea: A literature-based analysis. The Lancet Respiratory Medicine, 7(8), 687–698.",
 "Berry, R. B., et al. (2012). Rules for scoring respiratory events in sleep. Journal of Clinical Sleep Medicine, 8(5), 597–619.",
 "Bland, J. M., & Altman, D. G. (1986). Statistical methods for assessing agreement between two methods of clinical measurement. The Lancet, 327(8476), 307–310.",
 "Global Initiative for Asthma. (2024). Global strategy for asthma management and prevention.",
 "Jubran, A. (2015). Pulse oximetry. Critical Care, 19, 272.",
 "Maxim Integrated. (2020). MAX30102 high-sensitivity pulse oximeter and heart-rate sensor [Datasheet].",
 "Task Force of the European Society of Cardiology and NASPE. (1996). Heart rate variability: Standards of measurement, physiological interpretation, and clinical use. Circulation, 93(5), 1043–1065."]
  .forEach((r, i) => s.addText(r, { isTextBox: true, x: 0.7, y: 1.6 + i * 0.64, w: 11.9, h: 0.6, margin: 0, fontFace: F, fontSize: 13, color: C.SOFT, valign: "top", indentLevel: 0 }));
notes(s, "Bibliography", 0, "Appendix — not presented. References in APA style.");

/* ---------------- write deck + speaker script ---------------- */
const out = process.argv[2] || path.join(__dirname, "..", "Night_Signal_Presentation.pptx");
p.writeFile({ fileName: out }).then((f) => {
  const oral = NOTES.filter((n) => n[1] > 0), total = oral.reduce((a, n) => a + n[1], 0);
  let md = `# Night Signal — speaker script\n\nTarget: ${Math.floor(total / 60)} min ${total % 60} s spoken (limit 7–10 min) + 3 min questions.\n\n| # | Slide | Time | Running |\n|---|---|---|---|\n`;
  let run = 0; oral.forEach((n, i) => { run += n[1]; md += `| ${i + 1} | ${n[0]} | ${n[1]} s | ${Math.floor(run / 60)}:${String(run % 60).padStart(2, "0")} |\n`; });
  md += "\n";
  oral.forEach((n, i) => { md += `## ${i + 1}. ${n[0]}  (${n[1]} s)\n\n${n[2]}\n\n`; });
  md += "## Appendix slides (A–D) and bibliography are in the deck but not presented.\n";
  fs.writeFileSync(path.join(__dirname, "speaker_script.md"), md);
  console.log("wrote", f, `| ${oral.length} presented slides, ${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")} spoken`);
});
