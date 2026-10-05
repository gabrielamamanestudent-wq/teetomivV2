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
kids.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Night Signal: ethics submission package", bold: true, size: 40, color: NAVY })] }));
kids.push(new Paragraph({ spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: NAVY, space: 6 } },
  children: [run("Gabriel Mamane · Science Fair 2027 · Human participants · Due ", { color: GREY }), run("October 13", { bold: true, color: GREY })] }));

kids.push(box([
  P([run("How to use this package", { bold: true, color: NAVY, size: 23 })]),
  num("use", [run("Go to "), run("approbation.technoscience.ca", { bold: true }), run(" and answer the pre-questionnaire. The likely questions and your answers are in section 1.")]),
  num("use", "When the platform asks for the ethics form, copy and paste sections 2 to 4 (summary, protocol, risk assessment)."),
  num("use", "Attach the blank data sheets in section 6 (the platform asks for all blank data collection tools)."),
  num("use", [run("Fill in every "), fill("yellow"), run(" box first: your supervisor's name, school and contact details.")]),
  num("use", [run("Wait for the Certificate of Approval", { bold: true }), run(" before any recorded test, even on yourself. You can build the device and check that the electronics work before then.")]),
]));
kids.push(P(""));
kids.push(P([run("Note: ", { bold: true }), run("the approval website could not be opened from here, so section 1 lists the questions it will most likely ask. The rest follows what Technoscience asks for: protocol, risk assessment, data collection tools, supervisor details and consent.", { color: GREY })]));

// 0. To fill in
kids.push(H1("0. Fill in before you submit"));
kids.push(table([3600, 6480], ["Item", "Your answer"], [
  ["Exhibitor", "Gabriel Mamane"],
  ["Grade / school", [P([fill("Grade __ · school name")], { spacing: { after: 0 } })]],
  ["Scientific supervisor (adult)", [P([fill("Name, role (e.g. science teacher)")], { spacing: { after: 0 } })]],
  ["Supervisor's institution and contact", [P([fill("School name, address, email, phone")], { spacing: { after: 0 } })]],
  ["Project title", "Night Signal: Apnea Detector"],
  ["Category", "Health and Medical Sciences · Experimental project"],
  ["Planned test dates", "After approval: October to December (before the January 11 final slides)"],
], { size: 20 }));

// 1. Pre-questionnaire
kids.push(H1("1. Pre-questionnaire: likely questions and your answers"));
kids.push(table([4700, 5380], ["Question", "Answer"], [
  ["Does the project involve human participants, including yourself?", "Yes. Me (the exhibitor), plus up to 4 adult volunteers for one 30-minute awake test (optional)."],
  ["Is there a questionnaire or survey?", "No survey. Only a short yes/no comfort check after each session (sheet D)."],
  ["Are biological samples taken (blood, saliva, tissue)?", "No. The sensor shines light on the fingertip, like a store-bought pulse oximeter. Nothing enters the body."],
  ["Animals?", "No."],
  ["Hazardous chemicals, microorganisms or radiation?", "No."],
  ["Electricity or hazardous equipment?", "Low voltage only: 5 V from a standard USB phone charger. There is no battery in the prototype and no mains wiring."],
  ["Physical activity or discomfort?", "Short voluntary breath-holds (10 to 20 seconds) while seated, awake and supervised by an adult. Only the exhibitor does them."],
  ["Is it a medical device or a diagnosis?", "No. It is an educational prototype. It is never used to diagnose or treat anyone."],
  ["Risk level", "Low: no greater than everyday life (see section 4)."],
], { size: 19 }));

