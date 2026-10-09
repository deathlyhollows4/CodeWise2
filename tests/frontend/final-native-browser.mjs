import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import { createHash } from "node:crypto";
export const scenarios = [
  {
    number: 1,
    id: "arrays-hashing-01",
    language: "python",
    kind: "wrong",
    expected: "wrong_answer",
  },
  {
    number: 2,
    id: "arrays-hashing-01",
    language: "python",
    kind: "reference",
    expected: "accepted",
  },
  {
    number: 3,
    id: "arrays-hashing-01",
    language: "java",
    kind: "wrong",
    expected: "wrong_answer",
  },
  {
    number: 4,
    id: "arrays-hashing-01",
    language: "java",
    kind: "reference",
    expected: "accepted",
  },
  {
    number: 5,
    id: "arrays-hashing-01",
    language: "cpp",
    kind: "wrong",
    expected: "wrong_answer",
  },
  {
    number: 6,
    id: "arrays-hashing-01",
    language: "cpp",
    kind: "compile-typo",
    expected: "compile_error",
  },
  {
    number: 7,
    id: "arrays-hashing-01",
    language: "cpp",
    kind: "reference",
    expected: "accepted",
  },
  {
    number: 8,
    id: "arrays-hashing-03",
    language: "python",
    kind: "hint-assisted-reference",
    expected: "accepted",
  },
  {
    number: 9,
    id: "arrays-hashing-04",
    language: "cpp",
    kind: "cross-language-solution-exposed-reference",
    expected: "accepted",
  },
  {
    number: 10,
    id: "arrays-hashing-02",
    language: "python",
    kind: "double-click-reference",
    expected: "accepted",
  },
];
if (!process.argv.includes("--run")) {
  console.log(
    JSON.stringify({
      prepared: true,
      execution: "none",
      scenarios,
      commands: [
        "CODEWISE2_QA_URL=http://127.0.0.1:3192 node tests/frontend/final-native-browser.mjs --run --phase=before-restart",
        "After the reviewed owned fixture restart: same command with --phase=after-restart",
      ],
    }),
  );
  process.exit(0);
}
const phase = process.argv.find((a) => a.startsWith("--phase="))?.slice(8);
assert.ok(
  ["before-restart", "after-restart"].includes(phase),
  "An explicit resumable phase is required",
);
assert.equal(
  new URL(base).port,
  "3192",
  "Only the approved published/real-runner fixture3192",
);
const dir = resolve("docs/release-evidence/frontend-final-native"),
  journal = resolve(dir, "report.json");
mkdirSync(dir, { recursive: true });
const hash = (v) =>
    createHash("sha256")
      .update(
        typeof v === "string" || Buffer.isBuffer(v) ? v : JSON.stringify(v),
      )
      .digest("hex"),
  lf = (s) => s.replaceAll("\r\n", "\n");
const runtime =
  "3d76fe78d843d79d2f5bcd3732fb0ebd73c2279980ad2066da747414db79480c";
const sourcePaths = [
  "tests/frontend/final-native-browser.mjs",
  "tests/frontend/fixture-final-provider.ts",
  "apps/server/src/app.ts",
  "apps/server/src/index.ts",
  "apps/web/src/App.tsx",
  "apps/web/src/LiveLesson.tsx",
  "apps/web/src/styles.css",
  "package.json",
  "packages/contracts/src/index.ts",
  "packages/contracts/src/learning-metadata.mjs",
  "packages/learning-engine/src/index.ts",
  "packages/judge-adapter/src/index.mjs",
  "packages/judge-adapter/src/content.mjs",
  "packages/judge-adapter/src/checkers.mjs",
  "packages/judge-adapter/src/learning-metadata.mjs",
  "content/learning-tags.json",
  "content/learning-tags-review.json",
];
const sourceHashes = () =>
  Object.fromEntries(
    sourcePaths.map((path) => [path, hash(readFileSync(path))]),
  );
const fixture = JSON.parse(
  readFileSync(
    "docs/release-evidence/frontend-final-native-fixture.json",
    "utf8",
  ),
);
assert.equal(fixture.address, base);
assert.equal(fixture.gradingEnabled, true);
assert.equal(fixture.published, 243);
assert.equal(fixture.preview, 0);
assert.equal(fixture.maximumApprovedJobs, 10);
assert.ok(
  resolve(fixture.dataDir).startsWith(resolve(".runtime") + sep),
  "Isolated profile required",
);
const coverage = JSON.parse(
    readFileSync(
      "docs/release-evidence/native-whole-current-coverage.json",
      "utf8",
    ),
  ),
  coverageById = new Map(coverage.rows.map((r) => [r.id, r]));
