import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const dir = resolve("docs/release-evidence/frontend-final-ui-journeys"),
  baseline = JSON.parse(
    readFileSync(resolve(dir, "baseline-backup.json"), "utf8"),
  ),
  attack = JSON.parse(
    readFileSync(resolve(dir, "adversarial-backup.json"), "utf8"),
  );
const lesson = attack.generations.find(
  (g) => g.title === "Explicit adversarial saved renderer fixture",
);
assert.ok(lesson);
const browser = await launchBrowser(),
  context = await browser.newContext({
    viewport: { width: 1366, height: 1000 },
  }),
  page = await context.newPage();
const report = {
  timestamp: new Date().toISOString(),
  status: "running",
  scope:
    "Targeted stable mobile renderer recapture + actual UI oversized-record import rejection; baseline restored, no grading/provider.",
  captures: [],
  errors: [],
  requests: [],
};
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("request", (r) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(r.method()))
    report.requests.push(new URL(r.url()).pathname);
});
const get = async (path) => {
  const r = await context.request.get(base + "/api/" + path);
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
async function data() {
  await page.goto(base + "/settings");
  await page.getByRole("button", { name: "Data", exact: true }).click();
}
async function restore(path) {
  await data();
  await page.locator("#backup-import").setInputFiles(path);
  await page
    .getByRole("button", { name: "Restore this backup", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Type RESTORE to confirm", { exact: true })
    .fill("RESTORE");
  const response = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/data/import" &&
      r.request().method() === "POST",
  );
  await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  assert.equal((await response).status(), 200);
  await page.waitForLoadState("networkidle");
}
try {
  await prefs({ onboarded: true, theme: "dark" });
  await restore(resolve(dir, "adversarial-backup.json"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/library/" + lesson.id);
  await expect(page.locator(".lesson-content")).toBeVisible();
  await page.waitForFunction(
    () => document.querySelector(".sidebar").getBoundingClientRect().right <= 1,
  );
  const code = page.locator(".lesson-code").last();
  await code
    .getByRole("button", { name: "Show complete code", exact: true })
    .click();
  await code.scrollIntoViewIfNeeded();
  const codePath = resolve(dir, "adversarial-code-390-dark-stable.png");
  await page.screenshot({ path: codePath, fullPage: false });
  report.captures.push(codePath);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
    false,
  );
  await page.evaluate(() => scrollTo(0, 0));
  const topPath = resolve(dir, "adversarial-top-390-dark.png");
  await page.screenshot({ path: topPath, fullPage: false });
  report.captures.push(topPath);
  await page.setViewportSize({ width: 1366, height: 1000 });
  await restore(resolve(dir, "baseline-backup.json"));
  const before = JSON.stringify(await get("library/" + lesson.id)),
    large = structuredClone(baseline);
  large.generations[0].markdown = "X".repeat(250001);
  const path = resolve(dir, "oversized-record-backup.json");
  writeFileSync(path, JSON.stringify(large));
  await data();
  const rejection = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/data/import/preview" &&
      r.request().method() === "POST",
  );
  await page.locator("#backup-import").setInputFiles(path);
  const response = await rejection;
  assert.equal(response.status(), 400);
  await expect(page.locator('[role="alert"]').first()).toBeVisible();
  assert.equal(JSON.stringify(await get("library/" + lesson.id)), before);
  assert.deepEqual((await get("progress")).evidence, []);
  assert.equal((await get("bootstrap")).key.configured, false);
  report.oversized = {
    markdownCharacters: 250001,
    responseStatus: 400,
    savedRecordUnchanged: true,
  };
  assert.equal(report.errors.length, 0);
  assert.equal(
    report.requests.filter((p) => /^\/api\/(jobs|tutor)(?:\/|$)/.test(p))
      .length,
    0,
  );
  report.status = "passed";
} catch (e) {
  report.status = "failed";
  report.failure = { message: e.message, stack: e.stack };
  console.error(e.stack);
  process.exitCode = 1;
} finally {
  await page.setViewportSize({ width: 1366, height: 1000 });
  await restore(resolve(dir, "baseline-backup.json")).catch((e) => {
    report.recoveryError = e.message;
    process.exitCode = 1;
  });
  await prefs({
    onboarded: b.preferences.onboarded,
    theme: b.preferences.theme,
  });
  report.harnessHash = createHash("sha256")
    .update(readFileSync(new URL(import.meta.url)))
    .digest("hex");
  writeFileSync(
    resolve(dir, "renderer-recapture-report.json"),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
  console.log(
    JSON.stringify(
      { status: report.status, captures: report.captures.length },
      null,
      2,
    ),
  );
}
