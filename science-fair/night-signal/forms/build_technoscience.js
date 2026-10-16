// Night Signal — answers for the Technoscience ethics approval platform (approbation.technoscience.ca).
// The platform needs Gabriel's own account, so this is a copy-and-paste answer sheet, not a submission.
//   node build_technoscience.js Technoscience_Answers_Gabriel_Mamane.docx
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  AlignmentType, LevelFormat, Footer, PageNumber, TableLayoutType, HeadingLevel,
} = require("docx");
const fs = require("fs");

const FONT = "Inter", INK = "1D1D1F", GRAY = "6E6E73", NAVY = "12414C", LINE = "C3CDDA", TINT = "EAF4F6", WARN = "FBF2DF";
const W = 10080;
const run = (text, o = {}) => new TextRun({ text, font: FONT, size: 21, color: INK, ...o });
const fill = (text) => run(text, { bold: true, shading: { type: ShadingType.CLEAR, fill: "FFE97A", color: "auto" } });
const P = (parts, o = {}) => new Paragraph({ spacing: { after: 100, line: 276 }, ...o, children: (typeof parts === "string" ? [run(parts)] : parts) });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 280, after: 120 }, keepNext: true, children: [new TextRun({ text: t, font: FONT })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 }, keepNext: true, children: [new TextRun({ text: t, font: FONT })] });
const bullet = (parts) => P(parts, { numbering: { reference: "dots", level: 0 }, spacing: { after: 60, line: 264 } });
const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };

function box(parts, color = TINT) {
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({
    width: { size: W, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: color, color: "auto" },
    margins: { top: 120, bottom: 120, left: 180, right: 180 },
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      left: { style: BorderStyle.SINGLE, size: 24, color: color === WARN ? "C98A1E" : "1F8A9C" } },
    children: parts })] })] });
}
// two-column "field → answer" table; answers may be strings or arrays of runs
function qa(rows, widths = [3300, 6780], header = ["Field / question", "Answer to paste"]) {
  const cell = (c, i, head) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA }, margins: { top: 70, bottom: 70, left: 110, right: 110 },
    shading: head ? { type: ShadingType.CLEAR, fill: NAVY, color: "auto" } : (i === 0 ? { type: ShadingType.CLEAR, fill: "F5F7FA", color: "auto" } : undefined),
    children: [new Paragraph({ spacing: { after: 0, line: 264 }, children: typeof c === "string" ? [run(c, { size: 20, bold: head || i === 0, color: head ? "FFFFFF" : INK })] : c })] });
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED,
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: [new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, i, true)) })]
      .concat(rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, i, false)) }))) });
}
const sp = () => P("");

