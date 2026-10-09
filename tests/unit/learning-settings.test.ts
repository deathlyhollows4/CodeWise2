import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Store, defaultPreferences } from "../../apps/server/src/store.ts";
import { PreferencesSchema } from "../../packages/contracts/src/index.ts";
const root = join(process.cwd(), ".runtime", "tests");
mkdirSync(root, { recursive: true });
test("legacy stored learning preferences gain defaults without changing evidence; malformed new preferences fail before mutation", () => {
  const dir = mkdtempSync(join(root, "learning-prefs-"));
  let store = new Store(dir);
  const old: any = { ...defaultPreferences };
  delete old.focusTopic;
  delete old.reviewPreference;
  delete old.defaultHintDepth;
  store.setMeta("preferences", old);
  const evidence = {
    id: "fixture-evidence",
    problemId: "fixture",
    outcome: "accepted",
  };
  store.db
    .prepare("INSERT INTO evidence VALUES (?,?)")
    .run(evidence.id, JSON.stringify(evidence));
  store.close();
  store = new Store(dir);
  assert.deepEqual(store.meta("preferences"), PreferencesSchema.parse(old));
  assert.equal(store.list("evidence")[0].id, "fixture-evidence");
  store.setMeta("preferences", {
    ...store.meta("preferences"),
    defaultHintDepth: "solution",
  });
  store.close();
  const before = readFileSync(join(dir, "codewise2.sqlite"));
  assert.throws(() => new Store(dir));
  assert.deepEqual(readFileSync(join(dir, "codewise2.sqlite")), before);
});
