import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createHash, randomUUID } from "node:crypto";
import { createApp } from "../../apps/server/src/app.ts";
import { loadRunnerConfiguration } from "../../apps/server/src/runner-config.ts";
import { DeepSeek } from "../../apps/server/src/deepseek.ts";
import { JudgeResultSchema } from "../../packages/contracts/src/index.ts";
import {
  JudgeAdapter,
  getPrivatePack,
  getPublicProblem,
  judgePack,
  validateCustomInput,
} from "../../packages/judge-adapter/src/index.mjs";
import * as trustedJudge from "../../packages/judge-adapter/src/index.mjs";
const ids = ["arrays-hashing-01", "arrays-hashing-02", "arrays-hashing-03"],
  languages = ["java", "cpp", "python"];
const artifact = "docs/release-evidence/real-runner-normal-api-slice.json";
const sourcePaths = [
  "tests/integration/real-runner-slice.mjs",
  "apps/server/src/app.ts",
  "packages/contracts/src/index.ts",
  "packages/learning-engine/src/index.ts",
  "packages/judge-adapter/src/index.mjs",
  "packages/judge-adapter/src/content.mjs",
  "packages/judge-adapter/src/checkers.mjs",
];
const sourceHashes = () =>
  Object.fromEntries(
    sourcePaths.map((path) => [
      path,
      createHash("sha256").update(readFileSync(path)).digest("hex"),
    ]),
  );
if (!process.argv.includes("--run")) {
  console.log(
    "Prepared real normal-API slice harness. Run only in the coordinator-reserved window: node --import tsx tests/integration/real-runner-slice.mjs --run",
  );
  process.exit(0);
}
const dataRoot = join(process.cwd(), ".runtime", "real-runner-slices");
mkdirSync(dataRoot, { recursive: true });
const runDir = mkdtempSync(join(dataRoot, "normal-api-"));
const installedData =
  process.env.CODEWISE2_RUNNER_DATA_DIR ??
  join(
    process.env.LOCALAPPDATA ?? join(homedir(), ".local", "share"),
    "CodeWise2",
  );
