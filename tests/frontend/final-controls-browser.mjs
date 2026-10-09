import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const dir = resolve("docs/release-evidence/frontend-final-controls");
mkdirSync(dir, { recursive: true });
const browser = await launchBrowser(),
  context = await browser.newContext({
    viewport: { width: 1366, height: 1000 },
  }),
  page = await context.newPage();
const report = {
  timestamp: new Date().toISOString(),
  status: "running",
  scope:
    "Actual published243 controlled fixture: keyboard command palette,8responsive theme/header/palette pairs,18 explicit topic-entry suggestions and selected teacher intent. No grading/provider.",
  checks: [],
  captures: [],
  entries: [],
  errors: [],
  external: [],
  dispatch: [],
  assets: [],
};
const observations = [];
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("request", (r) => {
  const url = new URL(r.url());
  if (
    r.method() === "POST" &&
    /^\/api\/(jobs|tutor)(?:\/|$)/.test(url.pathname)
  )
    report.dispatch.push(url.pathname);
  if (
    !r.url().startsWith(base) &&
    !r.url().startsWith("data:") &&
    !r.url().startsWith("blob:")
  )
    report.external.push(r.url());
});
page.on("response", (r) => {
  if (/\/assets\/.*\.(css|js)$/.test(r.url()))
    observations.push(
      r
        .body()
        .then((body) => {
          if (!report.assets.some((a) => a.url === r.url()))
            report.assets.push({
              url: r.url(),
              sha256: createHash("sha256").update(body).digest("hex"),
              bytes: body.length,
            });
        })
        .catch((e) => report.errors.push(e.message)),
    );
});
const get = async (path) => {
  const r = await context.request.get(base + "/api/" + path);
  assert.equal(r.status(), 200, path);
  return r.json();
};
const b = await get("bootstrap");
assert.equal(b.fixture, true);
assert.equal(b.catalogue.published, 243);
assert.equal(b.catalogue.preview, 0);
assert.equal(b.key.configured, false);
const prefs = async (data) => {
  const r = await context.request.put(base + "/api/settings", {
    headers: { Origin: base, "X-CSRF-Token": b.csrfToken },
    data,
  });
  assert.equal(r.status(), 200);
};
async function capture(name) {
  const path = resolve(dir, name + ".png");
  await page.screenshot({ path, fullPage: false });
  report.captures.push(path);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
    false,
    name + " overflow",
  );
}
const trigger = () =>
  page.getByRole("button", {
    name: "Quick search (Ctrl or Command K)",
    exact: true,
  });
const palette = () =>
  page.getByRole("dialog", { name: "Quick search", exact: true });
