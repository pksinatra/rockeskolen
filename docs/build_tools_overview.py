from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

OUT = '/Users/pk/Documents/Codex/rockeskolen/docs/rockeskolen-tools-overview.docx'

catalog = [
    ('ChordFlow', '/tools/chordflow/', 'Ikke funnet lokalt'),
    ('ChordProg', '/tools/chordprog/', '2026-10-12'),
    ('Pianoakkorder', '/tools/chords/piano/', '2026-10-11'),
    ('Pianovisualisering', '/tools/visualizers/piano/', '2026-10-12'),
    ('Gitarakkorder', '/tools/chords/guitar/', '2026-10-11'),
    ('Pianoskalaer', '/tools/scales/piano/', '2026-10-11'),
    ('Gitarskalaer', '/tools/scales/guitar/', '2026-10-11'),
    ('Kvintsirkelen', '/tools/circles/fifths/', '2026-10-11'),
    ('ChordLog', '/tools/chordlog/', '2026-10-12'),
    ('Tuner og stemmetoner', '/tools/tuners/', '2026-06-08'),
    ('Spillbart piano', '/tools/instruments/piano_playable.php', '2026-10-12'),
    ('Musikksymboler', '/tools/symbols/', '2026-08-31'),
]

other = [
    ('Chord Charts', '/tools/charts/charts.php', '2026-10-11'),
    ('Akkordvisning – gitar', '/tools/chords/chords/guitar/', '2026-10-11'),
    ('Akkordvisning – piano', '/tools/chords/chords/piano/', '2026-10-11'),
    ('Akkordvisning – noter', '/tools/chords/chords/notes/', '2026-06-08'),
    ('Akkordvisning – noter', '/tools/chords/notes/', '2026-06-08'),
    ('Frequencer', '/tools/frequencer/', '2026-06-08'),
    ('Notation Mahjong', '/tools/games/mahjong/', '2026-06-08'),
    ('AI Music Prompt Builder', '/tools/generators/suno.php', '2026-06-08'),
    ('SoundLab', '/tools/soundlab/', '2026-09-11'),
    ('Eldre stemmegaffel', '/tools/tuners/tuning.php', '2026-06-08'),
    ('Eldre gitarskalaer', '/tools/scales/scales/guitar/', '2026-10-11'),
    ('Eldre pianoskalaer', '/tools/scales/scales/piano/', '2026-10-11'),
    ('Eldre visualizer', '/tools/visualizers/', '2026-06-08'),
    ('Piano Visualizer', '/tools/visualizers/piano/', '2026-07-28'),
    ('Eldre noteverktøy', '/tools/notes/', '2026-06-17'),
]

legacy = [
    '/tools/chordlog/working/',
    '/tools/chords/chords/guitar/working/',
    '/tools/chords/chords/guitar/working2/',
    '/tools/chords/chords/notes/index-.php',
    '/tools/chords/chords/notes/index-2.php',
    '/tools/notes/old/',
    '/tools/scales/guitar/old/',
    '/tools/scales/scales/piano/working0/',
    '/tools/scales/scales/piano/working1/',
    '/tools/visualizers/index-1.php til /tools/visualizers/index-8.php',
    '/tools/index-1.php',
]

def shade(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn('w:shd'))
    if shd is None:
        shd = OxmlElement('w:shd')
        tc_pr.append(shd)
    shd.set(qn('w:fill'), fill)

def borders(table, color='D9D9D9'):
    tbl = table._tbl
    tbl_pr = tbl.tblPr
    borders = tbl_pr.first_child_found_in('w:tblBorders')
    if borders is None:
        borders = OxmlElement('w:tblBorders')
        tbl_pr.append(borders)
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        tag = 'w:' + edge
        el = borders.find(qn(tag))
        if el is None:
            el = OxmlElement(tag)
            borders.append(el)
        el.set(qn('w:val'), 'single')
        el.set(qn('w:sz'), '4')
        el.set(qn('w:space'), '0')
        el.set(qn('w:color'), color)

def set_cell_text(cell, text, bold=False, color='000000', size=9):
    cell.text = ''
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(text)
    run.bold = bold
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER

def add_table(doc, rows):
    table = doc.add_table(rows=1, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    widths = [Inches(2.0), Inches(3.8), Inches(1.3)]
    for i, width in enumerate(widths):
        table.columns[i].width = width
    headers = ['Appnavn', 'URL', 'Sist endret']
    for i, text in enumerate(headers):
        set_cell_text(table.rows[0].cells[i], text, True, 'FFFFFF', 9)
        shade(table.rows[0].cells[i], '1F4E78')
    for idx, row in enumerate(rows):
        cells = table.add_row().cells
        for i, text in enumerate(row):
            set_cell_text(cells[i], text, False, '000000', 9)
            if idx % 2 == 1:
                shade(cells[i], 'F2F6FA')
    borders(table)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return table

doc = Document()
section = doc.sections[0]
section.top_margin = Inches(0.65)
section.bottom_margin = Inches(0.65)
section.left_margin = Inches(0.7)
section.right_margin = Inches(0.7)

styles = doc.styles
styles['Normal'].font.name = 'Aptos'
styles['Normal'].font.size = Pt(10.5)
styles['Title'].font.name = 'Aptos Display'
styles['Title'].font.size = Pt(24)
styles['Title'].font.bold = True
styles['Title'].font.color.rgb = RGBColor(0, 0, 0)
for name in ('Heading 1', 'Heading 2'):
    styles[name].font.name = 'Aptos Display'
    styles[name].font.color.rgb = RGBColor(0, 0, 0)

p = doc.add_paragraph(style='Title')
p.add_run('Rockeskolens verktøyoversikt')
p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(12)
r = p.add_run('Kartlegging av verktøy under /tools/ med appnavn, URL og sist lokal endringsdato')
r.italic = True
r.font.color.rgb = RGBColor(89, 89, 89)

doc.add_paragraph('Denne oversikten viser Rockeskolens aktive verktøykatalog og øvrige selvstendige entrypoints som ligger under /tools/. Den faste ChordLink-mappestrukturen er brukt. Mappen /tools/updated/ inngår ikke i oversikten og er fjernet fra prosjektstrukturen.', style='Normal')
doc.add_paragraph('Datoene er hentet fra den lokale arbeidskopien 20. oktober 2026. De er derfor ikke nødvendigvis identiske med sist endret dato på produksjonsserveren.', style='Normal')

doc.add_heading('Verktøy i Rockeskolens katalog', level=1)
add_table(doc, catalog)

doc.add_heading('Andre selvstendige verktøy under tools', level=1)
add_table(doc, other)

doc.add_heading('Historiske og interne varianter', level=1)
doc.add_paragraph('Følgende stier ligger fysisk under /tools/, men bør ikke regnes som egne aktive apper. De ser ut til å være arbeidskopier, eldre versjoner eller testvarianter.')
for path in legacy:
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(1)
    p.add_run(path)

doc.add_heading('Merknader', level=1)
doc.add_paragraph('ChordFlow er registrert i katalogen med URL-en /tools/chordflow/, men tilsvarende lokal mappe ble ikke funnet i kartleggingen.')
doc.add_paragraph('Produksjonssjekken viste HTTP 500 på /tools/scales/piano/. Dette er en eksisterende feil på den faste URL-en og ble ikke endret i forbindelse med oppryddingen.')

footer = section.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
fr = footer.add_run('Rockeskolen · Verktøyoversikt · 20.10.2026')
fr.font.size = Pt(8)
fr.font.color.rgb = RGBColor(128, 128, 128)

doc.save(OUT)
print(OUT)
