import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createApp } from "../../apps/server/src/app.ts";
import {
  LibraryPageSchema,
  JobPageSchema,
  API_VERSION,
} from "../../packages/contracts/src/index.ts";
const root = join(process.cwd(), ".runtime", "tests");
mkdirSync(root, { recursive: true });
const uuid = (i: number) =>
  `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const problem = {
  schemaVersion: 1,
  id: "history-fixture",
  version: "fixture-1",
  slug: "history-fixture",
  title: "Explicit history test fixture",
  primaryTopic: "arrays-hashing",
  skillIds: ["fixture"],
  prerequisites: [],
  step: 1,
  status: "draft",
  statement: "Test fixture, never published.",
  objective: "Test history",
  constraints: [],
  interface: "Fixture",
  visibleCases: [0, 1, 2].map((i) => ({
    id: String(i),
    input: [],
    expected: 0,
    explanation: "Fixture only",
  })),
  starters: { java: "", cpp: "", python: "" },
  sourceIds: ["fixture"],
};
async function harness() {
  const app = createApp({
    dataDir: mkdtempSync(join(root, "history-page-")),
    catalogue: [problem],
    fixture: true,
    internalFixtureIds: [problem.id],
  });
  await new Promise<void>((r) => app.server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(app.server.address() as any).port}`,
    response = await fetch(base + "/api/bootstrap"),
    boot: any = await response.json(),
    cookie = response.headers.get("set-cookie")!.split(";")[0];
  const request = (path: string, method = "GET", body?: any) =>
    fetch(base + "/api/" + path, {
      method,
      headers: {
        Cookie: cookie,
        Origin: base,
        "X-CSRF-Token": boot.csrfToken,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  return { app, request, boot };
}
function seed(
  app: ReturnType<typeof createApp>,
  i: number,
  createdAt = `2026-01-${String(1 + Math.floor((i - 1) / 20)).padStart(2, "0")}T12:00:00.000Z`,
) {
  const markdown =
      "VISIBLE SAVED FIXTURE ".repeat(1400) +
      (i === 1 ? " Über EXACT_BODY_ONLY_MATCH" : ""),
    code =
      "learner fixture source ".repeat(500) +
      (i === 2 ? " Ä_CODE_ONLY_MATCH" : ""),
    id = uuid(i),
    threadId = uuid(9999);
  app.store.insert("generations", {
    id,
    idempotencyKey: id,
    problemId: problem.id,
    problemVersion: problem.version,
    problemSnapshot: problem,
    language: "python",
    code,
    action: "solution",
    prompt: "Fixture prompt",
    threadId,
    version: i,
    title: `Explicit saved fixture ${i}`,
    status: "complete",
    markdown,
    document: null,
    bookmarked: i % 2 === 0,
    notes: i === 3 ? "Ö_NOTE_ONLY_MATCH" : "",
    tags: ["fixture"],
    createdAt,
    finishedAt: createdAt,
    provider: "fixture",
    model: "fixture-model",
    schemaVersion: 1,
    rendererVersion: 1,
    usage: null,
    verification: "not-run",
    contextMessages: [
      {
        role: "system",
        content: "NEVER_SEARCH_OR_RETURN_PRIVATE_REFERENCE".repeat(300),
      },
    ],
  });
  const jobId = uuid(1000 + i);
  app.store.insert("jobs", {
    id: jobId,
    idempotencyKey: jobId,
    problemId: problem.id,
    problemVersion: problem.version,
    problemSnapshot: problem,
    language: i % 2 ? "python" : "java",
    code: "Immutable fixture job code " + i + " ".repeat(3000),
    mode: "submit",
    review: false,
    meaningfulConceptualAttempt: false,
    status: "infrastructure_error",
    createdAt,
    finishedAt: createdAt,
    result: {
      status: "infrastructure_error",
      counts: { total: 3, executed: 0, passed: 0, failed: 0, notRun: 3 },
      diagnostics:
        "Fixture history only; no compilation or execution occurred " + i,
    },
  });
  return { id, jobId, markdown, code };
}
test("projected history pages are bounded, stable across equal timestamps and intervening inserts, and reject wrong-query cursors", async () => {
  const h = await harness();
  try {
    assert.equal(h.boot.apiVersion, API_VERSION);
    for (let i = 1; i <= 65; i++) seed(h.app, i);
    const originalList = h.app.store.list;
    h.app.store.list = () => {
      throw Error("Collection route must not load full stored records");
    };
    const firstResponse = await h.request("library?pageSize=30"),
      raw = await firstResponse.text(),
      first = LibraryPageSchema.parse(JSON.parse(raw));
    assert.equal(first.items.length, 30);
    assert.equal(first.total, 65);
    assert.ok(first.nextCursor);
    assert.ok(
      raw.length < 30000,
      "Summary response remains bounded despite long stored bodies/code/context",
    );
    assert.ok(!raw.includes("NEVER_SEARCH_OR_RETURN_PRIVATE_REFERENCE"));
    for (const item of first.items)
      assert.ok(
        !("markdown" in item) &&
          !("code" in item) &&
          !("contextMessages" in item) &&
          !("notes" in item),
      );
    seed(h.app, 100, "2026-02-01T12:00:00.000Z");
    const second = LibraryPageSchema.parse(
      await (
        await h.request(
          "library?pageSize=30&cursor=" + encodeURIComponent(first.nextCursor!),
        )
      ).json(),
    );
    const third = LibraryPageSchema.parse(
      await (
        await h.request(
          "library?pageSize=30&cursor=" +
            encodeURIComponent(second.nextCursor!),
        )
      ).json(),
    );
    assert.equal(second.items.length, 30);
    assert.equal(third.items.length, 5);
    assert.equal(third.nextCursor, null);
    const all = [...first.items, ...second.items, ...third.items].map(
      (x) => x.id,
    );
    assert.deepEqual(
      all,
      Array.from({ length: 65 }, (_, i) => uuid(65 - i)),
    );
    assert.equal(new Set(all).size, 65);
    assert.ok(!all.includes(uuid(100)));
    const wrong = await h.request(
      "library?pageSize=30&q=changed&cursor=" +
        encodeURIComponent(first.nextCursor!),
    );
    assert.equal(wrong.status, 400);
    assert.equal(((await wrong.json()) as any).code, "CURSOR_INVALID");
    assert.equal(
      (
        await h.request(
          "jobs?pageSize=30&cursor=" + encodeURIComponent(first.nextCursor!),
        )
      ).status,
      400,
    );
    const tampered =
      first.nextCursor!.slice(0, -1) +
      (first.nextCursor!.endsWith("a") ? "b" : "a");
    assert.equal(
      (
        await h.request(
          "library?pageSize=30&cursor=" + encodeURIComponent(tampered),
        )
      ).status,
      400,
    );
    for (const query of [
      "pageSize=101",
      "pageSize=0",
      "from=2026-02-30",
      "from=2026-02-02&to=2026-02-01",
      "language=unsupported",
      "problemId=",
      "topic=",
      "from=",
      "language=",
      "action=",
    ])
      assert.equal((await h.request("library?" + query)).status, 400);
    const jobs = JobPageSchema.parse(
      await (await h.request("jobs?pageSize=20&language=java")).json(),
    );
    assert.equal(jobs.items.length, 20);
    assert.ok(
      jobs.items.every(
        (x) => x.language === "java" && x.counts?.executed === 0,
      ),
    );
    assert.ok(!JSON.stringify(jobs).includes("Immutable fixture job code"));
    h.app.store.list = originalList;
    assert.equal(
      h.app.store.db.prepare("SELECT COUNT(*) AS n FROM assistance").get()?.n,
      1,
      "Visible excerpts dedupe minimal assistance by problem/kind",
    );
    const full: any = await (await h.request("library/" + uuid(1))).json();
    assert.ok(full.markdown.length > 10000);
    assert.ok(full.code.length > 5000);
    assert.ok(!("contextMessages" in full));
    const job: any = await (await h.request("jobs/" + uuid(1001))).json();
    assert.match(job.code, /Immutable fixture job code 1/);
    assert.match(job.result.diagnostics, /no compilation or execution/);
  } finally {
    h.app.close();
  }
});
test("complete Unicode body/code/notes search, filtered versions and full exports survive cursor invalidation without inference", async () => {
  const h = await harness();
  try {
    let target: any;
    for (let i = 1; i <= 65; i++) {
      const value = seed(h.app, i);
      if (i === 1) target = value;
    }
    for (const [q, id] of [
      ["über exact_body_only_match", uuid(1)],
      ["ä_code_only_match", uuid(2)],
      ["ö_note_only_match", uuid(3)],
    ]) {
      const page = LibraryPageSchema.parse(
        await (await h.request("library?q=" + encodeURIComponent(q))).json(),
      );
      assert.equal(page.total, 1);
      assert.equal(page.items[0].id, id);
      assert.ok(page.items[0].searchExcerpt.length <= 400);
      assert.ok(page.items[0].searchExcerpt.toLowerCase().includes(q));
    }
    const privateSearch = LibraryPageSchema.parse(
      await (
        await h.request("library?q=NEVER_SEARCH_OR_RETURN_PRIVATE_REFERENCE")
      ).json(),
    );
    assert.equal(privateSearch.total, 0);
    const empty = h.app.store.get("generations", uuid(65));
    empty.problemId = "title-only-fixture";
    empty.markdown = "";
    empty.title = "TITLE_ONLY_MATCH";
    empty.code = "USER_CODE_ONLY_MATCH";
    empty.status = "failed";
    h.app.store.update("generations", empty);
    const titleOnly = LibraryPageSchema.parse(
      await (await h.request("library?q=TITLE_ONLY_MATCH")).json(),
    );
    assert.equal(titleOnly.total, 1);
    assert.equal(titleOnly.items[0].preview, "");
    assert.equal(h.app.store.assisted("title-only-fixture"), false);
    const emoji = h.app.store.get("generations", uuid(64));
    emoji.markdown =
      "x".repeat(100) + "😀" + "x".repeat(119) + "SURROGATE_NEEDLE";
    h.app.store.update("generations", emoji);
    const emojiPage = LibraryPageSchema.parse(
      await (await h.request("library?q=SURROGATE_NEEDLE")).json(),
    );
    assert.equal(emojiPage.total, 1);
    assert.ok(emojiPage.items[0].searchExcerpt.startsWith("😀"));
    assert.ok(!/[\ud800-\udbff]$/.test(emojiPage.items[0].searchExcerpt));
    const ownCode = LibraryPageSchema.parse(
      await (await h.request("library?q=USER_CODE_ONLY_MATCH")).json(),
    );
    assert.equal(ownCode.total, 1);
    assert.equal(h.app.store.assisted("title-only-fixture"), false);
    assert.equal(
      LibraryPageSchema.parse(
        await (
          await h.request("library?q=" + encodeURIComponent("' OR 1=1 --"))
        ).json(),
      ).total,
      0,
    );
    const versions = LibraryPageSchema.parse(
      await (
        await h.request(
          "library?threadId=" +
            uuid(9999) +
            "&pageSize=10&bookmarked=true&from=2026-01-02&to=2026-01-02",
        )
      ).json(),
    );
    assert.equal(versions.total, 10);
    assert.ok(versions.items.every((x) => x.version % 2 === 0));
    const markdownResponse = await h.request(
      "library/" + target.id + "/export?format=markdown",
    );
    assert.equal(await markdownResponse.text(), target.markdown);
    const json: any = await (
      await h.request("library/" + target.id + "/export?format=json")
    ).json();
    assert.equal(json.markdown, target.markdown);
    assert.equal(json.code, target.code);
    const page = LibraryPageSchema.parse(
      await (await h.request("library?pageSize=10")).json(),
    );
    const reset = await h.request("data/history/reset", "POST", {
      confirmation: "DELETE ALL LESSONS",
    });
    assert.equal(reset.status, 200);
    const expired = await h.request(
      "library?pageSize=10&cursor=" + encodeURIComponent(page.nextCursor!),
    );
    assert.equal(expired.status, 400);
    assert.equal(((await expired.json()) as any).code, "CURSOR_INVALID");
    assert.equal(
      LibraryPageSchema.parse(await (await h.request("library")).json()).total,
      0,
    );
    assert.equal(
      h.app.store.list("evidence").length,
      0,
      "No fixture history entry invents executed mastery",
    );
  } finally {
    h.app.close();
  }
});
