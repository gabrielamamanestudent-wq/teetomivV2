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
  app: "https://gabrielamamanestudent-wq.github.io/teetomivV2/science-fair/night-signal/app/",
  d3: "https://gabrielamamanestudent-wq.github.io/teetomivV2/science-fair/night-signal/app/3d.html",
  code: "https://github.com/gabrielamamanestudent-wq/teetomivV2/tree/claude/science-fair-medical-project-7k0wk4/science-fair/night-signal",
  build: "https://gabrielamamanestudent-wq.github.io/teetomivV2/science-fair/night-signal/build-kit.html",
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

function slide(dark, bg, glow) { const s = p.addSlide(); s.background = glow ? { path: A(glow) } : { color: bg || (dark ? C.BLACK : C.WHITE) }; s._dark = dark; s._bg = bg; return s; }
const fg = (s) => (s._dark ? C.WHITE : C.INK), soft = (s) => (s._dark ? C.GRAYD : C.GRAY), accent = (s) => (s._dark ? C.PINKD : C.PINK);
function T(s, text, o) { s.addText(text, Object.assign({ isTextBox: true, margin: 0, fontFace: F, valign: "top" }, o)); }
function eyebrow(s, t, o) { T(s, t, Object.assign({ x: 0.75, y: 0.55, w: 11.8, h: 0.35, fontSize: 16, bold: true, color: accent(s) }, o || {})); }
function title(s, t, o) { T(s, t, Object.assign({ x: 0.75, y: 0.92, w: 11.8, h: 0.95, fontSize: 40, bold: true, color: fg(s), lineSpacingMultiple: 0.92 }, o || {})); }
function tag(s, text) { const x = 10.35, y = 0.55, w = 2.25, h = 0.36;
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.18, fill: { color: s._dark ? C.CARDD2 : s._bg === C.OFF ? C.WHITE : C.CARD }, line: { type: "none" } });
  T(s, text, { x, y, w, h, align: "center", valign: "middle", fontSize: 10.5, bold: true, color: soft(s) }); }
const prelim = (s) => tag(s, "Example data");
const appendix = (s) => tag(s, "Appendix · not presented");
function bullets(s, items, x, y, w, size, gap, color) { let yy = y; const sz = size || 16, lineH = sz * 1.22 / 72;
  items.forEach((it) => {
    s.addShape(p.ShapeType.ellipse, { x, y: yy + lineH * 0.42, w: 0.08, h: 0.08, fill: { color: s._dark ? C.GRAYD : C.GRAYL }, line: { type: "none" } });
    const lines = Math.ceil(it.length / Math.floor((w - 0.25) * 72 / (sz * 0.52)));
    T(s, it, { x: x + 0.25, y: yy, w: w - 0.25, h: lines * lineH + 0.08, fontSize: sz, color: color || fg(s) });
    yy += lines * lineH + (gap || 0.2); }); return yy; }
function card(s, x, y, w, h, fill) { const glass = !fill && s._dark;   // frosted cards on the dark glow slides
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.22, fill: glass ? { color: "FFFFFF", transparency: 91 } : { color: fill || C.CARD },
    line: glass ? { color: "FFFFFF", transparency: 84, width: 0.75 } : { type: "none" } }); }
function bar(s, x, y, color) { s.addShape(p.ShapeType.roundRect, { x, y, w: 0.5, h: 0.07, rectRadius: 0.035, fill: { color }, line: { type: "none" } }); }
// a chart picture sitting in a white rounded card (on the light-grey chart slides)
function chartCard(s, f, x, y, w, h) { card(s, x, y, w, h, C.WHITE); const pad = 0.22, iw = w - 2 * pad, ih = iw * ratio(f);
  const fh = Math.min(ih, h - 2 * pad), fw = fh / ratio(f); s.addImage({ path: A(f), x: x + (w - fw) / 2, y: y + (h - fh) / 2, w: fw, h: fh }); }
function tile(s, x, y, w, h, big, label, color) { card(s, x, y, w, h);
  T(s, big, { x: x + 0.3, y: y + 0.22, w: w - 0.5, h: 0.65, fontSize: 32, bold: true, color });
  T(s, label, { x: x + 0.3, y: y + 0.88, w: w - 0.5, h: 0.45, fontSize: 12.5, color: soft(s) }); }
function footer(s, n) { T(s, "Night Signal", { x: 0.75, y: 7.08, w: 4, h: 0.25, fontSize: 9.5, bold: true, color: s._dark ? C.GRAY : C.GRAYL });
  T(s, String(n), { x: 11.58, y: 7.08, w: 1.0, h: 0.25, fontSize: 9.5, align: "right", color: s._dark ? C.GRAY : C.GRAYL }); }
function img(s, f, x, y, w, opts) { const h = w * ratio(f); s.addImage(Object.assign({ path: A(f), x, y, w, h }, opts || {})); return h; }
function imgH(s, f, x, y, h) { const w = h / ratio(f); s.addImage({ path: A(f), x, y, w, h }); return w; }
function caption(s, t, x, y, w, align) { T(s, t, { x, y, w, h: 0.3, align: align || "center", fontSize: 12, color: soft(s) }); }
function link(s, label, url, x, y, w, size, align) { s.addText([{ text: label + " ›", options: { hyperlink: { url, tooltip: url }, color: s._dark ? C.BLUED : C.BLUE } }],
  { isTextBox: true, x, y, w, h: 0.34, margin: 0, fontFace: F, fontSize: size || 14, align: align || "left" }); }
