"""Bygger figurene til artikkelserien Musikkproduksjon – lyd, MIDI og signalvei.

    python3 build.py

SVG-filene skrives til images/musikkproduksjon/ i repo-roten. figurer.json og
index.html (gjennomsynsside) skrives til denne mappen.
"""
import importlib, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "images", "musikkproduksjon"))
URL = "https://rockeskolen.com/images/musikkproduksjon/"

figs = []
for mod in ("figs_a", "figs_b", "figs_c"):
    figs += importlib.import_module(mod).FIGS

meta, sections, last = [], [], None
for i, d in enumerate(figs, 1):
    fig = d["fn"]()
    open(os.path.join(OUT, fig.p + ".svg"), "w").write(fig.render())
    meta.append(dict(nr=i, node=int(d["art"]), file=fig.p + ".svg", url=URL + fig.p + ".svg",
                     width=fig.w, height=fig.h, alt=fig.title, caption=d["cap"], where=d["where"]))
    if d["art"] != last:
        sections.append(f'<h2>{d["title"]} <span>node/{d["art"]}</span></h2>')
        last = d["art"]
    sections.append(
        f'<figure><div class="num">{i}</div><img src="../../images/musikkproduksjon/{fig.p}.svg" alt="{fig.title}">'
        f'<figcaption>{d["cap"]}</figcaption>'
        f'<p class="meta"><b>Plassering:</b> {d["where"]} · <b>Fil:</b> {fig.p}.svg</p></figure>')

json.dump(meta, open(os.path.join(HERE, "figurer.json"), "w"), ensure_ascii=False, indent=2)

html = f"""<!doctype html><html lang="no"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Musikkproduksjon – figurer</title>
<style>
body{{margin:0;background:#0d0f16;color:#ebebeb;font-family:Inter,'Open Sans',sans-serif;line-height:1.5}}
main{{max-width:1000px;margin:0 auto;padding:32px 16px 80px}}
h2{{margin-top:56px;border-top:1px solid #46484b;padding-top:24px;font-weight:600}}
h2 span{{font-size:14px;color:#a6a9b6;font-weight:400;margin-left:8px}}
figure{{margin:28px 0 40px;position:relative}} figure img{{width:100%;height:auto;display:block}}
.num{{position:absolute;left:-6px;top:-10px;background:#ff2b2b;color:#fff;border-radius:12px;font-size:13px;padding:1px 8px;font-weight:600}}
figcaption{{margin-top:10px}} .meta{{font-size:13px;color:#a6a9b6;margin:6px 0 0}}
</style></head><body><main>
<h1>Musikkproduksjon – figurer</h1>
{''.join(sections)}
</main></body></html>"""
open(os.path.join(HERE, "index.html"), "w").write(html)
print(len(figs), "figurer →", OUT)
