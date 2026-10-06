#!/usr/bin/env python3
"""Soft glow backgrounds for the black slides (Apple-keynote look)."""
import os
import numpy as np
from PIL import Image

W, H = 1920, 1080
here = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")

def glow(name, spots):
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    img = np.zeros((H, W, 3), np.float32)
    for cx, cy, rx, ry, rgb, strength in spots:
        d = ((x - cx * W) / (rx * W)) ** 2 + ((y - cy * H) / (ry * H)) ** 2
        a = strength * np.exp(-d * 2.2)
        img += a[..., None] * np.array(rgb, np.float32)[None, None, :]
    img += np.random.default_rng(1).normal(0, 0.6, img.shape)        # tiny grain: no colour banding
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(os.path.join(here, name), optimize=True)
    print("wrote", name)

BLUE, TEAL, PINK = (20, 70, 150), (20, 120, 120), (150, 30, 70)
glow("bg_glow_center.png", [(0.5, 0.66, 0.42, 0.5, BLUE, 0.55), (0.56, 0.72, 0.22, 0.28, TEAL, 0.35)])
glow("bg_glow_corner.png", [(0.92, 0.05, 0.45, 0.6, BLUE, 0.5), (0.05, 1.0, 0.35, 0.45, PINK, 0.28)])
glow("bg_glow_low.png",    [(0.5, 1.05, 0.6, 0.45, BLUE, 0.55), (0.75, 1.0, 0.3, 0.3, TEAL, 0.3)])
