const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle,
  Table, TableRow, TableCell, WidthType, ShadingType, LevelFormat, PageBreak,
  Footer, PageNumber, TableLayoutType,
} = require('docx');
const fs = require('fs');

const NAVY = "12414C", TEAL = "1F8A9C", GREY = "555F6B", LINE = "C3CDDA", TINT = "EAF4F6", WARN = "FBF2DF";
const W = 10080; // content width (Letter, 0.75" margins)

// ---------- helpers ----------
const run = (text, o = {}) => new TextRun({ text, size: 21, ...o });
const fill = (text) => new TextRun({ text, size: 21, shading: { type: ShadingType.CLEAR, fill: "FFE97A", color: "auto" }, bold: true });
function P(parts, o = {}) {
  if (typeof parts === "string") parts = [run(parts)];
  return new Paragraph({ spacing: { after: 100, line: 276 }, ...o, children: parts });
}
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: t })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 }, children: [new TextRun({ text: t })] });
const bullet = (parts) => P(typeof parts === "string" ? [run(parts)] : parts, { numbering: { reference: "dots", level: 0 }, spacing: { after: 60, line: 264 } });
const num = (ref, parts) => P(typeof parts === "string" ? [run(parts)] : parts, { numbering: { reference: ref, level: 0 }, spacing: { after: 60, line: 264 } });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
function box(parts, color = TINT) {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: color, color: "auto" },
      margins: { top: 120, bottom: 120, left: 180, right: 180 },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                 left: { style: BorderStyle.SINGLE, size: 24, color: color === WARN ? "C98A1E" : TEAL } },
      children: parts.map((p) => (p instanceof Paragraph ? p : P(p))),
    })] })],
  });
}
function table(widths, header, rows, o = {}) {
  const cell = (c, i, head) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    shading: head ? { type: ShadingType.CLEAR, fill: NAVY, color: "auto" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: (Array.isArray(c) ? c : [c]).map((t) => t instanceof Paragraph ? t :
      new Paragraph({ spacing: { after: 0, line: 252 }, children: [new TextRun({ text: String(t), size: o.size || 19, bold: head, color: head ? "FFFFFF" : undefined })] })),
  });
  const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED,
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: [new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, i, true)) })]
      .concat(rows.map((r) => new TableRow({ height: o.rowH ? { value: o.rowH, rule: "atLeast" } : undefined, children: r.map((c, i) => cell(c, i, false)) }))),
  });
}
const blankRows = (n, cols, first) => Array.from({ length: n }, (_, i) => Array.from({ length: cols }, (_, j) => (j === 0 ? (first ? first(i) : String(i + 1)) : "")));
function field(label, width = 4200) {
  return new Paragraph({ spacing: { before: 120, after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY, space: 2 } },
    children: [run(label + "  ", { bold: true, color: NAVY })] });
}

// ---------- content ----------
const kids = [];

// Title
kids.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Night Signal: ethics submission package (revised scope)", bold: true, size: 40, color: NAVY })] }));
kids.push(new Paragraph({ spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: NAVY, space: 6 } },
  children: [run("Gabriel Mamane · Science Fair 2027 · Human participants · Due ", { color: GREY }), run("October 13", { bold: true, color: GREY })] }));

kids.push(box([
  P([run("Status of this draft", { bold: true, color: "8A5A00", size: 23 })]),
  P([run("This package reflects the revised scope proposed to Ms. Ireland (wearable measurement accuracy and oxygen desaturation detection). "),
    run("Her approval of that scope is still pending. ", { bold: true }),
    run("No approval, certificate, consent or signature has been obtained yet, and no data has been collected from anyone. Nothing in this package should be submitted until the student has checked it and confirmed with Ms. Ireland.")]),
], WARN));
kids.push(P(""));

kids.push(box([
  P([run("How to use this package", { bold: true, color: NAVY, size: 23 })]),
  num("use", "Confirm with Ms. Ireland that the revised scope is accepted (or ask whether the ethics submission should go ahead in parallel)."),
  num("use", [run("Fill in every "), fill("yellow"), run(" box: grade, supervisor's name, school and contact details.")]),
  num("use", [run("Go to "), run("approbation.technoscience.ca", { bold: true }), run(" and answer the pre-questionnaire. Section 1 lists the questions it will most likely ask; check them against the real platform.")]),
  num("use", "When the platform asks for the ethics form, use sections 2 to 4 (summary, protocol, risk assessment), and attach the blank data sheets in section 6."),
  num("use", [run("Wait for the Certificate of Approval and signed consent", { bold: true }), run(" before any recorded test, even on yourself. Building the device and checking the electronics without wearing it can happen before then, if Ms. Ireland agrees.")]),
]));
kids.push(P(""));
kids.push(P([run("Note: ", { bold: true }), run("the approval website could not be opened while preparing this draft, so section 1 is a best guess at its questions. The rest follows what Technoscience asks for: protocol, risk assessment, data collection tools, supervisor details and consent.", { color: GREY })]));

