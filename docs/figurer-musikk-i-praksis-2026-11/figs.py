"""Figurer til Musikk i praksis – Utgivelse, Rettigheter og Markedsføring (node 235–243).

Bruker lib.py fra docs/figurer-musikkproduksjon-2026-10 (samme farger, font og primitiver).
    python3 figs.py   → skriver SVG-ene til images/musikk-i-praksis/ og figurer.json hit.
"""
import json, os, sys

REPO = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
sys.path.insert(0, os.path.join(REPO, "docs", "figurer-musikkproduksjon-2026-10"))
from lib import *  # noqa

OUT = os.path.join(REPO, "images", "musikk-i-praksis")
URL = "https://rockeskolen.com/images/musikk-i-praksis/"


def lines(f, x, y, items, cls="s", gap=20):
    for i, s in enumerate(items):
        f.text(x, y + i * gap, s, cls)


def dot(f, x, y, col):
    f.add(f'<circle cx="{x}" cy="{y}" r="6" fill="{col}"/>')


# ---------- 237: Hvordan gir du ut din egen musikk? ----------
def distributor():
    f = Fig("mip-distributor", 960, 360, "Distributøren som mellomledd: du leverer musikken, distributøren leverer til tjenestene, og inntektene for innspillingen går tilbake")
    f.add(f'<rect x="40" y="70" width="230" height="170" rx="12" class="box"/>')
    f.text(155, 104, "Du leverer", "c h")
    lines(f, 155, 136, ["lydfilene", "plateomslaget", "informasjon om", "utgivelsen"], "c s")
    f.box(375, 105, 210, 100, ["Distributør"], "mellomledd")
    f.box(690, 60, 230, 76, ["Strømmetjenester"], "som du har valgt")
    f.box(690, 172, 230, 76, ["Nettbutikker"], "som du har valgt")
    f.arrow(272, 155, 372, 155)
    f.path_arrow("M587,140 C630,140 640,98 687,98")
    f.path_arrow("M587,170 C630,170 640,210 687,210")
    # inntekter tilbake
    f.path_arrow("M805,250 C805,300 560,300 520,210", "mi")
    f.path_arrow("M440,210 C400,300 200,300 155,244", "mi")
    f.text(480, 322, "Inntektene for innspillingen går tilbake via distributøren, etter vilkårene i avtalen", "c s")
    f.text(40, 40, "Hva er en digital distributør?", "h")
    return f


# ---------- 235: Hvilken musikkdistributør bør du velge? ----------
def slutter():
    f = Fig("mip-slutter-betale", 960, 350, "Hva skjer når du slutter å betale: DistroKid og TuneCore kan fjerne musikken, CD Baby har ingen løpende abonnementsavgift, Amuse lar den ligge mot høyere provisjon")
    f.text(40, 44, "Hva skjer når du slutter å betale?", "h")
    cards = [
        ("DistroKid", ["Fast årsavgift,", "ubegrenset antall", "utgivelser"], RED, ["Musikken kan", "fjernes uten betalt", "abonnement"]),
        ("TuneCore", ["Årsabonnement eller", "betaling per utgivelse"], RED, ["Musikken kan", "fjernes uten betalt", "abonnement"]),
        ("CD Baby", ["Betal én gang", "per utgivelse, og en", "andel av inntektene"], GREY, ["Ingen løpende", "abonnements-", "avgift"]),
        ("Amuse", ["Årsabonnement"], GREY, ["Blir normalt", "liggende, mot høyere", "provisjon etter", "oppsigelse"]),
    ]
    for i, (name, model, col, after) in enumerate(cards):
        x = 40 + i * 225
        f.add(f'<rect x="{x}" y="70" width="205" height="250" rx="12" class="box"/>')
        f.text(x + 20, 104, name, "h")
        lines(f, x + 20, 132, model)
        f.add(f'<line x1="{x+20}" y1="205" x2="{x+185}" y2="205" class="ln"/>')
        dot(f, x + 26, 228, col)
        lines(f, x + 40, 233, after, "")
    return f


