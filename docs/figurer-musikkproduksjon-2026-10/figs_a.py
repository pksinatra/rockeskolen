import math
from lib import *


# ---------- 294: Hva skjer egentlig i et musikkstudio? ----------

def lydkort():
    f = Fig("mp-lydkort", 960, 495, "Lydkortet: inngang, forforsterker og A/D inn – D/A, nivå og utganger ut")
    f.add(f'<rect x="168" y="30" width="585" height="400" rx="16" fill="none" stroke="{BORDER}" stroke-width="2" stroke-dasharray="4 4"/>')
    f.text(188, 58, "Lydkort", "h")
    # inn
    f.box(188, 86, 170, 68, ["Innganger"], "mikrofon · instrument")
    f.box(383, 86, 150, 68, ["Forforsterker"], "gain")
    f.box(558, 86, 170, 68, ["A/D-omformer"], "analogt → digitalt")
    f.arrow(358, 120, 380, 120)
    f.arrow(533, 120, 555, 120)
    # ut
    f.box(188, 296, 170, 68, ["Utganger"], "høyttaler · hodetelefon")
    f.box(383, 296, 150, 68, ["Utgangsnivå"], "volum")
    f.box(558, 296, 170, 68, ["D/A-omformer"], "digitalt → analogt")
    f.arrow(558, 330, 536, 330)
    f.arrow(383, 330, 361, 330)
    # kilder og lytting
    f.mic(70, 82); f.text(70, 136, "Mikrofon", "c s")
    f.guitar(70, 205); f.text(70, 262, "Elgitar", "c s")
    f.path_arrow("M98,90 C140,90 150,112 185,116")
    f.path_arrow("M100,200 C150,195 160,140 185,128")
    f.speaker(70, 322); f.text(70, 372, "Høyttaler", "c s")
    f.headphones(70, 418)
    f.path_arrow("M188,322 C150,322 130,326 98,326")
    f.path_arrow("M188,342 C160,360 150,428 106,430")
    f.text(70, 476, "Hodetelefoner", "c s")
    # datamaskin
    f.computer(860, 225)
    f.label(860, 285, ["Datamaskin", "med DAW"])
    f.path_arrow("M728,120 C780,120 790,212 818,212")
    f.path_arrow("M822,236 C790,236 780,330 731,330")
    f.text(800, 112, "USB", "c s")
    f.text(800, 352, "USB", "c s")
    return f


def studio():
    f = Fig("mp-studio", 960, 380, "Studioet som signalvei: mikrofon, lydkort, DAW, lydkort, høyttalere")
    y = 210
    xs = [80, 270, 480, 690, 880]
    f.mic(xs[0], y)
    f.interface(xs[1], y)
    f.computer(xs[2], y)
    f.interface(xs[3], y)
    f.speaker(xs[4], y)
    names = ["Mikrofon", "Lydkort", "Datamaskin / DAW", "Lydkort", "Høyttalere"]
    for x, n in zip(xs, names):
        f.text(x, y + 62, n, "c")
    for a, b in zip(xs, xs[1:]):
        f.arrow(a + 44, y, b - 46, y)
    # elgitar inn i lydkortet
    f.guitar(80, 82); f.text(130, 70, "Elgitar", "s")
    f.path_arrow(f"M110,96 C180,100 240,130 262,{y-26}")
    # MIDI-keyboard inn i datamaskinen
    f.keyboard(480, 70, octaves=2, ww=9)
    f.text(560, 76, "MIDI-keyboard", "s")
    f.arrow(480, 94, 480, y - 34, "mi")
    f.text(492, 140, "MIDI (USB)", "s")
    # hodetelefoner
    f.headphones(880, 72); f.text(880, 124, "Hodetelefoner", "c s")
    f.path_arrow(f"M{xs[3]+30},{y-24} C760,120 800,90 846,84")
    # samme lydkort
    f.add(f'<path d="M270,300 v16 h420 v-16" fill="none" stroke="{MUTED}" stroke-width="1.5"/>')
    f.text(480, 340, "Samme lydkort: inn til datamaskinen og ut igjen", "c s")
    # tegnforklaring
    f.add(f'<line x1="740" y1="360" x2="770" y2="360" class="au"/>')
    f.text(778, 365, "lyd", "s")
    f.add(f'<line x1="820" y1="360" x2="850" y2="360" class="mi"/>')
    f.text(858, 365, "MIDI", "s")
    return f


# ---------- 295: Fra lydkilde til høyttaler ----------

