"""
File export functions: save_excel, save_word, save_latex, df_to_latex.

These functions are extracted from the CustomPythonExecutor.execute() method.
Each function that originally referenced self.files now takes a `files_list`
parameter instead, to which it appends file metadata dicts.
The helper functions _convert_numpy and _detect_number_format are also here.
"""

import os
import re
import time
import tempfile
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime


def _convert_numpy(val):
    """Convert numpy types to Python native types for openpyxl compatibility"""
    if val is None or (hasattr(val, '__class__') and val.__class__.__name__ in ('NaT', 'NaTType')):
        return None
    if hasattr(np, 'integer') and isinstance(val, np.integer):
        return int(val)
    if hasattr(np, 'floating') and isinstance(val, np.floating):
        if np.isnan(val) or np.isinf(val):
            return None
        return float(val)
    if hasattr(np, 'bool_') and isinstance(val, np.bool_):
        return bool(val)
    if hasattr(np, 'ndarray') and isinstance(val, np.ndarray):
        return val.tolist()
    if isinstance(val, pd.Timestamp):
        return val.to_pydatetime()
    if hasattr(val, 'item'):
        return val.item()
    return val


def _detect_number_format(col_name):
    """Auto-detect number format based on column name"""
    col_lower = str(col_name).lower()
    pct_keywords = ['pct', 'percent', 'return', 'margin', 'yield', 'rate', 'ratio',
                    'growth', 'change', 'weight', 'allocation', 'drawdown', 'sharpe',
                    'sortino', 'alpha', 'beta', 'volatility', 'vol']
    if any(kw in col_lower for kw in pct_keywords):
        return '0.00%'
    price_keywords = ['price', 'close', 'open', 'high', 'low', 'adj', 'value',
                      'revenue', 'income', 'profit', 'cost', 'expense', 'ebitda',
                      'earnings', 'sales', 'assets', 'liabilities', 'equity',
                      'market_cap', 'marketcap', 'nav', 'amount']
    if any(kw in col_lower for kw in price_keywords):
        return '#,##0.00'
    vol_keywords = ['volume', 'shares', 'count', 'qty', 'quantity']
    if any(kw in col_lower for kw in vol_keywords):
        return '#,##0'
    return None


def _escape_latex(text):
    """Escape special LaTeX characters in plain text."""
    if not isinstance(text, str):
        text = str(text)
    specials = {
        '&': r'\&', '%': r'\%', '$': r'\$', '#': r'\#',
        '_': r'\_', '{': r'\{', '}': r'\}', '~': r'\textasciitilde{}',
        '^': r'\textasciicircum{}',
    }
    for char, replacement in specials.items():
        text = text.replace(char, replacement)
    return text