function qr(s, f, url, x, y, w) { card(s, x - 0.08, y - 0.08, w + 0.16, w + 0.16, C.WHITE); s.addImage({ path: A(f), x, y, w, h: w, hyperlink: { url, tooltip: url } }); }
function notes(s, t, secs, script) { NOTES.push([t, secs, script]); if (secs > 0 && NOTES.length > 1) footer(s, NOTES.length); s.addNotes(`[${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}] ${script}`); }
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
let s = slide(true, null, "bg_glow_center.jpg");
T(s, "Health and Medical Sciences · Experimental project", { x: 0.75, y: 0.5, w: 11.83, h: 0.32, align: "center", fontSize: 14, bold: true, color: C.GRAYD });
T(s, "Night Signal.", { x: 0.75, y: 0.88, w: 11.83, h: 1.1, align: "center", fontSize: 66, bold: true, color: C.WHITE });
T(s, "How accurately can a low-cost wearable measure blood oxygen?", { x: 0.75, y: 1.98, w: 11.83, h: 0.5, align: "center", fontSize: 24, color: C.GRAYD });
{ const h = 3.85, w = h / ratio("hero_alpha.png"); s.addImage({ path: A("hero_alpha.png"), x: (13.333 - w) / 2, y: 2.62, w, h }); }
T(s, [{ text: "Gabriel Mamane", options: { bold: true, color: C.WHITE } }, { text: "   ·   Grade ___", options: { color: C.GRAYD } }],
  { x: 0.75, y: 6.62, w: 11.83, h: 0.35, align: "center", fontSize: 15 });
T(s, "Educational prototype. It measures SpO₂ and heart rate; it does not diagnose sleep apnea.", { x: 0.75, y: 6.98, w: 11.83, h: 0.28, align: "center", fontSize: 10.5, color: C.GRAY });
notes(s, "Title", 15, "Good morning. My name is Gabriel Mamane. My project, Night Signal, asks how accurately a low-cost wearable can measure blood oxygen and heart rate, and whether software can flag drops in oxygen. It is not a test for sleep apnea.");

/* ---------------- 2. PURPOSE & HYPOTHESIS ---------------- */
s = slide(false); eyebrow(s, "Purpose and hypothesis"); title(s, "Is a low-cost oxygen wearable accurate?");
card(s, 0.75, 2.1, 5.8, 2.65); card(s, 6.78, 2.1, 5.8, 2.65);
bar(s, 1.1, 2.4, C.PINK); bar(s, 7.13, 2.4, C.BLUE);
T(s, "Question", { x: 1.1, y: 2.55, w: 5.1, h: 0.35, fontSize: 15, bold: true, color: C.PINK });
T(s, "How closely do SpO₂ and heart-rate readings from a MAX30102 + ESP32 wearable agree with a Health Canada-authorized fingertip pulse oximeter, and can software reliably flag oxygen desaturation events (≥ 3 points for ≥ 10 s)?",
  { x: 1.1, y: 2.98, w: 5.1, h: 1.65, fontSize: 15, color: C.INK });
T(s, "Hypothesis", { x: 7.13, y: 2.55, w: 5.1, h: 0.35, fontSize: 15, bold: true, color: C.BLUE });
T(s, "If the wearable is worn correctly and only good-quality readings are used, its SpO₂ will agree with the reference within about ±3 percentage points (95% limits of agreement), because both measure red/infrared light absorption.",
  { x: 7.13, y: 2.98, w: 5.1, h: 1.65, fontSize: 15, color: C.INK });
[["Independent variables", "Measuring device (wearable vs reference); test condition (seated rest; optional breath-holds only if approved)", C.ORANGE],
 ["Dependent variables", "Device − reference difference (bias, 95% limits, mean error); desaturation events flagged; % valid signal", C.GREEN],
 ["Controls", "Same participant, finger, cuff tightness, room and lighting; paired readings every 2 min; same settings", C.GRAYL]].forEach((v, i) => {
  const x = 0.75 + i * 4.0; card(s, x, 4.98, 3.83, 1.75); bar(s, x + 0.3, 5.22, v[2]);
  T(s, v[0], { x: x + 0.3, y: 5.38, w: 3.3, h: 0.35, fontSize: 15.5, bold: true, color: C.INK });
  T(s, v[1], { x: x + 0.3, y: 5.78, w: 3.3, h: 0.85, fontSize: 12.5, color: C.GRAY }); });
notes(s, "Purpose & hypothesis", 45, "My question is how closely my wearable's oxygen and heart-rate readings agree with a Health Canada-authorized fingertip oximeter, and whether software can reliably flag oxygen desaturation events. My hypothesis is that, when it is worn properly and only good-quality readings are used, it will agree within about three percentage points, because both devices measure how blood absorbs red and infrared light. What I change is the measuring device and the test condition; what I measure is the difference between the two devices, the events flagged, and how much of the signal is valid.");

/* ---------------- 3. BACKGROUND ---------------- */
s = slide(false); eyebrow(s, "Scientific background"); title(s, "An oxygen dip is a clue, not a diagnosis.");
bullets(s, [
  "Pulse oximetry: red (660 nm) and infrared (880 nm) light shine through the fingertip. Oxygen-rich and oxygen-poor blood absorb them differently, giving SpO₂.",
  "A desaturation is a short drop in SpO₂. Sleep studies count drops of 3% or more, alongside other signals.",
  "Sleep apnea is diagnosed with a sleep study that also measures airflow, breathing effort and sleep. Oxygen alone cannot do this.",
  "Not every oxygen drop is an apnea (movement, poor contact, other causes), and not every apnea causes a large drop.",
], 0.75, 2.15, 7.3, 15, 0.18);
card(s, 8.45, 2.1, 4.13, 2.75, C.BLACK);
T(s, "936 million", { x: 8.75, y: 2.4, w: 3.6, h: 0.75, fontSize: 40, bold: true, color: C.WHITE });
T(s, "adults worldwide are estimated to have obstructive sleep apnea, and most are undiagnosed (Benjafield et al., 2019).", { x: 8.75, y: 3.25, w: 3.6, h: 1.4, fontSize: 14, color: C.GRAYD });
[["SpO₂", "can show oxygen dips", C.BLUE], ["Heart rate", "can show pulse changes", C.PINK], ["Not measured", "airflow · breathing effort · sleep stage", C.GRAY]].forEach((b, i) => {
  const x = 0.75 + i * 4.0; card(s, x, 5.45, 3.83, 1.35);
  T(s, b[0], { x: x + 0.3, y: 5.62, w: 3.3, h: 0.5, fontSize: 22, bold: true, color: b[2] });
  T(s, b[1], { x: x + 0.3, y: 6.2, w: 3.3, h: 0.4, fontSize: 13, color: C.GRAY }); });