// 2. Summary
kids.push(H1("2. Project summary"));
kids.push(P("Sleep apnea is a disorder in which breathing stops repeatedly during sleep. This makes blood oxygen (SpO₂) dip and changes the heart rate. Most people who have it have never been tested, because a sleep-lab study is expensive and hard to get."));
kids.push(P("I built a low-cost wearable (well under $100 in parts) to see whether it can measure blood oxygen accurately enough to detect these dips. It uses an ESP32 microcontroller, a MAX30102 fingertip light sensor (the same type of sensor as in store-bought pulse oximeters) and an MPU-6050 motion sensor for sleeping position. It sends one reading per second by Bluetooth to a laptop, where my software detects oxygen dips and estimates events per hour."));
kids.push(P([run("Question: ", { bold: true }), run("Can a low-cost wearable detect the oxygen drops linked to sleep apnea accurately enough to estimate how many events happen per hour?")]));
kids.push(P([run("Hypothesis: ", { bold: true }), run("If the wearable measures oxygen and heart rate every second, then software can detect desaturation events and count them per hour, because breathing pauses produce measurable oxygen dips.")]));

// 3. Protocol
kids.push(H1("3. Research protocol"));
kids.push(H2("3.1 Participants"));
kids.push(table([1500, 3000, 5580], ["Code", "Who", "Takes part in"], [
  ["P1", "Gabriel Mamane (exhibitor, minor)", "All tests: accuracy test, breath-hold test, recorded nights. Parent/guardian consent."],
  ["P2 to P5", "Up to 4 adult volunteers (18+), e.g. family members. Optional.", "Accuracy test only (30 min, seated, awake). No breath-holds, no nights."],
], { size: 19 }));
kids.push(P(""));
kids.push(P([run("Who can take part: ", { bold: true }), run("healthy and with no known heart or lung disease. People with a history of fainting are not included.")]));
kids.push(P([run("Who cannot take part: ", { bold: true }), run("anyone who does not want to, or who feels unwell on the day. Taking part is voluntary, and anyone can stop at any time without giving a reason.")]));

kids.push(H2("3.2 Equipment"));
kids.push(bullet("Night Signal wearable: ESP32 board, MAX30102 fingertip sensor in a Velcro cuff, MPU-6050 motion sensor, powered by a 5 V USB phone charger."));
kids.push(bullet("Reference: Elite Medica fingertip pulse oximeter (Health Canada authorized)."));
kids.push(bullet("Laptop with the recording and analysis software; a timer; the blank data sheets (section 6); alcohol wipes."));

kids.push(H2("3.3 Procedures"));
kids.push(P([run("A. Device check (no participant risk). ", { bold: true }), run("Before every session I run check_device.py, which confirms that data arrives every second, both sensors pass their self-test and readings are in a normal range. The session continues only if the device is READY.")]));
kids.push(P([run("B. Accuracy test (P1 and volunteers, about 35 min). ", { bold: true }), run("The participant sits and rests for 5 minutes. They wear the wearable on one index finger and the reference oximeter on the other hand. Every 2 minutes for 30 minutes, I write down both readings on sheet A. They breathe normally the whole time.")]));
kids.push(P([run("C. Breath-hold test (P1 only, about 45 min, adult supervisor present). ", { bold: true }),
  run("Seated and awake, after 2 minutes of normal breathing, I do short voluntary breath-holds after a normal breath out: 5 each of 10, 15 and 20 seconds, with at least 2 minutes of normal breathing between holds. The supervisor times them and logs the start and end of each hold on sheet B. These times are the known events used to score the software. Rules:")]));
kids.push(bullet("Never longer than 20 seconds, always seated, never standing or in water, and never while asleep."));
kids.push(bullet("Stop immediately if there is any dizziness, discomfort or tingling. Stop the whole session if the reference oximeter reads below 90%."));
kids.push(P([run("D. Recorded nights (P1 only, at least 5 nights at home). ", { bold: true }),
  run("I wear the cuff on my index finger and the armband pouch on my forearm during my normal sleep. Nothing about my sleep is changed. The USB cable runs along my arm to the side of the bed, never near the neck, and is clipped to the mattress. I can take it off at any time. Each morning I fill in sheet C and the comfort check (sheet D).")]));

