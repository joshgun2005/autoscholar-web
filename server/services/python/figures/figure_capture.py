"""
Figure capture utilities: blank PNG detection, base64 encoding, watermarking.
"""

import io
import base64
import numpy as np
import matplotlib.pyplot as plt


def is_figure_empty(fig):
    """Check if a matplotlib figure is empty (no meaningful content drawn).

    Returns True if the figure has no visible artists (lines, patches, images,
    collections, texts) on any of its axes, or if the rendered image is
    essentially a single solid colour (blank white/transparent).
    """
    # --- Fast check: inspect axes artists ---
    has_content = False
    for ax in fig.get_axes():
        if (ax.lines or ax.patches or ax.images or ax.collections
                or ax.texts or ax.tables
                or getattr(ax, 'containers', None)):
            has_content = True
            break
        # Check if axis has plotted data (non-default limits)
        xlim = ax.get_xlim()
        ylim = ax.get_ylim()
        if xlim != (0.0, 1.0) or ylim != (0.0, 1.0):
            has_content = True
            break

    if has_content:
        return False

    # If no axes at all and no figure-level content, it's empty
    if not fig.get_axes():
        return True

    # --- Pixel-level check: render to small image and check variance ---
    try:
        buf = io.BytesIO()
        fig.savefig(buf, format='png', dpi=30, bbox_inches='tight')
        buf.seek(0)
        from PIL import Image
        img = Image.open(buf).convert('RGB')
        pixels = np.array(img)
        # If the standard deviation of all pixel values is very low,
        # the image is essentially a single colour (blank)
        if pixels.std() < 5.0:
            return True
        buf.close()
    except Exception:
        # If PIL is not available, fall back to the artist-level check
        pass

    return not has_content


def add_watermark(fig):
    """Add AutoScholar watermark to a figure — bottom-right, teal, subtle."""
    fig.text(
        0.99, 0.01, 'AutoScholar',
        fontsize=9, color='#119993', alpha=0.6,
        ha='right', va='bottom',
        transform=fig.transFigure,
        fontweight='bold', style='italic'
    )


def capture_figures(figures_list, output_text_list, custom_print_fn):
    """Capture all matplotlib figures as base64 images, skipping empty ones.

    Args:
        figures_list: list to append base64 strings to
        output_text_list: list used by custom_print
        custom_print_fn: the custom print function to call for skip messages
    """
    figs = [plt.figure(i) for i in plt.get_fignums()]

    for fig in figs:
        # Skip empty / blank figures
        if is_figure_empty(fig):
            custom_print_fn(
                "[AutoScholar] Skipping empty figure — not included in output")
            continue

        # Add AutoScholar watermark
        add_watermark(fig)

        # Save figure to bytes buffer
        buf = io.BytesIO()
        fig.savefig(buf, format='png', dpi=150, bbox_inches='tight')
        buf.seek(0)

        # Encode to base64
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        figures_list.append(img_base64)

        buf.close()

    # Close all figures to free memory
    plt.close('all')
