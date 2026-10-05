// Night Signal — final science-fair presentation (school format, 7–10 min), Apple-keynote style.
// Rebuild after recording real nights:  node build_deck.js ../Night_Signal_Presentation.pptx
// Images are read from ./assets (regenerate the charts with the analysis scripts first;
// the black product shots come from the 3D model's presentation mode).
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
  code: "https://github.com/gabrielamamanestudent-wq/teetomivV2/tree/claude/science-fair-medical-project-7k0wk4/science-fair/night-signal",
  build: "https://github.com/gabrielamamanestudent-wq/teetomivV2/blob/claude/science-fair-medical-project-7k0wk4/science-fair/night-signal/BUILD_GUIDE.md",
};

const p = new pptxgen();
p.defineLayout({ name: "W", width: 13.333, height: 7.5 }); p.layout = "W";
p.title = "Night Signal — science fair presentation";

// Apple-style palette: black and white slides, one accent per idea.
const C = { BLACK: "000000", INK: "1D1D1F", GRAY: "6E6E73", GRAYD: "86868B", GRAYL: "A1A1A6", WHITE: "FFFFFF", OFF: "F5F5F7",
  CARD: "F5F5F7", CARDD: "1C1C1E", CARDD2: "2C2C2E", LINE: "D2D2D7", LINED: "38383A",
  BLUE: "0071E3", BLUED: "2997FF", PINK: "E3254B", PINKD: "FF375F", GREEN: "248A3D", GREEND: "30D158",
  ORANGE: "C45500", ORANGED: "FF9F0A", RED: "D70015", REDD: "FF453A", TEAL: "2BB3A6" };
const F = "Helvetica Neue";                 // on every Mac; PowerPoint on Windows substitutes Arial
const MONO = "Menlo";
const NOTES = [];                           // [title, seconds, script] — also written to speaker_script.md

function slide(dark, bg) { const s = p.addSlide(); s.background = { color: bg || (dark ? C.BLACK : C.WHITE) }; s._dark = dark; return s; }
const fg = (s) => (s._dark ? C.WHITE : C.INK), soft = (s) => (s._dark ? C.GRAYD : C.GRAY), accent = (s) => (s._dark ? C.PINKD : C.PINK);
function T(s, text, o) { s.addText(text, Object.assign({ isTextBox: true, margin: 0, fontFace: F, valign: "top" }, o)); }
function eyebrow(s, t, o) { T(s, t, Object.assign({ x: 0.75, y: 0.55, w: 11.8, h: 0.35, fontSize: 16, bold: true, color: accent(s) }, o || {})); }
function title(s, t, o) { T(s, t, Object.assign({ x: 0.75, y: 0.92, w: 11.8, h: 0.95, fontSize: 40, bold: true, color: fg(s), lineSpacingMultiple: 0.92 }, o || {})); }
function tag(s, text) { const x = 10.35, y = 0.55, w = 2.25, h = 0.36;
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.18, fill: { color: s._dark ? C.CARDD2 : C.CARD }, line: { type: "none" } });
  T(s, text, { x, y, w, h, align: "center", valign: "middle", fontSize: 10.5, bold: true, color: soft(s) }); }
const prelim = (s) => tag(s, "Example data");
const appendix = (s) => tag(s, "Appendix · not presented");
function bullets(s, items, x, y, w, size, gap, color) { let yy = y; const sz = size || 16, lineH = sz * 1.22 / 72;
  items.forEach((it) => {
    s.addShape(p.ShapeType.ellipse, { x, y: yy + lineH * 0.42, w: 0.08, h: 0.08, fill: { color: s._dark ? C.GRAYD : C.GRAYL }, line: { type: "none" } });
    const lines = Math.ceil(it.length / Math.floor((w - 0.25) * 72 / (sz * 0.52)));
    T(s, it, { x: x + 0.25, y: yy, w: w - 0.25, h: lines * lineH + 0.08, fontSize: sz, color: color || fg(s) });
    yy += lines * lineH + (gap || 0.2); }); return yy; }
function card(s, x, y, w, h, fill) { s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.22, fill: { color: fill || (s._dark ? C.CARDD : C.CARD) }, line: { type: "none" } }); }
function img(s, f, x, y, w, opts) { const h = w * ratio(f); s.addImage(Object.assign({ path: A(f), x, y, w, h }, opts || {})); return h; }
function imgH(s, f, x, y, h) { const w = h / ratio(f); s.addImage({ path: A(f), x, y, w, h }); return w; }
function caption(s, t, x, y, w, align) { T(s, t, { x, y, w, h: 0.3, align: align || "center", fontSize: 12, color: soft(s) }); }
function link(s, label, url, x, y, w, size, align) { s.addText([{ text: label + " ›", options: { hyperlink: { url, tooltip: url }, color: s._dark ? C.BLUED : C.BLUE } }],
  { isTextBox: true, x, y, w, h: 0.34, margin: 0, fontFace: F, fontSize: size || 14, align: align || "left" }); }
function qr(s, f, url, x, y, w) { card(s, x - 0.08, y - 0.08, w + 0.16, w + 0.16, C.WHITE); s.addImage({ path: A(f), x, y, w, h: w, hyperlink: { url, tooltip: url } }); }
function notes(s, t, secs, script) { NOTES.push([t, secs, script]); s.addNotes(`[${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}] ${script}`); }
function phone(s, f, x, y, w) { const h = w * ratio(f); s.addShape(p.ShapeType.roundRect, { x: x - 0.09, y: y - 0.09, w: w + 0.18, h: h + 0.18, rectRadius: 0.28, fill: { color: C.INK }, line: { type: "none" } });
  s.addImage({ path: A(f), x, y, w, h }); return h; }
