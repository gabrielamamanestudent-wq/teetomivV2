#!/usr/bin/env python3
"""
Night Signal - build the companion app (app/index.html)
=======================================================

Runs the analysis scripts on your recorded nights and pours the results,
charts and screenshots into one self-contained web page. Re-run it after
every new recording so the app always shows your latest real data.

USAGE (from the app/ folder)
-----
    python build_app.py --night ../analysis/night.csv \\
        --reference ../analysis/night_reference.csv --labels ../analysis/night_labels.csv \\
        --heart ../analysis/heart_night.csv --asthma ../analysis/asthma_night.csv \\
        --images screenshots/ [--example]

    --example   mark the page as showing simulated example data
Then open the app:  python start_app.py
"""

import argparse
import base64
import datetime as dt
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "analysis"))

import numpy as np                      # noqa: E402
import pandas as pd                     # noqa: E402
import analyze                          # noqa: E402
import asthma as asthma_mod             # noqa: E402
import heart as heart_mod               # noqa: E402
from position import position_stats     # noqa: E402
from signals import breathing_rate, hrv # noqa: E402
from train_model import compare_detectors  # noqa: E402
from validate import agreement          # noqa: E402

GALLERY = [  # (file in --images, title, caption)
    ("3d_assembled.png", "3D design (v2 concept)", "Planned sealed case on a velcro strap, cable to the finger clip"),
    ("3d_exploded.png", "3D design — exploded", "Every planned part at its real size"),
    ("oxygen.png", "Demonstration: oxygen chart", "Simulated data · red bands = flagged desaturation events"),
    ("validation.png", "Demonstration: agreement chart", "Simulated data · how the reference comparison will be shown"),
    ("position.png", "Demonstration: position (exploratory)", "Simulated data · events per hour of valid recording"),
    ("heart.png", "Exploratory idea: heart rate", "Simulated data · not part of the tested project"),
    ("asthma.png", "Exploratory idea: breathing rate", "Simulated data · not part of the tested project"),
]


def data_uri(path, max_w=1400):
    """Embed an image. Big screenshots are shrunk to JPEG to keep the page light."""
    with open(path, "rb") as f:
        raw = f.read()
    try:
        from PIL import Image
        im = Image.open(io.BytesIO(raw))
        if im.width > max_w or len(raw) > 400_000:
            im = im.convert("RGB")
            if im.width > max_w:
                im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
            buf = io.BytesIO(); im.save(buf, "JPEG", quality=84, optimize=True)
            return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    except ImportError:
        pass
    mime = "image/png" if path.lower().endswith(".png") else "image/jpeg"
    return f"data:{mime};base64," + base64.b64encode(raw).decode()


def per_minute(values, times):
    s = pd.Series(np.asarray(values, dtype=float), index=pd.DatetimeIndex(times))
    return [None if np.isnan(v) else round(float(v), 2) for v in s.resample("1min").mean().to_numpy()]


