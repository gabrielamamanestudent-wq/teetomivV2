"""
Night Signal - shared chart style
=================================

One look for every chart (Apple-keynote style, matching the slides):
white background, no chart box, light horizontal gridlines only, grey axis
text, a bold left-aligned title with a grey subtitle, and labels written
directly on the lines instead of legends where possible.

Fonts: uses SF Pro / Helvetica Neue on a Mac, Inter or Arial elsewhere.
To add a font folder (for example Inter .ttf files), set NS_FONT_DIR.
"""

import glob
import os

import matplotlib
from matplotlib import font_manager

INK = "#1d1d1f"
GRAY = "#6e6e73"
LIGHT = "#d2d2d7"
GRID = "#e8e8ed"
BLUE = "#0071e3"
PINK = "#ff375f"
RED = "#ff3b30"
ORANGE = "#ff9f0a"
GREEN = "#34c759"
MUTED = "#c7c7cc"


def apply():
    font_dir = os.environ.get("NS_FONT_DIR")
    if font_dir:
        for f in glob.glob(os.path.join(font_dir, "*.[ot]t[fc]")):
            font_manager.fontManager.addfont(f)
    matplotlib.rcParams.update({
        "font.family": "sans-serif",
        "font.sans-serif": ["SF Pro Display", "SF Pro Text", "Helvetica Neue", "Inter",
                            "Helvetica", "Arial", "Liberation Sans", "DejaVu Sans"],
        "text.color": INK, "axes.labelcolor": GRAY, "xtick.color": GRAY, "ytick.color": GRAY,
        "axes.edgecolor": LIGHT, "axes.linewidth": 1.0,
        "axes.spines.top": False, "axes.spines.right": False, "axes.spines.left": False,
        "axes.grid": True, "axes.grid.axis": "y", "grid.color": GRID, "grid.linewidth": 1.0,
        "axes.axisbelow": True,
        "xtick.major.size": 0, "ytick.major.size": 0, "xtick.major.pad": 8, "ytick.major.pad": 8,
        "axes.labelsize": 11.5, "xtick.labelsize": 11, "ytick.labelsize": 11,
        "legend.frameon": False, "legend.fontsize": 11,
        "figure.facecolor": "white", "axes.facecolor": "white", "savefig.facecolor": "white",
    })


def title(ax, main, sub=None):
    """Bold left-aligned title with an optional grey subtitle underneath."""
    ax.set_title(main, loc="left", fontsize=15, fontweight="bold", color=INK, pad=30 if sub else 14)
    if sub:
        ax.text(0, 1.03, sub, transform=ax.transAxes, fontsize=11.5, color=GRAY, va="bottom", ha="left")


def end_label(ax, y, text, color, x=1.005, va="center"):
    """Write a label just past the right end of a horizontal line."""
    ax.text(x, y, text, transform=ax.get_yaxis_transform(), color=color, fontsize=10.5,
            va=va, ha="left", fontweight="bold")
