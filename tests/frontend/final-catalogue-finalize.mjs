import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
assert.ok(new URL(base).origin === base, "QA base must be a canonical origin");
// D05_REQUEST_EVIDENCE_START: payload checks are ephemeral, never evidence fields.
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
    // Parse failures may embed payload text; keep only a failed check.
  }
  return expectedId => exactEndpoint && selectedId !== null && selectedId === expectedId;
}
function historicalRequestEvidence(record) {
  return {
    method: typeof record.method === "string" ? record.method : "[invalid-method]",
    path: evidencePath(record.path ?? record.url),
  };
}
function historicalReportEvidence(prior) {
  const safe = {};
  for (const key of ["timestamp", "base", "status", "scope", "captures", "timings",
    "errors", "harnessHash", "bootstrap", "catalogue", "selectedLessons",
    "selectedProblem", "coldStart", "clientNavigation", "learningRequirement"])
    if (Object.hasOwn(prior, key)) safe[key] = prior[key];
  safe.mutationRequests = prior.mutationRequests.map(historicalRequestEvidence);
  safe.externalRequests = prior.externalRequests.map(evidencePath);
  safe.apiErrors = prior.apiErrors.map(record => ({
    path: evidencePath(record.path ?? record.url), status: record.status,
  }));
  safe.assets = prior.assets.map(asset => ({
    path: evidencePath(asset.path ?? asset.url), status: asset.status,
    bytes: asset.bytes, sha256: asset.sha256,
  }));
  return safe;
}
// D05_REQUEST_EVIDENCE_END
const output = resolve("docs/release-evidence/frontend-final-catalogue"),
  prior = JSON.parse(
    readFileSync(
      resolve(output, "failed-overbroad-mutation-assertion-report.json"),
      "utf8",
    ),
  );
const hash = (v) => createHash("sha256").update(v).digest("hex");
const browser = await launchBrowser(),
  context = await browser.newContext({
    viewport: { width: 1366, height: 1000 },
  }),
  page = await context.newPage();
const requests = [],
  requestChecks = [],
  errors = [],
  external = [];
