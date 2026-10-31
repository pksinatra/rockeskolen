import base64
import math
import os

RED = "#ff2b2b"
RED_SOFT = "#ff7373"
RED_FILL = "#3a1a20"
GREY = "#c9ccd6"
MUTED = "#a6a9b6"
TEXT = "#ebebeb"
BG = "#181a25"
PANEL = "#22253a"
BORDER = "#46484b"
DIM = "#2c2f42"

FONT = "Inter, 'Open Sans', Arial, sans-serif"

# Inter (SIL OFL 1.1), utvalg med bare tegnene figurene trenger. Bygges inn i hver SVG
# fordi et bilde i <img> ikke kan bruke fontene på siden.
_FONT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "inter-subset.woff2")
FONT_FACE = ("@font-face{font-family:Inter;font-weight:400 700;src:url(data:font/woff2;base64,"
             + base64.b64encode(open(_FONT_FILE, "rb").read()).decode() + ") format('woff2')}")


def css(p):
    return f"""
.{p} text{{font-family:{FONT};fill:{TEXT};font-size:16px}}
.{p} .s{{font-size:14px;fill:{MUTED}}}
.{p} .h{{font-size:17px;font-weight:600}}
.{p} .c{{text-anchor:middle}}
.{p} .e{{text-anchor:end}}
.{p} .box{{fill:{PANEL};stroke:{BORDER};stroke-width:1.5}}
.{p} .au{{stroke:{RED};stroke-width:3;fill:none}}
.{p} .mi{{stroke:{GREY};stroke-width:2.5;fill:none;stroke-dasharray:7 6}}
.{p} .ln{{stroke:{BORDER};stroke-width:1.5;fill:none}}
.{p} .ic{{stroke:{TEXT};stroke-width:2.5;fill:none;stroke-linecap:round;stroke-linejoin:round}}
"""