# ---------- 236: TONO, Gramo, ISRC og UPC ----------
def rettigheter():
    f = Fig("mip-rettigheter", 960, 420, "Én låt, tre lag: musikkverket (TONO, ISWC), lydinnspillingen (Gramo, ISRC) og utgivelsen (UPC/EAN)")
    cols = [
        ("Musikkverket", "melodi · musikalsk innhold · tekst", RED,
         [("Rettigheter", ["Opphavere: de som har", "skrevet musikk og tekst"]), ("Forvaltes av", ["TONO"]), ("Kode", ["ISWC for verket,", "IPI for personene"])]),
        ("Lydinnspillingen", "den innspilte framføringen", RED,
         [("Rettigheter", ["Utøvere og produsent", "av lydopptaket"]), ("Forvaltes av", ["Gramo"]), ("Kode", ["ISRC"])]),
        ("Utgivelsen", "singel · EP · album", GREY,
         [("Hva", ["Produktet som leveres", "til tjenestene"]), ("Hvem", ["Distributøren kan skaffe", "koden"]), ("Kode", ["UPC/EAN"])]),
    ]
    for i, (title, sub, col, rows) in enumerate(cols):
        x = 40 + i * 300
        f.add(f'<rect x="{x}" y="30" width="280" height="360" rx="12" class="box"/>')
        f.add(f'<rect x="{x}" y="30" width="280" height="6" rx="3" fill="{col}"/>')
        f.text(x + 20, 70, title, "h")
        f.text(x + 20, 94, sub, "s")
        y = 136
        for lab, val in rows:
            f.text(x + 20, y, lab.upper(), "s", letter_spacing="1")
            lines(f, x + 20, y + 24, val, "")
            y += 24 + 20 * len(val) + 28
    return f


def nordlys_koder():
    f = Fig("mip-nordlys-koder", 960, 330, "Ett musikkverk, én innspilling og to utgivelser: singelen og albumet får hver sin UPC/EAN, mens innspillingen beholder sin ISRC")
    f.box(40, 120, 220, 90, ["Musikkverket"], "«Nordlys» · TONO")
    f.box(330, 120, 220, 90, ["Innspillingen"], "én ISRC")
    f.box(640, 40, 280, 90, ["Singelen"], "egen UPC/EAN")
    f.box(640, 200, 280, 90, ["Albumet"], "egen UPC/EAN")
    f.arrow(262, 165, 327, 165)
    f.path_arrow("M552,150 C600,150 600,85 637,85")
    f.path_arrow("M552,180 C600,180 600,245 637,245")
    f.text(780, 314, "+ ni nye låter med egne ISRC-koder", "c s")
    f.text(445, 250, "samme innspilling,", "c s")
    f.text(445, 270, "samme ISRC", "c s")
    return f


# ---------- 238: Lydfiler, cover, metadata og artistinformasjon ----------
def mappe():
    f = Fig("mip-mappe", 960, 430, "Utgivelsesmappen for «Nordlys»: master, omslag, metadata og rettigheter, med prosjektfilene lagret separat")
    # mappeikon
    f.add(f'<path d="M60,70 h70 l16,18 h104 a8,8 0 0 1 8,8 v120 a8,8 0 0 1 -8,8 h-182 a8,8 0 0 1 -8,-8 v-138 a8,8 0 0 1 8,-8 z" class="ic"/>')
    f.text(150, 262, "Utgivelsesmappe", "c h")
    f.text(150, 286, "«Nordlys»", "c s")
    rows = [
        ("Nordlys_MASTER.wav", "den godkjente masterfilen, eller FLAC"),
        ("Nordlys_COVER.jpg", "omslaget i riktig størrelse og fargerom"),
        ("Nordlys_METADATA.txt", "tittel, artistnavn, krediteringer, datoer, ISRC"),
        ("Nordlys_RETTIGHETER.pdf", "avtaler, samtykker og dokumentasjon"),
    ]
    for i, (name, desc) in enumerate(rows):
        y = 50 + i * 70
        f.add(f'<rect x="320" y="{y}" width="600" height="56" rx="10" class="box"/>')
        f.add(f'<rect x="320" y="{y}" width="6" height="56" rx="3" fill="{RED}"/>')
        f.text(344, y + 24, name, "h")
        f.text(344, y + 45, desc, "s")
    y = 50 + 4 * 70 + 14
    f.add(f'<line x1="320" y1="{y-8}" x2="920" y2="{y-8}" class="ln" stroke-dasharray="5 5"/>')
    f.add(f'<rect x="320" y="{y+4}" width="600" height="56" rx="10" fill="none" stroke="{BORDER}" stroke-width="1.5" stroke-dasharray="5 5"/>')
    f.text(344, y + 28, "Nordlys_PROSJEKT/", "h")
    f.text(344, y + 49, "prosjektfiler – lagres separat, lastes ikke opp", "s")
    return f


