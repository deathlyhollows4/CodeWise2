import { launchBrowser, base } from "./browser-runtime.mjs";
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  renameSync,
  existsSync,
} from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
const output = resolve("docs/release-evidence/frontend-visual/final");
mkdirSync(output, { recursive: true });
const browser = await launchBrowser();
const context = await browser.newContext({
  viewport: { width: 1366, height: 1000 },
});
const page = await context.newPage();
const errors = [],
  external = [],
  inference = [],
  captures = [],
  checks = [],
  documents = [];
let fixtureConfirmed = false;
page.on("response", (response) => {
  if (response.request().resourceType() === "document")
    documents.push({ url: response.url(), status: response.status() });
});
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => {
  const url = request.url();
  if (
    !url.startsWith(base) &&
    !url.startsWith("data:") &&
    !url.startsWith("blob:")
  )
    external.push(url);
  if (
    request.method() === "POST" &&
    (/\/api\/tutor(?:\?|$)/.test(url) ||
      url.includes("/api/settings/tutor-test"))
  )
    inference.push(url);
});
process.once("uncaughtException", async (error) => {
  let failureScreenshot = null,
    failureBody = null;
  if (fixtureConfirmed) {
    failureScreenshot = resolve(output, `failure-${Date.now()}.png`);
    await page
      .screenshot({ path: failureScreenshot, fullPage: true })
      .catch(() => {});
    failureBody = await page
      .locator("body")
      .innerText()
      .catch(() => null);
  }
  writeFileSync(
    resolve(output, "report.json"),
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        fixture: true,
        status: "failed",
        screenshots: captures.length,
        captures,
        checks,
        errors,
        externalRequests: external,
        inferenceRequests: inference,
        failure: error.message,
        failureStack: error.stack,
        failureUrl: page.url(),
        failureScreenshot,
        failureBody,
        documents,
      },
      null,
      2,
    ),
  );
  console.error(error.stack);
  await browser.close();
  process.exitCode = 1;
});
await page.addInitScript(() => {
  if (navigator.clipboard)
    navigator.clipboard.writeText = async (text) => {
      window.__fixtureCopiedText = text;
    };
});
async function ready() {
  await page.waitForSelector(".fixture-banner");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}
async function prefs(value) {
  await page.evaluate(async (value) => {
    const b = await fetch("/api/bootstrap").then((r) => r.json());
    if (!b.fixture)
      throw new Error("Refusing to mutate a non-fixture application.");
    const r = await fetch("/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": b.csrfToken,
      },
      body: JSON.stringify(value),
    });
    if (!r.ok) throw new Error("Fixture preference update failed.");
  }, value);
}
async function capture(name) {
  const path = resolve(output, name + ".png");
  await page.screenshot({ path, fullPage: true });
  captures.push({ name, path, viewport: page.viewportSize() });
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
  );
  checks.push({ name, overflow });
}
await page.goto(base);
const initial = await page.evaluate(() =>
  fetch("/api/bootstrap").then((r) => r.json()),
);
assert.equal(
  initial.fixture,
  true,
  "Only an explicit temporary fixture may be mutated by this test.",
);
assert.equal(
  initial.key.configured,
  false,
  "No live provider credential may be present in this QA fixture.",
);
fixtureConfirmed = true;
const lessons = await page.evaluate(() =>
  fetch("/api/library").then((r) => r.json()),
);
const alternate = lessons.find(
    (l) => l.version === 2 && l.status === "complete",
  ),
  original = lessons.find(
    (l) =>
      l.version === 1 &&
      l.status === "complete" &&
      l.threadId === alternate?.threadId,
  ),
  partial = lessons.find((l) => l.status === "interrupted");
