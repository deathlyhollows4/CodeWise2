import { test } from "node:test";
import assert from "node:assert/strict";
import { fork, type ChildProcess } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { Store } from "../../apps/server/src/store.ts";
import {
  ProfileOwner,
  ProfileOwnerError,
} from "../../apps/server/src/profile-owner.ts";
mkdirSync(".runtime/tests", { recursive: true });
const dir = () =>
  mkdtempSync(join(process.cwd(), ".runtime/tests/profile-owner-"));
function message(child: ChildProcess, event: string) {
  return new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(Error("Child ownership fixture timed out: " + event));
    }, 10000);
    function cleanup() {
      clearTimeout(timer);
      child.off("message", onMessage);
      child.off("error", onError);
    }
    function onError(error: Error) {
      cleanup();
      reject(error);
    }
    function onMessage(value: any) {
      if (value.event === event) {
        cleanup();
        resolve(value);
      }
    }
    child.on("message", onMessage);
    child.once("error", onError);
  });
}
function result(child: ChildProcess) {
  return new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(Error("Fixture claim timed out"));
    }, 10000);
    function cleanup() {
      clearTimeout(timer);
      child.off("message", receive);
    }
    function receive(value: any) {
      if (["acquired", "rejected"].includes(value.event)) {
        cleanup();
        resolve(value);
      }
    }
    child.on("message", receive);
  });
}
function exit(child: ChildProcess) {
  return new Promise<number | null>((resolve) => {
    if (child.exitCode !== null) return resolve(child.exitCode);
    child.once("exit", (code) => resolve(code));
  });
}
function child(path: string, mode = "lease") {
  return fork("scripts/profile-owner-fixture.mjs", [path, mode], {
    execArgv: ["--import", "tsx"],
    stdio: ["ignore", "ignore", "pipe", "ipc"],
  });
}
test("live profile admission refuses recovery while preserving active jobs; clean close permits safe recovery", () => {
  const path = dir(),
    first = new Store(path),
    id = randomUUID();
  first.insert("jobs", {
    id,
    idempotencyKey: randomUUID(),
    status: "running",
    code: "Inert controlled marker",
  });
  const before = JSON.stringify(first.get("jobs", id));
  assert.throws(
    () => new Store(path),
    (error: any) =>
      error instanceof ProfileOwnerError && error.code === "PROFILE_IN_USE",
  );
  assert.equal(JSON.stringify(first.get("jobs", id)), before);
  first.close();
  const restarted = new Store(path);
  assert.equal(restarted.get("jobs", id).status, "interrupted");
  restarted.close();
});
test("distinct profiles remain parallel and a borrowed owner cannot be attached twice", () => {
  const a = dir(),
    b = dir(),
    owner = ProfileOwner.acquire(a),
    first = new Store(a, owner),
    second = new Store(b);
  try {
    assert.throws(() => new Store(a, owner), ProfileOwnerError);
    assert.throws(() => ProfileOwner.acquire(a), ProfileOwnerError);
    first.setMeta("probe", "first");
    second.setMeta("probe", "second");
    assert.equal(first.meta("probe"), "first");
    assert.equal(second.meta("probe"), "second");
  } finally {
    first.close();
    second.close();
  }
});
test("failed schema startup releases guard and preserves existing unknown-version bytes", () => {
  const path = dir(),
    database = join(path, "codewise2.sqlite"),
    raw = new DatabaseSync(database);
  raw.exec("PRAGMA user_version=77");
  raw.close();
  const before = readFileSync(database);
  assert.throws(
    () => new Store(path),
    /Unsupported database schema version 77/,
  );
  assert.deepEqual(readFileSync(database), before);
  const owner = ProfileOwner.acquire(path);
  owner.release();
});
test("simultaneous process claims serialize; one wins and loser cannot recover or expire the live lease", async () => {
  const path = dir(),
    children = [child(path), child(path)];
  try {
    await Promise.all(children.map((c) => message(c, "ready")));
    const outcomes = children.map(result);
    children.forEach((c) => c.send("start"));
    const claims = await Promise.all(outcomes);
    assert.equal(claims.filter((c) => c.event === "acquired").length, 1);
    assert.equal(claims.filter((c) => c.code === "PROFILE_IN_USE").length, 1);
    const winner = children[claims.findIndex((c) => c.event === "acquired")];
    const ended = exit(winner);
    winner.send("release");
    assert.equal(await ended, 0);
    const owner = ProfileOwner.acquire(path);
    owner.release();
  } finally {
    for (const c of children) if (c.connected) c.send("release");
  }
});
test("crashed owner kernel lock releases; simultaneous stale reclaim has one winner and preserves prior rows", async () => {
  const path = dir(),
    old = child(path, "store");
  await message(old, "ready");
  const claimed = result(old);
  old.send("start");
  const prior = await claimed;
  const ended = exit(old);
  old.send("crash");
  assert.equal(await ended, 9);
  const children = [child(path), child(path)];
  try {
    await Promise.all(children.map((c) => message(c, "ready")));
    const outcomes = children.map(result);
    children.forEach((c) => c.send("start"));
    const claims = await Promise.all(outcomes);
    assert.equal(claims.filter((c) => c.event === "acquired").length, 1);
    assert.equal(claims.filter((c) => c.code === "PROFILE_IN_USE").length, 1);
    const winner = children[claims.findIndex((c) => c.event === "acquired")],
      released = exit(winner);
    winner.send("release");
    assert.equal(await released, 0);
    const restarted = new Store(path);
    assert.equal(restarted.get("jobs", prior.jobId).status, "interrupted");
    restarted.close();
  } finally {
    for (const c of children) if (c.connected) c.send("release");
  }
});
