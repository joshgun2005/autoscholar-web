# -*- coding: utf-8 -*-
"""
Сборщик научной статьи «Зелёные облигации» в формате DOCX по ГОСТ.
ГОСТ 7.0.100-2018: аннотация, ключевые слова, разделы, список литературы,
аннотационный блок на английском языке. A4, Times New Roman, 1.5 межстрочный интервал.
"""
import re
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

from content_part1 import META, BLOCKS_1, TABLE1
from content_part2 import BLOCKS_2, TABLE2, TABLE5
from content_part3 import BLOCKS_3, TABLE6, REFERENCES, EN_BLOCK

FONT = "Times New Roman"

# Словарь таблиц по id
TABLES = {
    "table1": TABLE1,
    "table2": TABLE2,
    "table5": TABLE5,
    "table6": TABLE6,
}


# ──────────────────────────────────────────────────────────────────────────────
# Утилиты
# ──────────────────────────────────────────────────────────────────────────────
def set_run_font(run, name=FONT, size=12, bold=False, italic=False, color=None):
    run.font.name = name
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color is not None:
        run.font.color.rgb = color
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    rfonts.set(qn("w:ascii"), name)
    rfonts.set(qn("w:hAnsi"), name)
    rfonts.set(qn("w:cs"), name)


def set_cell_borders(cell, sz=6):
    tcPr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        b = OxmlElement(f"w:{edge}")
        b.set(qn("w:val"), "single")
        b.set(qn("w:sz"), str(sz))
        b.set(qn("w:space"), "0")
        b.set(qn("w:color"), "000000")
        borders.append(b)
    tcPr.append(borders)


def add_page_number_footer(section):
    footer = section.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run()
    fld1 = OxmlElement("w:fldChar"); fld1.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText"); instr.set(qn("xml:space"), "preserve"); instr.text = "PAGE"
    fld2 = OxmlElement("w:fldChar"); fld2.set(qn("w:fldCharType"), "end")
    run._r.append(fld1); run._r.append(instr); run._r.append(fld2)
    set_run_font(run, size=10)


# ──────────────────────────────────────────────────────────────────────────────
# Парсер формул: ^superscript^ и ~subscript~
# ──────────────────────────────────────────────────────────────────────────────
def parse_formula(text, paragraph, size=12):
    """Добавляет в paragraph формулу, преобразуя ^...^ в superscript и ~...~ в subscript."""
    tokens = re.split(r"(\^[^\^]*\^|~[^~]*~)", text)
    for tok in tokens:
        if not tok:
            continue
        if tok.startswith("^") and tok.endswith("^") and len(tok) > 2:
            run = paragraph.add_run(tok[1:-1])
            set_run_font(run, size=size)
            run.font.superscript = True
        elif tok.startswith("~") and tok.endswith("~") and len(tok) > 2:
            run = paragraph.add_run(tok[1:-1])
            set_run_font(run, size=size)
            run.font.subscript = True
        else:
            run = paragraph.add_run(tok)
            set_run_font(run, size=size)


# ──────────────────────────────────────────────────────────────────────────────
# Рендеринг блоков
# ──────────────────────────────────────────────────────────────────────────────
def render_block(doc, blk):
    typ, data = blk[0], blk[1]
    if typ == "h1":
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(data)
        set_run_font(run, size=13, bold=True)
    elif typ == "h2":
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(data)
        set_run_font(run, size=12, bold=True)
    elif typ == "p":
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(data)
        set_run_font(run, size=12)
    elif typ == "formula":
        label = blk[2]
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        parse_formula(data, p, size=12)
        run = p.add_run("  " + label)
        set_run_font(run, size=12)
    elif typ == "table":
        render_table(doc, TABLES[data])
    elif typ == "abstract":
        lang, text = data
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(text)
        set_run_font(run, size=12)
    elif typ == "keywords":
        lang, text = data
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(text)
        set_run_font(run, size=12, bold=True)


