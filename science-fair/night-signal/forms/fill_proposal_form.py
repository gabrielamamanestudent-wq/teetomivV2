#!/usr/bin/env python3
"""
Fill page 1 (Experimental Project) of the school's Science Fair Proposal Form
with the REVISED scope (measurement accuracy + oxygen desaturation detection).

The original form has no fillable fields, so the answers are typed onto the
blank lines. Anything that is not known (grade level) is left blank on purpose.
Nothing is signed or submitted by this script.

usage:  python fill_proposal_form.py <blank_form.pdf> <output.pdf>
"""
import sys

import pymupdf

NAME = "Gabriel Mamane"
GRADE = ""            # left blank on purpose: Gabriel to fill in
TITLE = "Night Signal: SpO2 Accuracy"          # 27 characters (limit 30)

QUESTION = ("How closely do blood-oxygen (SpO2) and heart-rate readings from a low-cost wearable "
            "(MAX30102 fingertip sensor + ESP32) agree with a Health Canada-authorized fingertip "
            "pulse oximeter, and can software reliably flag oxygen desaturation events "
            "(a drop of at least 3 percentage points lasting at least 10 s) in the wearable's recordings?")
HYPOTHESIS = ("If the wearable is worn correctly and only good-quality readings are used, its SpO2 "
              "will agree with the reference oximeter within about ±3 percentage points, because both "
              "measure red/infrared light absorption, and the software will flag the dips the reference "
              "also shows. This project does not diagnose or confirm sleep apnea.")
DEPENDENT = ("Wearable minus reference SpO2 and heart rate (bias, 95% limits of agreement, mean absolute "
             "error); number of desaturation events flagged; percentage of recording time with a valid signal.")
INDEPENDENT = ("Measuring device (wearable vs. reference oximeter); test condition (seated rest; optional "
               "short supervised breath-holds only if approved by my teacher and the ethics committee).")
CONTROLS = ("Same participant, finger and cuff tightness; seated and still with warm hands; same room and "
            "lighting; paired readings taken at the same moments every 2 minutes; same firmware and "
            "detection settings (3-point drop, 10 s minimum, 120 s baseline); same reference oximeter.")

assert len(TITLE) <= 30, len(TITLE)


def blank_rows(page, label, n_lines):
    """The n blank underline rows that follow a label: list of (x0, x1, y_of_rule)."""
    rows, found = [], False
    for b in page.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            t = "".join(s["text"] for s in l["spans"]).strip()
            if found and t.startswith("____") and len(rows) < n_lines:
                x0, y0, x1, y1 = l["bbox"]
                rows.append((x0, x1, y0 + 10.6))          # underscores sit ~10.6 pt below the row top
            if t.startswith(label):
                found = True
    assert len(rows) == n_lines, (label, len(rows))
    return rows


def wrap(text, width, size):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if pymupdf.get_text_length(t, fontname="helv", fontsize=size) <= width or not cur:
            cur = t
        else:
            lines.append(cur); cur = w
    lines.append(cur)
    return lines


def write_block(page, rows, text, size=9.6, min_size=7.0):
    """Write text line by line just above each blank rule, shrinking the font until it fits."""
    while size >= min_size:
        width = min(x1 - x0 for x0, x1, _ in rows) - 6
        lines = wrap(text, width, size)
        if len(lines) <= len(rows):
            for (x0, x1, y), line in zip(rows, lines):
                page.insert_text((x0 + 3, y - 2.6), line, fontsize=size, fontname="helv", color=(0.05, 0.15, 0.45))
            return size
        size -= 0.2
    raise SystemExit(f"text does not fit: {text[:40]}")


def main(src, dst):
    doc = pymupdf.open(src)
    page = doc[0]
    blue = (0.05, 0.15, 0.45)
    # Forms required: B (human subject) — the participant is the student himself
    page.insert_text((217, 101.5), "X", fontsize=12, fontname="hebo", color=blue)
    page.insert_text((214, 168), NAME, fontsize=11, fontname="helv", color=blue)
    if GRADE:
        page.insert_text((508, 191), GRADE, fontsize=11, fontname="helv", color=blue)
    # Category: Health and Medical Sciences (filled bullet + tick)
    page.draw_circle((247.3, 262.0), 4.2, color=blue, fill=blue)
    page.draw_polyline([(424, 262), (428, 266.5), (436, 256)], color=blue, width=1.6)
    page.insert_text((76, 365.5), TITLE, fontsize=11, fontname="helv", color=blue)
    sizes = [write_block(page, blank_rows(page, "Experimental Question", 3), QUESTION),
             write_block(page, blank_rows(page, "Preliminary Hypothesis", 3), HYPOTHESIS),
             write_block(page, blank_rows(page, "Dependent variable", 2), DEPENDENT),
             write_block(page, blank_rows(page, "Independent variable", 2), INDEPENDENT),
             write_block(page, blank_rows(page, "Controls", 3), CONTROLS)]
    out = pymupdf.open()
    out.insert_pdf(doc, from_page=0, to_page=0)      # only the Experimental Project page is used
    out.save(dst, garbage=3, deflate=True)
    print("wrote", dst, "| font sizes used:", [round(s, 1) for s in sizes])


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