async function suggest(topic) {
  await page.goto(base + "/topics/" + topic.id);
  const incoming = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/recommendation" &&
      new URL(r.url()).searchParams.get("topic") === topic.id,
  );
  await page
    .getByRole("button", { name: "Suggest a challenge", exact: true })
    .click();
  const response = await incoming;
  assert.equal(response.status(), 200);
  const result = await response.json();
  assert.equal(result.focusTopic, topic.id);
  assert.equal(result.language, "python");
  assert.ok(result.problemId, topic.id + " real eligible entry");
  const p = await get("problems/" + result.problemId);
  assert.equal(
    p.prerequisites.length,
    0,
    "Empty evidence must select a truly ready foundation",
  );
  await expect(
    page.getByRole("region", { name: "Topic challenge suggestion" }),
  ).toContainText(p.title);
  report.entries.push({
    topic: topic.id,
    selected: p.id,
    selectedTopic: p.primaryTopic,
    mode: result.mode,
    pendingStep: result.pendingStep,
    rationale: result.rationale,
    learningRequirement: result.learningRequirement,
  });
  return { result, p };
}
try {
  await prefs({ onboarded: true, theme: "dark", language: "python" });
  const before = JSON.stringify(await get("progress"));
  assert.deepEqual((await get("progress")).evidence, []);
  await page.goto(base + "/");
  await trigger().focus();
  await page.keyboard.press("Control+k");
  await expect(palette()).toBeVisible();
  const input = palette().getByRole("combobox");
  await expect(input).toBeFocused();
  await expect(palette().getByRole("listbox")).toBeVisible();
  await expect(palette().getByRole("option").first()).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await input.press("ArrowDown");
  await expect(input).toHaveAttribute(
    "aria-activedescendant",
    "command-result-1",
  );
  await input.press("ArrowUp");
  await expect(input).toHaveAttribute(
    "aria-activedescendant",
    "command-result-0",
  );
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    assert.equal(
      await palette().evaluate((d) => d.contains(document.activeElement)),
      true,
      "Native modal focus stays contained",
    );
  }
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Shift+Tab");
    assert.equal(
      await palette().evaluate((d) => d.contains(document.activeElement)),
      true,
      "Reverse modal focus stays contained",
    );
  }
  await page.keyboard.press("Escape");
  await expect(palette()).not.toBeVisible();
  await expect(trigger()).toBeFocused();
  report.checks.push(
    "CtrlK open, combobox/listbox/option selection, arrows, native focus containment, Escape and opener restoration",
  );
  await trigger().click();
  await input.fill("First repeated position");
  await expect(
    palette().getByRole("option", {
      name: "First repeated position Problem",
      exact: true,
    }),
  ).toBeVisible();
  await input.press("Enter");
  await expect(page).toHaveURL(base + "/problems/arrays-hashing-03");
  await expect(page.locator(".monaco-editor")).toBeVisible();
  report.checks.push(
    "Keyboard Enter opens a real public problem result without execution",
  );
  await trigger().click();
  await input.fill("no-fixture-match-zzzz");
  await expect(
    palette().getByText("No matches. Try a shorter title or topic name.", {
      exact: true,
    }),
  ).toBeVisible();
  await input.press("Escape");
  let failOnce = true;
  await page.route("**/api/problems?q=Running%20total", async (route) => {
    if (failOnce) {
      failOnce = false;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          code: "FIXTURE_SEARCH_FAILURE",
          message: "Explicit fixture local search failure; retry.",
        }),
      });
    } else await route.continue();
  });
  await trigger().click();
  await input.fill("Running total");
  await expect(palette().getByRole("alert")).toContainText(
    "Explicit fixture local search failure",
  );
  await palette().getByRole("button", { name: "Retry", exact: true }).click();
  await expect(
    palette().getByRole("option", {
      name: "Running total Problem",
      exact: true,
    }),
  ).toBeVisible();
  await input.press("Escape");
  await page.unroute("**/api/problems?q=Running%20total");
  report.checks.push(
    "Empty result and controlled search failure recover honestly",
  );
  for (const theme of ["dark", "light"])
    for (const width of [390, 768, 1366, 1920]) {
      await prefs({ theme });
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.goto(base + "/");
      await expect(trigger()).toBeVisible();
      await capture(`header-${theme}-${width}`);
      await trigger().click();
      await input.fill("Trees");
      await expect(
        palette().getByRole("option", { name: "Trees Topic", exact: true }),
      ).toBeVisible();
      await capture(`palette-${theme}-${width}`);
      await page.keyboard.press("Escape");
    }
  await prefs({ theme: "dark" });
  await page.setViewportSize({ width: 1366, height: 1000 });
  const topics = await get("topics");
  assert.equal(topics.length, 18);
  let chosen;
  for (const topic of topics) {
    const entry = await suggest(topic);
    if (entry.result.mode === "prerequisite_remediation" && !chosen)
      chosen = topic;
  }
  assert.equal(JSON.stringify(await get("progress")), before);
  report.checks.push(
    "Actual18 topics yield eligible real initial challenge/teacher; no known skill/evidence was fabricated",
  );
  assert.ok(chosen);
  const { result, p } = await suggest(chosen);
  await capture("topic-prerequisite-1366-dark");
  await page
    .getByRole("button", { name: "Start prerequisite practice", exact: true })
    .click();
  await expect(page).toHaveURL(base + "/problems/" + p.id);
  await expect(page.locator(".monaco-editor")).toBeVisible();
  const backup = await get("data/export");
  assert.equal(backup.learningMetadata.pendingChallenge.topic, chosen.id);
  assert.equal(backup.learningMetadata.pendingChallenge.step, 1);
  assert.equal(backup.learningMetadata.currentSelection.problemId, p.id);
  await page.reload();
  await expect(page.locator(".monaco-editor")).toBeVisible();
  const resumed = await get("recommendation");
  assert.equal(resumed.focusTopic, chosen.id);
  assert.equal(resumed.problemId, p.id);
  assert.equal(resumed.mode, "prerequisite_remediation");
  report.checks.push({
    name: "Explicit selected teacher/manual navigation/reload preserves original topic step1 intent",
    topic: chosen.id,
    teacher: p.id,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await suggest(chosen);
  await page.waitForFunction(
    () => document.querySelector(".sidebar").getBoundingClientRect().right <= 1,
  );
  await capture("topic-prerequisite-390-dark");
  const sources = await get("sources");
  assert.equal(sources.length, 243);
  assert.ok(sources.every((s) => s.independentReview === "passed"));
  assert.ok(sources.every((s) => s.authorIndependentReview === "pending"));
  assert.ok(sources.every((s) => !Object.hasOwn(s, "internalReviewIdentity")));
  assert.ok(sources.every((s) => !Object.hasOwn(s, "reviewIdentity")));
  report.checks.push(
    "Current Sources independent reviews pass while original author note is separately preserved; no internal review field",
  );
  await Promise.all(observations);
  assert.equal(report.errors.length, 0);
  assert.equal(report.external.length, 0);
  assert.equal(report.dispatch.length, 0);
  report.status = "passed";
} catch (e) {
  report.status = "failed";
  report.failure = { message: e.message, stack: e.stack, url: page.url() };
  await capture("failure-" + Date.now()).catch(() => {});
  console.error(e.stack);
  process.exitCode = 1;
} finally {
  await prefs({
    onboarded: b.preferences.onboarded,
    theme: b.preferences.theme,
    language: b.preferences.language,
  });
  await Promise.all(observations);
  writeFileSync(resolve(dir, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(
    JSON.stringify(
      {
        status: report.status,
        entries: report.entries.length,
        captures: report.captures.length,
      },
      null,
      2,
    ),
  );
}