// ---------------- shared answer text (matches the revised proposal and ethics package) ----------------
const TITLE_EN = "Night Signal: SpO2 Accuracy", TITLE_FR = "Night Signal : précision de la SpO2";
const Q_EN = "How closely do blood-oxygen (SpO2) and heart-rate readings from a low-cost wearable (MAX30102 fingertip sensor + ESP32) agree with a Health Canada-authorized fingertip pulse oximeter, and can software reliably flag oxygen desaturation events (a drop of at least 3 percentage points lasting at least 10 seconds) in the wearable's recordings?";
const H_EN = "If the wearable is worn correctly and only good-quality readings are used, then its SpO2 will agree with the reference oximeter within about ±3 percentage points (95% limits of agreement), because both measure red/infrared light absorption, and the software will flag the dips that the reference also shows. This project does not diagnose or confirm sleep apnea.";
const SUM_SHORT = "I am building a low-cost wearable (an ESP32 microcontroller with a MAX30102 fingertip light sensor) that records blood-oxygen saturation (SpO2) and heart rate once per second. I will measure how closely its readings agree with a Health Canada-authorized fingertip pulse oximeter while seated at rest, and test whether software can flag short oxygen drops (desaturations). The device is an educational prototype: it cannot diagnose or confirm sleep apnea or any other condition.";
const SUM_LONG = SUM_SHORT + " Each reading is used only if it passes signal-quality checks (finger detected, sensor reports a valid value, SpO2 between 70 and 100%, no sudden movement). Agreement is analysed with the Bland–Altman method (bias and 95% limits of agreement). Optional parts, done only if approved: overnight recordings during my normal sleep to measure how much of the signal is usable, and short supervised breath-holds (20 seconds at most) to check whether induced dips are flagged. Awake breath-holds do not test sleep apnea.";
const WHY_HUMANS = "The question is how accurately the sensor reads a real person's blood oxygen, so it must be worn on a real finger and compared with a reference oximeter worn at the same time. The analysis software has already been tested on simulated data, but simulated data cannot measure real accuracy.";
const PROC = [
  "Device check (no participant): before each session, check_device.py confirms that data arrives every second and both sensors pass their self-test. The session continues only if the result is READY.",
  "Accuracy session (main test, about 35 minutes): the participant sits and rests for 5 minutes with warm hands, wearing the wearable on one index finger and the store-bought reference oximeter on the other hand. Every 2 minutes for 30 minutes, the time and both devices' SpO2 and pulse are written on Sheet A (15 pairs). Breathing is normal throughout. P1 repeats this on several days.",
  "Optional, only if approved, P1 only: short voluntary breath-holds while seated and awake, with an adult supervisor timing them (up to 5 each of 10, 15 and 20 seconds, at least 2 minutes of normal breathing between holds). Start and end times are logged on Sheet B. This only checks whether the software flags induced dips; it is not a test of sleep apnea.",
  "Optional, only if approved, P1 only: up to 5 nights of recording during normal sleep at home (finger cuff + armband, cable along the arm away from the neck). Only signal quality and flagged desaturation events per hour of valid recording are reported; these cannot be verified overnight and are not interpreted as apneas.",
  "After every session, a comfort and safety check is recorded on Sheet D.",
];
const RISKS = [
  ["Light-headedness during the optional breath-holds", "Holds of 20 s or less, seated, 2 min rest between holds, adult present, stop at any discomfort, stop the session if the reference oximeter reads below 90%. Never while asleep. Only if approved."],
  ["Skin irritation or pressure from the finger cuff", "Cuff snug, not tight; removed at any numbness or tingling; skin checked after each session."],
  ["Electrical", "5 V USB from a certified phone charger only. No battery, no mains wiring, insulated connections."],
  ["Cable during optional nights", "Cable runs along the arm to the side of the bed, never near the neck, clipped to the mattress; can be removed at any time."],
  ["Hygiene (shared sensor, volunteers)", "Sensor and cuff wiped with alcohol between people."],
  ["Privacy of health data", "Coded IDs (P1–P5), data kept only on the student's laptop, results shown only as anonymous graphs and averages, volunteers' data deleted after the fair."],
  ["Worry or false reassurance about a reading", "Everyone is told beforehand that this is not a medical test and cannot detect or rule out sleep apnea. A resting reference value below 92% stops the session and the participant is advised to see a doctor."],
];

// ---------------- French versions ----------------
const Q_FR = "Dans quelle mesure les lectures de saturation en oxygène du sang (SpO2) et de fréquence cardiaque d'un appareil portable à faible coût (capteur digital MAX30102 + ESP32) concordent-elles avec celles d'un oxymètre de pouls digital autorisé par Santé Canada, et un logiciel peut-il détecter de façon fiable les épisodes de désaturation en oxygène (une baisse d'au moins 3 points de pourcentage pendant au moins 10 secondes) dans les enregistrements de l'appareil?";
const H_FR = "Si l'appareil est porté correctement et que seules les lectures de bonne qualité sont utilisées, sa SpO2 concordera avec celle de l'oxymètre de référence à environ ±3 points de pourcentage près (limites d'agrément à 95 %), puisque les deux mesurent l'absorption de la lumière rouge et infrarouge, et le logiciel détectera les baisses que la référence montre aussi. Ce projet ne permet pas de diagnostiquer ni de confirmer l'apnée du sommeil.";
const SUM_FR = "Je construis un appareil portable à faible coût (un microcontrôleur ESP32 et un capteur optique digital MAX30102) qui enregistre la saturation en oxygène du sang (SpO2) et la fréquence cardiaque une fois par seconde. Je vais mesurer dans quelle mesure ses lectures concordent avec celles d'un oxymètre de pouls digital autorisé par Santé Canada, en position assise et au repos, et vérifier si un logiciel peut détecter les courtes baisses d'oxygène (désaturations). L'appareil est un prototype éducatif : il ne peut pas diagnostiquer ni confirmer l'apnée du sommeil ou toute autre condition.";
const PROC_FR = "Avant chaque séance, une vérification de l'appareil doit indiquer READY. Séance principale (environ 35 minutes) : le participant est assis au repos pendant 5 minutes, porte l'appareil sur un index et l'oxymètre de référence sur l'autre main; toutes les 2 minutes pendant 30 minutes, l'heure ainsi que la SpO2 et le pouls des deux appareils sont notés (15 paires). La respiration reste normale. Optionnel, seulement si approuvé et pour l'exposant seulement : de courtes apnées volontaires (20 secondes au maximum), assis, éveillé et sous la supervision d'un adulte, pour vérifier si les baisses provoquées sont détectées (ce n'est pas un test de l'apnée du sommeil); et jusqu'à 5 nuits d'enregistrement pendant le sommeil normal à la maison, pour mesurer la qualité du signal seulement. Une vérification du confort et de la sécurité est notée après chaque séance.";
const RISK_FR = "Risque faible, pas plus grand que celui de la vie quotidienne. Capteur optique sur le bout du doigt, comme un oxymètre de pharmacie; alimentation USB 5 V seulement. Les apnées volontaires optionnelles sont limitées à 20 secondes, en position assise, sous supervision, et arrêtées au moindre malaise ou si l'oxymètre de référence indique moins de 90 %. Les données sont codées (P1 à P5), conservées sur l'ordinateur de l'élève seulement et présentées de façon anonyme. Chacun peut arrêter en tout temps sans donner de raison.";

