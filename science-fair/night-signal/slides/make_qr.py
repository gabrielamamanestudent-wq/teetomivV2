#!/usr/bin/env python3
"""Make the QR codes used in the slides. They point to the public GitHub Pages
copies of the app and 3D model, so they open in Safari (or any phone browser)
without a login.

GitHub Pages must be switched on once: repo Settings > Pages > Deploy from a branch >
claude/science-fair-medical-project-7k0wk4, folder / (root).
"""
import os
import qrcode

BASE = "https://gabrielamamanestudent-wq.github.io/teetomivV2/science-fair/night-signal/"
LINKS = {
    "qr_app.png": BASE + "app/",
    "qr_3d.png": BASE + "app/3d.html",
    "qr_build.png": BASE + "build-kit.html",
}

here = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
for name, url in LINKS.items():
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=16, border=2)
    q.add_data(url); q.make(fit=True)
    q.make_image(fill_color="black", back_color="white").save(os.path.join(here, name))
    print(f"{name}: {url}")
