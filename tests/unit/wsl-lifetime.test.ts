import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { WslLifetime } from "../../apps/server/src/wsl-lifetime.ts";
const root = join(process.cwd(), ".runtime", "tests");
mkdirSync(root, { recursive: true });
function fixture(
  mode:
    | "normal"
    | "start-error"
    | "early-exit"
    | "lookup-error"
    | "ownership-change" = "normal",
) {
  const workspace = mkdtempSync(join(root, "lifetime-fixture-")),
    data = join(workspace, "data");
  mkdirSync(join(workspace, "docs", "release-evidence"), { recursive: true });
  mkdirSync(join(data, "credentials", "runner"), { recursive: true });
  writeFileSync(join(data, "runner.json"), "{}");
  writeFileSync(
    join(data, "credentials", "runner", "token"),
    "fixture marker, not a credential",
  );
  writeFileSync(
    join(workspace, "docs", "release-evidence", "runner-bootstrap-result.json"),
    JSON.stringify({
      distro: "CodeWise2Runner",
      distroCreatedByBootstrap: true,
      ownerSid: "fixture-sid",
      workspace,
    }),
  );
  const child: any = new EventEmitter();
  child.pid = 123456;
  child.exitCode = null;
  child.signalCode = null;
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  let command = "",
    lookups = 0,
    spawned = 0,
    options: any;
  child.stdin.on("finish", () => {
    child.exitCode = 0;
    child.emit("exit", 0, null);
  });
  const spawn: any = (_file: string, args: string[], opts: any) => {
    spawned++;
    options = opts;
    command = args.join(" ");
    process.nextTick(() => {
      if (mode === "start-error") {
        child.emit("error", new Error("fixture start failure"));
        return;
      }
      child.stdout.write(
        JSON.stringify({ pid: 9001, nonce: args.at(-1) }) + "\n",
      );
    });
    return child;
  };
  const identity = async (pid?: number) => {
    if (!pid) return "fixture-sid";
    lookups++;
    if (mode === "early-exit" && lookups === 1) {
      child.exitCode = 0;
      child.emit("exit", 0, null);
    }
    if (mode === "lookup-error" && lookups > 1)
      throw Error("fixture lookup failure");
    return {
      pid,
      name: "wsl.exe",
      commandLine:
        mode === "ownership-change" && lookups > 1 ? "other process" : command,
      creation: "fixture-creation",
    };
  };
  return {
    keeper: new WslLifetime(data, workspace, data, {
      platform: "win32",
      spawn,
      identity,
    }),
    child,
    stats: () => ({ spawned, options }),
  };
}
test("owned lifetime uses hidden scrubbed fixed-distro reader and graceful verified EOF without kill or shared shutdown", async () => {
  const old = process.env.CODEWISE_RUNNER_TOKEN;
  process.env.CODEWISE_RUNNER_TOKEN = "PRIVATE_FIXTURE_ENV_MARKER";
  const f = fixture();
  try {
    assert.equal((await f.keeper.start()).status, "active");
    assert.equal((await f.keeper.start()).status, "active");
    assert.equal(f.stats().spawned, 1);
    assert.equal(f.stats().options.windowsHide, true);
    assert.equal(f.stats().options.env.CODEWISE_RUNNER_TOKEN, undefined);
    assert.equal((await f.keeper.stop()).status, "stopped");
    assert.equal(f.child.stdin.writableEnded, true);
    assert.equal(f.child.exitCode, 0);
  } finally {
    if (old === undefined) delete process.env.CODEWISE_RUNNER_TOKEN;
    else process.env.CODEWISE_RUNNER_TOKEN = old;
  }
});
test("startup errors and exit during asynchronous identity check never record falsely active client", async () => {
  for (const mode of ["start-error", "early-exit"] as const) {
    const f = fixture(mode);
    assert.equal((await f.keeper.start()).status, "unavailable");
    assert.notEqual(f.keeper.status().status, "active");
    assert.equal(f.child.stdin.writableEnded, true);
  }
});
test("failed stop lookup remains bounded and honest while owned EOF permits app shutdown", async () => {
  const f = fixture("lookup-error");
  assert.equal((await f.keeper.start()).status, "active");
  assert.equal((await f.keeper.stop()).status, "stop_unverified");
  assert.equal(f.child.stdin.writableEnded, true);
});
test("changed process identity cannot stop an unrelated process", async () => {
  const f = fixture("ownership-change");
  assert.equal((await f.keeper.start()).status, "active");
  assert.equal((await f.keeper.stop()).status, "ownership_changed");
  assert.equal(f.child.stdin.writableEnded, false);
  f.child.stdin.end();
});
