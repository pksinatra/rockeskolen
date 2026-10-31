import math
from lib import *


# ---------- 298: Introduksjon til miksing ----------

def kjede():
    f = Fig("mp-kjede", 960, 310, "Forenklet signalvei gjennom en mikserkanal: lydspor, EQ, kompressor, fader, master og lydkort")
    names = ["Lydspor", "EQ", "Kompressor", "Fader", "Master", "Lydkort"]
    levels = [0.55, 0.72, 0.62, 0.5, 0.58, 0.58]
    bw, gap, y, h = 125, 30, 120, 66
    xs = [30 + i * (bw + gap) for i in range(6)]
    for i, (x, n) in enumerate(zip(xs, names)):
        f.box(x, y, bw, h, [n])
        if i < 5:
            f.arrow(x + bw + 2, y + h / 2, x + bw + gap - 3, y + h / 2)
        # nivå
        mh = 56
        f.add(f'<rect x="{x+bw/2-9}" y="{214}" width="18" height="{mh}" rx="3" fill="{PANEL}" stroke="{BORDER}"/>')
        f.add(f'<rect x="{x+bw/2-5}" y="{214+mh*(1-levels[i]):.1f}" width="10" height="{mh*levels[i]-4:.1f}" fill="{GREY}"/>')

    def bracket(a, b, yy, lab):
        f.add(f'<path d="M{a},{yy+10} v-10 h{b-a} v10" fill="none" stroke="{MUTED}" stroke-width="1.5"/>')
        f.text((a + b) / 2, yy - 8, lab, "c s")
    bracket(xs[1], xs[2] + bw, 100, "inserts")
    bracket(xs[0], xs[3] + bw, 48, "mikserkanal")
    bracket(xs[4], xs[4] + bw, 100, "masterkanal")
    f.text(30, 296, "Nivå etter hvert trinn – hvert ledd kan heve eller senke signalet", "s")
    return f


def stereo():
    f = Fig("mp-stereo", 960, 330, "Eksempel på plassering av instrumenter i stereobildet")
    ax0, ax1, cx, ya = 150, 810, 480, 250
    f.add(f'<line x1="{ax0}" y1="{ya}" x2="{ax1}" y2="{ya}" stroke="{MUTED}" stroke-width="2"/>')
    for x in (ax0, cx, ax1):
        f.add(f'<line x1="{x}" y1="{ya-8}" x2="{x}" y2="{ya+8}" stroke="{MUTED}" stroke-width="2"/>')
    f.text(cx, ya + 32, "midten", "c s")
    f.speaker(80, ya - 10); f.text(80, ya + 52, "Venstre kanal", "c s")
    f.speaker(880, ya - 10); f.text(880, ya + 52, "Høyre kanal", "c s")

    def pill(x, y, s, pan_x, line=True):
        w = len(s) * 9 + 30
        if line:
            f.add(f'<line x1="{pan_x}" y1="{y+15}" x2="{pan_x}" y2="{ya}" stroke="{RED}" stroke-width="1.5" opacity=".6"/>')
        f.add(f'<rect x="{x-w/2}" y="{y-15}" width="{w}" height="30" rx="15" fill="{PANEL}" stroke="{RED}"/>')
        f.text(x, y + 6, s, "c")
        f.add(f'<circle cx="{pan_x}" cy="{ya}" r="6" fill="{RED}"/>')

    def px(p):
        return cx + p * (ax1 - cx)
    for i, s in enumerate(["Bass", "Stortromme", "Skarptromme", "Vokal"]):
        pill(cx, 190 - i * 44, s, cx, line=(i == 0))
    pill(px(-0.7), 150, "Gitar 1", px(-0.7))
    pill(px(0.7), 150, "Gitar 2", px(0.7))
    pill(px(-0.38), 80, "Keyboard", px(-0.38))
    return f


