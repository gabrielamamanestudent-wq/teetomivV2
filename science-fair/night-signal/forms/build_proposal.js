const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, PageOrientation
} = require('docx');
const fs = require('fs');

const NAVY = "12414c";
const TEAL = "1f8a9c";
const GREY = "555f6b";

// A form-field label (bold, small caps feel)
function label(text) {
  return new Paragraph({
    spacing: { before: 220, after: 60 },
    children: [new TextRun({ text, bold: true, size: 22, color: NAVY })],
  });
}

// The answer text under a label
function answer(text) {
  return new Paragraph({
    spacing: { after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "c3cdda", space: 6 } },
    children: [new TextRun({ text, size: 22 })],
  });
}

// A plain answer line with no underline border (for multi-line answers)
function line(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 40 },
    children: [new TextRun({ text, size: 22 })],
  });
}

function checkbox(letter, checked, text) {
  return new Paragraph({
    spacing: { after: 30 },
    children: [
      new TextRun({ text: `${letter}  `, bold: true, size: 22 }),
      new TextRun({ text: checked ? "☒ " : "☐ ", size: 24, bold: true,
                    color: checked ? TEAL : GREY }),
      new TextRun({ text, size: 22, color: checked ? "000000" : GREY,
                    bold: checked }),
    ],
  });
}

function category(name, selected) {
  return new Paragraph({
    spacing: { after: 20 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: selected ? "☒  " : "☐  ", size: 22, bold: true,
                    color: selected ? TEAL : GREY }),
      new TextRun({ text: name, size: 22, bold: selected,
                    color: selected ? NAVY : GREY }),
    ],
  });
}

const doc = new Document({
  creator: "Gabriel Mamane",
  title: "Science Fair Proposal (revised) - Night Signal",
  styles: {
    default: {
      document: { run: { font: "Calibri" } },
    },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840, orientation: PageOrientation.PORTRAIT },
        margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
      },
    },
    children: [
      // ---------- Forms Required ----------
      new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: "Forms Required:", bold: true, size: 20, color: GREY })],
      }),
      checkbox("A", false, "Contribution from a Recognized Institution"),
      checkbox("B", true, "Projects that require a human subject"),
      checkbox("C", false, "Same project for a second year"),

      // ---------- Title banner ----------
      new Paragraph({
        spacing: { before: 260, after: 40 },
        alignment: AlignmentType.CENTER,
        border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: NAVY, space: 8 } },
        children: [new TextRun({ text: "Science Fair Proposal Form", bold: true, size: 34, color: NAVY })],
      }),
      new Paragraph({
        spacing: { after: 200 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Experimental Project  ·  revised scope", italics: true, size: 24, color: TEAL })],
      }),

      // ---------- Participant info ----------
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Name of participants:  ", bold: true, size: 22, color: NAVY }),
          new TextRun({ text: "Gabriel Mamane", size: 22 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Grade level:  ", bold: true, size: 22, color: NAVY }),
          new TextRun({ text: "____________", size: 22, color: GREY }),
          new TextRun({ text: "   (fill in your grade)", italics: true, size: 18, color: GREY }),
        ],
      }),

      // ---------- Project Category ----------
      label("Project Category:"),
      category("Life Sciences", false),
      category("Health Sciences", false),
      category("Human Sciences", false),
      category("Biotechnologies", false),
      category("Health and Medical Sciences", true),
      category("Environmental Sciences", false),
      category("Physical Sciences and Mathematics", false),
      category("Engineering and Computer Sciences", false),

      // ---------- Title ----------
      label("Title:  (30 character maximum)"),
      answer("Night Signal: SpO2 Accuracy"),
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: "(27 characters)", italics: true, size: 16, color: GREY })],
      }),

      // ---------- Experimental Question ----------
      label("Experimental Question:"),
      line("How closely do blood-oxygen (SpO₂) and heart-rate readings from a low-cost wearable (MAX30102"),
      line("fingertip sensor + ESP32) agree with a Health Canada-authorized fingertip pulse oximeter, and can"),
      answer("software reliably flag oxygen desaturation events (a drop of at least 3 percentage points lasting at least 10 s)?"),

      // ---------- Preliminary Hypothesis ----------
      label("Preliminary Hypothesis:"),
      line("If the wearable is worn correctly and only good-quality readings are used, its SpO₂ will agree with"),
      line("the reference oximeter within about ±3 percentage points, because both measure red/infrared light"),
      line("absorption, and the software will flag the dips that the reference also shows. This project does"),
      answer("not diagnose or confirm sleep apnea."),

      // ---------- Dependent variables ----------
      label("Dependent variable(s):"),
      line("Wearable minus reference SpO₂ and heart rate (bias, 95% limits of agreement, mean absolute error);"),
      answer("number of desaturation events flagged; percentage of recording time with a valid signal."),

      // ---------- Independent variables ----------
      label("Independent variable(s):"),
      line("Measuring device (wearable vs. reference oximeter); test condition (seated rest; optional short"),
      answer("supervised breath-holds only if approved by my teacher and the ethics committee)."),

      // ---------- Controls ----------
      label("Controls:"),
      line("•  Same participant, finger and cuff tightness; seated and still, with warm hands"),
      line("•  Same room and lighting"),
      line("•  Paired readings taken at the same moments, every 2 minutes"),
      line("•  Same firmware and detection settings (3-point drop, 10-second minimum, 120-second baseline)"),
      answer("•  Same reference oximeter"),

      // ---------- footer note ----------
      new Paragraph({
        spacing: { before: 300 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "c3cdda", space: 8 } },
        children: [new TextRun({
          text: "Revised scope (pending Ms. Ireland's approval): this project measures how accurately a low-cost "
              + "wearable reads blood oxygen and heart rate, and whether software can flag oxygen desaturation "
              + "events. Oxygen and heart rate alone cannot confirm or diagnose sleep apnea. It is an educational "
              + "prototype, not a medical device. No testing on people begins before teacher and ethics approval "
              + "and signed consent (Form B).",
          italics: true, size: 16, color: GREY,
        })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(process.argv[2], buf);
  console.log("wrote", process.argv[2]);
});
