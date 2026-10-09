import { launchBrowser } from "./browser-runtime.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const dir = resolve("docs/release-evidence/frontend-final-catalogue"),
  report = JSON.parse(readFileSync(resolve(dir, "report.json"), "utf8"));
const browser = await launchBrowser(),
  page = await browser.newPage();
const sheets = [];
for (const theme of ["dark", "light"])
  for (const width of [390, 768, 1366, 1920]) {
    const captures = report.captures.filter((c) =>
      c.name.startsWith(`${theme}-${width}-`),
    );
    const mobile = width === 390,
      columns = mobile ? 6 : 3,
      tileWidth = mobile ? 195 : 450;
    const html = `<!doctype html><meta charset="utf-8"><title>CodeWise2 current ${theme} ${width} preview</title><style>body{margin:0;padding:20px;background:#e9edf4;color:#182034;font:16px system-ui}h1{font-size:22px}p{margin:8px 0 20px}main{display:grid;grid-template-columns:repeat(${columns},${tileWidth}px);gap:14px}figure{margin:0;background:white;padding:6px;border:1px solid #c5ccdc}figcaption{font-size:12px;padding:7px 1px}img{display:block;width:100%;height:auto}a{color:inherit}</style><h1>${theme} · ${width}px · all 11 screens</h1><p>Explicit 243-question draft validation preview. Viewport captures; click each image for the full original. No publication, grading or provider claim.</p><main>${captures.map((c) => `<figure><a href="${pathToFileURL(c.path).href}"><img src="${pathToFileURL(c.path).href}" alt="${c.name}"></a><figcaption>${c.name}</figcaption></figure>`).join("")}</main>`;
    const htmlPath = resolve(dir, `contact-${theme}-${width}.html`),
      pngPath = resolve(dir, `contact-${theme}-${width}.png`);
    writeFileSync(htmlPath, html);
    await page.setViewportSize({
      width: columns * (tileWidth + 14) + 40,
      height: 1000,
    });
    await page.goto(pathToFileURL(htmlPath).href);
    await page.evaluate(() =>
      Promise.all([...document.images].map((i) => i.decode())),
    );
    await page.screenshot({ path: pngPath, fullPage: true });
    sheets.push({
      theme,
      width,
      htmlPath,
      pngPath,
      originals: captures.map((c) => c.path),
    });
  }
writeFileSync(
  resolve(dir, "contact-sheets.json"),
  JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      scope:
        "HTML gallery screenshots of existing original browser viewport captures; no product rerun/image-asset editing",
      sheets,
    },
    null,
    2,
  ),
);
await browser.close();
console.log(
  JSON.stringify(
    sheets.map((s) => s.pngPath),
    null,
    2,
  ),
);
