import { join, resolve } from "node:path";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";
import { createApp } from "../apps/server/src/app.ts";
import { loadRunnerConfiguration } from "../apps/server/src/runner-config.ts";
const ids = [
  "binary-search-01",
  "binary-search-02",
  "binary-search-03",
  "binary-search-04",
  "trees-01",
  "trees-02",
  "trees-03",
  "trees-04",
];
const loader: any = await import(
  pathToFileURL(resolve("packages/judge-adapter/src/index.mjs")).href
);
const installedData =
  process.env.CODEWISE2_RUNNER_DATA_DIR ??
  join(
    process.env.LOCALAPPDATA ?? join(homedir(), ".local", "share"),
    "CodeWise2",
  );
const configuration = loadRunnerConfiguration(installedData);
if (!configuration.ok)
  throw new Error(
    "Approved runner configuration unavailable; assessment bridge was not launched.",
  );
const adapter = new loader.JudgeAdapter(configuration),
  readiness = await adapter.readiness();
if (
  !readiness.ready ||
  !readiness.controlsVerified ||
  readiness.phaseEventsSupported !== true
)
  throw new Error(
    "Reviewed attested phase protocol unavailable; assessment bridge was not launched.",
  );
const catalogue = await Promise.all(
  ids.map((id) => loader.getPublicProblem(id)),
);
const parent = join(process.cwd(), ".runtime", "assessment-ui");
mkdirSync(parent, { recursive: true });
const dataDir = mkdtempSync(join(parent, "actual-core-"));
const app = createApp({
  dataDir,
  catalogue,
  fixture: true,
  internalFixtureIds: ids,
  judge: {
    ...loader,
    readiness: () => adapter.readiness(),
    judgePack: (request: any) => loader.judgePack({ ...request, adapter }),
  },
});
const port = Number(process.env.PORT ?? 3138);
app.server.listen(port, "127.0.0.1", () => {
  const info = {
    schemaVersion: 1,
    kind: "real-runner-assessment-draft-preview",
    address: `http://127.0.0.1:${port}`,
    pid: process.pid,
    dataDir,
    catalogueIds: ids,
    globalPublicationChanged: false,
    providerInference: false,
    runtimeIdentity: readiness.identityHash,
    phaseEventsSupported: true,
    startedAt: new Date().toISOString(),
    command: "node --import tsx scripts/fixture-assessment-ui.ts",
  };
  writeFileSync(
    "docs/release-evidence/assessment-ui-bridge.json",
    JSON.stringify(info, null, 2),
  );
  console.log(JSON.stringify(info));
});
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    app.close();
    process.exit(0);
  });