let restorePreferences;
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(r.method())) {
    requests.push(requestEvidence(r));
    requestChecks.push(manualSelectionCheck(r));
  }
  if (
    !r.url().startsWith(base) &&
    !r.url().startsWith("data:") &&
    !r.url().startsWith("blob:")
  )
    external.push(evidencePath(r.url()));
});
const get = async (path) => {
  const r = await context.request.get(base + "/api/" + path);
  assert.equal(r.status(), 200);
  return r.json();
};
try {
  assert.equal(base, prior.base);
  assert.equal(prior.errors.length, 0);
  assert.equal(prior.apiErrors.length, 0);
  assert.equal(prior.externalRequests.length, 0);
  assert.match(prior.failure.message, /Matrix must not dispatch/);
  assert.equal(prior.mutationRequests.length, 9);
  for (const r of prior.mutationRequests) {
    assert.equal(r.method, "POST");
    assert.equal(evidencePath(r.path ?? r.url), "/api/learning/select");
  }
  const captures = prior.captures.filter((c) => !c.name.startsWith("failure-"));
  assert.equal(captures.length, 95);
  for (const theme of ["dark", "light"])
    for (const width of [390, 768, 1366, 1920])
      for (const name of [
        "welcome",
        "home",
        "roadmap",
        "topic",
        "problems",
        "workspace",
        "library",
        "lesson",
        "progress",
        "settings",
        "sources",
      ])
        assert.ok(captures.some((c) => c.name === `${theme}-${width}-${name}`));
  for (const c of captures) {
    assert.ok(existsSync(c.path));
    assert.ok(c.scrollWidth <= c.width + 1);
  }
  const bootstrap = await get("bootstrap");
  assert.equal(bootstrap.fixture, true);
  assert.equal(bootstrap.catalogue.preview, 243);
  assert.equal(bootstrap.catalogue.published, 0);
  assert.equal(bootstrap.key.configured, false);
  assert.equal(bootstrap.runner.ready, false);
  restorePreferences = {
    onboarded: bootstrap.preferences.onboarded,
    theme: bootstrap.preferences.theme,
    csrf: bootstrap.csrfToken,
  };
  const preferenceResponse = await context.request.put(base + "/api/settings", {
    headers: { Origin: base, "X-CSRF-Token": bootstrap.csrfToken },
    data: { onboarded: true, theme: "dark" },
  });
  assert.equal(preferenceResponse.status(), 200);
  const before = await get("progress"),
    jobsBefore = await get("jobs?pageSize=100");
  assert.deepEqual(before.evidence, []);
  assert.equal(before.independent, 0);
  assert.equal(before.assisted, 0);
  for (const asset of prior.assets) {
    const assetPath = evidencePath(asset.path ?? asset.url);
    const r = await context.request.get(base + assetPath);
    assert.equal(r.status(), 200);
    assert.equal(
      hash(await r.body()),
      asset.sha256,
      "Served asset unchanged: " + assetPath,
    );
  }
  await page.goto(base + "/problems/" + prior.selectedProblem.id);
  await expect(page.locator(".monaco-editor")).toBeVisible();
  await expect(
    page.getByText("Learning goal:", { exact: false }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0], {
    method: "POST",
    path: "/api/learning/select",
  });
  assert.equal(requestChecks.length, 1);
  assert.ok(requestChecks[0](prior.selectedProblem.id), "Unexpected manual selection payload");
  requestChecks.length = 0;
  const after = await get("progress"),
    jobsAfter = await get("jobs?pageSize=100");
  assert.equal(hash(JSON.stringify(after)), hash(JSON.stringify(before)));
  assert.equal(
    hash(JSON.stringify(jobsAfter)),
    hash(JSON.stringify(jobsBefore)),
  );
  await page.goto(base + "/library");
  await expect(page.locator(".lesson-row")).toHaveCount(30);
  await page.waitForLoadState("networkidle");
  assert.equal(requests.length, 1);
  assert.equal(errors.length, 0);
  assert.equal(external.length, 0);
  const catalogue = await get("problems");
  assert.equal(catalogue.length, 243);
  const final = {
    ...historicalReportEvidence(prior),
    status: "passed",
    scope:
      "Current cached243 draft-preview matrix/navigation. Normal workspace opening persists manual path selection; no grading/provider/evidence/job mutations.",
    captures,
    failure: undefined,
    reconciliation: {
      timestamp: new Date().toISOString(),
      previousFailedReport: "failed-overbroad-mutation-assertion-report.json",
      originalNineBodies:
        "Bodies were not captured in the original run. Source/API strict contract and the targeted normal workspace request were separately inspected; no fabricated body reconstruction.",
      targetedRequests: requests,
      evidenceBefore: before.evidence,
      evidenceAfter: after.evidence,
      progressHash: hash(JSON.stringify(after)),
      jobSummaryHash: hash(JSON.stringify(jobsAfter)),
      assetsUnchanged: true,
      finalizerHash: hash(readFileSync(new URL(import.meta.url))),
      currentHarnessHash: hash(
        readFileSync(new URL("./final-catalogue-browser.mjs", import.meta.url)),
      ),
      cachedCatalogueHash: hash(JSON.stringify(catalogue)),
      contentSnapshotLimit:
        "Backend explicitly cached the pre-correction243 public draft snapshot. Later content-only integration is not represented by this fixture; selected Arrays03 and UI/assets unchanged. No publication/current reference teaching proof claimed.",
    },
  };
  requestChecks.length = 0;
  writeFileSync(resolve(output, "report.json"), JSON.stringify(final, null, 2));
  console.log(
    JSON.stringify(
      {
        status: final.status,
        captures: captures.length,
        observedMatrixPathSelections: 9,
        targetedPathSelections: requests.length,
        grading: 0,
        provider: 0,
      },
      null,
      2,
    ),
  );
} catch (error) {
  requestChecks.length = 0;
  writeFileSync(
    resolve(output, "finalizer-failure.json"),
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        requests,
        errors,
        external,
      },
      null,
      2,
    ),
  );
  console.error(error.stack);
  process.exitCode = 1;
} finally {
  requestChecks.length = 0;
  if (restorePreferences) {
    const r = await context.request.put(base + "/api/settings", {
      headers: { Origin: base, "X-CSRF-Token": restorePreferences.csrf },
      data: {
        onboarded: restorePreferences.onboarded,
        theme: restorePreferences.theme,
      },
    });
    if (r.status() !== 200) {
      console.error("Fixture preferences could not be restored");
      process.exitCode = 1;
    }
  }
  await browser.close();
}