const resumeThird = process.argv.includes("--resume-blocked-third");
const resumeHome = process.argv.includes("--resume-earned-home");
const recoverHint = process.argv.includes("--recover-saved-hint");
const recoverExposure = process.argv.includes("--recover-saved-exposure");
const before =
  phase === "after-restart" || resumeThird || resumeHome ? JSON.parse(readFileSync(journal, "utf8")) : null;
if (resumeThird || resumeHome || recoverHint || recoverExposure) {
  assert.equal(phase, recoverHint || recoverExposure ? "after-restart" : "before-restart");
  assert.equal(before.status, "failed");
  assert.equal(before.jobs.length, recoverExposure ? 8 : resumeHome || recoverHint ? 7 : 2);
  assert.equal(before.blockedUnexpectedJobPosts, resumeHome || recoverHint || recoverExposure ? 0 : 1);
  if (resumeHome || recoverHint) assert.ok(before.preRestart);
  assert.equal(before.inFlight, undefined);
  assert.equal(recoverHint || recoverExposure ? before.restart.newPid : before.fixture.pid, fixture.pid);
  assert.equal(before.fixture.dataDir, fixture.dataDir);
  const current = sourceHashes();
  for (const [path, value] of Object.entries(before.sourceHashesBefore))
    if (path !== "tests/frontend/final-native-browser.mjs") assert.equal(current[path], value, path);
  before.historicalFailures = [...(before.historicalFailures || []), ...(before.historicalFailure ? [before.historicalFailure] : []), { report: recoverExposure ? "failed-exposure-versus-acceptance-report.json" : recoverHint ? "failed-saved-answer-selector-report.json" : resumeHome ? "failed-home-observer-order-report.json" : "failed-java-eol-report.json", sourceHashesBefore: before.sourceHashesBefore, failure: before.failure }];
  before.resumedRun = { startedAt: new Date().toISOString(), reason: recoverExposure ? "Existing viewed solution is exposure, not accepted aided evidence; resume only final two jobs" : recoverHint ? "Recover same completed hint with narrow saved-answer selector; no new generation" : resumeHome ? "Prove legitimate pending Greedy on Home and earned Arrays step2 via scoped Topic UI; zero jobs" : "Java CRLF/LF guard mismatch only; no third job created", historicalBlockedPosts: 1, remainingNativeJobs: recoverExposure ? 2 : resumeHome || recoverHint ? 3 : 8 };
  before.sourceHashesBefore = current;
  before.errors = [];
  before.blockedUnexpectedJobPosts = 0;
  delete before.failure;
} else if (before) {
  assert.equal(before.status, "awaiting-owned-process-restart");
  assert.equal(before.jobs.length, 7);
  assert.equal(before.fixture.dataDir, fixture.dataDir);
  assert.notEqual(
    before.fixture.pid,
    fixture.pid,
    "An actual backend process restart is required",
  );
  assert.deepEqual(
    sourceHashes(),
    before.sourceHashesBefore,
    "The frozen application/source must remain exact across restart",
  );
} else
  assert.equal(
    existsSync(journal),
    false,
    "Use a fresh isolated journey journal; do not silently overwrite earlier evidence",
  );
const report = before ?? {
  schemaVersion: 1,
  startedAt: new Date().toISOString(),
  base,
  status: "prepared",
  scope:
    "Exactly10 normal UI submissions in an isolated published243 profile. Real isolated grading; explicit controlled provider fixture only. This is QA workflow evidence, not learner proficiency or live DeepSeek proof.",
  fixture: {
    pid: fixture.pid,
    dataDir: fixture.dataDir,
    catalogueSnapshotHash: fixture.catalogueSnapshotHash,
  },
  scenarioInventory: scenarios,
  sourceHashesBefore: sourceHashes(),
  jobs: [],
  generations: [],
  checks: [],
  captures: [],
  assets: [],
  requestSummaries: [],
  errors: [],
  externalRequests: [],
  blockedUnexpectedJobPosts: 0,
};
const save = () =>
  writeFileSync(journal, JSON.stringify(report, null, 2) + "\n");
const browser = await launchBrowser(),
  context = await browser.newContext({
    viewport: { width: 1366, height: 1000 },
    permissions: ["clipboard-read", "clipboard-write"],
  }),
  page = await context.newPage();
let armed = null,
  phasePosts = 0;
