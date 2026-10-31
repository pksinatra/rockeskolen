import math
from lib import *

NOTES = [(0.0, 1.0, "C4", 12), (1.0, 2.0, "E4", 8), (2.0, 3.0, "G4", 5), (3.0, 4.4, "C5", 0)]
VEL = [0.9, 0.6, 0.75, 1.0]
SHARP_ROWS = {1, 3, 5, 8, 10}  # fra C5 og ned: B, A#, A, G#, G, F#, ...


def _row_is_black(r):
    # rad 0 = C5, rad 12 = C4; halvtone over C4 = 12 - r
    return (12 - r) % 12 in (1, 3, 6, 8, 10)


# ---------- 296: Audio og MIDI ----------

def audio_midi():
    f = Fig("mp-audio-midi", 960, 400, "Samme frase som lydopptak (bølgeform) og som MIDI (pianorull)")
    for x0, title in ((30, "Audio – selve lyden"), (495, "MIDI – hendelser, ikke lyd")):
        f.add(f'<rect x="{x0}" y="20" width="435" height="360" rx="12" fill="{PANEL}" opacity=".55"/>')
        f.text(x0 + 20, 52, title, "h")
    T = 4.4
    # audio
    xa0, xa1, yc, amp = 50, 445, 200, 95
    f.add(f'<line x1="{xa0}" y1="{yc}" x2="{xa1}" y2="{yc}" class="ln"/>')
    pts = []
    n = 1600
    for i in range(n + 1):
        t = T * i / n
        v = 0
        for (s, e, _, r), vel in zip(NOTES, VEL):
            if t >= s:
                cyc = 9 + (12 - r) * 0.9
                v += vel * math.exp(-2.6 * (t - s)) * math.sin(2 * math.pi * cyc * (t - s))
        pts.append((xa0 + (xa1 - xa0) * t / T, yc - amp * max(-1, min(1, v * 0.85))))
    f.poly(pts, RED, 1.4)
    f.text(xa1, 360, "tid →", "s e")
    # pianorull
    kx, gx0, gx1, y0, rh = 525, 555, 915, 70, 16
    for r in range(13):
        yy = y0 + r * rh
        black = _row_is_black(r)
        f.add(f'<rect x="{gx0}" y="{yy}" width="{gx1-gx0}" height="{rh}" fill="{"#1b1d2b" if black else "#262a3e"}"/>')
        if black:
            f.add(f'<rect x="{kx}" y="{yy}" width="30" height="{rh}" fill="{TEXT}"/>'
                  f'<rect x="{kx}" y="{yy+1}" width="19" height="{rh-2}" rx="1" fill="#111"/>')
        else:
            f.add(f'<rect x="{kx}" y="{yy}" width="30" height="{rh}" fill="{TEXT}" stroke="#999" stroke-width=".6"/>')
    for k in range(1, 5):
        xx = gx0 + (gx1 - gx0) * k / T
        f.add(f'<line x1="{xx:.1f}" y1="{y0}" x2="{xx:.1f}" y2="{y0+13*rh}" stroke="{BORDER}" stroke-width="1"/>')
    f.text(kx - 8, y0 + 12 * rh + 13, "C4", "s e")
    f.text(kx - 8, y0 + 13, "C5", "s e")
    for (s, e, name, r) in NOTES:
        xa = gx0 + (gx1 - gx0) * s / T + 1
        xb = gx0 + (gx1 - gx0) * e / T - 2
        f.add(f'<rect x="{xa:.1f}" y="{y0 + r*rh + 1}" width="{xb-xa:.1f}" height="{rh-2}" rx="3" fill="{GREY}"/>')
    # anslag
    vy = 340
    f.text(kx + 30, 296, "anslag", "s e")
    f.add(f'<line x1="{gx0}" y1="{vy}" x2="{gx1}" y2="{vy}" class="ln"/>')
    for (s, e, _, _), vel in zip(NOTES, VEL):
        xx = gx0 + (gx1 - gx0) * s / T + 6
        f.add(f'<line x1="{xx:.1f}" y1="{vy}" x2="{xx:.1f}" y2="{vy - 40*vel:.1f}" stroke="{GREY}" stroke-width="4"/>'
              f'<circle cx="{xx:.1f}" cy="{vy - 40*vel:.1f}" r="4" fill="{GREY}"/>')
    f.text(gx1, 368, "tid →", "s e")
    return f


