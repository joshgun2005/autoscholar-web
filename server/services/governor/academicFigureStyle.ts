/**
 * Publication-Quality Academic Finance Figures — Style Guide
 *
 * Injected into the Fisher agent's system prompt during figure generation.
 * Ensures all figures match the visual standards of JF, JFE, RFS, JFQA,
 * AER, QJE, and Econometrica.
 */

export const ACADEMIC_FIGURE_STYLE_DIRECTIVE = `
PUBLICATION-QUALITY ACADEMIC FINANCE FIGURES — MANDATORY DIRECTIVE
===================================================================

All figures you generate MUST comply with the following standards. No exceptions.

1. DESIGN PHILOSOPHY
--------------------

1.1 Restraint over decoration
Every element must earn its place. No gradients, shadows, 3D effects, rounded corners,
background images, watermarks, or decorative elements. Erase non-data-ink (Tufte).

1.2 Monochrome by default
Default palette is black and grayscale. Color only when line-style and marker
differentiation are exhausted. Figure must remain fully interpretable in B&W print.
Econometrica requires black-only for print; RFS charges $600/color figure; QJE prints B&W.

1.3 Print-first design
Design for printed PDF at journal column width. Minimum legible text: 7 pt after reduction.

1.4 Typographic discipline
Serif fonts (Times New Roman, STIX, CMU Serif) for axis labels and annotations.
Sans-serif (Helvetica, Arial) acceptable for tick labels. Never display/script/novelty fonts.

1.5 Data-ink ratio
Maximize ink devoted to data. Gridlines, borders, legends are support elements — visually
subordinate. Prefer direct labeling of series over separate legends (Schwabish 2014).

1.6 Self-contained figures
Every figure interpretable without the text. Axes labeled with units. Caption and notes
define all variables, samples, and methods.

1.7 Honest representation
Y-axis at zero for bar charts. Disclose axis breaks. No dual y-axes unless the
relationship between scales is the point. Always show confidence intervals where they exist.

1.8 Accessibility
WCAG 1.4.1: color is NOT the sole means of conveying information.
WCAG 1.4.11: non-text contrast ratio >= 3:1.
Never rely on red-green distinctions alone (8% of men are colorblind).

2. JOURNAL DIMENSION REFERENCE
------------------------------

| Journal | Single-col | Full width |
|---------|-----------|------------|
| JFE     | 90 mm     | 190 mm     |
| JF      | 80 mm     | 178 mm     |
| RFS     | ~84 mm    | ~174 mm    |
| AER     | ~84 mm    | ~174 mm    |

Resolution: Always export vector (PDF, EPS) for line art. 600 DPI min for raster.
Font embedding: pdf.fonttype=42, ps.fonttype=42. No Type 3 fonts — will be rejected.

3. TYPOGRAPHY AND LAYOUT
------------------------

3.1 Font sizes (at ~3.4 in single-column width, 1:1 scale):
- Axis labels: 9 pt
- Tick labels: 8 pt
- Legend: 8 pt
- Annotations: 7-8 pt
- Panel labels (A), (B): 10 pt bold serif

3.2 Line widths:
- Primary data line: 1.0-1.2 pt
- Secondary data lines: 0.8-1.0 pt
- Axis spines (bottom, left): 0.5 pt
- Gridlines (if used): 0.3 pt
- Reference/zero lines: 0.5 pt dashed
- Error bars: 0.8 pt
- Minimum for print: 0.25 pt

3.3 Spines: Keep bottom and left ONLY. Remove top and right.
Exception: heatmaps and boxplots may retain all four.

3.4 Tick direction: "in" (SciencePlots convention).
Minor ticks visible for continuous axes.

3.5 Figure sizes:
- Single-column: 3.4 x 2.6 in (golden ratio)
- Double-column: 7.0 x 4.0-5.0 in
- Slides: 10.0 x 5.5 in

4. COLOR POLICY — STRICT HIERARCHY
-----------------------------------

Priority order:
1. Black (#000000) — default for single-series and primary series
2. Grayscale: #595959 (dark), #8C8C8C (medium), #BFBFBF (light)
3. Colorblind-safe accents (ONLY if grayscale exhausted):

Paul Tol High-Contrast (3 colors, grayscale-safe):
  Blue: #004488, Yellow: #DDAA33, Red: #BB5566

Paul Tol Bright (7 colors):
  #4477AA, #EE6677, #228833, #CCBB44, #66CCEE, #AA3377, #BBBBBB

Okabe-Ito (8 colors):
  #E69F00, #56B4E9, #009E73, #F0E442, #0072B2, #D55E00, #CC79A7, #000000

PROHIBITED palettes: rainbow, jet, hsv, spectral, turbo, neon, seaborn defaults.
PROHIBITED: red-green pairs without additional line-style/marker differentiation.

Sequential colormaps: 'Greys' default; 'viridis' if color acceptable.
Diverging colormaps: 'RdBu_r' at low saturation, centered at zero.
NEVER use 'jet', 'rainbow', 'hot', 'cool', 'spectral'.

Shading fills:
- Confidence bands: alpha 0.20-0.30, gray
- Recession shading: alpha 0.12-0.18, gray
- Histogram bars: solid '0.70' with edgecolor='black'
- Fan chart: graded alpha 0.40 (center) to 0.08 (tails)

Grayscale-safe rule: Convert figure to grayscale — all series MUST remain
distinguishable. If not, add line-style or marker-shape differentiation.

5. CHART TYPE CONVENTIONS
-------------------------

5.1 Time-Series Line Charts
- Line width: 1.0-1.2 pt (single series); 0.8-1.0 pt (multi-series)
- Default: black solid for primary. Secondary: dash pattern first, then grayscale
- X-axis: dates as YYYY or YYYY-MM. 3-5 major ticks. No label overlap.
- Y-axis: units in parentheses (e.g., "Return (%)", "Spread (bps)")
- Recession shading: light gray axvspan, alpha 0.12-0.18, no border
- No markers unless frequency is annual or lower
- Prefer direct labeling at endpoints over legend

5.2 Multi-Line Comparison
- Normalize/rebase to common starting value (100 or 0). State in note.
- Line-style as primary differentiator, grayscale secondary, color tertiary
- >5 series → use small-multiples panel layout

5.3 Event-Study (CAR) Plots
- X-axis: integer event time, zero = event date. Label: "Event time (days)"
- Y-axis: "CAR (%)" — MUST include zero
- Event date: thin dashed black vertical line (lw 0.8)
- Zero reference: thin solid gray horizontal line (lw 0.4)
- Confidence bands (MANDATORY):
  - Inner (1 SE / 68%): medium gray, alpha 0.30
  - Outer (2 SE / 95%): light gray, alpha 0.15
  - State CI method in note
- Pre-trend: show enough pre-event window to validate flat pre-trend
- Multiple groups: solid black for primary, dashed gray for secondary
- NEVER omit confidence intervals

5.4 Coefficient Plots
- Point estimate: black filled circle, size 20-25 pts²
- 95% CI: thin black line (lw 0.8)
- 90% CI: thicker segment (lw 2.2) inside 95% line → "thick-thin" visual
- Zero reference: thin dashed gray line
- Variables ordered logically (NOT alphabetically)
- Multiple specs: dodging + marker shape (circle, square, triangle)
- "Controls included but not shown" — do NOT clutter with all controls

5.5 Bar Charts (Portfolio Sorts)
- Grayscale fills with thin black edges (lw 0.5)
- Grouped bars: distinct grayscale levels or hatching (/, \\, x)
- Y-axis MUST start at zero — NON-NEGOTIABLE
- Error bars: thin black, cap size 2-3 pt. State what they represent.
- Long-short spread bar: visually separated

5.6 Histogram / Density
- Light gray fill ('0.7'), thin black edges, 30-50 bins
- KDE overlay: black solid, lw 1.0-1.2. State bandwidth method.
- Label as "Frequency" (counts) or "Density" (normalized) — be explicit
- Mean reference: dashed vertical line, annotated with value

5.7 Scatter with Fit
- Markers: small (10-20 pts²), gray or semi-transparent (alpha 0.4-0.6)
- Fitted line: solid black, lw 1.0-1.2
- CI band: light gray (alpha 0.15-0.25)
- Annotate R² and slope in corner
- Fama-MacBeth: include 45-degree dashed gray reference + OLS solid black

5.8 Rolling Beta / Rolling Regression
- Central estimate: solid black, lw 1.0
- Confidence band: light gray fill
- State window length and step in note
- Reference line at full-sample estimate: thin dashed gray, annotated

5.9 Heatmaps (Correlation / Factor Exposure)
- Sequential: 'Greys'. Diverging: 'RdBu_r' at low saturation.
- Annotate cells with values if matrix <= 12x12
- Mask upper triangle for symmetric matrices
- NEVER use rainbow/jet colormap

5.10 Panel Figures
- Label: (A), (B), (C) in upper-left, serif bold, fontsize 10
- Use layout='constrained'
- Share axes when scale is comparable
- Consistent styling across all panels
- Max 6 subplots per page

5.11 Impulse Response / Local Projection
- X-axis: horizon h (h=0 = impact). Label: "Horizon (months)"
- Zero reference: dashed gray, lw 0.5
- Point estimates: solid black connecting horizons, lw 1.0
- Graded CI bands:
  - Inner (1 SE / 68%): medium gray, alpha 0.30
  - Outer (2 SE / 95%): light gray, alpha 0.15
- State SE construction: Newey-West, HAC, Driscoll-Kraay, etc.

5.12 RD Plots
- Binned scatter means as gray dots + separate polynomial fits (solid black) on each side
- Vertical cutoff line: thin dashed black
- Never fit across the cutoff
- Companion McCrary density diagnostic

5.13 DiD Event Study
- Period t=-1 is omitted reference: hollow marker at zero
- Pre-treatment coefficients should cluster around zero
- Show TWFE + robust estimator (Sun-Abraham, Callaway-Sant'Anna) side by side
- State estimator in note

5.14 Fan Charts
- Graded bands: darkest at center (10% around mode), each pair adds 10%
- 9 bands covering 5th to 95th percentile
- Anchor to last historical data point

5.15 Kaplan-Meier / Survival
- Step function (NOT smooth curves)
- Y-axis: survival probability starting at 1.0
- Censoring tick marks on curves
- Risk table below the plot

5.16 Diagnostic Plots (QQ, Residuals, ACF)
- QQ: small gray markers, 45-degree black reference
- Residuals: gray markers, horizontal zero dashed black
- ACF/PACF: thin black bars, dashed significance bounds. State level.

6. MANDATORY SETUP CODE
------------------------

EVERY Python script that generates figures MUST start with this setup:

\`\`\`python
import matplotlib as mpl
import matplotlib.pyplot as plt
import numpy as np

# --- Approved palettes ---
PALETTE_GRAYSCALE = ["#000000", "#595959", "#8C8C8C", "#BFBFBF"]
PALETTE_TOL_BRIGHT = ["#4477AA", "#EE6677", "#228833", "#CCBB44", "#66CCEE", "#AA3377", "#BBBBBB"]
PALETTE_TOL_HIGHCONTRAST = ["#004488", "#DDAA33", "#BB5566"]
PALETTE_OKABE_ITO = ["#000000", "#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7"]
LINESTYLES = ["-", "--", "-.", ":"]

def set_size(width_pt, fraction=1.0, subplots=(1, 1)):
    inches_per_pt = 1.0 / 72.27
    golden_ratio = (5 ** 0.5 - 1) / 2
    fig_width = width_pt * fraction * inches_per_pt
    fig_height = fig_width * golden_ratio * (subplots[0] / subplots[1])
    return (fig_width, fig_height)

def setup_jof_style(usetex=False):
    style = {
        "font.family": "serif",
        "font.serif": ["Times New Roman", "STIX", "TeX Gyre Termes", "CMU Serif", "DejaVu Serif"],
        "font.size": 9,
        "mathtext.fontset": "stix",
        "text.usetex": usetex,
        "axes.titlesize": 10,
        "axes.labelsize": 9,
        "axes.labelpad": 2,
        "axes.titlepad": 4,
        "axes.linewidth": 0.5,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "axes.facecolor": "white",
        "axes.edgecolor": "black",
        "axes.labelcolor": "black",
        "axes.prop_cycle": mpl.cycler(color=PALETTE_GRAYSCALE) + mpl.cycler(linestyle=LINESTYLES),
        "axes.grid": False,
        "xtick.labelsize": 8, "ytick.labelsize": 8,
        "xtick.direction": "in", "ytick.direction": "in",
        "xtick.major.width": 0.5, "ytick.major.width": 0.5,
        "xtick.major.size": 3.0, "ytick.major.size": 3.0,
        "xtick.minor.width": 0.5, "ytick.minor.width": 0.5,
        "xtick.minor.size": 1.5, "ytick.minor.size": 1.5,
        "xtick.minor.visible": True, "ytick.minor.visible": True,
        "xtick.top": True, "ytick.right": True,
        "xtick.major.pad": 2, "ytick.major.pad": 2,
        "grid.linewidth": 0.3, "grid.alpha": 0.3, "grid.color": "0.7", "grid.linestyle": "--",
        "legend.fontsize": 8, "legend.frameon": False,
        "legend.handlelength": 2.0, "legend.handletextpad": 0.5,
        "figure.facecolor": "white",
        "figure.dpi": 150,
        "figure.figsize": (3.4, 2.6),
        "figure.constrained_layout.use": True,
        "savefig.dpi": 600,
        "savefig.bbox": "tight",
        "savefig.pad_inches": 0.02,
        "savefig.facecolor": "white",
        "savefig.transparent": False,
        "savefig.format": "pdf",
        "pdf.fonttype": 42,
        "ps.fonttype": 42,
        "svg.fonttype": "none",
        "svg.hashsalt": "academic_finance_fixed",
        "lines.linewidth": 1.0,
        "lines.markersize": 4,
        "patch.edgecolor": "black",
        "patch.linewidth": 0.5,
    }
    if usetex:
        style["text.latex.preamble"] = r"\\usepackage{amsmath}\\usepackage{amssymb}"
    mpl.rcParams.update(style)

setup_jof_style(usetex=False)
\`\`\`

Call setup_jof_style() at the TOP of every figure-generating script. NEVER use
sns.set_theme() or sns.set_style() — Seaborn defaults are incompatible.

7. HELPER FUNCTIONS — USE THESE
-------------------------------

7.1 Save helper:
\`\`\`python
from pathlib import Path

def save_publication_figure(fig, filename, output_dir="figures", formats=("pdf", "png"), dpi_raster=600):
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    for fmt in formats:
        dpi = dpi_raster if fmt in ("png", "tiff", "jpg") else None
        fig.savefig(out / f"{filename}.{fmt}", format=fmt, dpi=dpi,
                    bbox_inches="tight", pad_inches=0.02, facecolor="white")
    plt.close(fig)
\`\`\`

7.2 Event-study plot:
- Use graded CI bands (inner 68% darker, outer 95% lighter)
- Vertical dashed line at event date
- Horizontal zero reference line
- Direct-label groups or minimal legend

7.3 Coefficient plot:
- Thick-thin CI style (90% thick inside 95% thin)
- Zero reference line
- Logically ordered variables

8. EXPORT STANDARDS
-------------------

- ALWAYS export PDF (vector, fonts embedded). Export PNG as companion preview.
- Export EPS when targeting OUP/Wiley journals.
- pdf.fonttype = 42 and ps.fonttype = 42 — MANDATORY.
- bbox_inches='tight', pad_inches=0.02
- White background (NOT transparent)
- savefig.dpi = 600 for raster
- Filename: fig_{section}_{description}_{version}.{ext}
  (e.g., fig_03_car_event_study_v1.pdf)
- Lowercase, underscores only. No spaces, no special chars.

9. CAPTION AND NOTES CONVENTIONS
---------------------------------

9.1 Caption: states WHAT the figure shows, not what to conclude.
Format: "Figure N: [Dependent variable] [around/over/across] [independent variable/event]."
One sentence. Do NOT reference colors (for B&W print).

9.2 Notes (begin with "Notes:"):
- Variable definitions and transformations
- Sample: time period, frequency, universe
- Methodology: estimation method, window lengths, benchmark
- Units (if not obvious from axis labels)
- CI level and construction method
- Normalization (if rebased)
- Data source
- 2-5 lines, compact, factual. NO interpretation.

10. QA CHECKLIST — VERIFY BEFORE FINALIZING
--------------------------------------------

Readability:
[ ] All axis labels present with units in parentheses
[ ] Tick labels legible at print size (>= 7 pt)
[ ] No clipped or overlapping labels/annotations/legends
[ ] Figure self-contained (interpretable without text)

Style:
[ ] Top and right spines removed
[ ] Tick direction "in"
[ ] Line widths >= 0.25 pt
[ ] Font sizes match spec (axis 9pt, ticks 8pt, legend 8pt)
[ ] Colors from approved palettes ONLY
[ ] No gradients, shadows, 3D effects

Grayscale & Accessibility:
[ ] All series distinguishable in grayscale
[ ] Line-style or marker-shape supplements color
[ ] Non-text contrast >= 3:1
[ ] No red-green only distinctions

Data Integrity:
[ ] Y-axis at zero for bar charts
[ ] Confidence intervals shown where uncertainty exists
[ ] No misleading truncation or axis manipulation

Panel Figures:
[ ] Panel labels (A), (B), (C) present and consistent
[ ] Shared axes have identical ranges
[ ] No label collisions

Export:
[ ] PDF with TrueType fonts (pdf.fonttype=42)
[ ] No Type 3 fonts
[ ] PNG at >= 300 DPI (600 DPI camera-ready)
[ ] Tight bounding box, white background
[ ] Proper filename convention

Reproducibility:
[ ] Random seeds fixed
[ ] svg.hashsalt set
[ ] Script re-runnable with identical output
`.trim();