// ---------------- document ----------------
const kids = [];
kids.push(P([run("Technoscience ethics approval: answers to copy and paste", { bold: true, size: 38, color: NAVY })], { spacing: { after: 40 } }));
kids.push(P([run(`Gabriel Mamane · Night Signal · prepared October 16, 2026 for approbation.technoscience.ca/pre-questionnaire`, { color: GRAY, size: 19 })],
  { spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: NAVY, space: 6 } } }));

kids.push(box([
  P([run("Read this first", { bold: true, size: 23, color: "8A5A00" })]),
  bullet("The platform needs your own account, so these answers are for you to copy in. Nothing has been filled in, submitted or signed for you."),
  bullet("The real questions could not be opened from here. The fields below are the ones Technoscience's published rules and similar ethics forms ask for. Match each box on the site to the closest answer, and adjust the wording if the site asks something slightly different."),
  bullet("Technoscience's rules say a project involving people, including the exhibitor himself, may not start until the ethics certificate is issued. Do not record any test before then."),
  bullet([run("Yellow", { bold: true, shading: { type: ShadingType.CLEAR, fill: "FFE97A", color: "auto" } }), run(" = information only you can give. Do not guess it.")]),
], WARN));
sp();

kids.push(H1("1. Have these ready before you start"));
kids.push(qa([
  ["Your account", [fill("an email address you check")]],
  ["Grade", [fill("your grade (Secondary __)")]],
  ["Ms. Ireland's email", [fill("her school email")]],
  ["Reference oximeter", [run("Elite Medica Premium Fingertip Pulse Oximeter, model EM-PO2 (listed as Health Canada authorized). ", { size: 20 }), fill("licence number from the box or manual")]],
  ["Where the accuracy sessions will happen", [fill("at home or at school, and the adult present")]],
  ["Parent/guardian", [fill("name of the parent/guardian who will consent")]],
  ["Files to attach if asked", [run("Revised proposal form (PDF); blank data sheets A–D from section 6 of the ethics package; the participant information and consent page (section 5).", { size: 20 })]],
], [3300, 6780], ["Item", "What you need"]));

kids.push(H1("2. Identification"));
kids.push(qa([
  ["Exhibitor", "Gabriel Mamane"],
  ["School", "Les écoles Azrieli Herzliah, Campus Sylvan Adams, 5475 avenue Mountain Sights, Montréal, QC H3W 2Y8"],
  ["Level / grade", [run("Secondary (secondaire), grade ", { size: 20 }), fill("__")]],
  ["Project title (English)", TITLE_EN],
  ["Titre du projet (français)", TITLE_FR],
  ["Category", "Health and Medical Sciences (or the closest health category the site offers)"],
  ["Type of project", "Experiment (expérimentation)"],
  ["Supervising teacher", [run("Ms. Jessica Ireland, Science Department, Head teacher for Secondary 5, Les écoles Azrieli Herzliah · 514-739-2291, ext. 255 · ", { size: 20 }), fill("email")]],
  ["Team members", "None (individual project)"],
]));