def midi_vei():
    f = Fig("mp-midi-vei", 960, 320, "MIDI-signalveien: data fra keyboardet blir lyd først i det virtuelle instrumentet")
    y = 170
    f.keyboard(110, y, octaves=2, ww=11)
    f.computer(450, y)
    f.interface(670, y)
    f.speaker(870, y)
    for x, lines in ((110, ["MIDI-keyboard"]), (450, ["Virtuelt instrument", "i DAW-en"]),
                     (670, ["Lydkort"]), (870, ["Høyttalere"])):
        f.label(x, y + 62, lines)
    f.arrow(196, y, 400, y, "mi")
    f.arrow(498, y, 622, y)
    f.arrow(718, y, 832, y)
    # meldinger
    f.add(f'<rect x="208" y="52" width="180" height="62" rx="10" fill="{DIM}" stroke="{BORDER}"/>')
    f.text(222, 78, "Note på: C4 · anslag 96", "s")
    f.text(222, 100, "Note av: C4", "s")
    f.add(f'<line x1="298" y1="114" x2="298" y2="{y-10}" stroke="{BORDER}" stroke-dasharray="3 4"/>')
    f.text(298, y + 30, "bare informasjon – ingen lyd", "c s")
    f.text(660, 120, "her blir det lyd", "c s")
    f.add(f'<line x1="740" y1="300" x2="770" y2="300" class="au"/>')
    f.text(778, 305, "lyd", "s")
    f.add(f'<line x1="820" y1="300" x2="850" y2="300" class="mi"/>')
    f.text(858, 305, "MIDI", "s")
    return f