notes(s, "Scientific background", 50, "A pulse oximeter shines red and infrared light through the fingertip; oxygen-rich and oxygen-poor blood absorb them differently, which gives the oxygen saturation, SpO2. A desaturation is a short drop in SpO2, and sleep studies count drops of three percent or more, but only together with other signals. Sleep apnea is diagnosed with a sleep study that measures airflow, breathing effort and sleep itself. My device measures only oxygen and heart rate, so it cannot tell an apnea from other causes of a dip, and it would miss apneas that cause little or no drop. That is why my project is about measurement accuracy and oxygen dips, not about diagnosing sleep apnea.");

/* ---------------- 4. DESIGN ---------------- */
s = slide(true, null, "bg_glow_low.jpg"); eyebrow(s, "Design", { align: "center" }); title(s, "The wearable.", { align: "center", fontSize: 48, y: 0.9 });
{ const h = 3.5; const w1 = h / ratio("hero_alpha.png"), w2 = h / ratio("exploded_alpha.png"), gap = 1.0, x0 = (13.333 - w1 - w2 - gap) / 2;
  s.addImage({ path: A("hero_alpha.png"), x: x0, y: 1.9, w: w1, h }); s.addImage({ path: A("exploded_alpha.png"), x: x0 + w1 + gap, y: 1.9, w: w2, h });
  caption(s, "3D design of a later version (v2): sealed case", x0 - 0.3, 5.45, w1 + 0.6); caption(s, "Exploded: every v2 part at its real size", x0 + w1 + gap - 0.3, 5.45, w2 + 0.6); }
[["Prototype v1", "armband + plug-in wires"], ["Not built yet", "parts list ready"], ["MAX30102", "red + infrared finger sensor"], ["1 / second", "SpO₂ + heart rate"]].forEach((k, i) => {
  const x = 0.75 + i * 2.45; T(s, k[0], { x, y: 6.0, w: 2.35, h: 0.45, fontSize: 22, bold: true, color: C.WHITE });
  T(s, k[1], { x, y: 6.47, w: 2.35, h: 0.3, fontSize: 13, color: C.GRAYD }); });
qr(s, "qr_3d.png", LINKS.d3, 11.62, 5.95, 0.95); link(s, "Interactive 3D", LINKS.d3, 10.1, 6.25, 1.4, 13, "right");
notes(s, "Design", 40, "This is the design. The first prototype keeps things simple: an ESP32 board in a running armband, a MAX30102 sensor in a velcro finger cuff, and a USB cable for power, with every wire plugged in. It reads oxygen and heart rate once per second. The 3D model shows a possible later version in a sealed case. The prototype has not been built yet; the parts list and build guide are ready.");

/* ---------------- 5. HOW IT WORKS ---------------- */
s = slide(false); eyebrow(s, "How it works"); title(s, "From fingertip to data file.");
const flow = [["01", "Finger sensor", "MAX30102 · red + infrared light"], ["02", "ESP32 on the arm", "computes SpO₂ and pulse once per second"], ["03", "Bluetooth or USB", "one line of data every second"], ["04", "App + analysis", "signal quality, desaturation events, agreement"]];
flow.forEach((f, i) => { const x = 0.75 + i * 3.0; card(s, x, 2.1, 2.78, 1.55);
  T(s, f[0], { x: x + 0.28, y: 2.3, w: 2.3, h: 0.3, fontSize: 13, bold: true, color: C.BLUE });
  T(s, f[1], { x: x + 0.28, y: 2.62, w: 2.3, h: 0.4, fontSize: 17, bold: true, color: C.INK });
  T(s, f[2], { x: x + 0.28, y: 3.03, w: 2.3, h: 0.55, fontSize: 12.5, color: C.GRAY }); });
T(s, "A device check runs before every session (tested so far on a simulated device).", { x: 0.75, y: 4.0, w: 11.8, h: 0.4, fontSize: 17, bold: true, color: C.INK });
card(s, 0.75, 4.52, 7.0, 2.4, C.BLACK);
s.addText([
  { text: "$ python check_device.py --port /dev/pts/3   (simulated device)", options: { color: C.GRAYD, breakLine: true } },
  { text: "[PASS] Data arriving        1 reading/s", options: { color: C.GREEND, breakLine: true } },
  { text: "[PASS] Self-test            oxygen OK · motion OK", options: { color: C.GREEND, breakLine: true } },
  { text: "[PASS] Finger on sensor     100%", options: { color: C.GREEND, breakLine: true } },
  { text: "[PASS] Believable values    SpO2 97–98%, HR 60–64", options: { color: C.GREEND, breakLine: true } },
  { text: "RESULT: READY", options: { color: C.WHITE, bold: true } }],
  { isTextBox: true, x: 1.05, y: 4.72, w: 6.5, h: 2.1, margin: 0, fontFace: MONO, fontSize: 12.5, valign: "top", paraSpaceAfter: 3 });
