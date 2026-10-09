import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { Store } from "../../apps/server/src/store.ts";
import { SecretStore } from "../../apps/server/src/secrets.ts";
const testRoot = join(process.cwd(), ".runtime", "tests");
mkdirSync(testRoot, { recursive: true });
test("restart preserves complete and partial answers, drafts and assistance without restarting inference", () => {
  const dir = mkdtempSync(join(testRoot, "cw2-restart-"));
  let store = new Store(dir);
  const complete = {
      id: randomUUID(),
      idempotencyKey: randomUUID(),
      status: "complete",
      markdown: "Complete answer",
    },
    partial = {
      id: randomUUID(),
      idempotencyKey: randomUUID(),
      status: "streaming",
      markdown: "Partial answer",
    };
  store.insert("generations", complete);
  store.insert("generations", partial);
  store.event(partial.id, { type: "chunk", text: "Partial answer" });
  store.assistance("a", "solution");
  store.db
    .prepare("INSERT INTO drafts VALUES (?,?,?,?,?)")
    .run("a", "python", 1, "code", new Date().toISOString());
  store.close();
  store = new Store(dir);
  assert.equal(store.get("generations", complete.id).status, "complete");
  assert.equal(store.get("generations", partial.id).status, "interrupted");
  assert.equal(store.get("generations", partial.id).markdown, "Partial answer");
  assert.equal(store.events(partial.id, 0).length, 2);
  assert.equal(store.assisted("a"), true);
  assert.equal(store.db.prepare("SELECT code FROM drafts").get()!.code, "code");
  store.close();
});
test("failed credential encryption cannot replace a previously saved credential", () => {
  const dir = mkdtempSync(join(testRoot, "cw2-atomic-")),
    store = new SecretStore(dir);
  store.save("old-not-real-fixture");
  const before = readFileSync(store.secretPath);
  const write = (store as any).atomicWrite;
  (store as any).atomicWrite = () => {
    throw new Error("Simulated disk write failure");
  };
  assert.throws(() => store.save("new-not-real-fixture"));
  assert.deepEqual(readFileSync(store.secretPath), before);
  (store as any).atomicWrite = write;
  assert.equal(store.read(), "old-not-real-fixture");
  store.remove();
});
test("rolled back generation update/event leaves no falsely saved chunk", () => {
  const dir = mkdtempSync(join(testRoot, "cw2-rollback-")),
    store = new Store(dir);
  const g = {
    id: randomUUID(),
    idempotencyKey: randomUUID(),
    status: "streaming",
    markdown: "",
  };
  store.insert("generations", g);
  assert.throws(() =>
    store.tx(() => {
      store.update("generations", { ...g, markdown: "Unsaved" });
      store.event(g.id, { type: "chunk", text: "Unsaved" });
      throw new Error("Disk/commit simulation");
    }),
  );
  assert.equal(store.get("generations", g.id).markdown, "");
  assert.deepEqual(store.events(g.id, 0), []);
  store.close();
});
