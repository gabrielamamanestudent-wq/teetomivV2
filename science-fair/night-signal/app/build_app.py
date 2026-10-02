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
    ("3d_assembled.png", "3D design — assembled", "Sensor case on the velcro strap, cable to the finger clip"),
    ("3d_exploded.png", "3D design — exploded", "Every part inside the case, at its real size"),
    ("oxygen.png", "Oxygen through the night", "Apnea events found automatically (red bands)"),
    ("validation.png", "Accuracy test", "Bland–Altman: device vs reference oximeter"),
    ("position.png", "Sleep position result", "Apnea events per hour in each position"),
    ("heart.png", "Heart spin-off", "Racing, very slow and irregular heart episodes"),
    ("asthma.png", "Asthma spin-off", "Breathing rate rises toward morning, with coughing"),
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
    t0 = df["timestamp"].iloc[0]
    hours = df["elapsed_s"].iloc[-1] / 3600
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
        "hours": round(hours, 2), "ahi": round(len(events) / hours, 2), "events_count": len(events),
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
            name = {"racing": "Racing heart", "slow": "Very slow heart", "irregular": "Irregular rhythm"}[label]
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
    {"date": "Sep 2026", "title": "Idea, plan and first code", "detail": "Wearable oxygen + heart-rate monitor; analysis software written and tested on simulated nights.", "status": "done", "label": "Done"},
    {"date": "Sep 25", "title": "Proposal submitted", "detail": "Experimental project · Health and Medical Sciences.", "status": "done", "label": "Done"},
    {"date": "Sep–Oct", "title": "Advanced analyses + spin-offs", "detail": "Accuracy test, sleep position, breathing/HRV, machine learning, heart and asthma screening.", "status": "done", "label": "Done"},
    {"date": "Oct", "title": "3D design, firmware v3 and app", "detail": "Exploded 3D model with real part sizes; device self-test; this app with live connection.", "status": "done", "label": "Done"},
    {"date": "Oct 13", "title": "Ethics committee forms", "detail": "Human-subject project — submit the pre-questionnaire on the Technoscience site.", "status": "next", "label": "Due"},
    {"date": "Oct", "title": "Order parts and build the prototype", "detail": "Wire, flash firmware v3, pass check_device.py, photograph each step.", "status": "next", "label": "Next"},
    {"date": "Oct–Dec", "title": "Validation + recorded nights", "detail": "Reference-oximeter test, battery runtime test, supervised breath-hold tests, full nights.", "status": "todo", "label": "To do"},
    {"date": "Jan 11", "title": "Final slides for correction", "detail": "Replace example data with real results.", "status": "todo", "label": "To do"},
    {"date": "Jan 18–22", "title": "Class presentation", "detail": "7–10 minutes + 3 minutes of questions.", "status": "todo", "label": "To do"},
]

PROTOCOL = [
    ("Device check", "run check_device.py before every session; all checks must pass (data at 1/s, self-test OK, finger on, values believable)."),
    ("Battery runtime test", "fully charge, stream with a finger on the sensor, and log the time until the device stops — repeat 3 times."),
    ("Accuracy test", "while seated and awake, read a store-bought fingertip oximeter every 2 minutes for 30 minutes alongside the wearable; analyse with validate.py (Bland–Altman)."),
    ("Detection test", "supervised, awake breath-holds of 10, 15 and 20 s (5 of each, logged by time) — the known events used to score the rule and the machine-learning detector."),
    ("Recorded nights", "at least 5 nights; case on the upper arm, cuff on the index finger; log bedtime and sleeping position notes."),
    ("Analysis", "analyze.py (events, AHI), signals.py, position.py, train_model.py, heart.py and asthma.py on every night."),
    ("Safety", "never hold breath while asleep; stop if dizzy; parent/guardian consent and ethics approval before testing on anyone."),
]

