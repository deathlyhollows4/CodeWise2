import { join } from "node:path";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { loadRunnerConfiguration } from "../apps/server/src/runner-config.ts";
const dataDir =
  process.env.CODEWISE2_RUNNER_DATA_DIR ??
  process.env.CODEWISE2_DATA_DIR ??
  join(
    process.env.LOCALAPPDATA ?? join(homedir(), ".local", "share"),
    "CodeWise2",
  );
const configuration = loadRunnerConfiguration(dataDir);
let readiness;
if (!configuration.ok)
  readiness = {
    ready: false,
    controlsVerified: false,
    phaseEventsSupported: false,
    message: configuration.message,
  };
else {
  const loader: any = await import(
    pathToFileURL(resolve("packages/judge-adapter/src/index.mjs")).href
  );
  try {
    readiness = await new loader.JudgeAdapter(configuration).readiness();
  } catch {
    readiness = {
      ready: false,
      controlsVerified: false,
      message: "The configured local runner could not be reached.",
    };
  }
}
console.log(
  JSON.stringify(
    {
      kind: "read-only-runner-diagnostics",
      node: process.version,
      platform: process.platform,
      architecture: process.arch,
      ready: readiness.ready,
      controlsVerified: readiness.controlsVerified === true,
      phaseEventsSupported: readiness.phaseEventsSupported === true,
      runtimeIdentity: readiness.identityHash ?? null,
      languages: readiness.languages ?? [],
      message: readiness.message ?? null,
      programExecutions: 0,
      policyChanges: 0,
    },
    null,
    2,
  ),
);
if (!readiness.ready) process.exitCode = 1;