def save_excel(files_list, data, filename='analysis.xlsx', sheet_name='Sheet1', index=False,
               title=None, summary=True, conditional_formatting=True, formulas=None):
    """Save DataFrame(s) as a professionally styled Excel file with formulas and conditional formatting.

    Args:
        files_list: list to append file metadata dicts to
        data: DataFrame for single sheet, or dict {sheet_name: DataFrame} for multi-sheet
        filename: Output filename (.xlsx)
        sheet_name: Sheet name (only used if data is a single DataFrame)
        index: Whether to include the DataFrame index
        title: Title row text (defaults to sheet name)
        summary: True (all), False (none), or list like ['sum', 'average'] for selected stats
        conditional_formatting: True to auto-apply color scales and data bars
        formulas: List of dicts [{"col": "Total", "formula": "=B{row}+C{row}", "format": "#,##0.00"}]
    """
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Border, Side, Alignment
    from openpyxl.utils import get_column_letter
    from openpyxl.formatting.rule import ColorScaleRule, DataBarRule

    if not filename.endswith('.xlsx'):
        filename += '.xlsx'
    safe_name = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    filepath = os.path.join(tempfile.gettempdir(), f'vq_{int(time.time())}_{safe_name}')

    # Normalize input to dict of DataFrames
    if isinstance(data, pd.DataFrame):
        sheets = {sheet_name: data}
    elif isinstance(data, dict):
        sheets = data
    else:
        raise ValueError("save_excel expects a DataFrame or dict of DataFrames")

    wb = Workbook()
    first = True

    # Styles
    teal_hex = '119993'
    header_fill = PatternFill(start_color=teal_hex, end_color=teal_hex, fill_type='solid')
    header_font = Font(bold=True, color='FFFFFF', size=11, name='Calibri')
    header_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    thin_border = Border(
        left=Side(style='thin', color='D0D0D0'),
        right=Side(style='thin', color='D0D0D0'),
        top=Side(style='thin', color='D0D0D0'),
        bottom=Side(style='thin', color='D0D0D0'),
    )
    even_fill = PatternFill(start_color='F2F9F9', end_color='F2F9F9', fill_type='solid')
    data_font = Font(size=10, name='Calibri')
    data_alignment = Alignment(vertical='center')
    title_font = Font(bold=True, color=teal_hex, size=14, name='Calibri')
    subtitle_font = Font(italic=True, color='888888', size=9, name='Calibri')
    summary_label_font = Font(bold=True, size=10, name='Calibri', color='333333')
    summary_value_font = Font(bold=True, size=10, name='Calibri', color=teal_hex)
    summary_fill = PatternFill(start_color='F0F0F0', end_color='F0F0F0', fill_type='solid')
    teal_top_border = Border(top=Side(style='thin', color=teal_hex))

    # Determine which summary rows to include
    all_summary_funcs = ['sum', 'average', 'min', 'max', 'count']
    if summary is True:
        active_summaries = all_summary_funcs
    elif summary is False or summary is None:
        active_summaries = []
    elif isinstance(summary, (list, tuple)):
        active_summaries = [s.lower() for s in summary if s.lower() in all_summary_funcs]
    else:
        active_summaries = all_summary_funcs

    summary_labels = {
        'sum': 'SUM', 'average': 'AVERAGE', 'min': 'MIN', 'max': 'MAX', 'count': 'COUNT'
    }
    summary_excel_funcs = {
        'sum': 'SUM', 'average': 'AVERAGE', 'min': 'MIN', 'max': 'MAX', 'count': 'COUNT'
    }

    def _classify_column(col_name):
        """Classify column for conditional formatting: 'return', 'volume', 'price', or None"""
        col_lower = str(col_name).lower()
        return_kw = ['return', 'performance', 'pnl', 'gain', 'loss', 'change', 'alpha',
                     'excess', 'spread', 'drawdown']
        if any(kw in col_lower for kw in return_kw):
            return 'return'
        vol_kw = ['volume', 'quantity', 'qty', 'count', 'shares', 'trades', 'transactions']
        if any(kw in col_lower for kw in vol_kw):
            return 'volume'
        price_kw = ['price', 'close', 'open', 'high', 'low', 'value', 'nav', 'amount',
                    'revenue', 'income', 'cost', 'expense', 'assets', 'equity', 'market_cap']
        if any(kw in col_lower for kw in price_kw):
            return 'price'
        return None

    for sname, df in sheets.items():
        if not isinstance(df, pd.DataFrame):
            continue
        if first:
            ws = wb.active
            ws.title = sname[:31]
            first = False
        else:
            ws = wb.create_sheet(title=sname[:31])

        # Tab color (teal)
        try:
            ws.sheet_properties.tabColor = teal_hex
        except Exception:
            pass

        # Optionally reset index
        if index and df.index.name:
            df = df.reset_index()

        cols = list(df.columns)

        # Handle empty DataFrame
        if len(df) == 0 or len(cols) == 0:
            ws.cell(row=1, column=1, value=title or sname).font = title_font
            ws.cell(row=2, column=1, value=f"Generated: {datetime.now().strftime('%B %d, %Y')}").font = subtitle_font
            ws.cell(row=4, column=1, value="No data").font = data_font
            continue

        num_formats = [_detect_number_format(c) for c in cols]

        # === TITLE ROWS (rows 1-3) ===
        sheet_title = title or sname
        # Row 1: Merged title
        ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(cols))
        title_cell = ws.cell(row=1, column=1, value=sheet_title)
        title_cell.font = title_font
        title_cell.alignment = Alignment(horizontal='left', vertical='center')

        # Row 2: Subtitle with date
        ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=len(cols))
        subtitle_cell = ws.cell(row=2, column=1, value=f"Generated: {datetime.now().strftime('%B %d, %Y')}")
        subtitle_cell.font = subtitle_font
        subtitle_cell.alignment = Alignment(horizontal='left', vertical='center')

        # Row 3: Spacer
        ws.row_dimensions[3].height = 6

        # === HEADERS (row 4) ===
        header_row = 4
        data_start_row = 5

        for col_idx, col_name in enumerate(cols, 1):
            cell = ws.cell(row=header_row, column=col_idx, value=str(col_name))
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_alignment
            cell.border = thin_border

        # === CUSTOM FORMULA COLUMNS ===
        formula_cols = []
        if formulas and isinstance(formulas, list):
            for f_def in formulas:
                try:
                    f_col_name = f_def.get('col', 'Calculated')
                    f_formula_tpl = f_def.get('formula', '')
                    f_format = f_def.get('format', None)
                    cols.append(f_col_name)
                    formula_cols.append({
                        'col_idx': len(cols),
                        'name': f_col_name,
                        'template': f_formula_tpl,
                        'format': f_format
                    })
                    num_formats.append(None)
                    # Write header for formula column
                    cell = ws.cell(row=header_row, column=len(cols), value=str(f_col_name))
                    cell.font = header_font
                    cell.fill = header_fill
                    cell.alignment = header_alignment
                    cell.border = thin_border
                except Exception:
                    pass

        # === DATA ROWS (starting at row 5) ===
        for row_idx_0, (_, row) in enumerate(df.iterrows()):
            excel_row = data_start_row + row_idx_0
            for col_idx, col_name in enumerate(list(df.columns), 1):
                val = _convert_numpy(row[col_name])
                cell = ws.cell(row=excel_row, column=col_idx, value=val)
                cell.font = data_font
                cell.alignment = data_alignment
                cell.border = thin_border
                # Zebra striping
                if row_idx_0 % 2 == 1:
                    cell.fill = even_fill
                # Number format
                fmt = num_formats[col_idx - 1]
                if fmt and isinstance(val, (int, float)):
                    cell.number_format = fmt

            # Write formula columns for this row
            for fc in formula_cols:
                try:
                    formula_str = fc['template'].replace('{row}', str(excel_row))
                    cell = ws.cell(row=excel_row, column=fc['col_idx'], value=formula_str)
                    cell.font = data_font
                    cell.alignment = data_alignment
                    cell.border = thin_border
                    if row_idx_0 % 2 == 1:
                        cell.fill = even_fill
                    if fc['format']:
                        cell.number_format = fc['format']
                except Exception:
                    pass

        last_data_row = data_start_row + len(df) - 1

        # === SUMMARY FORMULAS ===
        # Detect numeric columns
        numeric_col_indices = []
        for col_idx, col_name in enumerate(list(df.columns), 1):
            try:
                if pd.api.types.is_numeric_dtype(df[col_name]):
                    numeric_col_indices.append(col_idx)
            except Exception:
                pass
        # Also include formula columns as numeric for summary
        for fc in formula_cols:
            numeric_col_indices.append(fc['col_idx'])

        if active_summaries and numeric_col_indices and len(df) > 0:
            summary_start = last_data_row + 2  # One blank row separator

            for s_offset, func_key in enumerate(active_summaries):
                s_row = summary_start + s_offset
                excel_func = summary_excel_funcs[func_key]
                label_text = summary_labels[func_key]

                # Label in column A
                label_cell = ws.cell(row=s_row, column=1, value=label_text)
                label_cell.font = summary_label_font
                label_cell.fill = summary_fill
                if s_offset == 0:
                    label_cell.border = teal_top_border

                # Formulas for numeric columns
                for col_idx in numeric_col_indices:
                    col_letter = get_column_letter(col_idx)
                    formula = f"={excel_func}({col_letter}{data_start_row}:{col_letter}{last_data_row})"
                    cell = ws.cell(row=s_row, column=col_idx, value=formula)
                    cell.font = summary_value_font
                    cell.fill = summary_fill
                    if s_offset == 0:
                        cell.border = teal_top_border
                    # Apply same number format as the column
                    if col_idx <= len(num_formats) and num_formats[col_idx - 1]:
                        cell.number_format = num_formats[col_idx - 1]

        # === CONDITIONAL FORMATTING ===
        if conditional_formatting and len(df) > 0:
            for col_idx, col_name in enumerate(list(df.columns), 1):
                try:
                    if not pd.api.types.is_numeric_dtype(df[col_name]):
                        continue
                except Exception:
                    continue

                col_letter = get_column_letter(col_idx)
                cell_range = f"{col_letter}{data_start_row}:{col_letter}{last_data_row}"
                col_type = _classify_column(col_name)

                try:
                    if col_type == 'return':
                        # Green/white/red scale for returns
                        ws.conditional_formatting.add(cell_range, ColorScaleRule(
                            start_type='min', start_color='F8696B',
                            mid_type='num', mid_value=0, mid_color='FFFFFF',
                            end_type='max', end_color='63BE7B'
                        ))
                    elif col_type == 'volume':
                        # Teal data bars for volume
                        ws.conditional_formatting.add(cell_range, DataBarRule(
                            start_type='min', end_type='max',
                            color=teal_hex
                        ))
                    elif col_type == 'price':
                        # Teal gradient for price/value
                        ws.conditional_formatting.add(cell_range, ColorScaleRule(
                            start_type='min', start_color='E8F5F4',
                            end_type='max', end_color='119993'
                        ))
                except Exception:
                    pass

        # === FREEZE PANES on A5 ===
        ws.freeze_panes = 'A5'

        # === AUTO-WIDTH COLUMNS ===
        for col_idx, col_name in enumerate(cols, 1):
            max_len = len(str(col_name))
            for r in range(data_start_row, min(last_data_row + 1, data_start_row + 100)):
                cell_val = ws.cell(row=r, column=col_idx).value
                if cell_val is not None:
                    max_len = max(max_len, len(str(cell_val)))
            adjusted_width = min(max_len + 3, 50)
            ws.column_dimensions[get_column_letter(col_idx)].width = adjusted_width

    wb.save(filepath)
    files_list.append({'filename': safe_name, 'filepath': filepath})
    sheet_count = len(sheets)
    features = []
    if active_summaries:
        features.append(f"formulas: {', '.join(active_summaries).upper()}")
    if conditional_formatting:
        features.append("conditional formatting")
    if formulas:
        features.append(f"{len(formulas)} calculated column(s)")
    feat_str = f" — {', '.join(features)}" if features else ""
    return f"Excel saved: {safe_name} ({sheet_count} sheet{'s' if sheet_count > 1 else ''}{feat_str})"