const pendingObservers = [];
page.on("pageerror", (e) => {
  report.errors.push(e.message);
  save();
});
page.on("request", (r) => {
  const url = new URL(r.url());
  if (!r.url().startsWith(base) && !["data:", "blob:"].includes(url.protocol))
    report.externalRequests.push({ origin: url.origin, path: url.pathname });
});
page.on("response", (r) => {
  const url = new URL(r.url());
  if (url.origin !== new URL(base).origin) return;
  if (["POST", "PUT", "PATCH", "DELETE"].includes(r.request().method()))
    report.requestSummaries.push({
      method: r.request().method(),
      path: url.pathname,
      status: r.status(),
    });
  if (
    /\/assets\/.*\.(js|css)$/.test(url.pathname) &&
    !report.assets.some((a) => a.path === url.pathname)
  ) {
    pendingObservers.push(
      r
        .body()
        .then((bytes) => {
          if (!report.assets.some((a) => a.path === url.pathname))
            report.assets.push({
              path: url.pathname,
              status: r.status(),
              bytes: bytes.length,
              sha256: hash(bytes),
            });
        })
        .catch(() => {}),
    );
  }
});
await page.route("**/api/jobs", async (route) => {
  const request = route.request();
  if (request.method() !== "POST") {
    await route.continue();
    return;
  }
  phasePosts++;
  let body;
  try {
    body = request.postDataJSON();
  } catch {}
  if (
    !armed ||
    armed.posted ||
    report.jobs.length >= 10 ||
    body?.problemId !== armed.scenario.id ||
    body?.language !== armed.scenario.language ||
    body?.mode !== "submit" ||
    hash(lf(body?.code ?? "")) !== armed.codeHash
  ) {
    report.blockedUnexpectedJobPosts++;
    report.errors.push(
      "Unexpected or changed job dispatch was blocked before execution",
    );
    save();
    await route.abort("blockedbyclient");
    return;
  }
  armed.posted = true;
  await route.continue();
});
const get = async (path) => {
  const response = await context.request.get(base + "/api/" + path, {
    timeout: 15000,
  });
  assert.equal(response.status(), 200, path);
  return response.json();
};
const reference = (id, language) =>
  lf(
    readFileSync(
      resolve(
        "content/problems",
        id,
        "languages",
        language,
        "reference." + { python: "py", java: "java", cpp: "cpp" }[language],
      ),
      "utf8",
    ),
  );
const codeFor = (scenario) =>
  scenario.kind === "wrong"
    ? {
        python:
          "class Solution:\n    def solve(self, values):\n        return 7\n",
        java: "class Solution { public long solve(int[] values) { return 7L; } }\n",
        cpp: "class Solution { public: long long solve(vector<int> values) { return 7LL; } };\n",
      }[scenario.language]
    : scenario.kind === "compile-typo"
      ? reference(scenario.id, scenario.language).replace(
          "return result;",
          "return result",
        )
      : reference(scenario.id, scenario.language);
