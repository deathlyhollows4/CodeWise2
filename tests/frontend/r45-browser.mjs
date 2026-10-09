import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
const output = resolve("docs/release-evidence/frontend-r45");
mkdirSync(output, { recursive: true });
const browser = await launchBrowser(),
  context = await browser.newContext({
    viewport: { width: 1366, height: 1000 },
  }),
  page = await context.newPage();
const report = {
  timestamp: new Date().toISOString(),
  scope:
    "Actual labelled localhost fixture settings persistence/Home priority; no inference/reference execution",
  checks: [],
  captures: [],
  errors: [],
  externalRequests: [],
  generationRequests: 0,
  servedAssets: [],
  status: "running",
};
const hash = (value) =>
  createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex");
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("request", (r) => {
  const url = new URL(r.url());
  if (r.method() === "POST" && url.pathname === "/api/tutor")
    report.generationRequests++;
  if (
    !r.url().startsWith(base) &&
    !r.url().startsWith("blob:") &&
    !r.url().startsWith("data:")
  )
    report.externalRequests.push(r.url());
});
let original;
const get = async (path) => {
  const response = await context.request.get(base + "/api/" + path);
  assert.equal(response.status(), 200, "GET " + path);
  return response.json();
};
async function choose(id, value) {
  const saved = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/settings" &&
      r.request().method() === "PUT",
  );
  await page.locator("#" + id).selectOption(value);
  const response = await saved;
  assert.equal(response.status(), 200, "Save " + id);
  await expect(page.locator("#" + id)).toHaveValue(value);
  await expect(page.locator("#" + id)).toBeEnabled();
}
async function capture(name) {
  const path = resolve(output, name + ".png");
  await page.screenshot({ path, fullPage: true });
  report.captures.push(path);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    ),
    false,
    "No document overflow " + name,
  );
}
try {
  await page.goto(base + "/settings?section=Learning");
  await page.locator(".fixture-banner").waitFor();
  const bootstrap = await get("bootstrap");
  assert.equal(bootstrap.fixture, true, "Explicit fixture");
  original = {
    theme: bootstrap.preferences.theme,
    focusTopic: bootstrap.preferences.focusTopic,
    reviewPreference: bootstrap.preferences.reviewPreference,
    defaultHintDepth: bootstrap.preferences.defaultHintDepth,
  };
  assert.equal(
    typeof original.reviewPreference,
    "string",
    "Current R45 backend contract",
  );
  const dark = await context.request.put(base + "/api/settings", {
    headers: { Origin: base, "X-CSRF-Token": bootstrap.csrfToken },
    data: { theme: "dark" },
  });
  assert.equal(dark.status(), 200, "Explicit fixture screenshot theme");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const before = await get("progress"),
    beforeHash = hash(before.evidence || []);
  report.initialEvidenceHash = beforeHash;
  await choose("focus-topic", "trees");
  await choose("review-preference", "review-first");
  await choose("default-hint-depth", "steps");
  await page.reload();
  await page.locator(".fixture-banner").waitFor();
  await expect(page.locator("#focus-topic")).toHaveValue("trees");
  await expect(page.locator("#review-preference")).toHaveValue("review-first");
  await expect(page.locator("#default-hint-depth")).toHaveValue("steps");
  report.checks.push("All three durable preferences survive actual reload");
  await capture("learning-settings-1366-dark");
  await page.goto(base + "/");
  await page.locator(".fixture-banner").waitFor();
  const recommendation = await get(
    "recommendation?language=" + bootstrap.preferences.language,
  );
  await expect(page.locator("[data-practice-first]")).toHaveAttribute(
    "data-practice-first",
    recommendation.practicePresentation.first,
  );
  await expect(page.locator("[data-practice-kind]").first()).toHaveAttribute(
    "data-practice-kind",
    recommendation.practicePresentation.first,
  );
  await expect(
    page.getByText(recommendation.practicePresentation.reason, { exact: true }),
  ).toBeVisible();
  report.checks.push({
    name: "Review preference Home priority matches actual backend",
    presentation: recommendation.practicePresentation,
  });
  await capture("home-practice-priority-1366-dark");
  await page.goto(base + "/settings?section=Learning");
  await page.locator(".fixture-banner").waitFor();
  await choose("review-preference", "new-first");
  await page.goto(base + "/");
  await page.locator(".fixture-banner").waitFor();
  await expect(page.locator("[data-practice-kind]").first()).toHaveAttribute(
    "data-practice-kind",
    "challenge",
  );
  const newFirst = await get(
    "recommendation?language=" + bootstrap.preferences.language,
  );
  assert.equal(newFirst.practicePresentation.first, "challenge");
  assert.equal(
    newFirst.problemId,
    recommendation.problemId,
    "Presentation does not replace the recommendation",
  );
  report.checks.push(
    "New-first puts challenge first without replacing its pending recommendation",
  );
  await page.goto(base + "/settings?section=Learning");
  await page.locator(".fixture-banner").waitFor();
  await choose("default-hint-depth", "nudge");
  await choose("focus-topic", "");
  await page.reload();
  await expect(page.locator("#focus-topic")).toHaveValue("");
  await expect(page.locator("#default-hint-depth")).toHaveValue("nudge");
  report.checks.push(
    "Nullable all-topic default and alternate hint depth persist",
  );
  const after = await get("progress");
  assert.equal(
    hash(after.evidence || []),
    beforeHash,
    "No new learning evidence",
  );
  assert.equal(
    report.generationRequests,
    0,
    "No inference from settings/Home navigation",
  );
  report.checks.push(
    "Preferences/navigation preserve evidence and issue zero tutor requests",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  const closeNavigation = page.getByRole("button", {
    name: "Close navigation",
    exact: true,
  });
  if (await page.locator(".sidebar.open").count())
    await closeNavigation.click();
  await page.waitForFunction(
    () => document.querySelector(".sidebar").getBoundingClientRect().right <= 1,
  );
  await capture("learning-settings-390-dark");
  const assetUrls = await page.evaluate(() =>
    [...document.querySelectorAll("script[src],link[rel=stylesheet]")].map(
      (e) => e.src || e.href,
    ),
  );
  for (const url of assetUrls) {
    const response = await context.request.get(url);
    report.servedAssets.push({ url, sha256: hash(await response.text()) });
  }
  assert.deepEqual(report.errors, [], "No browser exceptions");
  assert.deepEqual(report.externalRequests, [], "No remote runtime requests");
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
  if (original) {
    try {
      const bootstrap = await get("bootstrap");
      const restored = await context.request.put(base + "/api/settings", {
        headers: { Origin: base, "X-CSRF-Token": bootstrap.csrfToken },
        data: original,
      });
      assert.equal(restored.status(), 200);
      report.restoredPreferences = original;
    } catch (e) {
      report.restoreError = e.message;
      report.status = "failed";
      process.exitCode = 1;
    }
  }
  writeFileSync(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
