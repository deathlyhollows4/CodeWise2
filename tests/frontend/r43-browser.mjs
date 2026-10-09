import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
const output = resolve("docs/release-evidence/frontend-r43");
mkdirSync(output, { recursive: true });
const browser = await launchBrowser(),
  context = await browser.newContext({
    viewport: { width: 1366, height: 1000 },
  }),
  page = await context.newPage();
const thread = "43000000-0000-4000-8000-000000000001",
  oldest = "43000000-0000-4000-8001-000000000001",
  needle = "R43_OLDEST_PAGE_TAIL_MATCH";
const report = {
  timestamp: new Date().toISOString(),
  scope:
    "Actual API2 temporary fixture bounded lists/full-text search/detail selection; no inference or judge execution",
  status: "running",
  checks: [],
  captures: [],
  errors: [],
  externalRequests: [],
  collections: [],
  details: [],
  generationRequests: 0,
};
let phase = "initial",
  originalTheme;
const responseTasks = [];
const hash = (x) =>
  createHash("sha256")
    .update(typeof x === "string" ? x : JSON.stringify(x))
    .digest("hex");
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("request", (r) => {
  const url = new URL(r.url());
  if (r.method() === "POST" && url.pathname === "/api/tutor")
    report.generationRequests++;
  if (
    /^\/api\/(library|jobs)\/[^/]+$/.test(url.pathname) &&
    r.method() === "GET"
  )
    report.details.push({ phase, path: url.pathname });
  if (
    !r.url().startsWith(base) &&
    !r.url().startsWith("blob:") &&
    !r.url().startsWith("data:")
  )
    report.externalRequests.push(r.url());
});
page.on("response", (response) => {
  const url = new URL(response.url());
  if (!/^\/api\/(library|jobs)$/.test(url.pathname)) return;
  const at = phase;
  responseTasks.push(
    (async () => {
      const raw = await response.text(),
        body = JSON.parse(raw);
      const row = {
        phase: at,
        path: url.pathname,
        status: response.status(),
        bytes: Buffer.byteLength(raw),
        pageSize: body.pageSize,
        items: body.items?.length,
        total: body.total,
      };
      report.collections.push(row);
      if (response.status() === 200) {
        assert.ok(
          body.items.length <= body.pageSize && body.pageSize <= 100,
          "Bounded page envelope",
        );
        assert.ok(row.bytes < 180000, "Summary bytes bounded");
        for (const item of body.items)
          for (const key of [
            "markdown",
            "prompt",
            "code",
            "codeSnapshot",
            "notes",
            "contextMessages",
            "result",
          ])
            assert.equal(
              Object.hasOwn(item, key),
              false,
              "No full/private body in collection " + key,
            );
      }
    })().catch((e) => report.errors.push("Collection assertion: " + e.message)),
  );
});
const get = async (path) => {
  const response = await context.request.get(base + "/api/" + path);
  assert.equal(response.status(), 200, path);
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
    "No document overflow",
  );
}
async function libraryRows() {
  await expect(page.locator(".lesson-row").first()).toBeVisible();
  return page
    .locator(".lesson-row a")
    .evaluateAll((nodes) =>
      nodes.map((n) => new URL(n.href).pathname.split("/").at(-1)),
    );
}
async function navigate(url) {
  await Promise.all(responseTasks);
  await page.goto(url);
}
try {
  await navigate(base + "/library");
  await page.locator(".fixture-banner").waitFor();
  const bootstrap = await get("bootstrap");
  assert.equal(bootstrap.fixture, true);
  assert.equal(bootstrap.apiVersion, 2);
  originalTheme = bootstrap.preferences.theme;
  const theme = await context.request.put(base + "/api/settings", {
    headers: { Origin: base, "X-CSRF-Token": bootstrap.csrfToken },
    data: { theme: "dark" },
  });
  assert.equal(theme.status(), 200);
  await Promise.all(responseTasks);
  await page.reload();
  const progressBefore = hash((await get("progress")).evidence || []),
    initial = await get("library?pageSize=30");
  assert.ok(initial.total >= 68, "Large actual fixture seeded");
  await expect(page.locator(".lesson-row")).toHaveCount(30);
  let ids = await libraryRows();
  assert.equal(report.details.length, 0, "Listing does not fetch full lessons");
  await capture("library-page1-1366-dark");
  for (let index = 1; index <= 2; index++) {
    phase = "library-page" + (index + 1);
    await page
      .getByRole("button", { name: "Older saved answers", exact: true })
      .click();
    await expect(
      page.locator('[aria-label="Saved answers pages"]'),
    ).toContainText("Page " + (index + 1));
    const next = await libraryRows();
    assert.ok(next.length <= 30);
    assert.equal(
      next.some((id) => ids.includes(id)),
      false,
      "Stable pages have no repeated IDs",
    );
    ids.push(...next);
  }
  assert.ok(ids.length >= 68);
  assert.equal(report.details.length, 0, "Three summary pages fetch no bodies");
  report.checks.push(
    "Three bounded actual summary pages, stable distinct IDs, zero full-body prefetch",
  );
  await page
    .getByRole("button", { name: "Newer saved answers", exact: true })
    .click();
  await expect(
    page.locator('[aria-label="Saved answers pages"]'),
  ).toContainText("Page 2");
  report.checks.push("Newer navigation returns to prior page");
  let changed = false;
  await page.route("**/api/library?*", (route) => {
    const url = new URL(route.request().url());
    if (!changed && url.searchParams.has("cursor")) {
      changed = true;
      url.searchParams.set("cursor", "invalid-browser-fixture-cursor");
      return route.continue({ url: url.href });
    }
    return route.continue();
  });
  phase = "invalid-cursor";
  await page
    .getByRole("button", { name: "Older saved answers", exact: true })
    .click();
  await expect(
    page.getByText("This saved list changed. Showing its first page again.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator('[aria-label="Saved answers pages"]'),
  ).toContainText("Page 1");
  await page.unroute("**/api/library?*");
  report.checks.push(
    "Actual backend CURSOR_INVALID resets first page with recovery notice",
  );
  phase = "body-search";
  await page
    .getByRole("textbox", { name: "Search lessons and code", exact: true })
    .fill(needle);
  await expect(page.locator(".lesson-row")).toHaveCount(1);
  await expect(page.locator(".lesson-row a")).toHaveAttribute(
    "href",
    new RegExp(oldest),
  );
  assert.equal(
    report.details.length,
    0,
    "Deep body search fetches summary only",
  );
  report.checks.push(
    "Full-text search finds oldest deep body beyond initial page",
  );
  await capture("library-deep-search-1366-dark");
  phase = "selected-lesson";
  await page.locator(".lesson-row a").click();
  await expect(page.locator(".lesson-content")).toContainText(needle);
  const full = await get("library/" + oldest);
  assert.ok(full.markdown.length > 400, "Full body preserved");
  report.selectedBodyHash = hash(full.markdown);
  phase = "selected-export";
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Markdown", exact: true }).click();
  const downloaded = await downloading;
  const exportPath = resolve(output, "selected-complete-lesson.md");
  await downloaded.saveAs(exportPath);
  assert.equal(
    hash(readFileSync(exportPath, "utf8")),
    hash(full.markdown),
    "Complete selected export preserved",
  );
  report.checks.push(
    "Actual selected Markdown download preserves the complete stored body",
  );
  await expect(
    page.locator('[aria-label="Saved lesson version"] option'),
  ).toHaveCount(31);
  assert.equal(
    report.details.filter((r) => r.phase === "selected-lesson").length,
    1,
    "Only selected full lesson fetched",
  );
  for (let index = 1; index <= 2; index++) {
    phase = "version-page" + (index + 1);
    await page
      .getByRole("button", { name: "Older saved versions", exact: true })
      .click();
    await expect(
      page.locator('[aria-label="Saved versions pages"]'),
    ).toContainText("Page " + (index + 1));
    assert.ok(
      (await page
        .locator('[aria-label="Saved lesson version"] option')
        .count()) <= 31,
    );
  }
  assert.equal(
    report.details.some((r) => r.phase.startsWith("version-page")),
    false,
    "Version paging does not fetch full bodies",
  );
  const options = await page
    .locator('[aria-label="Compare lesson version"] option')
    .evaluateAll((nodes) => nodes.map((n) => n.value).filter(Boolean));
  assert.ok(options.length);
  phase = "selected-compare";
  await page
    .getByLabel("Compare lesson version", { exact: true })
    .selectOption(options[0]);
  await expect(page.getByText(/Comparison · Version/)).toBeVisible();
  assert.equal(
    report.details.filter((r) => r.phase === "selected-compare").length,
    1,
  );
  report.checks.push(
    "Paged versions remain bounded; comparison fetches one selected full record",
  );
  await capture("version-pages-compare-1366-dark");
  phase = "job-list";
  await navigate(base + "/problems/fixture-running-total");
  await page.locator(".fixture-banner").waitFor();
  await page.getByRole("button", { name: "Results", exact: true }).click();
  await page.getByRole("button", { name: "History", exact: true }).click();
  await expect(
    page.locator('[aria-label="Saved results pages"]'),
  ).toContainText("Page 1");
  assert.equal(
    report.details.some(
      (r) => r.phase === "job-list" && r.path.startsWith("/api/jobs/"),
    ),
    false,
    "Job summaries do not prefetch source/results",
  );
  for (let index = 1; index <= 2; index++) {
    await page
      .getByRole("button", { name: "Older saved results", exact: true })
      .click();
    await expect(
      page.locator('[aria-label="Saved results pages"]'),
    ).toContainText("Page " + (index + 1));
  }
  phase = "selected-job";
  await page.locator(".results button.row.ghost").first().click();
  await expect(page.locator(".results")).toContainText("Infrastructure error");
  assert.equal(
    report.details.filter(
      (r) => r.phase === "selected-job" && r.path.startsWith("/api/jobs/"),
    ).length,
    1,
    "One selected job full detail",
  );
  report.checks.push(
    "Job histories page without bodies; selected saved result fetched once",
  );
  await capture("job-history-selected-1366-dark");
  phase = "home";
  await navigate(base + "/");
  await page.locator(".fixture-banner").waitFor();
  await expect(page.locator(".lesson-row")).toHaveCount(3);
  assert.equal(
    report.details.some((r) => r.phase === "home"),
    false,
  );
  report.checks.push(
    "Home renders three recent summaries without detail prefetch",
  );
  const currentBootstrap = await get("bootstrap");
  assert.equal(
    (
      await context.request.put(base + "/api/settings", {
        headers: { Origin: base, "X-CSRF-Token": currentBootstrap.csrfToken },
        data: { theme: "light" },
      })
    ).status(),
    200,
  );
  phase = "mobile-library";
  await page.setViewportSize({ width: 390, height: 844 });
  await navigate(base + "/library");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".lesson-row")).toHaveCount(30);
  await page.waitForFunction(
    () => document.querySelector(".sidebar").getBoundingClientRect().right <= 1,
  );
  await page
    .getByRole("button", { name: "Older saved answers", exact: true })
    .scrollIntoViewIfNeeded();
  await capture("library-pager-390-light");
  assert.equal(hash((await get("progress")).evidence || []), progressBefore);
  assert.equal(report.generationRequests, 0);
  await Promise.all(responseTasks);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.externalRequests, []);
  report.checks.push(
    "Navigation/search/paging preserve evidence and make zero inference/external requests",
  );
  const assets = await page.evaluate(() =>
    [...document.querySelectorAll("script[src],link[rel=stylesheet]")].map(
      (e) => e.src || e.href,
    ),
  );
  report.servedAssets = [];
  for (const url of assets) {
    const response = await context.request.get(url);
    report.servedAssets.push({ url, sha256: hash(await response.text()) });
  }
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.failure = {
    phase,
    message: error.message,
    stack: error.stack,
    url: page.url(),
  };
  try {
    await capture("failure-" + Date.now());
  } catch {}
  process.exitCode = 1;
} finally {
  await Promise.all(responseTasks);
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
