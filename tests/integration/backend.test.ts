import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { createApp } from "../../apps/server/src/app.ts";
import { DeepSeek } from "../../apps/server/src/deepseek.ts";
import {
  StoredGenerationSchema,
  BackupSchema,
} from "../../apps/server/src/backup.ts";
import { publicGeneration } from "../../apps/server/src/tutor-context.ts";
import {
  EXPECTED_QUESTIONS,
  TopicQuotas,
} from "../../packages/contracts/src/index.ts";
const testRoot = join(process.cwd(), ".runtime", "tests");
mkdirSync(testRoot, { recursive: true });
const pack = {
  schemaVersion: 1,
  id: "test-sum",
  version: "1",
  slug: "test-sum",
  title: "Test fixture only",
  primaryTopic: "arrays-hashing",
  skillIds: ["sum"],
  prerequisites: [],
  step: 1,
  status: "published",
  statement: "Test-only fixture.",
  objective: "Test integration",
  constraints: ["Valid test input"],
  interface: "sum",
  visibleCases: [
    { id: "1", input: [1], expected: 1, explanation: "Fixture" },
    { id: "2", input: [], expected: 0, explanation: "Fixture" },
    { id: "3", input: [-1], expected: -1, explanation: "Fixture" },
  ],
  starters: { java: "java", cpp: "cpp", python: "python" },
  sourceIds: ["test-fixture"],
};
async function harness(
  provider?: DeepSeek,
  judge?: any,
  catalogue: any[] = [pack],
  existingDir?: string,
  fixture = !!judge,
) {
  const dir = existingDir ?? mkdtempSync(join(testRoot, "cw2-test-")),
    app = createApp({
      dataDir: dir,
      catalogue,
      provider,
      judge,
      fixture,
    });
  await new Promise<void>((r) => app.server.listen(0, "127.0.0.1", r));
  const addr = app.server.address() as any,
    base = `http://127.0.0.1:${addr.port}`;
  const b = await fetch(base + "/api/bootstrap"),
    boot = (await b.json()) as any,
    cookie = b.headers.get("set-cookie")!.split(";")[0];
  const request = async (
    path: string,
    method = "GET",
    data?: any,
    headers?: Record<string, string>,
  ) =>
    fetch(base + path, {
      method,
      headers: {
        Cookie: cookie,
        Origin: base,
        "X-CSRF-Token": boot.csrfToken,
        "Content-Type": "application/json",
        ...headers,
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  return { dir, app, base, boot, cookie, request, close: () => app.close() };
}

test("incomplete tutor setup cannot reserve usage or create empty saved lessons", async () => {
  let calls = 0;
  const h = await harness(
    new DeepSeek((async () => {
      calls++;
      throw new Error("must not dispatch");
    }) as typeof fetch),
  );
  try {
    const request = () =>
      h.request("/api/tutor", "POST", {
        problemId: "test-sum",
        language: "java",
        code: "",
        action: "hint",
        prompt: "A small hint",
        consent: true,
        idempotencyKey: randomUUID(),
      });
    const missingKey = await request();
    assert.equal(missingKey.status, 409);
    assert.equal((await missingKey.json()).code, "NO_KEY");
    h.app.secrets.read = () => "test-fixture-not-a-real-key";
    const missingModel = await request();
    assert.equal(missingModel.status, 409);
    const error = await missingModel.json();
    assert.equal(error.code, "NO_MODEL");
    assert.match(error.recoveryAction, /Settings/);
    assert.equal(h.app.store.list("generations").length, 0);
    assert.equal(
      h.app.store.db.prepare("SELECT COUNT(*) AS n FROM assistance").get()?.n,
      0,
    );
    const settings = await (await h.request("/api/settings")).json();
    assert.equal(settings.usage.requests, 0);
    assert.equal(calls, 0);
  } finally {
    h.close();
  }
});
test("tiny provider chunks persist bounded batches, snapshot reconnect and cancellation flush", async () => {
  const text = "x".repeat(30000);
  let cancelMode = false,
    delivered!: () => void;
  let deliveredPromise = new Promise<void>((resolve) => {
    delivered = resolve;
  });
  const provider = {
    stream: async (
      _key: any,
      _model: any,
      _messages: any,
      _limit: any,
      signal: AbortSignal,
      onChunk: (text: string) => void,
    ) => {
      if (!cancelMode) {
        for (const char of text) onChunk(char);
        return {
          finishReason: "stop",
          usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
        };
      }
      onChunk("short saved partial");
      delivered();
      await new Promise((_, reject) =>
        signal.addEventListener("abort", () => reject(new Error("canceled")), {
          once: true,
        }),
      );
      return { finishReason: "stop" };
    },
  };
  const h = await harness(provider as any);
  h.app.secrets.read = () => "fixture-only-key";
  h.app.store.setMeta("preferences", {
    ...h.app.store.meta("preferences"),
    model: "fixture-model",
    dailyTokens: 1000000,
  });
  const input = () => ({
    problemId: pack.id,
    language: "python",
    code: "",
    action: "hint",
    prompt: "fixture",
    consent: true,
    idempotencyKey: randomUUID(),
  });
  try {
    const first: any = await (
      await h.request("/api/tutor", "POST", input())
    ).json();
    for (
      let i = 0;
      i < 100 && h.app.store.get("generations", first.id).status !== "complete";
      i++
    )
      await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(h.app.store.get("generations", first.id).markdown, text);
    const events = h.app.store.events(first.id, 0);
    assert.equal(events.filter((event) => event.type === "chunk").length, 4);
    for (let i = 0; i < 150; i++)
      h.app.store.tx(() =>
        h.app.store.event(first.id, { type: "status", status: "complete" }),
      );
    const connection = new AbortController();
    const response = await fetch(
      h.base + `/api/tutor/${first.id}/events?after=1`,
      { headers: { Cookie: h.cookie }, signal: connection.signal },
    );
    const firstRead = await response.body!.getReader().read();
    connection.abort();
    const snapshot = JSON.parse(
      new TextDecoder().decode(firstRead.value).split("data: ")[1].trim(),
    );
    assert.equal(snapshot.type, "snapshot");
    assert.equal(snapshot.text, text);
    assert.equal(snapshot.status, "complete");
    cancelMode = true;
    deliveredPromise = new Promise<void>((resolve) => {
      delivered = resolve;
    });
    const second: any = await (
      await h.request("/api/tutor", "POST", input())
    ).json();
    await deliveredPromise;
    const canceled: any = await (
      await h.request(`/api/tutor/${second.id}/cancel`, "POST", {})
    ).json();
    assert.equal(canceled.status, "canceled");
    assert.equal(canceled.markdown, "short saved partial");
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(
      h.app.store.get("generations", second.id).markdown,
      "short saved partial",
    );
    assert.ok(
      h.app.store
        .events(second.id, 0)
        .some(
          (event) =>
            event.type === "chunk" && event.text === "short saved partial",
        ),
    );
  } finally {
    h.close();
  }
});
test("real HTTP session, CSRF, Host, method controls and conflict detection", async () => {
  const h = await harness();
  try {
    assert.equal(h.boot.catalogue.expected, EXPECTED_QUESTIONS);
    const topics: any = await (await h.request("/api/topics")).json();
    assert.deepEqual(
      topics.map((t: any) => [t.id, t.name, t.quota]),
      TopicQuotas,
    );
    const second = await h.request("/api/bootstrap");
    assert.equal(((await second.json()) as any).csrfToken, h.boot.csrfToken);
    assert.equal(second.headers.get("set-cookie"), null);
    assert.equal(
      (
        await h.request(
          "/api/settings",
          "PUT",
          { displayName: "N" },
          { "X-CSRF-Token": "bad" },
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await h.request(
          "/api/settings",
          "PUT",
          { displayName: "N" },
          { Origin: "https://attacker.invalid" },
        )
      ).status,
      403,
    );
    const d = (await (
      await h.request("/api/drafts/test-sum/python")
    ).json()) as any;
    assert.equal(d.revision, 0);
    assert.equal(
      (
        await h.request("/api/drafts/test-sum/python", "PUT", {
          code: "saved",
          revision: 0,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await h.request("/api/drafts/test-sum/python", "PUT", {
          code: "stale",
          revision: 0,
        })
      ).status,
      409,
    );
    assert.equal((await h.request("/api/jobs/missing/cancel")).status, 405);
    assert.equal(
      (await h.request("/api/settings/key/test", "GET")).status,
      405,
    );
  } finally {
    h.close();
  }
});
test("encrypted key lifecycle never reads plaintext and provider failures remain sanitized", async () => {
  const provider = new DeepSeek(
      (async () => new Response("{}", { status: 401 })) as typeof fetch,
    ),
    h = await harness(provider);
  try {
    const secret = "test-fixture-credential-not-real";
    assert.equal(
      (await h.request("/api/settings/key", "PUT", { key: secret })).status,
      200,
    );
    assert.ok(
      !readFileSync(join(h.dir, "deepseek.secret")).toString().includes(secret),
    );
    assert.equal(h.app.secrets.read(), secret);
    const settings = await (await h.request("/api/settings")).text();
    assert.ok(!settings.includes(secret));
    const bad = await h.request("/api/settings/key/test", "POST", {});
    assert.equal(bad.status, 502);
    assert.ok(!(await bad.text()).includes(secret));
    assert.equal(
      (
        await h.request("/api/settings/key", "PUT", {
          key: "replacement-fixture",
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await h.request("/api/settings/key", "DELETE", {
          confirmation: "REMOVE",
        })
      ).status,
      200,
    );
    assert.equal(h.app.secrets.read(), null);
  } finally {
    h.close();
  }
});
test("immutable idempotent jobs and unavailable runner produce no fake evidence", async () => {
  const h = await harness();
  try {
    const input = {
      problemId: "test-sum",
      language: "python",
      code: "immutable",
      mode: "submit",
      idempotencyKey: randomUUID(),
    };
    const first = (await (
      await h.request("/api/jobs", "POST", input)
    ).json()) as any;
    const again = (await (
      await h.request("/api/jobs", "POST", { ...input, code: "new edit" })
    ).json()) as any;
    assert.equal(first.id, again.id);
    await new Promise((r) => setTimeout(r, 50));
    const saved = (await (
      await h.request("/api/jobs/" + first.id)
    ).json()) as any;
    assert.equal(saved.code, "immutable");
    assert.equal(saved.status, "infrastructure_error");
    assert.equal(
      ((await (await h.request("/api/progress")).json()) as any).evidence
        .length,
      0,
    );
  } finally {
    h.close();
  }
});
test("stream fixture durable output, replay, library no inference and secret-free backup restore", async () => {
  let calls = 0;
  const provider = new DeepSeek((async (url: any) => {
    calls++;
    if (String(url).endsWith("/models"))
      return Response.json({ data: [{ id: "fixture-model" }] });
    return new Response(
      "data: " +
        JSON.stringify({
          choices: [
            {
              delta: {
                content:
                  "# Key idea\n\nKeep a running sum.\n```python\nx = 1\n```",
              },
              finish_reason: null,
            },
          ],
        }) +
        "\n\ndata: " +
        JSON.stringify({
          choices: [{ delta: {}, finish_reason: "stop" }],
          usage: { total_tokens: 20 },
        }) +
        "\n\ndata: [DONE]\n\n",
      { headers: { "Content-Type": "text/event-stream" } },
    );
  }) as typeof fetch);
  const h = await harness(provider);
  try {
    await h.request("/api/settings/key", "PUT", { key: "test-not-real-key" });
    await h.request("/api/settings/key/test", "POST", {});
    await h.request("/api/settings", "PUT", { model: "fixture-model" });
    const input = {
      problemId: "test-sum",
      language: "python",
      code: "x=1",
      action: "hint",
      prompt: "A small hint",
      consent: true,
      idempotencyKey: randomUUID(),
    };
    const g = (await (
      await h.request("/api/tutor", "POST", input)
    ).json()) as any;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 20));
      if (h.app.store.get("generations", g.id).status === "complete") break;
    }
    const saved = (await (
      await h.request("/api/library/" + g.id)
    ).json()) as any;
    assert.equal(saved.status, "complete");
    assert.ok(saved.markdown.includes("running sum"));
    assert.ok(h.app.store.events(g.id, 0).some((e) => e.type === "chunk"));
    assert.equal(calls, 2);
    await h.request("/api/library?q=running");
    await h.request("/api/library/" + g.id);
    assert.equal(calls, 2);
    const backup = (await (await h.request("/api/data/export")).json()) as any;
    assert.ok(!JSON.stringify(backup).includes("test-not-real-key"));
    const preview = (await (
      await h.request("/api/data/import/preview", "POST", { backup })
    ).json()) as any;
    assert.ok(preview.token);
    const restored = await h.request("/api/data/import", "POST", {
      backup,
      token: preview.token,
      confirmation: "RESTORE",
    });
    assert.equal(restored.status, 200);
    assert.equal(
      ((await (await h.request("/api/library/" + g.id)).json()) as any)
        .markdown,
      saved.markdown,
    );
    assert.ok(h.app.store.assisted("test-sum"));
  } finally {
    h.close();
  }
});

test("failed tutor before visible output preserves independence; saved partial records assistance", async () => {
  for (const partial of [false, true]) {
    const provider = new DeepSeek((async () =>
      partial
        ? new Response(
            "data: " +
              JSON.stringify({
                choices: [{ delta: { content: "A useful strategy clue." } }],
              }) +
              "\n\n",
          )
        : new Response("{}", { status: 401 })) as typeof fetch);
    const h = await harness(provider);
    try {
      h.app.secrets.read = () => "fixture-secret-never-live";
      h.app.store.setMeta("preferences", {
        ...h.app.store.meta("preferences"),
        model: "fixture-model",
      });
      const input = {
        problemId: "test-sum",
        language: "python",
        code: "",
        action: "hint",
        prompt: "Help",
        consent: true,
        idempotencyKey: randomUUID(),
      };
      const g = (await (
        await h.request("/api/tutor", "POST", input)
      ).json()) as any;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 10));
        if (
          ["failed", "interrupted"].includes(
            h.app.store.get("generations", g.id).status,
          )
        )
          break;
      }
      assert.equal(h.app.store.assisted("test-sum"), partial);
      assert.equal(
        h.app.store.get("generations", g.id).status,
        partial ? "interrupted" : "failed",
      );
    } finally {
      h.close();
    }
  }
});

test("failed empty answers retain provider token usage and cost without recording teaching or reasoning", async () => {
  const provider = new DeepSeek(
    (async () =>
      new Response(
        'data: {"choices":[{"delta":{"reasoning_content":"private fixture reasoning"},"finish_reason":"length"}],"usage":{"prompt_tokens":13,"completion_tokens":128,"total_tokens":141,"secret":"must be dropped"}}\n\ndata: [DONE]\n\n',
      )) as typeof fetch,
  );
  const h = await harness(provider);
  try {
    h.app.secrets.read = () => "fixture-only-key";
    h.app.store.setMeta("preferences", {
      ...h.app.store.meta("preferences"),
      model: "deepseek-flash",
    });
    const response = await h.request("/api/tutor", "POST", {
      problemId: "test-sum",
      language: "java",
      code: "",
      action: "hint",
      prompt: "A small hint",
      consent: true,
      idempotencyKey: randomUUID(),
    });
    assert.equal(response.status, 202);
    const initial: any = await response.json();
    for (
      let i = 0;
      i < 30 && h.app.store.get("generations", initial.id).status !== "failed";
      i++
    )
      await new Promise((resolve) => setTimeout(resolve, 10));
    const g = h.app.store.get("generations", initial.id);
    assert.equal(g.status, "failed");
    assert.equal(g.error.code, "EMPTY_RESPONSE");
    assert.deepEqual(g.usage, {
      prompt_tokens: 13,
      completion_tokens: 128,
      total_tokens: 141,
    });
    assert.equal(g.finishReason, "length");
    assert.ok(g.estimatedCostUsd > 0);
    assert.equal(h.app.store.assisted("test-sum"), false);
    const savedText = await (await h.request("/api/library/" + g.id)).text();
    assert.ok(!savedText.includes("private fixture reasoning"));
    assert.ok(!savedText.includes("must be dropped"));
    const settings: any = await (await h.request("/api/settings")).json();
    assert.equal(settings.usage.knownTokens, 141);
    assert.equal(settings.usage.tokenMissingRequests, 0);
    assert.equal(settings.usage.costKnown, true);
  } finally {
    h.close();
  }
});

test("saved key connectivity status tracks failure while unsaved tests and replacements preserve identity boundaries", async () => {
  let responseStatus = 200;
  const provider = new DeepSeek((async () =>
    responseStatus === 200
      ? Response.json({ data: [{ id: "fixture-model" }] })
      : new Response("{}", { status: responseStatus })) as typeof fetch);
  const h = await harness(provider);
  try {
    await h.request("/api/settings/key", "PUT", {
      key: "old-not-real-fixture",
    });
    await h.request("/api/settings/key/test", "POST", {});
    let settings = (await (await h.request("/api/settings")).json()) as any;
    assert.equal(settings.key.status, "verified");
    const successful = settings.key.lastChecked;
    assert.deepEqual(settings.models, ["fixture-model"]);
    responseStatus = 401;
    await h.request("/api/settings/key/test", "POST", {
      key: "unsaved-not-real-fixture",
    });
    settings = (await (await h.request("/api/settings")).json()) as any;
    assert.equal(settings.key.status, "verified");
    await h.request("/api/settings/key/test", "POST", {});
    settings = (await (await h.request("/api/settings")).json()) as any;
    assert.equal(settings.key.status, "invalid");
    assert.equal(settings.key.lastChecked, successful);
    responseStatus = 503;
    await h.request("/api/settings/key/test", "POST", {});
    settings = (await (await h.request("/api/settings")).json()) as any;
    assert.equal(settings.key.status, "unreachable");
    assert.equal(settings.key.lastChecked, successful);
    responseStatus = 429;
    await h.request("/api/settings/key/test", "POST", {});
    settings = (await (await h.request("/api/settings")).json()) as any;
    assert.equal(settings.key.status, "rate_limited");
    await h.request("/api/settings/key", "PUT", {
      key: "new-not-real-fixture",
      replace: true,
    });
    settings = (await (await h.request("/api/settings")).json()) as any;
    assert.equal(settings.key.status, "saved_unverified");
    assert.deepEqual(settings.models, []);
    assert.equal(settings.preferences.model, "");
    await h.request("/api/settings/key", "DELETE", { confirmation: "REMOVE" });
    assert.deepEqual(
      ((await (await h.request("/api/settings")).json()) as any).models,
      [],
    );
  } finally {
    h.close();
  }
});
test("ordinary problem notes and bookmarks require no key and catalogue filters use saved state", async () => {
  const h = await harness();
  try {
    let r = await h.request("/api/problems/test-sum/state", "PATCH", {
      bookmarked: true,
      notes: "My accumulator note",
    });
    assert.equal(r.status, 200);
    assert.equal(((await r.json()) as any).bookmarked, true);
    assert.equal(
      (
        (await (
          await h.request("/api/problems?bookmarked=true")
        ).json()) as any[]
      ).length,
      1,
    );
    assert.equal(
      (
        (await (
          await h.request("/api/problems?completion=solved")
        ).json()) as any[]
      ).length,
      0,
    );
  } finally {
    h.close();
  }
});

test("lesson deletion cannot reset usage caps or reuse a deleted paid request id", async () => {
  let calls = 0;
  const provider = new DeepSeek((async () => {
    calls++;
    return new Response(
      "data: " +
        JSON.stringify({
          choices: [{ delta: { content: "Saved hint." }, finish_reason: null }],
        }) +
        "\n\ndata: " +
        JSON.stringify({
          choices: [{ delta: {}, finish_reason: "stop" }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }) +
        "\n\n",
    );
  }) as typeof fetch);
  const h = await harness(provider);
  try {
    h.app.secrets.read = () => "fixture-key";
    h.app.store.setMeta("preferences", {
      ...h.app.store.meta("preferences"),
      model: "fixture-model",
      dailyRequests: 1,
    });
    const input = {
      problemId: "test-sum",
      language: "python",
      code: "",
      action: "hint",
      prompt: "Help",
      consent: true,
      idempotencyKey: randomUUID(),
    };
    const g = (await (
      await h.request("/api/tutor", "POST", input)
    ).json()) as any;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 10));
      if (h.app.store.get("generations", g.id).status === "complete") break;
    }
    assert.equal(calls, 1);
    assert.equal(
      ((await (await h.request("/api/settings")).json()) as any).usage.requests,
      1,
    );
    await h.request("/api/library/" + g.id, "DELETE", {
      confirmation: "DELETE",
    });
    await h.request("/api/data/history/reset", "POST", {
      confirmation: "DELETE ALL LESSONS",
    });
    assert.equal(
      ((await (await h.request("/api/settings")).json()) as any).usage.requests,
      1,
    );
    assert.equal((await h.request("/api/tutor", "POST", input)).status, 409);
    assert.equal(
      (
        await h.request("/api/tutor", "POST", {
          ...input,
          idempotencyKey: randomUUID(),
        })
      ).status,
      429,
    );
    assert.equal(calls, 1);
    assert.equal(h.app.store.meta("tutorUsage").length, 1);
    const backup = (await (await h.request("/api/data/export")).json()) as any;
    assert.equal(backup.usageLedger.length, 1);
    assert.equal(backup.generations.length, 0);
    const older = { ...backup, usageLedger: [] };
    const preview = (await (
      await h.request("/api/data/import/preview", "POST", { backup: older })
    ).json()) as any;
    assert.equal(
      (
        await h.request("/api/data/import", "POST", {
          backup: older,
          token: preview.token,
          confirmation: "RESTORE",
        })
      ).status,
      200,
    );
    assert.equal(
      ((await (await h.request("/api/settings")).json()) as any).usage.requests,
      1,
    );
    assert.equal(
      (
        await h.request("/api/tutor", "POST", {
          ...input,
          idempotencyKey: randomUUID(),
        })
      ).status,
      429,
    );
    assert.equal(calls, 1);
  } finally {
    h.close();
  }
});