// 0. To fill in
kids.push(H1("0. Fill in before you submit"));
kids.push(table([3600, 6480], ["Item", "Your answer"], [
  ["Exhibitor", "Gabriel Mamane"],
  ["Grade / school", [P([fill("Grade __ · school name")], { spacing: { after: 0 } })]],
  ["Scientific supervisor (adult)", [P([fill("Name and role (confirm who this is)")], { spacing: { after: 0 } })]],
  ["Supervisor's institution and contact", [P([fill("School name, address, email, phone")], { spacing: { after: 0 } })]],
  ["Project title", "Night Signal: SpO2 Accuracy (revised; original title was “Night Signal: Apnea Detector”)"],
  ["Category", "Health and Medical Sciences · Experimental project"],
  ["Planned test dates", "Only after scope approval, ethics approval and signed consent; target October to December (before the January 11 final slides)"],
], { size: 20 }));

// 1. Pre-questionnaire
kids.push(H1("1. Pre-questionnaire: likely questions and your answers"));
kids.push(table([4700, 5380], ["Question", "Answer"], [
  ["Does the project involve human participants, including yourself?", "Yes. Me (the exhibitor). Optionally up to 4 adult volunteers for one 30-minute seated accuracy session, only if Ms. Ireland and the ethics committee agree."],
  ["Is there a questionnaire or survey?", "No survey. Only a short yes/no comfort check after each session (sheet D)."],
  ["Are biological samples taken (blood, saliva, tissue)?", "No. The sensor shines light on the fingertip, like a store-bought pulse oximeter. Nothing enters the body."],
  ["Animals?", "No."],
  ["Hazardous chemicals, microorganisms or radiation?", "No."],
  ["Electricity or hazardous equipment?", "Low voltage only: 5 V from a standard USB phone charger. There is no battery in the prototype and no mains wiring."],
  ["Physical activity or discomfort?", "Optional, only if approved: short voluntary breath-holds (20 seconds at most) by the exhibitor only, seated, awake and supervised by an adult."],
  ["Is it a medical device or a diagnosis?", "No. It is an educational prototype. It cannot diagnose or confirm sleep apnea or any other condition, and is never used to treat anyone."],
  ["Risk level", "Low: no greater than everyday life (see section 4)."],
], { size: 19 }));

// 2. Summary
kids.push(H1("2. Project summary"));
kids.push(P("Pulse oximeters estimate blood oxygen saturation (SpO₂) by shining red and infrared light through the fingertip. A short drop in SpO₂ is called an oxygen desaturation. Desaturations can happen during sleep apnea, but they also have other causes (movement, poor sensor contact, other conditions), and not every apnea causes a large drop. Diagnosing sleep apnea requires a sleep study that also measures airflow, breathing effort and sleep."));
kids.push(P("This project builds a low-cost wearable from an ESP32 microcontroller and a MAX30102 fingertip light sensor (with an MPU-6050 motion sensor used to exclude readings taken during movement). It records SpO₂ and heart rate once per second. The project measures how closely these readings agree with a separate Health Canada-licensed fingertip pulse oximeter, and whether software can reliably flag oxygen desaturation events in the wearable's own recordings."));
kids.push(box([P([run("What this project cannot do. ", { bold: true }), run("It measures only oxygen and heart rate. It cannot detect, diagnose or confirm sleep apnea, and it does not calculate an apnea–hypopnea index (AHI). Any event rate is reported as flagged desaturation events per hour of valid recording.")])]));
kids.push(P(""));
kids.push(P([run("Question: ", { bold: true }), run("How closely do SpO₂ and heart-rate readings from a low-cost wearable (MAX30102 + ESP32) agree with a Health Canada-licensed fingertip pulse oximeter, and can software reliably flag oxygen desaturation events (a drop of 3 percentage points or more lasting at least 10 seconds) in the wearable's recordings?")]));
kids.push(P([run("Hypothesis: ", { bold: true }), run("If the wearable is worn correctly and only good-quality readings are used, then its SpO₂ will agree with the reference oximeter within about ±3 percentage points (95% limits of agreement), because both measure red/infrared light absorption, and the software will flag the dips that the reference also shows.")]));