// hairline tables: no grid, a thin rule under every row
function table(s, rows, o) {
  const line = { type: "solid", pt: 0.75, color: s._dark ? C.LINED : C.LINE }, none = { type: "none" };
  const head = rows[0].map((h) => ({ text: h, options: { bold: true, color: soft(s), fontSize: (o.fontSize || 14) - 2,
    border: [none, none, { type: "solid", pt: 1.25, color: s._dark ? C.GRAYD : C.INK }, none] } }));
  const body = rows.slice(1).map((r) => r.map((c, i) => (typeof c === "object" && c.text !== undefined ? c :
    { text: String(c), options: { bold: i === 0 && o.boldFirst !== false, color: i === 0 ? fg(s) : (o.softCols || []).includes(i) ? soft(s) : fg(s) } }))
    .map((c) => { c.options = Object.assign({ border: [none, none, line, none] }, c.options || {}); return c; }));
  s.addTable([head].concat(body), Object.assign({ fontFace: F, color: fg(s), valign: "middle", margin: [0.06, 0.1, 0.06, 0.02] }, o));
}

/* ---------------- 1. TITLE ---------------- */
let s = slide(true);
T(s, "Health and Medical Sciences · Experimental project", { x: 0.75, y: 0.5, w: 11.83, h: 0.32, align: "center", fontSize: 14, bold: true, color: C.GRAYD });
T(s, "Night Signal.", { x: 0.75, y: 0.88, w: 11.83, h: 1.1, align: "center", fontSize: 66, bold: true, color: C.WHITE });
T(s, "Sleep apnea screening you can wear.", { x: 0.75, y: 1.98, w: 11.83, h: 0.5, align: "center", fontSize: 24, color: C.GRAYD });
{ const h = 3.85, w = h / ratio("hero_black.jpg"); s.addImage({ path: A("hero_black.jpg"), x: (13.333 - w) / 2, y: 2.62, w, h }); }
T(s, [{ text: "Gabriel Mamane", options: { bold: true, color: C.WHITE } }, { text: "   ·   Grade ___", options: { color: C.GRAYD } }],
  { x: 0.75, y: 6.62, w: 11.83, h: 0.35, align: "center", fontSize: 15 });
T(s, "Educational prototype. Not a medical device.", { x: 0.75, y: 6.98, w: 11.83, h: 0.28, align: "center", fontSize: 10.5, color: C.GRAY });
notes(s, "Title", 15, "Hi, I’m Gabriel. My project is Night Signal: a wearable I designed that watches your blood oxygen while you sleep to catch sleep apnea — and it turns out the same sensor can screen the heart and breathing too.");

/* ---------------- 2. PURPOSE & HYPOTHESIS ---------------- */
s = slide(false); eyebrow(s, "Purpose and hypothesis"); title(s, "Can a low-cost wearable catch sleep apnea?");
card(s, 0.75, 2.15, 5.8, 2.55); card(s, 6.78, 2.15, 5.8, 2.55);
T(s, "Purpose", { x: 1.1, y: 2.42, w: 5.1, h: 0.35, fontSize: 15, bold: true, color: C.PINK });
T(s, "Find out whether a low-cost wearable can detect the oxygen drops caused by sleep apnea accurately enough to estimate how many events happen per hour: the number doctors use (AHI).",
  { x: 1.1, y: 2.85, w: 5.1, h: 1.7, fontSize: 17, color: C.INK, lineSpacingMultiple: 1.05 });
T(s, "Hypothesis", { x: 7.13, y: 2.42, w: 5.1, h: 0.35, fontSize: 15, bold: true, color: C.BLUE });
T(s, "If breathing pauses make blood oxygen dip, then a fingertip sensor read once per second will reveal the dips, and software can count them per hour, because oxygen-rich and oxygen-poor blood absorb red and infrared light differently.",
  { x: 7.13, y: 2.85, w: 5.1, h: 1.75, fontSize: 15.5, color: C.INK, lineSpacingMultiple: 1.05 });
[["Independent variables", "Breath-hold length (10, 15, 20 s) and sleeping position"],
 ["Dependent variables", "Events detected, AHI score, agreement with a reference oximeter"],
 ["Controls", "Same finger, cuff tightness, room, firmware and detection settings"]].forEach((v, i) => {
  const x = 0.75 + i * 4.03;
  T(s, v[0], { x, y: 5.15, w: 3.75, h: 0.35, fontSize: 16, bold: true, color: C.INK });
  T(s, v[1], { x, y: 5.55, w: 3.75, h: 0.9, fontSize: 14, color: C.GRAY, lineSpacingMultiple: 1.05 }); });
notes(s, "Purpose & hypothesis", 40, "My question: can a low-cost wearable catch sleep apnea? My hypothesis: if each breathing pause makes oxygen dip, a fingertip sensor reading once per second will see the dips, and software can count them per hour — the AHI doctors use. What I change is breath-hold length and sleeping position; what I measure is events, the AHI, and how closely my device agrees with a real oximeter.");