bullets(s, ["Firmware re-checks both sensors every 30 s.", "No finger: readings are marked invalid and excluded.", "A broken sensor gives “NOT READY” (checked with the simulated device).", "Real hardware has not been tested yet."], 8.15, 4.6, 4.45, 15, 0.16);
notes(s, "How it works", 35, "The finger sensor's light readings go to the ESP32, which calculates oxygen and pulse once per second and sends each reading over Bluetooth or USB to my app and analysis code. Every session will start with a device check that must say READY. So far I have tested this check only on a simulated device, where it also correctly reported a broken sensor; it still has to be tested on the real hardware.");

/* ---------------- 6. PROTOCOL ---------------- */
s = slide(false); eyebrow(s, "Experimental protocol · planned"); title(s, "How I will test it.");
[["Approvals first", "Ms. Ireland, the ethics committee and signed consent, before any data"],
 ["Accuracy sessions (main)", "seated; wearable on one finger, reference on the other; SpO₂ + heart rate every 2 min for 30 min; several sessions"],
 ["Signal-quality checks", "finger on, sensor-valid flag, believable range, movement excluded"],
 ["Overnight recordings (if approved)", "signal quality and desaturation events per valid hour; not verifiable overnight"],
 ["Breath-hold test (optional, if approved)", "awake and supervised; are induced dips flagged? Not a test of sleep apnea"]].forEach((st, i) => {
  const y = 2.05 + i * 0.93; s.addShape(p.ShapeType.ellipse, { x: 0.75, y, w: 0.52, h: 0.52, fill: { color: i === 0 ? C.RED : C.BLUE }, line: { type: "none" } });
  T(s, String(i + 1), { x: 0.75, y, w: 0.52, h: 0.52, align: "center", valign: "middle", fontSize: 17, bold: true, color: C.WHITE });
  s.addText([{ text: st[0] + "   ", options: { bold: true, color: C.INK } }, { text: st[1], options: { color: C.GRAY } }],
    { isTextBox: true, x: 1.5, y: y + 0.02, w: 6.95, h: 0.8, margin: 0, fontFace: F, fontSize: 14, valign: "top" }); });
card(s, 8.75, 2.05, 3.83, 4.55);
T(s, "Safety", { x: 9.05, y: 2.3, w: 3.3, h: 0.35, fontSize: 17, bold: true, color: C.RED });
bullets(s, ["No testing on anyone, including me, before approval and consent", "Breath-holds only if approved: awake, seated, supervised, 20 s at most, never asleep", "Stop at any dizziness or discomfort", "Not a medical device; no diagnosis"], 9.05, 2.8, 3.3, 14, 0.18);
notes(s, "Protocol", 50, "This is my planned protocol. Nothing will be tested on anyone, including me, until my teacher approves the revised scope, the ethics committee approves, and consent is signed. The main test is accuracy: seated at rest, I wear my device on one finger and the reference oximeter on the other hand, and I record both oxygen and heart rate every two minutes for thirty minutes, over several sessions. Every reading must pass signal-quality checks. If approved, overnight recordings will measure signal quality and desaturation events, but those events cannot be verified because the reference oximeter does not record overnight. An optional breath-hold test, only if approved, would check whether short, awake dips are flagged; it does not test sleep apnea.");

/* ---------------- 7. THE APP ---------------- */
s = slide(false, C.OFF); eyebrow(s, "The app"); title(s, "The companion app.");
const ph = phone(s, "phone_sleep.png", 1.05, 2.05, 2.15); phone(s, "phone_live.png", 3.75, 2.05, 2.15);
caption(s, "Night report (demo data)", 0.85, 2.05 + ph + 0.15, 2.55); caption(s, "Live + device health (demo)", 3.55, 2.05 + ph + 0.15, 2.55);
bullets(s, ["Night tab: oxygen chart, flagged desaturation events, events per hour of valid recording, and % valid signal.",
  "Live tab connects to the wearable (USB or Bluetooth) and runs the device checks every second.",
  "Saving a session gives the same CSV the analysis uses, so every number can be traced.",
  "Everything shown so far is labelled demonstration data. Heart and breathing tabs are exploratory ideas."], 6.95, 2.15, 5.65, 15, 0.22);
qr(s, "qr_app.png", LINKS.app, 7.05, 5.6, 1.05);
link(s, "Open the app", LINKS.app, 8.4, 5.78, 3, 16);
T(s, "Scan to try it. A demo device is built in.", { x: 8.4, y: 6.18, w: 4.2, h: 0.3, fontSize: 12.5, color: C.GRAY });
notes(s, "The app", 30, "This is my companion app. The Night tab shows the oxygen chart, the desaturation events it flagged, the event rate per hour of valid recording and how much of the signal was valid. The Live tab connects to the wearable and runs the device checks. Everything you see so far is clearly labelled demonstration data.");

/* ---------------- 8. RESULTS TABLE ---------------- */
s = slide(false); eyebrow(s, "Results · not yet collected"); title(s, "What will be measured."); tag(s, "No real data yet");
table(s, [["Measure", "How it is calculated", "Demonstration (simulated)", "Real result"],
  ["SpO₂ agreement", "device − reference, paired every 2 min: bias, 95% limits", "+0.07 (−1.47 to +1.61) points", "pending"],
  ["Heart-rate agreement", "same pairing, in beats per minute", "−0.0 (−2.3 to +2.3) bpm", "pending"],
  ["Valid signal", "finger on, sensor-valid, 70–100%, no movement", "98% (6.88 of 7.0 h)", "pending"],
  ["Desaturation events", "≥ 3 points below a 120-s baseline for ≥ 10 s", "19 events", "pending"],
  ["Desaturation event rate", "events ÷ hours of VALID recording", "2.8 per valid hour (19 ÷ 6.88 h)", "pending"],
  ["Breath-hold dips flagged (if approved)", "flags within ±30 s of each logged hold", "not simulated", "pending"]],
  { x: 0.75, y: 2.05, w: 11.83, colW: [2.75, 4.15, 3.33, 1.6], fontSize: 13, rowH: 0.52, softCols: [1] });