def step():
    f = Fig("mp-step", 960, 320, "Step sequencer med 16 trinn: stortromme, skarptromme og hi-hat i et enkelt komp")
    gx, sw, sh = 250, 41, 44
    rows = [("Hi-hat", "MIDI-note 42", [0, 2, 4, 6, 8, 10, 12, 14]),
            ("Skarptromme", "MIDI-note 38", [4, 12]),
            ("Stortromme", "MIDI-note 36", [0, 8])]
    y0 = 80
    for b in range(4):
        f.text(gx + b * 4 * sw + sw / 2, 62, str(b + 1), "c h")
        for k in (1, 2, 3):
            f.add(f'<circle cx="{gx + (b*4+k)*sw + sw/2}" cy="56" r="2" fill="{MUTED}"/>')
    for i, (name, note, on) in enumerate(rows):
        yy = y0 + i * (sh + 12)
        f.text(gx - 20, yy + 20, name, "e")
        f.text(gx - 20, yy + 38, note, "s e")
        for st in range(16):
            group = (st // 4) % 2
            active = st in on
            fill = RED if active else ("#2a2d42" if group == 0 else "#22253a")
            f.add(f'<rect x="{gx + st*sw + 3}" y="{yy}" width="{sw-6}" height="{sh}" rx="6" fill="{fill}" stroke="{BORDER if not active else RED}"/>')
    f.text(gx, 286, "1 takt i 4/4 · 16 trinn · hvert trinn er en sekstendedel", "s")
    f.text(gx + 16 * sw, 286, "tid →", "s e")
    return f


# ---------- 297: Spor, looper og redigering ----------

def _drum_blocks(f, x, y, w, h, bars, color=GREY, op="1"):
    # enkelt trommemønster: stortromme 1 og 3, skarptromme 2 og 4, hi-hat åttendedeler
    per = w / (bars * 8)
    for b in range(bars):
        for e in range(8):
            xx = x + (b * 8 + e) * per
            f.add(f'<rect x="{xx+1:.1f}" y="{y+4}" width="{per*0.6:.1f}" height="4" fill="{color}" opacity="{op}"/>')
            if e in (0, 4):
                f.add(f'<rect x="{xx+1:.1f}" y="{y+h-10}" width="{per*0.6:.1f}" height="4" fill="{color}" opacity="{op}"/>')
            if e in (2, 6):
                f.add(f'<rect x="{xx+1:.1f}" y="{y+h/2-2:.1f}" width="{per*0.6:.1f}" height="4" fill="{color}" opacity="{op}"/>')


def _audio_wave(f, x, w, yc, amp, seed=1.0, n=500, color=RED, width=1.2):
    pts = []
    for i in range(n + 1):
        t = i / n
        env = 0.55 + 0.45 * abs(math.sin(math.pi * (t * 8 * seed)))
        v = env * math.sin(2 * math.pi * 60 * t * seed) * (0.6 + 0.4 * math.sin(2 * math.pi * 3.3 * t + seed))
        pts.append((x + w * t, yc - amp * v))
    f.poly(pts, color, width)


def daw():
    f = Fig("mp-daw", 960, 400, "En typisk DAW-arbeidsflate med spor, tidslinje, regioner og avspillingsposisjon")
    wx, wy, ww, wh = 20, 20, 690, 360
    f.add(f'<rect x="{wx}" y="{wy}" width="{ww}" height="{wh}" rx="10" fill="#141622" stroke="{BORDER}"/>')
    # transport
    f.add(f'<rect x="{wx}" y="{wy}" width="{ww}" height="46" rx="10" fill="{PANEL}"/>')
    f.add(f'<path d="M48,32 l14,9 l-14,9 z" fill="{TEXT}"/><rect x="74" y="33" width="15" height="15" fill="{TEXT}"/>'
          f'<circle cx="110" cy="41" r="8" fill="{RED}"/>')
    f.text(150, 47, "120 BPM · 4/4", "s")
    tx0, bw = 190, 62
    # linjal
    for b in range(9):
        xx = tx0 + b * bw
        f.add(f'<line x1="{xx}" y1="76" x2="{xx}" y2="96" stroke="{MUTED}"/>')
        if b < 8:
            f.text(xx + 4, 92, str(b + 1), "s")
    f.add(f'<line x1="{tx0}" y1="96" x2="{tx0+8*bw}" y2="96" class="ln"/>')
    # markører
    for b, name in ((0, "Vers"), (4, "Refreng")):
        xx = tx0 + b * bw
        f.add(f'<path d="M{xx},102 h{len(name)*8+14} l-6,9 l6,9 h-{len(name)*8+14} z" fill="{DIM}" stroke="{BORDER}"/>')
        f.text(xx + 6, 117, name, "s")
    # spor
    tracks = [("Trommer", "MIDI", 0, 8), ("Bass", "lyd", 0, 8), ("Vokal 1", "lyd", 2, 8)]
    for i, (name, kind, b0, b1) in enumerate(tracks):
        ty = 132 + i * 74
        f.add(f'<rect x="30" y="{ty}" width="150" height="62" rx="6" fill="{PANEL}" stroke="{BORDER}"/>')
        f.add(f'<rect x="30" y="{ty}" width="6" height="62" fill="{GREY if kind=="MIDI" else RED}"/>')
        f.text(46, ty + 26, name)
        for k, s in enumerate(("M", "S")):
            f.add(f'<rect x="{46+k*26}" y="{ty+36}" width="20" height="18" rx="3" fill="{DIM}" stroke="{BORDER}"/>')
            f.text(56 + k * 26, ty + 50, s, "c s")
        xa, xb = tx0 + b0 * bw, tx0 + b1 * bw
        if kind == "MIDI":
            f.add(f'<rect x="{xa+1}" y="{ty}" width="{xb-xa-2}" height="62" rx="6" fill="#2b2e40" stroke="{GREY}"/>')
            _drum_blocks(f, xa + 4, ty + 6, xb - xa - 8, 50, 8)
        else:
            f.add(f'<rect x="{xa+1}" y="{ty}" width="{xb-xa-2}" height="62" rx="6" fill="{RED_FILL}" stroke="{RED}"/>')
            _audio_wave(f, xa + 4, xb - xa - 8, ty + 31, 22, seed=1 + i * 0.37)
    # avspillingsposisjon
    px = tx0 + 3.5 * bw
    f.add(f'<line x1="{px}" y1="76" x2="{px}" y2="364" stroke="{TEXT}" stroke-width="2"/>'
          f'<path d="M{px-7},70 h14 l-7,9 z" fill="{TEXT}"/>')

    # nummerering
    def badge(x, y, n):
        f.add(f'<circle cx="{x}" cy="{y}" r="12" fill="{RED}"/>')
        f.text(x, y + 5, str(n), "c h")
    marks = [(282, 41, 1, "Transport"), (tx0 + 8 * bw - 10, 86, 2, "Tidslinje i takter"),
             (tx0 + 4 * bw + 90, 111, 3, "Markør"), (165, 145, 4, "Spor"),
             (tx0 + 7 * bw + 30, 160, 5, "MIDI-region"), (tx0 + 7 * bw + 30, 234, 6, "Lydregion"),
             (px + 16, 352, 7, "Avspillingsposisjon")]
    for x, y, n, lab in marks:
        badge(x, y, n)
        f.add(f'<circle cx="752" cy="{60 + n*40 - 40}" r="12" fill="{RED}"/>')
        f.text(752, 65 + n * 40 - 40, str(n), "c h")
        f.text(774, 65 + n * 40 - 40, lab, "s")
    return f


def looper():
    f = Fig("mp-looper", 960, 420, "Kopiering, looping og repetert avspilling på en tidslinje")
    tx0, bw = 230, 84
    for b in range(9):
        xx = tx0 + b * bw
        f.add(f'<line x1="{xx}" y1="40" x2="{xx}" y2="56" stroke="{MUTED}"/>')
        if b < 8:
            f.text(xx + 5, 52, str(b + 1), "s")
    f.add(f'<line x1="{tx0}" y1="56" x2="{tx0+8*bw}" y2="56" class="ln"/>')
    lanes = [("Kopiering", "nye, selvstendige regioner"), ("Looping", "samme materiale gjentas"),
             ("Repetert avspilling", "et område spilles om igjen")]
    ys = [86, 196, 316]
    for (name, sub), y in zip(lanes, ys):
        f.text(30, y + 26, name, "h")
        f.text(30, y + 48, sub, "s")
    h = 62
    # kopiering
    y = ys[0]
    for k in range(4):
        xa = tx0 + k * 2 * bw
        f.add(f'<rect x="{xa+2}" y="{y}" width="{2*bw-4}" height="{h}" rx="6" fill="#2b2e40" stroke="{GREY}"/>')
        _drum_blocks(f, xa + 6, y + 6, 2 * bw - 12, h - 26, 2)
        f.text(xa + 10, y + h - 6, "original" if k == 0 else "kopi", "s")
    # looping
    y = ys[1]
    f.add(f'<rect x="{tx0+2}" y="{y}" width="{2*bw-4}" height="{h}" rx="6" fill="#2b2e40" stroke="{GREY}"/>')
    _drum_blocks(f, tx0 + 6, y + 6, 2 * bw - 12, h - 26, 2)
    f.text(tx0 + 10, y + h - 6, "original", "s")
    f.add(f'<rect x="{tx0+2*bw}" y="{y}" width="{6*bw-2}" height="{h}" rx="6" fill="#23263a" stroke="{GREY}" stroke-dasharray="5 4"/>')
    for k in range(1, 4):
        xa = tx0 + k * 2 * bw
        _drum_blocks(f, xa + 6, y + 6, 2 * bw - 12, h - 26, 2, op=".45")
        if k > 1:
            f.add(f'<line x1="{xa}" y1="{y+6}" x2="{xa}" y2="{y+h-6}" stroke="{GREY}" stroke-dasharray="3 3" opacity=".6"/>')
    f.text(tx0 + 2 * bw + 10, y + h - 6, "gjentakelser", "s")
    # repetert avspilling
    y = ys[2]
    ra, rb = tx0 + 2 * bw, tx0 + 4 * bw
    f.add(f'<rect x="{ra}" y="{y-26}" width="{rb-ra}" height="14" rx="4" fill="{RED}" opacity=".85"/>')
    f.add(f'<rect x="{ra}" y="{y}" width="{rb-ra}" height="{h}" fill="{RED}" opacity=".12"/>')
    f.add(f'<rect x="{tx0+2}" y="{y}" width="{8*bw-4}" height="{h}" rx="6" fill="{RED_FILL}" stroke="{RED}"/>')
    _audio_wave(f, tx0 + 6, 8 * bw - 12, y + h / 2, 22, seed=1.4)
    f.add(f'<path d="M{rb-6},{y-34} C{rb-30},{y-62} {ra+30},{y-62} {ra+6},{y-34}" stroke="{TEXT}" stroke-width="2" fill="none" marker-end="url(#mp-looper-aw)"/>')
    f.text(rb + 12, y - 15, "valgt område", "s")
    return f


def fades():
    f = Fig("mp-fades", 960, 330, "Fade-in, fade-out og crossfade mellom to lydregioner")

    def region(x, w, y, h, env, seed=1.0, fill=RED_FILL):
        f.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{fill}" stroke="{RED}"/>')
        pts = []
        n = 400
        for i in range(n + 1):
            t = i / n
            v = env(t) * math.sin(2 * math.pi * 45 * t * seed) * (0.7 + 0.3 * math.sin(2 * math.pi * 4 * t + seed))
            pts.append((x + w * t, y + h / 2 - (h / 2 - 8) * v))
        f.poly(pts, RED, 1.1)
        # forsterkningskurve
        curve = [(x + w * i / 100, y + h - 4 - (h - 8) * env(i / 100)) for i in range(101)]
        f.poly(curve, TEXT, 2.2)

    def lin_in(a):
        return lambda t: min(1, t / a)

    def lin_out(a):
        return lambda t: min(1, (1 - t) / a)

    f.text(40, 50, "Fade-in", "h")
    region(40, 260, 80, 110, lin_in(0.4))
    f.text(340, 50, "Fade-out", "h")
    region(340, 260, 80, 110, lin_out(0.4), seed=1.3)
    f.text(640, 50, "Crossfade", "h")
    # region A: 640..860, region B: 740..920, overlapp 740..860
    xa, wa, xb, wb = 640, 220, 740, 180
    ov0, ov1 = 740, 860
    f.add(f'<rect x="{ov0}" y="74" width="{ov1-ov0}" height="214" fill="{TEXT}" opacity=".06"/>')
    region(xa, wa, 80, 90, lambda t: 1 if xa + wa * t < ov0 else max(0, 1 - (xa + wa * t - ov0) / (ov1 - ov0)), seed=1.1)
    region(xb, wb, 190, 90, lambda t: min(1, (xb + wb * t - ov0) / (ov1 - ov0)), seed=0.8)
    f.text((ov0 + ov1) / 2, 306, "overlapp", "c s")
    f.add(f'<line x1="40" y1="306" x2="66" y2="306" stroke="{TEXT}" stroke-width="2.2"/>')
    f.text(74, 311, "nivå", "s")
    return f


FIGS = [
    dict(art="296", title="Audio og MIDI – to forskjellige verdener", fn=audio_midi, where="To måter å arbeide med musikk på",
         cap="Den samme frasen (C4 – E4 – G4 – C5) som lydopptak og som MIDI. Bølgeformen inneholder selve lyden. Pianorullen viser bare hvilke toner som spilles, når, hvor lenge og med hvilket anslag."),
    dict(art="296", title="Audio og MIDI – to forskjellige verdener", fn=midi_vei, where="Hva skjer når vi spiller på et MIDI-keyboard?",
         cap="MIDI-keyboardet sender bare meldinger om hvilke toner som spilles. Det blir lyd først når meldingene når det virtuelle instrumentet."),
    dict(art="296", title="Audio og MIDI – to forskjellige verdener", fn=step, where="MIDI og trommeprogrammering",
         cap="En step sequencer viser én takt som 16 trinn. Hver rad er en MIDI-note som utløser én trommelyd. Her: stortromme på 1 og 3, skarptromme på 2 og 4 og hi-hat på åttendedeler."),
    dict(art="297", title="Spor, looper og redigering", fn=daw, where="Det digitale arbeidsbordet",
         cap="Programmene ser forskjellige ut, men de fleste DAW-er har de samme delene: transport, tidslinje, markører, spor og regioner med lyd eller MIDI."),
    dict(art="297", title="Spor, looper og redigering", fn=looper, where="Hva er en loop?",
         cap="Tre arbeidsmåter som ligner på hverandre: kopiering lager nye regioner, looping gjentar det samme materialet, og repetert avspilling spiller et valgt område om og om igjen uten å endre prosjektet."),
    dict(art="297", title="Spor, looper og redigering", fn=fades, where="Overganger og crossfades",
         cap="Den hvite linjen viser nivået. En fade-in øker nivået gradvis, en fade-out senker det. I en crossfade dempes den første regionen mens den andre kommer inn."),
]