// 3. Protocol
kids.push(H1("3. Research protocol (planned; nothing has been carried out yet)"));
kids.push(H2("3.1 Participants"));
kids.push(table([1500, 3000, 5580], ["Code", "Who", "Takes part in"], [
  ["P1", "Gabriel Mamane (exhibitor, minor)", "Accuracy sessions; if approved, the optional breath-hold test and overnight recordings. Parent/guardian consent required."],
  ["P2 to P5", "Optional: up to 4 adult volunteers (18+), e.g. family members, only if approved.", "Accuracy session only (30 min, seated, awake). No breath-holds, no nights."],
], { size: 19 }));
kids.push(P(""));
kids.push(P([run("Who can take part: ", { bold: true }), run("healthy and with no known heart or lung disease. People with a history of fainting are not included.")]));
kids.push(P([run("Who cannot take part: ", { bold: true }), run("anyone who does not want to, or who feels unwell on the day. Taking part is voluntary, and anyone can stop at any time without giving a reason.")]));

kids.push(H2("3.2 Equipment"));
kids.push(bullet("Night Signal wearable: ESP32 board, MAX30102 fingertip sensor in a Velcro cuff, MPU-6050 motion sensor, powered by a 5 V USB phone charger."));
kids.push(bullet([run("Reference: a fingertip pulse oximeter with a Health Canada medical device licence ("), fill("model and licence number to confirm"), run("). Its stated accuracy is about ±2 percentage points, so the comparison measures agreement between two devices, not absolute truth.")]));
kids.push(bullet("Laptop with the recording and analysis software; a timer; the blank data sheets (section 6); alcohol wipes."));

kids.push(H2("3.3 Procedures"));
kids.push(P([run("A. Device check (no participant). ", { bold: true }), run("Before every session I run check_device.py, which confirms that data arrives every second, both sensors pass their self-test and readings are in a normal range. The session continues only if the device reports READY.")]));
kids.push(P([run("B. Accuracy sessions: the main test (P1, and volunteers if approved; about 35 min each). ", { bold: true }), run("The participant sits and rests for 5 minutes with warm hands. They wear the wearable on one index finger and the reference oximeter on the other hand. Every 2 minutes for 30 minutes, I write down the time and both devices' SpO₂ and pulse on sheet A (15 pairs per session). They breathe normally throughout. P1 repeats this on several different days.")]));
kids.push(P([run("C. Signal-quality checks (data processing, no participant). ", { bold: true }), run("A one-second reading is used only if a finger is detected, the sensor marks the reading valid, SpO₂ is between 70 and 100%, and there was no sudden movement within 5 seconds. Each report states the percentage of valid signal. Agreement is calculated as bias, 95% limits of agreement and mean absolute difference (Bland–Altman method).")]));
kids.push(P([run("D. Breath-hold test (optional; P1 only; only if approved; about 45 min; adult supervisor present). ", { bold: true }),
  run("Seated and awake, after 2 minutes of normal breathing, I do short voluntary breath-holds: up to 5 each of 10, 15 and 20 seconds, with at least 2 minutes of normal breathing between holds. The supervisor times them and logs the start and end of each hold on sheet B. "),
  run("Purpose and limit: ", { bold: true }),
  run("this only checks whether the software flags short, deliberately induced dips at the logged times. An awake breath-hold is not a sleep apnea, so this test does not validate detecting sleep apnea during sleep. Short holds may not lower SpO₂ by 3 points; if so, that is reported, and holds are never made longer. Rules:")]));
kids.push(bullet("Never longer than 20 seconds, always seated, never standing or in water, and never while asleep."));
kids.push(bullet("Stop immediately if there is any dizziness, discomfort or tingling. Stop the whole session if the reference oximeter reads below 90%."));
kids.push(P([run("E. Overnight recordings (optional; P1 only; only if approved; up to 5 nights at home). ", { bold: true }),
  run("I wear the cuff on my index finger and the armband pouch on my forearm during my normal sleep. Nothing about my sleep is changed. The USB cable runs along my arm to the side of the bed, never near the neck, and is clipped to the mattress. I can take it off at any time. Each morning I fill in sheet C and the comfort check (sheet D). These recordings measure only the percentage of valid signal and the number of flagged desaturation events per hour of valid recording; because the reference oximeter does not record overnight, these events cannot be verified, and they are not interpreted as apneas.")]));

