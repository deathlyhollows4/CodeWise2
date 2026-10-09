import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createApp } from "../../apps/server/src/app.ts";
const pack = {
  schemaVersion: 1,
  id: "security-fixture",
  version: "1",
  slug: "security-fixture",
  title: "Security fixture only",
  primaryTopic: "arrays-hashing",
  skillIds: ["sum"],
  prerequisites: [],
  step: 1,
  status: "published",
  statement: "Explicit test fixture",
  objective: "Test persistence boundaries",
  constraints: ["Test input only"],
  interface: "solve",
  visibleCases: [1, 2, 3].map((n) => ({
    id: String(n),
    input: [n],
    expected: n,
    explanation: "Test only",
  })),
  starters: { java: "", cpp: "", python: "" },
  sourceIds: ["fixture"],
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function fixture() {
  const fixtureRoot = join(process.cwd(), ".runtime", "tests");
  mkdirSync(fixtureRoot, { recursive: true });
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  let calls = 0;
  const provider = {
    models: async () => ["fixture-model"],
    stream: async (
      _key: any,
      _model: any,
      _messages: any,
      _max: any,
      signal: AbortSignal,
      onChunk: (s: string) => void,
    ) => {
      calls++;
      await gate;
      if (signal.aborted) throw new Error("canceled");
      onChunk("SAVED_CHUNK_CANARY");
      return { usage: { total_tokens: 3 }, finishReason: "stop" };
    },
  };
  const app = createApp({
    dataDir: mkdtempSync(join(fixtureRoot, "cw2-independent-security-")),
    catalogue: [pack],
    provider: provider as any,
  });
  app.secrets.read = () => "test-only-canary";
  app.store.setMeta("preferences", {
    ...app.store.meta("preferences"),
    model: "fixture-model",
  });
  await new Promise<void>((r) => app.server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(app.server.address() as any).port}`;
  const response = await fetch(`${base}/api/bootstrap`);
  const boot: any = await response.json();
  const cookie = response.headers.get("set-cookie")!.split(";")[0];
  const request = (path: string, method = "GET", body?: any) =>
    fetch(`${base}/api/${path}`, {
      method,
      headers: {
        Cookie: cookie,
        Origin: base,
        "X-CSRF-Token": boot.csrfToken,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const generate = () =>
    request("tutor", "POST", {
      problemId: pack.id,
      language: "python",
      code: "",
      action: "hint",
      prompt: "Explain the idea",
      consent: true,
      idempotencyKey: randomUUID(),
    }).then((r) => r.json()) as Promise<any>;
  return { app, base, cookie, request, generate, release, calls: () => calls };
}
test("HTTP SSE never broadcasts a chunk whose transaction COMMIT fails", async () => {
  const h = await fixture();
  const controller = new AbortController();
  try {
    const g = await h.generate();
    const response = await fetch(`${h.base}/api/tutor/${g.id}/events`, {
      headers: { Cookie: h.cookie },
      signal: controller.signal,
    });
    const reader = response.body!.getReader();
    let received = "";
    const read = (async () => {
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          received += new TextDecoder().decode(value);
        }
      } catch {}
    })();
    const original = h.app.store.db.exec.bind(h.app.store.db);
    let failed = false;
    (h.app.store.db as any).exec = (sql: string) => {
      if (sql === "COMMIT" && !failed) {
        failed = true;
        throw new Error("FORCED_TEST_COMMIT_FAILURE");
      }
      return original(sql);
    };
    h.release();
    await wait(100);
    controller.abort();
    await read;
    assert.ok(failed, "adversarial failure hook executed");
    assert.doesNotMatch(
      received,
      /"type":"chunk".*SAVED_CHUNK_CANARY/,
      "uncommitted chunk must not reach HTTP subscriber",
    );
    const saved: any = await (await h.request(`library/${g.id}`)).json();
    assert.ok(["failed", "interrupted"].includes(saved.status));
    assert.equal(h.calls(), 1);
    assert.equal((await h.request(`library/${g.id}`)).status, 200);
    assert.equal(h.calls(), 1, "reopening cannot call provider");
  } finally {
    controller.abort();
    h.app.close();
  }
});
test("deleting active generation prevents released provider text reappearing", async () => {
  const h = await fixture();
  try {
    const g = await h.generate();
    assert.equal(
      (await h.request(`library/${g.id}`, "DELETE", { confirmation: "DELETE" }))
        .status,
      200,
    );
    h.release();
    await wait(80);
    assert.equal((await h.request(`library/${g.id}`)).status, 404);
    const record = h.app.store.get("generations", g.id);
    assert.equal(record.markdown, "");
    assert.ok(record.deletedAt);
    assert.equal(h.app.store.events(g.id, 0).length, 0);
    const list: any = await (await h.request("library")).json();
    assert.equal(list.items.length, 0);
    assert.equal(list.total, 0);
  } finally {
    h.app.close();
  }
});
test("fresh and repeat bootstrap retains multitab csrf and rejects stale draft write", async () => {
  const h = await fixture();
  try {
    const first: any = await (await h.request("bootstrap")).json();
    const second: any = await (await h.request("bootstrap")).json();
    assert.equal(first.csrfToken, second.csrfToken);
    assert.equal(
      (
        await h.request(`drafts/${pack.id}/python`, "PUT", {
          code: "first tab",
          revision: 0,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await h.request(`drafts/${pack.id}/python`, "PUT", {
          code: "stale second tab",
          revision: 0,
        })
      ).status,
      409,
    );
    const draft: any = await (
      await h.request(`drafts/${pack.id}/python`)
    ).json();
    assert.equal(draft.code, "first tab");
    assert.equal(h.calls(), 0);
  } finally {
    h.release();
    h.app.close();
  }
});
