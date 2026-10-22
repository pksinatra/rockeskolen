from pathlib import Path
import ftplib
p=Path(__file__).parent
f=ftplib.FTP('ftp.domeneshop.no',timeout=30)
import os
f.login(os.environ['FTP_USER'],os.environ['FTP_PASS'])
changes=[('/www/index.html','index.html'),('/www/portal/modules/custom/rockeskolen_structure_qa/src/EventSubscriber/CanonicalResponseSubscriber.php','CanonicalResponseSubscriber.php')]
def get(remote):
 b=bytearray();f.retrbinary('RETR '+remote,b.extend);return bytes(b)
for remote,name in changes:
 assert get(remote)==(p/'backup'/name).read_bytes(),'Production changed: '+name
for remote,name in changes:
 data=(p/'release'/name).read_bytes()
 import io
 f.storbinary('STOR '+remote+'.rs-upload',io.BytesIO(data))
 assert get(remote+'.rs-upload')==data
 f.rename(remote+'.rs-upload',remote)
 print(name+': uploaded and verified')
f.quit()
