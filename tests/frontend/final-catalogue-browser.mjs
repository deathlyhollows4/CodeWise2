import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
assert.ok(new URL(base).origin === base, "QA base must be a canonical origin");
// D05_REQUEST_EVIDENCE_START: no parsed payload is part of serialized evidence.
function evidencePath(value) {
  if (typeof value !== "string") return "[invalid-path]";
  try {
    const url = new URL(value, base);
    return ["http:", "https:"].includes(url.protocol)
      ? url.pathname
      : "[non-http-path]";
  } catch {
    return "[invalid-path]";
  }
}
function requestEvidence(request) {
  return { method: request.method(), path: evidencePath(request.url()) };
}
function manualSelectionCheck(request) {
  const exactEndpoint = request.url() === base + "/api/learning/select";
  let selectedId = null;
  try {
    const payload = request.postDataJSON();
    if (payload && typeof payload === "object" && !Array.isArray(payload) &&
        Object.keys(payload).length === 2 &&
        Object.hasOwn(payload, "problemId") && Object.hasOwn(payload, "mode") &&
        typeof payload.problemId === "string" && payload.mode === "manual")
      selectedId = payload.problemId;
  } catch {
    // A parse error may contain payload text; retain only a failed check.
  }
  return expectedId => exactEndpoint && selectedId !== null && selectedId === expectedId;
}
// D05_REQUEST_EVIDENCE_END
const output = resolve("docs/release-evidence/frontend-final-catalogue");
mkdirSync(output, { recursive: true });
const report = {
  timestamp: new Date().toISOString(),
  base,
  status: "running",
  scope:
    "Current full-catalogue explicit preview, 11 screens/four widths/both themes, read-only readiness and navigation timings. No grading or provider dispatch.",
  captures: [],
  timings: [],
  errors: [],
  externalRequests: [],
  mutationRequests: [],
  assets: [],
  apiErrors: [],
};
const hash = (v) => createHash("sha256").update(v).digest("hex");
report.harnessHash = hash(readFileSync(new URL(import.meta.url)));
const browser = await launchBrowser(),
  context = await browser.newContext({
    viewport: { width: 1366, height: 1000 },
  }),
  page = await context.newPage();