# ---------- 239: Spotify for Artists, Apple Music for Artists og YouTube ----------
def identitet():
    f = Fig("mip-artistidentitet", 960, 380, "Tre tjenester, én artistidentitet: Spotify for Artists, Apple Music for Artists og YouTube med samme navn og gjenkjennelig uttrykk")
    f.add(f'<circle cx="480" cy="170" r="110" fill="{RED_FILL}" stroke="{RED}" stroke-width="2"/>')
    f.text(480, 160, "Én artistidentitet", "c h")
    f.text(480, 186, "samme navn ·", "c s")
    f.text(480, 206, "gjenkjennelig uttrykk", "c s")
    f.box(40, 120, 250, 100, ["Spotify for Artists"], "profil · pitching · Canvas")
    f.box(670, 120, 250, 100, ["Apple Music for Artists"], "profil · avspillinger · Shazam")
    f.box(355, 300, 250, 64, ["YouTube"], "Official Artist Channel")
    f.add(f'<line x1="290" y1="170" x2="370" y2="170" class="ln"/>')
    f.add(f'<line x1="590" y1="170" x2="670" y2="170" class="ln"/>')
    f.add(f'<line x1="480" y1="280" x2="480" y2="300" class="ln"/>')
    return f


# ---------- 240: Hvordan får du folk til å oppdage musikken din? ----------
def lansering():
    f = Fig("mip-lansering", 960, 330, "Lanseringsplan for «Nordlys» fra 4–6 uker før til 3–4 uker etter utgivelsen")
    steps = [
        ("4–6 uker før", ["målgruppe og historie", "dato og budsjett", "bilder og presse"]),
        ("3–4 uker før", ["lever til distributør", "artistprofiler", "kontakt redaksjoner"]),
        ("Minst 7 dager før", ["Spotify-pitch", "del en smakebit"]),
        ("Utgivelsesdagen", ["sjekk lenkene", "tydelig innlegg", "kort oppfølging"]),
        ("Uke 1–2 etter", ["nytt klipp", "følg opp omtaler", "svar på reaksjoner"]),
        ("Uke 3–4 etter", ["se på resultatene", "hva fungerte?"]),
    ]
    y = 110
    f.add(f'<line x1="60" y1="{y}" x2="900" y2="{y}" stroke="{BORDER}" stroke-width="3"/>')
    for i, (when, what) in enumerate(steps):
        x = 105 + i * 150
        day = when == "Utgivelsesdagen"
        f.add(f'<circle cx="{x}" cy="{y}" r="{11 if day else 8}" fill="{RED if day else BG}" stroke="{RED if day else GREY}" stroke-width="3"/>')
        f.text(x, y - 32, when, "c h" if day else "c")
        lines(f, x, y + 46, what, "c s")
    f.text(480, 300, "Tidene er planleggingsforslag, ikke garantier.", "c s")
    return f