def save_word(files_list, content, filename='document.docx'):
    """Generate a professionally styled Word document.

    Args:
        files_list: list to append file metadata dicts to
        content: Either a markdown string OR a dict with structure:
            {"title": "...", "sections": [{"heading": "...", "body": "...", "table": DataFrame}]}
        filename: Output filename (.docx)
    """
    try:
        from docx import Document as _DocxDoc
        from docx.shared import Pt as _Pt, RGBColor as _RGB, Inches as _Inches
        from docx.enum.text import WD_ALIGN_PARAGRAPH as _ALIGN
    except ImportError:
        return "Error: python-docx is not installed. Cannot generate Word documents."

    if not filename.endswith('.docx'):
        filename += '.docx'
    safe_name = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    filepath = os.path.join(tempfile.gettempdir(), f'vq_{int(time.time())}_{safe_name}')

    doc = _DocxDoc()

    # Set default font
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Calibri'
    font.size = _Pt(10)

    teal = _RGB(0x11, 0x99, 0x93)
    dark_gray = _RGB(0x33, 0x33, 0x33)

    def _add_branded_header(doc, title_text='AutoScholar Report'):
        """Add AutoScholar branded header"""
        title_para = doc.add_paragraph()
        title_para.alignment = _ALIGN.LEFT
        run = title_para.add_run(title_text)
        run.font.size = _Pt(24)
        run.font.color.rgb = teal
        run.font.bold = True

        subtitle = doc.add_paragraph()
        subtitle.alignment = _ALIGN.LEFT
        run = subtitle.add_run('AutoScholar Financial Analytics')
        run.font.size = _Pt(10)
        run.font.color.rgb = _RGB(0x88, 0x88, 0x88)

        date_para = doc.add_paragraph()
        date_para.alignment = _ALIGN.LEFT
        run = date_para.add_run(f'Generated: {datetime.now().strftime("%B %d, %Y")}')
        run.font.size = _Pt(9)
        run.font.color.rgb = _RGB(0xAA, 0xAA, 0xAA)
        run.font.italic = True

        # Add a thin line separator
        border_para = doc.add_paragraph()
        border_para.alignment = _ALIGN.LEFT
        run = border_para.add_run('_' * 70)
        run.font.color.rgb = _RGB(0xDD, 0xDD, 0xDD)
        run.font.size = _Pt(6)
        doc.add_paragraph()  # Spacer

    def _add_df_table(doc, df, max_rows=200):
        """Add a styled DataFrame table to the document"""
        if not isinstance(df, pd.DataFrame) or df.empty:
            return
        df_display = df.head(max_rows)
        cols = list(df_display.columns)
        table = doc.add_table(rows=1 + len(df_display), cols=len(cols))
        table.style = 'Table Grid'

        # Header row
        for i, col in enumerate(cols):
            cell = table.rows[0].cells[i]
            cell.text = str(col)
            for paragraph in cell.paragraphs:
                for run in paragraph.runs:
                    run.font.bold = True
                    run.font.color.rgb = _RGB(0xFF, 0xFF, 0xFF)
                    run.font.size = _Pt(9)
            from docx.oxml.ns import qn
            shading = cell._element.get_or_add_tcPr()
            shading_elm = shading.makeelement(qn('w:shd'), {
                qn('w:fill'): '119993',
                qn('w:val'): 'clear',
            })
            shading.append(shading_elm)

        # Data rows
        for row_idx, (_, row) in enumerate(df_display.iterrows()):
            for col_idx, col in enumerate(cols):
                val = _convert_numpy(row[col])
                cell = table.rows[row_idx + 1].cells[col_idx]
                cell.text = str(val) if val is not None else ''
                for paragraph in cell.paragraphs:
                    for run in paragraph.runs:
                        run.font.size = _Pt(8)

    def _parse_markdown(doc, text):
        """Parse basic markdown and add to document"""
        lines = text.split('\n')
        i = 0
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()

            # Headings
            if stripped.startswith('### '):
                h = doc.add_heading(stripped[4:], level=3)
                for run in h.runs:
                    run.font.color.rgb = dark_gray
            elif stripped.startswith('## '):
                h = doc.add_heading(stripped[3:], level=2)
                for run in h.runs:
                    run.font.color.rgb = teal
            elif stripped.startswith('# '):
                h = doc.add_heading(stripped[2:], level=1)
                for run in h.runs:
                    run.font.color.rgb = teal
            # List items
            elif stripped.startswith('- ') or stripped.startswith('* '):
                text_content = stripped[2:]
                para = doc.add_paragraph(style='List Bullet')
                _add_formatted_runs(para, text_content)
            elif re.match(r'^\d+\.\s', stripped):
                text_content = re.sub(r'^\d+\.\s', '', stripped)
                para = doc.add_paragraph(style='List Number')
                _add_formatted_runs(para, text_content)
            # Empty line
            elif not stripped:
                pass  # Skip empty lines (paragraph spacing handles this)
            # Regular text
            else:
                para = doc.add_paragraph()
                _add_formatted_runs(para, stripped)
            i += 1

    def _add_formatted_runs(para, text):
        """Parse bold (**text**) and add as runs"""
        parts = re.split(r'(\*\*[^*]+\*\*)', text)
        for part in parts:
            if part.startswith('**') and part.endswith('**'):
                run = para.add_run(part[2:-2])
                run.bold = True
                run.font.size = _Pt(10)
            else:
                run = para.add_run(part)
                run.font.size = _Pt(10)

    # Handle structured dict input
    if isinstance(content, dict):
        title = content.get('title', 'AutoScholar Report')
        _add_branded_header(doc, title)

        for section in content.get('sections', []):
            if 'heading' in section:
                h = doc.add_heading(section['heading'], level=2)
                for run in h.runs:
                    run.font.color.rgb = teal
            if 'body' in section:
                _parse_markdown(doc, section['body'])
            if 'table' in section and isinstance(section['table'], pd.DataFrame):
                _add_df_table(doc, section['table'])
                doc.add_paragraph()  # Spacer after table

    # Handle markdown string input
    elif isinstance(content, str):
        # Extract title from first heading if present
        first_line = content.strip().split('\n')[0]
        if first_line.startswith('# '):
            title = first_line[2:].strip()
            _add_branded_header(doc, title)
            remaining = '\n'.join(content.strip().split('\n')[1:])
            _parse_markdown(doc, remaining)
        else:
            _add_branded_header(doc)
            _parse_markdown(doc, content)
    else:
        return "Error: save_word expects a string or dict"

    doc.save(filepath)
    files_list.append({'filename': safe_name, 'filepath': filepath})
    return f"Word document saved: {safe_name}"


