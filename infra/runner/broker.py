"""Local privileged isolate controller. Never run this on Windows or an everyday distro.

Compiler and learner process both run in isolate. No shell, learner-provided paths,
expected outputs, app database, or provider credentials enter this service.
Readiness is closed until a matching canary attestation exists.
"""
import hashlib, hmac, json, os, pathlib, platform, re, signal, stat, subprocess, threading, time, uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

BASE = pathlib.Path('/var/lib/codewise2-runner')
ISOLATE = '/usr/local/bin/isolate'
PIN = '8f185bb37f3f23e29b33b0c7727c91c13429abe3'
JAVA_BIN=str(pathlib.Path('/usr/bin/java').resolve())
JAVAC_BIN=str(pathlib.Path('/usr/bin/javac').resolve())
if not JAVA_BIN.startswith('/usr/lib/jvm/java-21-openjdk-') or not JAVAC_BIN.startswith('/usr/lib/jvm/java-21-openjdk-'):
    raise RuntimeError('Approved Java21 package paths not found')
LOCK = threading.BoundedSemaphore(1)
JOBS_LOCK=threading.Lock()
ACTIVE_JOBS={}
PENDING_CANCEL={}
TOKEN = (BASE / 'token').read_text().strip()
VERIFY_TOKEN = (BASE / 'verification-token').read_text().strip()
if len(TOKEN) < 32 or len(VERIFY_TOKEN)<32: raise RuntimeError('Runner authentication or verification token is missing or too short')