PARTS = [
    {"name": 'AITRIP ESP32 ESP-WROOM-32 (30-pin, CP2102, USB-C)', "size": '≈ 52 × 28 mm · 13 mm tall with pins', "why": 'Processor + Bluetooth Classic', "links": [["Amazon.ca", 'https://www.amazon.ca/AITRIP-ESP-WROOM-32-Development-Microcontroller-Compatible/dp/B0DF2YJSHN']], "price": "see listing"},
    {"name": 'HiLetgo MAX30102 sensor', "size": '14 × 14 mm', "why": 'SpO₂ + heart rate (finger clip)', "links": [["Amazon.ca", 'https://www.amazon.ca/HiLetgo-MAX30102-Breakout-Oximetry-Solution/dp/B07QC67KMQ']], "price": "see listing"},
    {"name": 'HiLetgo GY-521 MPU-6050 (3-pack)', "size": '≈ 21 × 16 mm', "why": 'Sleep position + cough jolts', "links": [["Amazon.ca", 'https://www.amazon.ca/Hiletgo-MPU6050-Acc%C3%A9l%C3%A9rom%C3%A8tre-gyroscope-convertisseur/dp/B00LP25V1A']], "price": "see listing"},
    {"name": 'LiPo 3.7 V 500 mAh 503035, JST PH2.0', "size": '35 × 30 × 6 mm', "why": 'Battery (≈ 4–5 h — test it)', "links": [["Amazon.ca", 'https://www.amazon.ca/Battery-Rechargeable-Lithium-Polymer-Connector/dp/B07S84SBV3']], "price": "see listing"},
    {"name": 'Treedix TP4056 USB-C charger (6-pack)', "size": '≈ 28 × 17 mm', "why": 'Charges the battery safely', "links": [["Amazon.ca", 'https://www.amazon.ca/Treedix-Lithium-Charging-Protection-Functions/dp/B09LTVTY5J']], "price": "see listing"},
    {"name": 'Rakstore TPS63020 3.3 V buck-boost', "size": '1.8–5 V in → 3.3 V out', "why": 'Steady 3.3 V as the battery drains', "links": [["Amazon.ca", 'https://www.amazon.ca/Rakstore-TPS63020-Automatic-Buck-Boost-Converter/dp/B09V4SHLTJ']], "price": "see listing"},
    {"name": 'HoHaing ABS project box (8-pack)', "size": '70 × 45 × 29 mm · inside 66 × 41 × 25 mm', "why": 'The sensor case', "links": [["Amazon.ca", 'https://www.amazon.ca/HoHaing-Electrical-Junction-Enclosure-Electronic/dp/B0CGV22KKG']], "price": "see listing"},
    {"name": 'VELCRO Brand 1 in × 30 ft roll', "size": '25 mm wide · cut ≈ 300 mm + ≈ 80 mm', "why": 'Arm strap + finger loop', "links": [["Amazon.ca", 'https://www.amazon.ca/VELCRO-Brand-VEL-30768-AMS-Self-Gripping-Organization/dp/B09QH2NVM1']], "price": "see listing"},
    {"name": '100 kΩ resistors (2) + jumper wires', "size": '1/4 W', "why": 'Battery-level reading on GPIO 34', "links": [["Amazon.ca", 'https://www.amazon.ca/s?k=100k+ohm+resistor+1%2F4w']], "price": "see listing"},
    {"name": 'Elite Medica fingertip pulse oximeter', "size": 'Health Canada authorized', "why": 'Reference for the accuracy test', "links": [["Amazon.ca", 'https://www.amazon.ca/Elite-Medica-Fingertip-Saturation-Batteries/dp/B0DSGP91PB']], "price": "see listing"},
]
PARTS_NOTE = "All parts on Amazon.ca. Prices change — check each listing. Several items come in multi-packs, so you'll have spares. Sizes are from the listings; clone boards can vary by about ±2 mm, so measure yours. Inside the box the stack is about 22 mm (battery 6 + ESP32 with pins ≈ 13 + GY-521 ≈ 3), which fits the 25 mm inside height. The resistor link is an Amazon.ca search."

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