const configuration = loadRunnerConfiguration(installedData);
const adapter = new JudgeAdapter(configuration);
const report = {
  schemaVersion: 1,
  kind: "real-normal-api-integration-draft-preview",
  startedAt: new Date().toISOString(),
  status: "running",
  platform: {
    node: process.version,
    os: process.platform,
    architecture: process.arch,
  },
  temporaryData: runDir,
  catalogueIds: ids,
  globalPublicationChanged: false,
  applicationInference:
    "explicit-development-fixture-only; no live DeepSeek call",
  cases: [],
  dispatches: [],
  failures: [],
  command: "node --import tsx tests/integration/real-runner-slice.mjs --run",
  sourceHashes: sourceHashes(),
};
const save = () => {
  report.sourceHashesAfter = sourceHashes();
  report.sourceChangedDuringRun =
    JSON.stringify(report.sourceHashes) !==
    JSON.stringify(report.sourceHashesAfter);
  report.exitCode =
    report.status === "passed" ? 0 : report.status === "blocked" ? 2 : 1;
  report.finishedAt = new Date().toISOString();
  mkdirSync("docs/release-evidence", { recursive: true });
  writeFileSync(artifact, JSON.stringify(report, null, 2));
};
let apps = [];
try {
  if (!configuration.ok)
    throw new Error(
      "BLOCKED: approved private runner configuration is invalid.",
    );
  const readiness = await adapter.readiness();
  report.readiness = readiness;
  if (
    !readiness.ready ||
    !readiness.controlsVerified ||
    readiness.phaseEventsSupported !== true
  ) {
    report.status = "blocked";
    report.failures.push(
      readiness.phaseEventsSupported !== true
        ? "Reviewed authenticated phase protocol is unavailable."
        : readiness.message,
    );
    save();
    console.log(
      JSON.stringify({
        status: "blocked",
        reason: readiness.message,
        report: artifact,
      }),
    );
    process.exitCode = 2;
  } else {
    if (typeof trustedJudge.captureExecutionIdentity !== "function")
      throw new Error(
        "BLOCKED: trusted content identity capture is not installed; real execution must not bypass it.",
      );
    const packs = Object.fromEntries(
        await Promise.all(
          ids.map(async (id) => [id, await getPrivatePack(id)]),
        ),
      ),
      catalogue = await Promise.all(ids.map((id) => getPublicProblem(id)));
    report.assets = ids.map((id) => ({
      id,
      version: packs[id].manifest.version,
      manifestStatus: packs[id].manifest.status,
      suiteHash: packs[id].suite.suiteHash,
      hidden: packs[id].hiddenCases.length,
      visible: packs[id].visibleCases.length,
      references: Object.fromEntries(
        languages.map((lang) => [
          lang,
          createHash("sha256")
            .update(packs[id].languages[lang].reference)
            .digest("hex"),
        ]),
      ),
    }));
    const judge = {
      readiness: () => adapter.readiness(),
      captureExecutionIdentity: (request) =>
        trustedJudge.captureExecutionIdentity(request),
      judgePack: async (request) => {
        assert.match(request.expectedIdentity, /^[a-f0-9]{64}$/);
        const dispatch = {
          problemId: request.problemId,
          language: request.language,
          mode: request.mode,
          executionIdentity: request.expectedIdentity,
          phases: [],
        };
        report.dispatches.push(dispatch);
        const result = await judgePack({
          ...request,
          adapter,
          onPhase: (phase) => {
            assert.ok(
              ["compiling", "running"].includes(phase),
              "invalid authenticated runner phase",
            );
            dispatch.phases.push({ phase, at: new Date().toISOString() });
            request.onPhase(phase);
          },
        });
        const validation = JudgeResultSchema.safeParse(result);
        if (!validation.success) {
          report.contractFailures = validation.error.issues;
          report.adapterResult = result;
        }
        return result;
      },
      validateCustomInput,
    };
    const fixtureProvider = new DeepSeek(
      async () =>
        new Response(
          "data: " +
            JSON.stringify({
              choices: [
                {
                  delta: {
                    content:
                      "## A small hint\n\nCompare each reading with the best value already seen. This is an explicit development fixture, not a live DeepSeek response.",
                  },
                  finish_reason: null,
                },
              ],
            }) +
            "\n\ndata: " +
            JSON.stringify({
              choices: [{ delta: {}, finish_reason: "stop" }],
              usage: {
                prompt_tokens: 10,
                completion_tokens: 15,
                total_tokens: 25,
              },
            }) +
            "\n\n",
        ),
    );
    async function start(dir, tutorFixture = false) {
      const app = createApp({
        dataDir: dir,
        catalogue,
        judge,
        fixture: true,
        internalFixtureIds: ids,
        tutorFixture,
        provider: tutorFixture ? fixtureProvider : undefined,
      });
      apps.push(app);
      await new Promise((resolve) =>
        app.server.listen(0, "127.0.0.1", resolve),
      );
      const base = `http://127.0.0.1:${app.server.address().port}`,
        response = await fetch(base + "/api/bootstrap"),
        bootstrap = await response.json(),
        cookie = response.headers.get("set-cookie").split(";")[0];
      assert.equal(bootstrap.fixture, true);
      assert.equal(
        bootstrap.catalogue.published,
        catalogue.filter((p) => p.status === "published").length,
      );
      assert.equal(
        bootstrap.catalogue.preview,
        catalogue.filter((p) => p.status !== "published").length,
      );
      assert.equal(bootstrap.key.configured, false);
      const request = async (path, method = "GET", body) => {
        const r = await fetch(base + "/api/" + path, {
          method,
          headers: {
            Cookie: cookie,
            Origin: base,
            "X-CSRF-Token": bootstrap.csrfToken,
            ...(body === undefined
              ? {}
              : { "Content-Type": "application/json" }),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        const payload = await r.json();
        if (!r.ok)
          throw new Error(
            `HTTP ${r.status}: ${payload.code}: ${payload.message}`,
          );
        return payload;
      };
      return { app, request, bootstrap };
    }
    async function waitJob(client, id) {
      const end = Date.now() + 180000;
      for (;;) {
        const job = await client.request("jobs/" + id);
        if (!["queued", "compiling", "running"].includes(job.status))
          return job;
        if (Date.now() > end)
          throw new Error(
            "Real judge job did not finish within the bounded integration timeout.",
          );
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    async function submit(client, problemId, language, code, mode = "submit") {
      const input = {
        problemId,
        language,
        code,
        mode,
        idempotencyKey: randomUUID(),
      };
      const queued = await client.request("jobs", "POST", input);
      assert.match(queued.executionIdentity, /^[a-f0-9]{64}$/);
      const replay = await client.request("jobs", "POST", input);
      assert.equal(replay.id, queued.id);
      assert.equal(replay.executionIdentity, queued.executionIdentity);
      const terminal = await waitJob(client, queued.id);
      assert.equal(terminal.executionIdentity, queued.executionIdentity);
      return terminal;
    }
    const independentDir = join(runDir, "independent"),
      independent = await start(independentDir);
    for (const language of languages) {
      const problemId = ids[0],
        reference = packs[problemId].languages[language].reference;
      const draft = await independent.request(
        `drafts/${problemId}/${language}`,
      );
      const saved = await independent.request(
        `drafts/${problemId}/${language}`,
        "PUT",
        { code: reference, revision: draft.revision },
      );
      assert.equal(saved.revision, draft.revision + 1);
      const visible = await submit(
        independent,
        problemId,
        language,
        reference,
        "run",
      );
      assert.equal(visible.status, "accepted");
      assert.equal(visible.result.counts.executed, 3);
      const graded = await submit(independent, problemId, language, reference);
      assert.equal(graded.status, "accepted");
      assert.equal(
        graded.result.counts.total,
        packs[problemId].hiddenCases.length + 3,
      );
      assert.equal(graded.result.counts.executed, graded.result.counts.total);
      assert.equal(graded.result.counts.passed, graded.result.counts.total);
      report.cases.push({
        scenario: "independent-new-question",
        problemId,
        language,
        jobId: graded.id,
        verdict: graded.status,
        counts: graded.result.counts,
        runtime: graded.result.runtime,
      });
    }
    let progress = await independent.request("progress");
    assert.equal(progress.independent, 1);
    assert.equal(progress.assisted, 0);
    assert.equal(
      progress.evidence.filter((e) => e.advancementEligible).length,
      1,
    );
    const next = await independent.request(
      "recommendation?topic=arrays-hashing",
    );
    assert.equal(next.requestedStep, 2);
    assert.equal(next.problemId, ids[2]);
    for (const language of languages) {
      for (const problemId of ids.slice(1)) {
        const result = await submit(
          independent,
          problemId,
          language,
          packs[problemId].languages[language].reference,
        );
        assert.equal(result.status, "accepted");
        assert.equal(
          result.result.counts.executed,
          packs[problemId].hiddenCases.length + 3,
        );
        report.cases.push({
          scenario: "actual-pack-language-reference-through-api",
          problemId,
          language,
          jobId: result.id,
          verdict: result.status,
          counts: result.result.counts,
          runtime: result.result.runtime,
        });
      }
    }
    for (const language of languages) {
      const incorrect = await submit(
        independent,
        ids[0],
        language,
        packs[ids[0]].languages[language].starter,
      );
      assert.notEqual(incorrect.status, "accepted");
      assert.notEqual(incorrect.status, "infrastructure_error");
      report.cases.push({
        scenario: "actual-incorrect-submission",
        problemId: ids[0],
        language,
        jobId: incorrect.id,
        verdict: incorrect.status,
        counts: incorrect.result?.counts,
        runtime: incorrect.result?.runtime,
      });
    }
    const before = await independent.request("progress");
    independent.app.close();
    apps = apps.filter((app) => app !== independent.app);
    const reopened = await start(independentDir);
    assert.deepEqual(
      (await reopened.request("progress")).evidence,
      before.evidence,
    );
    for (const language of languages)
      assert.equal(
        (await reopened.request(`drafts/${ids[0]}/${language}`)).code,
        packs[ids[0]].languages[language].reference,
      );
    const assisted = await start(join(runDir, "assisted"), true);
    assisted.app.store.setMeta("preferences", {
      ...assisted.app.store.meta("preferences"),
      model: "fixture-no-inference",
    });
    const generation = await assisted.request("tutor", "POST", {
      problemId: ids[1],
      language: "python",
      code: packs[ids[1]].languages.python.starter,
      action: "hint",
      prompt: "A small hint please.",
      consent: true,
      idempotencyKey: randomUUID(),
    });
    for (let i = 0; i < 100; i++) {
      const g = await assisted.request("tutor/" + generation.id);
      if (g.status === "complete") break;
      if (["failed", "interrupted", "canceled"].includes(g.status))
        throw new Error("Development hint fixture did not complete.");
      await new Promise((r) => setTimeout(r, 20));
    }
    assert.equal(
      (await assisted.request("tutor/" + generation.id)).provider,
      "fixture",
    );
    const helped = await submit(
      assisted,
      ids[1],
      "python",
      packs[ids[1]].languages.python.reference,
    );
    assert.equal(helped.status, "accepted");
    progress = await assisted.request("progress");
    assert.equal(progress.independent, 0);
    assert.equal(progress.assisted, 1);
    const checkpoint = await assisted.request(
      "recommendation?topic=arrays-hashing",
    );
    assert.equal(checkpoint.mode, "same_step_checkpoint");
    assert.equal(checkpoint.requestedStep, 1);
    assert.equal(checkpoint.problemId, ids[0]);
    report.cases.push({
      scenario: "assisted-acceptance-real-judge-fixture-hint",
      problemId: ids[1],
      language: "python",
      jobId: helped.id,
      verdict: helped.status,
      counts: helped.result.counts,
      recommendation: checkpoint,
    });
    for (const dispatch of report.dispatches) {
      if (["java", "cpp"].includes(dispatch.language))
        assert.ok(
          dispatch.phases.some((event) => event.phase === "compiling"),
          "missing actual authenticated compiling phase",
        );
      assert.ok(
        dispatch.phases.some((event) => event.phase === "running"),
        "missing actual authenticated running phase",
      );
    }
    report.status = "passed";
    save();
    console.log(
      JSON.stringify({
        status: "passed",
        realSubmissionCases: report.cases.length,
        report: artifact,
        globalPublicationChanged: false,
      }),
    );
  }
} catch (e) {
  report.status = String(e.message).startsWith("BLOCKED:")
    ? "blocked"
    : "failed";
  report.failures.push(e.message);
  save();
  console.error(
    JSON.stringify({
      status: report.status,
      reason: e.message,
      report: artifact,
    }),
  );
  process.exitCode = report.status === "blocked" ? 2 : 1;
} finally {
  for (const app of apps) app.close();
}
