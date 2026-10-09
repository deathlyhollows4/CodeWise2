import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const dir = resolve("docs/release-evidence/frontend-final-controls"),
  prior = JSON.parse(
    readFileSync(
      resolve(dir, "failed-exposed-teacher-entry-report.json"),
      "utf8",
    ),
  );
const browser = await launchBrowser(),
  context = await browser.newContext({
    viewport: { width: 1366, height: 1000 },
  }),
  page = await context.newPage();
const get = async (p) => {
  const r = await context.request.get(base + "/api/" + p);
  assert.equal(r.status(), 200);
  return r.json();
};
const b = await get("bootstrap");
assert.equal(b.fixture, true);
const prefs = async (v) => {
  const r = await context.request.put(base + "/api/settings", {
    headers: { Origin: base, "X-CSRF-Token": b.csrfToken },
    data: v,
  });
  assert.equal(r.status(), 200);
};
try {
  assert.equal(prior.checks.length, 3);
  assert.equal(prior.errors.length, 0);
  assert.equal(prior.dispatch.length, 0);
  const captures = prior.captures.filter(
    (p) => !p.split(/[\\/]/).at(-1).startsWith("failure-"),
  );
  assert.equal(captures.length, 16);
  for (const p of captures) assert.ok(existsSync(p));
  for (const asset of prior.assets) {
    const r = await context.request.get(asset.url);
    assert.equal(
      createHash("sha256")
        .update(await r.body())
        .digest("hex"),
      asset.sha256,
    );
  }
  const sources = await get("sources");
  assert.equal(sources.length, 243);
  assert.ok(
    sources.every(
      (s) =>
        s.independentReview === "passed" &&
        s.authorIndependentReview === "pending" &&
        !Object.hasOwn(s, "reviewIdentity") &&
        !Object.hasOwn(s, "internalReviewIdentity") &&
        s.reviewSnapshot,
    ),
  );
  const state = await get("data/export");
  assert.deepEqual(state.evidence, []);
  assert.ok(
    state.assistance.some(
      (a) => a.problem === "arrays-hashing-01" && a.kind === "solution",
    ),
  );
  await prefs({ onboarded: true, theme: "dark" });
  await page.goto(base + "/topics/two-pointers");
  const response = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/recommendation" &&
      new URL(r.url()).searchParams.get("topic") === "two-pointers",
  );
  await page
    .getByRole("button", { name: "Suggest a challenge", exact: true })
    .click();
  const recommendation = await (await response).json();
  assert.equal(recommendation.problemId, null);
  assert.ok(recommendation.excludedExposures.includes("arrays-hashing-01"));
  await expect(
    page.getByRole("heading", {
      name: "No eligible new challenge right now",
      exact: true,
    }),
  ).toBeVisible();
  const exhausted = resolve(dir, "truthful-exposed-teacher-consolidation.png");
  await page.screenshot({ path: exhausted, fullPage: false });
  captures.push(exhausted);
  for (const [theme, width] of [
    ["dark", 1366],
    ["light", 390],
  ]) {
    await prefs({ theme });
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const settled = page.waitForResponse(
      (r) => new URL(r.url()).pathname === "/api/recommendation",
    );
    await page.goto(base + "/");
    await settled;
    await page.waitForLoadState("networkidle");
    const path = resolve(dir, `settled-home-${theme}-${width}.png`);
    await page.screenshot({ path, fullPage: false });
    captures.push(path);
  }
  const final = {
    ...prior,
    status: "passed",
    scope:
      "Current palette keyboard/empty/retry +16responsive header/palette captures, truthful existing solution-exposure consolidation, current Sources boundary. Truly pristine18-topic entry is separate.",
    captures,
    failure: undefined,
    historyCase: { recommendation, solutionExposurePreserved: true },
    sourcesBoundary: {
      rows: 243,
      allCurrentIndependentPassed: true,
      originalAuthorPendingPreserved: true,
      reviewIdentityAbsent: true,
      internalReviewIdentityAbsent: true,
      reviewSnapshotIntended: true,
    },
    initialTopicEntries: "../frontend-final-topic-entry/report.json",
    reconciledAt: new Date().toISOString(),
    originalFailurePreserved: "failed-exposed-teacher-entry-report.json",
  };
  writeFileSync(resolve(dir, "report.json"), JSON.stringify(final, null, 2));
  console.log(
    JSON.stringify(
      { status: final.status, captures: captures.length, sources: 243 },
      null,
      2,
    ),
  );
} catch (e) {
  console.error(e.stack);
  process.exitCode = 1;
} finally {
  await prefs({
    onboarded: b.preferences.onboarded,
    theme: b.preferences.theme,
  });
  await browser.close();
}
