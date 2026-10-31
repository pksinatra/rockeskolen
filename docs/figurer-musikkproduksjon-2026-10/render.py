import glob, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
# Bruk: python3 render.py <mappe for PNG> [figurnavn ...]  – til visuell kontroll, PNG-ene hører ikke hjemme i repoet.
PNG = os.path.abspath(sys.argv[1])
os.makedirs(PNG, exist_ok=True)
only = sys.argv[2:]
for svg in sorted(glob.glob(os.path.join(HERE, "..", "..", "images", "musikkproduksjon", "*.svg"))):
    name = os.path.basename(svg)[:-4]
    if only and name not in only:
        continue
    w, h = map(float, re.search(r'viewBox="0 0 (\S+) (\S+)"', open(svg).read()).groups())
    W = 1000
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={PNG}/.chrome-prof",
                    f"--window-size={W},{round(h * W / w)}", "--default-background-color=00000000",
                    f"--screenshot={os.path.join(PNG, name + '.png')}", "file://" + os.path.abspath(svg)],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=40)
    print(name)