/* ---------------- 3. BACKGROUND ---------------- */
s = slide(false); eyebrow(s, "Scientific background"); title(s, "Breathing stops. Oxygen drops.");
bullets(s, [
  "Obstructive sleep apnea: the airway collapses during sleep and breathing pauses for 10 seconds or more, many times a night.",
  "Each pause lowers blood oxygen (a desaturation) and makes the heart speed up and slow down.",
  "Pulse oximetry: red (660 nm) and infrared (880 nm) light shine through the fingertip. Oxygen-rich blood absorbs them differently, giving SpO₂.",
  "Doctors count events per hour of sleep: the Apnea–Hypopnea Index (AHI). A clinical sleep study costs thousands and needs a lab.",
], 0.75, 2.15, 7.3, 15.5, 0.2);
card(s, 8.45, 2.1, 4.13, 2.75, C.BLACK);
T(s, "936 million", { x: 8.75, y: 2.4, w: 3.6, h: 0.75, fontSize: 40, bold: true, color: C.WHITE });
T(s, "adults worldwide have obstructive sleep apnea. Most don’t know it (Benjafield et al., 2019).", { x: 8.75, y: 3.25, w: 3.6, h: 1.4, fontSize: 14.5, color: C.GRAYD, lineSpacingMultiple: 1.05 });
[["< 5", "Normal", C.GREEN], ["5–15", "Mild", C.ORANGE], ["15–30", "Moderate", "B4410B"], ["> 30", "Severe", C.RED]].forEach((b, i) => {
  const x = 0.75 + i * 3.0; card(s, x, 5.45, 2.83, 1.35);
  T(s, b[0], { x, y: 5.6, w: 2.83, h: 0.6, align: "center", fontSize: 30, bold: true, color: b[2] });
  T(s, b[1] + " · events per hour", { x, y: 6.25, w: 2.83, h: 0.35, align: "center", fontSize: 12.5, color: C.GRAY }); });
notes(s, "Scientific background", 50, "Sleep apnea is when the airway collapses during sleep and breathing stops for ten seconds or more, over and over. About 936 million adults have it, and most don't know. Every pause drops blood oxygen. A pulse oximeter measures that by shining red and infrared light through the fingertip — oxygen-rich blood absorbs the two colours differently. Doctors count the events per hour — the AHI — and grade it from normal to severe. The problem: the standard test is an overnight lab study that costs thousands.");

/* ---------------- 4. DESIGN ---------------- */
s = slide(true); eyebrow(s, "Design", { align: "center" }); title(s, "The wearable.", { align: "center", fontSize: 48, y: 0.9 });
{ const h = 3.45; const w1 = h / ratio("hero_black.jpg"), w2 = h / ratio("exploded_black.jpg"), gap = 0.9, x0 = (13.333 - w1 - w2 - gap) / 2;
  s.addImage({ path: A("hero_black.jpg"), x: x0, y: 1.95, w: w1, h }); s.addImage({ path: A("exploded_black.jpg"), x: x0 + w1 + gap, y: 1.95, w: w2, h });
  caption(s, "v2 design: sealed case on a velcro strap", x0 - 0.3, 5.45, w1 + 0.6); caption(s, "Exploded: every v2 part at its real size", x0 + w1 + gap - 0.3, 5.45, w2 + 0.6); }
[["Prototype v1", "armband + plug-in wires"], ["All night", "USB power"], ["14 × 14 mm", "finger sensor"], ["1 / second", "readings"]].forEach((k, i) => {
  const x = 0.75 + i * 2.45; T(s, k[0], { x, y: 6.0, w: 2.35, h: 0.45, fontSize: 22, bold: true, color: C.WHITE });
  T(s, k[1], { x, y: 6.47, w: 2.35, h: 0.3, fontSize: 13, color: C.GRAYD }); });
qr(s, "qr_3d.png", LINKS.d3, 11.62, 5.95, 0.95); link(s, "Interactive 3D", LINKS.d3, 10.1, 6.25, 1.4, 13, "right");
notes(s, "Design", 40, "Here's the design. My working prototype, version 1, is built to be simple and reliable: the ESP32 sits in a running armband, each sensor plugs into its own pins with no soldered splices, and a USB cable powers it all night. A velcro finger clip holds the MAX30102 oxygen sensor. The 3D model shows version 2 — a 70 by 45 millimetre sealed case with its own battery on a velcro strap. On the right is the exploded view with every part at its real size; you can spin the interactive version with this QR code.");

/* ---------------- 5. HOW IT WORKS ---------------- */
s = slide(false); eyebrow(s, "How it works"); title(s, "From fingertip to sleep report.");
const flow = [["01", "Finger sensor", "MAX30102 · red + infrared light"], ["02", "ESP32 on the arm", "computes SpO₂ + pulse, reads position"], ["03", "Bluetooth or USB", "one line of data every second"], ["04", "App + analysis", "events, AHI, heart, breathing"]];
flow.forEach((f, i) => { const x = 0.75 + i * 3.0; card(s, x, 2.1, 2.78, 1.55);
  T(s, f[0], { x: x + 0.28, y: 2.3, w: 2.3, h: 0.3, fontSize: 13, bold: true, color: C.BLUE });
  T(s, f[1], { x: x + 0.28, y: 2.62, w: 2.3, h: 0.4, fontSize: 17, bold: true, color: C.INK });
  T(s, f[2], { x: x + 0.28, y: 3.03, w: 2.3, h: 0.55, fontSize: 12.5, color: C.GRAY }); });