test("tutor reservation includes the immutable larger submission code and approved feedback", async () => {
  let calls = 0;
  const provider = new DeepSeek((async () => {
    calls++;
    throw Error("Should not dispatch");
  }) as typeof fetch);
  const h = await harness(provider);
  try {
    h.app.secrets.read = () => "fixture-key";
    h.app.store.setMeta("preferences", {
      ...h.app.store.meta("preferences"),
      model: "fixture-model",
      dailyTokens: 10000,
    });
    const id = randomUUID();
    h.app.store.insert("jobs", {
      id,
      idempotencyKey: randomUUID(),
      problemId: "test-sum",
      problemVersion: "1",
      language: "python",
      code: "x".repeat(12000),
      mode: "submit",
      review: false,
      status: "wrong_answer",
      createdAt: new Date().toISOString(),
      result: {
        status: "wrong_answer",
        counts: { total: 3, executed: 3, passed: 0, failed: 3, notRun: 0 },
        diagnostics: "Observed feedback ".repeat(500),
      },
    });
    const response = await h.request("/api/tutor", "POST", {
      problemId: "test-sum",
      language: "python",
      code: "",
      submissionId: id,
      action: "error",
      prompt: "Explain",
      consent: true,
      idempotencyKey: randomUUID(),
    });
    assert.equal(response.status, 429);
    assert.equal(calls, 0);
    assert.equal(h.app.store.list("generations").length, 0);
  } finally {
    h.close();
  }
});
test("captured generation model and output bound survive a deliberate storage fixture preference change before dispatch", async () => {
  let body: any;
  const provider = new DeepSeek((async (_url: any, init: any) => {
    body = JSON.parse(init.body);
    return new Response(
      "data: " +
        JSON.stringify({
          choices: [
            {
              delta: { content: "Short fixture answer." },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }) +
        "\n\n",
    );
  }) as typeof fetch);
  const h = await harness(provider);
  try {
    h.app.store.setMeta("preferences", {
      ...h.app.store.meta("preferences"),
      model: "captured-model",
      maxOutputTokens: 128,
    });
    h.app.secrets.read = () => {
      h.app.store.setMeta("preferences", {
        ...h.app.store.meta("preferences"),
        model: "changed-model",
        maxOutputTokens: 4096,
      });
      return "fixture-key";
    };
    const g = (await (
      await h.request("/api/tutor", "POST", {
        problemId: "test-sum",
        language: "python",
        code: "",
        action: "hint",
        prompt: "Help",
        consent: true,
        idempotencyKey: randomUUID(),
      })
    ).json()) as any;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 10));
      if (h.app.store.get("generations", g.id).status === "complete") break;
    }
    assert.equal(body.model, "captured-model");
    assert.equal(body.max_tokens, 128);
    assert.equal(h.app.store.get("generations", g.id).maxOutputTokens, 128);
  } finally {
    h.close();
  }
});

