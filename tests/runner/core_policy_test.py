"""Policy utility transaction tests. Fake temp policy file only; never global sysctl."""
import contextlib,importlib.util,io,json,pathlib,sys,tempfile,unittest
from unittest import mock
spec=importlib.util.spec_from_file_location('core_policy','/opt/codewise2-runner/core-policy.py')
policy=importlib.util.module_from_spec(spec);spec.loader.exec_module(policy)
class PolicyTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='codewise2-policy-unit-')
        root=pathlib.Path(self.temp.name);self.pattern=root/'fake-pattern';self.pattern.write_text('|TEST-COLLECTOR %p\n');self.state=root/'private'/'state.json';self.events=[]
    def tearDown(self):self.temp.cleanup()
    def action(self,name,quiesce=None):
        with mock.patch.object(policy,'PATTERN',self.pattern),mock.patch.object(policy,'STATE',self.state),mock.patch.object(policy,'quiesce',quiesce or (lambda:self.events.append('quiesced'))),mock.patch.object(sys,'argv',['core_policy',name]),contextlib.redirect_stdout(io.StringIO()):policy.main()
    def test_exact_restore_and_durable_owned_backup(self):
        self.action('apply');self.assertEqual(self.pattern.read_text(),'core\n');state=json.loads(self.state.read_text());self.assertEqual(state['previous'],'|TEST-COLLECTOR %p');self.assertEqual(state['owner'],'CodeWise2Runner');self.assertEqual(self.state.stat().st_mode&0o777,0o600);self.action('restore');self.assertEqual(self.pattern.read_text(),'|TEST-COLLECTOR %p\n');self.assertEqual(self.events,['quiesced','quiesced'])
    def test_active_task_refuses_policy_write(self):
        def active():raise RuntimeError('Sandbox tasks still active')
        with self.assertRaises(RuntimeError):self.action('apply',active)
        self.assertEqual(self.pattern.read_text(),'|TEST-COLLECTOR %p\n');self.assertFalse(self.state.exists())
    def test_unrelated_policy_change_is_not_overwritten(self):
        self.action('apply');self.pattern.write_text('FOREIGN-POLICY\n')
        with self.assertRaises(RuntimeError):self.action('restore')
        self.assertEqual(self.pattern.read_text(),'FOREIGN-POLICY\n');self.assertEqual(self.events,['quiesced'])
    def test_policy_changed_during_drain_is_not_overwritten(self):
        def changed():self.pattern.write_text('OTHER-DISTRO-CHANGE\n')
        with self.assertRaises(RuntimeError):self.action('apply',changed)
        self.assertEqual(self.pattern.read_text(),'OTHER-DISTRO-CHANGE\n')
    def group_fixture(self):
        root=pathlib.Path(self.temp.name)/'fake-cgroup';(root/'daemon').mkdir(parents=True);(root/'cgroup.procs').write_text('');(root/'daemon'/'cgroup.procs').write_text('11\n')
        proc=pathlib.Path(self.temp.name)/'fake-proc';(proc/'11').mkdir(parents=True);(proc/'11'/'status').write_text('Uid:\t0\t0\t0\t0\n');(proc/'11'/'exe').symlink_to('/usr/local/sbin/isolate-cg-keeper');return root,proc
    def test_exact_root_keeper_allowed(self):
        root,proc=self.group_fixture()
        with mock.patch.object(policy,'PROC_ROOT',proc):policy.assert_empty_sandbox_groups(root)
    def test_wrong_keeper_executable_refused(self):
        root,proc=self.group_fixture();(proc/'11'/'exe').unlink();(proc/'11'/'exe').symlink_to('/usr/bin/python3')
        with mock.patch.object(policy,'PROC_ROOT',proc),self.assertRaises(RuntimeError):policy.assert_empty_sandbox_groups(root)
    def test_every_uid_field_must_be_root(self):
        root,proc=self.group_fixture()
        for index in range(4):
            values=['0']*4;values[index]='600000';(proc/'11'/'status').write_text('Uid:\t'+'\t'.join(values)+'\n')
            with mock.patch.object(policy,'PROC_ROOT',proc),self.assertRaises(RuntimeError):policy.assert_empty_sandbox_groups(root)
    def test_root_and_sandbox_tasks_refused(self):
        root,proc=self.group_fixture();(root/'cgroup.procs').write_text('11\n')
        with mock.patch.object(policy,'PROC_ROOT',proc),self.assertRaises(RuntimeError):policy.assert_empty_sandbox_groups(root)
        (root/'cgroup.procs').write_text('');(root/'box0').mkdir();(root/'box0'/'cgroup.procs').write_text('11\n')
        with mock.patch.object(policy,'PROC_ROOT',proc),self.assertRaises(RuntimeError):policy.assert_empty_sandbox_groups(root)
if __name__=='__main__':unittest.main()
