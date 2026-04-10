"""
Journal of Finance / academic publication style matplotlib configuration.
Inspired by the Journal of Finance, Journal of Financial Economics, RFS.
Characteristics: serif fonts, muted palette, minimal chrome, publication-ready.
"""

import matplotlib

_JF_COLORS = [
    '#2C3E6B',   # deep navy
    '#8B1A1A',   # dark crimson
    '#2E6B4F',   # forest green
    '#6B4C2C',   # warm brown
    '#4C2C6B',   # deep purple
    '#1A5C6B',   # teal blue
    '#6B6B1A',   # olive
    '#3D3D3D',   # charcoal
]

matplotlib.rcParams.update({
    # Font — Computer Modern / serif to match LaTeX paper
    'font.family':          'serif',
    'font.serif':           ['DejaVu Serif', 'Times New Roman', 'Times', 'Georgia', 'serif'],
    'font.size':            10,
    'axes.titlesize':       11,
    'axes.labelsize':       10,
    'xtick.labelsize':      9,
    'ytick.labelsize':      9,
    'legend.fontsize':      9,
    'figure.titlesize':     12,

    # Colors — muted, print-safe
    'axes.prop_cycle':      matplotlib.cycler(color=_JF_COLORS),
    'axes.facecolor':       'white',
    'figure.facecolor':     'white',
    'axes.edgecolor':       '#333333',
    'axes.linewidth':       0.8,
    'grid.color':           '#CCCCCC',
    'grid.linewidth':       0.5,
    'grid.linestyle':       '--',
    'axes.grid':            True,
    'axes.axisbelow':       True,

    # Ticks — inward, minimal
    'xtick.direction':      'in',
    'ytick.direction':      'in',
    'xtick.major.size':     4,
    'ytick.major.size':     4,
    'xtick.minor.size':     2,
    'ytick.minor.size':     2,
    'xtick.major.width':    0.8,
    'ytick.major.width':    0.8,
    'xtick.top':            False,
    'ytick.right':          False,

    # Lines
    'lines.linewidth':      1.5,
    'lines.markersize':     5,
    'patch.linewidth':      0.8,

    # Legend — clean, no shadow
    'legend.frameon':       True,
    'legend.framealpha':    0.92,
    'legend.edgecolor':     '#AAAAAA',
    'legend.borderpad':     0.5,
    'legend.labelspacing':  0.4,

    # Figure layout
    'figure.dpi':           150,
    'savefig.dpi':          300,
    'savefig.bbox':         'tight',
    'savefig.pad_inches':   0.1,
    'figure.constrained_layout.use': True,

    # Spines — only bottom + left (cleaner academic look)
    'axes.spines.top':      False,
    'axes.spines.right':    False,
})