test("durable queue does not execute an already leased queued job twice while health awaits", async () => {
  const counts = new Map<string, number>();
  const judge = {
    readiness: async () => {
      await new Promise((r) => setTimeout(r, 60));
      return {
        ready: true,
        controlsVerified: true,
        languages: [],
        message: "Explicit fixture",
      };
    },
    judgePack: async ({ code }: any) => {
      counts.set(code, (counts.get(code) ?? 0) + 1);
      return {
        status: "accepted",
        counts: { total: 3, executed: 3, passed: 3, failed: 0, notRun: 0 },
        diagnostics: "Fixture only",
      };
    },
  };
  const h = await harness(undefined, judge);
  try {
    const base = { problemId: "test-sum", language: "python", mode: "submit" };
    await h.request("/api/jobs", "POST", {
      ...base,
      code: "first",
      idempotencyKey: randomUUID(),
    });
    await h.request("/api/jobs", "POST", {
      ...base,
      code: "second",
      idempotencyKey: randomUUID(),
    });
    await new Promise((r) => setTimeout(r, 200));
    assert.equal(counts.get("first"), 1);
    assert.equal(counts.get("second"), 1);
  } finally {
    h.close();
  }
});
test("cancellation preserves actual partial accounting without awarding learning evidence", async () => {
  const judge = {
    readiness: async () => ({
      ready: true,
      controlsVerified: true,
      languages: [],
      message: "Explicit fixture",
    }),
    judgePack: async () => {
      await new Promise((r) => setTimeout(r, 60));
      return {
        status: "canceled",
        counts: { total: 203, executed: 3, passed: 3, failed: 0, notRun: 200 },
        diagnostics: "Fixture canceled after visible phase",
      };
    },
  };
  const h = await harness(undefined, judge);
  try {
    const job = (await (
      await h.request("/api/jobs", "POST", {
        problemId: "test-sum",
        language: "python",
        code: "x",
        mode: "submit",
        idempotencyKey: randomUUID(),
      })
    ).json()) as any;
    await h.request("/api/jobs/" + job.id + "/cancel", "POST", {});
    await new Promise((r) => setTimeout(r, 120));
    const saved = (await (
      await h.request("/api/jobs/" + job.id)
    ).json()) as any;
    assert.equal(saved.status, "canceled");
    assert.equal(saved.result.counts.executed, 3);
    assert.equal(saved.result.counts.notRun, 200);
    assert.equal(h.app.store.list("evidence").length, 0);
  } finally {
    h.close();
  }
});