# ---------- 241: Hvem betaler deg når musikken blir spilt? ----------
def pengestrommer():
    f = Fig("mip-pengestrommer", 960, 380, "To pengestrømmer fra en strømmeavspilling: innspillingen via distributøren, musikkverket via TONO")
    f.headphones(90, 160)
    f.text(90, 222, "Avspilling på", "c")
    f.text(90, 242, "en strømmetjeneste", "c")
    f.box(230, 50, 210, 76, ["Innspillingen"], "masteren")
    f.box(230, 214, 210, 76, ["Musikkverket"], "komposisjon og tekst")
    f.box(500, 50, 190, 76, ["Distributør"], "eller plateselskap")
    f.box(500, 214, 190, 76, ["TONO"], "rettighetsforvaltning")
    f.box(740, 50, 180, 76, ["Eieren av"], "innspillingen")
    f.add(f'<rect x="740" y="196" width="180" height="112" rx="10" class="box"/>')
    f.text(830, 224, "Låtskrivere", "c h")
    lines(f, 830, 248, ["komponister", "tekstforfattere", "musikkforlag"], "c s")
    f.path_arrow("M140,150 C180,150 190,88 227,88")
    f.path_arrow("M140,175 C180,175 190,252 227,252")
    f.arrow(442, 88, 497, 88); f.arrow(692, 88, 737, 88)
    f.arrow(442, 252, 497, 252); f.arrow(692, 252, 737, 252)
    f.text(480, 350, "Gramo betaler ikke for vanlige avspillinger på Spotify, Apple Music og Tidal.", "c s")
    return f


def radio():
    f = Fig("mip-radio", 960, 340, "Når en innspilling spilles på radio: TONO-vederlag til opphaverne og Gramo-vederlag, fordelt 50/50 mellom utøvere og produsenter")
    # radioikon
    f.add(f'<g class="ic"><rect x="52" y="140" width="76" height="50" rx="8"/><circle cx="74" cy="165" r="12"/><line x1="96" y1="156" x2="118" y2="156"/><line x1="96" y1="172" x2="118" y2="172"/><line x1="66" y1="140" x2="104" y2="110"/></g>')
    f.text(90, 224, "Avspilling", "c")
    f.text(90, 244, "på radio", "c")
    f.box(230, 50, 200, 76, ["TONO"], "for musikkverket")
    f.box(230, 214, 200, 76, ["Gramo"], "for innspillingen")
    f.box(500, 50, 420, 76, ["Opphaverne"], "de som har skrevet musikk og tekst")
    f.box(500, 184, 200, 76, ["Utøvere"], "50 prosent")
    f.box(720, 184, 200, 76, ["Produsenter"], "50 prosent")
    f.path_arrow("M140,155 C180,155 190,88 227,88")
    f.path_arrow("M140,175 C180,175 190,252 227,252")
    f.arrow(432, 88, 497, 88)
    f.path_arrow("M432,240 C470,240 470,222 497,222")
    f.path_arrow("M432,262 C560,300 760,300 816,262")
    f.text(710, 316, "i utgangspunktet, før den individuelle fordelingen", "c s")
    return f


# ---------- 242: Hvem lager egentlig musikken? ----------
def ki():
    f = Fig("mip-ki", 960, 300, "Fra KI som verktøy til bestilt musikk, med en gråsone imellom")
    f.add(f'<defs><linearGradient id="mip-ki-g" x1="0" x2="1"><stop offset="0" stop-color="{RED}"/><stop offset="1" stop-color="{DIM}"/></linearGradient></defs>')
    f.add(f'<rect x="60" y="120" width="840" height="18" rx="9" fill="url(#mip-ki-g)"/>')
    f.path_arrow("M860,92 L100,92", "ln")
    f.text(480, 80, "mer eget musikalsk bidrag", "c s")
    cols = [
        (60, "KI som verktøy", ["Du har en egen melodi,", "harmoni eller rytme.", "KI arrangerer eller bearbeider."], ""),
        (360, "Gråsone", ["Detaljerte instrukser, valg", "mellom versjoner, redigering", "og egne innspilte deler"], "c"),
        (900, "Bestilt musikk", ["Bare en tekstinstruks.", "Modellen leverer", "en ferdig låt."], "e"),
    ]
    for x, title, desc, align in cols:
        xx = 480 if align == "c" else x
        f.text(xx, 180, title, (align + " h").strip())
        lines(f, xx, 208, desc, (align + " s").strip())
    return f