def df_to_latex(df, caption=None, label=None, max_rows=200):
    r"""Convert a DataFrame to a LaTeX booktabs table with teal headers and zebra striping.

    Args:
        df: pandas DataFrame
        caption: Optional table caption
        label: Optional \label for cross-referencing
        max_rows: Maximum rows to include (default 200)

    Returns:
        str: LaTeX table code ready for embedding
    """
    if not isinstance(df, pd.DataFrame) or df.empty:
        return '% Empty DataFrame — no table generated'

    df_display = df.head(max_rows)
    cols = list(df_display.columns)
    num_cols = len(cols)

    lines = []
    lines.append(r'\begin{table}[H]')
    lines.append(r'\centering')
    lines.append(r'\rowcolors{2}{gray!8}{white}')
    col_spec = 'l' + 'r' * (num_cols - 1)
    lines.append(r'\begin{tabular}{' + col_spec + '}')
    lines.append(r'\toprule')
    # Header row with teal background
    header_cells = [r'\textbf{\textcolor{white}{' + _escape_latex(str(c)) + '}}' for c in cols]
    lines.append(r'\rowcolor{vqteal}')
    lines.append(' & '.join(header_cells) + r' \\')
    lines.append(r'\midrule')
    # Data rows
    for _, row in df_display.iterrows():
        cells = []
        for c in cols:
            val = row[c]
            if val is None or (isinstance(val, float) and (np.isnan(val) or np.isinf(val))):
                cells.append('—')
            elif isinstance(val, float):
                cells.append(f'{val:,.2f}')
            else:
                cells.append(_escape_latex(str(val)))
        lines.append(' & '.join(cells) + r' \\')
    lines.append(r'\bottomrule')
    lines.append(r'\end{tabular}')
    if caption:
        lines.append(r'\caption{' + _escape_latex(caption) + '}')
    if label:
        lines.append(r'\label{' + label + '}')
    lines.append(r'\end{table}')
    return '\n'.join(lines)