test("pending original topic survives repeated recommendations after a cross-topic teacher succeeds", async () => {
  const c = [
    {
      ...pack,
      id: "tp-original",
      primaryTopic: "two-pointers",
      step: 2,
      skillIds: ["pairs"],
      nextIds: ["tp-next"],
      remedialIds: ["array-teacher"],
    },
    {
      ...pack,
      id: "tp-next",
      primaryTopic: "two-pointers",
      step: 3,
      skillIds: ["advanced-pairs"],
      prerequisites: ["signed"],
      remedialIds: ["array-teacher"],
    },
    { ...pack, id: "array-teacher", skillIds: ["signed"] },
  ];
  const judge = {
    readiness: async () => ({
      ready: true,
      controlsVerified: true,
      languages: [],
      message: "Explicit fixture",
    }),
    judgePack: async () => ({
      status: "accepted",
      counts: { total: 3, executed: 3, passed: 3, failed: 0, notRun: 0 },
      diagnostics: "Fixture only",
    }),
  };
  const h = await harness(undefined, judge, c);
  try {
    const submit = async (problemId: string) => {
      const job = (await (
        await h.request("/api/jobs", "POST", {
          problemId,
          language: "python",
          code: "fixture",
          mode: "submit",
          idempotencyKey: randomUUID(),
        })
      ).json()) as any;
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 10));
        if (h.app.store.get("jobs", job.id).status === "accepted") break;
      }
    };
    await submit("tp-original");
    let r = (await (await h.request("/api/recommendation")).json()) as any;
    assert.equal(r.problemId, "array-teacher");
    assert.equal(r.pendingStep, 3);
    await h.request("/api/learning/select", "POST", {
      problemId: "array-teacher",
      mode: "manual",
    });
    await submit("array-teacher");
    r = (await (await h.request("/api/recommendation")).json()) as any;
    assert.equal(r.problemId, "tp-next");
    r = (await (await h.request("/api/recommendation")).json()) as any;
    assert.equal(r.problemId, "tp-next");
    assert.equal(h.app.store.meta("pendingChallenge").topic, "two-pointers");
    await h.request("/api/learning/select", "POST", {
      problemId: "tp-next",
      mode: "manual",
    });
    await submit("tp-next");
    r = (await (await h.request("/api/recommendation")).json()) as any;
    assert.equal(r.focusTopic, "two-pointers");
    assert.equal(r.requestedStep, 4);
    assert.equal(h.app.store.meta("pendingChallenge"), null);
  } finally {
    h.close();
  }
});
test("durable assisted bridge survives refresh, teacher navigation, backup and restart before independent checkpoint advancement", async () => {
  const c = [
    { ...pack, id: "foundation", skillIds: ["base"] },
    {
      ...pack,
      id: "original",
      step: 3,
      skillIds: ["source"],
      prerequisites: ["base"],
      checkpointIds: ["z-checkpoint"],
      remedialIds: ["teacher"],
      nextIds: ["harder"],
    },
    {
      ...pack,
      id: "teacher",
      primaryTopic: "bit-manipulation",
      skillIds: ["missing"],
      prerequisites: ["base"],
    },
    {
      ...pack,
      id: "a-other-checkpoint",
      step: 3,
      skillIds: ["other"],
      prerequisites: ["missing"],
    },
    {
      ...pack,
      id: "z-checkpoint",
      step: 3,
      skillIds: ["checkpoint"],
      prerequisites: ["missing"],
    },
    {
      ...pack,
      id: "harder",
      step: 4,
      skillIds: ["hard"],
      prerequisites: ["checkpoint"],
    },
  ];
  const judge = {
    readiness: async () => ({
      ready: true,
      controlsVerified: true,
      languages: [],
      message: "Explicit fixture",
    }),
    judgePack: async () => ({
      status: "accepted",
      counts: { total: 3, executed: 3, passed: 3, failed: 0, notRun: 0 },
      diagnostics: "Fixture only; no real execution claim",
    }),
  };
  let h = await harness(undefined, judge, c);
  const submit = async (problemId: string) => {
    const j: any = await (
      await h.request("/api/jobs", "POST", {
        problemId,
        language: "python",
        code: "fixture",
        mode: "submit",
        idempotencyKey: randomUUID(),
      })
    ).json();
    for (
      let i = 0;
      i < 30 && h.app.store.get("jobs", j.id).status !== "accepted";
      i++
    )
      await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(h.app.store.get("jobs", j.id).status, "accepted");
  };
  try {
    await submit("foundation");
    h.app.store.assistance("original", "hint");
    await submit("original");
    const first: any = await (await h.request("/api/recommendation")).json();
    assert.equal(first.problemId, "teacher");
    assert.equal(first.pendingStep, 3);
    assert.equal(first.pendingMode, "same_step_checkpoint");
    const repeated: any = await (await h.request("/api/recommendation")).json();
    assert.equal(repeated.problemId, "teacher");
    assert.equal(
      h.app.store.meta("pendingChallenge").resumeMode,
      "same_step_checkpoint",
    );
    await h.request("/api/learning/select", "POST", {
      problemId: "teacher",
      mode: "manual",
    });
    await submit("teacher");
    const checkpoint: any = await (
      await h.request("/api/recommendation")
    ).json();
    assert.equal(checkpoint.problemId, "z-checkpoint");
    assert.equal(checkpoint.mode, "same_step_checkpoint");
    assert.equal(checkpoint.requestedStep, 3);
    assert.equal(checkpoint.ruleVersion, "learning-5");
    const backupResponse = await h.request("/api/data/export");
    assert.equal(backupResponse.status, 200);
    const backup: any = await backupResponse.json();
    assert.equal(
      backup.learningMetadata.pendingChallenge.resumeMode,
      "same_step_checkpoint",
    );
    assert.deepEqual(backup.learningMetadata.pendingChallenge.teacherIds, [
      "teacher",
    ]);
    const dir = h.dir;
    h.close();
    h = await harness(undefined, judge, c, dir);
    const reopened: any = await (await h.request("/api/recommendation")).json();
    assert.equal(reopened.problemId, "z-checkpoint");
    assert.equal(reopened.mode, "same_step_checkpoint");
    assert.equal(reopened.focusTopic, "arrays-hashing");
    assert.equal(h.app.store.meta("pendingChallenge").step, 3);
    await submit("z-checkpoint");
    const advanced: any = await (await h.request("/api/recommendation")).json();
    assert.equal(advanced.problemId, "harder");
    assert.equal(advanced.requestedStep, 4);
    assert.equal(h.app.store.meta("pendingChallenge"), null);
    const evidence = h.app.store.list("evidence");
    assert.equal(
      evidence.find((e) => e.problemId === "original").assisted,
      true,
    );
    assert.equal(
      evidence.find((e) => e.problemId === "z-checkpoint").assisted,
      false,
    );
    assert.equal(evidence.find((e) => e.problemId === "teacher").step, 1);
  } finally {
    h.close();
  }
});
test("checkpoint practice recommendation changes no mastery before its independently accepted submission", async () => {
  const c = [
    {
      ...pack,
      id: "introduced-source",
      skillIds: ["introduced"],
      checkpointIds: ["related-checkpoint"],
      nextIds: ["higher"],
    },
    {
      ...pack,
      id: "related-checkpoint",
      skillIds: ["introduced"],
      prerequisites: ["introduced"],
    },
    {
      ...pack,
      id: "higher",
      step: 2,
      skillIds: ["advanced"],
      prerequisites: ["introduced"],
    },
  ];
  const judge = {
    readiness: async () => ({
      ready: true,
      controlsVerified: true,
      languages: [],
      message: "Explicit fixture",
    }),
    judgePack: async () => ({
      status: "accepted",
      counts: { total: 3, executed: 3, passed: 3, failed: 0, notRun: 0 },
      diagnostics: "Fixture only",
    }),
  };
  const h = await harness(undefined, judge, c);
  const submit = async (problemId: string) => {
    const j: any = await (
      await h.request("/api/jobs", "POST", {
        problemId,
        language: "python",
        code: "fixture",
        mode: "submit",
        idempotencyKey: randomUUID(),
      })
    ).json();
    for (
      let i = 0;
      i < 30 && h.app.store.get("jobs", j.id).status !== "accepted";
      i++
    )
      await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(h.app.store.get("jobs", j.id).status, "accepted");
  };
  try {
    h.app.store.assistance("introduced-source", "hint");
    await submit("introduced-source");
    const before: any = await (await h.request("/api/progress")).json();
    assert.equal(before.independent, 0);
    assert.equal(
      before.skills.find((skill: any) => skill.skillId === "introduced")
        .highestIndependentStep,
      null,
    );
    const recommendation: any = await (
      await h.request("/api/recommendation")
    ).json();
    assert.equal(recommendation.problemId, "related-checkpoint");
    assert.deepEqual(recommendation.practiceSkills, ["introduced"]);
    assert.equal(recommendation.requestedStep, 1);
    const after: any = await (await h.request("/api/progress")).json();
    assert.deepEqual(after.evidence, before.evidence);
    assert.equal(after.independent, 0);
    assert.equal(
      after.skills.find((skill: any) => skill.skillId === "introduced").status,
      "learned_with_help",
    );
    await submit("related-checkpoint");
    const accepted: any = await (await h.request("/api/progress")).json();
    assert.equal(accepted.independent, 1);
    assert.equal(
      accepted.skills.find((skill: any) => skill.skillId === "introduced")
        .highestIndependentStep,
      1,
    );
    const next: any = await (await h.request("/api/recommendation")).json();
    assert.equal(next.problemId, "higher");
    assert.equal(next.requestedStep, 2);
    assert.deepEqual(next.practiceSkills, []);
  } finally {
    h.close();
  }
});
test("replayed acceptance and unrelated manual work cannot clear an outstanding related same-step checkpoint", async () => {
  const c = [
    {
      ...pack,
      id: "original",
      step: 3,
      skillIds: ["shared"],
      checkpointIds: ["related", "replacement"],
    },
    { ...pack, id: "related", step: 3, skillIds: ["shared"] },
    { ...pack, id: "replacement", step: 3, skillIds: ["shared"] },
    { ...pack, id: "unrelated-high", step: 9, skillIds: ["unrelated"] },
  ];
  const judge = {
    readiness: async () => ({
      ready: true,
      controlsVerified: true,
      languages: [],
      message: "Explicit fixture",
    }),
    judgePack: async () => ({
      status: "accepted",
      counts: { total: 3, executed: 3, passed: 3, failed: 0, notRun: 0 },
      diagnostics: "Explicit fixture only",
    }),
  };
  const h = await harness(undefined, judge, c);
  const submit = async (problemId: string) => {
    const j: any = await (
      await h.request("/api/jobs", "POST", {
        problemId,
        language: "python",
        code: "fixture",
        mode: "submit",
        idempotencyKey: randomUUID(),
      })
    ).json();
    for (
      let i = 0;
      i < 30 && h.app.store.get("jobs", j.id).status !== "accepted";
      i++
    )
      await new Promise((resolve) => setTimeout(resolve, 10));
    return j.id;
  };
  try {
    h.app.store.assistance("original", "hint");
    await submit("original");
    h.app.store.setMeta("pendingChallenge", {
      topic: "arrays-hashing",
      step: 3,
      sourceProblemId: "original",
      resumeMode: "same_step_checkpoint",
      teacherIds: [],
      createdAt: new Date().toISOString(),
    });
    const repeatedId = await submit("related");
    const repeated = h.app.store
      .list("evidence")
      .find((e) => e.id === repeatedId);
    repeated.advancementEligible = false;
    // Represents the stored language-demonstration/replay classification, not new-question advancement.
    h.app.store.db
      .prepare("UPDATE evidence SET data=? WHERE id=?")
      .run(JSON.stringify(repeated), repeatedId);
    let r: any = await (await h.request("/api/recommendation")).json();
    assert.equal(r.problemId, "replacement");
    assert.equal(r.mode, "same_step_checkpoint");
    assert.equal(h.app.store.meta("pendingChallenge").step, 3);
    await submit("unrelated-high");
    r = await (await h.request("/api/recommendation")).json();
    assert.equal(r.problemId, "replacement");
    assert.equal(r.requestedStep, 3);
    assert.equal(
      h.app.store.meta("pendingChallenge").resumeMode,
      "same_step_checkpoint",
    );
    await submit("replacement");
    r = await (await h.request("/api/recommendation")).json();
    assert.equal(h.app.store.meta("pendingChallenge"), null);
    assert.equal(r.requestedStep, 10);
  } finally {
    h.close();
  }
});
test("a newly assisted accepted checkpoint recomputes same-step practice without independent mastery", async () => {
  const c = [
    {
      ...pack,
      id: "source",
      skillIds: ["introduced"],
      checkpointIds: ["peer"],
    },
    {
      ...pack,
      id: "peer",
      skillIds: ["introduced"],
      prerequisites: ["introduced"],
      checkpointIds: ["fresh-peer"],
    },
    {
      ...pack,
      id: "fresh-peer",
      skillIds: ["introduced"],
      prerequisites: ["introduced"],
    },
  ];
  const judge = {
    readiness: async () => ({
      ready: true,
      controlsVerified: true,
      languages: [],
      message: "Explicit fixture",
    }),
    judgePack: async () => ({
      status: "accepted",
      counts: { total: 3, executed: 3, passed: 3, failed: 0, notRun: 0 },
      diagnostics: "Explicit fixture only",
    }),
  };
  const h = await harness(undefined, judge, c);
  const submit = async (problemId: string) => {
    const j: any = await (
      await h.request("/api/jobs", "POST", {
        problemId,
        language: "python",
        code: "fixture",
        mode: "submit",
        idempotencyKey: randomUUID(),
      })
    ).json();
    for (
      let i = 0;
      i < 30 && h.app.store.get("jobs", j.id).status !== "accepted";
      i++
    )
      await new Promise((resolve) => setTimeout(resolve, 10));
  };
  try {
    h.app.store.assistance("source", "hint");
    await submit("source");
    h.app.store.setMeta("pendingChallenge", {
      topic: "arrays-hashing",
      step: 1,
      sourceProblemId: "source",
      resumeMode: "same_step_checkpoint",
      teacherIds: [],
      createdAt: new Date().toISOString(),
    });
    h.app.store.assistance("peer", "hint");
    await submit("peer");
    const r: any = await (await h.request("/api/recommendation")).json();
    assert.equal(h.app.store.meta("pendingChallenge"), null);
    assert.equal(r.problemId, "fresh-peer");
    assert.equal(r.mode, "same_step_checkpoint");
    assert.equal(r.requestedStep, 1);
    assert.deepEqual(r.practiceSkills, ["introduced"]);
    const progress: any = await (await h.request("/api/progress")).json();
    assert.equal(progress.independent, 0);
    assert.equal(progress.assisted, 2);
    assert.equal(
      progress.skills.find((skill: any) => skill.skillId === "introduced")
        .highestIndependentStep,
      null,
    );
  } finally {
    h.close();
  }
});
test("immutable starter comparison excludes untouched and comment-only failures without hiding verdicts or accepted evidence", async () => {
  const starters = {
    java: "class Solution {\n    public long solve(int[] values) {\n        return 0L;\n    }\n}\n",
    cpp: "class Solution {\npublic:\n    long long solve(vector<int> values) {\n        return 0;\n    }\n};\n",
    python: "class Solution:\n    def solve(self, values):\n        return 0\n",
  };
  const c = [
    { ...pack, id: "current", step: 3, starters },
    { ...pack, id: "earlier", step: 2, starters },
    { ...pack, id: "accepted-starter", step: 1, starters },
  ];
  const judge = {
    readiness: async () => ({
      ready: true,
      controlsVerified: true,
      languages: [],
      message: "Explicit fixture",
    }),
    judgePack: async ({ problemId }: any) => ({
      status: problemId === "accepted-starter" ? "accepted" : "wrong_answer",
      counts: {
        total: 3,
        executed: 3,
        passed: problemId === "accepted-starter" ? 3 : 0,
        failed: problemId === "accepted-starter" ? 0 : 3,
        notRun: 0,
      },
      diagnostics: "Explicit status fixture; no real execution claim",
    }),
  };
  const h = await harness(undefined, judge, c);
  const submit = async (problemId: string, language: string, code: string) => {
    const j: any = await (
      await h.request("/api/jobs", "POST", {
        problemId,
        language,
        code,
        mode: "submit",
        idempotencyKey: randomUUID(),
      })
    ).json();
    for (
      let i = 0;
      i < 30 && h.app.store.get("jobs", j.id).status === "queued";
      i++
    )
      await new Promise((resolve) => setTimeout(resolve, 10));
    return h.app.store.get("jobs", j.id);
  };
  try {
    for (const language of ["java", "cpp", "python"] as const) {
      const code = starters[language],
        unchanged = await submit("current", language, code);
      assert.equal(unchanged.status, "wrong_answer");
      assert.equal(unchanged.meaningfulConceptualAttempt, false);
      assert.equal(unchanged.problemSnapshot.starters[language], code);
      const commentOnly = await submit(
        "current",
        language,
        code +
          (language === "python"
            ? "# explanation only\n"
            : "// explanation only\n"),
      );
      assert.equal(commentOnly.meaningfulConceptualAttempt, false);
      if (language !== "python") {
        const blockOnly = await submit(
          "current",
          language,
          "/* explanation only */" + code,
        );
        assert.equal(blockOnly.meaningfulConceptualAttempt, false);
      }
    }
    let r: any = await (await h.request("/api/recommendation")).json();
    assert.equal(r.requestedStep, 3);
    assert.equal(r.mode, "resume");
    assert.equal(h.app.store.list("jobs").length, 8);
    assert.equal(h.app.store.list("evidence").length, 8);
    assert.ok(
      h.app.store
        .list("evidence")
        .every((e) => e.meaningfulConceptualAttempt === false),
    );
    // Older records can be classified at replay from immutable job snapshots without rewriting them.
    for (const e of h.app.store.list("evidence")) {
      delete e.meaningfulConceptualAttempt;
      h.app.store.db
        .prepare("UPDATE evidence SET data=? WHERE id=?")
        .run(JSON.stringify(e), e.id);
    }
    r = await (await h.request("/api/recommendation")).json();
    assert.equal(r.requestedStep, 3);
    assert.equal(r.mode, "resume");
    assert.ok(
      h.app.store
        .list("evidence")
        .every((e) => e.meaningfulConceptualAttempt === undefined),
    );
    for (const expression of [
      "sum(values)-1",
      "max(values, default=0)",
      "len(values)",
    ]) {
      const edited = await submit(
        "current",
        "python",
        "class Solution:\n    def solve(self, values):\n        return " +
          expression +
          "\n",
      );
      assert.equal(edited.meaningfulConceptualAttempt, true);
    }
    r = await (await h.request("/api/recommendation")).json();
    assert.equal(r.requestedStep, 2);
    assert.equal(r.mode, "remediation");
    const accepted = await submit("accepted-starter", "java", starters.java);
    assert.equal(accepted.meaningfulConceptualAttempt, false);
    assert.equal(accepted.status, "accepted");
    assert.ok(
      h.app.store
        .list("evidence")
        .some((e) => e.id === accepted.id && e.outcome === "accepted"),
    );
    assert.equal(
      ((await (await h.request("/api/progress")).json()) as any).independent,
      1,
    );
    assert.equal((await h.request("/api/data/export")).status, 200);
  } finally {
    h.close();
  }
});
test("progress review dates use saved timezone across DST while harder pending recommendation is unchanged", async () => {
  const c = [
    {
      ...pack,
      id: "calendar-source",
      step: 2,
      skillIds: ["base"],
      nextIds: ["calendar-hard"],
    },
    {
      ...pack,
      id: "calendar-hard",
      step: 3,
      skillIds: ["next"],
      prerequisites: ["base"],
    },
  ];
  const judge = {
    readiness: async () => ({
      ready: true,
      controlsVerified: true,
      languages: [],
      message: "Explicit fixture",
    }),
    judgePack: async () => ({
      status: "accepted",
      counts: { total: 3, executed: 3, passed: 3, failed: 0, notRun: 0 },
      diagnostics: "Explicit fixture",
    }),
  };
  const h = await harness(undefined, judge, c);
  try {
    await h.request("/api/settings", "PUT", { timezone: "America/New_York" });
    const j: any = await (
      await h.request("/api/jobs", "POST", {
        problemId: "calendar-source",
        language: "python",
        code: "fixture",
        mode: "submit",
        idempotencyKey: randomUUID(),
      })
    ).json();
    for (
      let i = 0;
      i < 30 && h.app.store.get("jobs", j.id).status !== "accepted";
      i++
    )
      await new Promise((resolve) => setTimeout(resolve, 10));
    const e = h.app.store.list("evidence").find((e) => e.id === j.id);
    e.createdAt = "2026-03-07T17:00:00.000Z";
    h.app.store.db
      .prepare("UPDATE evidence SET data=? WHERE id=?")
      .run(JSON.stringify(e), e.id);
    const pending = {
      topic: "arrays-hashing",
      step: 3,
      sourceProblemId: "calendar-source",
      resumeMode: "next_step",
      teacherIds: [],
      createdAt: new Date().toISOString(),
    };
    h.app.store.setMeta("pendingChallenge", pending);
    const progress: any = await (await h.request("/api/progress")).json(),
      review = progress.scheduledReviews.find(
        (r: any) => r.problemId === "calendar-source",
      );
    assert.equal(review.dueAt, "2026-03-08T16:00:00.000Z");
    assert.equal(review.timezone, "America/New_York");
    assert.equal(review.scheduleRuleVersion, "review-calendar-1");
    assert.deepEqual(h.app.store.meta("pendingChallenge"), pending);
    const recommendation: any = await (
      await h.request("/api/recommendation")
    ).json();
    assert.equal(recommendation.problemId, "calendar-hard");
    assert.equal(recommendation.requestedStep, 3);
    await h.request("/api/settings", "PUT", { timezone: "UTC" });
    const utc: any = await (await h.request("/api/progress")).json();
    assert.equal(
      utc.scheduledReviews.find((r: any) => r.problemId === "calendar-source")
        .dueAt,
      "2026-03-08T17:00:00.000Z",
    );
  } finally {
    h.close();
  }
});
test("content capture mismatch rejects before queue and authenticated phase callbacks alone change status", async () => {
  let mode = "mismatch",
    dispatch: any,
    finish!: () => void;
  let captures = 0;
  const end = new Promise<void>((resolve) => (finish = resolve)),
    identity = "a".repeat(64);
  const judge = {
    captureExecutionIdentity: async ({ expectedPublicSnapshot }: any) => {
      captures++;
      assert.equal(expectedPublicSnapshot.id, pack.id);
      if (mode === "mismatch") throw new Error("PRIVATE_DETAIL_MUST_NOT_ECHO");
      return { identity, version: pack.version };
    },
    readiness: async () => ({
      ready: true,
      controlsVerified: true,
      languages: [],
      message: "Explicit fixture",
    }),
    judgePack: async (request: any) => {
      dispatch = request;
      assert.equal(request.expectedIdentity, identity);
      await end;
      return {
        status: "accepted",
        counts: { total: 3, executed: 3, passed: 3, failed: 0, notRun: 0 },
        diagnostics: "Fixture only",
      };
    },
  };
  const h = await harness(undefined, judge);
  const input = () => ({
    problemId: pack.id,
    language: "python",
    code: "fixture",
    mode: "submit",
    idempotencyKey: randomUUID(),
  });
  try {
    const failed = await h.request("/api/jobs", "POST", input());
    assert.equal(failed.status, 409);
    assert.doesNotMatch(await failed.text(), /PRIVATE_DETAIL/);
    assert.equal(h.app.store.list("jobs").length, 0);
    mode = "wrong-version";
    const originalCapture = judge.captureExecutionIdentity;
    judge.captureExecutionIdentity = async (request: any) => ({
      ...(await originalCapture(request)),
      version: "changed-version",
    });
    assert.equal((await h.request("/api/jobs", "POST", input())).status, 409);
    assert.equal(h.app.store.list("jobs").length, 0);
    judge.captureExecutionIdentity = originalCapture;
    mode = "valid";
    const request = input();
    const queued: any = await (
      await h.request("/api/jobs", "POST", request)
    ).json();
    const replay: any = await (
      await h.request("/api/jobs", "POST", request)
    ).json();
    assert.equal(replay.id, queued.id);
    assert.equal(
      h.app.store.get("jobs", queued.id).executionIdentity,
      identity,
    );
    for (let i = 0; i < 20 && !dispatch; i++)
      await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(h.app.store.get("jobs", queued.id).status, "queued");
    dispatch.onPhase("compiling");
    assert.equal(h.app.store.get("jobs", queued.id).status, "compiling");
    dispatch.onPhase("invented");
    assert.equal(h.app.store.get("jobs", queued.id).status, "compiling");
    dispatch.onPhase("running");
    assert.equal(h.app.store.get("jobs", queued.id).status, "running");
    finish();
    for (
      let i = 0;
      i < 20 && h.app.store.get("jobs", queued.id).status !== "accepted";
      i++
    )
      await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(h.app.store.get("jobs", queued.id).status, "accepted");
    dispatch.onPhase("compiling");
    assert.equal(h.app.store.get("jobs", queued.id).status, "accepted");
    assert.equal(captures, 3);
    const backupResponse = await h.request("/api/data/export");
    const backup: any = await backupResponse.json();
    assert.equal(backupResponse.status, 200, JSON.stringify(backup));
    assert.equal(backup.jobs[0].executionIdentity, identity);
    assert.ok(!JSON.stringify(backup).includes("PRIVATE_DETAIL_MUST_NOT_ECHO"));
  } finally {
    finish();
    h.close();
  }
});
test("private identity drift after immutable queue cannot execute or award learning evidence", async () => {
  let currentIdentity = "a".repeat(64),
    block = false,
    release!: () => void,
    executions = 0;
  const gate = new Promise<void>((resolve) => (release = resolve));
  const judge = {
    captureExecutionIdentity: async () => ({
      identity: currentIdentity,
      version: pack.version,
    }),
    readiness: async () => {
      if (block) await gate;
      return {
        ready: true,
        controlsVerified: true,
        languages: [],
        message: "Explicit fixture",
      };
    },
    judgePack: async ({ expectedIdentity }: any) => {
      if (expectedIdentity !== currentIdentity)
        return {
          status: "infrastructure_error",
          counts: { total: 3, executed: 0, passed: 0, failed: 0, notRun: 3 },
          diagnostics: "Content changed before execution; fixture mismatch",
        };
      executions++;
      return {
        status: "accepted",
        counts: { total: 3, executed: 3, passed: 3, failed: 0, notRun: 0 },
        diagnostics: "Fixture only",
      };
    },
  };
  const h = await harness(undefined, judge);
  try {
    block = true;
    const queued: any = await (
      await h.request("/api/jobs", "POST", {
        problemId: pack.id,
        language: "python",
        code: "fixture",
        mode: "submit",
        idempotencyKey: randomUUID(),
      })
    ).json();
    assert.equal(queued.executionIdentity, "a".repeat(64));
    currentIdentity = "b".repeat(64);
    release();
    for (
      let i = 0;
      i < 20 &&
      h.app.store.get("jobs", queued.id).status !== "infrastructure_error";
      i++
    )
      await new Promise((resolve) => setTimeout(resolve, 5));
    const finished = h.app.store.get("jobs", queued.id);
    assert.equal(finished.status, "infrastructure_error");
    assert.equal(finished.result.counts.executed, 0);
    assert.equal(executions, 0);
    assert.equal(h.app.store.list("evidence").length, 0);
    assert.equal(finished.executionIdentity, "a".repeat(64));
  } finally {
    release();
    h.close();
  }
});

