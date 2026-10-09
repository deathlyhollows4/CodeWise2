import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const dir = resolve("docs/release-evidence/frontend-final-catalogue"),
  matrix = JSON.parse(readFileSync(resolve(dir, "report.json"), "utf8"));
const browser = await launchBrowser(),
  context = await browser.newContext(),
  page = await context.newPage();
const report = {
  timestamp: new Date().toISOString(),
  status: "running",
  scope:
    "Targeted actual243-pack provenance injection; original95matrix/staticassets preserved. No publication/native/provider claim.",
  captures: [],
  requests: [],
  errors: [],
  external: [],
};
const hash = (v) => createHash("sha256").update(v).digest("hex");
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("request", (r) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(r.method()))
    report.requests.push({ method: r.method(), url: r.url() });
  if (
    !r.url().startsWith(base) &&
    !r.url().startsWith("blob:") &&
    !r.url().startsWith("data:")
  )
    report.external.push(r.url());
});
const get = async (path) => {
  const r = await context.request.get(base + "/api/" + path);
  assert.equal(r.status(), 200);
  return r.json();
};
const bootstrap = await get("bootstrap");
assert.equal(bootstrap.fixture, true);
const prefs = async (values) => {
  const r = await context.request.put(base + "/api/settings", {
    headers: { Origin: base, "X-CSRF-Token": bootstrap.csrfToken },
    data: values,
  });
  assert.equal(r.status(), 200);
};
try {
  const sources = await get("sources");
  assert.equal(sources.length, 243);
  assert.ok(
    sources.every(
      (s) => s.assets && s.author && s.originType !== "test-fixture",
    ),
  );
  report.sourceHash = hash(JSON.stringify(sources));
  for (const s of sources)
    assert.deepEqual(
      s.assets,
      JSON.parse(
        readFileSync(
          resolve("content/problems", s.problemId, "provenance.json"),
          "utf8",
        ),
      ).assets,
    );
  for (const asset of matrix.assets) {
    const r = await context.request.get(asset.url);
    assert.equal(hash(await r.body()), asset.sha256);
  }
  for (const theme of ["dark", "light"])
    for (const width of [390, 1366]) {
      await prefs({ onboarded: true, theme });
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.goto(base + "/sources");
      await expect(
        page.getByRole("heading", { name: "Sources & licenses" }),
      ).toBeVisible();
      await expect(page.locator(".data-table")).toHaveCount(243);
      await page.waitForLoadState("networkidle");
      const path = resolve(dir, `sources-actual-${theme}-${width}.png`);
      await page.screenshot({ path, fullPage: false });
      report.captures.push(path);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
      );
    }
  const imported = page.locator(".card.section").filter({
    has: page.getByRole("heading", {
      name: sources.find((s) => s.problemId === "binary-search-01").title,
      exact: true,
    }),
  });
  await expect(imported).toContainText("Exercism");
  await expect(imported).toContainText("MIT");
  await expect(imported).toContainText(
    "9943fd751b684ba1a6a8673c3700a6e79c10a808",
  );
  await imported.scrollIntoViewIfNeeded();
  const adapted = resolve(dir, "sources-actual-pinned-adaptation.png");
  await page.screenshot({ path: adapted, fullPage: false });
  report.captures.push(adapted);
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export notices", exact: true })
    .click();
  const download = await downloadPromise;
  const exportPath = resolve(dir, "sources-exported-notices.md");
  await download.saveAs(exportPath);
  const exported = readFileSync(exportPath, "utf8");
  assert.equal(
    download.suggestedFilename(),
    "CodeWise2-dependency-notices.txt",
  );
  const notices = JSON.parse(
    readFileSync("apps/web/src/dependency-notices.json", "utf8"),
  );
  assert.equal(
    exported,
    notices
      .map((n) => `${n.name} ${n.version} — ${n.license}\n\n${n.notice}`)
      .join("\n\n────────────────\n\n"),
  );
  assert.match(exported, /MIT/);
  report.noticeExport = {
    path: exportPath,
    bytes: Buffer.byteLength(exported),
    sha256: hash(exported),
  };
  assert.equal(report.requests.length, 0);
  assert.equal(report.errors.length, 0);
  assert.equal(report.external.length, 0);
  report.status = "passed";
} catch (e) {
  report.status = "failed";
  report.failure = { message: e.message, stack: e.stack };
  console.error(e.stack);
  process.exitCode = 1;
} finally {
  await prefs({
    theme: bootstrap.preferences.theme,
    onboarded: bootstrap.preferences.onboarded,
  });
  writeFileSync(
    resolve(dir, "actual-sources-report.json"),
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
