from pathlib import Path
import re

def restore_layout(source):
    replacements = [
      ('      grid-template-columns: 1fr;\n      gap: 18px;\n      align-items: start;', '      grid-template-columns: minmax(0, 1fr) auto;\n      gap: 18px;\n      align-items: end;'),
      ('    .transport {\n      min-width: 0;\n      width: 100%;', '    .transport {\n      min-width: min(100%, 420px);\n      width: 420px;'),
      ('@media (max-width: 1180px)', '@media (max-width: 980px)'),
    ]
    for old,new in replacements:
        assert source.count(old)==1, f'Expected unique layout block: {old}'
        source=source.replace(old,new)
    # Keep all waveform buttons inside their field in the two-column iPad layout.
    source = source.replace('    @media (max-width: 980px)', '    @media (min-width: 981px) and (max-width: 1180px) {\n      .segmented { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n    }\n\n    @media (max-width: 980px)')
    return source

if __name__=='__main__':
    root=Path(__file__).parent
    original=(root/'production.live.html').read_text()
    updated=restore_layout(original)
    assert re.findall(r'<script\b[^>]*>.*?</script>',original,re.S)==re.findall(r'<script\b[^>]*>.*?</script>',updated,re.S)
    assert re.sub(r'<style>.*?</style>','',original,flags=re.S)==re.sub(r'<style>.*?</style>','',updated,flags=re.S)
    (root/'preview/baseline.html').write_text(original)
    (root/'preview/index.html').write_text(updated)
    if (root/'production.original.php').exists():
        (root/'production.updated.php').write_text(restore_layout((root/'production.original.php').read_text()))
    print('Layout restored; all scripts, HTML, IDs, controls and links byte-identical outside CSS.')