test("ordinary application refuses an adapter without trusted content binding", async () => {
  let executions = 0;
  const judge = {
    readiness: async () => ({
      ready: true,
      controlsVerified: true,
      languages: [],
      message: "Controlled adapter fixture",
    }),
    judgePack: async () => {
      executions++;
      throw new Error("must not dispatch");
    },
  };
  const h = await harness(undefined, judge, [pack], undefined, false);
  try {
    assert.equal(h.boot.runner.ready, false);
    assert.match(h.boot.runner.message, /trusted content binding/);
    const response = await h.request("/api/jobs", "POST", {
      problemId: pack.id,
      language: "python",
      code: "fixture",
      mode: "submit",
      idempotencyKey: randomUUID(),
    });
    assert.equal(response.status, 503);
    assert.equal(
      ((await response.json()) as any).code,
      "CONTENT_BINDING_UNAVAILABLE",
    );
    assert.equal(h.app.store.list("jobs").length, 0);
    assert.equal(executions, 0);
    (judge as any).captureExecutionIdentity = async () => ({
      identity: "a".repeat(64),
      version: pack.version,
    });
    const blocked: any = await (await h.request("/api/health")).json();
    assert.equal(blocked.runner.ready, false);
    assert.match(blocked.runner.message, /phase notifications/);
    judge.readiness = async () =>
      ({
        ready: true,
        controlsVerified: true,
        languages: [],
        message: "Controlled adapter fixture",
        phaseEventsSupported: true,
      }) as any;
    const available: any = await (await h.request("/api/health")).json();
    assert.equal(available.runner.ready, true);
    assert.equal(executions, 0);
  } finally {
    h.close();
  }
});