T(s, "A built-in self-test proves it’s working before every recording.", { x: 0.75, y: 4.0, w: 11.8, h: 0.4, fontSize: 17, bold: true, color: C.INK });
card(s, 0.75, 4.52, 7.0, 2.4, C.BLACK);
s.addText([
  { text: "$ python check_device.py --port /dev/cu.NightSignal", options: { color: C.GRAYD, breakLine: true } },
  { text: "[PASS] Data arriving        1 reading/s", options: { color: C.GREEND, breakLine: true } },
  { text: "[PASS] Self-test            oxygen OK · motion OK", options: { color: C.GREEND, breakLine: true } },
  { text: "[PASS] Finger on sensor     100%", options: { color: C.GREEND, breakLine: true } },
  { text: "[PASS] Believable values    SpO2 97–98%, HR 60–64", options: { color: C.GREEND, breakLine: true } },
  { text: "RESULT: READY — sending real data", options: { color: C.WHITE, bold: true } }],
  { isTextBox: true, x: 1.05, y: 4.72, w: 6.5, h: 2.1, margin: 0, fontFace: MONO, fontSize: 12.5, valign: "top", paraSpaceAfter: 3 });
bullets(s, ["Firmware re-checks both sensors every 30 s.", "No finger: readings are marked invalid, never trusted.", "The app shows the same checks live, every second.", "A broken sensor is caught: “NOT READY”."], 8.15, 4.6, 4.45, 15, 0.16);
notes(s, "How it works", 35, "The data path: the finger sensor's light readings go to the ESP32, which calculates oxygen and pulse and reads body position, then sends one line per second over Bluetooth or USB to my app and analysis code. To make sure it's really working, I built a self-test: every recording starts with a device check that has to say READY — and when I tested with a broken motion sensor, it correctly said NOT READY.");

/* ---------------- 6. PROTOCOL ---------------- */
s = slide(false); eyebrow(s, "Experimental protocol"); title(s, "How I test it.");
[["Device check", "every session must pass check_device.py"],
 ["Accuracy test", "awake, side by side with a store-bought oximeter every 2 min for 30 min"],
 ["Detection test", "supervised, awake breath-holds of 10, 15 and 20 s: known events"],
 ["Full-night power test", "USB power, 8 h of data with no gaps"],
 ["Recorded nights", "at least 5 nights; armband on forearm, clip on index finger"]].forEach((st, i) => {
  const y = 2.1 + i * 0.92; s.addShape(p.ShapeType.ellipse, { x: 0.75, y, w: 0.52, h: 0.52, fill: { color: C.BLUE }, line: { type: "none" } });
  T(s, String(i + 1), { x: 0.75, y, w: 0.52, h: 0.52, align: "center", valign: "middle", fontSize: 17, bold: true, color: C.WHITE });
  s.addText([{ text: st[0] + "   ", options: { bold: true, color: C.INK } }, { text: st[1], options: { color: C.GRAY } }],
    { isTextBox: true, x: 1.5, y: y + 0.07, w: 6.95, h: 0.5, margin: 0, fontFace: F, fontSize: 15.5, valign: "top" }); });
card(s, 8.75, 2.05, 3.83, 4.55);
T(s, "Safety", { x: 9.05, y: 2.3, w: 3.3, h: 0.35, fontSize: 17, bold: true, color: C.RED });
bullets(s, ["Breath-holds only while awake, seated and supervised. Never asleep.", "20 seconds at most. Stop at any dizziness.", "Parent/guardian consent", "Ethics approval (human subject) before any test"], 9.05, 2.8, 3.3, 14.5, 0.18);
notes(s, "Protocol", 45, "My key manipulations: one, a device check before every session. Two, an accuracy test — I wear my device and a store-bought oximeter at the same time and compare. Three, a detection test: supervised, awake breath-holds of 10, 15 and 20 seconds — I know exactly when they happened, so I can score my software. Four, a full-night power test — eight hours with no gaps. Five, full recorded nights. Safety first: breath-holds only while awake and supervised, with consent and ethics approval.");

/* ---------------- 7. THE APP ---------------- */
s = slide(false, C.OFF); eyebrow(s, "The app"); title(s, "The companion app measures real data.");
const ph = phone(s, "phone_sleep.png", 1.05, 2.05, 2.15); phone(s, "phone_live.png", 3.75, 2.05, 2.15);
caption(s, "Sleep report", 1.05, 2.05 + ph + 0.15, 2.15); caption(s, "Live + device health", 3.75, 2.05 + ph + 0.15, 2.15);
bullets(s, ["The Live tab connects straight to the wearable (USB or Bluetooth) and shows oxygen, heart rate and position every second.",
  "Device health checks run the whole time: data flowing, self-test, finger on, power.",
  "Saving a session gives the same CSV the analysis uses, so every number is traceable.",
  "Heart, Asthma and Progress tabs for the spin-offs and my build log."], 6.95, 2.15, 5.65, 15.5, 0.22);
qr(s, "qr_app.png", LINKS.app, 7.05, 5.6, 1.05);
link(s, "Open the app", LINKS.app, 8.4, 5.78, 3, 16);
T(s, "Scan to try it. A demo device is built in.", { x: 8.4, y: 6.18, w: 4.2, h: 0.3, fontSize: 12.5, color: C.GRAY });
notes(s, "The app", 35, "This is my companion app. On the Live tab it connects directly to the wearable and shows oxygen, heart rate and position every second, with health checks running the whole time. Saving a session gives the exact CSV my analysis uses, so every number is traceable. Scan the code to try it — there's a demo device built in.");

