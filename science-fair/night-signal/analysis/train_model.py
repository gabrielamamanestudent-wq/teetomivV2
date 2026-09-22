#!/usr/bin/env python3
"""
Night Signal - machine learning detector  (upgrade #2)
======================================================

Trains a machine-learning model to spot apnea events, then compares it head to
head with the simple rule-based detector — both scored against ground-truth
labels (in a real project, your breath-hold log; in the demo, the simulator's
known events).

For each 15-second window it builds simple features (how low the oxygen went,
how far it dropped, how much the heart rate swung) and learns which windows
are events. It then reports precision and recall for BOTH methods so you can
say which one works better and by how much.

USAGE
-----
    python train_model.py demo_night.csv demo_night_labels.csv

Educational prototype only. Not a medical diagnosis.
"""

import sys

import numpy as np
import pandas as pd

try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import precision_score, recall_score, f1_score
except ImportError:
    sys.exit("Missing scikit-learn. Run:  pip install scikit-learn")

import analyze


WINDOW_S = 15   # length of each window in seconds


def build_windows(df, labels):
    """Split the night into 15-second windows. For each window compute a few
    features and a label (1 = overlaps a known event)."""
    df = df.sort_values("timestamp").reset_index(drop=True)
    spo2 = df["spo2"].to_numpy(dtype=float)
    hr = df["heart_rate"].to_numpy(dtype=float)
    t = df["elapsed_s"].to_numpy(dtype=float)

    # Ground-truth event windows, in elapsed seconds from the start.
    t0 = df["timestamp"].iloc[0]
    ev = []
    for _, row in labels.iterrows():
        a = (pd.to_datetime(row["event_start"]) - t0).total_seconds()
        b = (pd.to_datetime(row["event_end"]) - t0).total_seconds()
        ev.append((a, b))

    def is_event(w0, w1):
        return any(a < w1 and b > w0 for a, b in ev)

    feats, ys = [], []
    end = t[-1]
    w = 0.0
    while w < end - WINDOW_S:
        m = (t >= w) & (t < w + WINDOW_S)
        if m.sum() >= 5:
            s = spo2[m]
            h = hr[m]
            feats.append([
                s.min(),                 # lowest oxygen in the window
                s.mean() - s.min(),      # how far it dipped
                s.max() - s.min(),       # oxygen swing
                h.max() - h.min(),       # heart-rate swing
                float(np.std(h)),        # heart-rate jitter
            ])
            ys.append(1 if is_event(w, w + WINDOW_S) else 0)
        w += WINDOW_S
    return np.array(feats), np.array(ys)


def rule_based_windows(df, events):
    """Label each 15s window 1 if the rule-based detector flagged an event in
    it — so we can score the rule the same way as the model."""
    df = df.sort_values("timestamp").reset_index(drop=True)
    t = df["elapsed_s"].to_numpy(dtype=float)
    t0 = df["timestamp"].iloc[0]
    ev = [((e["start_time"] - t0).total_seconds(),
           (e["end_time"] - t0).total_seconds()) for e in events]

    def flagged(w0, w1):
        return any(a < w1 and b > w0 for a, b in ev)

    out = []
    end = t[-1]
    w = 0.0
    while w < end - WINDOW_S:
        m = (t >= w) & (t < w + WINDOW_S)
        if m.sum() >= 5:
            out.append(1 if flagged(w, w + WINDOW_S) else 0)
        w += WINDOW_S
    return np.array(out)


def main():
    if len(sys.argv) < 3:
        sys.exit("Usage: python train_model.py <night.csv> <labels.csv>")
    csv_path, labels_path = sys.argv[1], sys.argv[2]

    df = analyze.load(csv_path)
    labels = pd.read_csv(labels_path)

    X, y = build_windows(df, labels)
    if y.sum() < 3:
        sys.exit("Too few event windows to train on. Use a longer night or "
                 "more events (python simulate.py --events 25).")

    rule_pred_all = rule_based_windows(
        df, analyze.find_events(df, 3.0, 10.0, 120.0))

    # Split into train / test so the model is judged on data it never saw.
    idx = np.arange(len(y))
    tr, te = train_test_split(idx, test_size=0.4, random_state=0, stratify=y)

    model = RandomForestClassifier(n_estimators=120, random_state=0,
                                   class_weight="balanced")
    model.fit(X[tr], y[tr])
    ml_pred = model.predict(X[te])
    rule_pred = rule_pred_all[te]
    truth = y[te]

    def scores(pred):
        return (precision_score(truth, pred, zero_division=0),
                recall_score(truth, pred, zero_division=0),
                f1_score(truth, pred, zero_division=0))

    ml = scores(ml_pred)
    rule = scores(rule_pred)

    print("\n" + "=" * 56)
    print("  APNEA DETECTION:  MACHINE LEARNING vs RULE-BASED")
    print("=" * 56)
    print(f"  Windows tested: {len(truth)}   (events: {int(truth.sum())})")
    print("  " + "-" * 46)
    print(f"  {'Method':<16}{'Precision':>11}{'Recall':>10}{'F1':>9}")
    print("  " + "-" * 46)
    print(f"  {'Rule-based':<16}{rule[0]:>11.2f}{rule[1]:>10.2f}{rule[2]:>9.2f}")
    print(f"  {'Machine learning':<16}{ml[0]:>11.2f}{ml[1]:>10.2f}{ml[2]:>9.2f}")
    print("=" * 56)
    names = ["lowest SpO₂", "dip depth", "SpO₂ swing", "HR swing", "HR jitter"]
    imp = sorted(zip(names, model.feature_importances_),
                 key=lambda p: -p[1])
    print("  What the model relies on most:")
    for n, v in imp[:3]:
        print(f"    - {n} ({v:.0%})")
    print("=" * 56)
    print("  (Precision = of flagged windows, how many were real events.)")
    print("  (Recall    = of real events, how many were caught.)")
    print("=" * 56 + "\n")


if __name__ == "__main__":
    main()