def frekvens_amplitude():
    f = Fig("mp-lyd", 960, 380, "Frekvens og amplitude vist som lydbølger")
    for x0, title in ((30, "Frekvens"), (495, "Amplitude")):
        f.add(f'<rect x="{x0}" y="20" width="435" height="340" rx="12" fill="{PANEL}" opacity=".55"/>')
        f.text(x0 + 20, 52, title, "h")
    rows = [
        (30, 140, 42, 2, "Lav frekvens – dypere tone"),
        (30, 285, 42, 7, "Høy frekvens – lysere tone"),
        (495, 140, 14, 3, "Liten amplitude – svakere lyd"),
        (495, 285, 52, 3, "Stor amplitude – kraftigere lyd"),
    ]
    for x0, yc, amp, cyc, lab in rows:
        f.text(x0 + 20, yc - 62, lab, "s")
        f.add(f'<line x1="{x0+20}" y1="{yc}" x2="{x0+415}" y2="{yc}" class="ln"/>')
        f.poly(wave(x0 + 20, x0 + 400, yc, amp, cyc, 300), RED, 2.5)
    for x0 in (30, 495):
        f.text(x0 + 415, 350, "tid →", "s e")
    return f


def _sample_row(f, yc, n, label, x0=70, x1=910, amp=60, bracket=False):
    f.text(x0, yc - amp - 22, label, "s")
    f.add(f'<line x1="{x0}" y1="{yc}" x2="{x1}" y2="{yc}" class="ln"/>')
    curve = [(x0 + (x1 - x0) * i / 400, yc - amp * music(i / 400)) for i in range(401)]
    f.poly(curve, GREY, 1.6, extra='opacity=".75"')
    pts = []
    for k in range(n + 1):
        t = k / n
        x, yv = x0 + (x1 - x0) * t, yc - amp * music(t)
        pts.append((x, yv))
        f.add(f'<line x1="{x:.1f}" y1="{yc}" x2="{x:.1f}" y2="{yv:.1f}" stroke="{RED}" stroke-width="1.6" opacity=".7"/>')
        f.add(f'<circle cx="{x:.1f}" cy="{yv:.1f}" r="4.5" fill="{RED}"/>')
    if bracket:
        xa, xb = pts[1][0], pts[2][0]
        yb = yc + amp + 14
        f.add(f'<path d="M{xa:.1f},{yb-6} v6 h{xb-xa:.1f} v-6" fill="none" stroke="{MUTED}" stroke-width="1.5"/>')
        f.text(xb + 12, yb + 4, "tid mellom to målinger", "s")


def sampling():
    f = Fig("mp-sampling", 960, 420, "Sampling: det analoge signalet måles med jevne mellomrom")
    _sample_row(f, 120, 14, "Færre målinger per sekund", bracket=True)
    _sample_row(f, 310, 42, "Flere målinger per sekund")
    f.add(f'<line x1="70" y1="402" x2="96" y2="402" stroke="{GREY}" stroke-width="1.6"/>')
    f.text(104, 407, "analogt signal", "s")
    f.add(f'<circle cx="250" cy="402" r="4.5" fill="{RED}"/>')
    f.text(262, 407, "måling (sample)", "s")
    f.text(910, 407, "tid →", "s e")
    return f


def _quant_row(f, yc, bits, label, x0=70, x1=910, amp=62):
    levels = 2 ** bits
    f.text(x0, yc - amp - 20, label, "s")
    step = 2 * amp / (levels - 1)
    op = ".55" if levels <= 8 else ".22"
    for i in range(levels):
        yl = yc - amp + i * step
        f.add(f'<line x1="{x0}" y1="{yl:.1f}" x2="{x1}" y2="{yl:.1f}" stroke="{BORDER}" stroke-width="1" opacity="{op}"/>')
    curve = [(x0 + (x1 - x0) * i / 400, yc - amp * music(i / 400) / 0.95) for i in range(401)]
    f.poly(curve, GREY, 1.6, extra='opacity=".75"')
    n = 60
    pts = []
    for k in range(n):
        t = k / n
        v = max(-1, min(1, music(t) / 0.95))
        q = round((v + 1) / 2 * (levels - 1)) / (levels - 1) * 2 - 1
        xa, xb = x0 + (x1 - x0) * k / n, x0 + (x1 - x0) * (k + 1) / n
        yq = yc - amp * q
        pts += [(xa, yq), (xb, yq)]
    f.poly(pts, RED, 2.5)


def bitdybde():
    f = Fig("mp-bitdybde", 960, 420, "Bitdybde: få og mange mulige verdier for hver måling")
    _quant_row(f, 120, 3, "3 bit – 8 mulige verdier")
    _quant_row(f, 310, 5, "5 bit – 32 mulige verdier")
    f.add(f'<line x1="70" y1="402" x2="96" y2="402" stroke="{GREY}" stroke-width="1.6"/>')
    f.text(104, 407, "analogt signal", "s")
    f.add(f'<line x1="250" y1="402" x2="276" y2="402" stroke="{RED}" stroke-width="2.5"/>')
    f.text(284, 407, "lagret verdi", "s")
    f.text(910, 407, "tid →", "s e")
    return f