kids.push(H2("3.4 Data and privacy"));
kids.push(bullet("Recorded: blood oxygen (%), heart rate, motion (sleeping position), finger-contact flag and the time. No names, photos of faces or other personal information."));
kids.push(bullet("Each participant gets a code (P1 to P5). The list linking codes to names is kept on paper by the supervisor, not with the data."));
kids.push(bullet("Data stays on my own laptop and is not uploaded or shared. Only I and my supervisor see the raw data."));
kids.push(bullet("Results are shown as anonymous graphs and averages. Volunteers' data is deleted after the science fair, or sooner on request."));

kids.push(H2("3.5 If a reading looks unusual"));
kids.push(P("The wearable is an educational prototype and I do not interpret anyone's health. If the reference oximeter shows a resting value below 92%, the test stops and the participant (and parent/guardian for a minor) is advised to speak to a doctor. If my own night recordings show many oxygen dips, I will tell my parents, and we will treat it only as a reason to ask a doctor, never as a diagnosis."));

// 4. Risk assessment
kids.push(H1("4. Risk assessment"));
kids.push(table([2300, 1000, 1150, 1150, 4480], ["Possible risk", "Who", "Likelihood", "Severity", "How it is prevented"], [
  ["Light-headedness during breath-holds", "P1", "Low", "Minor", "Holds of 20 s or less, seated, 2 min rest between holds, adult present, stop at any discomfort, stop the session below 90% on the reference oximeter. Never while asleep."],
  ["Skin irritation or pressure from the finger cuff", "All", "Low", "Minor", "Cuff snug, not tight. Remove it at any numbness or tingling, and check the skin after each session."],
  ["Electrical", "All", "Very low", "Minor", "5 V USB from a certified phone charger. No battery, no mains wiring, insulated and taped connections."],
  ["Cable at night (tangling or tripping)", "P1", "Low", "Moderate", "The cable runs along the arm to the side of the bed, never near the neck, and is clipped to the mattress. It can be removed at any time."],
  ["Poor sleep or discomfort", "P1", "Medium", "Minor", "The device can be removed at any time. Nights are not scheduled before tests or exams."],
  ["Hygiene (shared sensor)", "Volunteers", "Low", "Minor", "Sensor and cuff wiped with alcohol between people."],
  ["Privacy of health data", "All", "Low", "Minor", "Coded IDs, data kept only on my laptop, anonymous results, deletion after the fair."],
  ["Worry about a result", "All", "Low", "Minor", "It is explained beforehand that this is not a medical test. Unusual readings mean seeing a doctor, not a diagnosis."],
], { size: 18 }));
kids.push(P(""));
kids.push(box([P([run("Overall: low risk. ", { bold: true }), run("The risks are no greater than everyday life. Wearing a fingertip light sensor is what a pharmacy pulse oximeter does, and a 20-second breath-hold is shorter than holding your breath underwater at a pool.")])]));

// 5. Information and consent
kids.push(pageBreak());
kids.push(H1("5. Participant information and consent"));
kids.push(box([P([run("If Technoscience's Certificate of Approval is used as the consent form, give this page to each participant to read before they sign it. Keep this version as well for the parent/guardian signature for a minor.", { color: GREY })])], WARN));
kids.push(P(""));
kids.push(P([run("Project: ", { bold: true }), run("Night Signal, a low-cost wearable to detect the oxygen dips linked to sleep apnea. Science fair project by Gabriel Mamane.")]));
kids.push(P([run("What you would do: ", { bold: true }), run("sit and rest for about 35 minutes while wearing a soft fingertip sensor on one hand and a store-bought pulse oximeter on the other. Every 2 minutes, both readings are written down. (The breath-hold test and the night recordings are done only by the student.)")]));
kids.push(P([run("Risks: ", { bold: true }), run("very low. The sensor shines a little red and infrared light on the fingertip, like a pharmacy pulse oximeter. The cuff may feel tight: tell me and it comes off right away.")]));
kids.push(P([run("Benefits: ", { bold: true }), run("none directly for you. You help test whether low-cost devices could one day make sleep apnea screening easier.")]));
kids.push(P([run("Your rights: ", { bold: true }), run("taking part is voluntary. You can stop at any time, without giving a reason. You can ask for your data to be deleted.")]));
kids.push(P([run("Privacy: ", { bold: true }), run("your readings are stored under a code (for example P3), never with your name. Results are shown only as anonymous averages and graphs, and your data is deleted after the science fair.")]));
kids.push(P([run("Not a medical test: ", { bold: true }), run("this is a student prototype. It cannot tell you anything about your health. If the store-bought oximeter shows an unusual value, you will be advised to talk to a doctor.")]));
kids.push(P([run("Questions: ", { bold: true }), run("Gabriel Mamane, or the supervisor: "), fill("name, email")]));
kids.push(P(""));
kids.push(P([run("I have read this information, my questions have been answered, and I agree to take part.", { bold: true })]));
for (const l of ["Participant name and code", "Participant signature                                                      Date", "Parent/guardian name (if the participant is under 18)", "Parent/guardian signature                                                Date", "Student (Gabriel Mamane) signature                                  Date"]) kids.push(field(l));

