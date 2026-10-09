import { spawnSync } from "node:child_process";
import {
  readFileSync,
  readdirSync,
  statSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
const suites = {
  backend: {
    command: "npm.cmd run test:backend",
    scopes: [
      "apps/server",
      "packages/contracts",
      "packages/learning-engine",
      "tests/unit",
      "tests/integration",
    ],
  },
  renderer: {
    command: "npm.cmd run test:renderer",
    scopes: ["packages/lesson-renderer", "tests/frontend"],
  },
  security: {
    command: "npm.cmd run test:security",
    scopes: ["apps/server", "packages/contracts", "tests/security"],
  },
  runner: {
    command: "npm.cmd run test:runner",
    scopes: ["packages/judge-adapter", "infra/runner", "tests/runner"],
  },
  content: {
    command: "npm.cmd run test:content",
    scopes: ["content/authoring", "packages/judge-adapter", "tests/content"],
  },
  typecheck: {
    command: "npm.cmd run typecheck",
    scopes: ["apps", "packages", "tests", "scripts"],
  },
  lint: {
    command: "npm.cmd run lint",
    scopes: ["apps", "packages", "tests", "scripts", "eslint.config.js"],
  },
  build: {
    command: "npm.cmd run build",
    scopes: ["apps", "packages", "vite.config.ts"],
  },
  audit: { command: "npm.cmd audit", scopes: [] },
};
const name = process.argv[2],
  suite = suites[name];
if (!suite) {
  console.error("Choose " + Object.keys(suites).join(", "));
  process.exit(2);
}
const root = process.cwd();
const files = new Set(["package.json", "package-lock.json", "tsconfig.json"]);
function walk(path) {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    for (const name of readdirSync(path)) walk(join(path, name));
  } else files.add(relative(root, path).replaceAll("\\", "/"));
}
for (const scope of suite.scopes) walk(join(root, scope));
const hashes = () =>
  Object.fromEntries(
    [...files]
      .sort()
      .map((path) => [
        path,
        createHash("sha256").update(readFileSync(path)).digest("hex"),
      ]),
  );
const before = hashes(),
  startedAt = new Date().toISOString();
const result =
  process.platform === "win32"
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", suite.command], {
        cwd: root,
        encoding: "utf8",
        windowsHide: true,
        maxBuffer: 20000000,
      })
    : spawnSync("sh", ["-c", suite.command.replaceAll("npm.cmd", "npm")], {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 20000000,
      });
const after = hashes(),
  exitCode = result.status ?? 1;
const report = {
  schemaVersion: 1,
  suite: name,
  command: suite.command,
  startedAt,
  finishedAt: new Date().toISOString(),
  exitCode,
  runtime: {
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
  },
  sourceHashes: before,
  sourceChangedDuringCheck: JSON.stringify(before) !== JSON.stringify(after),
  kind: ["runner", "content"].includes(name)
    ? "offline-fixture-suite"
    : "application-check",
};
mkdirSync("docs/release-evidence/checks", { recursive: true });
writeFileSync(
  `docs/release-evidence/checks/${name}.json`,
  JSON.stringify(report, null, 2),
);
writeFileSync(
  `docs/release-evidence/checks/${name}.txt`,
  (result.stdout ?? "") + (result.stderr ?? ""),
);
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
console.log(
  JSON.stringify({
    suite: name,
    exitCode,
    sourceChangedDuringCheck: report.sourceChangedDuringCheck,
    report: `docs/release-evidence/checks/${name}.json`,
  }),
);
process.exit(exitCode);