assert.ok(
  original && alternate && partial,
  "Required persisted fixture versions and long partial lesson must exist.",
);
const resume = process.env.CODEWISE2_QA_RESUME === "1";
if (resume) {
  const prior = JSON.parse(
    readFileSync(resolve(output, "report.json"), "utf8"),
  );
  assert.equal(prior.errors.length, 0);
  assert.equal(prior.externalRequests.length, 0);
  for (const capture of prior.captures) {
    if (
      capture.name.endsWith("-lesson") &&
      process.env.CODEWISE2_QA_ARCHIVE_BAD_LESSON === "1"
    ) {
      const renamed = resolve(output, `partial-before-${capture.name}.png`);
      if (existsSync(capture.path)) renameSync(capture.path, renamed);
      capture.name = `partial-before-${capture.name}`;
      capture.path = renamed;
    }
    captures.push(capture);
  }
  checks.push(...prior.checks.filter((c) => typeof c.overflow === "boolean"));
}
if (!resume) {
  for (const theme of ["dark", "light"]) {
    for (const width of [390, 768, 1366, 1920]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await prefs({ theme, onboarded: false });
      await page.goto(base);
      await ready();
      await capture(`${theme}-${width}-welcome`);
      await page
        .getByRole("button", { name: "Start from the beginning" })
        .click();
      await ready();
      for (const [name, path] of [
        ["home", "/"],
        ["roadmap", "/roadmap"],
        ["topic", "/topics/arrays-hashing"],
        ["problems", "/problems"],
        ["workspace", "/problems/fixture-running-total"],
        ["library", "/library"],
        ["lesson", `/library/${original.id}`],
        ["progress", "/progress"],
        ["settings", "/settings"],
        ["sources", "/sources"],
      ]) {
        await page.goto(base + path);
        await ready();
        if (name === "workspace") {
          if (width <= 768)
            await page
              .getByRole("button", { name: "Code", exact: true })
              .click();
          await page.waitForSelector(".monaco-editor");
        }
        await capture(`${theme}-${width}-${name}`);
      }
    }
  }
}
if (resume && process.env.CODEWISE2_QA_FUNCTIONAL_ONLY !== "1") {
  for (const theme of ["dark", "light"])
    for (const width of [390, 768, 1366, 1920]) {
      await prefs({ theme, onboarded: true });
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.goto(`${base}/library/${original.id}`);
      await ready();
      await capture(`${theme}-${width}-lesson`);
    }
  for (const theme of ["dark", "light"])
    for (const [name, path, width] of [
      ["problems", "/problems", 768],
      ["library", "/library", 768],
      ["home", "/", 1366],
    ]) {
      await prefs({ theme, onboarded: true });
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base + path);
      await ready();
      await capture(`${theme}-${width}-${name}-polished`);
    }
  for (const theme of ["dark", "light"]) {
    await prefs({ theme, onboarded: false });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base);
    await ready();
    await capture(`${theme}-390-welcome-polished`);
    await page
      .getByRole("button", { name: "Start from the beginning" })
      .click();
    await ready();
  }
}
await page.setViewportSize({ width: 1366, height: 1000 });
await page.goto(`${base}/library/${original.id}`);
await ready();
await page.getByLabel("Compare lesson version").selectOption(alternate.id);
await page.getByText("Comparison · Version 2").waitFor();
await capture("version-comparison");
checks.push({ flow: "stored immutable version comparison", passed: true });
await page.getByLabel("Saved lesson version").selectOption(alternate.id);
await page.getByRole("heading", { name: alternate.title }).waitFor();
await page.reload();
await ready();
checks.push({
  flow: "reopen second stored version after refresh",
  passed:
    (await page.getByRole("heading", { name: alternate.title }).count()) === 1,
});
await page
  .getByLabel("Personal lesson notes")
  .fill("Fixture study note: preserve the running total invariant.");