test("private tutor preparation preserves relevant skill evidence and explicit canceled-parent context across safe backup restore", async () => {
  const calls: any[] = [];
  let delivered!: () => void;
  const ready = new Promise<void>((resolve) => (delivered = resolve));
  const provider = {
    stream: async (
      _key: any,
      _model: any,
      messages: any,
      _limit: any,
      signal: AbortSignal,
      onChunk: (s: string) => void,
    ) => {
      calls.push(structuredClone(messages));
      if (calls.length === 1) {
        onChunk("Saved fixture partial.");
        delivered();
        await new Promise((_, reject) =>
          signal.addEventListener(
            "abort",
            () => reject(new Error("fixture canceled")),
            { once: true },
          ),
        );
      }
      onChunk("Continued fixture answer.");
      return {
        finishReason: "stop",
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      };
    },
  };
  const judge = {
    readiness: async () => ({
      ready: true,
      controlsVerified: true,
      languages: [],
      message: "Explicit fixture",
    }),
    judgePack: async () => ({
      status: "accepted",
      counts: { total: 3, executed: 3, passed: 3, failed: 0, notRun: 0 },
      diagnostics: "Fixture only",
    }),
  };
  const h = await harness(provider as any, judge);
  let restored: any;
  try {
    h.app.secrets.read = () => "fixture-only-key";
    h.app.store.setMeta("preferences", {
      ...h.app.store.meta("preferences"),
      model: "fixture-model",
      dailyTokens: 500000,
    });
    const job: any = await (
      await h.request("/api/jobs", "POST", {
        problemId: pack.id,
        language: "python",
        code: "fixture",
        mode: "submit",
        idempotencyKey: randomUUID(),
      })
    ).json();
    for (
      let i = 0;
      i < 30 && h.app.store.get("jobs", job.id).status !== "accepted";
      i++
    )
      await new Promise((r) => setTimeout(r, 5));
    assert.equal(h.app.store.get("jobs", job.id).status, "accepted");
    const input = {
      problemId: pack.id,
      language: "python",
      code: "fixture",
      action: "hint",
      prompt: "Explicit fixture hint",
      consent: true,
      idempotencyKey: randomUUID(),
    };
    const first: any = await (
      await h.request("/api/tutor", "POST", input)
    ).json();
    await ready;
    assert.ok(!("contextMessages" in first));
    const payload = JSON.parse(calls[0].at(-1).content);
    assert.deepEqual(payload.knownSkills, [
      {
        skillId: "sum",
        evidenceIds: [job.id],
        languages: ["python"],
        basis: "independent-accepted",
      },
    ]);
    assert.equal(payload.verifiedReference, null);
    assert.equal(
      h.app.store.get("generations", first.id).contextHash,
      createHash("sha256").update(JSON.stringify(calls[0])).digest("hex"),
    );
    const canceled: any = await (
      await h.request("/api/tutor/" + first.id + "/cancel", "POST", {})
    ).json();
    assert.equal(canceled.markdown, "Saved fixture partial.");
    assert.ok(!("contextMessages" in canceled));
    assert.ok(h.app.store.get("generations", first.id).contextMessages);
    const checked = StoredGenerationSchema.safeParse(
      publicGeneration(h.app.store.get("generations", first.id)),
    );
    assert.ok(
      checked.success,
      JSON.stringify(checked.success ? null : checked.error.issues),
    );
    for (const path of [
      "/api/tutor/" + first.id,
      "/api/library/" + first.id,
      "/api/library/" + first.id + "/export",
      "/api/library",
    ])
      assert.ok(
        !(await (await h.request(path)).text()).includes("contextMessages"),
      );
    const backupResponse = await h.request("/api/data/export");
    const backup: any = await backupResponse.json();
    assert.equal(backupResponse.status, 200, JSON.stringify(backup));
    assert.ok(!JSON.stringify(backup).includes("contextMessages"));
    restored = await harness(provider as any, judge);
    restored.app.secrets.read = () => "fixture-only-key";
    const previewResponse = await restored.request(
      "/api/data/import/preview",
      "POST",
      { backup },
    );
    const preview: any = await previewResponse.json();
    assert.equal(previewResponse.status, 200, JSON.stringify(preview));
    assert.equal(
      (
        await restored.request("/api/data/import", "POST", {
          backup,
          token: preview.token,
          confirmation: "RESTORE",
        })
      ).status,
      200,
    );
    const reopened: any = await (
      await restored.request("/api/library/" + first.id)
    ).json();
    assert.equal(reopened.markdown, "Saved fixture partial.");
    assert.equal(calls.length, 1);
    assert.equal(
      restored.app.store.get("generations", first.id).contextMessages,
      undefined,
    );
    const next: any = await (
      await restored.request("/api/tutor", "POST", {
        ...input,
        idempotencyKey: randomUUID(),
        parentId: first.id,
        prompt: "Explicitly continue the saved partial",
      })
    ).json();
    for (
      let i = 0;
      i < 40 &&
      restored.app.store.get("generations", next.id).status !== "complete";
      i++
    )
      await new Promise((r) => setTimeout(r, 5));
    assert.equal(
      restored.app.store.get("generations", next.id).status,
      "complete",
    );
    const continuation = JSON.parse(calls[1].at(-1).content).continuation;
    assert.equal(continuation.parentId, first.id);
    assert.equal(continuation.status, "canceled");
    assert.equal(continuation.savedPartial, "Saved fixture partial.");
    assert.equal(calls.length, 2);
  } finally {
    h.close();
    restored?.close();
  }
});

