import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
const dir = resolve("docs/release-evidence/frontend-final-catalogue"),
  matrix = JSON.parse(readFileSync(resolve(dir, "report.json"), "utf8"));
const browser = await launchBrowser(),
  context = await browser.newContext(),
  page = await context.newPage(),
  report = {
    timestamp: new Date().toISOString(),
    status: "running",
    captures: [],
    requests: [],
    errors: [],
  };
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("request", (r) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(r.method()))
    report.requests.push({ url: r.url(), method: r.method() });
});
const r = await context.request.get(base + "/api/bootstrap"),
  bootstrap = await r.json();
assert.equal(bootstrap.fixture, true);
const prefs = async (values) => {
  const response = await context.request.put(base + "/api/settings", {
    headers: { Origin: base, "X-CSRF-Token": bootstrap.csrfToken },
    data: values,
  });
  assert.equal(response.status(), 200);
};
try {
  await prefs({ onboarded: true, theme: "dark" });
  for (const width of [390, 1366]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto(base + "/library/" + matrix.selectedLessons.partial);
    await expect(page.locator(".lesson-content")).toBeVisible();
    await page.waitForLoadState("networkidle");
    const path = resolve(dir, `partial-${width}-full.png`);
    await page.screenshot({ path, fullPage: true });
    report.captures.push({
      width,
      path,
      contentHeight: await page.evaluate(
        () => document.documentElement.scrollHeight,
      ),
    });
  }
  assert.equal(report.requests.length, 0);
  assert.equal(report.errors.length, 0);
  report.status = "passed";
} catch (e) {
  report.status = "failed";
  report.failure = { message: e.message, stack: e.stack };
  process.exitCode = 1;
} finally {
  await prefs({
    onboarded: bootstrap.preferences.onboarded,
    theme: bootstrap.preferences.theme,
  });
  writeFileSync(
    resolve(dir, "full-partial-report.json"),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}