def save_latex(files_list, content, filename='report.pdf', figures='auto', template='financial',
               author=None, company=None, logo=None, title=None, bibtex=None, **kwargs):
    r"""Generate a professional PDF report via LaTeX compilation.

    If content contains \documentclass, it is treated as raw LaTeX and compiled as-is.
    Otherwise the content is treated as the body and wrapped in a professional AutoScholar template.

    Figure placeholders: use {{FIG:0}}, {{FIG:1}}, etc. in the content to insert
    the corresponding open matplotlib figures (numbered by creation order).

    Args:
        files_list: list to append file metadata dicts to
        content: LaTeX body text or full LaTeX document
        filename: Output filename (forced to .pdf)
        figures: 'auto' (save all open figs) or 'none'
        template: 'financial' (full branding), 'minimal' (clean, no title page), or 'academic' (12pt article, double-spaced, natbib)
        author: Author name for the title page and PDF metadata
        company: Company name for the title page and headers
        logo: URL to a company logo image (PNG/JPG) for the title page
        title: Custom subtitle for the title page (default: 'Financial Intelligence Report')
        bibtex: BibTeX entries as a string; when provided, compilation uses 4-pass pdflatex+bibtex

    Returns:
        str: confirmation message
    """
    import subprocess
    import shutil

    # Force .pdf extension
    base = os.path.splitext(filename)[0]
    if not base:
        base = 'report'
    pdf_name = re.sub(r'[^a-zA-Z0-9._-]', '_', base) + '.pdf'

    work_dir = tempfile.mkdtemp(prefix='vq_latex_')

    # ── Download company logo if provided ──
    logo_path = None
    if logo:
        try:
            import requests as _req
            resp = _req.get(logo, timeout=10)
            resp.raise_for_status()
            ctype = resp.headers.get('content-type', '').lower()
            if 'svg' in ctype:
                raise ValueError('SVG logos are not supported; use PNG or JPG')
            ext = '.jpg' if 'jpeg' in ctype or 'jpg' in ctype else '.png'
            logo_file = os.path.join(work_dir, f'company_logo{ext}')
            with open(logo_file, 'wb') as lf:
                lf.write(resp.content)
            if os.path.getsize(logo_file) > 100:
                logo_path = logo_file
        except Exception:
            logo_path = None  # graceful fallback

    # ── Write BibTeX file if provided ──
    has_bibtex = bool(bibtex)
    if has_bibtex:
        bib_path = os.path.join(work_dir, 'references.bib')
        with open(bib_path, 'w', encoding='utf-8') as bf:
            bf.write(bibtex)

    # ── Escape branding strings for LaTeX safety ──
    safe_company = _escape_latex(company) if company else None
    safe_author = _escape_latex(author) if author else None

    # Plain-text versions for PDF metadata (hypersetup cannot contain LaTeX commands)
    def _sanitize_pdf_meta(text):
        """Strip characters that break pdflatex hypersetup metadata."""
        if not text:
            return ''
        # Remove characters that break \hypersetup (keep basic ASCII + spaces)
        return re.sub(r'[^\x20-\x7E]', '', text).replace('\\', '')

    # ── Save open matplotlib figures as PNGs ──
    fig_paths = []
    if figures != 'none':
        fig_nums = plt.get_fignums()
        for idx, fnum in enumerate(fig_nums):
            fig = plt.figure(fnum)
            # Add AutoScholar watermark
            fig.text(
                0.99, 0.01, 'AutoScholar',
                fontsize=9, color='#119993', alpha=0.6,
                ha='right', va='bottom',
                transform=fig.transFigure,
                fontweight='bold', style='italic'
            )
            fig_file = os.path.join(work_dir, f'fig_{idx}.png')
            fig.savefig(fig_file, format='png', dpi=300, bbox_inches='tight',
                        facecolor='white', edgecolor='none')
            fig_paths.append(fig_file)

    # ── Replace {{FIG:N}} placeholders ──
    referenced_figs = set()
    def _replace_fig_placeholders(text):
        import re as _re
        def _fig_repl(m):
            idx = int(m.group(1))
            if idx < len(fig_paths):
                referenced_figs.add(idx)
                fname = os.path.basename(fig_paths[idx])
                return (
                    r'\begin{figure}[H]' '\n'
                    r'\centering' '\n'
                    r'\includegraphics[width=\linewidth]{' + fname + '}\n'
                    r'\end{figure}'
                )
            return m.group(0)  # leave unresolved placeholders as-is
        return _re.sub(r'\{\{FIG:(\d+)\}\}', _fig_repl, text)

    content = _replace_fig_placeholders(content)

    # ── Auto-append unreferenced figures at end of content ──
    if fig_paths:
        unreferenced = [i for i in range(len(fig_paths)) if i not in referenced_figs]
        if unreferenced:
            fig_blocks = []
            for idx in unreferenced:
                fname = os.path.basename(fig_paths[idx])
                fig_blocks.append(
                    r'\begin{figure}[H]' '\n'
                    r'\centering' '\n'
                    r'\includegraphics[width=\linewidth]{' + fname + '}\n'
                    r'\end{figure}'
                )
            content = content + '\n\n' + '\n\n'.join(fig_blocks)

    # ── Detect raw vs template mode ──
    is_raw = r'\documentclass' in content

    if is_raw:
        # For raw LaTeX with bibtex, inject bibliography commands before \end{document}
        if has_bibtex and r'\bibliography' not in content:
            content = content.replace(
                r'\end{document}',
                r'\bibliographystyle{apalike}' + '\n' + r'\bibliography{references}' + '\n' + r'\end{document}'
            )
        full_latex = content
    else:
        today_str = datetime.now().strftime('%B %d, %Y')

        # Branding: company name for header, or default
        header_company = safe_company if safe_company else 'AutoScholar'
        # Custom subtitle
        safe_title = _escape_latex(title) if title else 'Financial Intelligence Report'
        # PDF metadata (plain ASCII — no LaTeX commands, no Unicode)
        meta_company = _sanitize_pdf_meta(company) if company else 'AutoScholar'
        pdf_author = _sanitize_pdf_meta(author) if author else 'AutoScholar Analytics'
        meta_title_str = _sanitize_pdf_meta(title) if title else 'Financial Intelligence Report'
        pdf_title = f'{meta_company} - {meta_title_str}'

        if template == 'minimal':
            full_latex = r"""\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{newtxtext}
\usepackage{newtxmath}
\usepackage[sfdefault,scale=0.92]{sourcesanspro}
\usepackage{microtype}
\usepackage[margin=2.5cm]{geometry}
\usepackage{graphicx}
\usepackage{booktabs}
\usepackage[table]{xcolor}
\usepackage{float}
\usepackage{amsmath}
\usepackage{parskip}
\usepackage{hyperref}

\definecolor{vqteal}{HTML}{119993}

\hypersetup{colorlinks=true,linkcolor=vqteal,urlcolor=vqteal,citecolor=vqteal,
  pdfauthor={""" + pdf_author + r"""},pdftitle={""" + pdf_title + r"""}}

\begin{document}
""" + content + (r"""
\bibliographystyle{apalike}
\bibliography{references}
""" if has_bibtex else '') + r"""
\end{document}
"""
        elif template == 'academic':
            bib_block = r"""
\bibliographystyle{apalike}
\bibliography{references}
""" if has_bibtex else ''
            natbib_pkg = r'\usepackage[authoryear,round]{natbib}' if has_bibtex else ''
            safe_title = _escape_latex(title) if title else 'Research Paper'
            acad_author = _escape_latex(author) if author else 'AutoScholar Team'
            full_latex = r"""\documentclass[12pt,a4paper]{article}

%% ── Encoding & Fonts ──
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{newtxtext}
\usepackage{newtxmath}

%% ── Layout ──
\usepackage[margin=2.5cm]{geometry}
\usepackage{setspace}
\doublespacing

%% ── Micro-typography ──
\usepackage{microtype}

%% ── Math ──
\usepackage{amsmath,amssymb,amsthm}

%% ── Graphics & Floats ──
\usepackage{graphicx}
\usepackage{float}

%% ── Tables ──
\usepackage{booktabs}
\usepackage{tabularx}

%% ── Lists ──
\usepackage{enumitem}

%% ── Citations ──
""" + natbib_pkg + r"""

%% ── Headers/Footers ──
\usepackage{fancyhdr}
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\small\textit{""" + safe_title[:60] + r"""}}
\fancyhead[R]{\small\thepage}
\renewcommand{\headrulewidth}{0.4pt}

%% ── Section Styling ──
\usepackage{titlesec}
\titleformat{\section}{\Large\bfseries}{\thesection}{1em}{}
\titleformat{\subsection}{\large\bfseries}{\thesubsection}{1em}{}

%% ── Theorem Environments ──
\newtheorem{theorem}{Theorem}
\newtheorem{proposition}{Proposition}
\newtheorem{lemma}{Lemma}
\newtheorem{hypothesis}{Hypothesis}
\theoremstyle{definition}
\newtheorem{definition}{Definition}

%% ── Links ──
\usepackage{hyperref}
\hypersetup{colorlinks=true,linkcolor=blue!60!black,urlcolor=blue!60!black,citecolor=blue!60!black}

\begin{document}

\title{""" + safe_title + r"""}
\author{""" + acad_author + r"""}
\date{\today}
\maketitle

\newpage
\tableofcontents
\newpage

""" + content + bib_block + r"""

\end{document}
"""
        else:
            # ── Logo include command ──
            logo_include = ''
            if logo_path:
                logo_basename = os.path.basename(logo_path)
                logo_include = (
                    r'\includegraphics[height=2cm]{' + logo_basename + r'}'
                    '\n' r'\vspace{0.8cm}' '\n'
                )

            # ── Title-page blocks ──
            company_block = (
                r'{\fontsize{36}{42}\selectfont\sffamily\bfseries\textcolor{vqcharcoal}{'
                + header_company + r'}\par}'
            )
            subtitle_block = (
                r'\vspace{0.4cm}' '\n'
                r'{\Large\sffamily\textcolor{vqsubtitle}{' + safe_title + r'}\par}'
            )
            author_block = ''
            if safe_author:
                author_block = (
                    r'\vspace{0.6cm}' '\n'
                    r'{\large\sffamily\textcolor{vqsubtitle}{Prepared by ' + safe_author + r'}\par}'
                )

            # Full financial template — pro styling
            full_latex = r"""\documentclass[11pt,a4paper]{article}

%% ── Encoding & Fonts ──
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{newtxtext}
\usepackage{newtxmath}
\usepackage[sfdefault,scale=0.92]{sourcesanspro}

%% ── Micro-typography ──
\usepackage{microtype}

%% ── Layout ──
\usepackage[margin=2.5cm]{geometry}
\usepackage{parskip}
\usepackage{setspace}
\setstretch{1.15}

%% ── Colors ──
\usepackage[table]{xcolor}
\definecolor{vqteal}{HTML}{119993}
\definecolor{vqdark}{HTML}{1A1A2E}
\definecolor{vqgray}{HTML}{666666}
\definecolor{vqlight}{HTML}{F2F9F9}
\definecolor{vqcharcoal}{HTML}{3C3C3C}
\definecolor{vqrule}{HTML}{BFBFBF}
\definecolor{vqsubtitle}{HTML}{5A6A72}

%% ── Graphics & Floats ──
\usepackage{graphicx}
\usepackage{float}

%% ── Tables ──
\usepackage{booktabs}
\usepackage{tabularx}

%% ── Lists ──
\usepackage{enumitem}
\setlist{nosep,leftmargin=1.5em}

%% ── Math ──
\usepackage{amsmath}

%% ── Page count ──
\usepackage{lastpage}

%% ── Headers/Footers ──
\usepackage{fancyhdr}
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\small\sffamily\textcolor{vqteal}{\textbf{""" + header_company + r"""}} \textcolor{vqrule}{|} \textcolor{vqsubtitle}{Financial Intelligence}}
\fancyhead[R]{\small\sffamily\textcolor{vqsubtitle}{""" + today_str + r"""}}
\fancyfoot[C]{\small\sffamily\textcolor{vqsubtitle}{Page \thepage\ / \pageref{LastPage}}}
\renewcommand{\headrulewidth}{0.4pt}
\renewcommand{\headrule}{\hbox to\headwidth{\color{vqteal}\leaders\hrule height \headrulewidth\hfill}}
\renewcommand{\footrulewidth}{0pt}

%% ── Section Styling ──
\usepackage{titlesec}
\titleformat{\section}{\Large\sffamily\bfseries\color{vqteal}}{\thesection}{1em}{}[\vspace{2pt}{\color{vqteal}\titlerule[0.4pt]}]
\titleformat{\subsection}{\large\sffamily\bfseries\color{vqdark}}{\thesubsection}{1em}{}
\titleformat{\subsubsection}{\normalsize\sffamily\bfseries\color{vqsubtitle}}{\thesubsubsection}{1em}{}

%% ── Callout Boxes ──
\usepackage{tcolorbox}
\tcbuselibrary{skins,breakable}
\newtcolorbox{keyinsight}{
  colback=vqlight,colframe=vqteal,
  fonttitle=\sffamily\bfseries,title=Key Insight,
  boxrule=0.5pt,arc=3pt,left=8pt,right=8pt,top=6pt,bottom=6pt,
  breakable
}
\newtcolorbox{warningbox}{
  colback=red!5,colframe=red!60!black,
  fonttitle=\sffamily\bfseries,title=Warning,
  boxrule=0.5pt,arc=3pt,left=8pt,right=8pt,top=6pt,bottom=6pt,
  breakable
}
\newtcolorbox{summarybox}[1][Executive Summary]{
  colback=vqteal!4,colframe=vqteal,
  fonttitle=\sffamily\bfseries\large,title=#1,
  boxrule=0.6pt,arc=4pt,left=10pt,right=10pt,top=8pt,bottom=8pt,
  toptitle=4pt,bottomtitle=4pt,
  breakable
}

%% ── Citations ──
""" + (r'\usepackage[authoryear,round]{natbib}' if has_bibtex else '') + r"""

%% ── Links ──
\usepackage{hyperref}
\hypersetup{colorlinks=true,linkcolor=vqteal,urlcolor=vqteal,citecolor=vqteal,
  pdfauthor={""" + pdf_author + r"""},pdftitle={""" + pdf_title + r"""}}

%% ── Title Page ──
\begin{document}

\begin{titlepage}
\centering
\vspace*{2cm}
""" + logo_include + r"""
""" + company_block + r"""
""" + subtitle_block + r"""
\vspace{2cm}
{\large\sffamily\textcolor{vqcharcoal}{""" + today_str + r"""}\par}
\vspace{0.8cm}
\textcolor{vqteal}{\rule{0.6\textwidth}{0.8pt}}
""" + author_block + r"""
\vfill
{\footnotesize\sffamily\textcolor{vqrule}{Confidential — For intended recipients only}\par}
\vspace{0.3cm}
{\footnotesize\sffamily\textcolor{vqsubtitle}{Generated by AutoScholar Analytics Platform}\par}
\end{titlepage}

%% ── Table of Contents ──
\tableofcontents
\newpage

""" + content + (r"""

\bibliographystyle{apalike}
\bibliography{references}
""" if has_bibtex else '') + r"""

\end{document}
"""

    # ── Write .tex file ──
    tex_path = os.path.join(work_dir, 'report.tex')
    with open(tex_path, 'w', encoding='utf-8') as f:
        f.write(full_latex)

    # ── Find pdflatex ──
    # Augment PATH with known MacTeX/TeX Live locations so shutil.which
    # and pdflatex's own sub-tools (kpsewhich, etc.) are all reachable.
    tex_bin_candidates = [
        '/Library/TeX/texbin',
        '/usr/local/texlive/2025/bin/universal-darwin',
        '/usr/local/texlive/2024/bin/universal-darwin',
        '/usr/local/texlive/2025/bin/x86_64-darwin',
        '/usr/local/texlive/2024/bin/x86_64-darwin',
        '/usr/texbin',
    ]
    tex_env = os.environ.copy()
    extra_paths = [p for p in tex_bin_candidates if os.path.isdir(p)]
    if extra_paths:
        tex_env['PATH'] = ':'.join(extra_paths) + ':' + tex_env.get('PATH', '/usr/bin:/bin')

    pdflatex = shutil.which('pdflatex', path=tex_env['PATH'])
    if not pdflatex:
        # Final hard-coded MacTeX fallback
        for candidate in ['/Library/TeX/texbin/pdflatex'] + [
            os.path.join(p, 'pdflatex') for p in tex_bin_candidates
        ]:
            if os.path.isfile(candidate):
                pdflatex = candidate
                break
    if not pdflatex:
        raise RuntimeError(
            'pdflatex not found. Install MacTeX (brew install --cask mactex) '
            'or TeX Live to compile LaTeX documents.'
        )

    # ── Compile ──
    # If BibTeX is provided: 4-pass (pdflatex → bibtex → pdflatex → pdflatex)
    # Otherwise: 2-pass (pdflatex → pdflatex) for TOC & cross-refs
    def _run_pdflatex(pass_label='pdflatex'):
        return subprocess.run(
            [pdflatex, '-interaction=nonstopmode', '-halt-on-error', 'report.tex'],
            cwd=work_dir,
            capture_output=True,
            text=True,
            timeout=60,
            env=tex_env,
        )

    if has_bibtex:
        # Find bibtex binary
        bibtex_bin = shutil.which('bibtex', path=tex_env['PATH'])
        if not bibtex_bin:
            for candidate in ['/Library/TeX/texbin/bibtex'] + [
                os.path.join(p, 'bibtex') for p in tex_bin_candidates
            ]:
                if os.path.isfile(candidate):
                    bibtex_bin = candidate
                    break

        # Pass 1: pdflatex (generates .aux for bibtex)
        _run_pdflatex()
        # Pass 2: bibtex (resolves citations)
        if bibtex_bin:
            subprocess.run(
                [bibtex_bin, 'report'],
                cwd=work_dir,
                capture_output=True,
                text=True,
                timeout=30,
                env=tex_env,
            )
        # Pass 3 & 4: pdflatex (resolve cross-refs with citations)
        _run_pdflatex()
        proc = _run_pdflatex()
    else:
        _run_pdflatex()
        proc = _run_pdflatex()

    if proc.returncode != 0:
        # Read log tail for diagnostics
        log_path = os.path.join(work_dir, 'report.log')
        log_tail = ''
        if os.path.isfile(log_path):
            with open(log_path, 'r', errors='replace') as lf:
                log_lines = lf.readlines()
                # Find lines with '!' (LaTeX errors)
                error_lines = [l.rstrip() for l in log_lines if l.startswith('!')]
                if error_lines:
                    log_tail = '\n'.join(error_lines[:10])
                else:
                    log_tail = ''.join(log_lines[-30:])
        raise RuntimeError(
            f'pdflatex compilation failed.\n'
            f'--- Log ---\n{log_tail}\n'
            f'--- stderr ---\n{proc.stderr[-500:] if proc.stderr else "(empty)"}'
        )

    # ── Collect output PDF ──
    compiled_pdf = os.path.join(work_dir, 'report.pdf')
    if not os.path.isfile(compiled_pdf):
        raise RuntimeError('pdflatex ran but report.pdf was not produced.')

    dest_path = os.path.join(tempfile.gettempdir(), f'vq_{int(time.time())}_{pdf_name}')
    shutil.copy2(compiled_pdf, dest_path)

    # Cleanup work directory (best-effort)
    try:
        shutil.rmtree(work_dir)
    except Exception:
        pass

    files_list.append({'filename': pdf_name, 'filepath': dest_path})
    n_figs = len(fig_paths)
    fig_info = f", {n_figs} figure{'s' if n_figs != 1 else ''}" if n_figs else ""
    tmpl_info = f"template={template}" if not is_raw else "raw LaTeX"
    brand_parts = []
    if company:
        brand_parts.append(f"company={company}")
    if author:
        brand_parts.append(f"author={author}")
    if logo_path:
        brand_parts.append("logo=yes")
    brand_info = f", {', '.join(brand_parts)}" if brand_parts else ""
    bib_info = ", bibtex=yes" if has_bibtex else ""
    return f"LaTeX PDF saved: {pdf_name} ({tmpl_info}{fig_info}{brand_info}{bib_info})"