test("durable Learning settings validate choices and prioritize presentation without displacing a pending challenge", async () => {
  const catalogue = [
    pack,
    { ...pack, id: "other-topic", primaryTopic: "binary-search" },
    { ...pack, id: "harder-setting", step: 3 },
  ];
  const judge = {
    readiness: async () => ({
      ready: true,
      controlsVerified: true,
      languages: [],
      message: "Explicit fixture",
    }),
    judgePack: async () => ({
      status: "accepted",
      counts: { total: 3, executed: 3, passed: 3, failed: 0, notRun: 0 },
      diagnostics: "Fixture only",
    }),
  };
  const h = await harness(undefined, judge, catalogue);
  try {
    assert.equal(
      (await h.request("/api/recommendation?language=unsupported")).status,
      400,
    );
    assert.equal(
      (
        await h.request("/api/settings", "PUT", {
          focusTopic: "binary-search",
          reviewPreference: "review-first",
          defaultHintDepth: "steps",
        })
      ).status,
      200,
    );
    assert.equal(
      (await h.request("/api/settings", "PUT", { focusTopic: "not-a-topic" }))
        .status,
      400,
    );
    assert.equal(
      (
        await h.request("/api/settings", "PUT", {
          defaultHintDepth: "solution",
        })
      ).status,
      400,
    );
    assert.equal(
      (await h.request("/api/settings", "PUT", { fontSize: 18 })).status,
      200,
    );
    assert.equal(h.app.store.meta("preferences").defaultHintDepth, "steps");
    let recommendation: any = await (
      await h.request("/api/recommendation")
    ).json();
    assert.equal(recommendation.problemId, "other-topic");
    assert.equal(recommendation.practicePresentation.first, "challenge");
    const job: any = await (
      await h.request("/api/jobs", "POST", {
        problemId: pack.id,
        language: "python",
        code: "fixture",
        mode: "submit",
        idempotencyKey: randomUUID(),
      })
    ).json();
    for (
      let i = 0;
      i < 30 && h.app.store.get("jobs", job.id).status !== "accepted";
      i++
    )
      await new Promise((r) => setTimeout(r, 5));
    const e = h.app.store.list("evidence")[0];
    e.createdAt = "2026-01-01T12:00:00.000Z";
    h.app.store.db
      .prepare("UPDATE evidence SET data=? WHERE id=?")
      .run(JSON.stringify(e), e.id);
    h.app.store.setMeta("pendingChallenge", {
      topic: "arrays-hashing",
      step: 3,
      sourceProblemId: pack.id,
      teacherIds: [],
      resumeMode: "next_step",
      createdAt: new Date().toISOString(),
    });
    recommendation = await (await h.request("/api/recommendation")).json();
    assert.equal(recommendation.problemId, "harder-setting");
    assert.equal(recommendation.requestedStep, 3);
    assert.equal(recommendation.practicePresentation.first, "review");
    assert.equal(h.app.store.meta("pendingChallenge").topic, "arrays-hashing");
    assert.equal(
      (
        (await (
          await h.request("/api/recommendation?topic=binary-search")
        ).json()) as any
      ).problemId,
      "other-topic",
    );
    const backup: any = await (await h.request("/api/data/export")).json();
    assert.ok(
      backup.recommendations.some(
        (entry: any) => typeof entry.learningRequirement === "string",
      ),
      "saved learner requirements survive strict backup validation",
    );
    delete backup.preferences.focusTopic;
    delete backup.preferences.reviewPreference;
    delete backup.preferences.defaultHintDepth;
    const preview: any = await (
      await h.request("/api/data/import/preview", "POST", { backup })
    ).json();
    assert.equal(
      (
        await h.request("/api/data/import", "POST", {
          backup,
          token: preview.token,
          confirmation: "RESTORE",
        })
      ).status,
      200,
    );
    const preferences = h.app.store.meta("preferences");
    assert.equal(preferences.focusTopic, null);
    assert.equal(preferences.reviewPreference, "balanced");
    assert.equal(preferences.defaultHintDepth, "concept");
    assert.equal(h.app.store.list("evidence").length, 1);
    assert.equal(h.app.store.meta("pendingChallenge").step, 3);
  } finally {
    h.close();
  }
});

test("default hint depth is immutable prepared guidance and cannot turn a hint into a full solution", async () => {
  let messages: any;
  const provider = {
    stream: async (
      _key: any,
      _model: any,
      input: any,
      _limit: any,
      _signal: any,
      onChunk: any,
    ) => {
      messages = input;
      onChunk("One small next idea.");
      return {
        finishReason: "stop",
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };
    },
  };
  const h = await harness(provider as any);
  try {
    h.app.store.setMeta("preferences", {
      ...h.app.store.meta("preferences"),
      model: "fixture-model",
      defaultHintDepth: "steps",
    });
    h.app.secrets.read = () => {
      h.app.store.setMeta("preferences", {
        ...h.app.store.meta("preferences"),
        defaultHintDepth: "nudge",
      });
      return "fixture-only-key";
    };
    const response = await h.request("/api/tutor", "POST", {
      problemId: pack.id,
      language: "python",
      code: "",
      action: "hint",
      prompt: "Next idea",
      consent: true,
      idempotencyKey: randomUUID(),
    });
    assert.equal(response.status, 202);
    const generation: any = await response.json();
    for (
      let i = 0;
      i < 30 &&
      h.app.store.get("generations", generation.id).status !== "complete";
      i++
    )
      await new Promise((r) => setTimeout(r, 5));
    const context = JSON.parse(messages.at(-1).content);
    assert.equal(context.hintDepth, "steps");
    assert.match(context.hintInstruction, /at most three/);
    assert.match(context.hintInstruction, /before a full algorithm/);
    assert.equal(context.verifiedReference, null);
    assert.equal(
      h.app.store.get("generations", generation.id).hintDepth,
      "steps",
    );
    assert.ok(
      h.app.store.get("generations", generation.id).maxOutputTokens <= 512,
    );
    assert.equal(h.app.store.meta("preferences").defaultHintDepth, "nudge");
  } finally {
    h.close();
  }
});

test("rejected recommendation language cannot consume an otherwise completed pending challenge", async () => {
  const c = [
    { ...pack, id: "pending-source" },
    { ...pack, id: "completed-target", step: 2 },
  ];
  const judge = {
    readiness: async () => ({
      ready: true,
      controlsVerified: true,
      languages: [],
      message: "Explicit fixture",
    }),
    judgePack: async () => ({
      status: "accepted",
      counts: { total: 3, executed: 3, passed: 3, failed: 0, notRun: 0 },
      diagnostics: "Fixture only",
    }),
  };
  const h = await harness(undefined, judge, c);
  try {
    const j: any = await (
      await h.request("/api/jobs", "POST", {
        problemId: "completed-target",
        language: "python",
        code: "fixture",
        mode: "submit",
        idempotencyKey: randomUUID(),
      })
    ).json();
    for (
      let i = 0;
      i < 30 && h.app.store.get("jobs", j.id).status !== "accepted";
      i++
    )
      await new Promise((r) => setTimeout(r, 5));
    const pending = {
      topic: "arrays-hashing",
      step: 2,
      sourceProblemId: "pending-source",
      teacherIds: [],
      resumeMode: "next_step",
      createdAt: new Date(Date.now() - 60000).toISOString(),
    };
    h.app.store.setMeta("pendingChallenge", pending);
    assert.equal(
      (await h.request("/api/recommendation?language=unsupported")).status,
      400,
    );
    assert.deepEqual(h.app.store.meta("pendingChallenge"), pending);
    assert.equal(
      (await h.request("/api/recommendation?language=python")).status,
      200,
    );
    assert.equal(h.app.store.meta("pendingChallenge"), null);
  } finally {
    h.close();
  }
});

test("read-only verified references enter only private explicit-solution context and never mark an unanswered request assisted", async () => {
  const code = "PRIVATE_FIXTURE_REFERENCE_MARKER";
  const messages: any[] = [];
  let lookups = 0,
    version = "1";
  const provider = {
    stream: async (
      _key: any,
      _model: any,
      input: any,
      _limit: any,
      _signal: any,
      onChunk: any,
    ) => {
      messages.push(structuredClone(input));
      const context = JSON.parse(input.at(-1).content);
      if (context.action === "solution")
        throw new Error("fixture provider fails before visible output");
      onChunk("Short visible fixture hint.");
      return {
        finishReason: "stop",
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };
    },
  };
  const other = { ...pack, id: "reference-target" };
  const judge = {
    getVerifiedReference: async (
      id: string,
      language: string,
      options: any,
    ) => {
      lookups++;
      assert.equal(id, other.id);
      assert.equal(options.expectedPublicSnapshot.id, other.id);
      return {
        available: true,
        code,
        language,
        version,
        validationIdentity: "a".repeat(64),
        verifiedAt: "2026-10-08T00:00:00.000Z",
        runtimeIdentity: "b".repeat(64),
      };
    },
  };
  const h = await harness(provider as any, judge, [pack, other]);
  try {
    h.app.secrets.read = () => "fixture-only-key";
    h.app.store.setMeta("preferences", {
      ...h.app.store.meta("preferences"),
      model: "fixture-model",
    });
    const request = (problemId: string, action: string) => ({
      problemId,
      action,
      language: "python",
      code: "",
      prompt: "Explicit fixture request",
      consent: true,
      idempotencyKey: randomUUID(),
    });
    const hint: any = await (
      await h.request("/api/tutor", "POST", request(pack.id, "hint"))
    ).json();
    for (
      let i = 0;
      i < 30 && h.app.store.get("generations", hint.id).status !== "complete";
      i++
    )
      await new Promise((r) => setTimeout(r, 5));
    assert.equal(lookups, 0);
    const input = request(other.id, "solution");
    const response = await h.request("/api/tutor", "POST", input);
    const solution: any = await response.json();
    assert.equal(response.status, 202);
    for (
      let i = 0;
      i < 30 && h.app.store.get("generations", solution.id).status !== "failed";
      i++
    )
      await new Promise((r) => setTimeout(r, 5));
    assert.equal(h.app.store.get("generations", solution.id).status, "failed");
    assert.equal(
      JSON.parse(messages[1].at(-1).content).verifiedReference.code,
      code,
    );
    assert.equal(h.app.store.assisted(other.id), false);
    assert.equal(
      solution.referenceProvenance.basis,
      "historical-full-reference-execution",
    );
    assert.equal(solution.verification, "not-run");
    assert.ok(!JSON.stringify(solution).includes(code));
    assert.ok(
      JSON.stringify(
        h.app.store.get("generations", solution.id).contextMessages,
      ).includes(code),
    );
    for (const path of [
      "/api/tutor/" + solution.id,
      "/api/library/" + solution.id + "/export",
      "/api/library",
      "/api/data/export",
    ])
      assert.ok(!(await (await h.request(path)).text()).includes(code));
    assert.equal(
      ((await (await h.request("/api/tutor", "POST", input)).json()) as any).id,
      solution.id,
    );
    assert.equal(lookups, 1);
    assert.equal(messages.length, 2);
    version = "changed";
    const mismatch: any = await (
      await h.request("/api/tutor", "POST", request(other.id, "solution"))
    ).json();
    for (
      let i = 0;
      i < 30 && h.app.store.get("generations", mismatch.id).status !== "failed";
      i++
    )
      await new Promise((r) => setTimeout(r, 5));
    assert.equal(
      JSON.parse(messages[2].at(-1).content).verifiedReference,
      null,
    );
    assert.equal(
      h.app.store.get("generations", mismatch.id).referenceProvenance,
      undefined,
    );
    assert.equal(h.app.store.assisted(other.id), false);
  } finally {
    h.close();
  }
});

