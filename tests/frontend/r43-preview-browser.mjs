import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
const output = resolve("docs/release-evidence/frontend-r43-preview");
mkdirSync(output, { recursive: true });
const browser = await launchBrowser(),
  context = await browser.newContext({
    viewport: { width: 1366, height: 1000 },
  }),
  page = await context.newPage();
const report = {
  timestamp: new Date().toISOString(),
  scope:
    "Targeted actual API2 default/cleared filters/plain previews/responsive appearance; prior pagination milestone retained separately",
  status: "running",
  checks: [],
  captures: [],
  errors: [],
  externalRequests: [],
  generationRequests: 0,
};
let originalTheme;
const hash = (value) =>
  createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex");
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("request", (r) => {
  if (r.method() === "POST" && new URL(r.url()).pathname === "/api/tutor")
    report.generationRequests++;
  if (
    !r.url().startsWith(base) &&
    !r.url().startsWith("data:") &&
    !r.url().startsWith("blob:")
  )
    report.externalRequests.push(r.url());
});
const get = async (path) => {
  const response = await context.request.get(base + "/api/" + path);
  assert.equal(response.status(), 200);
  return response.json();
};
async function capture(name) {
  const path = resolve(output, name + ".png");
  await page.screenshot({ path, fullPage: false });
  report.captures.push(path);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
    false,
    "No horizontal overflow",
  );
}
async function previews() {
  const metrics = await page.locator(".lesson-preview").evaluateAll((nodes) =>
    nodes.map((node) => ({
      text: node.textContent,
      height: node.getBoundingClientRect().height,
      lineHeight: parseFloat(getComputedStyle(node).lineHeight),
      clamp: getComputedStyle(node).webkitLineClamp,
    })),
  );
  for (const row of metrics) {
    assert.equal(row.clamp, "3");
    assert.ok(row.height <= row.lineHeight * 3 + 1);
    assert.equal(
      /^#|```|\*\*/.test(row.text),
      false,
      "No raw formatting in fixture preview",
    );
  }
  report.previewMetrics = metrics;
}
async function queryResponse(action, predicate) {
  const response = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/library" &&
      predicate(new URL(r.url()).searchParams),
  );
  await action();
  const incoming = await response;
  assert.equal(incoming.status(), 200);
  return incoming.json();
}
try {
  await page.goto(base + "/library");
  await page.locator(".fixture-banner").waitFor();
  const bootstrap = await get("bootstrap");
  assert.equal(bootstrap.apiVersion, 2);
  assert.equal(bootstrap.fixture, true);
  originalTheme = bootstrap.preferences.theme;
  const evidence = hash((await get("progress")).evidence || []);
  const dark = await context.request.put(base + "/api/settings", {
    headers: { Origin: base, "X-CSRF-Token": bootstrap.csrfToken },
    data: { theme: "dark" },
  });
  assert.equal(dark.status(), 200);
  await page.reload();
  await expect(page.locator(".lesson-row")).toHaveCount(30);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await previews();
  await capture("default-library-1366-dark");
  report.checks.push(
    "Default Library200,30rows, readable bounded plain previews",
  );
  const search = page.getByRole("textbox", {
      name: "Search lessons and code",
      exact: true,
    }),
    language = page.getByRole("combobox", {
      name: "Lesson language",
      exact: true,
    }),
    status = page.getByRole("combobox", {
      name: "Completion status",
      exact: true,
    }),
    action = page.getByRole("combobox", {
      name: "Filter output type",
      exact: true,
    }),
    from = page.getByLabel("Lessons from date (UTC)", { exact: true }),
    to = page.getByLabel("Lessons through date (UTC)", { exact: true });
  const needle = "R43_OLDEST_PAGE_TAIL_MATCH";
  await queryResponse(
    () => search.fill(needle),
    (p) => p.get("q") === needle,
  );
  await expect(page.locator(".lesson-row")).toHaveCount(1);
  await expect(page.locator(".lesson-preview")).toContainText(needle);
  await previews();
  await capture("meaningful-search-1366-dark");
  await queryResponse(
    () => search.fill(""),
    (p) => p.get("q") === "",
  );
  await queryResponse(
    () => language.selectOption("java"),
    (p) => p.get("language") === "java",
  );
  await queryResponse(
    () => language.selectOption(""),
    (p) => !p.has("language"),
  );
  await queryResponse(
    () => status.selectOption("complete"),
    (p) => p.get("status") === "complete",
  );
  await queryResponse(
    () => status.selectOption(""),
    (p) => !p.has("status"),
  );
  await queryResponse(
    () => action.selectOption("hint"),
    (p) => p.get("action") === "hint",
  );
  await queryResponse(
    () => action.selectOption(""),
    (p) => !p.has("action"),
  );
  await queryResponse(
    () => from.fill("2020-01-01"),
    (p) => p.get("from") === "2020-01-01",
  );
  await queryResponse(
    () => from.fill(""),
    (p) => !p.has("from"),
  );
  await queryResponse(
    () => to.fill("2099-12-31"),
    (p) => p.get("to") === "2099-12-31",
  );
  const cleared = await queryResponse(
    () => to.fill(""),
    (p) =>
      !p.has("to") &&
      !p.has("from") &&
      !p.has("status") &&
      !p.has("language") &&
      !p.has("action") &&
      p.get("q") === "",
  );
  await expect(page.locator(".lesson-row")).toHaveCount(30);
  assert.ok(cleared.total >= 68);
  await expect(
    page.locator('[aria-label="Saved answers pages"]'),
  ).toContainText("Page 1");
  report.checks.push(
    "Explicit search/date/enum clears omit empty params and return first-page200",
  );
  const light = await get("bootstrap");
  assert.equal(
    (
      await context.request.put(base + "/api/settings", {
        headers: { Origin: base, "X-CSRF-Token": light.csrfToken },
        data: { theme: "light" },
      })
    ).status(),
    200,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator(".lesson-row")).toHaveCount(30);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.waitForFunction(
    () => document.querySelector(".sidebar").getBoundingClientRect().right <= 1,
  );
  await previews();
  await page.locator(".lesson-row").first().scrollIntoViewIfNeeded();
  await capture("plain-preview-library-390-light");
  await page
    .getByRole("button", { name: "Older saved answers", exact: true })
    .scrollIntoViewIfNeeded();
  await capture("library-pager-390-light");
  assert.equal(hash((await get("progress")).evidence || []), evidence);
  assert.equal(report.generationRequests, 0);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.externalRequests, []);
  report.checks.push(
    "Both theme/viewport targets fit; evidence unchanged and no inference/external request",
  );
  report.servedAssets = [];
  for (const url of await page.evaluate(() =>
    [...document.querySelectorAll("script[src],link[rel=stylesheet]")].map(
      (e) => e.src || e.href,
    ),
  )) {
    const r = await context.request.get(url);
    report.servedAssets.push({ url, sha256: hash(await r.text()) });
  }
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
  if (originalTheme) {
    try {
      const b = await get("bootstrap");
      assert.equal(
        (
          await context.request.put(base + "/api/settings", {
            headers: { Origin: base, "X-CSRF-Token": b.csrfToken },
            data: { theme: originalTheme },
          })
        ).status(),
        200,
      );
      report.restoredTheme = originalTheme;
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