kids.push(H1("3. Pre-questionnaire (likely yes/no questions)"));
kids.push(qa([
  ["Does the project involve human participants, including yourself?", "Yes. Me (the exhibitor, a minor, with parent/guardian consent). Optionally up to 4 adult volunteers (18+) for one 30-minute seated accuracy session, only if approved."],
  ["Is there a questionnaire, survey or interview?", "No. Only a short yes/no comfort and safety check after each session (Sheet D)."],
  ["Is it an online survey?", "No."],
  ["Are human biological samples taken (blood, saliva, tissue, etc.)?", "No. The sensor shines light on the fingertip, like a pharmacy pulse oximeter. Nothing enters the body and nothing is collected."],
  ["Animals?", "No."],
  ["Microorganisms, hazardous chemicals, radiation or lasers?", "No. The sensor uses ordinary red and infrared LEDs."],
  ["Electricity or hazardous equipment?", "Low voltage only: 5 V USB from a certified phone charger. No battery in the prototype and no mains wiring."],
  ["Physical activity, stress or discomfort?", "Main test: none (sitting at rest). Optional, only if approved: short voluntary breath-holds of 20 seconds at most, seated, awake, supervised by an adult, by the exhibitor only."],
  ["Is health information collected?", "Yes: blood-oxygen saturation, heart rate, finger contact and arm movement, under coded IDs only. No names, photos of faces or other identifying information."],
  ["Is it a medical device, a diagnosis or a treatment?", "No. It is an educational prototype. It is never used to diagnose or treat anyone and cannot detect or rule out sleep apnea."],
  ["Is any medication, food or drink given?", "No."],
  ["Will you deceive participants?", "No."],
  ["Risk level", "Low: no greater than everyday life (see section 6)."],
], [4300, 5780], ["Question", "Answer"]));

kids.push(H1("4. Project description"));
kids.push(H2("Summary: short version (about 80 words)"));
kids.push(P(SUM_SHORT));
kids.push(H2("Summary: full version (if the box allows more)"));
kids.push(P(SUM_LONG));
kids.push(H2("Research question"));
kids.push(P(Q_EN));
kids.push(H2("Hypothesis"));
kids.push(P(H_EN));
kids.push(H2("Variables"));
kids.push(bullet([run("Independent: ", { bold: true }), run("measuring device (wearable vs. reference oximeter); test condition (seated rest; optional breath-holds only if approved).")]));
kids.push(bullet([run("Dependent: ", { bold: true }), run("wearable minus reference SpO2 and heart rate (bias, 95% limits of agreement, mean absolute difference); number of desaturation events flagged; percentage of recording time with a valid signal.")]));
kids.push(bullet([run("Controlled: ", { bold: true }), run("same participant, finger and cuff tightness; seated and still with warm hands; same room and lighting; paired readings every 2 minutes; same firmware and detection settings (3-point drop, 10 s minimum, 120 s baseline); same reference oximeter.")]));
kids.push(H2("Why human participants are necessary"));
kids.push(P(WHY_HUMANS));

kids.push(H1("5. Participants and procedure"));
kids.push(qa([
  ["Number of participants", "1 required (the exhibitor, P1). Up to 4 optional adult volunteers (P2–P5), only if approved."],
  ["Ages", "P1: the exhibitor (a minor). Volunteers: 18 or older."],
  ["Recruitment", "Volunteers would be adult family members asked in person. No advertising, no payment, no pressure; saying no has no consequences."],
  ["Inclusion", "Healthy, no known heart or lung disease."],
  ["Exclusion", "Anyone with a history of fainting, anyone who feels unwell on the day, anyone who does not want to take part."],
  ["Duration", "About 35 minutes per accuracy session; P1 repeats it on several days. Optional breath-hold session about 45 minutes. Optional nights: up to 5."],
  ["Location", [fill("home or school")], ],
  ["Adult present", [run("An adult is present for every session; the optional breath-hold test is timed by an adult supervisor: ", { size: 20 }), fill("who")]],
  ["Equipment", "Night Signal wearable (ESP32 + MAX30102 + MPU-6050, 5 V USB power); store-bought fingertip pulse oximeter as reference; laptop; timer; blank Sheets A–D; alcohol wipes."],
]));
kids.push(sp());
kids.push(H2("Procedure, step by step"));
PROC.forEach((t, i) => kids.push(P([run(`${i + 1}. `, { bold: true }), run(t)])));