def eq():
    f = Fig("mp-eq", 960, 310, "Fire vanlige EQ-filtre vist som frekvenskurver")
    lo, hi = math.log10(20), math.log10(20000)

    def hpf(fr):
        r = (fr / 120) ** 2
        return 20 * math.log10(r / math.sqrt(1 + r * r))

    def lpf(fr):
        r = (fr / 6000) ** 2
        return -10 * math.log10(1 + r * r)

    def shelf(fr):
        return 8 / (1 + (3500 / fr) ** 1.6)

    def bell(fr):
        return 9 * math.exp(-(math.log2(fr / 1000) ** 2) / (2 * 0.55 ** 2))
    panels = [("High-pass-filter", "demper under grensen", hpf),
              ("Low-pass-filter", "demper over grensen", lpf),
              ("Shelving-filter", "hever eller senker diskant/bass", shelf),
              ("Parametrisk EQ", "frekvens · nivå · bredde", bell)]
    for i, (title, sub, fn) in enumerate(panels):
        x = 20 + i * 235
        f.add(f'<rect x="{x}" y="20" width="220" height="270" rx="12" fill="{PANEL}" opacity=".55"/>')
        f.text(x + 14, 48, title, "h")
        f.text(x + 14, 70, sub, "s")
        px0, px1, yc, sc = x + 14, x + 206, 165, 70 / 15
        f.add(f'<line x1="{px0}" y1="{yc}" x2="{px1}" y2="{yc}" stroke="{MUTED}" stroke-width="1" stroke-dasharray="4 4"/>')
        f.text(px0, yc - 6, "0 dB", "s")
        for fr, lab in ((100, "100"), (1000, "1k"), (10000, "10k")):
            xx = px0 + (px1 - px0) * (math.log10(fr) - lo) / (hi - lo)
            f.add(f'<line x1="{xx:.1f}" y1="95" x2="{xx:.1f}" y2="240" stroke="{BORDER}" stroke-width="1" opacity=".6"/>')
            f.text(xx, 262, lab, "c s")
        f.add(f'<clipPath id="mp-eq-c{i}"><rect x="{px0}" y="92" width="{px1-px0}" height="150"/></clipPath><g clip-path="url(#mp-eq-c{i})">')
        pts = []
        for k in range(201):
            lf = lo + (hi - lo) * k / 200
            g = max(-40, min(40, fn(10 ** lf)))
            pts.append((px0 + (px1 - px0) * k / 200, yc - g * sc))
        area = [(px0, yc)] + pts + [(px1, yc)]
        f.poly(area, "none", 0, fill=RED, extra='fill-opacity=".18"')
        f.poly(pts, RED, 2.6)
        f.add('</g>')
        f.text(px1, 282, "Hz", "s e")
    return f


def kompressor():
    f = Fig("mp-kompressor", 960, 440, "Kompressorkurve med threshold på −18 dB og ratio 4:1")
    x0, x1, y0, y1 = 110, 450, 40, 380
    lo = -30

    def X(db):
        return x0 + (db - lo) / -lo * (x1 - x0)

    def Y(db):
        return y1 - (db - lo) / -lo * (y1 - y0)
    for db in range(-30, 1, 6):
        f.add(f'<line x1="{X(db):.1f}" y1="{y0}" x2="{X(db):.1f}" y2="{y1}" stroke="{BORDER}" opacity=".5"/>'
              f'<line x1="{x0}" y1="{Y(db):.1f}" x2="{x1}" y2="{Y(db):.1f}" stroke="{BORDER}" opacity=".5"/>')
        f.text(X(db), y1 + 22, str(db).replace("-", "−"), "c s")
        f.text(x0 - 10, Y(db) + 5, str(db).replace("-", "−"), "e s")
    f.text((x0 + x1) / 2, y1 + 50, "Inngangsnivå (dB)", "c s")
    f.text(30, (y0 + y1) / 2, "Utgangsnivå (dB)", "c s", transform=f"rotate(-90 30 {(y0+y1)/2})")
    th = -18
    f.add(f'<line x1="{X(th):.1f}" y1="{Y(th):.1f}" x2="{X(0):.1f}" y2="{Y(0):.1f}" stroke="{MUTED}" stroke-width="2" stroke-dasharray="6 5"/>')
    f.poly([(X(lo), Y(lo)), (X(th), Y(th)), (X(0), Y(th + (0 - th) / 4))], RED, 3.5)
    f.add(f'<circle cx="{X(th):.1f}" cy="{Y(th):.1f}" r="7" fill="{BG}" stroke="{TEXT}" stroke-width="2.5"/>')
    # eksempel: 4 dB over terskelen
    xi, yo = -14, th + 1
    f.add(f'<line x1="{X(xi):.1f}" y1="{y1}" x2="{X(xi):.1f}" y2="{Y(yo):.1f}" stroke="{TEXT}" stroke-width="1.5" stroke-dasharray="3 4"/>')
    f.add(f'<line x1="{X(th):.1f}" y1="{Y(th):.1f}" x2="{X(xi)+18:.1f}" y2="{Y(th):.1f}" stroke="{TEXT}" stroke-width="1.5" stroke-dasharray="3 4"/>')
    f.add(f'<circle cx="{X(xi):.1f}" cy="{Y(yo):.1f}" r="5" fill="{TEXT}"/>')
    # klammer for +4 inn og +1 ut
    f.add(f'<path d="M{X(th):.1f},{y1-14} v6 h{X(xi)-X(th):.1f} v-6" fill="none" stroke="{RED}" stroke-width="2"/>')
    f.text((X(th) + X(xi)) / 2, y1 - 22, "+4 dB", "c s")
    f.add(f'<path d="M{X(xi)+12:.1f},{Y(th):.1f} h6 v{Y(yo)-Y(th):.1f} h-6" fill="none" stroke="{RED}" stroke-width="2"/>')
    f.text(X(xi) + 26, Y(yo) + 12, "+1 dB", "s")
    # forklaring
    lx = 510
    rows = [("Threshold", "−18 dB i eksempelet. Under terskelen går signalet uendret gjennom."),
            ("Ratio 4:1", "Over terskelen blir 4 dB inn til 1 dB ut."),
            ("Stiplet linje", "Slik ville signalet gått uten kompresjon."),
            ("Makeup gain", "Ikke brukt her. Den løfter hele kurven etterpå.")]
    yy = 70
    for head, body in rows:
        f.text(lx, yy, head, "h")
        words, line, lines = body.split(), "", []
        for w in words:
            if len(line + " " + w) > 46:
                lines.append(line)
                line = w
            else:
                line = (line + " " + w).strip()
        lines.append(line)
        for k, ln in enumerate(lines):
            f.text(lx, yy + 24 + k * 20, ln, "s")
        yy += 40 + 20 * len(lines) + 14
    return f


