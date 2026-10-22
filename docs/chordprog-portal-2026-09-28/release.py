from pathlib import Path
import ftplib,os,sys,json,hashlib
root=Path('/Users/pk/Documents/Codex/rockeskolen');doc=root/'docs/chordprog-portal-2026-09-28'
f=ftplib.FTP('ftp.domeneshop.no',timeout=40);f.login(os.environ['FTP_USER'],os.environ['FTP_PASS'])
def get(remote):
 b=bytearray();f.retrbinary('RETR '+remote,b.extend);return bytes(b)
def put(remote,p):
 temp=remote+'.rs-upload.php'
 with p.open('rb') as o:f.storbinary('STOR '+temp,o)
 assert get(temp)==p.read_bytes(),'Transfer mismatch';f.rename(temp,remote)
if sys.argv[1]=='app':
 try:f.cwd('/www/tools/chordprog');raise RuntimeError('App exists; refusing blind overwrite')
 except ftplib.error_perm:f.cwd('/')
 f.mkd('/www/tools/chordprog')
 files=sorted((root/'tools/chordprog').iterdir())
 for p in files:put('/www/tools/chordprog/'+p.name,p)
 (doc/'app-manifest.json').write_text(json.dumps([{'file':str(p.relative_to(root)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files],indent=2))
 print(len(files),'ChordProg files uploaded and verified')
elif sys.argv[1]=='portal':
 changes=[('/www/includes/content.php','content.php'),('/www/portal/modules/custom/rockeskolen_structure_qa/src/EventSubscriber/CanonicalResponseSubscriber.php','CanonicalResponseSubscriber.php')]
 for remote,name in changes:assert get(remote)==(doc/'backup'/name).read_bytes(),'Production changed; aborting '+name
 for remote,name in changes:put(remote,doc/'release'/name)
 print('Catalogue and portal renderer updated; originals backed up')
else:raise RuntimeError('Unknown operation')
f.quit()
