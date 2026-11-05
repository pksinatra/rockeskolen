# Laster opp filene som gis som argumenter til rockeskolen.com. Nye filer (finnes ikke i produksjon) er tillatt.
# Hver fil: produksjonen må være lik git HEAD (ellers stopp), backup, opplasting til .rs-upload, SHA-256, rename, ny kontroll.
from pathlib import Path
import ftplib, hashlib, os, tempfile, time, netrc, subprocess, sys
root = Path(__file__).resolve().parents[2]
# base=REV: produksjonen skal være lik denne commiten (f.eks. base=HEAD~1 når den nye versjonen allerede er committet).
base = next((a[5:] for a in sys.argv[1:] if a.startswith('base=')), 'HEAD')
paths = [a for a in sys.argv[1:] if a != 'apply' and not a.startswith('base=')]
apply = 'apply' in sys.argv
# Sikkerhetskopier av produksjonsfilene legges utenfor repoet (RS_WORK eller systemets tmp-mappe).
backup = Path(os.environ.get('RS_WORK') or os.path.join(tempfile.gettempdir(), 'rockeskolen-publisering')) / ('ftp-backup-' + time.strftime('%Y%m%d-%H%M%S'))
sha = lambda b: hashlib.sha256(b).hexdigest()
pw = netrc.netrc().authenticators('ftp.domeneshop.no')[2]
f = ftplib.FTP('ftp.domeneshop.no', timeout=40); f.login('rockeskolen', pw); f.voidcmd('TYPE I')
assert 'interval.php' in ' '.join(f.nlst('/www/embed')), 'Feil FTP-konto'
def get(r, missing_ok=False):
    b = bytearray()
    try: f.retrbinary('RETR ' + r, b.extend)
    except ftplib.error_perm:
        if missing_ok: return None
        raise
    return bytes(b)
for p in paths:
    remote = '/www/' + p; data = (root / p).read_bytes()
    head = subprocess.run(['git', '-C', str(root), 'show', base + ':' + p], capture_output=True).stdout
    old = get(remote, missing_ok=True)
    if old is None and head == b'': sys.exit(f'STOPP: {p} er ikke committet')
    if old is None: print('ny fil   ', remote)
    elif old == data: print('uendret  ', remote); continue
    elif old != head: sys.exit(f'STOPP: {remote} i produksjon avviker fra git {base} – kan være nyere arbeid')
    else: print('klar     ', remote, f'(prod = {base})')
    if not apply: continue
    if old is not None: backup.mkdir(parents=True, exist_ok=True); (backup / p.replace('/', '__')).write_bytes(old)
    temp = remote + '.rs-upload'
    with (root / p).open('rb') as o: f.storbinary('STOR ' + temp, o)
    assert sha(get(temp)) == sha(data), 'SHA-256 stemmer ikke for ' + remote
    f.rename(temp, remote)
    assert sha(get(remote)) == sha(data), 'Verifisering feilet for ' + remote
    print('lastet opp', remote, sha(data)[:12])
f.quit(); print('Backup:', backup if apply else '(tørrkjøring)')
