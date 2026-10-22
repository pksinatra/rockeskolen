from pathlib import Path
import json
root = Path(__file__).resolve().parents[2]
shared = root / 'tools/updated/shared'
data = json.loads((shared / 'translations.json').read_text())
template = Path(__file__).with_name('language-runtime.js').read_text()
(shared / 'language.js').write_text(template.replace('/* DICTIONARY */', json.dumps(data, ensure_ascii=False)))