def reisen():
    f = Fig("mp-reisen", 1000, 340, "Signalveien fra stemme til øre, og hvilken form signalet har underveis")
    xs = [60 + i * 125 for i in range(8)]
    y = 130
    f.voice(xs[0], y)
    f.mic(xs[1], y)
    # forforsterker: forsterkersymbol
    f.add(f'<g class="ic"><rect x="{xs[2]-30}" y="{y-24}" width="60" height="48" rx="6"/>'
          f'<path d="M{xs[2]-12},{y-13} L{xs[2]+14},{y} L{xs[2]-12},{y+13} z"/></g>')
    f.add(f'<rect x="{xs[3]-30}" y="{y-24}" width="60" height="48" rx="6" class="ic"/>')
    f.text(xs[3], y + 6, "A/D", "c h")
    f.computer(xs[4], y)
    f.add(f'<rect x="{xs[5]-30}" y="{y-24}" width="60" height="48" rx="6" class="ic"/>')
    f.text(xs[5], y + 6, "D/A", "c h")
    f.speaker(xs[6], y)
    f.ear(xs[7], y)
    names = ["Stemme", "Mikrofon", "Forforsterker", "A/D-omformer", "DAW", "D/A-omformer", "Høyttaler", "Øre"]
    for x, n in zip(xs, names):
        f.text(x, y + 62, n, "c s")
    for a, b in zip(xs, xs[1:]):
        f.arrow(a + 38, y, b - 38, y)
    # lydkort-klammer
    for a, b in ((xs[2] - 40, xs[3] + 40), (xs[5] - 40, xs[5] + 40)):
        f.add(f'<path d="M{a},62 v-10 h{b-a} v10" fill="none" stroke="{MUTED}" stroke-width="1.5"/>')
        f.text((a + b) / 2, 40, "lydkort", "c s")
    # formbånd
    yb = 252
    segs = [(xs[0], xs[1], "air", "lydbølger"), (xs[1], xs[3], "an", "analogt signal"),
            (xs[3], xs[5], "dig", "digitale tall"), (xs[5], xs[6], "an", "analogt signal"),
            (xs[6], xs[7], "air", "lydbølger")]
    for a, b, kind, lab in segs:
        a2, b2 = a + 6, b - 6
        f.add(f'<rect x="{a2}" y="{yb-22}" width="{b2-a2}" height="44" rx="8" fill="{PANEL}" stroke="{BORDER}"/>')
        if kind == "air":
            for k in range(3):
                cx = a2 + 30 + k * 18
                f.add(f'<path d="M{cx},{yb-12} a14,14 0 0 1 0,24" stroke="{GREY}" stroke-width="2" fill="none"/>')
        elif kind == "an":
            f.poly(wave(a2 + 14, b2 - 14, yb, 12, (b2 - a2) / 60, 120), RED, 2.2)
        else:
            n = 14
            for k in range(n + 1):
                xx = a2 + 14 + (b2 - a2 - 28) * k / n
                yy = yb - 12 * math.sin(2 * math.pi * 3 * k / n)
                f.add(f'<circle cx="{xx:.1f}" cy="{yy:.1f}" r="3.5" fill="{RED}"/>')
        f.text((a + b) / 2, yb + 46, lab, "c s")
    return f