/* ---------------- 8. RESULTS TABLE ---------------- */
s = slide(false); eyebrow(s, "Results"); title(s, "What one night showed."); prelim(s);
table(s, [["Measure", "Result", "Meaning"],
  ["Recording", "7.0 h · 25,200 readings", "a full night captured"],
  ["Apnea events", "19  →  AHI 2.7 / hour", "Normal range (< 5)"],
  ["Blood oxygen (avg / lowest)", "97.5 % / 84 %", "lowest point during an event"],
  ["Accuracy vs reference", "± 0.56 %  (r = 0.88)", "210 paired readings"],
  ["Events caught: rule / ML", "63 % / 63 %", "precision 1.00 / 0.92"],
  ["Sleep position", "back 3.8 / h  vs  sides 1.1–1.3 / h", "≈ 3 × more events on the back"],
  ["Spin-offs", "3 heart episodes · breathing 13 → 22 / min", "patterns flagged correctly"]],
  { x: 0.75, y: 2.1, w: 11.83, colW: [3.5, 4.4, 3.93], fontSize: 15, rowH: 0.5, softCols: [2] });
T(s, "Example data from my simulator, replaced with my own recorded nights before the final submission.", { x: 0.75, y: 6.6, w: 11.8, h: 0.3, fontSize: 12, color: C.GRAY });
notes(s, "Results summary", 40, "Here's the summary. Over a seven-hour night, the software found 19 events — an AHI of 2.7, which is in the normal range. Oxygen averaged 97.5% and dropped to 84% at the lowest. Against a reference oximeter, my device was within about half a percent. The detector caught 63% of known events with zero false alarms. And events were about three times more frequent on the back than on the sides.");

/* ---------------- 9. RESULTS: NIGHT + ACCURACY ---------------- */
s = slide(false); eyebrow(s, "Results"); title(s, "Every dip found. And the readings agree."); prelim(s);
img(s, "oxygen.png", 0.75, 2.15, 6.95);
img(s, "validation.png", 7.95, 2.15, 4.63); caption(s, "95% of readings within −1.5 to +1.7 % of the reference", 7.95, 2.15 + 4.63 * ratio("validation.png") + 0.15, 4.63);
notes(s, "Results: detection + accuracy", 35, "On the left, a whole night of oxygen — every red band is an event my code found on its own. On the right is a Bland–Altman plot, the standard way medical papers compare two devices: the average difference is almost zero, and 95% of my readings fall within about one and a half percent of the reference.");

/* ---------------- 10. RESULTS: POSITION + ML ---------------- */
s = slide(false); eyebrow(s, "Results"); title(s, "Back-sleeping, and two detectors."); prelim(s);
img(s, "position.png", 0.75, 2.05, 5.6);
s.addChart(p.charts.BAR, [{ name: "Precision", labels: ["Rule-based", "Machine learning"], values: [1.0, 0.92] },
  { name: "Recall (events caught)", labels: ["Rule-based", "Machine learning"], values: [0.63, 0.63] }],
  { x: 6.95, y: 2.05, w: 5.65, h: 3.7, barDir: "col", barGrouping: "clustered", barGapWidthPct: 60, chartColors: [C.BLUE, C.PINKD], showValue: true,
    dataLabelPosition: "outEnd", dataLabelFormatCode: "0.00", dataLabelFontSize: 12, dataLabelFontFace: F, dataLabelColor: C.INK,
    valAxisMaxVal: 1.2, valAxisMinVal: 0, valAxisLabelFormatCode: "0.0", valAxisHidden: true, valAxisLineShow: false,
    showLegend: true, legendPos: "b", legendFontSize: 12, legendFontFace: F, legendColor: C.GRAY,
    catAxisLabelFontSize: 13, catAxisLabelFontFace: F, catAxisLabelColor: C.INK, catAxisLineShow: false,
    valGridLine: { style: "none" }, catGridLine: { style: "none" },
    showTitle: true, title: "Detector scores on unseen data", titleFontSize: 14, titleFontFace: F, titleColor: C.INK });
notes(s, "Results: position + ML", 30, "Two more results. Events happened most on the back — 3.8 per hour versus about 1 on the sides. And I compared my simple rule with a machine-learning model: on new data, both caught the same share of events, but the rule had no false alarms, so for now the simpler method wins.");

/* ---------------- 11. ANALYSIS: INTERPRETATION ---------------- */
s = slide(true); eyebrow(s, "Main analysis"); title(s, "What the results mean.");
[["Accurate enough to trust", "Agreement within about ±1.6 % is in line with commercial fingertip oximeters (about ±2–3 %), so the drops it sees are real, not sensor noise.", C.BLUED],
 ["Cautious, not over-eager", "Perfect precision but 63 % recall means it misses shallow events. My AHI is probably an under-estimate: the safe direction for a screening tool.", C.GREEND],
 ["Position matters", "Three times more events on the back matches “positional” sleep apnea in the literature. A simple, free change (side-sleeping) could help.", C.ORANGED],
 ["More data beats fancier code", "Machine learning only tied the rule because it trained on one night. It needs many labeled nights to learn more than a rule.", C.PINKD]].forEach((k, i) => {
  const x = 0.75 + (i % 2) * 6.02, y = 2.1 + Math.floor(i / 2) * 2.4; card(s, x, y, 5.81, 2.2);
  T(s, k[0], { x: x + 0.35, y: y + 0.28, w: 5.1, h: 0.45, fontSize: 19, bold: true, color: k[2] });
  T(s, k[1], { x: x + 0.35, y: y + 0.82, w: 5.1, h: 1.3, fontSize: 14.5, color: C.GRAYL, lineSpacingMultiple: 1.05 }); });
notes(s, "Analysis: interpretation", 45, "What does it mean? First, accuracy within about one and a half percent is in the same range as store-bought oximeters, so the dips are real. Second, the detector is cautious — no false alarms but it misses shallow events, so my AHI is probably an underestimate, which is the safer mistake for a screening tool. Third, the back-sleeping result matches what doctors call positional sleep apnea. And fourth, machine learning didn't win yet because it only had one night to learn from — more data matters more than fancier code.");