def night_summary(path):
    df = analyze.load(path)
    events = analyze.find_events(df, 3.0, 10.0, 120.0)
    rate = analyze.event_rate(df, events)
    t0 = df["timestamp"].iloc[0]
    raw = pd.read_csv(path)
    raw["timestamp"] = pd.to_datetime(raw["timestamp"])
    hrv_rows = raw[raw["hr_valid"] == 1]
    hr = hrv_rows["heart_rate"].to_numpy(dtype=float)
    br = [breathing_rate(hr[i:i + 120]) for i in range(0, len(hr) - 120, 120)]
    br = [b for b in br if b is not None]
    sdnn, rmssd = hrv(hr)
    pos = position_stats(path) or {}
    mins = lambda ts: int((ts - t0).total_seconds() // 60)
    return {
        "date": t0.strftime("%A %d %B %Y").replace(" 0", " "),
        "start": t0.strftime("%H:%M"), "end": df["timestamp"].iloc[-1].strftime("%H:%M"),
        "hours": round(rate["total_hours"], 2), "valid_hours": round(rate["valid_hours"], 2),
        "valid_pct": round(rate["valid_pct"], 1), "rate": round(rate["rate"], 2), "events_count": len(events),
        "avg_spo2": round(float(df["spo2"].mean()), 2), "low_spo2": int(df["spo2"].min()),
        "avg_hr": round(float(hr.mean()), 1), "low_hr": int(hr.min()),
        "breathing": round(float(np.median(br)), 1) if br else None,
        "sdnn": round(sdnn, 1), "rmssd": round(rmssd, 1),
        "spo2": per_minute(df["spo2_smooth"], df["timestamp"]),
        "events": [[mins(e["start_time"]), mins(e["end_time"])] for e in events],
        "positions": [{"name": k, "hours": round(v["hours"], 2), "events": v["events"], "rate": round(v["rate"], 2)}
                      for k, v in pos.items() if v["hours"] > 0.05],
    }


def heart_summary(path):
    df = pd.read_csv(path); df["timestamp"] = pd.to_datetime(df["timestamp"])
    r = heart_mod.analyze_heart(df)
    d, t0 = r["df"], r["df"]["timestamp"].iloc[0]
    mins = lambda i: int((d["timestamp"].iloc[i] - t0).total_seconds() // 60)
    eps = []
    for kind, label in (("fast", "racing"), ("slow", "slow"), ("irregular", "irregular")):
        for a, b in r[kind]:
            seg = r["hr"][a:b + 1]
            name = {"racing": "Fast heart rate", "slow": "Very slow heart rate", "irregular": "Unsteady rate"}[label]
            eps.append({"type": label, "a": mins(a), "b": mins(b),
                        "label": f"{name} · {(r['t'][b] - r['t'][a]) / 60:.1f} min · {int(seg.min())}–{int(seg.max())} bpm",
                        "when": d["timestamp"].iloc[a].strftime("%H:%M")})
    eps.sort(key=lambda e: e["a"])
    return {"start": t0.strftime("%H:%M"), "hr": per_minute(r["smooth"], d["timestamp"]),
            "resting": round(r["resting"], 1), "min": int(r["smooth"].min()), "max": int(r["smooth"].max()),
            "sdnn": round(r["sdnn"], 1), "episodes": eps,
            "counts": {"racing": len(r["fast"]), "slow": len(r["slow"]), "irregular": len(r["irregular"])}}


def asthma_summary(path):
    r = asthma_mod.analyze_asthma(path)
    t = r["times"]; first = t[0] - pd.Timedelta(seconds=asthma_mod.WIN // 2)
    cough_idx = [round((c - t[0]).total_seconds() / asthma_mod.WIN, 2) for c in r["coughs"]
                 if t[0] <= c <= t[-1]]
    return {"start": first.strftime("%H:%M"), "rates": [round(float(x), 2) for x in r["rates"]],
            "fast": [bool(x) for x in r["fast"]], "limit": round(r["limit"], 1), "baseline": round(r["baseline"], 1),
            "early": round(r["early"], 1), "late": round(r["late"], 1),
            "fast_min": int(r["fast"].sum() * asthma_mod.WIN / 60), "odi": round(r["odi"], 2), "dips": r["dips"],
            "coughs": len(r["coughs"]), "coughs_per_h": round(len(r["coughs"]) / r["hours"], 2),
            "cough_idx": cough_idx, "worse": bool(r["late"] > r["early"] * 1.2)}


PROGRESS = [
    {"date": "Sep 2026", "title": "Idea, plan and first code", "detail": "Wearable SpO₂ + heart-rate monitor designed; analysis software written and tested on SIMULATED data only.", "status": "done", "label": "Done"},
    {"date": "Sep 25", "title": "Original proposal submitted", "detail": "Experimental project · Health and Medical Sciences.", "status": "done", "label": "Done"},
    {"date": "Oct", "title": "Scope revised after Ms. Ireland's questions", "detail": "Focus on measurement accuracy and oxygen desaturation detection; no sleep-apnea diagnosis. Approval of the revised scope is pending.", "status": "next", "label": "Pending"},
    {"date": "Oct", "title": "Software, 3D design and app", "detail": "Firmware written (not yet run on hardware); analysis, simulator, app and 3D model done.", "status": "done", "label": "Done"},
    {"date": "Oct 13", "title": "Ethics committee forms", "detail": "Human-subject project: the student is the participant. No testing before approval and signed consent.", "status": "next", "label": "Due"},
    {"date": "Oct", "title": "Order parts and build the prototype", "detail": "Not started yet. Then flash the firmware and pass check_device.py.", "status": "todo", "label": "To do"},
    {"date": "Oct–Dec", "title": "Data collection (after approval)", "detail": "Seated accuracy sessions against the reference oximeter; overnight recordings for signal quality; optional breath-hold test only if approved.", "status": "todo", "label": "To do"},
    {"date": "Jan 11", "title": "Final slides for correction", "detail": "Replace the demonstration data with real results.", "status": "todo", "label": "To do"},
    {"date": "Jan 18–22", "title": "Class presentation", "detail": "7–10 minutes + 3 minutes of questions.", "status": "todo", "label": "To do"},
]

PROTOCOL = [
    ("Device check", "run check_device.py before every session; all checks must pass (data at 1/s, self-test OK, finger on, values believable)."),
    ("Approvals first", "no testing on anyone (including myself) until Ms. Ireland approves the revised scope, the ethics committee approves, and consent is signed."),
    ("Accuracy sessions (main test)", "seated and awake; wearable on one index finger, reference oximeter on the other hand; record both SpO₂ and heart rate every 2 minutes for 30 minutes; repeat on several days; analyse with validate.py (bias, 95% limits of agreement)."),
    ("Signal-quality checks", "finger on sensor, sensor-valid flag, believable range, and movement exclusion; report the % of valid data for every session."),
    ("Overnight recordings", "if approved: wear the device during normal sleep to measure signal quality and the desaturation-event rate per hour of valid recording. The reference cannot record overnight, so these events cannot be verified."),
    ("Optional breath-hold test", "only if approved: short supervised awake breath-holds to see whether induced dips are flagged at the logged times. This does not validate sleep-apnea detection."),
    ("Analysis", "analyze.py (desaturation events per valid hour), validate.py; position, heart and breathing scripts are exploratory only."),
]

PARTS = [
    {"name": 'AITRIP ESP32 ESP-WROOM-32 (30-pin, CP2102, USB-C)', "size": '≈ 52 × 28 mm · pins pre-soldered', "why": 'Processor + Bluetooth Classic', "links": [["Amazon.ca", 'https://www.amazon.ca/AITRIP-ESP-WROOM-32-Development-Microcontroller-Compatible/dp/B0DF2YJSHN']], "price": "see listing"},
    {"name": 'HiLetgo MAX30102 sensor', "size": '14 × 14 mm · 4 pins to solder', "why": 'SpO₂ + heart rate (finger clip)', "links": [["Amazon.ca", 'https://www.amazon.ca/HiLetgo-MAX30102-Breakout-Oximetry-Solution/dp/B07QC67KMQ']], "price": "see listing"},
    {"name": 'SHILLEHTEK GY-521 MPU-6050, pre-soldered (2-pack)', "size": '≈ 21 × 16 mm', "why": 'Sleep position + cough jolts', "links": [["Amazon.ca", 'https://www.amazon.ca/Pre-Soldered-Accelerometer-Raspberry-Compatible-Arduino/dp/B0BMY15TC4']], "price": "see listing"},
    {"name": 'ELEGOO 120 Dupont jumper wires (F-F, M-F, M-M)', "size": '20 cm each', "why": 'Plug-in wiring, no soldering', "links": [["Amazon.ca", 'https://www.amazon.ca/Elegoo-120pcs-Multicolored-Breadboard-arduino/dp/B01EV70C78']], "price": "see listing"},
    {"name": 'Running armband phone pouch', "size": 'fits phones up to 6.9 in', "why": 'Holds the ESP32 on the forearm', "links": [["Amazon.ca", 'https://www.amazon.ca/Running-Armband-Samsung-Resistant-Emergency/dp/B08HZ3BPK4']], "price": "see listing"},
    {"name": 'Anker Powerline+ USB-A to USB-C cable', "size": '3 m (10 ft)', "why": 'All-night power from a phone charger', "links": [["Amazon.ca", 'https://www.amazon.ca/Anker-Powerline-Double-Braided-Charging-Samsung/dp/B07G148YMS']], "price": "see listing"},
    {"name": 'Anker USB-C to USB-A adapter (2-pack)', "size": 'USB-C → USB-A', "why": 'Plug the cable into a MacBook', "links": [["Amazon.ca", 'https://www.amazon.ca/Adapter-Anker-High-Speed-Transfer-Notebook/dp/B08HZ6PS61']], "price": "see listing"},
    {"name": 'VELCRO Brand 1 in × 30 ft roll', "size": '25 mm wide · cut ≈ 80 mm', "why": 'Finger loop', "links": [["Amazon.ca", 'https://www.amazon.ca/VELCRO-Brand-VEL-30768-AMS-Self-Gripping-Organization/dp/B09QH2NVM1']], "price": "see listing"},
    {"name": 'Elite Medica fingertip pulse oximeter', "size": 'Health Canada authorized', "why": 'Reference for the accuracy test', "links": [["Amazon.ca", 'https://www.amazon.ca/Elite-Medica-Fingertip-Saturation-Batteries/dp/B0DSGP91PB']], "price": "see listing"},
]

PARTS_NOTE = "All parts on Amazon.ca. Prices change — check each listing. Several items come in multi-packs, so you'll have spares. Everything plugs together with jumper wires; only the MAX30102's 4 header pins need soldering (about 5 minutes — ask a teacher). Power comes from a phone charger through the 3 m cable, so it runs all night."

REFS = [
    "American Academy of Sleep Medicine. (2014). International classification of sleep disorders (3rd ed.).",
    "Berry, R. B., et al. (2012). Rules for scoring respiratory events in sleep. Journal of Clinical Sleep Medicine, 8(5), 597–619.",
    "Bland, J. M., & Altman, D. G. (1986). Statistical methods for assessing agreement between two methods of clinical measurement. The Lancet, 327(8476), 307–310.",
    "Jubran, A. (2015). Pulse oximetry. Critical Care, 19, 272.",
    "Task Force of the European Society of Cardiology and NASPE. (1996). Heart rate variability: Standards of measurement, physiological interpretation, and clinical use. Circulation, 93(5), 1043–1065.",
    "Global Initiative for Asthma. (2024). Global strategy for asthma management and prevention.",
    "Maxim Integrated. (2020). MAX30102 high-sensitivity pulse oximeter and heart-rate sensor [Datasheet].",
]


def main():
    ap = argparse.ArgumentParser(description="Build the Night Signal app.")
    ap.add_argument("--night", required=True); ap.add_argument("--reference", required=True)
    ap.add_argument("--labels", required=True); ap.add_argument("--heart", required=True)
    ap.add_argument("--asthma", required=True); ap.add_argument("--images", default="screenshots")
    ap.add_argument("--links", default="links.json", help="JSON list of [title, url] project links")
    ap.add_argument("--out", default=os.path.join(HERE, "index.html"))
    ap.add_argument("--example", action="store_true")
    a = ap.parse_args()

    v = agreement(a.night, a.reference)
    ml = compare_detectors(a.night, a.labels)
    gallery = []
    for fname, title, cap in GALLERY:
        p = os.path.join(a.images, fname)
        if os.path.exists(p):
            gallery.append({"src": data_uri(p), "title": title, "caption": cap})
        else:
            print(f"  (no {fname} in {a.images} — skipped)")
    links = json.load(open(a.links)) if os.path.exists(a.links) else []
    data = {
        "generated": dt.date.today().isoformat(), "example": a.example,
        "night": night_summary(a.night),
        "validation": {k: round(float(v[k]), 3) for k in ("mae", "bias", "loa_low", "loa_high", "r")} | {"n": v["n"]},
        "ml": {"rule": dict(zip("prf", map(float, ml["rule"]))), "ml": dict(zip("prf", map(float, ml["ml"])))},
        "heart": heart_summary(a.heart), "asthma": asthma_summary(a.asthma),
        "gallery": gallery, "progress": PROGRESS, "protocol": PROTOCOL, "parts": PARTS,
        "parts_note": PARTS_NOTE, "refs": REFS, "links": links,
    }
    # the page reads ml.rule.r etc.
    tpl = open(os.path.join(HERE, "app_template.html"), encoding="utf-8").read()
    html = tpl.replace("/*__DATA__*/null", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"))
    with open(a.out, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Built {a.out}  ({len(html) / 1e6:.2f} MB, {len(gallery)} pictures)")


if __name__ == "__main__":
    main()