// 6. Data collection tools
kids.push(pageBreak());
kids.push(H1("6. Data collection tools (blank)"));
kids.push(H2("Sheet A: Accuracy test"));
kids.push(P([run("Participant code ____   Date ____________   Start time ______   Room temperature ____ °C   Wearable on: L / R index finger", { size: 19 })]));
kids.push(table([900, 1200, 1700, 1700, 1600, 1500, 1480], ["#", "Minute", "Reference SpO₂ %", "Reference pulse", "Device SpO₂ %", "Device pulse", "Notes"],
  blankRows(16, 7).map((r, i) => { r[1] = String(i * 2); return r; }), { size: 18, rowH: 340 }));

kids.push(pageBreak());
kids.push(H2("Sheet B: Breath-hold test (P1 only, supervised)"));
kids.push(P([run("Date ____________   Supervisor ______________________   Resting reference SpO₂ before starting ____ %", { size: 19 })]));
const targets = [10, 10, 10, 10, 10, 15, 15, 15, 15, 15, 20, 20, 20, 20, 20];
kids.push(table([700, 1100, 1500, 1500, 1500, 1680, 2100], ["#", "Target (s)", "Start time", "End time", "Felt OK? (Y/N)", "Lowest ref. SpO₂ %", "Notes"],
  blankRows(15, 7).map((r, i) => { r[1] = String(targets[i]); return r; }), { size: 18, rowH: 340 }));
kids.push(P(""));
kids.push(P([run("Stop rules: stop immediately at any dizziness, discomfort or tingling. Stop the session if the reference oximeter reads below 90%. Hold for 20 seconds at most. Always seated.", { italics: true, color: GREY, size: 19 })]));

kids.push(H2("Sheet C: Night log (P1 only)"));
kids.push(table([900, 1300, 1200, 1200, 1500, 1500, 1100, 1380], ["Night", "Date", "Bedtime", "Wake time", "Device READY? (Y/N)", "Removed during night?", "Comfort 1–5", "Notes"],
  blankRows(7, 8), { size: 18, rowH: 420 }));

kids.push(H2("Sheet D: Comfort and safety check (after every session)"));
kids.push(table([1300, 1500, 1500, 1700, 1700, 2380], ["Date", "Code", "Dizziness? (Y/N)", "Skin redness? (Y/N)", "Numbness / tingling? (Y/N)", "Action taken / notes"],
  blankRows(8, 6, () => ""), { size: 18, rowH: 380 }));

// ---------- document ----------
const doc = new Document({
  creator: "Gabriel Mamane",
  title: "Night Signal - Ethics submission package",
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
      new TextRun({ text: "Night Signal · ethics package · page ", size: 16, color: GREY }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY })] })] }) },
    children: kids,
  }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(process.argv[2], b); console.log("wrote", process.argv[2]); });
