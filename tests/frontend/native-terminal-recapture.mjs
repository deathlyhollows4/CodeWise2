import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

assert.equal(base, "http://127.0.0.1:3192");
const hash = (value) => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest("hex");
const original = JSON.parse(readFileSync("docs/release-evidence/frontend-final-native/report.json", "utf8"));
assert.equal(original.status, "passed");
assert.equal(original.jobs.length, 10);
const dir = resolve("docs/release-evidence/frontend-native-terminal");
mkdirSync(dir, { recursive: true });
const report = { timestamp: new Date().toISOString(), status: "running", scope: "Select existing immutable job history in the actual UI; zero jobs or provider requests. Original fast captures are preserved.", jobs: [], captures: [], errors: [], forbiddenPosts: [], assets: [] };
const browser = await launchBrowser(), context = await browser.newContext({ viewport: { width: 1366, height: 1000 } }), page = await context.newPage();
const pending = [];
page.on("pageerror", (error) => report.errors.push(error.message));
await context.route("**/api/**", async (route) => {
  const request = route.request(), path = new URL(request.url()).pathname;
  if (request.method() === "POST" && ["/api/jobs", "/api/tutor"].includes(path)) {
    report.forbiddenPosts.push({ method: request.method(), path });
    await route.abort("blockedbyclient");
  } else await route.continue();
});
page.on("response", (response) => {
  const path = new URL(response.url()).pathname;
  if (/^\/assets\/.*\.(js|css)$/.test(path)) pending.push(response.body().then((bytes) => {
    if (!report.assets.some((asset) => asset.path === path)) report.assets.push({ path, hash: hash(bytes), bytes: bytes.length });
  }).catch((error) => report.errors.push(error.message)));
});
const get = async (path) => { const response = await context.request.get(base + "/api/" + path); assert.equal(response.status(), 200, path); return response.json(); };
const label = (value) => value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
const languageName = { python: "Python", java: "Java", cpp: "C++" };
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
try {
  const boot = await get("bootstrap"), before = await get("progress");
  assert.equal(boot.fixture, true);
  assert.equal(boot.catalogue.published, 243);
  assert.equal(boot.runner.ready, true);
  assert.equal((await get("jobs?pageSize=100")).total, 10);
  report.evidenceBefore = hash(before.evidence);
  for (const number of [2, 4, 7, 1, 6, 9, 10]) {
    const recorded = original.jobs.find((job) => job.scenario === number), job = await get("jobs/" + recorded.id);
    assert.equal(job.status, recorded.status);
    assert.equal(hash(job.code.replaceAll("\r\n", "\n")), recorded.codeHash);
    await page.goto(base + "/problems/" + job.problemId);
    await page.getByLabel("Programming language", { exact: true }).selectOption(job.language);
    await expect(page.getByRole("button", { name: "Submit", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "History", exact: true }).click();
    const selectedResponse = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/jobs/" + job.id);
    const button = page.getByRole("button", { name: new RegExp("^" + escape(label(job.status) + " · " + languageName[job.language])) });
    await expect(button).toHaveCount(1);
    await button.click();
    assert.equal((await selectedResponse).status(), 200);
    const results = page.locator(".results");
    await expect(results.getByRole("heading", { name: label(job.status), exact: true })).toBeVisible();
    const counts = job.result.counts;
    await expect(results).toContainText(`${counts.passed} passed · ${counts.failed} failed · ${counts.executed} executed · ${counts.notRun} not run / ${counts.total} total`);
    await expect(results.locator("pre").first()).toHaveText(job.result.diagnostics);
    assert.ok(job.result.diagnostics.trim().length > 0, "Meaningful saved feedback");
    const path = resolve(dir, `scenario-${number}-${job.language}-${job.status}.png`);
    await page.screenshot({ path, fullPage: false });
    report.captures.push(path);
    report.jobs.push({ scenario: number, id: job.id, status: job.status, language: job.language, counts, feedbackHash: hash(job.result.diagnostics), sourceHash: hash(job.code), evidenceAssisted: before.evidence.find((entry) => entry.id === job.id)?.assisted ?? null });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  }
  const after = await get("progress");
  assert.equal(hash(after.evidence), report.evidenceBefore);
  assert.equal((await get("jobs?pageSize=100")).total, 10);
  assert.equal(report.jobs.find((job) => job.scenario === 9).evidenceAssisted, true);
  assert.equal(report.jobs.find((job) => job.scenario === 10).evidenceAssisted, false);
  const topic = (await get("topics")).find((entry) => entry.id === "arrays-hashing");
  assert.equal(topic.independent, 2);
  assert.equal(topic.assisted, 2);
  assert.equal(topic.independent, before.independent);
  assert.equal(topic.assisted, before.assisted);
  await page.goto(base + "/topics/arrays-hashing");
  await expect(page.locator(".page-head .badge")).toHaveText("2 independent · 2 with help");
  const badgePath = resolve(dir, "topic-counts-desktop.png");
  await page.screenshot({ path: badgePath });
  report.captures.push(badgePath);
  report.topicCounts = { independent: topic.independent, assisted: topic.assisted, matchedActualBadge: true };
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/topics/arrays-hashing");
  await page.waitForFunction(() => {
    const sidebar = document.querySelector(".sidebar");
    return sidebar && sidebar.getBoundingClientRect().right <= 1;
  });
  await expect(page.locator(".page-head .badge")).toHaveText("2 independent · 2 with help");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  const mobilePath = resolve(dir, "topic-counts-mobile.png");
  await page.screenshot({ path: mobilePath });
  report.captures.push(mobilePath);
  await Promise.all(pending);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.forbiddenPosts, []);
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.failure = { message: error.message, stack: error.stack, path: new URL(page.url()).pathname };
  const path = resolve(dir, "failure-" + Date.now() + ".png");
  await page.screenshot({ path }).catch(() => {});
  report.captures.push(path);
  process.exitCode = 1;
} finally {
  report.harnessHash = hash(readFileSync(new URL(import.meta.url)));
  report.sourceHashes = Object.fromEntries(["apps/web/src/App.tsx", "apps/web/src/LiveLesson.tsx", "apps/server/src/app.ts"].map((path) => [path, hash(readFileSync(path))]));
  writeFileSync(resolve(dir, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify({ status: report.status, existingJobsInspected: report.jobs.length, forbiddenPosts: report.forbiddenPosts.length }));
}
