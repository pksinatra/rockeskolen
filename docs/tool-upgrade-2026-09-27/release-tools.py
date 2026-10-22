import pathlib,os,ftplib,hashlib,json,sys
root=pathlib.Path('/Users/pk/Documents/Codex/rockeskolen');doc=root/'docs/tool-upgrade-2026-09-27'
f=ftplib.FTP('ftp.domeneshop.no',timeout=40);f.login(os.environ['FTP_USER'],os.environ['FTP_PASS'])
def get(path):
 data=bytearray();f.retrbinary('RETR '+path,data.extend);return bytes(data)
def mkdir(path):
 try:f.mkd(path)
 except ftplib.error_perm:
  f.cwd(path);f.cwd('/')
def put(path,local):
 temp=path+'.rs-20260927-upload'
 with local.open('rb') as stream:f.storbinary('STOR '+temp,stream)
 assert get(temp)==local.read_bytes(),path+' transfer mismatch'
 f.rename(temp,path)
if sys.argv[1]=='apps':
 try:f.cwd('/www/tools/updated');raise RuntimeError('Target already exists: inspect before replacing')
 except ftplib.error_perm:f.cwd('/')
 files=sorted(p for p in (root/'tools/updated').rglob('*') if p.is_file() and p.name!='apps.json')
 dirs=sorted({p.parent for p in files},key=lambda p:len(p.parts))
 made=set()
 for d in dirs:
  relative=d.relative_to(root);parts=relative.parts
  for i in range(1,len(parts)+1):
   remote='/www/'+'/'.join(parts[:i])
   if remote not in made:mkdir(remote);made.add(remote)
 for p in files:put('/www/'+str(p.relative_to(root)),p)
 (doc/'deployment-apps.json').write_text(json.dumps([{'file':str(p.relative_to(root)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files],indent=2))
 print(len(files),'app files uploaded and byte-verified; catalogue unchanged')
elif sys.argv[1]=='catalogue':
 remote='/www/includes/content.php'
 assert get(remote)==(doc/'backup/production-content.php').read_bytes(),'Catalogue changed since snapshot; aborting'
 put(remote,doc/'release/content.php');assert get(remote)==(doc/'release/content.php').read_bytes()
 print('Six catalogue links updated and byte-verified')
elif sys.argv[1]=='rollback':
 remote='/www/includes/content.php'
 assert get(remote)==(doc/'release/content.php').read_bytes(),'Catalogue changed since release; aborting'
 put(remote,doc/'backup/production-content.php')
 print('Original catalogue restored; apps retained for inspection')
else:raise RuntimeError('Unknown release mode')
f.quit()
