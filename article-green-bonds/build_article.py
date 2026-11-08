# -*- coding: utf-8 -*-
"""Формирование статьи в формате DOCX по требованиям ВАК / ГОСТ Р 7.0.100-2018."""
import re
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

from content_part1 import META, BLOCKS_1, TABLE1
from content_part2 import BLOCKS_2, TABLE2, TABLE3, TABLE4, TABLE5
from content_part3 import BLOCKS_3, TABLE6, TABLE7, TABLE8, REFERENCES, EN_BLOCK

TABLES = {"table1": TABLE1, "table2": TABLE2, "table3": TABLE3, "table4": TABLE4,
          "table5": TABLE5, "table6": TABLE6, "table7": TABLE7, "table8": TABLE8}

doc = Document()

# ---------- страница ----------
sec = doc.sections[0]
sec.page_width, sec.page_height = Cm(21.0), Cm(29.7)
sec.top_margin = sec.bottom_margin = Cm(3.0)
sec.left_margin = sec.right_margin = Cm(2.5)

# ---------- базовый шрифт (Times New Roman для латиницы и кириллицы) ----------
style = doc.styles["Normal"]
style.font.name = "Times New Roman"
style.font.size = Pt(12)
style.element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
pf = style.paragraph_format
pf.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
pf.space_after = Pt(0)
pf.space_before = Pt(0)


def set_run_font(run, size=12, bold=False, italic=False):
    run.font.name = "Times New Roman"
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = RGBColor(0, 0, 0)
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")


def add_par(text="", size=12, bold=False, italic=False, align=None, indent=False,
            spacing_before=0, spacing_after=0):
    p = doc.add_paragraph()
    if align is not None:
        p.alignment = align
    if indent:
        p.paragraph_format.first_line_indent = Cm(0.95)
    p.paragraph_format.space_before = Pt(spacing_before)
    p.paragraph_format.space_after = Pt(spacing_after)
    if text:
        r = p.add_run(text)
        set_run_font(r, size, bold, italic)
    return p


def add_par_runs(p, runs):
    for text, sub, sup, italic in runs:
        r = p.add_run(text)
        set_run_font(r, 12, False, True if italic else False)
        if sub:
            r.font.subscript = True
        if sup:
            r.font.superscript = True
    return p


FORMULA_RE = re.compile(r"(\*.+?\*|~.+?~|\^.+?\^)")


def parse_formula(s, italic=True):
    out = []
    for tok in FORMULA_RE.split(s):
        if not tok:
            continue
        if tok.startswith("*") and tok.endswith("*"):
            out.append((tok[1:-1], False, False, True))
        elif tok.startswith("~") and tok.endswith("~"):
            out.append((tok[1:-1], True, False, italic))
        elif tok.startswith("^") and tok.endswith("^"):
            out.append((tok[1:-1], False, True, italic))
        else:
            out.append((tok, False, False, italic))
    return out


def add_formula(text, num):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(6)
    add_par_runs(p, parse_formula(text))
    r = p.add_run("  " + num)
    set_run_font(r, 12, False, False)
    return p


def set_cell_borders(cell):
    tcPr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        el = OxmlElement("w:" + edge)
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), "000000")
        borders.append(el)
    tcPr.append(borders)


def add_table(tname):
    t = TABLES[tname]
    cap = add_par(t["caption"], size=11, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER,
                  spacing_before=8, spacing_after=4)
    ncols = len(t["header"])
    tbl = doc.add_table(rows=len(t["rows"]) + 1, cols=ncols)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = True
    for j, htext in enumerate(t["header"]):
        cell = tbl.rows[0].cells[j]
        set_cell_borders(cell)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(htext)
        set_run_font(r, 10, bold=True)
    for i, row in enumerate(t["rows"], start=1):
        for j, val in enumerate(row):
            cell = tbl.rows[i].cells[j]
            set_cell_borders(cell)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            r = p.add_run(val)
            set_run_font(r, 10, bold=("Итого" in val))
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    return tbl


def add_page_number(section):
    p = section.footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fld = OxmlElement("w:fldSimple")
    fld.set(qn("w:instr"), "PAGE")
    r = OxmlElement("w:r")
    t = OxmlElement("w:t")
    t.text = "1"
    r.append(t)
    fld.append(r)
    p._p.append(fld)


add_page_number(sec)

# ---------- заголовок и атрибуты ----------
add_par(META["title_ru"], size=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER,
        spacing_before=6, spacing_after=8)
add_par(META["author_ru"], size=12, align=WD_ALIGN_PARAGRAPH.CENTER, spacing_after=4)
add_par(META["specialty"], size=12, align=WD_ALIGN_PARAGRAPH.CENTER, spacing_after=2)
add_par(META["udc"], size=12, align=WD_ALIGN_PARAGRAPH.CENTER, spacing_after=10)

add_par("Аннотация", size=12, bold=True, spacing_before=6, spacing_after=2)
add_par(META["abstract_ru"], size=11, spacing_after=6)
add_par("Ключевые слова: " + META["keywords_ru"], size=11, spacing_after=10)

add_par("Abstract", size=12, bold=True, spacing_before=6, spacing_after=2)
add_par(META["abstract_en"], size=11, spacing_after=6)
add_par("Keywords: " + META["keywords_en"], size=11, spacing_after=12)

# ---------- основной текст ----------
for block in BLOCKS_1 + BLOCKS_2 + BLOCKS_3:
    kind = block[0]
    payload = block[1:]
    if kind == "h1":
        add_par(payload[0], size=13, bold=True, spacing_before=12, spacing_after=4)
    elif kind == "h2":
        add_par(payload[0], size=12, bold=True, spacing_before=8, spacing_after=2)
    elif kind == "p":
        if "~" in payload[0] or "^" in payload[0]:
            p = add_par("", indent=True)
            add_par_runs(p, parse_formula(payload[0], italic=False))
        else:
            add_par(payload[0], indent=True)
    elif kind == "item":
        p = add_par("", indent=True)
        p.paragraph_format.left_indent = Cm(0.95)
        p.paragraph_format.first_line_indent = Cm(-0.45)
        add_par_runs(p, parse_formula(payload[0], italic=False))
    elif kind == "formula":
        add_formula(payload[0], payload[1])
    elif kind == "table":
        add_table(payload[0])

# ---------- список источников ----------
add_par("Литература", size=13, bold=True, spacing_before=14, spacing_after=4)
for i, ref in enumerate(REFERENCES, start=1):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(1.2)
    p.paragraph_format.first_line_indent = Cm(-1.2)
    p.paragraph_format.space_after = Pt(3)
    r = p.add_run(f"{i}. {ref}")
    set_run_font(r, 11)

# ---------- англоязычная библиографическая справка ----------
add_par(EN_BLOCK["title"], size=13, bold=True, spacing_before=16, spacing_after=4)
for line in EN_BLOCK["lines"]:
    add_par(line, size=11, spacing_after=4)

OUT = "Zelennye obligatsii VAK article.docx"
doc.save(OUT)
print("saved:", OUT)

# проверка разметки
d2 = Document(OUT)
print("paragraphs:", len(d2.paragraphs), "tables:", len(d2.tables))
