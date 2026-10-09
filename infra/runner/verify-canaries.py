"""Run trusted harmless canaries through the isolated broker, never via host exec.
Only installs attestation after every required control check actually passes.
Run locally inside the dedicated distro after controller setup. Failed/absent
checks keep readiness false. This is not a bank reference validation.
"""
import hashlib,json,pathlib,time,urllib.error,urllib.request,uuid
from concurrent.futures import ThreadPoolExecutor
ROOT=pathlib.Path('/var/lib/codewise2-runner')
token=(ROOT/'verification-token').read_text().strip()
def request(path,payload=None):
    data=json.dumps(payload).encode() if payload is not None else None
    r=urllib.request.Request('http://127.0.0.1:2358'+path,data=data,headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
    with urllib.request.urlopen(r,timeout=75) as f:return json.load(f)
def run(language,source,limits=None,stdin='',job_id=None):return request('/execute',{'jobId':job_id or str(uuid.uuid4()),'language':language,'source':source,'stdin':stdin,'limits':limits or {},'verification':True})
health=None
for attempt in range(20):
    try:health=request('/health');break
    except urllib.error.URLError:
        if attempt==19:raise
        time.sleep(.25)
results=[]
def record(name,value,ok):results.append({'name':name,'passed':bool(ok),'result':value})
sources={'cpp':'#include <iostream>\nint main(){std::cout<<42<<"\\n";}','java':'public class Main {public static void main(String[] x){System.out.println(42);}}','python':'print(42)'}
for lang,source in sources.items():
    r=run(lang,source);record(lang+'-real-smoke',r,r.get('status')=='executed' and r.get('stdout','').strip()=='42')
# Public canary path with harmless marker: never test with the authentication token itself.
(ROOT/'harmless-canary').write_text('CODEWISE2-CANARY-NOT-A-SECRET')
source='''import os,socket
checks=[]
for path in ['/var/lib/codewise2-runner/harmless-canary','/mnt/c/Windows/win.ini','/home','/run/docker.sock']:
    checks.append(not os.path.exists(path))
checks.append(not any('TOKEN' in k or 'DEEPSEEK' in k for k in os.environ))
s=socket.socket();s.settimeout(0.5)
try:
    s.connect(('127.0.0.1',2358));checks.append(False)
except OSError:checks.append(True)
try:
    s.connect(('1.1.1.1',443));checks.append(False)
except OSError:checks.append(True)
print(1 if all(checks) else 0)
'''
r=run('python',source);record('filesystem-environment-network',r,r.get('status')=='executed' and r.get('stdout','').strip()=='1')
r=run('cpp','#include "/var/lib/codewise2-runner/harmless-canary"\nint main(){}');record('compile-isolation',r,r.get('status')=='compile_error' and 'CODEWISE2-CANARY-NOT-A-SECRET' not in r.get('diagnostics',''))
r=run('cpp','#include "input.txt"\nint main(){}',stdin='CODEWISE2-HIDDEN-INPUT-CANARY')
record('compile-does-not-receive-test-input',r,r.get('status')=='compile_error' and 'CODEWISE2-HIDDEN-INPUT-CANARY' not in json.dumps(r))
r=run('python','while True: pass',{'cpuSeconds':.1,'wallSeconds':1});record('cpu-time',r,r.get('status')=='time_limit')
r=run('python','import time;time.sleep(5)',{'cpuSeconds':1,'wallSeconds':1});record('wall-time',r,r.get('status')=='time_limit')
r=run('python','a=[]\nwhile True:a.append(bytearray(1024*1024))',{'memoryKb':32768,'cpuSeconds':2,'wallSeconds':3});record('memory-limit',r,r.get('status')=='memory_limit' or (r.get('status')=='runtime_error' and 'MemoryError' in r.get('diagnostics','')))
r=run('python','while True: print("x"*1024)',{'outputBytes':4096,'fileKb':4,'cpuSeconds':2,'wallSeconds':3});record('output-file-limit',r,r.get('status') in ('output_limit','runtime_error') and len(r.get('stdout','').encode())<=4096)
r=run('python','import os,time\npids=[]\ntry:\n    for i in range(100):\n        p=os.fork()\n        if p==0:time.sleep(2);os._exit(0)\n        pids.append(p)\nexcept OSError:print(1)\nfinally:\n    for p in pids:os.waitpid(p,0)',{'processes':8,'wallSeconds':5});record('process-limit',r,r.get('stdout','').strip()=='1')
r=run('python','import pathlib\ntry:\n    pathlib.Path("/usr/CODEWISE2-HARMLESS-CANARY").write_text("x")\n    print(0)\nexcept OSError: print(1)');record('readonly-runtime',r,r.get('stdout','').strip()=='1')
for kind,code in [('fifo','os.mkfifo("output.txt")'),('symlink','os.symlink("/var/lib/codewise2-runner/harmless-canary","output.txt")')]:
    started=time.monotonic();r=run('python','import os\nos.unlink("output.txt")\n'+code)
    record('hostile-output-'+kind,r,time.monotonic()-started<5 and r.get('stdout','')=='' and 'CODEWISE2-CANARY' not in json.dumps(r))
for field in ('memoryKb','processes','outputBytes','fileKb','inputBytes'):
    try:run('python','print(1)',{field:.5});record('reject-fractional-'+field,{'rejected':False},False)
    except urllib.error.HTTPError as e:record('reject-fractional-'+field,{'httpStatus':e.code},e.code==400)
job_id=str(uuid.uuid4())
with ThreadPoolExecutor(max_workers=1) as pool:
    started=time.monotonic();future=pool.submit(run,'python','import time;time.sleep(20)',{'wallSeconds':25},'',job_id)
    time.sleep(.3);cancel=request('/cancel',{'jobId':job_id});result=future.result(timeout=8)
    record('actual-cancel-and-cleanup',{'cancel':cancel,'result':result,'elapsedSeconds':time.monotonic()-started},cancel.get('cleanupComplete') is True and result.get('status')=='canceled' and time.monotonic()-started<8)
r=run('python','import socket\ntry:\n s=socket.socket(socket.AF_VSOCK,socket.SOCK_STREAM)\n print(0)\nexcept OSError: print(1)');record('vsock-syscall-blocked',r,r.get('status')=='executed' and r.get('stdout','').strip()=='1')
record('core-pipe-policy',{'corePattern':health.get('corePattern'),'verified':health.get('corePolicyVerified')},health.get('corePolicyVerified') is True)
if health.get('corePolicyVerified') is True and not str(health.get('corePattern','|')).startswith('|'):
    before=set(str(p) for p in pathlib.Path('/var/local/lib/isolate').rglob('core*'))
    crash=run('python','import os;os.abort()')
    after=set(str(p) for p in pathlib.Path('/var/local/lib/isolate').rglob('core*'))
    record('bounded-crash-no-artifact',crash,crash.get('status')=='runtime_error' and after==before)
    raise_limit=run('python','import resource\ntry:\n resource.setrlimit(resource.RLIMIT_CORE,(1048576,1048576))\n print(0)\nexcept (ValueError,PermissionError): print(1)')
    record('core-hard-limit-cannot-be-raised',raise_limit,raise_limit.get('stdout','').strip()=='1')
    fork=run('python','import os\np=os.fork()\nif p==0:\n os.execv("/usr/bin/python3",["python3","-I","-c","import os,resource;print(resource.getrlimit(resource.RLIMIT_CORE),flush=True);os.abort()"] )\nelse:\n _,status=os.waitpid(p,0)\n print(1 if os.WIFSIGNALED(status) and not os.WCOREDUMP(status) else 0)')
    record('fork-exec-core-limit-and-cleanup',fork,fork.get('status')=='executed' and fork.get('stdout','').strip().splitlines()==['(0, 0)','1'])
else:
    for name in ('bounded-crash-no-artifact','core-hard-limit-cannot-be-raised','fork-exec-core-limit-and-cleanup'):
        record(name,{'status':'blocked','reason':'Non-pipe policy must be verified before deliberate crash probes'},False)
report={'schemaVersion':1,'identityHash':health['identityHash'],'generatedAt':time.time(),'expiresAt':time.time()+86400,'passed':all(x['passed'] for x in results),'results':results}
(ROOT/'canary-attestation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':report['passed'],'checks':[{k:x[k] for k in ('name','passed')} for x in results]},indent=2))
raise SystemExit(0 if report['passed'] else 1)
