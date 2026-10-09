import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  openSync,
  closeSync,
} from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
assert.equal(new URL(base).port, "3191");
const dir = resolve("docs/release-evidence/frontend-final-provider");
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
    "Normal localhost UI with explicitly fake credentials and in-process controlled provider; actual storage/SSE/cancel/restart, no live DeepSeek or grading.",
  checks: [],
  generations: [],
  captures: [],
  errors: [],
  external: [],
  jobPosts: 0,
  tutorPosts: 0,
};
const keys = [
  "fixture-only-no-real-credential-offline-0000",
  "fixture-only-no-real-credential-valid-0001",
  "fixture-only-no-real-credential-valid-0002",
];
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("request", (r) => {
  const path = new URL(r.url()).pathname;
  if (r.method() === "POST" && path === "/api/jobs") report.jobPosts++;
  if (r.method() === "POST" && path === "/api/tutor") report.tutorPosts++;
  if (
    !r.url().startsWith(base) &&
    !r.url().startsWith("blob:") &&
    !r.url().startsWith("data:")
  )
    report.external.push(r.url());
});
const get = async (p) => {
  const r = await context.request.get(base + "/api/" + p);
  assert.equal(r.status(), 200, p);
  const data = await r.json();
  assert.ok(
    keys.every((k) => !JSON.stringify(data).includes(k)),
    "No full fake credential in read endpoint " + p,
  );
  return data;
};
const hash = (s) => createHash("sha256").update(s).digest("hex");
async function response(path, method, action, status = 200) {
  const pending = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/" + path &&
      r.request().method() === method,
  );
  await action();
  const r = await pending;
  assert.equal(
    r.status(),
    status === 200 && ["tutor", "settings/tutor-test"].includes(path)
      ? 202
      : status,
    path,
  );
  return r.json();
}
async function capture(name) {
  const path = resolve(dir, name + ".png");
  await page.screenshot({ path, fullPage: false });
  report.captures.push(path);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
    false,
  );
}
async function ai() {
  await page.goto(base + "/settings");
  await page
    .getByRole("button", { name: "AI & DeepSeek", exact: true })
    .click();
}
async function confirm() {
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
}
async function requestHint() {
  await page.goto(base + "/problems/arrays-hashing-03");
  await expect(page.locator(".monaco-editor")).toBeVisible();
  await page.getByRole("button", { name: "Tutor", exact: true }).click();
  await page
    .getByRole("button", { name: "Give me a hint", exact: true })
    .click();
  const g = await response("tutor", "POST", () =>
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Send request", exact: true })
      .click(),
  );
  report.generations.push(g.id);
  await expect
    .poll(async () => (await get("tutor/" + g.id)).markdown.length)
    .toBeGreaterThan(120);
  return g;
}
const b = await get("bootstrap");
assert.equal(b.fixture, true);
assert.equal(b.catalogue.published, 243);
const resume = process.env.CODEWISE2_PROVIDER_RESUME === "1";
assert.equal(b.key.configured, resume);
assert.equal(b.runner.ready, false);
const setting = await context.request.put(base + "/api/settings", {
  headers: { Origin: base, "X-CSRF-Token": b.csrfToken },
  data: {
    onboarded: true,
    language: "python",
    theme: "dark",
    autoExplain: false,
  },
});
assert.equal(setting.status(), 200);
try {
  if (!resume) {
    await ai();
    const input = page.locator("#deepseek-key");
    await input.fill(keys[0]);
    await expect(input).toHaveAttribute("type", "password");
    await page
      .getByRole("button", { name: "Show entered key", exact: true })
      .click();
    await expect(input).toHaveAttribute("type", "text");
    await page
      .getByRole("button", { name: "Hide entered key", exact: true })
      .click();
    await response(
      "settings/key/test",
      "POST",
      () =>
        page
          .getByRole("button", { name: "Test connection", exact: true })
          .click(),
      502,
    );
    await response("settings/key", "PUT", () =>
      page.getByRole("button", { name: "Save key", exact: true }).click(),
    );
    await expect(input).toHaveValue("");
    assert.equal((await get("bootstrap")).key.status, "saved_unverified");
    await response(
      "settings/key/test",
      "POST",
      () =>
        page
          .getByRole("button", { name: "Test connection", exact: true })
          .click(),
      502,
    );
    assert.equal((await get("bootstrap")).key.status, "unreachable");
    report.checks.push(
      "Actual password/show-hide/offline save/mask/unreachable state; field cleared and no secret readback",
    );
    await input.fill(keys[1]);
    await response("settings/key/test", "POST", () =>
      page
        .getByRole("button", { name: "Test connection", exact: true })
        .click(),
    );
    await page
      .getByRole("button", { name: "Replace key", exact: true })
      .click();
    await response("settings/key", "PUT", confirm);
    await expect(input).toHaveValue("");
    const valid = (await get("bootstrap")).key;
    assert.equal(valid.status, "verified");
    await page.reload();
    await expect(input).toHaveValue("");
    await input.fill("fixture-only-no-real-credential-denied-9999");
    await response(
      "settings/key/test",
      "POST",
      () =>
        page
          .getByRole("button", { name: "Test connection", exact: true })
          .click(),
      502,
    );
    assert.equal((await get("bootstrap")).key.version, valid.version);
    assert.equal((await get("bootstrap")).key.status, "verified");
    report.checks.push(
      "Verified model listing/replace/reload, invalid unsaved candidate preserves saved credential/version",
    );
    await input.fill(keys[2]);
    await response("settings/key/test", "POST", () =>
      page
        .getByRole("button", { name: "Test connection", exact: true })
        .click(),
    );
    await page
      .getByRole("button", { name: "Replace key", exact: true })
      .click();
    await response("settings/key", "PUT", confirm);
    await expect(input).toHaveValue("");
    await page.getByRole("button", { name: "Usage", exact: true }).click();
    await page
      .getByLabel("Supported DeepSeek model", { exact: true })
      .selectOption("fixture-controlled-local");
    await expect
      .poll(async () => (await get("settings")).preferences.model)
      .toBe("fixture-controlled-local");
    await capture("configured-model-local-fixture");
    await ai();
    await page
      .getByRole("button", { name: "Test a small tutor response", exact: true })
      .click();
    await response("settings/tutor-test", "POST", confirm);
  } else {
    const previous = JSON.parse(
      readFileSync(resolve(dir, "failed-async-status-report.json"), "utf8"),
    );
    assert.equal(previous.checks.length, 2);
    report.checks.push(...previous.checks);
    const test = (await get("library?pageSize=100")).items.find(
      (l) => l.problemId === "settings-connection-test",
    );
    assert.ok(test);
    await expect
      .poll(async () => (await get("library/" + test.id)).status)
      .toBe("complete");
    report.reusedSettingsTutorTest = {
      id: test.id,
      status: "complete",
      qualification:
        "Original actual202 queued request preserved; not dispatched again.",
    };
  }
  report.checks.push(
    "Replacement is usable without restart; supported model selected; separate explicitly consented tutor response requested",
  );
  const complete = await requestHint();
  await expect
    .poll(async () => (await get("tutor/" + complete.id)).status, {
      timeout: 25000,
    })
    .toBe("complete");
  const saved = await get("library/" + complete.id);
  await page
    .getByRole("link", { name: "Open saved lesson →", exact: true })
    .click();
  await expect(page.locator(".lesson-content")).toBeVisible();
  const text = await page.locator(".lesson-content").innerText();
  await capture("saved-controlled-stream-dark");
  await page
    .getByRole("button", { name: "Toggle light and dark theme", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  assert.equal(await page.locator(".lesson-content").innerText(), text);
  await capture("saved-controlled-stream-light");
  const calls = JSON.parse(
    readFileSync(
      "docs/release-evidence/frontend-final-provider-metrics.json",
      "utf8",
    ),
  ).streamCalls;
  await page.reload();
  await expect(page.locator(".lesson-content")).toBeVisible();
  assert.equal((await get("library/" + complete.id)).markdown, saved.markdown);
  assert.equal(
    JSON.parse(
      readFileSync(
        "docs/release-evidence/frontend-final-provider-metrics.json",
        "utf8",
      ),
    ).streamCalls,
    calls,
  );
  report.checks.push({
    name: "Complete normal stream saves/reopens across themes without inference",
    id: complete.id,
    markdownHash: hash(saved.markdown),
  });
  const canceled = await requestHint();
  await page
    .getByRole("button", { name: "Cancel response", exact: true })
    .click();
  await expect
    .poll(async () => (await get("tutor/" + canceled.id)).status)
    .toBe("canceled");
  const partial = await get("library/" + canceled.id);
  assert.ok(partial.markdown.length > 0);
  report.checks.push({
    name: "Actual cancellation keeps truthful saved partial",
    id: canceled.id,
    bytes: Buffer.byteLength(partial.markdown),
  });
  const interrupted = await requestHint();
  const before = await get("tutor/" + interrupted.id);
  const beforeCalls = JSON.parse(
    readFileSync(
      "docs/release-evidence/frontend-final-provider-metrics.json",
      "utf8",
    ),
  ).streamCalls;
  writeFileSync(
    resolve(dir, "pre-restart-state.json"),
    JSON.stringify(
      {
        completed: {
          id: saved.id,
          status: saved.status,
          markdownHash: hash(saved.markdown),
          bytes: Buffer.byteLength(saved.markdown),
        },
        canceled: {
          id: partial.id,
          status: partial.status,
          markdownHash: hash(partial.markdown),
          bytes: Buffer.byteLength(partial.markdown),
        },
        interruptedPrefix: {
          id: before.id,
          status: before.status,
          markdownHash: hash(before.markdown),
          bytes: Buffer.byteLength(before.markdown),
        },
        providerCalls: beforeCalls,
      },
      null,
      2,
    ),
  );
  const out = openSync(resolve(dir, "restart-command.stdout.log"), "w"),
    err = openSync(resolve(dir, "restart-command.stderr.log"), "w");
  const helper = spawn(
    "powershell.exe",
    [
      "-NoProfile",
      "-File",
      "tests/frontend/restart-owned-fixture.ps1",
      "-ProofFile",
      "docs/release-evidence/frontend-final-provider-lifecycle.json",
      "-Address",
      base,
    ],
    { stdio: ["ignore", out, err] },
  );
  try {
    const code = await new Promise((done, reject) => {
      const timer = setTimeout(() => {
        helper.kill();
        reject(
          Error(
            "Owned restart helper exceeded20-second observer bound; inspect file-backed lifecycle before any retry.",
          ),
        );
      }, 20000);
      helper.once("exit", (code) => {
        clearTimeout(timer);
        done(code);
      });
      helper.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
    assert.equal(code, 0);
  } finally {
    closeSync(out);
    closeSync(err);
  }
  await expect
    .poll(
      async () => {
        try {
          return (await get("bootstrap")).key.configured;
        } catch {
          return false;
        }
      },
      { timeout: 30000 },
    )
    .toBe(true);
  await page.goto(base + "/library/" + interrupted.id);
  await expect(page.locator(".lesson-content")).toBeVisible();
  const after = await get("library/" + interrupted.id);
  assert.equal(after.status, "interrupted");
  assert.ok(after.markdown.startsWith(before.markdown));
  assert.equal((await get("library/" + complete.id)).status, "complete");
  assert.equal((await get("library/" + complete.id)).markdown, saved.markdown);
  assert.equal((await get("library/" + canceled.id)).status, "canceled");
  assert.equal(
    (await get("library/" + canceled.id)).markdown,
    partial.markdown,
  );
  assert.equal(
    JSON.parse(
      readFileSync(
        "docs/release-evidence/frontend-final-provider-metrics.json",
        "utf8",
      ),
    ).streamCalls,
    beforeCalls,
  );
  await expect(
    page.getByText("Interrupted — partial answer saved.", { exact: false }),
  ).toBeVisible();
  await capture("restart-saved-partial");
  report.checks.push({
    name: "Owned application stop/restart flushes durable prefix, restores encrypted fake key, preserves interrupted status and reopening makes no inference",
    id: interrupted.id,
    beforeHash: hash(before.markdown),
    afterHash: hash(after.markdown),
  });
  const backup = await get("data/export");
  assert.ok(keys.every((k) => !JSON.stringify(backup).includes(k)));
  assert.ok(!JSON.stringify(backup).includes("contextMessages"));
  const browserStorage = await page.evaluate(() =>
    JSON.stringify({
      local: { ...localStorage },
      session: { ...sessionStorage },
    }),
  );
  assert.ok(keys.every((k) => !browserStorage.includes(k)));
  await ai();
  await page.getByRole("button", { name: "Remove key", exact: true }).click();
  await response("settings/key", "DELETE", confirm);
  assert.equal((await get("bootstrap")).key.configured, false);
  await expect(
    page.getByLabel("DeepSeek API key", { exact: true }),
  ).toHaveValue("");
  report.checks.push(
    "Key removal/empty input and full read/backup/browser-storage credential exclusion; only explicit fake test values used",
  );
  assert.equal(report.jobPosts, 0);
  assert.equal(report.errors.length, 0);
  assert.equal(report.external.length, 0);
  assert.equal(report.tutorPosts, 3);
  report.metrics = JSON.parse(
    readFileSync(
      "docs/release-evidence/frontend-final-provider-metrics.json",
      "utf8",
    ),
  );
  report.status = "passed";
} catch (e) {
  report.status = "failed";
  report.failure = { message: e.message, stack: e.stack, url: page.url() };
  await capture("failure-" + Date.now()).catch(() => {});
  console.error(e.stack);
  process.exitCode = 1;
} finally {
  report.harnessHash = hash(readFileSync(new URL(import.meta.url)));
  report.fixtureSourceHash = hash(
    readFileSync("tests/frontend/fixture-final-provider.ts"),
  );
  const assetResponse = await context.request.get(base + "/");
  const html = await assetResponse.text();
  report.servedAssets = [];
  for (const match of html.matchAll(
    /(?:src|href)="(\/assets\/[^\"]+\.(?:js|css))"/g,
  )) {
    const asset = await context.request.get(base + match[1]);
    const body = await asset.body();
    report.servedAssets.push({
      path: match[1],
      bytes: body.length,
      sha256: hash(body),
    });
  }
  writeFileSync(resolve(dir, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(
    JSON.stringify(
      {
        status: report.status,
        checks: report.checks.length,
        generations: report.generations.length,
      },
      null,
      2,
    ),
  );
}