/* ---------------- 12. ANALYSIS: SOURCES OF ERROR ---------------- */
s = slide(true); eyebrow(s, "Main analysis"); title(s, "What could make it wrong.");
T(s, "Measurement", { x: 0.75, y: 2.1, w: 5.6, h: 0.4, fontSize: 19, bold: true, color: C.BLUED });
bullets(s, ["Finger movement, pressure and cold hands distort the light signal", "The 4-second averaging window smooths very short dips", "The reference oximeter itself is only ±2 %", "Arm angle only approximates body position"], 0.75, 2.65, 5.7, 15, 0.16, C.GRAYL);
T(s, "Method", { x: 6.77, y: 2.1, w: 5.6, h: 0.4, fontSize: 19, bold: true, color: C.PINKD });
bullets(s, ["Awake breath-holds aren’t the same as real obstructive apnea", "Oxygen only: no airflow or brain-wave sensors like a lab study", "One person, few nights: can’t generalize yet", "Results so far use simulated example data"], 6.77, 2.65, 5.8, 15, 0.16, C.GRAYL);
card(s, 0.75, 5.3, 11.83, 1.45);
s.addText([{ text: "Engineering finding.  ", options: { bold: true, color: C.ORANGED } }, { text: "Bluetooth draws about 100 mA, so a 500 mAh battery would last only 4–5 hours: not a full night. So prototype v1 runs on USB power, and the sealed v2 case needs a bigger battery or Bluetooth Low Energy.", options: { color: C.WHITE } }],
  { isTextBox: true, x: 1.1, y: 5.55, w: 11.15, h: 1.05, margin: 0, fontFace: F, fontSize: 15.5, valign: "top", lineSpacingMultiple: 1.05 });
notes(s, "Analysis: sources of error", 35, "Sources of error: movement, finger pressure and cold hands can distort the light signal; the four-second averaging can blur very short dips; even the reference oximeter is only plus or minus two percent. On the method side, awake breath-holds aren't identical to real apnea, I only measure oxygen — not airflow or brain waves like a sleep lab — and one person isn't enough to generalize. I also caught an engineering problem: Bluetooth draws about 100 milliamps, so a small 500 milliamp-hour battery would last only four to five hours. That's why version 1 runs on USB power all night, and version 2 needs a bigger battery or Bluetooth Low Energy.");

/* ---------------- 13. SPIN-OFFS ---------------- */
s = slide(false); eyebrow(s, "Further considerations"); title(s, "Same sensor. Two more uses."); prelim(s);
const hh = img(s, "heart.png", 0.75, 2.1, 5.81); img(s, "asthma.png", 6.77, 2.1, 5.81);
s.addText([{ text: "Heart.  ", options: { bold: true, color: C.PINK } }, { text: "Flags racing (>100 bpm), very slow (<40 bpm) and irregular-rhythm episodes, plus resting heart rate and HRV.", options: { color: C.GRAY } }],
  { isTextBox: true, x: 0.75, y: 2.3 + hh, w: 5.81, h: 1.0, margin: 0, fontFace: F, fontSize: 14.5, valign: "top" });
s.addText([{ text: "Asthma.  ", options: { bold: true, color: C.BLUE } }, { text: "Tracks breathing rate from the heart’s rhythm and coughs from the motion sensor, catching early-morning worsening (13 → 22 breaths/min).", options: { color: C.GRAY } }],
  { isTextBox: true, x: 6.77, y: 2.3 + hh, w: 5.81, h: 1.0, margin: 0, fontFace: F, fontSize: 14.5, valign: "top" });
T(s, "Screening ideas only. Confirming an arrhythmia or asthma needs a doctor.", { x: 0.75, y: 6.75, w: 11.8, h: 0.3, fontSize: 12, color: C.GRAY });
notes(s, "Spin-offs", 40, "The same hardware opened two spin-offs. Heart: it flags racing, very slow and irregular-rhythm episodes. Asthma: night-time asthma often gets worse around 4 a.m., and my code tracks breathing rate from the heart's rhythm plus coughs from sudden jolts of the motion sensor — here it caught breathing climbing from 13 to 22 breaths a minute. These are screening ideas, not diagnoses.");

/* ---------------- 14. CONCLUSION ---------------- */
s = slide(true); eyebrow(s, "Conclusion"); title(s, "Supported. So far.", { fontSize: 54, h: 1.1 });
T(s, "A low-cost wearable measured blood oxygen within about half a percent of a reference, found apnea events on its own, scored the night’s severity, and showed back-sleeping triples events.",
  { x: 0.75, y: 2.15, w: 11.8, h: 1.1, fontSize: 19, color: C.GRAYL, lineSpacingMultiple: 1.08 });
T(s, "Next", { x: 0.75, y: 3.55, w: 6, h: 0.4, fontSize: 19, bold: true, color: C.WHITE });
bullets(s, ["Record more people and many more nights", "Add a nasal airflow sensor to separate apnea from hypopnea", "Bigger battery or Bluetooth Low Energy for full nights", "Shrink it into a finger ring and compare with a real sleep lab"], 0.75, 4.05, 7.3, 15.5, 0.14, C.GRAYL);
qr(s, "qr_app.png", LINKS.app, 8.95, 3.75, 1.45); qr(s, "qr_3d.png", LINKS.d3, 10.98, 3.75, 1.45);
T(s, "App", { x: 8.95, y: 5.35, w: 1.45, h: 0.3, align: "center", fontSize: 13, color: C.GRAYD });
T(s, "3D model", { x: 10.98, y: 5.35, w: 1.45, h: 0.3, align: "center", fontSize: 13, color: C.GRAYD });
T(s, "Thank you. Questions?", { x: 0.75, y: 6.3, w: 11.8, h: 0.6, fontSize: 28, bold: true, color: C.WHITE });
notes(s, "Conclusion", 35, "Back to my hypothesis: so far it's supported — a low-cost wearable measured oxygen within about half a percent of a reference, found apnea events by itself, scored the night, and showed back-sleeping triples events. Next I'd test more people and nights, add an airflow sensor, fix the battery life, and shrink it into a ring to compare against a real sleep lab. Thank you — I'm happy to take questions.");

