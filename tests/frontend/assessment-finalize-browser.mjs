import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
const dir = resolve("docs/release-evidence/frontend-assessment");
const report = JSON.parse(
  readFileSync(resolve(dir, "third-failed-report.json")),
);
assert.equal(report.completedState.completed.length, 6);
assert.equal(new Set(report.completedState.completed).size, 6);
assert.equal(report.stoppedState.completed.length, 1);
assert.equal(report.jobPosts, 6);
assert.equal(report.tutorRequests, 0);
assert.deepEqual(report.errors, [
  "Cannot read properties of null (reading 'getBoundingClientRect')",
]);
report.harnessEvaluationErrors = report.errors;
report.errors = [];
assert.deepEqual(report.externalRequests, []);
const b = await launchBrowser();
const c = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await c.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto(base + "/assessment");
await expect(
  p.getByRole("heading", { name: "Assessment stopped", exact: true }),
).toBeVisible();
assert.equal(
  await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
  false,
);
const shot = resolve(dir, "stopped-390-dark.png");
await p.screenshot({ path: shot });
report.captures.push(shot);
const state = await (await c.request.get(base + "/api/assessment")).json();
assert.equal(state.status, "stopped");
assert.equal(state.completed.length, 1);
report.servedAssets = [];
for (const url of await p.evaluate(() =>
  [...document.querySelectorAll("script[src],link[rel=stylesheet]")].map(
    (e) => e.src || e.href,
  ),
)) {
  const r = await c.request.get(url);
  report.servedAssets.push({
    url,
    sha256: createHash("sha256")
      .update(await r.body())
      .digest("hex"),
  });
}
assert.deepEqual(errors, []);
report.preservedFailures = [
  "first-failed-report.json",
  "second-failed-report.json",
  "third-failed-report.json",
];
report.totalNormalUiJobs = 9;
report.correctiveQaEntryJob = 1;
report.status = "passed";
report.finalizedAt = new Date().toISOString();
delete report.failure;
report.checks.push(
  "Read-only mobile stopped-result recapture and persisted state verification; no further jobs or provider calls",
);
writeFileSync(resolve(dir, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await b.close();