kids.push(H1("6. Risks, benefits and safety"));
kids.push(qa(RISKS, [3300, 6780], ["Possible risk", "How it is prevented"]));
kids.push(sp());
kids.push(P([run("Overall risk: ", { bold: true }), run("low, no greater than everyday life. The main test is sitting still with two fingertip sensors.")]));
kids.push(P([run("Stopping rules: ", { bold: true }), run("stop immediately at any dizziness, discomfort, numbness or tingling; stop the session if the reference oximeter reads below 90%; a resting reference value below 92% ends the session and the participant is advised to speak to a doctor.")]));
kids.push(P([run("Benefits: ", { bold: true }), run("none directly for participants. The project shows how accurate a low-cost oxygen sensor is.")]));

kids.push(H1("7. Consent, privacy and data"));
kids.push(qa([
  ["How is consent obtained?", "Each participant reads the information page and signs the consent form issued with the Certificate of Approval before taking part. For the exhibitor (a minor), a parent/guardian also signs. No one signs before approval."],
  ["Can participants withdraw?", "Yes, at any time, without giving a reason, and they can ask for their data to be deleted."],
  ["What data is recorded?", "Blood-oxygen saturation (%), heart rate, finger-contact flag, arm movement and the time. No names, photos of faces or other identifying information."],
  ["How is it kept confidential?", "Each participant gets a code (P1–P5). The list linking codes to names is kept on paper by the supervisor, separate from the data. Data stays on the student's laptop and is not uploaded or shared."],
  ["Who sees the data?", "Only the student and the supervising teacher."],
  ["How are results shown?", "Only as anonymous graphs and averages."],
  ["When is data deleted?", "Volunteers' data is deleted after the science fair, or sooner on request."],
  ["What if a reading looks unusual?", "The student does not interpret anyone's health. If the reference oximeter shows a resting value below 92%, the session stops and the participant (and parent/guardian for a minor) is advised to speak to a doctor. The device cannot say whether anyone has sleep apnea."],
], [3300, 6780], ["Question", "Answer"]));

kids.push(H1("8. Version française (si le formulaire est en français)"));
kids.push(H2("Titre"));          kids.push(P(TITLE_FR));
kids.push(H2("Résumé"));         kids.push(P(SUM_FR));
kids.push(H2("Question"));       kids.push(P(Q_FR));
kids.push(H2("Hypothèse"));      kids.push(P(H_FR));
kids.push(H2("Pourquoi des participants humains"));
kids.push(P("La question porte sur la précision du capteur sur une vraie personne : il doit donc être porté sur un vrai doigt et comparé à un oxymètre de référence porté en même temps. Le logiciel a déjà été testé avec des données simulées, mais des données simulées ne peuvent pas mesurer la précision réelle."));
kids.push(H2("Participants"));
kids.push(P("1 participant obligatoire (l'exposant, mineur, avec le consentement d'un parent ou tuteur). Jusqu'à 4 volontaires adultes (18 ans et plus) facultatifs, pour une seule séance assise de 30 minutes, seulement si approuvé. Critères : en bonne santé, sans maladie cardiaque ou pulmonaire connue; exclusion des personnes ayant des antécédents d'évanouissement."));
kids.push(H2("Déroulement"));  kids.push(P(PROC_FR));
kids.push(H2("Risques et sécurité")); kids.push(P(RISK_FR));
kids.push(H2("Consentement et confidentialité"));
kids.push(P("Chaque participant lit la page d'information et signe le formulaire de consentement remis avec le certificat d'approbation avant de participer; pour l'exposant mineur, un parent ou tuteur signe aussi. Chacun peut se retirer en tout temps sans donner de raison et demander la suppression de ses données. Les données sont codées, conservées sur l'ordinateur de l'élève seulement, vues uniquement par l'élève et l'enseignante responsable, et présentées de façon anonyme. Ce n'est pas un test médical : l'appareil ne peut pas détecter ni exclure l'apnée du sommeil."));

const doc = new Document({
  creator: "Gabriel Mamane", title: "Night Signal - Technoscience answers",
  styles: { default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, color: NAVY, font: FONT }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, color: "1F8A9C", font: FONT }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 } }] },
  numbering: { config: [{ reference: "dots", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 460, hanging: 260 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
      new TextRun({ text: "Night Signal · Technoscience answers (to copy in; not submitted) · page ", font: FONT, size: 16, color: GRAY }),
      new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: GRAY })] })] }) },
    children: kids }],
});
const out = process.argv[2] || "Technoscience_Answers_Gabriel_Mamane.docx";
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(out, b); console.log("wrote", out); });