test("first-entry HTTP fixture preserves saved focus through teacher navigation, strict backup and restart without awarding focus advancement", async () => {
  const catalogue = [
    { ...pack, id: "entry-teacher", skillIds: ["arrays.traversal"] },
    {
      ...pack,
      id: "entry-target",
      primaryTopic: "two-pointers",
      skillIds: ["pointers.opposing"],
      prerequisites: ["arrays.traversal"],
      remedialIds: ["entry-teacher"],
      nextIds: [],
      checkpointIds: [],
    },
  ];
  const judge = {
    readiness: async () => ({
      ready: true,
      controlsVerified: true,
      languages: [],
      message: "Explicit first-entry fixture",
    }),
    judgePack: async () => ({
      status: "accepted",
      counts: { total: 3, executed: 3, passed: 3, failed: 0, notRun: 0 },
      diagnostics: "Explicit fixture; no real program execution",
    }),
  };
  let h = await harness(undefined, judge, catalogue);
  try {
    h.app.store.setMeta("preferences", {
      ...h.app.store.meta("preferences"),
      focusTopic: "two-pointers",
    });
    const initial: any = await (
      await h.request("/api/recommendation?language=java")
    ).json();
    assert.equal(initial.problemId, "entry-teacher");
    assert.equal(initial.pendingStep, 1);
    assert.match(initial.rationale, /first challenge/);
    assert.equal(h.app.store.list("evidence").length, 0);
    const exported = await h.request("/api/data/export");

    assert.equal(exported.status, 200);
    const backup: any = await exported.json();
    assert.equal(backup.learningMetadata.pendingChallenge.step, 1);
    assert.equal(
      backup.learningMetadata.pendingChallenge.sourceProblemId,
      undefined,
    );
    const dir = h.dir;
    h.close();
    h = await harness(undefined, judge, catalogue, dir);
    assert.equal(
      (
        (await (
          await h.request("/api/recommendation?language=java")
        ).json()) as any
      ).problemId,
      "entry-teacher",
    );
    await h.request("/api/learning/select", "POST", {
      problemId: "entry-teacher",
      mode: "manual",
    });
    const response = await h.request("/api/jobs", "POST", {
      problemId: "entry-teacher",
      language: "java",
      code: "Explicit edited first-entry fixture",
      mode: "submit",
      idempotencyKey: randomUUID(),
    });
    assert.equal(response.status, 202);
    const job: any = await response.json();
    for (
      let i = 0;
      i < 40 && h.app.store.get("jobs", job.id).status !== "accepted";
      i++
    )
      await new Promise((r) => setTimeout(r, 5));
    assert.equal(h.app.store.get("jobs", job.id).status, "accepted");
    const resumed: any = await (
      await h.request("/api/recommendation?language=java")
    ).json();
    assert.equal(resumed.problemId, "entry-target");
    assert.equal(resumed.requestedStep, 1);
    assert.equal(resumed.focusTopic, "two-pointers");
    assert.match(resumed.rationale, /first step/);
    assert.ok(
      h.app.store
        .list("evidence")
        .every((e: any) => e.problemId === "entry-teacher"),
    );
    assert.equal(h.app.store.meta("pendingChallenge").step, 1);
    assert.equal(h.app.store.meta("preferences").focusTopic, "two-pointers");
  } finally {
    h.close();
  }
});

test("Settings tutor smoke and normal no-metrics provider outputs export and restore complete/partial/legacy records with unknown usage and intact associations", async () => {
  let calls = 0;
  const canary = "TEST_ONLY_PROVIDER_KEY_NEVER_EXPORT";
  const provider = {
    stream: async (
      _key: any,
      _model: any,
      _messages: any,
      _limit: any,
      signal: AbortSignal,
      onChunk: (text: string) => void,
    ) => {
      calls++;
      onChunk(
        calls === 3
          ? "Settings partial without usage."
          : "Controlled completed answer without usage.",
      );
      if (calls === 3)
        await new Promise((_, reject) =>
          signal.addEventListener(
            "abort",
            () => reject(new Error("Explicit canceled fixture")),
            { once: true },
          ),
        );
      return { finishReason: "stop" };
    },
  };
  let h = await harness(provider as any);
  h.app.secrets.read = () => canary;
  h.app.store.setMeta("preferences", {
    ...h.app.store.meta("preferences"),
    model: "fixture-unknown-usage",
    dailyTokens: 500000,
  });
  try {
    const smokeResponse = await h.request("/api/settings/tutor-test", "POST", {
      consent: true,
    });
    assert.equal(smokeResponse.status, 202);
    const smoke: any = await smokeResponse.json();
    for (
      let i = 0;
      i < 80 && h.app.store.get("generations", smoke.id).status !== "complete";
      i++
    )
      await new Promise((r) => setTimeout(r, 5));
    assert.equal(h.app.store.get("generations", smoke.id).status, "complete");
    assert.equal(h.app.store.get("generations", smoke.id).usage, null);
    assert.equal(
      h.app.store.get("generations", smoke.id).problemSnapshot,
      undefined,
    );
    const normal: any = await (
      await h.request("/api/tutor", "POST", {
        problemId: pack.id,
        language: "python",
        code: "fixture",
        action: "hint",
        prompt: "explicit no-metrics fixture",
        consent: true,
        idempotencyKey: randomUUID(),
      })
    ).json();
    for (
      let i = 0;
      i < 80 && h.app.store.get("generations", normal.id).status !== "complete";
      i++
    )
      await new Promise((r) => setTimeout(r, 5));
    assert.equal(h.app.store.get("generations", normal.id).status, "complete");
    assert.equal(h.app.store.get("generations", normal.id).usage, null);
    const partial: any = await (
      await h.request("/api/settings/tutor-test", "POST", { consent: true })
    ).json();
    for (
      let i = 0;
      i < 80 && !h.app.store.get("generations", partial.id).markdown;
      i++
    )
      await new Promise((r) => setTimeout(r, 5));
    await h.request(`/api/tutor/${partial.id}/cancel`, "POST", {});
    assert.equal(h.app.store.get("generations", partial.id).status, "canceled");
    const legacy = h.app.store.get("generations", normal.id);
    delete legacy.usage;
    h.app.store.update("generations", legacy);
    const exported = await h.request("/api/data/export");

    assert.equal(exported.status, 200);
    const backup: any = await exported.json();
    const originalLedger = structuredClone(backup.usageLedger);
    assert.ok(backup.generations.every((g: any) => g.usage === null));
    assert.ok(backup.usageLedger.every((row: any) => row.usage === null));
    assert.equal(JSON.stringify(backup).includes(canary), false);
    assert.ok(backup.generations.every((g: any) => !("contextMessages" in g)));
    assert.equal(
      h.app.store.get("generations", normal.id).usage,
      undefined,
      "DTO normalization does not rewrite legacy original history",
    );
    const before = backup.generations.map((g: any) => ({
      id: g.id,
      threadId: g.threadId,
      problemId: g.problemId,
      problemVersion: g.problemVersion,
      markdown: g.markdown,
      contentHash: g.contentHash,
    }));
    delete backup.generations.find((g: any) => g.id === normal.id).usage;
    assert.ok(BackupSchema.safeParse(backup).success);
    const preview: any = await (
      await h.request("/api/data/import/preview", "POST", { backup })
    ).json();
    assert.ok(preview.token);
    assert.equal(
      (
        await h.request("/api/data/import", "POST", {
          backup,
          token: preview.token,
          confirmation: "RESTORE",
        })
      ).status,
      200,
    );
    const invalid = structuredClone(backup);
    invalid.generations[0].usage = { total_tokens: "invalid" };
    assert.equal(
      (await h.request("/api/data/import/preview", "POST", { backup: invalid }))
        .status,
      400,
    );
    const invalidSnapshot = structuredClone(backup);
    invalidSnapshot.generations.find(
      (g: any) => g.problemId === pack.id,
    ).problemSnapshot = {
      id: pack.id,
      version: "1",
      title: "Incomplete real snapshot",
    };
    assert.equal(
      (
        await h.request("/api/data/import/preview", "POST", {
          backup: invalidSnapshot,
        })
      ).status,
      400,
    );
    const dir = h.dir;
    h.close();
    h = await harness(provider as any, undefined, [pack], dir);
    const restored: any = await (await h.request("/api/data/export")).json();
    assert.deepEqual(
      restored.generations.map((g: any) => ({
        id: g.id,
        threadId: g.threadId,
        problemId: g.problemId,
        problemVersion: g.problemVersion,
        markdown: g.markdown,
        contentHash: g.contentHash,
      })),
      before,
    );
    assert.ok(restored.generations.every((g: any) => g.usage === null));
    assert.equal(restored.usageLedger.length, 3);
    assert.deepEqual(restored.usageLedger, originalLedger);
    assert.equal(calls, 3, "Restore/restart/export never infer");
  } finally {
    h.close();
  }
});
