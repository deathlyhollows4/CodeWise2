import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
if (new URL(base).port !== "3138")
  throw Error("Use the dedicated approved assessment bridge3138.");
const output = resolve("docs/release-evidence/frontend-assessment");
mkdirSync(output, { recursive: true });
const browser = await launchBrowser(),
  context = await browser.newContext({
    viewport: { width: 1366, height: 1000 },
    permissions: ["clipboard-read", "clipboard-write"],
  }),
  page = await context.newPage();
const report = {
  timestamp: new Date().toISOString(),
  base,
  scope:
    "Temporary draft-preview profile; real isolated normal-API grading with trusted Python reference QA inputs, not learner proficiency or release publication proof",
  status: "running",
  checks: [],
  jobs: [],
  captures: [],
  errors: [],
  externalRequests: [],
  tutorRequests: 0,
  jobPosts: 0,
};
const hash = (x) =>
  createHash("sha256")
    .update(typeof x === "string" ? x : JSON.stringify(x))
    .digest("hex");
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("request", (r) => {
  const url = new URL(r.url());
  if (r.method() === "POST" && url.pathname === "/api/tutor")
    report.tutorRequests++;
  if (r.method() === "POST" && url.pathname === "/api/jobs") report.jobPosts++;
  if (
    !r.url().startsWith(base) &&
    !r.url().startsWith("blob:") &&
    !r.url().startsWith("data:")
  )
    report.externalRequests.push(r.url());
});
const get = async (path) => {
  const response = await context.request.get(base + "/api/" + path);
  assert.equal(response.status(), 200, path);
  return response.json();
};
async function capture(name) {
  const path = resolve(output, name + ".png");
  await page.screenshot({ path, fullPage: false });
  report.captures.push(path);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
    false,
    "No overflow",
  );
}
async function submit() {
  const posted = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/jobs" &&
      r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  const response = await posted;
  assert.ok(response.ok());
  const created = await response.json();
  let terminal;
  await expect
    .poll(
      async () => {
        terminal = await get("jobs/" + created.id);
        return !["queued", "compiling", "running"].includes(terminal.status);
      },
      { timeout: 120000, intervals: [250, 500, 1000] },
    )
    .toBe(true);
  report.jobs.push({
    id: terminal.id,
    problemId: terminal.problemId,
    status: terminal.status,
    language: terminal.language,
    meaningful: terminal.meaningfulConceptualAttempt,
    counts: terminal.result?.counts,
    codeHash: hash(terminal.code),
  });
  return terminal;
}
async function enterReference(problemId) {
  assert.match(
    problemId,
    /^(binary-search|trees)-0[1-4]$/,
    "Frozen core IDs only",
  );
  const code = readFileSync(
    resolve("content/problems", problemId, "languages/python/reference.py"),
    "utf8",
  ).replaceAll("\r\n", "\n");
  await page
    .locator(".editor .monaco-editor")
    .click({ position: { x: 120, y: 45 } });
  await page.keyboard.press("Control+A");
  await page.evaluate((text) => navigator.clipboard.writeText(text), code);
  await page.keyboard.press("Control+V");
  await expect
    .poll(async () => (await get("drafts/" + problemId + "/python")).code, {
      timeout: 15000,
    })
    .toBe(code);
  report.checks.push(
    "Exact saved Python draft bytes verified before submitting " + problemId,
  );
  return code;
}
try {
  await page.goto(base + "/");
  await page.locator(".fixture-banner").waitFor();
  const b = await get("bootstrap");
  assert.equal(b.fixture, true);
  assert.equal(b.catalogue.published, 0);
  assert.equal(b.catalogue.preview, 8);
  assert.equal(b.runner.ready, true);
  assert.equal(b.key.configured, false);
  report.initialCatalogue = b.catalogue;
  let state;
  if (process.env.CODEWISE2_ASSESSMENT_RESUME === "1") {
    state = await get("assessment");
    report.assessmentId = state.id;
    report.previousAttemptEvidence = [
      "first-failed-report.json",
      "second-failed-report.json",
    ];
    await page.goto(base + "/assessment");
  } else {
    const prefs = await context.request.put(base + "/api/settings", {
      headers: { Origin: base, "X-CSRF-Token": b.csrfToken },
      data: {
        onboarded: true,
        language: "python",
        theme: "dark",
        autoExplain: false,
      },
    });
    assert.equal(prefs.status(), 200);
    await page.goto(base + "/assessment");
    await page.locator(".fixture-banner").waitFor();
    await page
      .getByLabel("Assessment language", { exact: true })
      .selectOption("python");
    await page
      .getByRole("button", { name: "Start a new assessment", exact: true })
      .click();
    await expect(page.locator("[data-assessment-progress]")).toContainText(
      "0 of 6",
    );
    state = await get("assessment");
    assert.equal(state.targetQuestions, 6);
    assert.equal(state.problemIds.length, 1);
    report.assessmentId = state.id;
    await capture("start-1366-dark");
    let releaseSelection, releaseDraft, selectionSeen, draftSeen;
    const selectionWait = new Promise((r) => (releaseSelection = r)),
      draftWait = new Promise((r) => (releaseDraft = r)),
      sawSelection = new Promise((r) => (selectionSeen = r)),
      sawDraft = new Promise((r) => (draftSeen = r));
    let selectionHeld = false,
      draftHeld = false;
    await page.route("**/api/assessment", async (route) => {
      if (!selectionHeld && route.request().method() === "GET") {
        selectionHeld = true;
        selectionSeen();
        await selectionWait;
      }
      await route.continue();
    });
    const first = state.currentProblemId;
    await page.route("**/api/drafts/" + first + "/python", async (route) => {
      if (!draftHeld && route.request().method() === "GET") {
        draftHeld = true;
        draftSeen();
        await draftWait;
      }
      await route.continue();
    });
    await page
      .getByRole("link", { name: "Open current question →", exact: true })
      .click();
    await Promise.all([sawSelection, sawDraft]);
    await expect(
      page.getByRole("button", { name: "Submit", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Run", exact: true }),
    ).toBeDisabled();
    releaseSelection();
    await expect(
      page.getByRole("button", { name: "Submit", exact: true }),
    ).toBeDisabled();
    releaseDraft();
    await expect(
      page.getByRole("button", { name: "Submit", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByLabel("Programming language", { exact: true }),
    ).toHaveValue("python");
    await expect(
      page.getByLabel("Programming language", { exact: true }),
    ).toBeDisabled();
    await page.unroute("**/api/assessment");
    await page.unroute("**/api/drafts/" + first + "/python");
    report.checks.push(
      "Delayed selected state/draft block all execution; fixed Python unlocks only after actual draft load",
    );
    const untouched = await submit();
    assert.equal(untouched.meaningfulConceptualAttempt, false);
    await page
      .getByRole("link", { name: "View assessment progress →", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Check saved graded submit and continue",
        exact: true,
      })
      .click();
    state = await get("assessment");
    assert.equal(state.completed.length, 0);
    assert.equal(state.currentProblemId, first);
    report.checks.push(
      "Actual unchanged-starter Submit retained but excluded from assessment",
    );
  }
  if (process.env.CODEWISE2_ASSESSMENT_RESUME === "1") {
    const latest = (
      await get(
        "jobs?problemId=" +
          state.currentProblemId +
          "&language=python&pageSize=1",
      )
    ).items[0];
    const recovered = await get("jobs/" + latest.id);
    assert.equal(recovered.status, "accepted");
    const expected = readFileSync(
      resolve(
        "content/problems",
        state.currentProblemId,
        "languages/python/reference.py",
      ),
      "utf8",
    ).replaceAll("\r\n", "\n");
    assert.equal(recovered.code, expected);
    report.reusedAcceptedJob = {
      id: recovered.id,
      codeHash: hash(recovered.code),
      counts: recovered.result.counts,
    };
    await page
      .getByRole("button", {
        name: "Check saved graded submit and continue",
        exact: true,
      })
      .click();
    await expect
      .poll(async () => (await get("assessment")).completed.length)
      .toBe(1);
    state = await get("assessment");
  }
  for (let index = state.completed.length; index < 6; index++) {
    state = await get("assessment");
    assert.equal(state.status, "active");
    assert.equal(state.completed.length, index);
    const id = state.currentProblemId;
    if (new URL(page.url()).pathname === "/assessment")
      await page
        .getByRole("link", { name: "Open current question →", exact: true })
        .click();
    await expect(
      page.getByRole("button", { name: "Submit", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByLabel("Programming language", { exact: true }),
    ).toHaveValue("python");
    const code = await enterReference(id);
    const job = await submit();
    assert.equal(job.status, "accepted", "Real reference grade " + id);
    assert.equal(
      hash(job.code),
      hash(code),
      "Immutable source snapshot matches actual editor input",
    );
    assert.equal(job.meaningfulConceptualAttempt, true);
    await expect(
      page.getByRole("button", {
        name: "Use graded submit and continue",
        exact: true,
      }),
    ).toBeEnabled();
    if (index === 0) await capture("graded-question-1366-dark");
    await page
      .getByRole("button", {
        name: "Use graded submit and continue",
        exact: true,
      })
      .click();
    await expect
      .poll(
        async () => {
          state = await get("assessment");
          return state.completed.length;
        },
        { timeout: 10000 },
      )
      .toBe(index + 1);
    if (index === 2) {
      await page.reload();
      await page.locator(".fixture-banner").waitFor();
      await expect(
        page.getByLabel("Programming language", { exact: true }),
      ).toBeDisabled();
      assert.equal((await get("assessment")).completed.length, 3);
      report.checks.push(
        "Saved active session/question survives actual reload",
      );
    }
  }
  await expect(
    page.getByRole("heading", {
      name: "Your observed starting point",
      exact: true,
    }),
  ).toBeVisible();
  state = await get("assessment");
  assert.equal(state.status, "complete");
  assert.equal(state.observations.length, 6);
  assert.ok(state.knownSkillIds.length > 0);
  assert.ok(
    state.observations.every((o) => o.outcome === "independent-accepted"),
  );
  report.completedState = state;
  report.checks.push(
    "Six real tagged reference QA submits complete the adaptive session; observed skill result is conservative and separate from unassessed topics",
  );
  await capture("complete-1366-dark");
  await page.reload();
  assert.equal((await get("assessment")).status, "complete");
  report.checks.push("Completed result survives reload without inference");
  await page
    .getByRole("button", { name: "Start a new assessment", exact: true })
    .click();
  state = await get("assessment");
  assert.notEqual(state.id, report.assessmentId);
  assert.equal(state.completed.length, 0);
  await page
    .getByRole("button", {
      name: "Check saved graded submit and continue",
      exact: true,
    })
    .click();
  assert.equal(
    (await get("assessment")).completed.length,
    0,
    "Prior-session grades do not count",
  );
  await page
    .getByRole("link", { name: "Open current question →", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Submit", exact: true }),
  ).toBeEnabled();
  const stopId = (await get("assessment")).currentProblemId;
  await enterReference(stopId);
  const stopJob = await submit();
  assert.equal(stopJob.status, "accepted");
  await page
    .getByRole("button", { name: "Stop assessment early", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Assessment stopped", exact: true }),
  ).toBeVisible();
  state = await get("assessment");
  assert.equal(state.status, "stopped");
  assert.equal(
    state.completed.length,
    1,
    "Stop consumes finished eligible result",
  );
  await page.reload();
  assert.equal((await get("assessment")).status, "stopped");
  report.stoppedState = state;
  report.checks.push(
    "Restart ignores old grades; Stop after a finished Submit records exactly one observation and survives reload",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(
    () =>
      !document.querySelector(".sidebar") ||
      document.querySelector(".sidebar").getBoundingClientRect().right <= 1,
  );
  await capture("stopped-390-dark");
  assert.equal(
    report.jobPosts,
    process.env.CODEWISE2_ASSESSMENT_RESUME === "1" ? 6 : 8,
  );
  assert.equal(report.tutorRequests, 0);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.externalRequests, []);
  report.servedAssets = [];
  for (const url of await page.evaluate(() =>
    [...document.querySelectorAll("script[src],link[rel=stylesheet]")].map(
      (e) => e.src || e.href,
    ),
  )) {
    const r = await context.request.get(url);
    report.servedAssets.push({ url, sha256: hash(await r.text()) });
  }
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.failure = {
    message: error.message,
    stack: error.stack,
    url: page.url(),
  };
  try {
    await capture("failure-" + Date.now());
  } catch {}
  process.exitCode = 1;
} finally {
  writeFileSync(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
