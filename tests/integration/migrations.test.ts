import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, mkdtempSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { Store } from "../../apps/server/src/store.ts";
const root = join(process.cwd(), ".runtime", "tests");
mkdirSync(root, { recursive: true });
test("fresh migration reaches schema1 and idempotent reopen preserves learner data", () => {
  const dir = mkdtempSync(join(root, "migrate-"));
  let store = new Store(dir);
  assert.equal(store.db.prepare("PRAGMA user_version").get()!.user_version, 1);
  store.setMeta("test-learner", { name: "preserved" });
  store.close();
  store = new Store(dir);
  assert.deepEqual(store.meta("test-learner"), { name: "preserved" });
  assert.equal(store.db.prepare("PRAGMA user_version").get()!.user_version, 1);
  store.close();
});
test("future schema is refused before database mutation", () => {
  const dir = mkdtempSync(join(root, "future-")),
    path = join(dir, "codewise2.sqlite");
  const db = new DatabaseSync(path);
  db.exec(
    "CREATE TABLE custom(value TEXT);INSERT INTO custom VALUES ('preserved');PRAGMA user_version=99;",
  );
  db.close();
  const before = readFileSync(path);
  assert.throws(() => new Store(dir), /Unsupported database schema version 99/);
  assert.deepEqual(readFileSync(path), before);
});
test("failed schema0 migration rolls back all partial changes and retains original bytes", () => {
  const dir = mkdtempSync(join(root, "failed-")),
    path = join(dir, "codewise2.sqlite");
  const db = new DatabaseSync(path);
  db.exec(
    "CREATE TABLE preserved(value TEXT);INSERT INTO preserved VALUES ('original');CREATE TABLE meta(key TEXT PRIMARY KEY);",
  );
  db.close();
  const before = readFileSync(path);
  assert.throws(() => new Store(dir));
  assert.deepEqual(readFileSync(path), before);
  const check = new DatabaseSync(path);
  assert.equal(check.prepare("PRAGMA user_version").get()!.user_version, 0);
  assert.equal(
    check.prepare("SELECT value FROM preserved").get()!.value,
    "original",
  );
  assert.equal(
    check.prepare("SELECT name FROM sqlite_master WHERE name='drafts'").get(),
    undefined,
  );
  check.close();
});