kids.push(H2("3.4 Data and privacy"));
kids.push(bullet("Recorded: blood oxygen (%), heart rate, motion (used to exclude readings during movement), finger-contact flag and the time. No names, photos of faces or other personal information."));
kids.push(bullet("Each participant gets a code (P1 to P5). The list linking codes to names is kept on paper by the supervisor, not with the data."));
kids.push(bullet("Data stays on my own laptop and is not uploaded or shared. Only I and my supervisor see the raw data."));
kids.push(bullet("Results are shown as anonymous graphs and averages. Volunteers' data is deleted after the science fair, or sooner on request."));

kids.push(H2("3.5 If a reading looks unusual"));
kids.push(P("The wearable is an educational prototype and I do not interpret anyone's health. If the reference oximeter shows a resting value below 92%, the session stops and the participant (and parent/guardian for a minor) is advised to speak to a doctor. If my own night recordings show many oxygen dips, I will tell my parents. The device cannot say whether anyone has sleep apnea; at most, such a result is a reason to ask a doctor."));

// 4. Risk assessment
kids.push(H1("4. Risk assessment"));
kids.push(table([2300, 1000, 1150, 1150, 4480], ["Possible risk", "Who", "Likelihood", "Severity", "How it is prevented"], [
  ["Light-headedness during breath-holds (optional test)", "P1", "Low", "Minor", "Only if approved. Holds of 20 s or less, seated, 2 min rest between holds, adult present, stop at any discomfort, stop the session below 90% on the reference oximeter. Never while asleep."],
  ["Skin irritation or pressure from the finger cuff", "All", "Low", "Minor", "Cuff snug, not tight. Remove it at any numbness or tingling, and check the skin after each session."],
  ["Electrical", "All", "Very low", "Minor", "5 V USB from a certified phone charger. No battery, no mains wiring, insulated and taped connections."],
  ["Cable at night (tangling or tripping; optional nights)", "P1", "Low", "Moderate", "The cable runs along the arm to the side of the bed, never near the neck, and is clipped to the mattress. It can be removed at any time."],
  ["Poor sleep or discomfort (optional nights)", "P1", "Medium", "Minor", "The device can be removed at any time. Nights are not scheduled before tests or exams."],
  ["Hygiene (shared sensor)", "Volunteers", "Low", "Minor", "Sensor and cuff wiped with alcohol between people."],
  ["Privacy of health data", "All", "Low", "Minor", "Coded IDs, data kept only on my laptop, anonymous results, deletion after the fair."],
  ["Worry or false reassurance about a result", "All", "Low", "Minor", "It is explained beforehand that this is not a medical test and cannot detect or rule out sleep apnea. Unusual readings mean seeing a doctor, not a diagnosis."],
], { size: 18 }));
kids.push(P(""));
kids.push(box([P([run("Overall: low risk. ", { bold: true }), run("The main test is sitting still with two fingertip sensors, which is what a pharmacy pulse oximeter does. The optional breath-hold test is limited to 20 seconds, seated and supervised, and happens only if approved.")])]));

// 5. Information and consent
kids.push(pageBreak());
kids.push(H1("5. Participant information and consent"));
kids.push(box([P([run("Draft for review. If Technoscience's Certificate of Approval is used as the consent form, give this page to each participant to read before they sign it. Keep this version as well for the parent/guardian signature for a minor. No one should sign until the project has been approved.", { color: GREY })])], WARN));
kids.push(P(""));
kids.push(P([run("Project: ", { bold: true }), run("Night Signal, a science fair project by Gabriel Mamane that tests how closely a low-cost fingertip sensor measures blood oxygen and pulse compared with a store-bought pulse oximeter.")]));
kids.push(P([run("What you would do: ", { bold: true }), run("sit and rest for about 35 minutes while wearing a soft fingertip sensor on one hand and a store-bought pulse oximeter on the other. Every 2 minutes, both readings are written down. (The optional breath-hold test and night recordings are done only by the student, and only if approved.)")]));
kids.push(P([run("Risks: ", { bold: true }), run("very low. The sensor shines a little red and infrared light on the fingertip, like a pharmacy pulse oximeter. The cuff may feel tight: tell me and it comes off right away.")]));
kids.push(P([run("Benefits: ", { bold: true }), run("none directly for you. You help measure how accurate a low-cost oxygen sensor is.")]));
kids.push(P([run("Your rights: ", { bold: true }), run("taking part is voluntary. You can stop at any time, without giving a reason. You can ask for your data to be deleted.")]));
kids.push(P([run("Privacy: ", { bold: true }), run("your readings are stored under a code (for example P3), never with your name. Results are shown only as anonymous averages and graphs, and your data is deleted after the science fair.")]));
kids.push(P([run("Not a medical test: ", { bold: true }), run("this is a student prototype. It cannot tell you anything about your health and cannot detect or rule out sleep apnea. If the store-bought oximeter shows an unusual value, you will be advised to talk to a doctor.")]));
kids.push(P([run("Questions: ", { bold: true }), run("Gabriel Mamane, or the supervisor: "), fill("name, email")]));
kids.push(P(""));
kids.push(P([run("I have read this information, my questions have been answered, and I agree to take part.", { bold: true })]));
for (const l of ["Participant name and code", "Participant signature                                                      Date", "Parent/guardian name (if the participant is under 18)", "Parent/guardian signature                                                Date", "Student (Gabriel Mamane) signature                                  Date"]) kids.push(field(l));

