import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
const dir = resolve("docs/release-evidence/frontend-final-topic-entry");
mkdirSync(dir, { recursive: true });
const browser = await launchBrowser(),
  context = await browser.newContext({
    viewport: { width: 1366, height: 1000 },
  }),
  page = await context.newPage();
const report = {
  timestamp: new Date().toISOString(),
  status: "running",
  scope:
    "Actual18 initial topic entries on truly pristine published243/no-history/no-runner controlled fixture; no mastery/provider/native dispatch.",
  entries: [],
  captures: [],
  errors: [],
  dispatch: [],
};
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("request", (r) => {
  if (
    r.method() === "POST" &&
    /^\/api\/(jobs|tutor)(?:\/|$)/.test(new URL(r.url()).pathname)
  )
    report.dispatch.push(r.url());
});
const get = async (p) => {
  const r = await context.request.get(base + "/api/" + p);
  assert.equal(r.status(), 200);
  return r.json();
};
const b = await get("bootstrap");
assert.equal(b.fixture, true);
assert.equal(b.catalogue.published, 243);
assert.equal(b.key.configured, false);
const backup = await get("data/export");
assert.equal(backup.assistance.length, 0);
assert.equal(backup.evidence.length, 0);
assert.equal(backup.jobs.length, 0);
assert.equal(backup.generations.length, 0);
const prefs = async (data) => {
  const r = await context.request.put(base + "/api/settings", {
    headers: { Origin: base, "X-CSRF-Token": b.csrfToken },
    data,
  });
  assert.equal(r.status(), 200);
};
async function capture(name) {
  const path = resolve(dir, name + ".png");
  await page.screenshot({ path, fullPage: false });
  report.captures.push(path);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
    false,
  );
}
async function suggest(topic) {
  await page.goto(base + "/topics/" + topic.id);
  const pending = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/recommendation" &&
      new URL(r.url()).searchParams.get("topic") === topic.id,
  );
  await page
    .getByRole("button", { name: "Suggest a challenge", exact: true })
    .click();
  const response = await pending;
  assert.equal(response.status(), 200);
  const r = await response.json();
  assert.equal(r.focusTopic, topic.id);
  assert.ok(r.problemId, topic.id);
  assert.deepEqual(r.excludedExposures, []);
  const p = await get("problems/" + r.problemId);
  assert.equal(p.prerequisites.length, 0);
  await expect(
    page.getByRole("region", { name: "Topic challenge suggestion" }),
  ).toContainText(p.title);
  report.entries.push({
    topic: topic.id,
    selected: p.id,
    selectedTopic: p.primaryTopic,
    mode: r.mode,
    pendingStep: r.pendingStep,
    rationale: r.rationale,
  });
  return { r, p };
}
try {
  await prefs({ onboarded: true, theme: "dark", language: "python" });
  const topics = await get("topics");
  assert.equal(topics.length, 18);
  let chosen;
  for (const topic of topics) {
    const entry = await suggest(topic);
    if (entry.r.mode === "prerequisite_remediation" && !chosen) chosen = topic;
  }
  assert.ok(chosen);
  const { r, p } = await suggest(chosen);
  await capture("real-prerequisite-1366-dark");
  await page
    .getByRole("button", { name: "Start prerequisite practice", exact: true })
    .click();
  await expect(page).toHaveURL(base + "/problems/" + p.id);
  await expect(page.locator(".monaco-editor")).toBeVisible();
  const selected = await get("data/export");
  assert.equal(selected.learningMetadata.pendingChallenge.topic, chosen.id);
  assert.equal(selected.learningMetadata.pendingChallenge.step, 1);
  assert.equal(selected.learningMetadata.currentSelection.problemId, p.id);
  await page.reload();
  await expect(page.locator(".monaco-editor")).toBeVisible();
  const resumed = await get("recommendation");
  assert.equal(resumed.focusTopic, chosen.id);
  assert.equal(resumed.problemId, p.id);
  report.selectedTeacher = {
    topic: chosen.id,
    teacher: p.id,
    reloadPreserved: true,
  };
  await page.setViewportSize({ width: 390, height: 844 });
  await suggest(chosen);
  await page.waitForFunction(
    () => document.querySelector(".sidebar").getBoundingClientRect().right <= 1,
  );
  await capture("real-prerequisite-390-dark");
  const after = await get("data/export");
  assert.equal(after.assistance.length, 0);
  assert.equal(after.evidence.length, 0);
  assert.equal(after.jobs.length, 0);
  assert.equal(after.generations.length, 0);
  report.zeroExposureEvidencePreserved = true;
  assert.equal(report.errors.length, 0);
  assert.equal(report.dispatch.length, 0);
  report.status = "passed";
} catch (e) {
  report.status = "failed";
  report.failure = { message: e.message, stack: e.stack, url: page.url() };
  await capture("failure-" + Date.now()).catch(() => {});
  console.error(e.stack);
  process.exitCode = 1;
} finally {
  await prefs({
    onboarded: b.preferences.onboarded,
    theme: b.preferences.theme,
    language: b.preferences.language,
  });
  writeFileSync(resolve(dir, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(
    JSON.stringify(
      {
        status: report.status,
        entries: report.entries.length,
        captures: report.captures.length,
      },
      null,
      2,
    ),
  );
}