def niva():
    f = Fig("mp-niva", 960, 420, "Nivåmåler i dBFS og en bølgeform med og uten clipping")
    top, bot = 70, 380

    def yd(db):
        return top + (-db) / 60 * (bot - top)

    mx = 110
    f.add(f'<rect x="{mx}" y="34" width="34" height="{top-34}" rx="4" fill="{RED}" opacity=".85"/>')
    f.add(f'<rect x="{mx}" y="{top}" width="34" height="{bot-top}" fill="{PANEL}" stroke="{BORDER}"/>')
    f.add(f'<rect x="{mx+8}" y="{yd(-9):.1f}" width="18" height="{bot-yd(-9):.1f}" fill="{GREY}" opacity=".85"/>')
    f.add(f'<rect x="{mx}" y="{yd(-6):.1f}" width="34" height="{yd(-12)-yd(-6):.1f}" fill="{RED}" fill-opacity=".3" stroke="{RED}" stroke-width="2"/>')
    for db in (0, -6, -12, -18, -24, -36, -48, -60):
        yy = yd(db)
        f.add(f'<line x1="{mx-8}" y1="{yy:.1f}" x2="{mx}" y2="{yy:.1f}" stroke="{MUTED}"/>')
        f.text(mx - 14, yy + 5, ("0" if db == 0 else f"−{-db}"), "s e")
    f.text(mx + 17, 24, "dBFS", "c s")
    f.text(mx + 50, 56, "over 0 dBFS: clipping", "s")
    f.add(f'<path d="M{mx+42},{yd(-6):.1f} h8 v{yd(-12)-yd(-6):.1f} h-8" fill="none" stroke="{MUTED}" stroke-width="1.5"/>')
    f.text(mx + 58, yd(-9) - 4, "praktisk toppnivå", "s")
    f.text(mx + 58, yd(-9) + 14, "ved opptak", "s")
    # bølgeformer
    x0, x1 = 420, 920
    for yc, title, gain in ((120, "God margin", 0.5), (305, "For høyt nivå – toppene klippes", 1.7)):
        amp = 70
        f.text(x0, yc - amp - 18, title, "s")
        for s in (-1, 1):
            f.add(f'<line x1="{x0}" y1="{yc - s*amp}" x2="{x1}" y2="{yc - s*amp}" stroke="{MUTED}" stroke-width="1.2" stroke-dasharray="5 5"/>')
        f.text(x1, yc - amp - 4, "0 dBFS", "s e")
        pts, clip = [], []
        for i in range(501):
            t = i / 500
            v = gain * music(t * 1.6) * (0.75 + 0.25 * math.sin(2 * math.pi * 0.5 * t))
            c = max(-1, min(1, v))
            pts.append((x0 + (x1 - x0) * t, yc - amp * c))
            if abs(v) > 1:
                clip.append(i)
        f.poly(pts, GREY if gain < 1 else RED, 2.2)
        # marker klippede områder
        run = []
        for i in clip + [None]:
            if i is not None and (not run or i == run[-1] + 1):
                run.append(i)
                continue
            if run:
                xa = x0 + (x1 - x0) * run[0] / 500
                xb = x0 + (x1 - x0) * run[-1] / 500
                v = music(run[0] / 500 * 1.6)
                yy = yc - amp * (1 if v > 0 else -1)
                f.add(f'<line x1="{xa:.1f}" y1="{yy}" x2="{xb:.1f}" y2="{yy}" stroke="{RED}" stroke-width="6" stroke-linecap="round"/>')
            run = [i] if i is not None else []
    return f


FIGS = [
    dict(art="294", title="Hva skjer egentlig i et musikkstudio?", fn=lydkort, where="Lydkortet – forbindelsen mellom studioet og datamaskinen",
         cap="Lydkortet tar imot signalet fra mikrofon eller instrument, forsterker det og gjør det digitalt. På vei ut gjøres det analogt igjen og sendes til høyttalere eller hodetelefoner."),
    dict(art="294", title="Hva skjer egentlig i et musikkstudio?", fn=studio, where="Signalveien – nøkkelen til å forstå studioet",
         cap="Et enkelt opptak: lyden går inn gjennom lydkortet, behandles i DAW-en og går ut gjennom det samme lydkortet. Et MIDI-keyboard kobles gjerne rett til datamaskinen."),
    dict(art="295", title="Fra lydkilde til høyttaler", fn=frekvens_amplitude, where="Hva er egentlig lyd?",
         cap="Frekvensen er antall svingninger per sekund og henger sammen med tonehøyden. Amplituden er størrelsen på svingningene og henger sammen med hvor kraftig lyden er."),
    dict(art="295", title="Fra lydkilde til høyttaler", fn=sampling, where="Samplingsfrekvens – hvor ofte måler vi?",
         cap="Omformeren måler signalet med jevne mellomrom. Samplingsfrekvensen er antall målinger per sekund: ved 44,1 kHz måles signalet 44 100 ganger i sekundet."),
    dict(art="295", title="Fra lydkilde til høyttaler", fn=bitdybde, where="Bitdybde – hvor nøyaktig måler vi?",
         cap="Bitdybden avgjør hvor mange verdier hver måling kan få. Figuren bruker 3 og 5 bit for å gjøre trinnene synlige. 16 bit gir 65 536 verdier, 24 bit over 16 millioner."),
    dict(art="295", title="Fra lydkilde til høyttaler", fn=reisen, where="Fra digitale data tilbake til lyd (ved «Hele reisen kan dermed beskrives slik»)",
         cap="Hele reisen fra stemme til øre. Underveis skifter signalet form: lydbølger i luften, analogt elektrisk signal, digitale tall – og tilbake igjen."),
    dict(art="295", title="Fra lydkilde til høyttaler", fn=niva, where="Signalnivå – når blir lyden for kraftig?",
         cap="0 dBFS er det høyeste nivået en vanlig digital lydfil kan lagre. Går signalet over, klippes toppene og lyden kan forvrenges. Ved opptak er det lurt å ha god margin."),
]