card(s, 0.75, 5.95, 11.83, 0.95, "FFF4E5");
T(s, [{ text: "Demonstration values come from simulated data. ", options: { bold: true, color: "B25000" } }, { text: "They only show that the analysis works; they are not findings. The simulated “reference” was made from the same invented data. The event rate is not an apnea–hypopnea index.", options: { color: C.INK } }],
  { x: 1.05, y: 6.08, w: 11.3, h: 0.75, fontSize: 13 });
notes(s, "Results table", 40, "These are the results I will collect. I have not collected any real data yet. The table shows each measure, how it is calculated, and a demonstration value from simulated data, which only proves that my analysis code runs; they are not findings. The event rate is the number of desaturation events divided by the hours of valid signal, not hours in bed, and it is not an apnea-hypopnea index. The last column will be filled in with real results before January eleventh.");

/* ---------------- 9. DEMONSTRATION CHARTS ---------------- */
s = slide(false, C.OFF); eyebrow(s, "Results · demonstration"); title(s, "How the results will be shown."); tag(s, "Simulated data");
chartCard(s, "oxygen.png", 0.75, 2.05, 7.2, 4.2); chartCard(s, "validation.png", 8.15, 2.05, 4.43, 4.2);
caption(s, "Red bands = flagged desaturation events (simulated night)", 0.75, 6.42, 7.2);
caption(s, "Bland–Altman agreement chart (simulated pairs)", 8.15, 6.42, 4.43);
notes(s, "Demonstration charts", 30, "These two charts show how the results will be presented, using simulated data. On the left, the oxygen line with each flagged desaturation event as a red band. On the right, a Bland-Altman chart, the standard way to compare two measuring devices: each dot is a pair of readings, and the dashed lines show the range that ninety-five percent of differences fall in. With real data, that range is what tests my hypothesis.");

/* ---------------- 10. SIGNAL QUALITY ---------------- */
s = slide(false); eyebrow(s, "Method · signal quality"); title(s, "Only good readings count.");
[["Finger on the sensor", "Infrared level shows a finger is present; otherwise the reading is excluded.", C.BLUE],
 ["Sensor confidence", "The sensor marks each SpO₂ reading valid or invalid; invalid ones are excluded.", C.GREEN],
 ["Believable range", "SpO₂ outside 70–100% is excluded as an error.", C.ORANGE],
 ["Movement", "5 s on each side of a sudden movement is excluded (motion distorts the light signal).", C.PINK]].forEach((k, i) => {
  const x = 0.75 + (i % 2) * 6.02, y = 2.05 + Math.floor(i / 2) * 1.62; card(s, x, y, 5.81, 1.45); bar(s, x + 0.3, y + 0.25, k[2]);
  T(s, k[0], { x: x + 0.3, y: y + 0.4, w: 5.2, h: 0.4, fontSize: 16.5, bold: true, color: C.INK });
  T(s, k[1], { x: x + 0.3, y: y + 0.82, w: 5.2, h: 0.55, fontSize: 13, color: C.GRAY }); });
card(s, 0.75, 5.4, 11.83, 1.4, C.BLACK);
T(s, [{ text: "Desaturation event rate  =  ", options: { color: C.WHITE, bold: true } }, { text: "flagged events  ÷  hours of valid signal", options: { color: C.BLUED, bold: true } }],
  { x: 1.1, y: 5.58, w: 11.2, h: 0.5, fontSize: 21 });
T(s, "Not hours in bed and not sleep time (the device cannot measure sleep). An event may never span a gap in the valid data. Each report states the % of valid signal.",
  { x: 1.1, y: 6.15, w: 11.2, h: 0.55, fontSize: 13, color: C.GRAYD });
notes(s, "Signal quality", 35, "Only good readings count. A reading is used only if a finger is on the sensor, the sensor marks it valid, it is in a believable range, and there was no sudden movement within five seconds. The event rate is the number of flagged events divided by the hours of valid signal. It is not per hour of sleep, because my device cannot measure sleep, and every report states how much of the signal was valid.");

/* ---------------- 11. ANALYSIS: INTERPRETATION ---------------- */
s = slide(true, null, "bg_glow_corner.jpg"); eyebrow(s, "Main analysis · plan"); title(s, "How I will interpret the results.");
[["Agreement", "If 95% of SpO₂ differences fall within ±3 points of the reference at rest, the hypothesis is supported for these conditions. The reference itself is only ±2 points.", C.BLUED],
 ["Desaturation events", "A flagged event means an oxygen dip, not an apnea. Overnight events cannot be checked, because the reference cannot record overnight.", C.GREEND],
 ["Breath-hold test (if approved)", "Shows whether awake, induced dips are flagged at the logged times. It does not show that sleep apnea can be detected during sleep.", C.ORANGED],
 ["What would go against it", "Limits wider than ±3 points, a consistent bias, a low % of valid signal, or logged dips that are missed.", C.PINKD]].forEach((k, i) => {
  const x = 0.75 + (i % 2) * 6.02, y = 2.05 + Math.floor(i / 2) * 2.4; card(s, x, y, 5.81, 2.2);
  T(s, k[0], { x: x + 0.35, y: y + 0.28, w: 5.1, h: 0.45, fontSize: 19, bold: true, color: k[2] });
  T(s, k[1], { x: x + 0.35, y: y + 0.82, w: 5.1, h: 1.3, fontSize: 14, color: C.GRAYL }); });