class Fig:
    def __init__(self, slug, w, h, title):
        self.p, self.w, self.h, self.title = slug, w, h, title
        self.parts = []

    def add(self, s):
        self.parts.append(s)

    def render(self):
        p = self.p
        defs = (f'<defs>'
                f'<marker id="{p}-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{RED}"/></marker>'
                f'<marker id="{p}-ag" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{GREY}"/></marker>'
                f'<marker id="{p}-aw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{MUTED}"/></marker>'
                f'</defs>')
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" '
                f'class="{p}" role="img" aria-labelledby="{p}-t">'
                f'<title id="{p}-t">{self.title}</title><style>{FONT_FACE}{css(p)}</style>{defs}'
                f'<rect width="{self.w}" height="{self.h}" rx="14" fill="{BG}"/>'
                + "".join(self.parts) + '</svg>')

    # --- primitives -------------------------------------------------
    def text(self, x, y, s, cls="", **kw):
        extra = "".join(f' {k.replace("_", "-")}="{v}"' for k, v in kw.items())
        self.add(f'<text x="{x:.1f}" y="{y:.1f}" class="{cls}"{extra}>{s}</text>')

    def label(self, x, y, lines, cls="c", sub=None):
        for i, ln in enumerate(lines):
            self.text(x, y + i * 20, ln, cls)
        if sub:
            self.text(x, y + len(lines) * 20, sub, cls + " s")

    def box(self, x, y, w, h, lines=(), sub=None, rx=10, cls="box"):
        self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" class="{cls}"/>')
        n = len(lines) + (1 if sub else 0)
        y0 = y + h / 2 - (n - 1) * 10 + 5
        for i, ln in enumerate(lines):
            self.text(x + w / 2, y0 + i * 20, ln, "c h" if i == 0 else "c")
        if sub:
            self.text(x + w / 2, y0 + len(lines) * 20, sub, "c s")

    def arrow(self, x1, y1, x2, y2, kind="au"):
        m = {"au": "ar", "mi": "ag", "ln": "aw"}[kind]
        self.add(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="{kind}" marker-end="url(#{self.p}-{m})"/>')

    def path_arrow(self, d, kind="au"):
        m = {"au": "ar", "mi": "ag", "ln": "aw"}[kind]
        self.add(f'<path d="{d}" class="{kind}" marker-end="url(#{self.p}-{m})"/>')

    def poly(self, pts, stroke=RED, width=2.5, fill="none", extra=""):
        d = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
        self.add(f'<polyline points="{d}" stroke="{stroke}" stroke-width="{width}" fill="{fill}" stroke-linejoin="round" {extra}/>')

    # --- icons (centred at x,y; ~64px) ------------------------------
    def mic(self, x, y):
        self.add(f'<g class="ic"><rect x="{x-11}" y="{y-30}" width="22" height="36" rx="11"/>'
                 f'<line x1="{x-11}" y1="{y-16}" x2="{x+11}" y2="{y-16}"/>'
                 f'<path d="M{x-19},{y-6} a19,19 0 0 0 38,0"/>'
                 f'<line x1="{x}" y1="{y+13}" x2="{x}" y2="{y+28}"/>'
                 f'<line x1="{x-12}" y1="{y+28}" x2="{x+12}" y2="{y+28}"/></g>')

    def guitar(self, x, y):
        # silhuett: to sammensmeltede kropper, hals og hode, rotert
        self.add(f'<g transform="rotate(-35 {x} {y})">'
                 f'<ellipse cx="{x}" cy="{y+14}" rx="16" ry="14" fill="{TEXT}"/>'
                 f'<ellipse cx="{x}" cy="{y-4}" rx="12" ry="11" fill="{TEXT}"/>'
                 f'<rect x="{x-3}" y="{y-40}" width="6" height="34" fill="{TEXT}"/>'
                 f'<rect x="{x-5}" y="{y-50}" width="10" height="12" rx="2" fill="{TEXT}"/>'
                 f'<rect x="{x-8}" y="{y+2}" width="16" height="4" rx="1" fill="{BG}"/>'
                 f'<rect x="{x-8}" y="{y+12}" width="16" height="4" rx="1" fill="{BG}"/>'
                 f'<rect x="{x-6}" y="{y+21}" width="12" height="3" rx="1" fill="{BG}"/></g>')

    def interface(self, x, y):
        self.add(f'<g class="ic"><rect x="{x-34}" y="{y-20}" width="68" height="40" rx="6"/>'
                 f'<circle cx="{x-18}" cy="{y-3}" r="6"/><circle cx="{x}" cy="{y-3}" r="6"/>'
                 f'<circle cx="{x+20}" cy="{y-3}" r="4"/>'
                 f'<line x1="{x-24}" y1="{y+11}" x2="{x+24}" y2="{y+11}"/></g>')

    def computer(self, x, y, wave=True):
        s = (f'<g class="ic"><rect x="{x-36}" y="{y-28}" width="72" height="46" rx="5"/>'
             f'<line x1="{x}" y1="{y+18}" x2="{x}" y2="{y+28}"/>'
             f'<line x1="{x-16}" y1="{y+28}" x2="{x+16}" y2="{y+28}"/></g>')
        self.add(s)
        if wave:
            pts = [(x - 26 + i * 2, y - 5 + 11 * math.sin(i * 0.9) * math.exp(-((i - 13) / 9) ** 2)) for i in range(27)]
            self.poly(pts, RED, 2)

    def speaker(self, x, y):
        self.add(f'<g class="ic"><rect x="{x-20}" y="{y-30}" width="40" height="60" rx="5"/>'
                 f'<circle cx="{x}" cy="{y-15}" r="6"/><circle cx="{x}" cy="{y+9}" r="12"/></g>')

    def headphones(self, x, y):
        self.add(f'<g class="ic"><path d="M{x-24},{y+8} v-8 a24,24 0 0 1 48,0 v8"/>'
                 f'<rect x="{x-30}" y="{y+2}" width="13" height="24" rx="5"/>'
                 f'<rect x="{x+17}" y="{y+2}" width="13" height="24" rx="5"/></g>')

    def keyboard(self, x, y, octaves=2, ww=10):
        n = 7 * octaves
        w, h = n * ww, 40
        x0, y0 = x - w / 2, y - h / 2
        s = [f'<rect x="{x0}" y="{y0}" width="{w}" height="{h}" rx="3" fill="{TEXT}" stroke="{TEXT}" stroke-width="1.5"/>']
        for i in range(1, n):
            s.append(f'<line x1="{x0+i*ww}" y1="{y0}" x2="{x0+i*ww}" y2="{y0+h}" stroke="{BG}" stroke-width="1"/>')
        bw = ww * 0.62
        for i in range(n):
            if i % 7 in (0, 1, 3, 4, 5):  # svart tangent etter C, D, F, G, A
                s.append(f'<rect x="{x0+(i+1)*ww-bw/2}" y="{y0}" width="{bw}" height="{h*0.6}" fill="{BG}"/>')
        self.add("".join(s))

    def ear(self, x, y):
        self.add(f'<g class="ic"><path d="M{x-12},{y-8} a16,18 0 1 1 26,14 c-6,5 -8,9 -8,14 a8,8 0 0 1 -14,4"/>'
                 f'<path d="M{x-4},{y-6} a7,7 0 1 1 11,6 c-3,2 -4,4 -4,7"/></g>')

    def voice(self, x, y):
        self.add(f'<g class="ic"><circle cx="{x-8}" cy="{y-10}" r="13"/>'
                 f'<path d="M{x-28},{y+28} a20,20 0 0 1 40,0"/>'
                 f'<path d="M{x+12},{y-18} a14,14 0 0 1 0,16"/><path d="M{x+19},{y-24} a22,22 0 0 1 0,28"/></g>')

    def chip(self, x, y, s, w=None):
        w = w or (len(s) * 8.5 + 16)
        self.add(f'<rect x="{x}" y="{y}" width="{w}" height="22" rx="11" fill="{DIM}" stroke="{BORDER}"/>')
        self.text(x + w / 2, y + 16, s, "c s")
        return w


def wave(x0, x1, yc, amp, cycles, n=200, phase=0.0):
    return [(x0 + (x1 - x0) * i / n, yc - amp * math.sin(2 * math.pi * cycles * i / n + phase)) for i in range(n + 1)]


def music(t):
    return 0.62 * math.sin(2 * math.pi * 1.5 * t) + 0.3 * math.sin(2 * math.pi * 3.7 * t + 1.0)
