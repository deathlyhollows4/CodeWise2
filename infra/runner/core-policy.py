"""Reviewed optional WSL2 VM-wide core policy. Never auto-applied by bootstrap.

Requires separately authorized expanded scope. Existing policy is backed up before
the exact value 'core' is installed. No .wslconfig/Windows setting is changed.
"""
import argparse,json,os,pathlib,platform,subprocess,time
PATTERN=pathlib.Path('/proc/sys/kernel/core_pattern')
STATE=pathlib.Path('/var/lib/codewise2-runner/core-policy.json')
PROPOSED='core'
PROC_ROOT=pathlib.Path('/proc')
def pattern():
    text=PATTERN.read_text();return text[:-1] if text.endswith('\n') else text
def read_state():
    if not STATE.exists():return None
    if STATE.is_symlink() or STATE.stat().st_uid!=0:raise RuntimeError('Policy ownership invalid')
    state=json.loads(STATE.read_text())
    if state.get('schemaVersion')!=1 or state.get('owner')!='CodeWise2Runner' or state.get('proposed')!=PROPOSED or not isinstance(state.get('previous'),str):raise RuntimeError('Policy evidence invalid')
    return state
def assert_empty_sandbox_groups(root):
    for procs in root.rglob('cgroup.procs'):
        tasks=procs.read_text().split()
        # Upstream isolate intentionally puts its privileged cgroup keeper in
        # root/daemon. It is administration, not a learner sandbox task.
        if procs.parent==root/'daemon' and tasks:
            for pid in tasks:
                executable=(PROC_ROOT/pid/'exe').resolve()
                status=(PROC_ROOT/pid/'status').read_text().splitlines()
                uids=next(line.split()[1:] for line in status if line.startswith('Uid:'))
                if str(executable)!='/usr/local/sbin/isolate-cg-keeper' or uids!=['0','0','0','0']:raise RuntimeError('Unexpected administrative cgroup task; policy unchanged')
            continue
        if tasks:raise RuntimeError('Sandbox or root cgroup tasks still active; policy unchanged')
def quiesce():
    fragment=subprocess.run(['systemctl','show','codewise2-runner.service','--property=FragmentPath','--value'],capture_output=True,text=True,check=True,timeout=10).stdout.strip()
    if fragment!='/etc/systemd/system/codewise2-runner.service':raise RuntimeError('Controller unit ownership not verified')
    subprocess.run(['systemctl','stop','codewise2-runner.service'],check=True,timeout=20)
    if subprocess.run(['systemctl','is-active','--quiet','codewise2-runner.service'],timeout=10).returncode==0:raise RuntimeError('Controller still active')
    subprocess.run(['/usr/local/bin/isolate','--cg','--box-id=0','--cleanup'],check=True,capture_output=True,timeout=15)
    cg=subprocess.run(['/usr/local/bin/isolate','--cg','--print-cg-root'],check=True,capture_output=True,text=True,timeout=10).stdout.strip()
    root=pathlib.Path(cg).resolve()
    if not str(root).startswith('/sys/fs/cgroup/isolate.'):raise RuntimeError('Unexpected sandbox cgroup root')
    assert_empty_sandbox_groups(root)
    if pathlib.Path('/var/local/lib/isolate/0').exists():raise RuntimeError('Sandbox workspace not cleaned; policy unchanged')
def main():
    parser=argparse.ArgumentParser();parser.add_argument('action',choices=['inspect','apply','restore']);args=parser.parse_args()
    if platform.system()!='Linux' or os.geteuid()!=0 or os.environ.get('WSL_DISTRO_NAME')!='CodeWise2Runner':raise RuntimeError('Only named approved distro root may manage this policy')
    current=pattern();state=read_state()
    if args.action=='inspect':print(json.dumps({'current':current,'proposed':PROPOSED,'scope':'shared WSL2 VM kernel; all distros in that VM','backupExists':state is not None,'changed':False}));return
    if args.action=='apply':
        if state is not None and current not in (state['previous'],PROPOSED):raise RuntimeError('Unrelated policy change found; refusing overwrite')
        quiesce()
        if state is None:
            state={'schemaVersion':1,'owner':'CodeWise2Runner','previous':current,'proposed':PROPOSED,'kernel':platform.release(),'createdAt':time.time()}
            STATE.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
            fd=os.open(STATE,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
            with os.fdopen(fd,'w') as f:
                json.dump(state,f,indent=2);f.flush();os.fsync(f.fileno())
            directory_fd=os.open(STATE.parent,os.O_RDONLY|os.O_DIRECTORY)
            try:os.fsync(directory_fd)
            finally:os.close(directory_fd)
        if current not in (state['previous'],PROPOSED):raise RuntimeError('Unrelated policy change found; refusing overwrite')
        if pattern()!=current:raise RuntimeError('Core policy changed during drain; refusing overwrite')
        PATTERN.write_text(PROPOSED+'\n')
        if pattern()!=PROPOSED:raise RuntimeError('Policy verification failed')
        print('Core policy applied: core. Prior exact value preserved. WSL2 VM-wide; own controller remains stopped until explicit restart and fresh canaries.')
    else:
        if state is None:raise RuntimeError('No owned backup available to restore')
        if current not in (PROPOSED,state['previous']):raise RuntimeError('Another policy owner changed core_pattern; refusing restore')
        quiesce()
        if pattern()!=current:raise RuntimeError('Core policy changed during drain; refusing restore')
        PATTERN.write_text(state['previous']+'\n')
        if pattern()!=state['previous']:raise RuntimeError('Restore verification failed')
        print('Exact previous VM-wide core pattern restored. Learner runner readiness must be re-evaluated.')
if __name__=='__main__':main()
