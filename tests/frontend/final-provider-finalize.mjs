import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const dir = resolve("docs/release-evidence/frontend-final-provider"),
  saved = JSON.parse(
    readFileSync(resolve(dir, "recovered-generation-snapshots.json"), "utf8"),
  ),
  prior = JSON.parse(
    readFileSync(resolve(dir, "failed-async-status-report.json"), "utf8"),
  );
const hash = (s) => createHash("sha256").update(s).digest("hex");
const browser = await launchBrowser(),
  context = await browser.newContext({
    viewport: { width: 1366, height: 1000 },
  }),
  page = await context.newPage();
const report = {
  timestamp: new Date().toISOString(),
  status: "running",
  scope:
    "Same-ID UI recovery after successful owned restart and failed synchronous observer. Fake credentials/local provider only, no new generation/restart/grading.",
  checks: [...prior.checks],
  captures: [],
  errors: [],
  tutorPosts: 0,
  jobPosts: 0,
  saved: [],
};
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("request", (r) => {
  if (r.method() === "POST" && new URL(r.url()).pathname === "/api/tutor")
    report.tutorPosts++;
  if (r.method() === "POST" && new URL(r.url()).pathname === "/api/jobs")
    report.jobPosts++;
});
const get = async (p) => {
  const r = await context.request.get(base + "/api/" + p);
  assert.equal(r.status(), 200);
  return r.json();
};
const b = await get("bootstrap");
assert.equal(b.fixture, true);
assert.equal(b.catalogue.published, 243);
assert.equal(b.key.configured, true);
const calls = JSON.parse(
  readFileSync(
    "docs/release-evidence/frontend-final-provider-metrics.json",
    "utf8",
  ),
).streamCalls;
try {
  for (const record of saved) {
    const g = await get("library/" + record.id);
    assert.equal(g.status, record.status);
    assert.equal(g.markdown, record.markdown);
    assert.equal(hash(g.markdown), g.contentHash);
    await page.goto(base + "/library/" + g.id);
    await expect(page.locator(".lesson-content")).toBeVisible();
    if (g.status === "interrupted" || g.status === "canceled") {
      const path = resolve(dir, `recovered-${g.status}.png`);
      await page.screenshot({ path, fullPage: false });
      report.captures.push(path);
    }
    report.saved.push({
      id: g.id,
      status: g.status,
      markdownHash: hash(g.markdown),
      bytes: Buffer.byteLength(g.markdown),
      createdAt: g.createdAt,
      finishedAt: g.finishedAt,
    });
  }
  assert.ok(saved.some((g) => g.status === "complete"));
  assert.ok(saved.some((g) => g.status === "canceled"));
  assert.ok(saved.some((g) => g.status === "interrupted"));
  assert.equal(
    JSON.parse(
      readFileSync(
        "docs/release-evidence/frontend-final-provider-metrics.json",
        "utf8",
      ),
    ).streamCalls,
    calls,
  );
  report.checks.push(
    "Same completed/canceled/interrupted IDs/status/exact recovered bytes preserved across fresh UI reads, no new provider work",
  );
  report.persistenceQualification =
    "Original pre-restart exact hashes were not journaled before observer blocked. Actual pre-restart saved dark/light captures, generation creation/finished timestamps, successful owned old/new process identity, durable same IDs/nonempty controlled prefix and unchanged provider call count establish bounded persistence. Exact post-restart recovered bytes/contentHash are verified; earlier backend exact restart tests remain separate.";
  const keys = [
    "fixture-only-no-real-credential-offline-0000",
    "fixture-only-no-real-credential-valid-0001",
    "fixture-only-no-real-credential-valid-0002",
  ];
  for (const path of ["bootstrap", "settings"]) {
    const serialized = JSON.stringify(await get(path));
    assert.ok(keys.every((k) => !serialized.includes(k)));
  }
  const backupResponse = await context.request.get(base + "/api/data/export");
  report.backupExport = {
    status: backupResponse.status(),
    qualification:
      "Actual backend blocker after Settings tutor-response saved generation; owner repair pending. No assertion relaxation or secret-exclusion claim for unavailable export.",
  };
  assert.equal(backupResponse.status(), 400);
  await page.goto(base + "/settings");
  await page.getByRole("button", { name: "Remove key", exact: true }).click();
  const deleted = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/settings/key" &&
      r.request().method() === "DELETE",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
  assert.equal((await deleted).status(), 200);
  await expect(
    page.getByLabel("DeepSeek API key", { exact: true }),
  ).toHaveValue("");
  assert.equal((await get("bootstrap")).key.configured, false);
  report.checks.push(
    "Actual localhost removal, cleared password field and fake-credential exclusion from read endpoints; backup export separately blocked",
  );
  const html = await (await context.request.get(base + "/")).text();
  report.assets = [];
  for (const m of html.matchAll(
    /(?:src|href)="(\/assets\/[^\"]+\.(?:js|css))"/g,
  )) {
    const body = await (await context.request.get(base + m[1])).body();
    report.assets.push({ path: m[1], bytes: body.length, sha256: hash(body) });
  }
  report.harnessHash = hash(readFileSync(new URL(import.meta.url)));
  report.fixtureSourceHash = hash(
    readFileSync("tests/frontend/fixture-final-provider.ts"),
  );
  report.restartProof = "frontend-final-provider-lifecycle.json";
  report.observerFailure = "failed-blocked-observer.json";
  assert.equal(report.tutorPosts, 0);
  assert.equal(report.jobPosts, 0);
  assert.equal(report.errors.length, 0);
  report.metrics = JSON.parse(
    readFileSync(
      "docs/release-evidence/frontend-final-provider-metrics.json",
      "utf8",
    ),
  );
  report.status =
    "provider-persistence-key-removal-passed-backup-export-blocked";
} catch (e) {
  report.status = "failed";
  report.failure = { message: e.message, stack: e.stack };
  console.error(e.stack);
  process.exitCode = 1;
} finally {
  writeFileSync(resolve(dir, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(
    JSON.stringify(
      {
        status: report.status,
        saved: report.saved.length,
        checks: report.checks.length,
      },
      null,
      2,
    ),
  );
}