notes(s, "Analysis: interpretation", 45, "This is how I will interpret the results. If ninety-five percent of the oxygen differences fall within three points of the reference at rest, my hypothesis is supported for those conditions, keeping in mind that the reference is itself accurate to about two points. A flagged event means an oxygen dip, not an apnea, and overnight events cannot be checked because the reference does not record overnight. The breath-hold test, if approved, shows only whether awake dips are flagged. Wider limits, a consistent bias, too little valid signal, or missed dips would count against my hypothesis.");

/* ---------------- 12. ANALYSIS: SOURCES OF ERROR ---------------- */
s = slide(true, null, "bg_glow_corner.jpg"); eyebrow(s, "Main analysis"); title(s, "Sources of error and limitations.");
T(s, "Measurement", { x: 0.75, y: 2.05, w: 5.6, h: 0.4, fontSize: 19, bold: true, color: C.BLUED });
bullets(s, ["Movement, finger pressure, cold hands and room light distort the light signal", "Pulse oximeters can be less accurate on darker skin (Sjoding et al., 2020)", "The reference oximeter is only accurate to about ±2 points", "4-second averaging can smooth very short dips"], 0.75, 2.6, 5.7, 14.5, 0.14, C.GRAYL);
T(s, "Method", { x: 6.77, y: 2.05, w: 5.6, h: 0.4, fontSize: 19, bold: true, color: C.PINKD });
bullets(s, ["Oxygen and heart rate only: no airflow, breathing effort or sleep staging, so apnea cannot be identified", "Awake rest is not the same as sleep; breath-holds are not apneas", "One participant: results cannot be generalized", "The reference cannot record overnight, so night events are unverified"], 6.77, 2.6, 5.8, 14.5, 0.14, C.GRAYL);
card(s, 0.75, 5.45, 11.83, 1.3);
s.addText([{ text: "Engineering estimate (to be measured).  ", options: { bold: true, color: C.ORANGED } }, { text: "Bluetooth draws roughly 100 mA, so a 500 mAh battery would last only about 4–5 hours. That is why prototype v1 is planned to run on USB power.", options: { color: C.WHITE } }],
  { isTextBox: true, x: 1.1, y: 5.65, w: 11.15, h: 0.95, margin: 0, fontFace: F, fontSize: 15, valign: "top" });
notes(s, "Sources of error", 40, "Sources of error in measurement: movement, finger pressure, cold hands and room light can distort the light signal; research has shown pulse oximeters can be less accurate on darker skin; and the reference is only accurate to about two points. In the method: my device measures only oxygen and heart rate, so it cannot identify apnea; sitting awake is not the same as sleep, and a breath-hold is not an apnea; there is only one participant; and overnight events cannot be verified. I also estimated that a small battery would last only four to five hours, which is why the first prototype is planned to use USB power; I still have to measure that.");

/* ---------------- 13. STATUS ---------------- */
s = slide(false); eyebrow(s, "Project status"); title(s, "What is done, and what is planned.");
card(s, 0.75, 2.05, 5.81, 4.7); card(s, 6.77, 2.05, 5.81, 4.7);
T(s, "Done", { x: 1.1, y: 2.28, w: 5.1, h: 0.4, fontSize: 19, bold: true, color: C.GREEN });
bullets(s, ["Design, parts list and build guide", "Firmware written (not yet run on hardware)", "Analysis software and simulator, tested on simulated data", "App and 3D model", "Original proposal submitted (Sep 25); revised proposal and ethics package drafted"], 1.1, 2.8, 5.2, 13.5, 0.14);
T(s, "Planned or pending", { x: 7.12, y: 2.28, w: 5.1, h: 0.4, fontSize: 19, bold: true, color: C.ORANGE });
bullets(s, ["Ms. Ireland’s approval of the revised scope", "Ethics approval and signed consent", "Build and check the prototype", "Accuracy sessions against the reference", "Overnight recordings and optional breath-hold test (if approved)", "Real results and analysis (by January 11)"], 7.12, 2.8, 5.2, 13.5, 0.14);
notes(s, "Status", 35, "To be clear about where the project stands: the design, firmware, analysis software, app and 3D model are done, and the software has been tested only on simulated data. Still pending are my teacher's approval of the revised scope, ethics approval and consent, building the prototype, and all of the real measurements.");

/* ---------------- 14. CONCLUSION ---------------- */
s = slide(true, null, "bg_glow_low.jpg"); eyebrow(s, "Conclusion"); title(s, "No conclusion yet.", { fontSize: 54, h: 1.1 });
T(s, "No real data has been collected, so the hypothesis has not been tested. This slide will be written after the accuracy sessions.",
  { x: 0.75, y: 2.15, w: 11.8, h: 0.8, fontSize: 19, color: C.GRAYL });
T(s, "What this project will be able to show", { x: 0.75, y: 3.2, w: 7.6, h: 0.4, fontSize: 17, bold: true, color: C.WHITE });
bullets(s, ["How closely the wearable agrees with a reference oximeter at rest", "How much of a recording gives a valid signal", "Whether flagged desaturation events match logged dips (if approved)"], 0.75, 3.7, 7.5, 14.5, 0.12, C.GRAYL);
T(s, "What it cannot show", { x: 0.75, y: 5.05, w: 7.6, h: 0.4, fontSize: 17, bold: true, color: C.WHITE });
bullets(s, ["Whether anyone has, or does not have, sleep apnea"], 0.75, 5.55, 7.5, 14.5, 0.12, C.GRAYL);
qr(s, "qr_app.png", LINKS.app, 8.95, 3.4, 1.45); qr(s, "qr_3d.png", LINKS.d3, 10.98, 3.4, 1.45);
T(s, "App", { x: 8.95, y: 5.0, w: 1.45, h: 0.3, align: "center", fontSize: 13, color: C.GRAYD });
T(s, "3D model", { x: 10.98, y: 5.0, w: 1.45, h: 0.3, align: "center", fontSize: 13, color: C.GRAYD });
T(s, "Thank you. Questions?", { x: 0.75, y: 6.3, w: 11.8, h: 0.6, fontSize: 28, bold: true, color: C.WHITE });
notes(s, "Conclusion", 30, "I do not have a conclusion yet, because no real data has been collected. After the accuracy sessions, this project will show how closely the wearable agrees with a reference oximeter at rest, how much of a recording gives a valid signal, and, if approved, whether flagged dips match logged ones. It cannot show whether anyone has sleep apnea. Thank you; I am happy to take questions.");

