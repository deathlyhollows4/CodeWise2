import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('Windows startup requires consent for shared policy recovery and fails closed', {skip: process.platform !== 'win32'}, () => {
  const result = spawnSync('pwsh', ['-NoProfile', '-File', 'tests/runner/startup-preflight.ps1'], {encoding: 'utf8', windowsHide: true});
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /Six runner preflight scenarios passed/);
});