def metadata():
    versions={}
    for language,cmd in [('cpp',['/usr/bin/g++','--version']),('java',['/usr/bin/java','-version']),('python',['/usr/bin/python3','--version'])]:
        r=subprocess.run(cmd,capture_output=True,text=True,timeout=5,env={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8'})
        versions[language]=(r.stdout+r.stderr).splitlines()[0][:200]
    revision=subprocess.run(['/usr/bin/git','-C','/opt/codewise2-runner/isolate','rev-parse','HEAD'],capture_output=True,text=True,timeout=5).stdout.strip()
    paths=[ISOLATE,__file__,'/opt/codewise2-runner/verify-canaries.py','/usr/local/etc/isolate','/etc/wsl.conf','/etc/systemd/system/codewise2-runner.service','/etc/systemd/system/var-local-lib-isolate.mount','/usr/share/java/gson.jar','/usr/include/nlohmann/json.hpp']
    digests={p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest() for p in paths}
    if revision!=PIN:raise RuntimeError('Unexpected isolate source revision')
    core_pattern=pathlib.Path('/proc/sys/kernel/core_pattern').read_text().strip()
    boot_id=pathlib.Path('/proc/sys/kernel/random/boot_id').read_text().strip()
    return {'isolateRevision':revision,'architecture':platform.machine(),'kernel':platform.release(),'bootId':boot_id,'corePattern':core_pattern,'controlDigests':digests,'languages':[{'id':k,'version':v} for k,v in versions.items()]}

IDENTITY=metadata()
IDENTITY_HASH=hashlib.sha256(json.dumps(IDENTITY,sort_keys=True).encode()).hexdigest()
def readiness():
    try: evidence=json.loads((BASE/'canary-attestation.json').read_text())
    except (OSError,ValueError): evidence={}
    current_hash=hashlib.sha256(json.dumps(metadata(),sort_keys=True).encode()).hexdigest()
    unchanged=current_hash==IDENTITY_HASH
    core_safe=not IDENTITY['corePattern'].startswith('|')
    verified=unchanged and core_safe and evidence.get('identityHash')==IDENTITY_HASH and evidence.get('passed') is True and evidence.get('expiresAt',0)>time.time()
    message='Isolated runner ready' if verified else 'Core-pipe containment not verified; learner execution disabled' if not core_safe else 'Runner canary verification required' if unchanged else 'Control files changed; restart runner and repeat canaries'
    return dict(ready=verified,controlsVerified=verified,message=message,identityHash=IDENTITY_HASH,corePolicyVerified=core_safe,controllerPid=os.getpid(),**IDENTITY)

class Canceled(Exception):pass
def invoke(args,timeout=40,job=None):
    if job and job['cancel'].is_set():raise Canceled()
    process=subprocess.Popen([ISOLATE,'--cg','--box-id=0',*args],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8'},start_new_session=True)
    if job:
        with JOBS_LOCK:job['process']=process
        if job['cancel'].is_set():process.send_signal(signal.SIGTERM)
    try:
        out,err=process.communicate(timeout=timeout)
        if job and job['cancel'].is_set():raise Canceled()
        return subprocess.CompletedProcess(process.args,process.returncode,out,err)
    except subprocess.TimeoutExpired:
        # The pinned keeper handles SIGTERM by synchronously killing its sandbox group.
        process.send_signal(signal.SIGTERM)
        try:process.communicate(timeout=5)
        except subprocess.TimeoutExpired:process.kill();process.communicate(timeout=5)
        raise
    finally:
        if job:
            with JOBS_LOCK:job['process']=None

def cancel_job(job_id):
    if not isinstance(job_id,str) or not re.fullmatch('[a-f0-9-]{36}',job_id):raise ValueError('Invalid job identity')
    with JOBS_LOCK:
        now=time.monotonic()
        for key in list(PENDING_CANCEL):
            if PENDING_CANCEL[key]<now:del PENDING_CANCEL[key]
        job=ACTIVE_JOBS.get(job_id)
        if job:
            job['cancel'].set();process=job.get('process')
            if process and process.poll() is None:process.send_signal(signal.SIGTERM)
        elif len(PENDING_CANCEL)<128:PENDING_CANCEL[job_id]=now+60
    if job:job['done'].wait(timeout=5)
    return {'canceled':True,'cleanupComplete':bool(job and job['done'].is_set())}

def bounded(path,maximum=1048576):
    fd=None
    try:
        fd=os.open(path,os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK|os.O_CLOEXEC)
        if not stat.S_ISREG(os.fstat(fd).st_mode):return ''
        data=os.read(fd,maximum+1)
        return data[:maximum].decode('utf-8',errors='replace')
    except OSError: return ''
    finally:
        if fd is not None:os.close(fd)

def execute(payload,on_phase=None):
    if set(payload)-{'language','source','stdin','limits','verification','jobId','phaseStream'}: raise ValueError('Unsupported request field')
    if not isinstance(payload.get('phaseStream',False),bool):raise ValueError('Invalid phase stream request')
    language=payload.get('language');source=payload.get('source');stdin=payload.get('stdin')
    if language not in ('cpp','java','python') or not isinstance(source,str) or not isinstance(stdin,str): raise ValueError('Invalid execution request')
    if len(source.encode())>200000 or len(stdin.encode())>8388608: raise ValueError('Request exceeds limits')
    # Limits are server-owned hard caps; browser may never expand these.
    supplied=payload.get('limits',{})
    caps={'cpuSeconds':10,'wallSeconds':30,'memoryKb':524288,'processes':64,'outputBytes':4194304,'fileKb':4096,'inputBytes':8388608}
    defaults={'cpuSeconds':5,'wallSeconds':15,'memoryKb':262144,'processes':64,'outputBytes':1048576,'fileKb':2048,'inputBytes':8388608}
    limits={}
    for k in caps:
        v=supplied.get(k,defaults[k])
        if not isinstance(v,(int,float)) or isinstance(v,bool) or not 0<v<=caps[k] or k not in ('cpuSeconds','wallSeconds') and (not isinstance(v,int) or v<1): raise ValueError('Invalid resource limit')
        limits[k]=v
    if len(stdin.encode())>limits['inputBytes']: raise ValueError('Input exceeds pack limit')
    job_id=payload.get('jobId',str(uuid.uuid4()))
    if not isinstance(job_id,str) or not re.fullmatch('[a-f0-9-]{36}',job_id):raise ValueError('Invalid job identity')
    job={'cancel':threading.Event(),'done':threading.Event(),'process':None}
    with JOBS_LOCK:
        if job_id in ACTIVE_JOBS:raise ValueError('Duplicate active job identity')
        ACTIVE_JOBS[job_id]=job
        if PENDING_CANCEL.pop(job_id,0)>time.monotonic():job['cancel'].set()
    if not LOCK.acquire(timeout=1):
        with JOBS_LOCK:ACTIVE_JOBS.pop(job_id,None)
        job['done'].set()
        return {'status':'infrastructure_error','diagnostics':'Runner busy; retry the bounded backend queue.'}
    try:
        init=invoke(['--init'],job=job)
        if init.returncode: return {'status':'infrastructure_error','diagnostics':'Sandbox initialization failed'}
        box=pathlib.Path(init.stdout.strip())/'box'
        if not box.is_dir() or box.is_symlink(): raise RuntimeError('Invalid isolate box path')
        filename={'cpp':'main.cpp','java':'Main.java','python':'main.py'}[language]
        (box/filename).write_text(source)
        # Explicit read-only runtime directories only; exclude /home,/mnt,/run,/etc, app data.
        dirs=['--no-default-dirs','--dir=/box='+str(box)+':rw','--dir=/usr:norec','--dir=/bin:norec','--dir=/lib:norec','--dir=/dev=/opt/codewise2-runner/devices:dev:norec']
        if pathlib.Path('/lib64').exists(): dirs.append('--dir=/lib64:norec')
        # Ubuntu JVM package redirects its public configuration into /etc.
        dirs.append('--dir=/etc/java-21-openjdk:maybe')
        # /proc is private to sandbox UID, needed by JVM; no host environment inheritance.
        dirs += ['--dir=/proc=proc:fs','--env=PATH=/usr/bin:/bin','--env=LANG=C.UTF-8','--env=HOME=/box','--env=TMPDIR=/box']
        def phase(command,compile_phase=False):
            opts=['--time='+str(15 if compile_phase else limits['cpuSeconds']),'--wall-time='+str(30 if compile_phase else limits['wallSeconds']),'--cg-mem='+str(524288 if compile_phase else int(limits['memoryKb'])),'--processes='+str(int(limits['processes'])),'--core=0','--syscalls=31','--fsize='+str(min(int(limits['fileKb']),int(limits['outputBytes'])//1024)),'--stdin='+('/dev/null' if compile_phase else 'input.txt'),'--stdout=output.txt','--stderr=error.txt','--meta='+str(box.parent/'meta.txt'),*dirs,'--run','--',*command]
            if on_phase:on_phase('compiling' if compile_phase else 'running')
            result=invoke(opts,job=job)
            meta={}
            for line in bounded(box.parent/'meta.txt',16384).splitlines():
                if ':' in line:
                    k,v=line.split(':',1);meta[k]=v
            return result,meta
        compiler={'cpp':['/usr/bin/g++','-std=c++17','-O2','-pipe','main.cpp','-o','main'],'java':[JAVAC_BIN,'-J-Xmx256m','-cp','/usr/share/java/gson.jar','Main.java'],'python':None}[language]
        if compiler:
            result,meta=phase(compiler,True)
            if result.returncode or meta.get('status'):
                return {'status':'compile_error','diagnostics':bounded(box/'error.txt',16384),'runtime':{'phase':'compile','meta':meta}}
        # Learner-controlled compiler input never contains testcase material.
        # Materialize grading input only after isolated compilation has completed.
        input_path=box/'input.txt'
        fd=os.open(input_path,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW|os.O_CLOEXEC,0o644)
        with os.fdopen(fd,'w') as f:f.write(stdin)
        command={'cpp':['/box/main'],'java':[JAVA_BIN,'-Xmx128m','-XX:ActiveProcessorCount=1','-XX:+UseSerialGC','-cp','/box:/usr/share/java/gson.jar','Main'],'python':['/usr/bin/python3','-I','/box/main.py']}[language]
        result,meta=phase(command)
        output=bounded(box/'output.txt',int(limits['outputBytes']))
        status='executed'
        if meta.get('status')=='TO':status='time_limit'
        elif meta.get('cg-oom-killed')=='1':status='memory_limit'
        elif meta.get('exitsig')=='25':status='output_limit'
        elif result.returncode or meta.get('status'):status='runtime_error'
        return {'status':status,'stdout':output,'diagnostics':bounded(box/'error.txt',16384),'runtime':{'identity':IDENTITY,'meta':meta}}
    except subprocess.TimeoutExpired:
        return {'status':'time_limit','diagnostics':'Sandbox controller deadline reached'}
    except Canceled:
        return {'status':'canceled','diagnostics':'Isolated task terminated; sandbox cleanup completed'}
    finally:
        try: invoke(['--cleanup'],10)
        finally:
            LOCK.release()
            with JOBS_LOCK:ACTIVE_JOBS.pop(job_id,None)
            job['done'].set()

class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args): pass
    def setup(self):
        super().setup();self.connection.settimeout(10)
    def authorized(self):
        auth=self.headers.get('Authorization','')
        self.verifier=hmac.compare_digest(auth,'Bearer '+VERIFY_TOKEN)
        return self.verifier or hmac.compare_digest(auth,'Bearer '+TOKEN)
    def send_json(self,status,value):
        data=json.dumps(value).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
    def do_GET(self):
        if not self.authorized(): return self.send_json(401,{'message':'Unauthorized'})
        if self.path!='/health': return self.send_json(404,{'message':'Not found'})
        health=readiness();health['phaseEventsSupported']=True
        self.send_json(200,health)
    def do_POST(self):
        if not self.authorized():return self.send_json(401,{'message':'Unauthorized'})
        if self.path not in ('/execute','/cancel'):return self.send_json(404,{'message':'Not found'})
        streaming=False
        def emit(value):
            self.wfile.write((json.dumps(value)+'\n').encode());self.wfile.flush()
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0<length<=10000000:raise ValueError('Invalid request size')
            self.connection.settimeout(10)
            payload=json.loads(self.rfile.read(length))
            if self.path=='/cancel':return self.send_json(200,cancel_job(payload.get('jobId')))
            # Authenticated verification tooling can exercise canaries before readiness.
            if payload.get('verification') is True and not self.verifier:return self.send_json(403,{'message':'Setup-only verification access required'})
            if not readiness()['ready'] and not (self.verifier and payload.get('verification') is True):return self.send_json(503,{'status':'infrastructure_error','diagnostics':'Canaries not verified'})
            requested=payload.get('phaseStream',False)
            if not isinstance(requested,bool):raise ValueError('Invalid phase stream request')
            if requested:
                self.send_response(200);self.send_header('Content-Type','application/x-ndjson');self.send_header('Connection','close');self.end_headers();self.close_connection=True;streaming=True
            result=execute(payload,(lambda phase:emit({'type':'phase','phase':phase})) if streaming else None)
            actual_identity=metadata()
            actual_hash=hashlib.sha256(json.dumps(actual_identity,sort_keys=True).encode()).hexdigest()
            result.setdefault('runtime',{}).update(identity=actual_identity,identityHash=actual_hash,startIdentityHash=IDENTITY_HASH)
            if streaming:emit({'type':'result','result':result})
            else:self.send_json(200,result)
        except (BrokenPipeError,ConnectionResetError):return
        except (ValueError,TypeError):
            if streaming:emit({'type':'result','result':{'status':'infrastructure_error','diagnostics':'Invalid runner request'}})
            else:self.send_json(400,{'message':'Invalid request'})
        except Exception:
            if streaming:emit({'type':'result','result':{'status':'infrastructure_error','diagnostics':'Runner controller error'}})
            else:self.send_json(500,{'status':'infrastructure_error','diagnostics':'Runner controller error'})

class BoundedServer(ThreadingHTTPServer):
    daemon_threads=True
    request_queue_size=8
    slots=threading.BoundedSemaphore(4)
    def process_request(self,request,address):
        if not self.slots.acquire(blocking=False):
            self.shutdown_request(request);return
        try:super().process_request(request,address)
        except BaseException:
            self.slots.release();raise
    def process_request_thread(self,request,address):
        try:super().process_request_thread(request,address)
        finally:self.slots.release()

if __name__=='__main__':
    if platform.system()!='Linux' or os.geteuid()!=0:raise RuntimeError('Dedicated Linux root controller required')
    BoundedServer(('127.0.0.1',2358),Handler).serve_forever()
