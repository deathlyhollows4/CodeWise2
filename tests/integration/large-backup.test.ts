import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { createApp } from "../../apps/server/src/app.ts";
import {
  MAX_BACKUP_BYTES,
  MAX_BACKUP_REQUEST_BYTES,
  serializeBoundedBackup,
} from "../../apps/server/src/backup-limits.ts";
const root = join(process.cwd(), ".runtime", "tests");
mkdirSync(root, { recursive: true });
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const problem = {
  schemaVersion: 1,
  id: "large-backup-fixture",
  version: "1",
  slug: "large-backup-fixture",
  title: "Backup fixture",
  primaryTopic: "arrays-hashing",
  skillIds: ["sum"],
  prerequisites: [],
  step: 1,
  status: "published",
  statement: "Explicit backup fixture only.",
  objective: "Preserve complete records",
  constraints: ["Fixture"],
  interface: "solve",
  visibleCases: [1, 2, 3].map((n) => ({
    id: String(n),
    input: [n],
    expected: n,
    explanation: "Fixture",
  })),
  starters: { java: "", cpp: "", python: "" },
  sourceIds: ["fixture"],
};
async function start(dir = mkdtempSync(join(root, "large-backup-"))) {
  const app = createApp({ dataDir: dir, catalogue: [problem] });
  await new Promise<void>((resolve) =>
    app.server.listen(0, "127.0.0.1", resolve),
  );
  const base = `http://127.0.0.1:${(app.server.address() as any).port}`,
    response = await fetch(base + "/api/bootstrap"),
    boot: any = await response.json(),
    cookie = response.headers.get("set-cookie")!.split(";")[0];
  return {
    app,
    dir,
    request: (route: string, method = "GET", body?: unknown) =>
      fetch(base + "/api/" + route, {
        method,
        headers: {
          Cookie: cookie,
          Origin: base,
          "X-CSRF-Token": boot.csrfToken,
          "Content-Type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
  };
}
test("large complete history exports, previews, restores and survives restart without losing hashes or associations", async () => {
  const source = await start();
  let target = await start();
  try {
    source.app.secrets.save("SOURCE_BACKUP_FIXTURE_KEY_NOT_REAL");
    target.app.secrets.save("TARGET_BACKUP_FIXTURE_KEY_NOT_REAL");
    const targetCredential = readFileSync(target.app.secrets.secretPath);
    const timestamp = new Date().toISOString(),
      code =
        "class Solution:\n    def solve(self, values):\n        total = 0\n        for value in values:\n            total += value\n        return total\n" +
        "# explicit fixture reasoning note\n".repeat(200);
    const prose =
      "A running total describes the values already visited. Start at zero, visit each signed reading once, and keep the invariant after every addition. This paragraph is explicit saved-history test material.\n\n";
    const markdown =
      "# A complete saved explanation\n\n" +
      prose.repeat(350) +
      "```python\n" +
      code +
      "```\n\n| Reading | Previous | Next |\n|---|---:|---:|\n" +
      Array.from(
        { length: 250 },
        (_, i) => `| ${i} | ${(i * (i - 1)) / 2} | ${(i * (i + 1)) / 2} |`,
      ).join("\n");
    let first: any;
    source.app.store.tx(() => {
      for (let index = 0; index < 50; index++) {
        const jobId = randomUUID(),
          threadId = index % 2 ? first.threadId : randomUUID();
        source.app.store.insert("jobs", {
          id: jobId,
          idempotencyKey: randomUUID(),
          problemId: problem.id,
          problemVersion: "1",
          problemSnapshot: problem,
          language: "python",
          code,
          codeHash: hash(code),
          mode: "submit",
          review: false,
          status: "accepted",
          createdAt: timestamp,
          finishedAt: timestamp,
          result: {
            status: "accepted",
            counts: { total: 3, executed: 3, passed: 3, failed: 0, notRun: 0 },
            diagnostics: "Explicit test fixture; no runner execution claim",
          },
        });
        const g = {
          id: randomUUID(),
          idempotencyKey: randomUUID(),
          threadId,
          problemId: problem.id,
          problemVersion: "1",
          problemSnapshot: problem,
          submissionId: jobId,
          parentId: index % 2 ? first.id : undefined,
          version: index % 2 ? 2 : 1,
          language: "python",
          code,
          action: "solution",
          prompt: "Explain the complete solution",
          consent: true,
          status: "complete",
          title: `Complete fixture version ${index}`,
          markdown,
          document: {
            schemaVersion: 1,
            title: "Complete saved fixture",
            markdown,
            sections: [{ id: "answer", kind: "general", markdown }],
            language: "python",
            verification: "not-run",
          },
          bookmarked: index % 2 === 0,
          notes: "Preserve annotations",
          tags: ["fixture"],
          createdAt: timestamp,
          finishedAt: timestamp,
          provider: "fixture",
          model: "fixture-no-inference",
          schemaVersion: 1,
          rendererVersion: 1,
          usage: null,
          verification: "not-run",
          contentHash: hash(markdown),
        };
        source.app.store.insert("generations", g);
        if (index % 2 === 0) first = g;
        source.app.store.event(g.id, { type: "status", status: "complete" });
        source.app.store.db
          .prepare("INSERT INTO evidence VALUES (?,?)")
          .run(
            jobId,
            JSON.stringify({
              id: jobId,
              problemId: problem.id,
              language: "python",
              step: 1,
              skills: ["sum"],
              outcome: "accepted",
              assisted: false,
              review: false,
              createdAt: timestamp,
              advancementEligible: index === 0,
              classification: "independent",
            }),
          );
      }
      source.app.store.db
        .prepare("INSERT INTO drafts VALUES (?,?,?,?,?)")
        .run(problem.id, "python", 7, code, timestamp);
      source.app.store.assistance(problem.id, "solution");
    });
    source.app.store.setMeta("keyMetadata", {
      configured: true,
      masked: "SECRET_METADATA_CANARY",
      status: "fixture",
    });
    source.app.store.setMeta("currentSelection", {
      problemId: problem.id,
      mode: "review",
      selectedAt: timestamp,
    });
    source.app.store.setMeta("problemAnnotations", {
      [problem.id]: {
        bookmarked: true,
        notes: "ordinary note",
        tags: ["backup"],
      },
    });
    const response = await source.request("data/export");
    assert.equal(response.status, 200);
    const exported = await response.text();
    assert.ok(Buffer.byteLength(exported) > 10000000);
    assert.ok(Buffer.byteLength(exported) < MAX_BACKUP_BYTES);
    assert.ok(!exported.includes("SECRET_METADATA_CANARY"));
    assert.ok(!exported.includes("SOURCE_BACKUP_FIXTURE_KEY_NOT_REAL"));
    const path = join(source.dir, "large-learning-backup.json");
    writeFileSync(path, exported);
    const backup = JSON.parse(readFileSync(path, "utf8"));
    const preview = await target.request("data/import/preview", "POST", {
      backup,
    });
    assert.equal(preview.status, 200);
    const validated: any = await preview.json();
    assert.equal(validated.counts.lessons, 50);
    const restored = await target.request("data/import", "POST", {
      backup,
      token: validated.token,
      confirmation: "RESTORE",
    });
    assert.equal(restored.status, 200);
    const profile = target.dir;
    target.app.close();
    target = await start(profile);
    assert.deepEqual(
      readFileSync(target.app.secrets.secretPath),
      targetCredential,
    );
    const after: any = await (await target.request("data/export")).json();
    for (const section of [
      "drafts",
      "jobs",
      "generations",
      "events",
      "assistance",
      "evidence",
      "learningMetadata",
      "usageLedger",
    ])
      assert.deepEqual(
        after[section],
        backup[section],
        `Restored ${section} differs`,
      );
    for (const g of after.generations) {
      assert.equal(hash(g.markdown), g.contentHash);
      assert.equal(hash(g.code), hash(code));
      assert.equal(g.document.markdown, g.markdown);
      assert.ok(after.jobs.some((job: any) => job.id === g.submissionId));
      if (g.parentId)
        assert.ok(
          after.generations.some(
            (parent: any) =>
              parent.id === g.parentId &&
              parent.threadId === g.threadId &&
              parent.version < g.version,
          ),
        );
    }
    const count = target.app.store.list("generations").length;
    const rejected = await target.request("data/import/preview", "POST", {
      backup: { excess: "x".repeat(MAX_BACKUP_REQUEST_BYTES) },
    });
    assert.equal(rejected.status, 413);
    assert.equal(((await rejected.json()) as any).code, "REQUEST_TOO_LARGE");
    assert.equal(target.app.store.list("generations").length, count);
    source.app.store.tx(() => {
      for (let i = 0; i < 100; i++)
        source.app.store.insert("generations", {
          ...first,
          id: randomUUID(),
          idempotencyKey: randomUUID(),
          threadId: randomUUID(),
          version: 1,
          parentId: undefined,
          markdown: "x".repeat(250000),
          contentHash: hash("x".repeat(250000)),
          document: {
            ...first.document,
            markdown: "x".repeat(250000),
            sections: [
              { id: "answer", kind: "general", markdown: "x".repeat(250000) },
            ],
          },
        });
    });
    const oversizedCount = source.app.store.list("generations").length,
      oversized = await source.request("data/export");
    assert.equal(oversized.status, 413);
    assert.equal(((await oversized.json()) as any).code, "BACKUP_TOO_LARGE");
    assert.equal(source.app.store.list("generations").length, oversizedCount);
    assert.equal(
      source.app.store.get("generations", first.id).contentHash,
      hash(markdown),
    );
    const evidence = {
      schemaVersion: 1,
      scenario: "large-raw-json-backup-roundtrip",
      status: "passed",
      command:
        "node --import tsx --test tests/integration/large-backup.test.ts",
      runtime: {
        node: process.version,
        platform: process.platform,
        architecture: process.arch,
      },
      exportedUtf8Bytes: Buffer.byteLength(exported),
      limitBytes: MAX_BACKUP_BYTES,
      lessons: 50,
      jobs: 50,
      drafts: 1,
      linkedVersions: 25,
      unchangedContentHashes: true,
      unchangedCodeHashes: true,
      unchangedRestartAssociations: true,
      sourceSecretsExcluded: true,
      targetCredentialBytesPreserved: true,
      oversizedImportRejected: 413,
      oversizedExportRejected: 413,
      failedLimitsPreserveData: true,
      finishedAt: new Date().toISOString(),
    };
    writeFileSync(
      join(
        process.cwd(),
        "docs",
        "release-evidence",
        "large-backup-roundtrip.json",
      ),
      JSON.stringify(evidence, null, 2),
    );
  } finally {
    source.app.close();
    target.app.close();
  }
});
test("backup byte bounds count UTF-8 rather than string length", () => {
  assert.throws(() => serializeBoundedBackup({ text: "🙂".repeat(10) }, 30), {
    code: "BACKUP_TOO_LARGE",
  });
  assert.equal(
    serializeBoundedBackup({ text: "abc" }, 30),
    ' {"text":"abc"}'.trim(),
  );
});
