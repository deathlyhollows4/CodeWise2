import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
assert.equal(
  base,
  "http://127.0.0.1:3191",
  "Only the original owned provider fixture may be rechecked",
);
const dir = resolve("docs/release-evidence/frontend-final-provider");
const prior = JSON.parse(readFileSync(resolve(dir, "report.json"), "utf8"));
const snapshots = JSON.parse(
  readFileSync(resolve(dir, "recovered-generation-snapshots.json"), "utf8"),
);
const browser = await launchBrowser(),
  context = await browser.newContext({
    viewport: { width: 1366, height: 1000 },
  }),
  page = await context.newPage();
const report = {
  timestamp: new Date().toISOString(),
  status: "running",
  scope:
    "R54 same original4records, actual UI backup export after integrated source restart; no generation or grading.",
  records: [],
  errors: [],
  dispatch: [],
  assets: [],
};
const hash = (v) => createHash("sha256").update(v).digest("hex");
const associations = (actual, old) => {
  for (const field of ["threadId", "problemId", "problemVersion"])
    if (Object.hasOwn(old, field))
      assert.equal(actual[field], old[field], old.id + " " + field);
};
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("request", (r) => {
  if (
    r.method() === "POST" &&
    /^\/api\/(jobs|tutor|settings\/tutor-test)(?:\/|$)/.test(
      new URL(r.url()).pathname,
    )
  )
    report.dispatch.push(new URL(r.url()).pathname);
});
const get = async (p) => {
  const r = await context.request.get(base + "/api/" + p);
  assert.equal(r.status(), 200, p);
  return r.json();
};
const b = await get("bootstrap");
assert.equal(b.fixture, true);
assert.equal(b.catalogue.published, 243);
assert.equal(b.key.configured, false);
try {
  const calls = JSON.parse(
    readFileSync(
      "docs/release-evidence/frontend-final-provider-metrics.json",
      "utf8",
    ),
  ).streamCalls;
  for (const old of snapshots) {
    const g = await get("library/" + old.id);
    assert.equal(g.status, old.status);
    assert.equal(g.markdown, old.markdown);
    associations(g, old);
    report.records.push({
      id: g.id,
      status: g.status,
      hash: hash(g.markdown),
      usage: g.usage,
    });
    assert.equal(g.usage, null);
  }
  const exported = await get("data/export");
  assert.equal(exported.generations.length, 4);
  for (const old of snapshots) {
    const g = exported.generations.find((g) => g.id === old.id);
    assert.ok(g);
    assert.equal(g.status, old.status);
    assert.equal(g.markdown, old.markdown);
    associations(g, old);
    assert.equal(g.usage, null);
  }
  const forbidden = [
    "fixture-only-no-real-credential-offline-0000",
    "fixture-only-no-real-credential-valid-0001",
    "fixture-only-no-real-credential-valid-0002",
    "contextMessages",
  ];
  const serialized = JSON.stringify(exported);
  assert.ok(forbidden.every((value) => !serialized.includes(value)));
  const ready = await context.request.put(base + "/api/settings", {
    headers: { Origin: base, "X-CSRF-Token": b.csrfToken },
    data: { onboarded: true },
  });
  assert.equal(ready.status(), 200);
  await page.goto(base + "/settings");
  await page.getByRole("button", { name: "Data", exact: true }).click();
  const pending = page.waitForEvent("download");
  const uiExport = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/data/export" &&
      r.request().method() === "GET",
  );
  await page
    .getByRole("button", { name: "Export learning backup", exact: true })
    .click();
  assert.equal((await uiExport).status(), 200, "Actual UI export response");
  const file = await pending,
    path = resolve(dir, "repaired-original-four-backup.json");
  await file.saveAs(path);
  const actual = JSON.parse(readFileSync(path, "utf8"));
  assert.equal(actual.generations.length, 4);
  for (const old of snapshots) {
    const record = actual.generations.find((g) => g.id === old.id);
    associations(record, old);
    assert.equal(record.markdown, old.markdown);
  }
  assert.ok(
    forbidden.every((value) => !JSON.stringify(actual).includes(value)),
  );
  report.export = {
    status: 200,
    path,
    bytes: Buffer.byteLength(JSON.stringify(actual)),
    sha256: hash(readFileSync(path)),
    secretFreeFakeValues: true,
    privateContextExcluded: true,
  };
  assert.equal(
    JSON.parse(
      readFileSync(
        "docs/release-evidence/frontend-final-provider-metrics.json",
        "utf8",
      ),
    ).streamCalls,
    calls,
  );
  const html = await (await context.request.get(base + "/")).text();
  for (const m of html.matchAll(
    /(?:src|href)="(\/assets\/[^\"]+\.(?:js|css))"/g,
  )) {
    const body = await (await context.request.get(base + m[1])).body();
    report.assets.push({ path: m[1], sha256: hash(body), bytes: body.length });
  }
  assert.equal(report.errors.length, 0);
  assert.equal(report.dispatch.length, 0);
  report.status = "passed";
  const originalReport = resolve(
    dir,
    "qualified-before-export-recheck-report.json",
  );
  if (!existsSync(originalReport))
    writeFileSync(originalReport, JSON.stringify(prior, null, 2));
  prior.backupExport = {
    status: 200,
    recheckReport: "export-recheck-report.json",
    originalFailure: "failed-settings-test-backup-export-report.json",
    actualCause:
      "Missing usage on valid completed provider responses; unknown is now null, not zero. Settings snapshot was absent and valid.",
  };
  prior.status =
    "bounded-provider-persistence-key-lifecycle-and-repaired-export-passed";
  prior.checks.push(
    "Integrated R54 same4records export200/UI download preserves content/status, unknown usage null and excludes fake credentials/private context; no new provider work",
  );
  writeFileSync(resolve(dir, "report.json"), JSON.stringify(prior, null, 2));
} catch (e) {
  report.status = "failed";
  report.failure = { message: e.message, stack: e.stack };
  console.error(e.stack);
  process.exitCode = 1;
} finally {
  await context.request.put(base + "/api/settings", {
    headers: { Origin: base, "X-CSRF-Token": b.csrfToken },
    data: { onboarded: b.preferences.onboarded },
  });
  writeFileSync(
    resolve(dir, "export-recheck-report.json"),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
  console.log(
    JSON.stringify(
      { status: report.status, records: report.records.length },
      null,
      2,
    ),
  );
}
