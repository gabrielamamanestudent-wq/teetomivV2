// Night Signal — cue cards (.docx, uploads cleanly to Google Docs).
// Reads cue_cards.json, which build_deck.js writes, so the cards always match the slides.
//   node build_deck.js ../Night_Signal_Presentation.pptx && node build_cue_cards.js ../Night_Signal_Cue_Cards.docx
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  AlignmentType, LevelFormat, PageBreak, Footer, PageNumber, TableLayoutType,
} = require("docx");
const fs = require("fs");
const path = require("path");

const D = JSON.parse(fs.readFileSync(path.join(__dirname, "cue_cards.json"), "utf8"));
const FONT = "Inter", INK = "1D1D1F", GRAY = "6E6E73", BLUE = "0071E3", PINK = "E3254B", LINE = "D2D2D7", TINT = "F5F5F7";
const W = 10080;                                   // Letter, 0.75" margins
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const run = (text, o = {}) => new TextRun({ text, font: FONT, size: 22, color: INK, ...o });
const para = (children, o = {}) => new Paragraph({ spacing: { after: 80, line: 276 }, ...o, children: Array.isArray(children) ? children : [children] });
const cue = (text, size) => new Paragraph({ numbering: { reference: "cue", level: 0 }, spacing: { after: 70, line: 264 }, children: [run(text, { size: size || 28 })] });
const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

// one card = a single-cell bordered table that never splits across pages
function card(head, right, body, shade) {
  const border = { style: BorderStyle.SINGLE, size: 8, color: LINE };
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W], layout: TableLayoutType.FIXED,
    rows: [new TableRow({ cantSplit: true, children: [new TableCell({
      width: { size: W, type: WidthType.DXA }, margins: { top: 200, bottom: 200, left: 280, right: 280 },
      shading: shade ? { type: ShadingType.CLEAR, fill: shade, color: "auto" } : undefined,
      borders: { top: border, bottom: border, left: border, right: border },
      children: [
        new Paragraph({ spacing: { after: 140 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE, space: 6 } },
          tabStops: [{ type: "right", position: W - 600 }],
          children: [run(head, { bold: true, size: 30 }), run("\t" + right, { size: 20, color: GRAY })] }),
        ...body],
    })] })],
  });
}
const gap = () => new Paragraph({ spacing: { after: 220 }, children: [] });

const kids = [];
kids.push(para(run("Night Signal: cue cards", { bold: true, size: 44 }), { spacing: { after: 60 } }));
kids.push(para(run(`Gabriel Mamane · Science fair presentation · ${D.cards.length} slides · ${mmss(D.total)} spoken (limit 7–10 min) + 3 min questions`, { color: GRAY, size: 20 }), { spacing: { after: 200 } }));
kids.push(card("How to use these cards", "", [
  cue("Practise with the full script at the end of this document until you can say each slide in your own words.", 22),
  cue("When presenting, glance at the card: the bold title is the slide, the bullets are what to say, the arrow is your link to the next slide.", 22),
  cue("The times are targets. “Ends at” is where you should be on the clock when you finish that slide.", 22),
  cue("Say “demonstration data” every time you show a simulated number. Never say the device detects sleep apnea.", 22),
], TINT));
kids.push(gap());
kids.push(new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: [900, 6180, 1500, 1500], layout: TableLayoutType.FIXED,
  rows: [["#", "Slide", "Time", "Ends at"], ...D.cards.map((c) => [String(c.n), c.title, `${c.secs} s`, c.running])].map((r, i) => new TableRow({
    tableHeader: i === 0, children: r.map((t, j) => new TableCell({
      width: { size: [900, 6180, 1500, 1500][j], type: WidthType.DXA }, margins: { top: 50, bottom: 50, left: 100, right: 100 },
      borders: { top: none, left: none, right: none, bottom: { style: BorderStyle.SINGLE, size: i === 0 ? 10 : 4, color: i === 0 ? INK : LINE } },
      children: [para(run(t, { size: 20, bold: i === 0 || j === 1, color: i === 0 ? GRAY : INK }), { spacing: { after: 0 } })] })) })),
}));

kids.push(new Paragraph({ children: [new PageBreak()] }));
D.cards.forEach((c) => {
  const body = c.cues.map((t) => cue(t));
  if (c.next) body.push(para([run("→  ", { color: BLUE, bold: true, size: 24 }), run(c.next, { italics: true, color: GRAY, size: 24 })], { spacing: { before: 80, after: 0 } }));
  kids.push(card(`${c.n}  ·  ${c.title}`, `${c.secs} s  ·  ends at ${c.running}`, body));
  kids.push(gap());
});

kids.push(para(run("Questions: likely questions and short answers", { bold: true, size: 32, color: PINK }), { spacing: { after: 200 }, pageBreakBefore: true }));
D.qa.forEach(([q, a], i) => {
  kids.push(card(`Q${i + 1}  ·  ${q}`, "", [para(run(a, { size: 24 }), { spacing: { after: 0, line: 288 } })]));
  kids.push(gap());
});

kids.push(para(run("Full script (for practice)", { bold: true, size: 32 }), { spacing: { after: 200 }, pageBreakBefore: true }));
D.cards.forEach((c) => {
  kids.push(para([run(`${c.n}. ${c.title}`, { bold: true, size: 24 }), run(`   ${c.secs} s · ends at ${c.running}`, { size: 20, color: GRAY })], { spacing: { before: 160, after: 60 }, keepNext: true }));
  kids.push(para(run(c.script, { size: 22 }), { spacing: { after: 120, line: 288 } }));
});

const doc = new Document({
  creator: "Gabriel Mamane", title: "Night Signal - cue cards",
  styles: { default: { document: { run: { font: FONT, size: 22 } } } },
  numbering: { config: [{ reference: "cue", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 400, hanging: 300 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
      new TextRun({ text: "Night Signal · cue cards · page ", font: FONT, size: 16, color: GRAY }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: GRAY })] })] }) },
    children: kids,
  }],
});
const out = process.argv[2] || path.join(__dirname, "..", "Night_Signal_Cue_Cards.docx");
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(out, b); console.log("wrote", out, `| ${D.cards.length} cue cards + ${D.qa.length} Q&A cards`); });
