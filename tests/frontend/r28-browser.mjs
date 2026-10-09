import { launchBrowser, base } from "./browser-runtime.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const output = resolve("docs/release-evidence/frontend-r28");
mkdirSync(output, { recursive: true });
const browser = await launchBrowser(),
  context = await browser.newContext({
    viewport: { width: 1366, height: 1000 },
  }),
  page = await context.newPage();
const report = {
  timestamp: new Date().toISOString(),
  scope:
    "Real local app/POST/provider fixture/SQLite/SSE; no live external provider",
  fixture: true,
  events: [],
  checks: [],
  errors: [],
  externalRequests: [],
  captures: [],
  generationId: null,
  generationRequests: 0,
};
const hash = (text) => createHash("sha256").update(text).digest("hex");
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("request", (r) => {
  if (r.method() === "POST" && new URL(r.url()).pathname === "/api/tutor")
    report.generationRequests++;
  if (
    !r.url().startsWith(base) &&
    !r.url().startsWith("blob:") &&
    !r.url().startsWith("data:")
  )
    report.externalRequests.push(r.url());
});
const cdp = await context.newCDPSession(page);
await cdp.send("Network.enable");
cdp.on("Network.eventSourceMessageReceived", (event) => {
  try {
    report.events.push({ id: event.eventId, ...JSON.parse(event.data) });
  } catch {
    report.errors.push("Malformed actual SSE payload");
  }
});
let delayed = false;
await page.route("**/api/tutor/*/events?after=0", async (route) => {
  if (!delayed) {
    delayed = true;
    const id = new URL(route.request().url()).pathname.split("/")[3];
    const deadline = Date.now() + 45000;
    while (Date.now() < deadline) {
      const saved = await (
        await context.request.get(base + "/api/tutor/" + id)
      ).json();
      if (saved.markdown?.includes("Fixture paragraph 135:")) break;
      await new Promise((r) => setTimeout(r, 150));
    }
  }
  await route.continue();
});
try {
  await page.goto(base + "/problems/fixture-running-total");
  await page.locator(".fixture-banner").waitFor();
  const bootstrap = await (
    await context.request.get(base + "/api/bootstrap")
  ).json();
  assert.equal(bootstrap.fixture, true);
  assert.equal(
    bootstrap.key.status,
    "fixture",
    "Only the explicitly controlled local fixture may be exercised",
  );
  assert.equal(bootstrap.preferences.model, "fixture-controlled-stream");
  const html = await (await context.request.get(base + "/")).text();
  report.buildIdentity = { htmlSha256: hash(html), assets: [] };
  for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)) {
    const response = await context.request.get(base + match[1]);
    report.buildIdentity.assets.push({
      path: match[1],
      sha256: hash(await response.body()),
    });
  }
  await page.getByRole("button", { name: "Tutor", exact: true }).click();
  await page
    .getByRole("button", { name: "Give me a hint", exact: true })
    .click();
  await page.getByRole("dialog").waitFor();
  const post = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/tutor" &&
      r.request().method() === "POST",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Send request", exact: true })
    .click();
  const generation = await (await post).json();
  report.generationId = generation.id;
  assert.ok(generation.id);
  await page
    .getByRole("link", { name: "Open saved lesson →", exact: true })
    .waitFor();
  report.cancelVisibleDuringStreaming = await page
    .getByRole("button", { name: "Cancel response", exact: true })
    .isVisible();
  await page
    .locator(".tutor-drawer .lesson-content p")
    .filter({ hasText: /^Fixture paragraph 150:/ })
    .waitFor({ timeout: 35000 });
  await page
    .locator(".tutor-drawer")
    .getByText("Stored on this device", { exact: true })
    .waitFor();
  const saved = await (
    await context.request.get(base + "/api/tutor/" + generation.id)
  ).json();
  assert.equal(saved.status, "complete");
  let assembled = "";
  for (const event of report.events) {
    if (event.type === "snapshot") assembled = event.text;
    else if (event.markdown !== undefined) assembled = event.markdown;
    else if (event.type === "chunk") assembled += event.text;
  }
  assert.equal(
    assembled,
    saved.markdown,
    "Actual saved stream snapshot plus subsequent durable chunks equals SQLite markdown",
  );
  const snapshot = report.events.find((e) => e.type === "snapshot");
  assert.ok(snapshot);
  assert.ok(
    Number(snapshot.seq) > 128,
    "Delayed real connection has expired retained cursor",
  );
  assert.ok(
    report.events.some((e) => e.type === "chunk"),
    "New durable chunks append after snapshot",
  );
  const live = page.locator(".tutor-drawer .lesson-content");
  assert.equal(
    await live
      .locator("p")
      .filter({ hasText: /^Fixture paragraph / })
      .count(),
    150,
  );
  const liveText = await live.innerText();
  assert.equal((liveText.match(/Fixture paragraph 1:/g) || []).length, 1);
  assert.equal((liveText.match(/Fixture paragraph 150:/g) || []).length, 1);
  report.checks.push({
    flow: "Expired-cursor snapshot replaces history, following chunks append, live output has no duplication",
    passed: true,
    seq: snapshot.seq,
  });
  report.savedMarkdown = {
    sha256: hash(saved.markdown),
    characters: saved.markdown.length,
    status: saved.status,
    provider: saved.provider,
  };
  await page.locator(".tutor-drawer").scrollIntoViewIfNeeded();
  const livePath = resolve(output, "live-final-1366.png");
  await page.screenshot({ path: livePath });
  report.captures.push(livePath);
  const secondPost = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/tutor" &&
      r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Give me a hint", exact: true })
    .click();
  const second = await (await secondPost).json();
  report.canceledGenerationId = second.id;
  await page
    .locator(".tutor-drawer .lesson-content p")
    .filter({ hasText: /^Fixture paragraph 3:/ })
    .waitFor();
  await page
    .getByRole("button", { name: "Cancel response", exact: true })
    .click();
  await page
    .locator(".tutor-drawer")
    .getByText("Canceled", { exact: true })
    .waitFor();
  const canceled = await (
    await context.request.get(base + "/api/tutor/" + second.id)
  ).json();
  assert.equal(canceled.status, "canceled");
  assert.ok(canceled.markdown.includes("Fixture paragraph 3:"));
  assert.ok(!canceled.markdown.includes("Fixture paragraph 150:"));
  const canceledLive = await page
    .locator(".tutor-drawer .lesson-content")
    .innerText();
  report.canceledPartial = {
    characters: canceled.markdown.length,
    sha256: hash(canceled.markdown),
    status: canceled.status,
  };
  await page.goto(base + "/library/" + second.id);
  await page
    .locator(".lesson-reading .lesson-content p")
    .filter({ hasText: /^Fixture paragraph 3:/ })
    .waitFor();
  assert.equal(
    await page.locator(".lesson-reading .lesson-content").innerText(),
    canceledLive,
  );
  await page.reload();
  await page
    .locator(".lesson-reading .lesson-content p")
    .filter({ hasText: /^Fixture paragraph 3:/ })
    .waitFor();
  assert.equal(
    await page.locator(".lesson-reading .lesson-content").innerText(),
    canceledLive,
  );
  assert.equal(
    report.generationRequests,
    2,
    "Reopening cancelled partial never starts another generation",
  );
  report.checks.push({
    flow: "Cancel visible active response, flush saved partial, reopen/reload exact output with zero new inference",
    passed: true,
  });
  const cancelPath = resolve(output, "canceled-partial-1366.png");
  await page.screenshot({ path: cancelPath });
  report.captures.push(cancelPath);
  await page.goto(base + "/library/" + generation.id);
  await page.locator(".fixture-banner").waitFor();
  await page
    .locator(".lesson-reading .lesson-content p")
    .filter({ hasText: /^Fixture paragraph 150:/ })
    .waitFor();
  const savedText = await page
    .locator(".lesson-reading .lesson-content")
    .innerText();
  assert.equal(
    savedText,
    liveText,
    "Saved and live renderer text match exactly",
  );
  await page.reload();
  await page
    .locator(".lesson-reading .lesson-content p")
    .filter({ hasText: /^Fixture paragraph 150:/ })
    .waitFor();
  assert.equal(
    await page.locator(".lesson-reading .lesson-content").innerText(),
    liveText,
  );
  report.checks.push({
    flow: "Saved lesson and reload preserve exact rendered text without a second generation request",
    passed: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page
    .locator(".lesson-reading .lesson-content p")
    .filter({ hasText: /^Fixture paragraph 150:/ })
    .waitFor();
  const savedPath = resolve(output, "saved-reopen-390.png");
  await page.screenshot({ path: savedPath });
  report.captures.push(savedPath);
  assert.equal(report.errors.length, 0);
  assert.equal(report.externalRequests.length, 0);
  assert.equal(
    report.cancelVisibleDuringStreaming,
    true,
    "Active response must retain a visible cancel control",
  );
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.failure = error.stack;
  const path = resolve(output, "failure-" + Date.now() + ".png");
  await page.screenshot({ path }).catch(() => {});
  report.captures.push(path);
  report.failureUrl = page.url();
  process.exitCode = 1;
}
writeFileSync(resolve(output, "report.json"), JSON.stringify(report, null, 2));
await browser.close();
console.log(
  JSON.stringify(
    { status: report.status, checks: report.checks, failure: report.failure },
    null,
    2,
  ),
);
