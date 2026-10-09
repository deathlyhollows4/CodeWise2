import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { join } from "node:path";
export const base = process.env.CODEWISE2_QA_URL || "http://127.0.0.1:3120";
const parsed = new URL(base);
if (
  parsed.protocol !== "http:" ||
  !["localhost", "127.0.0.1"].includes(parsed.hostname)
)
  throw new Error(
    "Visual QA requires the explicit local development fixture URL.",
  );
export async function launchBrowser() {
  const candidates = [
    process.env.PLAYWRIGHT_BROWSER_EXECUTABLE,
    process.env.ProgramFiles &&
      join(
        process.env.ProgramFiles,
        "Google",
        "Chrome",
        "Application",
        "chrome.exe",
      ),
    process.env["ProgramFiles(x86)"] &&
      join(
        process.env["ProgramFiles(x86)"],
        "Microsoft",
        "Edge",
        "Application",
        "msedge.exe",
      ),
  ].filter(Boolean);
  const executablePath = candidates.find((path) => existsSync(path));
  return chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
}