def render_table(doc, table_data):
    caption = table_data["caption"]
    header = table_data["header"]
    rows = table_data["rows"]

    # Заголовок-название таблицы
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run(caption)
    set_run_font(run, size=12, bold=True)

    # Таблица
    nrows = 1 + len(rows)
    ncols = len(header)
    tbl = doc.add_table(rows=nrows, cols=ncols)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.style = "Table Grid"

    # Заголовок
    for j, h in enumerate(header):
        cell = tbl.rows[0].cells[j]
        cell.text = ""
        cp = cell.paragraphs[0]
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = cp.add_run(h)
        set_run_font(run, size=11, bold=True)
        set_cell_borders(cell)

    # Строки
    for i, row in enumerate(rows, start=1):
        for j, val in enumerate(row):
            cell = tbl.rows[i].cells[j]
            cell.text = ""
            cp = cell.paragraphs[0]
            cp.alignment = WD_ALIGN_PARAGRAPH.LEFT
            run = cp.add_run(val)
            set_run_font(run, size=11)
            set_cell_borders(cell)

    # Пустой абзац после таблицы
    sp = doc.add_paragraph()
    sp.paragraph_format.space_after = Pt(4)


def render_references(doc):
    p = doc.add_paragraph()
    run = p.add_run("Литература")
    set_run_font(run, size=13, bold=True)
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(6)

    for i, ref in enumerate(REFERENCES, start=1):
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
        p.paragraph_format.space_after = Pt(3)
        # Отступ «в подвеску»: 4 см? Используем hanging indent
        p.paragraph_format.left_indent = Cm(1.2)
        p.paragraph_format.first_line_indent = Cm(-1.2)
        run = p.add_run(f"{i}. {ref}")
        set_run_font(run, size=11)


# ──────────────────────────────────────────────────────────────────────────────
# Основная сборка
# ──────────────────────────────────────────────────────────────────────────────
def build():
    doc = Document()

    # Поля A4, margins 2.5 cm
    section = doc.sections[0]
    section.page_height = Cm(29.7)
    section.page_width = Cm(21.0)
    section.top_margin = Cm(2.5)
    section.bottom_margin = Cm(2.5)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2.5)
    add_page_number_footer(section)

    # Стиль «Normal»
    style = doc.styles["Normal"]
    style.font.name = FONT
    style.font.size = Pt(12)
    style.element.rPr.rFonts.set(qn("w:eastAsia"), FONT)

    # ── Заголовок ──
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(10)
    run = p.add_run(META["title_ru"])
    set_run_font(run, size=14, bold=True)

    # ── Автор ──
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run(META["author_ru"])
    set_run_font(run, size=11)

    # ── Специальность и УДК ──
    for label, value in (("Специальность", META["specialty"]), ("УДК", META["udc"])):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(f"{label}: {value}")
        set_run_font(run, size=11)

    # ── Отделитель ──
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)

    # ── Аннотация (RU) ──
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run("Аннотация")
    set_run_font(run, size=12, bold=True)
    render_block(doc, ("abstract", ("ru", META["abstract_ru"])))

    # ── Ключевые слова (RU) ──
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run("Ключевые слова")
    set_run_font(run, size=12, bold=True)
    render_block(doc, ("keywords", ("ru", META["keywords_ru"])))

    # ── Отделитель ──
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)

    # ── Annotatoin (EN) ──
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run("Abstract")
    set_run_font(run, size=12, bold=True)
    render_block(doc, ("abstract", ("en", META["abstract_en"])))

    # ── Keywords (EN) ──
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run("Keywords")
    set_run_font(run, size=12, bold=True)
    render_block(doc, ("keywords", ("en", META["keywords_en"])))

    # ── Отделитель ──
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(8)

    # ── Основная часть: части 1, 2, 3 ──
    for blk in BLOCKS_1:
        render_block(doc, blk)
    for blk in BLOCKS_2:
        render_block(doc, blk)
    for blk in BLOCKS_3:
        render_block(doc, blk)

    # ── Список литературы ──
    render_references(doc)

    # ── Аннотационный блок на английском (bibliographic) ──
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run(EN_BLOCK["title"])
    set_run_font(run, size=12, bold=True)
    for line in EN_BLOCK["lines"]:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(line)
        set_run_font(run, size=11)

    out = "Zelennye obligatsii VAK article.docx"
    doc.save(out)
    print(f"saved: {out}")
    print(f"paragraphs: {len(doc.paragraphs)}, tables: {len(doc.tables)}, references: {len(REFERENCES)}")


if __name__ == "__main__":
    build()
