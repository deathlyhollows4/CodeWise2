import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
assert.equal(base, "http://127.0.0.1:3193");
const dir = resolve("docs/release-evidence/frontend-live-scroll");
mkdirSync(dir, { recursive: true });
const browser = await launchBrowser(),
  context = await browser.newContext({
    viewport: { width: 1366, height: 1000 },
    permissions: ["clipboard-read", "clipboard-write"],
  }),
  page = await context.newPage();
const report = {
  timestamp: new Date().toISOString(),
  status: "running",
  scope:
    "Separate local controlled R55 stream, no executed code; live drawer and same-generation saved tab, reset/custom-negative controls. Original3191/3192 untouched.",
  checks: [],
  captures: [],
  errors: [],
  jobPosts: 0,
  tutorPosts: 0,
};
const hash = (s) => createHash("sha256").update(s).digest("hex");
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("request", (r) => {
  const p = new URL(r.url()).pathname;
  if (r.method() === "POST" && p === "/api/jobs") report.jobPosts++;
  if (r.method() === "POST" && p === "/api/tutor") report.tutorPosts++;
});
await context.addInitScript(() => {
  const original = Element.prototype.scrollIntoView;
  window.__liveScrollCalls = [];
  Element.prototype.scrollIntoView = function (options) {
    if (this.classList.contains("live-response-end"))
      window.__liveScrollCalls.push({
        behavior: options?.behavior,
        y: scrollY,
      });
    return original.call(this, options);
  };
});
const get = async (p) => {
  const r = await context.request.get(base + "/api/" + p);
  assert.equal(r.status(), 200, p);
  return r.json();
};
async function postResponse(path, method, action, status = 200) {
  const pending = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/" + path &&
      r.request().method() === method,
  );
  await action();
  const r = await pending;
  assert.equal(r.status(), status);
  return r.json();
}
async function capture(p, name) {
  const path = resolve(dir, name + ".png");
  await p.screenshot({ path, fullPage: false });
  report.captures.push(path);
  assert.equal(
    await p.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
    false,
  );
}
const b = await get("bootstrap");
report.sourceHashes = Object.fromEntries(
  ["apps/web/src/LiveLesson.tsx", "apps/web/src/App.tsx", "tests/frontend/fixture-final-provider.ts"].map((path) => [path, hash(readFileSync(path))]),
);
const entryHtml = await (await context.request.get(base + "/")).text();
report.servedAssets = [];
for (const path of [...new Set(entryHtml.match(/\/assets\/[^"'\s<>]+\.(?:js|css)/g) || [])]) {
  const response = await context.request.get(base + path);
  assert.equal(response.status(), 200);
  report.servedAssets.push({ path, hash: hash(await response.body()) });
}
assert.equal(b.fixture, true);
assert.equal(b.runner.ready, false);
const resume = process.env.CODEWISE2_R55_RESUME === "1";
assert.equal(b.key.configured, resume);
const pref = await context.request.put(base + "/api/settings", {
  headers: { Origin: base, "X-CSRF-Token": b.csrfToken },
  data: {
    onboarded: true,
    language: "python",
    theme: "dark",
    reducedMotion: false,
    autoExplain: false,
  },
});
assert.equal(pref.status(), 200);
try {
  if (!resume) {
    await page.goto(base + "/problems/arrays-hashing-03");
    await expect(page.locator(".monaco-editor")).toBeVisible();
    await page
      .locator(".editor .monaco-editor")
      .click({ position: { x: 120, y: 45 } });
    await page.keyboard.press("Control+a");
    await page.keyboard.insertText("# Isolated reset proof, never executed");
    await expect
      .poll(async () => (await get("drafts/arrays-hashing-03/python")).code)
      .toBe("# Isolated reset proof, never executed");
    await page
      .getByRole("button", { name: "Reset draft to starter", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    assert.equal(
      (await get("drafts/arrays-hashing-03/python")).code,
      "# Isolated reset proof, never executed",
    );
    await page
      .getByRole("button", { name: "Reset draft to starter", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Reset draft", exact: true })
      .click();
    const p = await get("problems/arrays-hashing-03");
    await expect
      .poll(async () => (await get("drafts/arrays-hashing-03/python")).code)
      .toBe(p.starters.python);
    report.checks.push(
      "Actual draft reset Cancel preserves code; explicit Confirm restores only selected-language starter",
    );
    await page
      .getByRole("button", { name: "Custom input", exact: true })
      .click();
    await page.locator("#custom").fill("{ malformed");
    const jobBefore = report.jobPosts;
    await page
      .getByRole("button", { name: "Run custom input", exact: true })
      .click();
    await expect(
      page.getByText("Custom input must be valid JSON.", { exact: true }),
    ).toBeVisible();
    assert.equal(report.jobPosts, jobBefore);
    await page.locator("#custom").fill('{"values":"not-an-array"}');
    await postResponse(
      "jobs",
      "POST",
      () =>
        page
          .getByRole("button", { name: "Run custom input", exact: true })
          .click(),
      400,
    );
    await expect(
      page.getByText(
        "Custom input violates the problem input schema or constraints.",
        { exact: true },
      ),
    ).toBeVisible();
    assert.equal((await get("jobs?pageSize=100")).total, 0);
    report.checks.push(
      "Malformed JSON rejected beforePOST; invalid shape rejected400 before a job exists; no executed learner code",
    );
    await page.goto(base + "/settings");
    await page
      .locator("#deepseek-key")
      .fill("fixture-only-no-real-credential-r55-test");
    await postResponse("settings/key/test", "POST", () =>
      page
        .getByRole("button", { name: "Test connection", exact: true })
        .click(),
    );
    await postResponse("settings/key", "PUT", () =>
      page.getByRole("button", { name: "Save key", exact: true }).click(),
    );
    await page.getByRole("button", { name: "Usage", exact: true }).click();
    await page
      .getByLabel("Supported DeepSeek model", { exact: true })
      .selectOption("fixture-controlled-local");
    await expect
      .poll(async () => (await get("settings")).preferences.model)
      .toBe("fixture-controlled-local");
  } else {
    const earlier = JSON.parse(
      readFileSync(
        resolve(dir, "failed-finished-before-append-report.json"),
        "utf8",
      ),
    );
    report.checks.push(...earlier.checks);
    report.previousInvalidSchemaPost = 1;
  }
  await page.goto(base + "/problems/arrays-hashing-03");
  await page.getByRole("button", { name: "Tutor", exact: true }).click();
  await page
    .getByRole("button", { name: "Teach the full solution", exact: true })
    .click();
  const g = await postResponse(
    "tutor",
    "POST",
    () =>
      page
        .getByRole("dialog")
        .getByRole("button", { name: "Send request", exact: true })
        .click(),
    202,
  );
  report.generationId = g.id;
  const fixture = JSON.parse(
      readFileSync(
        "docs/release-evidence/frontend-live-scroll-lifecycle.json",
        "utf8",
      ),
    ),
    gateDir = resolve(fixture.dataDir, "r55-gates");
  mkdirSync(gateDir, { recursive: true });
  const release = (number) =>
    writeFileSync(
      resolve(gateDir, `allow-${number}`),
      "explicit local UI assertion ready",
    );
  const savedPage = await context.newPage();
  savedPage.on("pageerror", (error) => report.errors.push(error.message));
  await savedPage.goto(base + "/library/" + g.id);
  await expect(savedPage.locator(".live-lesson")).toBeVisible();
  const count = (view = page) =>
    view
      .locator(".live-lesson .lesson-content p")
      .filter({ hasText: /^Local fixture checkpoint/ })
      .count();
  await expect.poll(() => count(), { timeout: 10000 }).toBeGreaterThanOrEqual(16);
  for (const [p, label] of [
    [page, "drawer"],
    [savedPage, "saved"],
  ]) {
    await p.emulateMedia({ reducedMotion: "reduce" });
    const wrapper = p.locator(".live-lesson");
    await wrapper.getByLabel("Follow new text", { exact: true }).check();
    await p.waitForFunction(() => {
      const end = document
        .querySelector(".live-response-end")
        .getBoundingClientRect();
      return end.bottom <= innerHeight + 3;
    });
    await p.evaluate(() => {
      scrollBy(0, -1);
    });
    await p.waitForFunction(
      () => !document.querySelector(".live-lesson-controls input").checked,
    );
    const y = await p.evaluate(() => scrollY),
      before = await count(p);
    release(label === "drawer" ? 17 : 18);
    await expect.poll(() => count(p)).toBeGreaterThan(before);
    const after = await p.evaluate(() => scrollY);
    assert.ok(
      Math.abs(after - y) <= 3,
      "Tiny upward pause holds viewport " + label,
    );
    await expect(
      wrapper.getByRole("button", {
        name: "New response below ↓",
        exact: true,
      }),
    ).toBeVisible();
    const geometry = await wrapper
      .getByRole("button", { name: "New response below ↓", exact: true })
      .boundingBox();
    assert.ok(
      geometry.y >= 0 && geometry.y + geometry.height <= 1000,
      "New text control in viewport " + label,
    );
    await wrapper
      .getByRole("button", { name: "New response below ↓", exact: true })
      .click();
    await p.waitForFunction(
      () =>
        document.querySelector(".live-response-end").getBoundingClientRect()
          .bottom <=
        innerHeight + 3,
    );
    const calls = await p.evaluate(() => window.__liveScrollCalls);
    assert.equal(
      calls.at(-1).behavior,
      "instant",
      "OS reduced motion respected " + label,
    );
    report.checks.push({
      view: label,
      tinyUpwardPause: true,
      beforeY: y,
      afterY: after,
      controlBounds: geometry,
      lastScrollBehavior: calls.at(-1).behavior,
    });
    await capture(p, "live-" + label + "-paused-and-latest");
  }
  release(40);
  await expect
    .poll(async () => (await get("library/" + g.id)).status, { timeout: 25000 })
    .toBe("complete");
  const terminal = await get("library/" + g.id);
  await expect
    .poll(() =>
      savedPage
        .locator(".lesson-content p")
        .filter({ hasText: /^Local fixture checkpoint/ })
        .count(),
    )
    .toBe(40);
  assert.equal(await count(), 40);
  report.terminal = {
    id: g.id,
    status: terminal.status,
    markdownHash: hash(terminal.markdown),
    bytes: Buffer.byteLength(terminal.markdown),
  };
  await savedPage.setViewportSize({ width: 390, height: 844 });
  await savedPage.goto(base + "/library/" + g.id);
  await expect(savedPage.locator(".lesson-content")).toBeVisible();
  await savedPage.waitForFunction(
    () => document.querySelector(".sidebar").getBoundingClientRect().right <= 1,
  );
  assert.equal(
    await savedPage.locator(".live-lesson-controls").count(),
    0,
    "Old completed lesson has no misleading live controls",
  );
  await capture(savedPage, "completed-static-390");
  report.checks.push(
    "Terminal complete text retained40paragraphs; reopened old completed lesson excludes live follow controls",
  );
  assert.equal(report.tutorPosts, 1);
  assert.equal((await get("jobs?pageSize=100")).total, 0);
  assert.equal(report.errors.length, 0);
  report.status = "passed";
} catch (e) {
  report.status = "failed";
  report.failure = { message: e.message, stack: e.stack, url: page.url() };
  await capture(page, "failure-" + Date.now()).catch(() => {});
  console.error(e.stack);
  process.exitCode = 1;
} finally {
  report.harnessHash = hash(readFileSync(new URL(import.meta.url)));
  writeFileSync(resolve(dir, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(
    JSON.stringify(
      {
        status: report.status,
        checks: report.checks.length,
        jobPosts: report.jobPosts,
        tutorPosts: report.tutorPosts,
      },
      null,
      2,
    ),
  );
}
