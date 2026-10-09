import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createApp } from "../../apps/server/src/app.ts";
import { AssessmentStateSchema } from "../../packages/contracts/src/index.ts";
import { BackupSchema } from "../../apps/server/src/backup.ts";
const root = join(process.cwd(), ".runtime", "tests");
mkdirSync(root, { recursive: true });
const base: any = {
  schemaVersion: 1,
  version: "fixture-1",
  slug: "assessment-fixture",
  title: "Explicit assessment HTTP fixture",
  statement: "Controlled fixture, not a core bank question.",
  objective: "Check the controlled fixture transition",
  constraints: [],
  interface: "Fixture",
  status: "draft",
  visibleCases: [0, 1, 2].map((i) => ({
    id: String(i),
    input: [],
    expected: 0,
    explanation: "Fixture only",
  })),
  starters: {
    java: "fixture starter",
    cpp: "fixture starter",
    python: "fixture starter",
  },
  sourceIds: ["fixture"],
  prerequisites: [],
  checkpointIds: [],
  nextIds: [],
  remedialIds: [],
};
const catalogue: any[] = Array.from({ length: 10 }, (_, i) => ({
  ...base,
  id: "assessment-fixture-" + (i + 1),
  primaryTopic: i < 6 ? "arrays-hashing" : "binary-search",
  step: i < 6 ? 1 + Math.floor(i / 2) : 1 + Math.floor((i - 6) / 2),
  skillIds: ["fixture-skill-" + (i + 1)],
}));
for (const p of catalogue) {
  p.checkpointIds = catalogue
    .filter(
      (x) =>
        x.primaryTopic === p.primaryTopic && x.step === p.step && x.id !== p.id,
    )
    .map((x) => x.id);
  p.nextIds = catalogue
    .filter((x) => x.primaryTopic === p.primaryTopic && x.step === p.step + 1)
    .map((x) => x.id);
  p.remedialIds = catalogue
    .filter(
      (x) => x.primaryTopic === p.primaryTopic && x.step <= 1 && x.id !== p.id,
    )
    .map((x) => x.id);
}
async function harness(
  dir?: string,
  options: { catalogue?: any[]; submissionTotal?: number } = {},
) {
  const activeCatalogue = options.catalogue ?? catalogue;
  let release: () => void = () => {};
  const judge = {
    readiness: async () => ({
      ready: true,
      controlsVerified: true,
      languages: [],
      message: "Explicit mocked grading fixture; no native execution",
    }),
    judgePack: async (request: any) => {
      if (request.code === "held-fixture")
        await new Promise<void>((r) => (release = r));
      const total =
          request.mode === "run" ? 3 : (options.submissionTotal ?? 203),
        status =
          request.code === "wrong-hidden" || request.code === "fixture starter"
            ? "wrong_answer"
            : "accepted";
      return {
        status,
        counts: {
          total,
          executed: total,
          passed: status === "accepted" ? total : 3,
          failed: status === "accepted" ? 0 : total - 3,
          notRun: 0,
        },
        diagnostics:
          "Controlled grading fixture only; no actual code execution.",
      };
    },
  };
  const dataDir = dir ?? mkdtempSync(join(root, "assessment-http-")),
    app = createApp({
      dataDir,
      catalogue: activeCatalogue,
      judge,
      fixture: true,
      internalFixtureIds: activeCatalogue.map((p) => p.id),
    });
  await new Promise<void>((r) => app.server.listen(0, "127.0.0.1", r));
  const baseURL = `http://127.0.0.1:${(app.server.address() as any).port}`,
    response = await fetch(baseURL + "/api/bootstrap"),
    boot: any = await response.json(),
    cookie = response.headers.get("set-cookie")!.split(";")[0];
  const request = async (path: string, method = "GET", body?: any) => {
    const response = await fetch(baseURL + "/api/" + path, {
      method,
      headers: {
        Cookie: cookie,
        Origin: baseURL,
        "X-CSRF-Token": boot.csrfToken,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload: any = await response.json();
    assert.equal(response.status < 400, true, JSON.stringify(payload));
    return payload;
  };
  const submit = async (
    a: any,
    code = "edited-controlled-fixture",
    language = a.language,
    mode = "submit",
  ) => {
    const job = await request("jobs", "POST", {
      problemId: a.currentProblemId,
      language,
      mode,
      code,
      idempotencyKey: randomUUID(),
    });
    if (code !== "held-fixture")
      for (
        let i = 0;
        i < 100 &&
        ["queued", "compiling", "running"].includes(
          app.store.get("jobs", job.id).status,
        );
        i++
      )
        await new Promise((r) => setTimeout(r, 5));
    return app.store.get("jobs", job.id);
  };
  return { app, dir: dataDir, request, submit, release: () => release() };
}

test("explicit leftover60 fixture accepts exactly63 full cases and survives validated restore; old IDs still require203", async () => {
  const previewCatalogue = catalogue.map((p, i) => ({
    ...p,
    id: i === 0 ? "dp-1d-23" : `zz-placement-${i}`,
    primaryTopic: "dp-1d",
    step: 1,
    nextIds: [],
    checkpointIds: [],
    remedialIds: [],
  }));
  const h = await harness(undefined, {
    catalogue: previewCatalogue,
    submissionTotal: 63,
  });
  let restored: any;
  try {
    const state = await h.request("assessment/start", "POST", {
      experience: "beginner",
      language: "python",
    });
    assert.equal(state.currentProblemId, "dp-1d-23");
    await h.submit(state);
    const stopped = await h.request("assessment/stop", "POST", {});
    assert.equal(stopped.completed.length, 1);
    assert.equal(stopped.knownSkillIds.length, 1);
    const backup = await h.request("data/export");
    assert.equal(BackupSchema.safeParse(backup).success, true);
    const broken = structuredClone(backup);
    broken.jobs[0].result.counts = {
      total: 64,
      executed: 64,
      passed: 64,
      failed: 0,
      notRun: 0,
    };
    assert.equal(BackupSchema.safeParse(broken).success, false);
    restored = await harness(undefined, {
      catalogue: previewCatalogue,
      submissionTotal: 63,
    });
    const preview = await restored.request("data/import/preview", "POST", {
      backup,
    });
    await restored.request("data/import", "POST", {
      backup,
      token: preview.token,
      confirmation: "RESTORE",
    });
    assert.deepEqual(await restored.request("assessment"), stopped);
  } finally {
    h.app.close();
    restored?.app.close();
  }
  for (const [activeCatalogue, total] of [
    [previewCatalogue, 62],
    [previewCatalogue, 64],
    [catalogue, 63],
  ] as const) {
    const invalid = await harness(undefined, {
      catalogue: [...activeCatalogue],
      submissionTotal: total,
    });
    try {
      const state = await invalid.request("assessment/start", "POST", {
        experience: "beginner",
        language: "python",
      });
      await invalid.submit(state);
      const stopped = await invalid.request("assessment/stop", "POST", {});
      assert.equal(stopped.completed.length, 0);
      assert.equal(stopped.knownSkillIds.length, 0);
    } finally {
      invalid.app.close();
    }
  }
});
test("adaptive HTTP fixture tags immutable jobs, completes six distinct full outcomes and restores associations without deleting drafts/evidence", async () => {
  const h = await harness();
  let restored: any;
  try {
    const draft = await h.request(
      "drafts/" + catalogue[0].id + "/python",
      "PUT",
      { code: "user draft preserved", revision: 0 },
    );
    assert.equal(draft.revision, 1);
    let state = AssessmentStateSchema.parse(
      await h.request("assessment/start", "POST", {
        experience: "beginner",
        language: "python",
      }),
    );
    const run = await h.submit(
      state,
      "edited-controlled-fixture",
      "python",
      "run",
    );
    assert.equal(run.assessmentId, undefined);
    assert.equal(
      (await h.request("assessment/next", "POST", {})).completed.length,
      0,
    );
    const otherLanguage = await h.submit(
      state,
      "edited-controlled-fixture",
      "java",
    );
    assert.equal(otherLanguage.assessmentId, undefined);
    assert.equal(
      (await h.request("assessment/next", "POST", {})).completed.length,
      0,
    );
    while (state.status === "active") {
      const job = await h.submit(state);
      assert.equal(job.assessmentId, state.id);
      assert.equal(job.assessmentSelectedAt, state.currentSelectedAt);
      assert.equal(job.assessmentAssisted, false);
      state = AssessmentStateSchema.parse(
        await h.request("assessment/next", "POST", {}),
      );
    }
    assert.equal(state.status, "complete");
    assert.equal(state.completed.length, 6);
    assert.equal(state.knownSkillIds.length, 6);
    assert.equal(state.unknownSkillIds.length, 4);
    const backup = await h.request("data/export");
    assert.equal(backup.learningMetadata.assessment.schemaVersion, 2);
    restored = await harness();
    const preview = await restored.request("data/import/preview", "POST", {
      backup,
    });
    await restored.request("data/import", "POST", {
      backup,
      token: preview.token,
      confirmation: "RESTORE",
    });
    assert.deepEqual(await restored.request("assessment"), state);
    assert.equal(
      (await restored.request("drafts/" + catalogue[0].id + "/python")).code,
      "user draft preserved",
    );
    assert.equal(
      restored.app.store.list("evidence").length,
      h.app.store.list("evidence").length,
    );
    const broken = structuredClone(backup);
    broken.learningMetadata.assessment.observations[0].jobId = randomUUID();
    const parsed = (
      await import("../../apps/server/src/backup.ts")
    ).BackupSchema.safeParse(broken);
    assert.equal(parsed.success, false);
  } finally {
    h.app.close();
    restored?.app.close();
  }
});
test("stop consumes finished independent/wrong evidence without selecting another probe; unfinished/stale-session and starter failures stay unknown", async () => {
  const h = await harness();
  try {
    const start = () =>
      h.request("assessment/start", "POST", {
        experience: "beginner",
        language: "python",
      });
    let state = await start();
    await h.submit(state);
    let stopped = await h.request("assessment/stop", "POST", {});
    assert.equal(stopped.completed.length, 1);
    assert.equal(stopped.knownSkillIds.length, 1);
    assert.equal(stopped.questions.length, 1);
    assert.equal(stopped.currentProblemId, null);
    state = await start();
    await h.submit(state, "wrong-hidden");
    stopped = await h.request("assessment/stop", "POST", {});
    assert.equal(stopped.completed.length, 1);
    assert.equal(stopped.knownSkillIds.length, 0);
    assert.equal(stopped.questions.length, 1);
    state = await start();
    await h.submit(state, "fixture starter");
    stopped = await h.request("assessment/stop", "POST", {});
    assert.equal(stopped.completed.length, 0);
    assert.equal(stopped.knownSkillIds.length, 0);
    state = await start();
    const unfinished = await h.submit(state, "held-fixture");
    stopped = await h.request("assessment/stop", "POST", {});
    assert.equal(stopped.completed.length, 0);
    assert.equal(stopped.questions.length, 1);
    assert.equal(stopped.currentProblemId, null);
    h.release();
    for (
      let i = 0;
      i < 100 && h.app.store.get("jobs", unfinished.id).status !== "accepted";
      i++
    )
      await new Promise((r) => setTimeout(r, 5));
    assert.equal((await h.request("assessment")).completed.length, 0);
    state = await start();
    const held = await h.submit(state, "held-fixture");
    assert.equal(held.assessmentId, state.id);
    const restarted = await start();
    assert.notEqual(restarted.id, state.id);
    h.release();
    for (
      let i = 0;
      i < 100 && h.app.store.get("jobs", held.id).status !== "accepted";
      i++
    )
      await new Promise((r) => setTimeout(r, 5));
    assert.equal(h.app.store.get("jobs", held.id).status, "accepted");
    assert.equal(
      (await h.request("assessment/next", "POST", {})).completed.length,
      0,
    );
    stopped = await h.request("assessment/stop", "POST", {});
    assert.equal(stopped.completed.length, 0);
    assert.equal(stopped.knownSkillIds.length, 0);
    const priorEvidence = h.app.store.list("evidence").length;
    h.app.store.setMeta("assessment", {
      status: "active",
      language: "python",
      problemIds: [catalogue[0].id],
      completed: [],
      currentProblemId: catalogue[0].id,
    });
    const legacy = await h.request("assessment");
    assert.equal(legacy.status, "stopped");
    assert.ok(legacy.legacy);
    assert.equal(legacy.knownSkillIds.length, 0);
    assert.equal(h.app.store.list("evidence").length, priorEvidence);
  } finally {
    h.release();
    h.app.close();
  }
});