/* ================= APPENDIX (in slides, not presented) ================= */
const atitle = (s, t) => title(s, t, { fontSize: 30, h: 0.7 });
s = slide(false); appendix(s); eyebrow(s, "Appendix A · Materials"); atitle(s, "Parts, exact sizes and where to buy.");
const L = (t, u) => ({ text: t, options: { hyperlink: { url: u, tooltip: u }, color: C.BLUE } });
const parts = [
  ["AITRIP ESP32 ESP-WROOM-32 (30-pin, CP2102, USB-C)", "≈ 52 × 28 mm · pins pre-soldered", "Processor + Bluetooth Classic", "https://www.amazon.ca/AITRIP-ESP-WROOM-32-Development-Microcontroller-Compatible/dp/B0DF2YJSHN"],
  ["HiLetgo MAX30102 sensor", "14 × 14 mm · 4 pins to solder", "SpO₂ + heart rate (finger clip)", "https://www.amazon.ca/HiLetgo-MAX30102-Breakout-Oximetry-Solution/dp/B07QC67KMQ"],
  ["SHILLEHTEK GY-521 MPU-6050, pre-soldered (2-pack)", "≈ 21 × 16 mm", "Sleep position + cough jolts", "https://www.amazon.ca/Pre-Soldered-Accelerometer-Raspberry-Compatible-Arduino/dp/B0BMY15TC4"],
  ["ELEGOO 120 Dupont jumper wires (F-F, M-F, M-M)", "20 cm each", "Plug-in wiring, no soldering", "https://www.amazon.ca/Elegoo-120pcs-Multicolored-Breadboard-arduino/dp/B01EV70C78"],
  ["Running armband phone pouch", "fits phones up to 6.9 in", "Holds the ESP32 on the forearm", "https://www.amazon.ca/Running-Armband-Samsung-Resistant-Emergency/dp/B08HZ3BPK4"],
  ["Anker Powerline+ USB-A to USB-C cable", "3 m (10 ft)", "All-night power from a phone charger", "https://www.amazon.ca/Anker-Powerline-Double-Braided-Charging-Samsung/dp/B07G148YMS"],
  ["Anker USB-C to USB-A adapter (2-pack)", "USB-C → USB-A", "Plug the cable into a MacBook", "https://www.amazon.ca/Adapter-Anker-High-Speed-Transfer-Notebook/dp/B08HZ6PS61"],
  ["VELCRO Brand 1 in × 30 ft roll", "25 mm wide · cut ≈ 80 mm", "Finger loop", "https://www.amazon.ca/VELCRO-Brand-VEL-30768-AMS-Self-Gripping-Organization/dp/B09QH2NVM1"],
  ["Elite Medica fingertip pulse oximeter", "Health Canada authorized", "Reference for the accuracy test", "https://www.amazon.ca/Elite-Medica-Fingertip-Saturation-Batteries/dp/B0DSGP91PB"]];
table(s, [["Part", "Size", "Purpose", "Buy"]].concat(parts.map((r) => [r[0], r[1], r[2], { text: [L("Amazon.ca ›", r[3])] }])),
  { x: 0.75, y: 1.75, w: 11.83, colW: [4.4, 3.3, 2.83, 1.3], fontSize: 11.5, rowH: 0.43, softCols: [1, 2] });
T(s, "Every part is on Amazon.ca (click Buy). Prices change and several items are multi-packs. Only the MAX30102’s 4 header pins need soldering (about 5 minutes); everything else plugs in.", { x: 0.75, y: 6.45, w: 11.8, h: 0.5, fontSize: 11.5, color: C.GRAY });
notes(s, "Appendix A — materials", 0, "Appendix — not presented. Full parts list with exact dimensions and links.");

s = slide(false); appendix(s); eyebrow(s, "Appendix B · Full protocol"); atitle(s, "Full experimental protocol.");
const proto = [
  "Build: plug the MAX30102 into 3V3 / GND / GPIO 21 / 22 and the GY-521 into VIN / GND / SDA→GPIO 33 / SCL→GPIO 32 (two separate I²C buses, no splices); ESP32 in the armband, USB power. Flash firmware v3.1.",
  "Device check: run check_device.py; record the result. Do not continue unless it says READY.",
  "Full-night power test: on USB power, stream with a finger on the sensor for 8 h; confirm there are no gaps in the data.",
  "Accuracy test: seated, awake, 30 min. Every 2 min write down the reference oximeter value with the time. Analyse with validate.py (Bland–Altman, r).",
  "Detection test: supervised, awake, seated; 5 breath-holds each of 10, 15 and 20 s after a normal breath out, 2 min apart; log start/end times as ground-truth labels. Score with train_model.py.",
  "Recorded nights: at least 5 nights; armband on the forearm, finger clip on the index finger; record.py logs all night; note bedtime and wake time.",
  "Analysis: analyze.py, signals.py, position.py, heart.py, asthma.py on each night; rebuild the app and slides with build_app.py and build_deck.js.",
  "Controls: same finger, cuff tightness, room temperature, firmware v3.1 and detection settings (3 % drop, 10 s, 120 s baseline)."];
