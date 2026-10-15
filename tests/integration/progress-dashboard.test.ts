import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createApp } from "../../apps/server/src/app.ts";
import { ProgressSchema } from "../../packages/contracts/src/index.ts";

test("progress endpoint projects real stored submission metadata with a strict private-data-free dashboard", async () => {
  const root = join(process.cwd(), ".runtime", "tests");
  mkdirSync(root, { recursive: true });
  const app = createApp({
    dataDir: mkdtempSync(join(root, "progress-dashboard-")),
    fixture: true,
    catalogue: [
      {
        schemaVersion: 1,
        id: "progress-fixture",
        version: "1",
        slug: "progress-fixture",
        title: "Controlled progress fixture",
        primaryTopic: "arrays-hashing",
        skillIds: ["sum"],
        prerequisites: [],
        step: 1,
        status: "published",
        statement: "No learner code is executed.",
        objective: "Projection test",
        constraints: [],
        interface: "sum",
        visibleCases: [1, 2, 3].map((n) => ({
          id: String(n),
          input: [n],
          expected: n,
          explanation: "Fixture",
        })),
        starters: { java: "fixture", cpp: "fixture", python: "fixture" },
        sourceIds: ["fixture"],
      },
    ],
  });
  try {
    app.store.setMeta("preferences", {
      ...app.store.meta("preferences"),
      timezone: "Asia/Kolkata",
    });
    const id = randomUUID();
    app.store.insert("jobs", {
      id,
      idempotencyKey: randomUUID(),
      problemId: "progress-fixture",
      language: "python",
      mode: "submit",
      status: "accepted",
      createdAt: "2026-10-12T18:29:59.000Z",
      finishedAt: "2026-10-13T00:00:00.000Z",
      code: "PRIVATE_CODE_SENTINEL",
      problemSnapshot: { privateSuite: "PRIVATE_SUITE_SENTINEL" },
      result: { reasoning: "PRIVATE_REASONING_SENTINEL" },
    });
    app.store.db.prepare("INSERT INTO evidence VALUES (?,?)").run(
      id,
      JSON.stringify({
        id,
        problemId: "progress-fixture",
        language: "python",
        step: 1,
        skills: ["sum"],
        outcome: "accepted",
        assisted: false,
        review: false,
        createdAt: "2026-10-13T00:00:00.000Z",
      }),
    );
    app.store.insert("jobs", {
      id: randomUUID(),
      idempotencyKey: randomUUID(),
      problemId: "progress-fixture",
      language: "java",
      mode: "submit",
      status: "compile_error",
      createdAt: "2026-10-12T18:30:00.000Z",
      code: "PRIVATE_CODE_SENTINEL",
    });
    await new Promise<void>((resolve) =>
      app.server.listen(0, "127.0.0.1", resolve),
    );
    const base = `http://127.0.0.1:${(app.server.address() as { port: number }).port}`;
    const bootstrap = await fetch(base + "/api/bootstrap");
    const cookie = bootstrap.headers.get("set-cookie")!.split(";")[0];
    const response = await fetch(base + "/api/progress", {
      headers: { Cookie: cookie },
    });
    assert.equal(response.status, 200);
    const text = await response.text();
    assert(!text.includes("PRIVATE_"));
    const data = ProgressSchema.parse(JSON.parse(text));
    assert.equal(data.independent, 1);
    assert.equal(data.dashboard!.totalPublished, 1);
    assert.deepEqual(data.dashboard!.problems, [
      {
        id: "progress-fixture",
        title: "Controlled progress fixture",
        topic: "arrays-hashing",
        step: 1,
      },
    ]);
    assert.deepEqual(Object.keys(data.dashboard!.problems[0]).sort(), [
      "id",
      "step",
      "title",
      "topic",
    ]);
    assert.deepEqual(data.dashboard!.activity, [
      { date: "2026-10-12", submissions: 1, accepted: 1 },
      { date: "2026-10-13", submissions: 1, accepted: 0 },
    ]);
    assert.equal(
      data.dashboard!.languages.find((l) => l.language === "java")!.skills[0]
        .status,
      "not_assessed",
    );
    assert.equal(app.store.list("jobs").length, 2);
    assert.equal(app.store.list("generations").length, 0);
  } finally {
    app.close();
  }
});