/* ================= APPENDIX (in slides, not presented) ================= */
const atitle = (s, t) => title(s, t, { fontSize: 30, h: 0.7 });
s = slide(false); appendix(s); eyebrow(s, "Appendix A · Materials"); atitle(s, "Parts, exact sizes and where to buy.");
const L = (t, u) => ({ text: t, options: { hyperlink: { url: u, tooltip: u }, color: C.BLUE } });
const parts = [
  ["AITRIP ESP32 ESP-WROOM-32 (30-pin, CP2102, USB-C)", "≈ 52 × 28 mm · pins pre-soldered", "Processor + Bluetooth Classic", "https://www.amazon.ca/AITRIP-ESP-WROOM-32-Development-Microcontroller-Compatible/dp/B0DF2YJSHN"],
  ["HiLetgo MAX30102 sensor", "14 × 14 mm · 4 pins to solder", "SpO₂ + heart rate (finger clip)", "https://www.amazon.ca/HiLetgo-MAX30102-Breakout-Oximetry-Solution/dp/B07QC67KMQ"],
  ["SHILLEHTEK GY-521 MPU-6050, pre-soldered (2-pack)", "≈ 21 × 16 mm", "Movement check + position (exploratory)", "https://www.amazon.ca/Pre-Soldered-Accelerometer-Raspberry-Compatible-Arduino/dp/B0BMY15TC4"],
  ["ELEGOO 120 Dupont jumper wires (F-F, M-F, M-M)", "20 cm each", "Plug-in wiring, no soldering", "https://www.amazon.ca/Elegoo-120pcs-Multicolored-Breadboard-arduino/dp/B01EV70C78"],
  ["Running armband phone pouch", "fits phones up to 6.9 in", "Holds the ESP32 on the forearm", "https://www.amazon.ca/Running-Armband-Samsung-Resistant-Emergency/dp/B08HZ3BPK4"],
  ["Anker Powerline+ USB-A to USB-C cable", "3 m (10 ft)", "All-night power from a phone charger", "https://www.amazon.ca/Anker-Powerline-Double-Braided-Charging-Samsung/dp/B07G148YMS"],
  ["Anker USB-C to USB-A adapter (2-pack)", "USB-C → USB-A", "Plug the cable into a MacBook", "https://www.amazon.ca/Adapter-Anker-High-Speed-Transfer-Notebook/dp/B08HZ6PS61"],
  ["VELCRO Brand 1 in × 30 ft roll", "25 mm wide · cut ≈ 80 mm", "Finger loop", "https://www.amazon.ca/VELCRO-Brand-VEL-30768-AMS-Self-Gripping-Organization/dp/B09QH2NVM1"],
  ["Elite Medica fingertip pulse oximeter", "confirm Health Canada licence", "Reference for the accuracy test", "https://www.amazon.ca/Elite-Medica-Fingertip-Saturation-Batteries/dp/B0DSGP91PB"]];
table(s, [["Part", "Size", "Purpose", "Buy"]].concat(parts.map((r) => [r[0], r[1], r[2], { text: [L("Amazon.ca ›", r[3])] }])),
  { x: 0.75, y: 1.75, w: 11.83, colW: [4.4, 3.3, 2.83, 1.3], fontSize: 11.5, rowH: 0.43, softCols: [1, 2] });
T(s, "Every part is on Amazon.ca (click Buy). Prices change and several items are multi-packs. Only the MAX30102’s 4 header pins need soldering (about 5 minutes); everything else plugs in.", { x: 0.75, y: 6.45, w: 11.8, h: 0.5, fontSize: 11.5, color: C.GRAY });
notes(s, "Appendix A — materials", 0, "Appendix — not presented. Full parts list with exact dimensions and links.");

s = slide(false); appendix(s); eyebrow(s, "Appendix B · Full protocol (planned)"); atitle(s, "Full experimental protocol (planned, not yet started).");
const proto = [
  ["Approvals first.", "Ms. Ireland approves the revised scope, the ethics committee approves, and informed consent is signed (participant and parent/guardian). No data is collected from anyone, including me, before all three."],
  ["Build and device check.", "MAX30102 → 3V3 / GND / GPIO 21 / 22; GY-521 → VIN / GND / SDA→GPIO 33 / SCL→GPIO 32 (two separate I²C buses); USB power. check_device.py must report READY before every session."],
  ["Accuracy sessions (main test).", "Seated, awake, at rest, warm hands. Wearable on one index finger, reference oximeter on the other hand. Every 2 min: time, reference SpO₂ and heart rate (15 pairs per 30-min session); several sessions on different days. validate.py: bias, 95% limits of agreement, mean absolute difference."],
  ["Signal-quality checks.", "Each 1-s reading counts only if a finger is present, the sensor marks it valid, SpO₂ is 70–100%, and there is no sudden movement within 5 s. Every report states the % of valid signal."],
  ["Overnight recordings (only if approved).", "% valid signal and desaturation events per hour of valid recording. The reference cannot record overnight, so these events cannot be verified. The rate is not an apnea–hypopnea index."],
  ["Breath-hold test (optional, only if approved).", "Awake, seated, adult-supervised, holds of at most 20 s, stop at any discomfort; start and end times logged. Tests only whether induced dips are flagged; it does not validate detecting sleep apnea during sleep."],
  ["Analysis.", "analyze.py (events, valid hours) and validate.py (agreement). Position, heart-rate and breathing-rate scripts are exploratory (Appendix D) and are not used to test the hypothesis."],
  ["Controls.", "Same participant, finger and cuff tightness, room and lighting, firmware, reference oximeter and detection settings (3-point drop, ≥ 10 s, 120-s baseline)."]];