// 6. Data collection tools
kids.push(pageBreak());
kids.push(H1("6. Data collection tools (blank)"));
kids.push(H2("Sheet A: Accuracy session"));
kids.push(P([run("Participant code ____   Session # ____   Date ____________   Start time ______   Room temperature ____ °C   Wearable on: L / R index finger   Device check READY? Y / N", { size: 19 })]));
kids.push(table([900, 1200, 1700, 1700, 1600, 1500, 1480], ["#", "Minute", "Reference SpO₂ %", "Reference pulse", "Device SpO₂ %", "Device pulse", "Notes (movement, cold hands…)"],
  blankRows(16, 7).map((r, i) => { r[1] = String(i * 2); return r; }), { size: 18, rowH: 340 }));

kids.push(pageBreak());
kids.push(H2("Sheet B: Breath-hold test (optional; P1 only; only if approved; supervised)"));
kids.push(P([run("Date ____________   Supervisor ______________________   Resting reference SpO₂ before starting ____ %", { size: 19 })]));
const targets = [10, 10, 10, 10, 10, 15, 15, 15, 15, 15, 20, 20, 20, 20, 20];
kids.push(table([700, 1100, 1500, 1500, 1500, 1680, 2100], ["#", "Target (s)", "Start time", "End time", "Felt OK? (Y/N)", "Lowest ref. SpO₂ %", "Notes"],
  blankRows(15, 7).map((r, i) => { r[1] = String(targets[i]); return r; }), { size: 18, rowH: 340 }));
kids.push(P(""));
kids.push(P([run("Stop rules: stop immediately at any dizziness, discomfort or tingling. Stop the session if the reference oximeter reads below 90%. Hold for 20 seconds at most. Always seated. This test checks dip flagging only; it is not a test of sleep apnea.", { italics: true, color: GREY, size: 19 })]));

kids.push(H2("Sheet C: Night log (optional; P1 only; only if approved)"));
kids.push(table([900, 1300, 1200, 1200, 1500, 1500, 1100, 1380], ["Night", "Date", "Bedtime", "Wake time", "Device READY? (Y/N)", "Removed during night?", "Comfort 1–5", "Notes"],
  blankRows(5, 8), { size: 18, rowH: 420 }));

kids.push(H2("Sheet D: Comfort and safety check (after every session)"));
kids.push(table([1300, 1500, 1500, 1700, 1700, 2380], ["Date", "Code", "Dizziness? (Y/N)", "Skin redness? (Y/N)", "Numbness / tingling? (Y/N)", "Action taken / notes"],
  blankRows(8, 6, () => ""), { size: 18, rowH: 380 }));

// ---------- document ----------
const doc = new Document({
  creator: "Gabriel Mamane",
  title: "Night Signal - Ethics submission package (revised scope, draft)",
  styles: {
    default: { document: { run: { font: "Calibri", size: 21 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, color: NAVY, font: "Calibri" }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 23, bold: true, color: TEAL, font: "Calibri" }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [
    { reference: "dots", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
    { reference: "use", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 460, hanging: 300 } } } }] },
  ] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
      new TextRun({ text: "Night Signal · ethics package (revised scope, draft for review) · page ", size: 16, color: GREY }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY })] })] }) },
    children: kids,
  }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(process.argv[2], b); console.log("wrote", process.argv[2]); });