def ruting():
    f = Fig("mp-ruting", 960, 470, "Ruting: inserts på sporene, send til en felles romklang og trommespor samlet i en buss")
    f.text(40, 30, "Spor", "s")
    f.text(420, 30, "Effektkanal og buss", "s")
    f.text(740, 30, "Master", "s")
    tracks = [("Vokal", ["EQ", "Komp."], 44), ("Gitar", ["EQ"], 104), ("Keyboard", [], 164)]
    cxl = 700
    for name, ins, y in tracks:
        f.add(f'<rect x="40" y="{y}" width="260" height="44" rx="8" class="box"/>')
        f.text(56, y + 28, name, "h")
        xx = 150
        for s in ins:
            xx += f.chip(xx, y + 11, s) + 6
        # hovedutgang
        f.add(f'<line x1="300" y1="{y+22}" x2="{cxl}" y2="{y+22}" class="au"/>')
    # send
    ex, ey, ew, eh = 420, 236, 240, 64
    for name, ins, y in tracks:
        f.add(f'<path d="M270,{y+44} C270,{y+80} 360,{ey+eh/2} {ex-4},{ey+eh/2}" stroke="{RED_SOFT}" stroke-width="1.8" fill="none" marker-end="url(#mp-ruting-ar)"/>')
    f.text(334, 228, "send", "s")
    f.box(ex, ey, ew, eh, ["Romklang"], "100 % effektlyd")
    f.add(f'<line x1="{ex+ew}" y1="{ey+eh/2}" x2="{cxl}" y2="{ey+eh/2}" class="au"/>')
    # trommer
    for i in range(8):
        y = 300 + i * 19
        f.add(f'<rect x="40" y="{y}" width="200" height="15" rx="4" fill="{PANEL}" stroke="{BORDER}"/>')
        f.text(48, y + 12, f"Trommer {i+1}", "s", style="font-size:11px")
        f.add(f'<path d="M240,{y+7} C320,{y+7} 340,{392} {ex-4},{392}" stroke="{RED}" stroke-width="1.4" fill="none" opacity=".75"/>')
    bx, by = ex, 366
    f.add(f'<rect x="{bx}" y="{by}" width="{ew}" height="52" rx="10" class="box"/>')
    f.text(bx + 14, by + 32, "Trommebuss", "h")
    xx = bx + 136
    for s in ("EQ", "Komp."):
        xx += f.chip(xx, by + 15, s) + 4
    f.add(f'<line x1="{bx+ew}" y1="{by+26}" x2="{cxl}" y2="{by+26}" class="au"/>')
    # samleskinne til master
    f.add(f'<line x1="{cxl}" y1="66" x2="{cxl}" y2="{by+26}" class="au"/>')
    f.box(740, 210, 150, 70, ["Master"])
    f.arrow(cxl, 245, 737, 245)
    f.arrow(890, 245, 942, 245)
    f.text(916, 272, "lydkort", "c s")
    return f


FIGS = [
    dict(art="298", title="Introduksjon til miksing", fn=kjede, where="Gain staging – kontroll på signalnivåene (ved eksempelet med pilrekken)",
         cap="En forenklet signalvei. Hvert trinn kan endre nivået, så vi følger med på det hele veien – ikke bare på masteren."),
    dict(art="298", title="Introduksjon til miksing", fn=stereo, where="Panorering – plassering i stereobildet",
         cap="Et eksempel på plassering i stereobildet: bass, stortromme, skarptromme og vokal i midten, gitarene på hver sin side. Dette er vanlige arbeidsmåter, ikke faste regler."),
    dict(art="298", title="Introduksjon til miksing", fn=eq, where="Equalizer – kontroll over frekvensene",
         cap="Fire vanlige EQ-filtre. Den vannrette linjen er 0 dB, altså ingen endring. Over linjen heves frekvensene, under linjen dempes de."),
    dict(art="298", title="Introduksjon til miksing", fn=kompressor, where="Kompresjon – kontroll over dynamikken (ved eksempelet med ratio 4:1)",
         cap="Under terskelen går signalet uendret gjennom. Over terskelen gir ratio 4:1 omtrent 1 dB økning ut for hver 4 dB inn. Kurven viser full virkning, uten attack og release."),
    dict(art="298", title="Introduksjon til miksing", fn=ruting, where="Insert og send / Grupper og busser",
         cap="Inserts ligger direkte i sporets signalvei. En send fører en andel av signalet til en felles effektkanal, her romklang. Åtte trommespor samles i én buss med felles EQ og kompresjon."),
]
