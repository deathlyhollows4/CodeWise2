import { launchBrowser, base } from "./browser-runtime.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const output = resolve("docs/release-evidence/frontend-visual/after");
mkdirSync(output, { recursive: true });
const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
await page.goto(base);
if (
  await page.getByRole("button", { name: "Start from the beginning" }).count()
)
  await page.getByRole("button", { name: "Start from the beginning" }).click();
await page.waitForSelector(".fixture-banner");
const findings = [];
for (const [theme, width, name, path] of [
  ["dark", 1920, "roadmap", "/roadmap"],
  ["dark", 1366, "workspace", "/problems/fixture-running-total"],
  ["light", 390, "settings", "/settings"],
  ["dark", 390, "home", "/"],
]) {
  await page.evaluate(async (theme) => {
    const b = await fetch("/api/bootstrap").then((r) => r.json());
    await fetch("/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": b.csrfToken,
      },
      body: JSON.stringify({ theme }),
    });
  }, theme);
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(base + path);
  await page.waitForSelector(".fixture-banner");
  if (name === "roadmap") {
    await page.getByRole("button", { name: "Fit roadmap" }).click();
    const contained = await page.evaluate(() => {
      const r = document
        .querySelector(".roadmap-viewport")
        .getBoundingClientRect();
      return [...document.querySelectorAll(".topic-node")].every((n) => {
        const b = n.getBoundingClientRect();
        return (
          b.left >= r.left &&
          b.right <= r.right &&
          b.top >= r.top &&
          b.bottom <= r.bottom
        );
      });
    });
    findings.push({
      name,
      contained,
      count: await page.locator(".topic-node").count(),
    });
  }
  if (name === "workspace") {
    await page.waitForSelector(".monaco-editor");
    await page.getByRole("button", { name: "Reset draft to starter" }).click();
    await page.getByRole("dialog").waitFor();
    await page.keyboard.press("Tab");
    const first = await page.evaluate(
      () => document.activeElement?.textContent,
    );
    await page.keyboard.press("Tab");
    const second = await page.evaluate(
      () => document.activeElement?.textContent,
    );
    await page.keyboard.press("Escape");
    findings.push({
      name,
      dialog: {
        first,
        second,
        closed: (await page.getByRole("dialog").count()) === 0,
      },
    });
  }
  if (name === "settings")
    findings.push({
      name,
      diagnosticsVisible: await page
        .getByRole("button", { name: "Diagnostics", exact: true })
        .isVisible(),
      dataVisible: await page
        .getByRole("button", { name: "Data", exact: true })
        .isVisible(),
    });
  await page.screenshot({
    path: resolve(output, `${theme}-${width}-${name}.png`),
    fullPage: true,
  });
  findings.push({
    name,
    width,
    overflow: await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    ),
  });
}
await page.goto(base + "/problems/fixture-running-total");
await page.setViewportSize({ width: 1366, height: 900 });
await page.waitForSelector(".monaco-editor");
await page.getByRole("button", { name: "Run", exact: true }).click();
await page.getByText("Infrastructure error", { exact: true }).waitFor();
await page.screenshot({
  path: resolve(output, "unavailable-result.png"),
  fullPage: true,
});
findings.push({ name: "runner unavailable", visible: true });
writeFileSync(
  resolve(output, "report.json"),
  JSON.stringify(
    { timestamp: new Date().toISOString(), fixture: true, findings },
    null,
    2,
  ),
);
await browser.close();
console.log(JSON.stringify(findings, null, 2));
if (
  findings.some(
    (f) =>
      f.overflow ||
      f.contained === false ||
      (f.count !== undefined && f.count !== 18) ||
      f.dataVisible === false ||
      f.diagnosticsVisible === false ||
      (f.dialog &&
        (!f.dialog.closed ||
          f.dialog.first !== "Reset draft" ||
          f.dialog.second !== "Cancel")) ||
      (f.name === "runner unavailable" && !f.visible),
  )
)
  throw new Error("Focused visual repair assertions failed; see saved report.");