proto.forEach((t, i) => { const y = 1.8 + i * 0.62;
  T(s, String(i + 1), { x: 0.75, y, w: 0.4, h: 0.4, fontSize: 14, bold: true, color: C.BLUE });
  T(s, t, { x: 1.2, y, w: 11.4, h: 0.6, fontSize: 12.5, color: C.INK }); });
notes(s, "Appendix B — protocol", 0, "Appendix — not presented. Step-by-step protocol including controls.");

s = slide(false); appendix(s); eyebrow(s, "Appendix C · Design plans"); atitle(s, "Wiring (v1) and case layout (v2).");
table(s, [["From", "To (ESP32)", "Notes"],
  ["MAX30102 VIN / GND", "3V3 / GND", "never 5 V"], ["MAX30102 SDA / SCL", "GPIO 21 / 22", "I²C bus 0"],
  ["GY-521 VCC / GND", "VIN / GND", "5 V from USB"], ["GY-521 SDA / SCL", "GPIO 33 / 32", "I²C bus 1, 100 kHz"],
  ["Power", "USB-C port", "3 m cable to charger"], ["Status LED", "GPIO 2", "blinks each reading"]],
  { x: 0.75, y: 1.75, w: 6.6, colW: [2.7, 1.9, 2.0], fontSize: 12, rowH: 0.4, softCols: [2] });
img(s, "wiring_v1.png", 1.6, 4.75, 4.0);
card(s, 7.7, 1.75, 4.88, 3.6, C.BLACK);
{ const h = 3.2, w = h / ratio("exploded_black.jpg"); s.addImage({ path: A("exploded_black.jpg"), x: 7.7 + (4.88 - w) / 2, y: 1.95, w, h }); }
caption(s, "v2: the stack inside the 25 mm-tall case", 7.7, 5.45, 4.88);
T(s, "Planned v2: a 70 × 45 × 29 mm box with its own battery. Layer heights: battery 6 mm + ESP32 with pins ≈ 13 mm + GY-521 ≈ 3 mm ≈ 22 mm, inside the box’s 25 mm. v1 uses each sensor’s own pins, so nothing needs splicing.",
  { x: 7.7, y: 5.85, w: 4.88, h: 1.2, fontSize: 12, color: C.GRAY });
notes(s, "Appendix C — design plans", 0, "Appendix — not presented. Prototype v1 wiring table, and the planned v2 case layout with layer heights.");

s = slide(false); appendix(s); eyebrow(s, "Appendix D · Data and pictures"); atitle(s, "More data and pictures.");
const p1 = phone(s, "phone_heart.png", 0.95, 1.85, 2.25); caption(s, "App · Heart tab", 0.95, 1.85 + p1 + 0.15, 2.25);
table(s, [["Analysis", "Result (example data)"],
  ["Breathing rate (signals.py)", "13.5 breaths/min"], ["HRV (SDNN / RMSSD)", "69 / 50 ms"], ["Lowest heart rate", "46 bpm"],
  ["Heart spin-off", "racing 3.3 min (106–118 bpm) · slow 2.5 min (34–39) · irregular 5.9 min"],
  ["Asthma spin-off", "normal 13.4 → early morning 21.6 /min · 85 min fast · 24 cough-like jolts"],
  ["ML model relies on", "heart-rate swing and jitter, then oxygen swing"],
  ["Device check (simulated device)", "healthy → READY · broken motion sensor → NOT READY"]],
  { x: 3.7, y: 1.8, w: 8.88, colW: [3.0, 5.88], fontSize: 12.5, rowH: 0.46 });
link(s, "All code, data tools and raw CSV format on GitHub", LINKS.code, 3.7, 5.95, 8, 13.5);
link(s, "Build guide: buy, build, connect", LINKS.build, 3.7, 6.35, 8, 13.5);
notes(s, "Appendix D — data", 0, "Appendix — not presented. Remaining numbers, app screenshot and links to all data and code.");

s = slide(false); appendix(s); eyebrow(s, "Bibliography · APA"); atitle(s, "References.");
["American Academy of Sleep Medicine. (2014). International classification of sleep disorders (3rd ed.).",
 "Benjafield, A. V., et al. (2019). Estimation of the global prevalence and burden of obstructive sleep apnoea: A literature-based analysis. The Lancet Respiratory Medicine, 7(8), 687–698.",
 "Berry, R. B., et al. (2012). Rules for scoring respiratory events in sleep. Journal of Clinical Sleep Medicine, 8(5), 597–619.",
 "Bland, J. M., & Altman, D. G. (1986). Statistical methods for assessing agreement between two methods of clinical measurement. The Lancet, 327(8476), 307–310.",
 "Global Initiative for Asthma. (2024). Global strategy for asthma management and prevention.",
 "Jubran, A. (2015). Pulse oximetry. Critical Care, 19, 272.",
 "Maxim Integrated. (2020). MAX30102 high-sensitivity pulse oximeter and heart-rate sensor [Datasheet].",
 "Task Force of the European Society of Cardiology and NASPE. (1996). Heart rate variability: Standards of measurement, physiological interpretation, and clinical use. Circulation, 93(5), 1043–1065."]
  .forEach((r, i) => T(s, r, { x: 0.75, y: 1.8 + i * 0.62, w: 11.8, h: 0.6, fontSize: 13, color: C.GRAY }));
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