# ---------- 243: Slik gir du ut din første singel ----------
def singel():
    f = Fig("mip-singel", 960, 380, "Utgivelsen i tre faser: gjør låten klar, send inn og forbered lanseringen, og musikken er ute")
    phases = [
        ("Fase 1", "Gjør låten klar", [(1, ["Velg versjonen"]), (2, ["Avklar hvem som eier hva"]), (3, ["TONO og Gramo"]), (4, ["Velg distributør"]), (5, ["Lydfil, omslag og metadata"])]),
        ("Fase 2", "Send inn og forbered", [(6, ["Sett utgivelsesdato"]), (7, ["Last opp hos distributøren"]), (8, ["Artistprofilene"]), (9, ["Lanseringspakke"]), (10, ["Siste kontroll"])]),
        ("Fase 3", "Musikken er ute", [(11, ["Sjekk utgivelsen", "på slippdagen"]), (12, ["Følg opp etter én uke,", "én måned – og når", "pengene kommer"])]),
    ]
    for i, (ph, title, steps) in enumerate(phases):
        x = 40 + i * 300
        f.add(f'<rect x="{x}" y="30" width="280" height="320" rx="12" class="box"/>')
        f.text(x + 20, 62, ph.upper(), "s", letter_spacing="1")
        f.text(x + 20, 88, title, "h")
        y = 130
        for n, txt in steps:
            f.add(f'<circle cx="{x+34}" cy="{y-5}" r="13" fill="{RED_FILL}" stroke="{RED}" stroke-width="1.5"/>')
            f.text(x + 34, y, str(n), "c s")
            lines(f, x + 58, y, txt, "")
            y += 42 + 20 * (len(txt) - 1)
        if i < 2:
            f.arrow(x + 282, 190, x + 298, 190)
    return f


# node, figur, plassering (før denne overskriften), bildetekst
FIGS = [
    (237, distributor, "Hva trenger du før du kan gi ut musikken?", "Du leverer musikken til distributøren, som leverer den videre til tjenestene du har valgt. Inntektene for innspillingen går samme vei tilbake."),
    (235, slutter, "Eier du fortsatt musikken din?", "Betalingsmodellen avgjør hva som skjer med musikken hvis du slutter å betale."),
    (236, rettigheter, "TONO – for deg som skriver musikken", "Én låt har flere lag: musikkverket, lydinnspillingen og selve utgivelsen. Hvert lag har sine rettigheter og sin kode."),
    (236, nordlys_koder, "Husk å avklare rettighetene før utgivelsen", "Ett musikkverk, én innspilling og to utgivelser. Singelen og albumet får hver sin produktkode, mens innspillingen beholder sin ISRC."),
    (238, mappe, "9. Gjør en siste kontroll før du sender", "En tydelig utgivelsesmappe: det som skal lastes opp, og dokumentasjonen du skal ta vare på."),
    (239, identitet, "Skriv en biografi folk orker å lese", "Tre tjenester med ulike verktøy, men publikum skal kjenne igjen den samme artisten."),
    (240, lansering, "Ikke bruk opp hele historien på slippdagen", "En gjennomførbar lanseringsplan for «Nordlys», før og etter slippdagen."),
    (241, pengestrommer, "Hva skjer med pengene fra Spotify?", "En strømmeavspilling kan gi to inntekter: én for innspillingen og én for musikkverket. De kommer ikke gjennom samme utbetaling."),
    (241, radio, "Hva om du spiller «Nordlys» på konsert?", "På radio kan både musikkverket og innspillingen gi vederlag – gjennom TONO og Gramo."),
    (242, ki, "En saksofon uten saksofonist", "Å bruke KI som verktøy er ikke det samme som å bestille en ferdig låt. Grensen er ikke alltid knivskarp."),
    (243, singel, "Fase 1: Gjør låten klar", "Tolv steg i tre faser – fra ferdig låt til oppfølging etter utgivelsen."),
]

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    meta = []
    for node, fn, where, cap in FIGS:
        fig = fn()
        open(os.path.join(OUT, fig.p + ".svg"), "w").write(fig.render())
        meta.append(dict(node=node, file=fig.p + ".svg", url=URL + fig.p + ".svg", width=fig.w, height=fig.h, alt=fig.title, caption=cap, where=where))
    json.dump(meta, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "figurer.json"), "w"), ensure_ascii=False, indent=2)
    print(len(meta), "figurer →", OUT)