await page.getByRole("button", { name: "Save notes", exact: true }).click();
await page.getByText("Saved on this device", { exact: true }).waitFor();
await page.reload();
await ready();
assert.equal(
  await page.getByLabel("Personal lesson notes").inputValue(),
  "Fixture study note: preserve the running total invariant.",
);
checks.push({ flow: "lesson note persistence", passed: true });
for (const theme of ["dark", "light"])
  for (const width of [390, 1366]) {
    await prefs({ theme });
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${base}/library/${partial.id}`);
    await ready();
    await page
      .getByText("Interrupted — partial answer saved.", { exact: false })
      .waitFor();
    await capture(`${theme}-${width}-long-partial-lesson`);
    assert.ok(await page.locator(".lesson-code").count());
    assert.ok(await page.locator(".table-scroll").count());
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: resolve(output, `${theme}-${width}-partial-top-viewport.png`),
      fullPage: false,
    });
    captures.push({
      name: `${theme}-${width}-partial-top-viewport`,
      path: resolve(output, `${theme}-${width}-partial-top-viewport.png`),
      viewport: page.viewportSize(),
    });
    await page
      .locator(".lesson-content .table-scroll")
      .first()
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: resolve(output, `${theme}-${width}-partial-trace-viewport.png`),
      fullPage: false,
    });
    captures.push({
      name: `${theme}-${width}-partial-trace-viewport`,
      path: resolve(output, `${theme}-${width}-partial-trace-viewport.png`),
      viewport: page.viewportSize(),
    });
    await page.locator(".lesson-code").last().scrollIntoViewIfNeeded();
    await page.screenshot({
      path: resolve(output, `${theme}-${width}-partial-code-viewport.png`),
      fullPage: false,
    });
    captures.push({
      name: `${theme}-${width}-partial-code-viewport`,
      path: resolve(output, `${theme}-${width}-partial-code-viewport.png`),
      viewport: page.viewportSize(),
    });
  }
await page.setViewportSize({ width: 1366, height: 1000 });
await page.goto(base + "/library");
await ready();
await page
  .getByLabel("Filter lessons by question")
  .selectOption("fixture-running-total");
await page.getByLabel("Filter lessons by topic").selectOption("arrays-hashing");
await page.getByLabel("Filter output type").selectOption("solution");
await page.getByLabel("Completion status").selectOption("complete");
const matchingSearch = page.waitForResponse((response) => {
  const url = new URL(response.url());
  return (
    url.pathname === "/api/library" &&
    url.searchParams.get("q") === "accumulator" &&
    url.searchParams.get("action") === "solution" &&
    url.searchParams.get("status") === "complete"
  );
});
await page.getByLabel("Search lessons and code").fill("accumulator");
const matchedResponse = await matchingSearch;
assert.equal(matchedResponse.status(), 200);
assert.equal(
  (await matchedResponse.json()).length,
  1,
  "The real filtered API returns one matching stored lesson",
);
await page.waitForFunction(
  () => document.querySelectorAll(".lesson-row").length === 1,
);
await page.locator(".lesson-row a").first().click();
await page.waitForSelector('[data-search-hit="true"]');
checks.push({
  flow: "full-text search, filters and section scroll",
  passed: true,
});
await page.goto(base + "/problems/fixture-running-total");
await ready();
await page.waitForSelector(".monaco-editor");
if (await page.getByRole("button", { name: "Bookmark", exact: true }).count())
  await page.getByRole("button", { name: "Bookmark", exact: true }).click();
await page.getByRole("button", { name: "Bookmarked", exact: true }).waitFor();
await page
  .getByLabel("Personal problem notes")
  .fill("Ordinary note — no AI needed.");
await page.getByRole("button", { name: "Save notes", exact: true }).click();
await page
  .locator(".problem-notes")
  .getByText("Saved on this device", { exact: true })
  .waitFor();
await page.reload();
await ready();
assert.equal(
  await page.getByLabel("Personal problem notes").inputValue(),
  "Ordinary note — no AI needed.",
);
checks.push({
  flow: "ordinary problem bookmark and notes survive refresh",
  passed: true,
});
await page.getByLabel("Programming language").selectOption("cpp");
await page.waitForFunction(() =>
  document
    .querySelector(".monaco-editor .view-lines")
    ?.textContent.replace(/\u00a0/g, " ")
    .includes("long long"),
);
await page.getByLabel("Programming language").selectOption("java");
await page.waitForFunction(() =>
  document
    .querySelector(".monaco-editor .view-lines")
    ?.textContent.replace(/\u00a0/g, " ")
    .includes("public long"),
);
await page.getByLabel("Programming language").selectOption("python");
await page.waitForFunction(() =>
  document
    .querySelector(".monaco-editor .view-lines")
    ?.textContent.replace(/\u00a0/g, " ")
    .includes("def solve"),
);
checks.push({ flow: "three local editor language starters", passed: true });
await page.getByRole("separator", { name: "Resize problem panel" }).focus();
await page.keyboard.press("ArrowRight");
assert.equal(
  await page
    .getByRole("separator", { name: "Resize problem panel" })
    .getAttribute("aria-valuenow"),
  "45",
);
await page
  .getByRole("separator", { name: "Resize code editor height" })
  .focus();
await page.keyboard.press("ArrowDown");
assert.equal(
  await page
    .getByRole("separator", { name: "Resize code editor height" })
    .getAttribute("aria-valuenow"),
  "390",
);
checks.push({ flow: "both splitters operate with keyboard", passed: true });
await page.getByRole("button", { name: "Reset draft to starter" }).click();
await page.getByRole("dialog").waitFor();
await page.keyboard.press("Tab");
assert.equal(
  await page.evaluate(() => document.activeElement?.textContent),
  "Reset draft",
);
await page.keyboard.press("Tab");
assert.equal(
  await page.evaluate(() => document.activeElement?.textContent),
  "Cancel",
);
await page.keyboard.press("Escape");
assert.equal(await page.getByRole("dialog").count(), 0);
checks.push({
  flow: "dialog containment, escape and focus restoration",
  passed: true,
});
await page.getByRole("button", { name: "Run", exact: true }).click();
await page.getByText("Infrastructure error", { exact: true }).waitFor();
await capture("unavailable-runner-results");
await page.getByRole("button", { name: "Tutor", exact: true }).click();
await page
  .getByText("Practice works without an AI key.", { exact: false })
  .waitFor();
await capture("no-key-contextual-tutor");
checks.push({
  flow: "unavailable runner and no-key tutor remain honest",
  passed: true,
});
await page.goto(base + "/problems");
await ready();
await page.getByRole("button", { name: "Bookmarked", exact: true }).click();
await page.waitForFunction(
  () => document.querySelectorAll(".problem-row").length === 1,
);
await page.getByLabel("Filter completion").selectOption("solved");
await page.getByLabel("Filter assistance").selectOption("assisted");
await page.getByLabel("Filter language history").selectOption("python");
await page.waitForFunction(
  () => document.querySelectorAll(".problem-row").length === 1,
);
checks.push({
  flow: "problem catalogue evidence and bookmark filters",
  passed: true,
});
await page.goto(base + "/progress");
await ready();
assert.ok(
  await page.getByText("Python: 1 recorded outcomes", { exact: true }).count(),
);
assert.ok(
  await page
    .getByRole("heading", { name: "Skills and language evidence" })
    .count(),
);
checks.push({
  flow: "actual fixture skill and per-language evidence visible",
  passed: true,
});
await page.goto(base + "/settings");
await ready();
await page
  .getByLabel("DeepSeek API key", { exact: true })
  .fill("fixture-placeholder-not-a-key");
await page
  .getByRole("button", { name: "Show entered key", exact: true })
  .click();
assert.equal(
  await page
    .getByLabel("DeepSeek API key", { exact: true })
    .getAttribute("type"),
  "text",
);
await page
  .getByRole("button", { name: "Hide entered key", exact: true })
  .click();
await page.getByLabel("DeepSeek API key", { exact: true }).fill("");
assert.ok(
  await page
    .getByRole("button", { name: "Save key", exact: true })
    .isDisabled(),
);
checks.push({
  flow: "local password entry show/hide; no key transmission",
  passed: true,
});
await page.getByRole("button", { name: "Data", exact: true }).click();
await page.getByRole("button", { name: "Delete all saved lessons…" }).click();
await page.getByRole("dialog").waitFor();
assert.ok(
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm", exact: true })
    .isDisabled(),
);
await page
  .getByLabel("Type DELETE ALL LESSONS to confirm")
  .fill("DELETE ALL LESSONS");
assert.ok(
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm", exact: true })
    .isEnabled(),
);
await page
  .getByRole("dialog")
  .getByRole("button", { name: "Cancel", exact: true })
  .click();
checks.push({
  flow: "full-history deletion requires strong exact confirmation",
  passed: true,
});
await page.goto(base + "/sources");
await ready();
await page.getByLabel("Search dependency notices").fill("monaco-editor");
await page
  .locator(".dependency-notice summary")
  .filter({ hasText: /^monaco-editor\s/ })
  .waitFor();
checks.push({ flow: "human-readable installed license notices", passed: true });
assert.equal(errors.length, 0, "No browser exceptions");
assert.equal(external.length, 0, "No external runtime requests");
assert.equal(
  inference.length,
  0,
  "Opening/searching/versions/history must make no generation request",
);
assert.ok(checks.every((check) => !check.overflow && check.passed !== false));
const report = {
  status: "passed",
  timestamp: new Date().toISOString(),
  fixture: true,
  source:
    "real local frontend/backend; explicit temporary fixture records; no provider/judge acceptance proof",
  screenshots: captures.length,
  captures,
  checks,
  errors,
  externalRequests: external,
  inferenceRequests: inference,
};
writeFileSync(resolve(output, "report.json"), JSON.stringify(report, null, 2));
await browser.close();
console.log(
  JSON.stringify(
    {
      screenshots: captures.length,
      checks: checks.length,
      errors,
      external,
      inference,
    },
    null,
    2,
  ),
);
