/** Explicit visual QA only. Synthetic progress is never runner or learner evidence. */
import { createApp } from "../apps/server/src/app.ts";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import type { JobStatus } from "../packages/contracts/src/index.ts";

const loader = await import(
  pathToFileURL(resolve("packages/judge-adapter/src/index.mjs")).href
);
const catalogue = (await loader.loadCatalogue()).filter(
  (p: any) => p.status === "published",
);
if (catalogue.length !== 243)
  throw new Error(
    `Expected current 243-question published catalogue; found ${catalogue.length}.`,
  );
// Always a fresh OS temp directory; no override may point this seed at a real profile.
const dataDir = mkdtempSync(
  join(tmpdir(), "codewise2-progress-visual-fixture-"),
);
const app = createApp({ dataDir, catalogue, fixture: true });
app.store.setMeta("preferences", {
  ...app.store.meta("preferences"),
  timezone: "Asia/Kolkata",
  language: "python",
  onboarded: true,
});
const empty = process.env.CODEWISE2_PROGRESS_FIXTURE_EMPTY === "1";
const date = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 86400000).toISOString();
const seed = (
  problem: any,
  language: "java" | "cpp" | "python",
  status: JobStatus,
  daysAgo: number,
  {
    assisted = false,
    review = false,
    mode = "submit",
  }: { assisted?: boolean; review?: boolean; mode?: string } = {},
) => {
  if (empty) return;
  const id = randomUUID(),
    createdAt = date(daysAgo);
  app.store.insert("jobs", {
    id,
    idempotencyKey: randomUUID(),
    problemId: problem.id,
    problemVersion: problem.version,
    language,
    mode,
    status,
    review,
    createdAt,
    finishedAt: createdAt,
    code: "// Explicit visual fixture: never compiled or executed.",
    fixture: true,
    simulated: true,
    fixtureKind: "progress-dashboard-visual-only",
    result: {
      status,
      fixture: true,
      simulated: true,
      counts: { total: 0, executed: 0, passed: 0, failed: 0, notRun: 0 },
      diagnostics:
        "EXPLICIT SYNTHETIC VISUAL QA RESULT. No compilation, isolated execution, real acceptance or provider call occurred.",
    },
  });
  if (mode === "submit" && ["accepted", "wrong_answer"].includes(status)) {
    app.store.db.prepare("INSERT INTO evidence VALUES (?,?)").run(
      id,
      JSON.stringify({
        id,
        problemId: problem.id,
        language,
        step: problem.step,
        skills: problem.skillIds,
        outcome: status,
        assisted,
        review,
        createdAt,
        ruleVersion: "fixture-visual-only-not-runner-evidence",
        meaningfulConceptualAttempt: true,
        advancementEligible: false,
        classification: "explicit-synthetic-visual-fixture",
      }),
    );
  }
};
// Spread independent/assisted work over topics and local calendar dates.
const topics = [...new Set<string>(catalogue.map((p: any) => p.primaryTopic))];
for (const [i, topic] of topics.entries()) {
  const problems = catalogue.filter((p: any) => p.primaryTopic === topic);
  seed(problems[0], "python", "accepted", 2 + i * 3);
  seed(problems[1] ?? problems[0], "python", "accepted", 1 + i * 3, {
    assisted: true,
  });
}
const arrays = catalogue.filter(
  (p: any) => p.primaryTopic === "arrays-hashing",
);
seed(arrays[0], "python", "accepted", 60);
seed(arrays[0], "python", "accepted", 0, { review: true });
seed(arrays[2], "cpp", "accepted", 8);
seed(arrays[3], "java", "wrong_answer", 1);
seed(arrays[4], "python", "wrong_answer", 0);
for (const [i, status] of (
  [
    "compile_error",
    "infrastructure_error",
    "canceled",
    "runtime_error",
  ] as const
).entries()) {
  seed(arrays[5], "cpp", status, i);
}
seed(arrays[6], "java", "accepted", 0, { mode: "run" });

const port = Number(process.env.PORT ?? 3197);
app.server.on("error", (error) => {
  console.error(error.message);
  app.close();
  process.exitCode = 1;
});
app.server.listen(port, "127.0.0.1", () =>
  console.log(
    JSON.stringify(
      {
        kind: "EXPLICIT SYNTHETIC PROGRESS VISUAL QA ONLY",
        address: `http://127.0.0.1:${port}`,
        pid: process.pid,
        dataDir,
        publishedQuestions: catalogue.length,
        emptyFixture: empty,
        topics: topics.length,
        submissions: app.store.list("jobs").length,
        isolatedExecutions: 0,
        providerCalls: 0,
        credentialConfigured: false,
        scope:
          "Fresh OS temp profile; fixture banner; simulated progress; no real learner writes or runner evidence",
      },
      null,
      2,
    ),
  ),
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    app.close();
    process.exitCode = 0;
  });