const observers = [];
const mutationChecks = [];
const observedAssetUrls = new Set();
let original,
  csrf,
  fixtureConfirmed = false;
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("request", (r) => {
  if (
    !r.url().startsWith(base) &&
    !r.url().startsWith("data:") &&
    !r.url().startsWith("blob:")
  )
    report.externalRequests.push(evidencePath(r.url()));
  if (["POST", "PUT", "PATCH", "DELETE"].includes(r.method())) {
    report.mutationRequests.push(requestEvidence(r));
    mutationChecks.push(manualSelectionCheck(r));
  }
});
page.on("response", (r) => {
  observers.push(
    (async () => {
      const url = new URL(r.url());
      if (url.pathname.startsWith("/api/") && r.status() >= 400)
        report.apiErrors.push({ path: url.pathname, status: r.status() });
      if (
        /\/assets\/.*\.(js|css)$/.test(url.pathname) &&
        !observedAssetUrls.has(r.url())
      ) {
        observedAssetUrls.add(r.url());
        const body = await r.body();
        report.assets.push({
          path: url.pathname,
          status: r.status(),
          bytes: body.length,
          sha256: hash(body),
        });
      }
    })().catch((e) => report.errors.push("response observer: " + e.message)),
  );
});
async function get(path) {
  const started = performance.now(),
    response = await context.request.get(base + "/api/" + path);
  assert.equal(response.status(), 200, path);
  const body = await response.json();
  return { body, elapsedMs: performance.now() - started };
}
async function prefs(values) {
  assert.ok(fixtureConfirmed);
  const r = await context.request.put(base + "/api/settings", {
    headers: { Origin: base, "X-CSRF-Token": csrf },
    data: values,
  });
  assert.equal(r.status(), 200);
}
async function ready(name) {
  await expect(page.locator(".fixture-banner").first()).toBeVisible();
  await expect(page.locator("h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  if (name === "workspace") {
    if (page.viewportSize().width <= 768)
      await page.getByRole("button", { name: "Code", exact: true }).click();
    await expect(page.locator(".monaco-editor")).toBeVisible();
    await expect(page.locator(".view-lines")).not.toHaveText("");
  }
  if (name === "library")
    await expect(page.locator(".lesson-row").first()).toBeVisible();
  if (name === "problems" || name === "topic")
    await expect(page.locator(".problem-row").first()).toBeVisible();
  if (name === "home" || name === "progress")
    await expect(page.locator(".stat").first()).not.toHaveText("—");
  if (name === "lesson")
    await expect(page.locator(".lesson-content").first()).toBeVisible();
  const usableAt = performance.now();
  await page.waitForLoadState("networkidle");
  return usableAt;
}
async function capture(name) {
  const path = resolve(output, name + ".png");
  await page.screenshot({ path, fullPage: false });
  const geometry = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    height: innerHeight,
    contentHeight: document.documentElement.scrollHeight,
  }));
  assert.ok(
    geometry.scrollWidth <= geometry.width + 1,
    "Horizontal overflow: " + name,
  );
  report.captures.push({ name, path, ...geometry });
}
async function navigate(name, path) {
  const start = performance.now();
  await page.goto(base + path);
  const usableAt = await ready(name);
  report.timings.push({
    name,
    path,
    viewport: page.viewportSize(),
    usableMs: usableAt - start,
    settledMs: performance.now() - start,
    settlementNote:
      "Networkidle settlement includes Playwright's quiet-period wait; usableMs ends at the visible content/editor condition.",
    navigation: await page.evaluate(() => {
      const n = performance.getEntriesByType("navigation")[0];
      return n
        ? {
            duration: n.duration,
            domContentLoaded: n.domContentLoadedEventEnd,
            responseEnd: n.responseEnd,
            transferSize: n.transferSize,
          }
        : null;
    }),
    paint: await page.evaluate(() =>
      performance
        .getEntriesByType("paint")
        .map((p) => ({ name: p.name, startTime: p.startTime })),
    ),
  });
}
try {
  const bootstrap = await get("bootstrap");
  original = bootstrap.body.preferences;
  csrf = bootstrap.body.csrfToken;
  assert.equal(
    bootstrap.body.fixture,
    true,
    "Only labelled temporary preview data is allowed",
  );
  fixtureConfirmed = true;
  report.bootstrap = {
    elapsedMs: bootstrap.elapsedMs,
    apiVersion: bootstrap.body.apiVersion,
    catalogue: bootstrap.body.catalogue,
    runner: bootstrap.body.runner,
    keyStatus: bootstrap.body.key.status,
  };
  assert.equal(bootstrap.body.apiVersion, 2);
  assert.equal(bootstrap.body.catalogue.expected, 243);
  const problems = (await get("problems")).body;
  assert.equal(
    problems.length,
    243,
    "Final preview must expose all amended243 real content slots",
  );
  assert.equal(new Set(problems.map((p) => p.primaryTopic)).size, 18);
  const topic = (await get("topics")).body;
  report.catalogue = { count: problems.length, topics: topic.length };
  assert.equal(topic.length, 18);
  const library = (await get("library?pageSize=100")).body;
  assert.ok(
    library.total >= 68,
    "Realistic persisted fixture history required",
  );
  const complete =
      library.items.find(
        (l) =>
          l.status === "complete" &&
          l.version === 1 &&
          /simple walkthrough/.test(l.title),
      ) ?? library.items.find((l) => l.status === "complete"),
    partial =
      library.items.find(
        (l) =>
          l.status === "interrupted" &&
          /interrupted long fixture/.test(l.title),
      ) ?? library.items.find((l) => l.status === "interrupted");
  assert.ok(
    complete && partial,
    "Saved complete and long partial records required",
  );
  report.selectedLessons = { complete: complete.id, partial: partial.id };
  const selected =
    problems.find((p) => p.id === "arrays-hashing-03") ?? problems[0];
  report.selectedProblem = { id: selected.id, version: selected.version };
  await prefs({ onboarded: true, theme: "dark" });
  await navigate("workspace", "/problems/" + selected.id);
  await expect(
    page.getByText("Learning goal:", { exact: false }),
  ).toBeVisible();
  await capture("cold-1366-dark-workspace");
  report.coldStart = {
    timing: report.timings.at(-1),
    note: "First browser document in fresh context; server was already running. Not a cold operating-system or process-start measurement.",
  };
  report.clientNavigation = [];
  for (const [name, path, label] of [
    ["library", "/library", "Learning Library"],
    ["problems", "/problems", "Problem library"],
    ["home", "/", "Home"],
  ]) {
    const started = performance.now();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect(page).toHaveURL(base + path);
    const usableAt = await ready(name);
    report.clientNavigation.push({
      name,
      path,
      usableMs: usableAt - started,
      settledMs: performance.now() - started,
    });
  }
  const recommendation = (await get("recommendation")).body;
  report.learningRequirement = {
    problemId: recommendation.problemId,
    text: recommendation.learningRequirement ?? null,
  };
  for (const theme of ["dark", "light"])
    for (const width of [390, 768, 1366, 1920]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await prefs({ theme, onboarded: false });
      await navigate("welcome", "/");
      await capture(`${theme}-${width}-welcome`);
      await prefs({ onboarded: true });
      for (const [name, path] of [
        ["home", "/"],
        ["roadmap", "/roadmap"],
        ["topic", "/topics/" + selected.primaryTopic],
        ["problems", "/problems"],
        ["workspace", "/problems/" + selected.id],
        ["library", "/library"],
        ["lesson", "/library/" + complete.id],
        ["progress", "/progress"],
        ["settings", "/settings"],
        ["sources", "/sources"],
      ]) {
        await navigate(name, path);
        if (name === "home" && recommendation.learningRequirement)
          await expect(
            page.getByText(recommendation.learningRequirement, {
              exact: false,
            }),
          ).toBeVisible();
        await capture(`${theme}-${width}-${name}`);
      }
    }
  for (const width of [390, 1366]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await prefs({ theme: "dark" });
    await navigate("lesson", "/library/" + partial.id);
    await capture(`partial-${width}-top`);
    const table = page.locator(".lesson-content table").first();
    await table.scrollIntoViewIfNeeded();
    await capture(`partial-${width}-trace`);
    const code = page.locator(".lesson-content pre").last();
    await code.scrollIntoViewIfNeeded();
    await capture(`partial-${width}-code`);
  }
  await Promise.all(observers);
  assert.equal(report.errors.length, 0);
  assert.equal(report.externalRequests.length, 0);
  assert.equal(report.apiErrors.length, 0);
  assert.equal(mutationChecks.length, report.mutationRequests.length);
  for (const [index, request] of report.mutationRequests.entries()) {
    assert.equal(request.method, "POST");
    assert.equal(request.path, "/api/learning/select");
    assert.ok(mutationChecks[index](selected.id), "Unexpected manual selection payload");
  }
  mutationChecks.length = 0;
  assert.equal(report.captures.length, 95);
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.failure = {
    message: error.message,
    stack: error.stack,
    path: evidencePath(page.url()),
  };
  if (fixtureConfirmed) await capture("failure-" + Date.now()).catch(() => {});
  process.exitCode = 1;
} finally {
  mutationChecks.length = 0;
  if (fixtureConfirmed && original)
    await prefs({ theme: original.theme, onboarded: original.onboarded }).catch(
      (e) => {
        report.errors.push("Restore preferences: " + e.message);
        report.status = "failed";
        process.exitCode = 1;
      },
    );
  await Promise.all(observers);
  observedAssetUrls.clear();
  if (
    report.errors.length ||
    report.externalRequests.length ||
    report.apiErrors.length
  ) {
    report.status = "failed";
    process.exitCode = 1;
  }
  writeFileSync(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
  console.log(
    JSON.stringify(
      {
        status: report.status,
        captures: report.captures.length,
        errors: report.errors.length,
        output,
      },
      null,
      2,
    ),
  );
}
