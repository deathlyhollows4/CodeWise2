import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadRunnerConfiguration } from "../../apps/server/src/runner-config.ts";
const root = join(process.cwd(), ".runtime", "tests");
mkdirSync(root, { recursive: true });
test("runner discovery uses private fixed files and permits only loopback destinations", () => {
  const dir = mkdtempSync(join(root, "runner-config-"));
  const cfg = loadRunnerConfiguration(dir, {});
  assert.equal(cfg.endpoint, "http://127.0.0.1:2358");
  assert.equal(cfg.tokenFile, join(dir, "credentials", "runner", "token"));
  writeFileSync(
    join(dir, "runner.json"),
    JSON.stringify({ schemaVersion: 1, endpoint: "https://attacker.invalid" }),
  );
  assert.equal(loadRunnerConfiguration(dir, {}).ok, false);
  writeFileSync(
    join(dir, "runner.json"),
    JSON.stringify({
      schemaVersion: 1,
      endpoint: "http://127.0.0.1:2358",
      tokenFile: "arbitrary-file",
    }),
  );
  assert.equal(loadRunnerConfiguration(dir, {}).ok, false);
  writeFileSync(
    join(dir, "runner.json"),
    JSON.stringify({ schemaVersion: 1, endpoint: "http://127.0.0.1:2358" }),
  );
  assert.equal(loadRunnerConfiguration(dir, {}).ok, true);
  assert.equal(
    loadRunnerConfiguration(dir, {
      CODEWISE_RUNNER_URL: "http://127.0.0.1:2458",
    }).endpoint,
    "http://127.0.0.1:2458",
  );
});