proto.forEach((t, i) => { const y = 1.68 + i * 0.67;
  T(s, String(i + 1), { x: 0.75, y, w: 0.4, h: 0.4, fontSize: 14, bold: true, color: i === 0 ? C.RED : C.BLUE });
  s.addText([{ text: t[0] + "  ", options: { bold: true, color: C.INK } }, { text: t[1], options: { color: C.GRAY } }],
    { isTextBox: true, x: 1.2, y, w: 11.4, h: 0.6, margin: 0, fontFace: F, fontSize: 12, valign: "top" }); });
notes(s, "Appendix B — protocol", 0, "Appendix — not presented. Planned step-by-step protocol, including approvals, signal-quality checks and controls. None of these steps has been carried out yet.");

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
notes(s, "Appendix C — design plans", 0, "Appendix — not presented. Prototype v1 wiring table, and the planned v2 case layout with layer heights. Neither has been built yet.");

s = slide(false); appendix(s); eyebrow(s, "Appendix D · Exploratory ideas"); atitle(s, "Exploratory ideas (simulated data only).");
table(s, [["Idea (script)", "Demonstration output (simulated)", "Why it is not a finding"],
  ["Body position (position.py)", "events per valid hour: back 3.8, stomach 3.2, left 1.3, right 1.1", "simulated; few hours per position; not an apnea measure"],
  ["Machine-learning flagger (train_model.py)", "recall 0.63 vs rule-based 0.63, on simulated labels", "labels are invented; breath-hold labels would not validate apnea detection"],
  ["Heart-rate patterns (heart.py)", "1 fast stretch (> 100 bpm), 1 very slow, 1 unsteady", "per-second optical heart rate cannot identify arrhythmias"],
  ["Breathing-rate estimate (signals.py, asthma.py)", "13.5 breaths/min; higher late in the simulated night", "estimated from heart-rate rhythm, never measured; cannot detect asthma"],
  ["Device check (check_device.py)", "simulated device: healthy → READY; broken motion sensor → NOT READY", "not yet run on real hardware"]],
  { x: 0.75, y: 1.75, w: 11.83, colW: [3.4, 4.4, 4.03], fontSize: 12, rowH: 0.6, softCols: [2] });
card(s, 0.75, 5.5, 11.83, 0.62, "FFF4E5");
T(s, [{ text: "Demonstration data only. ", options: { bold: true, color: "B25000" } }, { text: "These ideas are outside the revised scope and are not used to test the hypothesis.", options: { color: C.INK } }],
  { x: 1.05, y: 5.66, w: 11.3, h: 0.35, fontSize: 12.5 });
link(s, "All code, data tools and raw CSV format on GitHub", LINKS.code, 0.75, 6.32, 8, 13.5);
link(s, "Build guide: buy, build, connect", LINKS.build, 0.75, 6.68, 8, 13.5);
notes(s, "Appendix D — exploratory ideas", 0, "Appendix — not presented. Exploratory analyses shown only on simulated demonstration data. None of these numbers is a finding, and none of these ideas is part of the revised research question.");

s = slide(false); appendix(s); eyebrow(s, "Bibliography · APA"); atitle(s, "References.");
["American Academy of Sleep Medicine. (2014). International classification of sleep disorders (3rd ed.).",
 "Benjafield, A. V., et al. (2019). Estimation of the global prevalence and burden of obstructive sleep apnoea: A literature-based analysis. The Lancet Respiratory Medicine, 7(8), 687–698.",
 "Berry, R. B., et al. (2012). Rules for scoring respiratory events in sleep. Journal of Clinical Sleep Medicine, 8(5), 597–619.",
 "Bland, J. M., & Altman, D. G. (1986). Statistical methods for assessing agreement between two methods of clinical measurement. The Lancet, 327(8476), 307–310.",
 "International Organization for Standardization. (2017). Medical electrical equipment — Part 2-61: Particular requirements for basic safety and essential performance of pulse oximeter equipment (ISO 80601-2-61:2017).",
 "Jubran, A. (2015). Pulse oximetry. Critical Care, 19, 272.",
 "Kapur, V. K., et al. (2017). Clinical practice guideline for diagnostic testing for adult obstructive sleep apnea. Journal of Clinical Sleep Medicine, 13(3), 479–504.",
 "Maxim Integrated. (2020). MAX30102 high-sensitivity pulse oximeter and heart-rate sensor [Datasheet].",
 "Sjoding, M. W., Dickson, R. P., Iwashyna, T. J., Gay, S. E., & Valley, T. S. (2020). Racial bias in pulse oximetry measurement. New England Journal of Medicine, 383(25), 2477–2478.",
 "Task Force of the European Society of Cardiology and NASPE. (1996). Heart rate variability: Standards of measurement, physiological interpretation, and clinical use. Circulation, 93(5), 1043–1065."]
  .forEach((r, i) => T(s, r, { x: 0.75, y: 1.75 + i * 0.52, w: 11.8, h: 0.5, fontSize: 12, color: C.GRAY }));
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
