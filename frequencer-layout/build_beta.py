from pathlib import Path
import re
r=Path(__file__).parent
source=(r/'preview/index.html').read_text()
original_access="fetch('/wp-json/fe/v1/subscriber')\n      .then((res) => res.json())"
beta_access="Promise.resolve({ subscriber: true }) // Open, non-indexable beta preview; production access is unchanged."
assert source.count(original_access)==1
source=source.replace(original_access,beta_access)
# Preserve Frequency Etherea navigation, branding and Premium destinations.
source=re.sub(r'href="(/[^\"]*)"',lambda m:'href="https://frequencyetherea.com'+m[1]+'"',source)
source=re.sub(r'<meta\s+name="robots"[^>]*>', '', source, flags=re.I)
source=source.replace('<head>','<head>\n  <meta name="robots" content="noindex, nofollow, noarchive">')
r.joinpath('beta.updated.html').write_text(source)
a=re.findall(r'<script>(.*?)</script>',r.joinpath('preview/index.html').read_text(),re.S)[-1]
b=re.findall(r'<script>(.*?)</script>',source,re.S)[-1]
assert b==a.replace(original_access,beta_access)
r.joinpath('preview/beta.html').write_text(source)
print('Same production tool; only beta entitlement bootstrap grants open preview access.')
