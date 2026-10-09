import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createApp } from "../../apps/server/src/app.ts";
const pack = (id: string) => ({
  schemaVersion: 1,
  id,
  version: "1",
  slug: id,
  title: "Controlled topic projection fixture only",
  primaryTopic: "arrays-hashing",
  skillIds: ["projection-fixture-skill"],
  prerequisites: [],
  step: 1,
  status: "published",
  statement:
    "No learner program or provider is executed in this projection test.",
  objective: "Test distinct evidence counts",
  constraints: ["Fixture only"],
  interface: "solve",
  visibleCases: [1, 2, 3].map((n) => ({
    id: String(n),
    input: [n],
    expected: n,
    explanation: "Fixture only",
  })),
  starters: { java: "java", cpp: "cpp", python: "python" },
  sourceIds: ["fixture"],
});
test("topic projection dedupes independent languages/retries and gives independent priority over prior assisted acceptance", async () => {
  const root = join(process.cwd(), ".runtime", "tests");
  mkdirSync(root, { recursive: true });
  const app = createApp({
    dataDir: mkdtempSync(join(root, "topic-count-")),
    catalogue: [pack("independent-fixture"), pack("assisted-fixture")],
    fixture: true,
  });
  await new Promise<void>((resolve) =>
    app.server.listen(0, "127.0.0.1", resolve),
  );
  const base = `http://127.0.0.1:${(app.server.address() as any).port}`,
    bootstrap = await fetch(base + "/api/bootstrap"),
    cookie = bootstrap.headers.get("set-cookie")!.split(";")[0],
    get = async (path: string) =>
      (
        await fetch(base + path, { headers: { Cookie: cookie } })
      ).json() as Promise<any>;
  const add = (
    problemId: string,
    language: string,
    assisted: boolean,
    advancementEligible = true,
  ) => {
    const id = randomUUID(),
      createdAt = new Date().toISOString();
    app.store.insert("jobs", {
      id,
      idempotencyKey: randomUUID(),
      problemId,
      language,
      mode: "submit",
      code: "Controlled projection marker; not executed",
      status: "accepted",
      createdAt,
      finishedAt: createdAt,
      result: {
        status: "accepted",
        counts: { total: 3, executed: 3, passed: 3, failed: 0, notRun: 0 },
        diagnostics: "Projection fixture only; no execution",
      },
    });
    app.store.db
      .prepare("INSERT INTO evidence VALUES (?,?)")
      .run(
        id,
        JSON.stringify({
          id,
          problemId,
          language,
          step: 1,
          skills: ["projection-fixture-skill"],
          outcome: "accepted",
          assisted,
          review: false,
          advancementEligible,
          createdAt,
          ruleVersion: "fixture-projection-only",
        }),
      );
  };
  const check = async (independent: number, assisted: number) => {
    const topic = (await get("/api/topics")).find(
        (t: any) => t.id === "arrays-hashing",
      ),
      progress = await get("/api/progress");
    assert.deepEqual(
      { independent: topic.independent, assisted: topic.assisted },
      { independent, assisted },
    );
    assert.equal(progress.independent, independent);
    assert.equal(progress.assisted, assisted);
  };
  try {
    await check(0, 0);
    add("independent-fixture", "python", false);
    add("independent-fixture", "java", false, false);
    add("independent-fixture", "cpp", false, false);
    add("independent-fixture", "python", false, false);
    await check(1, 0);
    add("assisted-fixture", "python", true);
    add("assisted-fixture", "java", true, false);
    await check(1, 1);
    add("assisted-fixture", "cpp", false);
    add("assisted-fixture", "cpp", true, false);
    await check(2, 0);
    assert.equal(app.store.list("jobs").length, 8);
    assert.equal(app.store.list("generations").length, 0);
  } finally {
    app.close();
  }
});