async function capture(name) {
  const path = resolve(dir, name + ".png");
  await page.screenshot({ path, fullPage: false });
  report.captures.push(path);
  save();
}
async function showEarnedNextUI() {
  const homeResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === "/api/recommendation" && !url.searchParams.has("topic");
  });
  await page.goto(base + "/");
  const home = await (await homeResponse).json();
  assert.equal(home.focusTopic, "greedy");
  assert.equal(home.problemId, "greedy-01");
  assert.equal(home.requestedStep, 1);
  const card = page.locator("[data-practice-kind=challenge]");
  await expect(card).toBeVisible();
  await expect(
    card.getByRole("link", { name: "Continue learning", exact: true }),
  ).toHaveAttribute("href", "/problems/" + home.problemId);
  await expect(card).toContainText(home.rationale);
  await expect(card).toContainText(home.learningRequirement);
  if (report.preRestart.pendingHome) assert.equal(home.problemId, report.preRestart.pendingHome.problemId);
  else report.preRestart.pendingHome = { problemId: home.problemId, focusTopic: home.focusTopic, requestedStep: home.requestedStep };
  await capture("preserved-pending-greedy-home-" + phase);
  await page.goto(base + "/topics/arrays-hashing");
  const response = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === "/api/recommendation" && url.searchParams.get("topic") === "arrays-hashing";
  });
  await page.getByRole("button", { name: "Suggest a challenge", exact: true }).click();
  const next = await (await response).json();
  assert.equal(next.mode, "next_step");
  assert.equal(next.requestedStep, 2);
  assert.equal(next.problemId, report.preRestart.earnedNext.problemId);
  const problem = await get("problems/" + next.problemId);
  assert.equal(problem.step, 2);
  const suggestion = page.getByRole("region", { name: "Topic challenge suggestion" });
  await expect(suggestion).toContainText(problem.title);
  await expect(suggestion).toContainText(next.rationale);
  await expect(suggestion).toContainText(next.learningRequirement);
  await capture("earned-arrays-topic-suggestion-" + phase);
  await suggestion.getByRole("button", { name: "Open suggested challenge", exact: true }).click();
  await expect(page).toHaveURL(base + "/problems/" + next.problemId);
  report.checks.push({
    name: "visible-home-preserves-greedy-goal-and-topic-ui-shows-earned-arrays-step2",
    pendingHome: home.problemId,
    problemId: next.problemId,
    requestedStep: 2,
  });
  save();
}
async function focus(topic) {
  await page.goto(base + "/settings");
  await page.getByRole("button", { name: "Learning", exact: true }).click();
  await page.getByLabel("Focus topic", { exact: true }).selectOption(topic);
  await expect
    .poll(async () => (await get("settings")).preferences.focusTopic, {
      timeout: 15000,
    })
    .toBe(topic);
}
async function open(id, language, starter = false) {
  await page.goto(base + "/problems/" + id);
  await expect(page.locator(".editor .monaco-editor")).toBeVisible();
  await page
    .getByLabel("Programming language", { exact: true })
    .selectOption(language);
  await expect(
    page.getByLabel("Programming language", { exact: true }),
  ).toHaveValue(language);
  await expect(
    page.getByRole("button", { name: "Submit", exact: true }),
  ).toBeEnabled();
  if (starter) {
    const p = await get("problems/" + id),
      draft = await get("drafts/" + id + "/" + language);
    assert.equal(
      hash(lf(draft.code)),
      hash(lf(p.starters[language])),
      "Usable untouched starter loaded in " + language,
    );
    report.checks.push({
      name: "starter-loaded",
      id,
      language,
      sha256: hash(lf(draft.code)),
    });
    save();
  }
}
async function paste(id, language, code) {
  await page
    .locator(".editor .monaco-editor")
    .click({ position: { x: 120, y: 45 } });
  await page.keyboard.press("Control+A");
  await page.evaluate((text) => navigator.clipboard.writeText(text), code);
  await page.keyboard.press("Control+V");
  await expect
    .poll(
      async () => hash(lf((await get("drafts/" + id + "/" + language)).code)),
      { timeout: 15000 },
    )
    .toBe(hash(code));
}
async function submit(scenario) {
  assert.equal(
    report.jobs.length,
    scenario.number - 1,
    "Never replay a graded scenario",
  );
  const code = codeFor(scenario);
  assert.ok(
    scenario.kind !== "compile-typo" ||
      code !== reference(scenario.id, scenario.language),
    "The deliberate compiler typo must actually change source",
  );
  await paste(scenario.id, scenario.language, code);
  const priorPosts = phasePosts,
    priorJobs = await get("jobs?pageSize=100");
  armed = { scenario, codeHash: hash(code), posted: false };
  const posted = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/jobs" &&
      r.request().method() === "POST",
    { timeout: 15000 },
  );
  if (scenario.kind === "double-click-reference")
    await page
      .getByRole("button", { name: "Submit", exact: true })
      .dblclick({ delay: 60 });
  else await page.getByRole("button", { name: "Submit", exact: true }).click();
  const response = await posted;
  assert.equal(response.status(), 202);
  const created = await response.json();
  report.inFlight = {
    scenario: scenario.number,
    jobId: created.id,
    problemId: scenario.id,
    language: scenario.language,
    codeHash: hash(code),
    postedAt: new Date().toISOString(),
  };
  save();
  const statuses = [{ status: created.status, at: new Date().toISOString() }];
  let job;
  await expect
    .poll(
      async () => {
        job = await get("jobs/" + created.id);
        if (statuses.at(-1).status !== job.status)
          statuses.push({ status: job.status, at: new Date().toISOString() });
        return !["queued", "compiling", "running"].includes(job.status);
      },
      { timeout: 120000, intervals: [125, 250, 500] },
    )
    .toBe(true);
  armed = null;
  report.lastObservedTerminal = {
    id: job.id,
    status: job.status,
    counts: job.result?.counts,
    executionIdentity: job.executionIdentity,
  };
  save();
  assert.equal(
    phasePosts - priorPosts,
    1,
    "One actual POST for each scenario, including double click",
  );
  assert.equal(job.status, scenario.expected);
  assert.equal(hash(lf(job.code)), hash(code), "Exact immutable source");
  assert.equal(Buffer.byteLength(lf(job.code)), Buffer.byteLength(code));
  assert.match(job.executionIdentity ?? "", /^[a-f0-9]{64}$/);
  assert.equal(
    job.executionIdentity,
    coverageById.get(scenario.id).languages[scenario.language]
      .validationIdentity,
    "Current frozen grading identity",
  );
  const total = coverageById.get(scenario.id).expectedCases;
  assert.equal(job.result.counts.total, total);
  if (job.status === "accepted") {
    assert.equal(job.result.counts.executed, total);
    assert.equal(job.result.counts.passed, total);
    assert.equal(job.result.counts.failed, 0);
    assert.equal(job.result.counts.notRun, 0);
  } else if (job.status === "compile_error") {
    assert.equal(job.result.counts.executed, 0);
    assert.equal(job.result.counts.notRun, total);
  } else assert.ok(job.result.counts.failed > 0);
  if (job.status === "accepted")
    assert.equal(
      job.result.runtime?.phases?.length,
      2,
      "Complete visible and hidden attestation required",
    );
  if (job.status === "wrong_answer")
    assert.ok(
      (job.result.runtime?.phases?.length ?? 0) >= 1,
      "Wrong-answer execution must retain attestation",
    );
  if ((job.result.runtime?.phases?.length ?? 0) > 0)
    assert.equal(
      new Set(job.result.runtime.phases.map((p) => p.bootId)).size,
      1,
    );
  for (const p of job.result.runtime?.phases ?? []) {
    assert.equal(p.identityHash, runtime);
    assert.equal(p.startIdentityHash, runtime);
    assert.ok(p.bootId);
  }
  if (scenario.language === "python")
    assert.ok(
      statuses.every((s) => s.status !== "compiling"),
      "Python must not invent compilation",
    );
  const afterJobs = await get("jobs?pageSize=100");
  assert.equal(afterJobs.items.length, priorJobs.items.length + 1);
  assert.equal(afterJobs.items.filter((j) => j.id === job.id).length, 1);
  report.jobs.push({
    scenario: scenario.number,
    id: job.id,
    problemId: job.problemId,
    language: job.language,
    status: job.status,
    executionIdentity: job.executionIdentity,
    codeHash: hash(lf(job.code)),
    immutableRawCodeHash: hash(job.code),
    immutableRawCodeBytes: Buffer.byteLength(job.code),
    codeBytes: Buffer.byteLength(code),
    counts: job.result.counts,
    observedStatuses: statuses,
    runtime: job.result.runtime,
    meaningful: job.meaningfulConceptualAttempt,
  });
  delete report.inFlight;
  save();
  return job;
}
async function providerSetup() {
  await page.goto(base + "/settings");
  await page
    .getByRole("button", { name: "AI & DeepSeek", exact: true })
    .click();
  await page
    .locator("#deepseek-key")
    .fill("fixture-only-no-real-credential-valid-final-native");
  const tested = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/settings/key/test" &&
      r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Test connection", exact: true })
    .click();
  assert.equal((await tested).status(), 200);
  const saved = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/settings/key" &&
      r.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Save key", exact: true }).click();
  assert.equal((await saved).status(), 200);
  assert.equal(
    await page.locator("#deepseek-key").evaluate((e) => e.value.length),
    0,
  );
  await page.getByRole("button", { name: "Usage", exact: true }).click();
  await page
    .getByLabel("Supported DeepSeek model", { exact: true })
    .selectOption("fixture-controlled-local");
  await expect
    .poll(async () => (await get("settings")).preferences.model)
    .toBe("fixture-controlled-local");
  report.checks.push({
    name: "controlled-provider-configured-via-UI",
    liveDeepSeek: false,
    credentialReadback: false,
  });
  save();
}
async function tutor(id, language, action) {
  await open(id, language);
  await page.getByRole("button", { name: "Tutor", exact: true }).click();
  await page
    .getByRole("button", {
      name: action === "hint" ? "Give me a hint" : "Teach the full solution",
      exact: true,
    })
    .click();
  const posted = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/tutor" &&
      r.request().method() === "POST",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Send request", exact: true })
    .click();
  const response = await posted;
  assert.equal(response.status(), 202);
  const created = await response.json();
  let generation;
  report.inFlightGeneration = { id: created.id, problemId: id, language, action, createdAt: new Date().toISOString() };
  save();
  await expect
    .poll(
      async () => {
        generation = await get("tutor/" + created.id);
        return generation.status;
      },
      { timeout: 60000, intervals: [250, 500] },
    )
    .toBe("complete");
  assert.equal(generation.action, action);
  assert.equal(generation.language, language);
  assert.ok(generation.markdown.includes("Controlled local provider fixture"));
  await page
    .getByRole("link", { name: "Open saved lesson →", exact: true })
    .click();
  await expect(page.locator(".lesson-content").filter({ hasText: "Controlled local provider fixture" })).toBeVisible();
  const saved = await get("library/" + generation.id);
  assert.equal(hash(saved.markdown), hash(generation.markdown));
  report.generations.push({
    id: generation.id,
    problemId: id,
    language,
    action,
    status: generation.status,
    markdownHash: hash(generation.markdown),
    provider: "explicit controlled local fixture; not live DeepSeek",
    viewedSaved: true,
  });
  delete report.inFlightGeneration;
  save();
}
try {
  await page.goto(base + "/");
  await expect(page.locator(".fixture-banner").first()).toBeVisible();
  const boot = await get("bootstrap");
  assert.equal(boot.fixture, true);
  assert.equal(boot.catalogue.published, 243);
  assert.equal(boot.catalogue.preview, 0);
  assert.equal(boot.runner.ready, true);
  assert.equal(boot.runner.controlsVerified, true);
  assert.equal(boot.runner.phaseEventsSupported, true);
  assert.equal(boot.runner.identityHash, runtime);
  assert.equal(boot.preferences.autoExplain, false);
  report.runtimeIdentity = runtime;
  report.platform = boot.platform;
  report.languageVersions = boot.runner.languages;
  if (phase === "before-restart") {
    if (!resumeHome) {
    if (!resumeThird) {
    const initial = await get("progress");
    assert.equal(initial.evidence.length, 0);
    assert.equal((await get("jobs?pageSize=100")).items.length, 0);
    assert.equal((await get("library?pageSize=100")).items.length, 0);
    assert.equal(boot.key.configured, false);
    if (!boot.preferences.onboarded) {
      await page
        .getByRole("button", { name: "Start from the beginning", exact: true })
        .click();
      await expect
        .poll(async () => (await get("settings")).preferences.onboarded)
        .toBe(true);
    }
    await focus("greedy");
    await page.goto(base + "/");
    const bridge = await get("recommendation?language=python");
    assert.equal(bridge.focusTopic, "greedy");
    assert.equal(bridge.problemId, "arrays-hashing-01");
    assert.equal(bridge.requestedStep, 1);
    assert.equal(bridge.pendingStep, 1);
    await expect(
      page.locator("[data-practice-kind=challenge] a.primary"),
    ).toHaveAttribute("href", "/problems/arrays-hashing-01");
    report.checks.push({
      name: "fresh-Greedy-focus-real-foundation-bridge",
      recommendation: bridge,
    });
    await capture("greedy-foundation-before-solving");
    await open("arrays-hashing-01", "python", true);
    await submit(scenarios[0]);
    await submit(scenarios[1]);
    } else {
      const existing = await get("jobs?pageSize=100");
      assert.deepEqual(existing.items.map((job) => job.id).sort(), report.jobs.map((job) => job.id).sort());
      for (const row of report.jobs) {
        const actual = await get("jobs/" + row.id);
        assert.equal(actual.status, row.status);
        assert.equal(hash(lf(actual.code)), row.codeHash);
      }
    }
    const resumed = await get("recommendation?language=python&topic=greedy");
    assert.equal(resumed.focusTopic, "greedy");
    assert.equal(resumed.requestedStep, 1);
    assert.equal(
      (await get("problems/" + resumed.problemId)).primaryTopic,
      "greedy",
    );
    report.checks.push({
      name: "independent-foundation-returns-to-Greedy-step1",
      recommendation: resumed,
    });
    await open("arrays-hashing-01", "java", !resumeThird);
    await submit(scenarios[2]);
    await submit(scenarios[3]);
    await open("arrays-hashing-01", "cpp", true);
    await submit(scenarios[4]);
    const preCompile = await get("progress"),
      preCompileState = await get("problems/arrays-hashing-01/state");
    await submit(scenarios[5]);
    const postCompile = await get("progress"),
      postCompileState = await get("problems/arrays-hashing-01/state");
    assert.equal(
      hash(postCompile.evidence),
      hash(preCompile.evidence),
      "Compile error adds no conceptual failure or mastery",
    );
    assert.equal(postCompileState.assisted, preCompileState.assisted);
    assert.equal(report.generations.length, 0);
    report.checks.push({
      name: "compiler-typo-does-not-add-conceptual-failure-or-assistance",
      evidenceHash: hash(postCompile.evidence),
    });
    await submit(scenarios[6]);
    await focus("arrays-hashing");
    const next = await get(
      "recommendation?topic=arrays-hashing&language=python",
    );
    assert.equal(next.mode, "next_step");
    assert.equal(next.requestedStep, 2);
    assert.equal((await get("problems/" + next.problemId)).step, 2);
    const progress = await get("progress");
    assert.equal(progress.independent, 1);
    assert.equal(progress.assisted, 0);
    assert.equal(
      progress.evidence.filter(
        (e) =>
          e.problemId === "arrays-hashing-01" &&
          e.outcome === "accepted" &&
          e.advancementEligible,
      ).length,
      1,
      "One conceptual advancement, separate language demonstrations",
    );
    const drafts = {};
    for (const language of ["python", "java", "cpp"]) {
      const d = await get("drafts/arrays-hashing-01/" + language);
      assert.equal(
        hash(lf(d.code)),
        hash(reference("arrays-hashing-01", language)),
      );
      drafts[language] = {
        codeHash: hash(lf(d.code)),
        codeBytes: Buffer.byteLength(lf(d.code)),
        revision: d.revision,
      };
    }
    report.preRestart = {
      progress,
      progressHash: hash(progress),
      evidenceHash: hash(progress.evidence),
      earnedNext: next,
      drafts,
      jobIds: report.jobs.map((j) => j.id),
      settings: { focusTopic: "arrays-hashing", autoExplain: false },
      providerInferenceCalls: 0,
    };
    } else {
      const rows = await get("jobs?pageSize=100");
      assert.deepEqual(rows.items.map((row) => row.id).sort(), report.preRestart.jobIds.slice().sort());
      assert.equal(hash((await get("progress")).evidence), report.preRestart.evidenceHash);
    }
    await showEarnedNextUI();
    await capture("earned-next-before-process-restart");
    report.status = "awaiting-owned-process-restart";
    report.restartInstructions =
      "Close only this verified fixture process through the frontend-owned async file-backed helper; preserve this same isolated dataDir. No job may be replayed. Resume --phase=after-restart after actual freshPID/readiness/source checks.";
    save();
  } else {
    if (!recoverExposure) {
    report.restart = {
      oldPid: before.fixture.pid,
      newPid: fixture.pid,
      sameDataDir: true,
      observedAt: new Date().toISOString(),
    };
    const progress = await get("progress");
    assert.equal(hash(progress.evidence), report.preRestart.evidenceHash);
    assert.equal(progress.independent, 1);
    assert.equal(progress.assisted, 0);
    const restoredJobs = await get("jobs?pageSize=100");
    assert.equal(restoredJobs.items.length, 7);
    assert.deepEqual(
      restoredJobs.items.map((j) => j.id).sort(),
      report.preRestart.jobIds.slice().sort(),
    );
    for (const j of report.jobs) {
      const restored = await get("jobs/" + j.id);
      assert.equal(restored.status, j.status);
      assert.equal(hash(lf(restored.code)), j.codeHash);
    }
    for (const language of ["python", "java", "cpp"])
      assert.equal(
        hash(lf((await get("drafts/arrays-hashing-01/" + language)).code)),
        report.preRestart.drafts[language].codeHash,
      );
    const restoredNext = await get(
      "recommendation?topic=arrays-hashing&language=python",
    );
    assert.equal(restoredNext.requestedStep, 2);
    assert.equal(restoredNext.mode, "next_step");
    report.checks.push({
      name: "actual-process-restart-restores-drafts-jobs-earned-next-and-no-duplicate-evidence",
      recommendation: restoredNext,
    });
    await showEarnedNextUI();
    await capture("restored-earned-next-after-process-restart");
    if (recoverHint) {
      const existingHint = await get("library/a962c4fa-78fb-47fb-b208-578ae464e8ce");
      assert.equal(existingHint.problemId, "arrays-hashing-03");
      assert.equal(existingHint.language, "python");
      assert.equal(existingHint.action, "hint");
      assert.equal(existingHint.status, "complete");
      assert.equal(report.generations.length, 0);
      await page.goto(base + "/library/" + existingHint.id);
      await expect(page.locator(".lesson-content").filter({ hasText: "Controlled local provider fixture" })).toBeVisible();
      report.generations.push({ id: existingHint.id, problemId: existingHint.problemId, language: existingHint.language, action: existingHint.action, status: existingHint.status, markdownHash: hash(existingHint.markdown), provider: "explicit controlled local fixture; not live DeepSeek", viewedSaved: true, recoveredWithoutNewInference: true });
      save();
    } else {
      await providerSetup();
      await tutor("arrays-hashing-03", "python", "hint");
    }
    await open("arrays-hashing-03", "python");
    const hinted = await submit(scenarios[7]);
    const hintedProgress = await get("progress");
    assert.equal(
      hintedProgress.evidence.find((e) => e.id === hinted.id).assisted,
      true,
    );
    const checkpoint = await get(
      "recommendation?topic=arrays-hashing&language=python",
    );
    assert.equal(checkpoint.mode, "same_step_checkpoint");
    assert.equal(checkpoint.requestedStep, 2);
    assert.equal(checkpoint.problemId, "arrays-hashing-04");
    report.checks.push({
      name: "hint-assisted-real-acceptance-produces-unseen-same-step-checkpoint",
      recommendation: checkpoint,
    });
    await capture("assisted-same-step-checkpoint");
    await tutor("arrays-hashing-04", "java", "solution");
    } else {
      const rows = await get("jobs?pageSize=100");
      assert.deepEqual(rows.items.map((row) => row.id).sort(), report.jobs.map((row) => row.id).sort());
      assert.equal(report.generations.length, 2);
      for (const row of report.jobs) {
        const actual = await get("jobs/" + row.id);
        assert.equal(actual.status, row.status);
        assert.equal(hash(lf(actual.code)), row.codeHash);
      }
      for (const row of report.generations) {
        const saved = await get("library/" + row.id);
        assert.equal(hash(saved.markdown), row.markdownHash);
        assert.equal(saved.status, "complete");
      }
      await page.goto(base + "/library/" + report.generations[1].id);
      await expect(page.locator(".lesson-content").filter({ hasText: "Controlled local provider fixture" })).toBeVisible();
    }
    assert.equal(
      (await get("problems/arrays-hashing-04/state")).assisted,
      false,
      "Exposure alone must not invent an accepted aided solve",
    );
    const solutionHistory = await get("library?problemId=arrays-hashing-04&action=solution");
    assert.ok(solutionHistory.items.some((row) => row.id === report.generations[1].id), "Normal saved history associates the viewed solution with its question");
    const exportState = await get("data/export");
    assert.ok(exportState.assistance.some((row) => row.problem === "arrays-hashing-04" && row.kind === "solution"), "Durable exported exposure is separate from accepted evidence");
    await open("arrays-hashing-04", "cpp");
    const exposed = await submit(scenarios[8]);
    assert.equal(
      (await get("progress")).evidence.find((e) => e.id === exposed.id)
        .assisted,
      true,
    );
    report.checks.push({
      name: "Java-full-solution-view-marks-Cpp-real-acceptance-assisted",
      jobId: exposed.id,
    });
    await capture("cross-language-assistance-after-real-submit");
    await open("arrays-hashing-02", "python");
    const doubled = await submit(scenarios[9]);
    const final = await get("progress");
    assert.equal(final.evidence.filter((e) => e.id === doubled.id).length, 1);
    assert.equal(
      final.evidence.filter(
        (e) => e.problemId === "arrays-hashing-02" && e.outcome === "accepted",
      ).length,
      1,
    );
    assert.equal(final.independent, 2);
    assert.equal(final.assisted, 2);
    assert.equal((await get("jobs?pageSize=100")).items.length, 10);
    assert.equal(new Set(report.jobs.map((j) => j.id)).size, 10);
    assert.equal(report.jobs.length, 10);
    assert.equal(report.generations.length, 2);
    assert.equal(report.blockedUnexpectedJobPosts, 0);
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.externalRequests, []);
    report.finalProgress = {
      independent: final.independent,
      assisted: final.assisted,
      evidenceHash: hash(final.evidence),
    };
    report.checks.push({
      name: "actual-double-click-one-immutable-job-and-one-mastery-update",
      jobId: doubled.id,
    });
    await capture("final-ten-real-jobs");
    report.sourceHashesAfter = sourceHashes();
    assert.deepEqual(report.sourceHashesAfter, report.sourceHashesBefore);
    report.status = "passed";
    report.finishedAt = new Date().toISOString();
    save();
  }
} catch (error) {
  report.status = "failed";
  report.failure = {
    message: String(error.message).replace(
      /fixture-only-no-real-credential-[A-Za-z0-9-]+/g,
      "[controlled-fixture-credential-redacted]",
    ),
    phase,
    urlPath: new URL(page.url()).pathname,
  };
  try {
    await capture("failed-" + phase + "-" + Date.now());
  } catch {}
  save();
  process.exitCode = 1;
} finally {
  await Promise.allSettled(pendingObservers);
  report.phasePosts = (report.phasePosts ?? 0) + phasePosts;
  save();
  await browser.close();
  console.log(
    JSON.stringify({
      status: report.status,
      phase,
      jobs: report.jobs.length,
      phasePosts,
      report: journal,
    }),
  );
}
