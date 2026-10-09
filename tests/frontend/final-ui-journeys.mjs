import { launchBrowser, base } from "./browser-runtime.mjs";
import { expect } from "playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const dir = resolve("docs/release-evidence/frontend-final-ui-journeys");
mkdirSync(dir, { recursive: true });
const hash = (v) => createHash("sha256").update(v).digest("hex");
const browser = await launchBrowser(),
  context = await browser.newContext({
    viewport: { width: 1366, height: 1000 },
  }),
  page = await context.newPage();
const report = {
  timestamp: new Date().toISOString(),
  status: "running",
  scope:
    "Actual isolated preview UI backup/restore, exports, notes/bookmarks, draft association and persisted adversarial renderer. No provider/grade/native/publication claim.",
  checks: [],
  captures: [],
  errors: [],
  external: [],
  requests: [],
  assets: [],
};
const observers = [];
let original,
  csrf,
  baselinePath,
  baseline,
  restored = false;
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("request", (r) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(r.method()))
    report.requests.push({
      method: r.method(),
      path: new URL(r.url()).pathname,
    });
});
page.on("response", (r) => {
  if (/\/assets\/.*\.(css|js)$/.test(r.url()))
    observers.push(
      r
        .body()
        .then((body) => {
          if (!report.assets.some((a) => a.url === r.url()))
            report.assets.push({
              url: r.url(),
              sha256: hash(body),
              bytes: body.length,
            });
        })
        .catch((e) => report.errors.push("asset observer: " + e.message)),
    );
});
await page.route("**/*", async (route) => {
  const url = route.request().url();
  if (
    !url.startsWith(base) &&
    !url.startsWith("data:") &&
    !url.startsWith("blob:")
  ) {
    report.external.push(url);
    await route.abort();
  } else await route.continue();
});
await page.addInitScript(() => {
  window.__fixtureCopyMode = "success";
  navigator.clipboard.writeText = async (text) => {
    if (window.__fixtureCopyMode === "reject")
      throw Error("Explicit fixture clipboard denial");
    window.__fixtureCopied = text;
  };
});
const get = async (path) => {
  const r = await context.request.get(base + "/api/" + path);
  assert.equal(r.status(), 200, path);
  return r.json();
};
const prefs = async (values) => {
  const r = await context.request.put(base + "/api/settings", {
    headers: { Origin: base, "X-CSRF-Token": csrf },
    data: values,
  });
  assert.equal(r.status(), 200);
};
async function settingsData() {
  await page.goto(base + "/settings");
  await page.getByRole("button", { name: "Data", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Export learning backup", exact: true }),
  ).toBeVisible();
}
async function download(button, name) {
  const pending = page.waitForEvent("download");
  await button.click();
  const result = await pending,
    path = resolve(dir, name);
  await result.saveAs(path);
  return {
    path,
    text: readFileSync(path, "utf8"),
    filename: result.suggestedFilename(),
  };
}
async function importBackup(path) {
  await settingsData();
  await page.locator("#backup-import").setInputFiles(path);
  await expect(
    page.getByRole("button", { name: "Restore this backup", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Restore this backup", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("button", { name: "Confirm", exact: true }),
  ).toBeDisabled();
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
  await expect(dialog).not.toBeVisible();
  await page.waitForLoadState("networkidle");
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
    name + " overflow",
  );
}
try {
  const b = await get("bootstrap");
  assert.equal(b.fixture, true);
  assert.equal(b.catalogue.preview, 243);
  assert.equal(b.key.configured, false);
  assert.equal(b.runner.ready, false);
  original = b.preferences;
  csrf = b.csrfToken;
  await prefs({
    onboarded: true,
    theme: "dark",
    language: "python",
    autoExplain: false,
  });
  const initialProgress = await get("progress");
  assert.deepEqual(initialProgress.evidence, []);
  const list = await get("library?pageSize=100"),
    lesson = list.items.find(
      (l) => l.status === "interrupted" && /interrupted long/.test(l.title),
    );
  assert.ok(lesson);
  await page.goto(base + "/library/" + lesson.id);
  await expect(page.locator(".lesson-content")).toBeVisible();
  const detail = await get("library/" + lesson.id);
  const note =
    "Fixture UI backup association — Ω🙂 — " + new Date().toISOString();
  await page.getByLabel("Personal lesson notes", { exact: true }).fill(note);
  await page.getByRole("button", { name: "Save notes", exact: true }).click();
  await expect(
    page.getByText("Saved on this device", { exact: true }),
  ).toBeVisible();
  assert.equal((await get("library/" + lesson.id)).notes, note);
  const pin = page.getByRole("button", {
    name: detail.bookmarked ? "Pinned" : "Pin lesson",
    exact: true,
  });
  await pin.click();
  await expect(
    page.getByRole("button", {
      name: detail.bookmarked ? "Pin lesson" : "Pinned",
      exact: true,
    }),
  ).toBeVisible();
  assert.equal(
    (await get("library/" + lesson.id)).bookmarked,
    !detail.bookmarked,
  );
  const md = await download(
    page.getByRole("button", { name: "Markdown", exact: true }),
    "partial-answer-export.md",
  );
  assert.equal(md.text, detail.markdown);
  const json = await download(
    page.getByRole("button", { name: "JSON", exact: true }),
    "partial-answer-export.json",
  );
  assert.equal(JSON.parse(json.text).markdown, detail.markdown);
  report.checks.push({
    name: "Complete interrupted Markdown/JSON exports",
    markdownBytes: Buffer.byteLength(md.text),
    sha256: hash(md.text),
  });
  await page.goto(base + "/problems/arrays-hashing-03");
  await expect(page.locator(".monaco-editor")).toBeVisible();
  const draftText = "# Explicit no-execution UI backup fixture Ω";
  await page.locator(".monaco-editor .view-lines").click();
  await page.keyboard.press("Control+a");
  await page.keyboard.insertText(draftText);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Settings", exact: true })
    .click();
  await expect(page).toHaveURL(base + "/settings");
  assert.equal((await get("drafts/arrays-hashing-03/python")).code, draftText);
  report.checks.push({
    name: "Actual edited Python draft flushed by navigation",
    problemId: "arrays-hashing-03",
    sha256: hash(draftText),
  });
  await page.getByRole("button", { name: "Data", exact: true }).click();
  const saved = await download(
    page.getByRole("button", { name: "Export learning backup", exact: true }),
    "baseline-backup.json",
  );
  baselinePath = saved.path;
  baseline = JSON.parse(saved.text);
  assert.equal(
    baseline.generations.find((l) => l.id === lesson.id).notes,
    note,
  );
  assert.equal(
    baseline.drafts.find(
      (d) => d.problem === "arrays-hashing-03" && d.language === "python",
    ).code,
    draftText,
  );
  assert.equal(Object.hasOwn(baseline, "secrets"), false);
  assert.equal(JSON.stringify(baseline).includes("contextMessages"), false);
  report.checks.push({
    name: "UI backup contains draft/lesson notes/bookmark/version associations, excludes private context/secrets",
    bytes: Buffer.byteLength(saved.text),
    generationCount: baseline.generations.length,
    sha256: hash(saved.text),
  });
  const invalid = resolve(dir, "invalid-backup.json");
  writeFileSync(invalid, '{"schemaVersion":999}');
  await page.locator("#backup-import").setInputFiles(invalid);
  await expect(page.locator('[role="alert"]').first()).toBeVisible();
  assert.equal((await get("library?pageSize=100")).total, list.total);
  report.checks.push({ name: "Invalid UI import rejects before mutation" });
  const malicious = structuredClone(baseline),
    record = malicious.generations.find((g) => g.id === lesson.id),
    code =
      Array.from(
        { length: 55 },
        (_, i) => `# Entire fixture line ${i} Ω🙂`,
      ).join("\n") +
      "\n" +
      "long_token_".repeat(2500);
  const markdown =
    '# Explicit adversarial browser fixture\n\nThis is local test content, not a provider answer.\n\n<script>window.__rendererExecuted=true</script>\n<img src="https://example.invalid/raw" onerror="window.__rendererExecuted=true">\n\n![External fixture](https://example.invalid/markdown-image)\n\n[unsafe](javascript:window.__rendererExecuted=true) [encoded](java%73cript:window.__rendererExecuted=true)\n\n$\\href{javascript:alert(1)}{unsafe math}$\n\n| Index | Value |\n|---|---|\n' +
    Array.from({ length: 100 }, (_, i) => `| ${i} | ${i * i} |`).join("\n") +
    "\n\n```python\n" +
    code;
  record.markdown = markdown;
  record.title = "Explicit adversarial saved renderer fixture";
  record.document = {
    ...record.document,
    title: record.title,
    markdown,
    sections: [{ id: "adversarial", kind: "general", markdown }],
  };
  const attackPath = resolve(dir, "adversarial-backup.json");
  writeFileSync(attackPath, JSON.stringify(malicious));
  await importBackup(attackPath);
  restored = false;
  await page.goto(base + "/library/" + lesson.id);
  await expect(page.locator(".lesson-content")).toBeVisible();
  await expect(
    page.getByText("[External image omitted]", { exact: true }),
  ).toBeVisible();
  assert.equal(await page.evaluate(() => window.__rendererExecuted), undefined);
  assert.equal(
    await page.locator(".lesson-content img,.lesson-content script").count(),
    0,
  );
  assert.equal(
    await page
      .locator(".lesson-content a")
      .evaluateAll((nodes) =>
        nodes.some((a) =>
          /javascript:|data:|vbscript:/i.test(a.getAttribute("href") || ""),
        ),
      ),
    false,
  );
  await expect(page.locator(".lesson-content tbody tr")).toHaveCount(100);
  const block = page.locator(".lesson-code").last();
  await block
    .getByRole("button", { name: "Show complete code", exact: true })
    .click();
  await expect(
    block.getByRole("button", { name: "Collapse code", exact: true }),
  ).toBeVisible();
  const renderedCode = await block.locator("pre").innerText();
  assert.equal(renderedCode.trimEnd(), code);
  await page.evaluate(() => (window.__fixtureCopyMode = "reject"));
  await block.getByRole("button", { name: "Copy code", exact: true }).click();
  await expect(
    block.getByText(
      "Clipboard access failed. Select the code text to copy it.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.evaluate(() => (window.__fixtureCopyMode = "success"));
  await block.getByRole("button", { name: "Copy code", exact: true }).click();
  await expect(
    block.getByRole("button", { name: "Copied", exact: true }),
  ).toBeVisible();
  assert.equal(
    (await page.evaluate(() => window.__fixtureCopied)).trimEnd(),
    code,
  );
  report.checks.push({
    name: "Persisted malicious/rawHTML/image/unsafe-link/math/100-row table/partial55-line fence/long token contained; complete copy+clipboard rejection recovery",
    markdownBytes: Buffer.byteLength(markdown),
    codeBytes: Buffer.byteLength(code),
    clipboard: "Explicit test stub; not OS clipboard availability proof",
  });
  await capture("adversarial-code-1366-dark");
  await page.setViewportSize({ width: 390, height: 844 });
  await block.scrollIntoViewIfNeeded();
  await capture("adversarial-code-390-dark");
  const attackExport = await download(
    page.getByRole("button", { name: "Markdown", exact: true }),
    "adversarial-answer-export.md",
  );
  assert.equal(attackExport.text, markdown);
  await page.reload();
  await expect(page.locator(".lesson-content")).toBeVisible();
  assert.equal((await get("library/" + lesson.id)).markdown, markdown);
  report.checks.push({
    name: "Large malicious fixture remains complete in export/reload without inference",
  });
  await page.setViewportSize({ width: 1366, height: 1000 });
  await importBackup(baselinePath);
  restored = true;
  const restoredLesson = await get("library/" + lesson.id);
  assert.equal(restoredLesson.markdown, detail.markdown);
  assert.equal(restoredLesson.notes, note);
  assert.equal(restoredLesson.bookmarked, !detail.bookmarked);
  assert.equal((await get("drafts/arrays-hashing-03/python")).code, draftText);
  assert.deepEqual((await get("progress")).evidence, []);
  assert.equal((await get("bootstrap")).key.configured, false);
  report.checks.push({
    name: "Confirmed UI restore preserves full lesson/draft/notes/bookmark associations and no key/evidence",
  });
  await Promise.all(observers);
  assert.equal(report.errors.length, 0);
  assert.equal(report.external.length, 0);
  assert.equal(
    report.requests.filter((r) => /^\/api\/(jobs|tutor)(?:\/|$)/.test(r.path))
      .length,
    0,
  );
  report.status = "passed";
} catch (e) {
  report.status = "failed";
  report.failure = { message: e.message, stack: e.stack, url: page.url() };
  await capture("failure-" + Date.now()).catch(() => {});
  console.error(e.stack);
  process.exitCode = 1;
} finally {
  if (baselinePath && !restored && csrf) {
    try {
      await page.setViewportSize({ width: 1366, height: 1000 });
      await importBackup(baselinePath);
      report.baselineRecovery = "restored by normal UI";
    } catch (e) {
      report.baselineRecovery = "failed: " + e.message;
      process.exitCode = 1;
    }
  }
  if (original)
    await prefs({
      onboarded: original.onboarded,
      theme: original.theme,
      language: original.language,
      autoExplain: original.autoExplain,
    }).catch((e) => {
      report.errors.push("Preference recovery: " + e.message);
      process.exitCode = 1;
    });
  await Promise.all(observers);
  writeFileSync(resolve(dir, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(
    JSON.stringify(
      {
        status: report.status,
        checks: report.checks.length,
        captures: report.captures.length,
      },
      null,
      2,
    ),
  );
}
