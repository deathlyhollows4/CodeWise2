import { createApp } from "../../apps/server/src/app.ts";
import { ProviderError } from "../../apps/server/src/deepseek.ts";
import { loadRunnerConfiguration } from "../../apps/server/src/runner-config.ts";
import { join, resolve } from "node:path";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
const hash = (v: string) => createHash("sha256").update(v).digest("hex");
const grading = process.env.CODEWISE2_FINAL_JOURNEY_GRADING === "1";
const root = resolve(".runtime/final-provider-ui");
mkdirSync(root, { recursive: true });
const dataDir =
  process.env.CODEWISE2_FIXTURE_DATA_DIR ??
  mkdtempSync(join(root, "controlled-"));
const relative = resolve(dataDir).slice(resolve(".runtime").length);
if (
  !resolve(dataDir).startsWith(resolve(".runtime")) ||
  !/^[/\\]/.test(relative)
)
  throw Error("Use an isolated workspace .runtime profile.");
mkdirSync(dataDir, { recursive: true });
const loader: any = await import(
  pathToFileURL(resolve("packages/judge-adapter/src/index.mjs")).href
);
const snapshotPath = join(dataDir, "fixture-public-snapshot.json");
let catalogue: any[] =
  existsSync(snapshotPath) && !grading
    ? JSON.parse(readFileSync(snapshotPath, "utf8"))
    : await loader.loadCatalogue({ includeDrafts: !grading });
if (catalogue.length !== 243)
  throw Error(
    "This fixture requires the amended243 real slots; no fake publication is permitted.",
  );
let judge: any;
if (grading) {
  if (catalogue.some((p) => p.status !== "published"))
    throw Error("All243 real published packs are required before grading.");
  if (
    existsSync(snapshotPath) &&
    hash(JSON.stringify(catalogue)) !== hash(readFileSync(snapshotPath, "utf8"))
  )
    throw Error("Published snapshot changed during the reserved journey.");
  const installed =
    process.env.CODEWISE2_RUNNER_DATA_DIR ??
    join(
      process.env.LOCALAPPDATA ?? join(homedir(), ".local", "share"),
      "CodeWise2",
    );
  const config = loadRunnerConfiguration(installed);
  if (!config.ok) throw Error("Approved real runner configuration required.");
  const adapter = new loader.JudgeAdapter(config),
    readiness = await adapter.readiness();
  if (
    !readiness.ready ||
    !readiness.controlsVerified ||
    readiness.phaseEventsSupported !== true
  )
    throw Error("Current attested real runner phase readiness required.");
  judge = {
    ...loader,
    readiness: () => adapter.readiness(),
    judgePack: (request: any) => loader.judgePack({ ...request, adapter }),
  };
} else if (process.env.CODEWISE2_FIXTURE_INPUT_VALIDATION === "1") {
  judge = {
    readiness: async () => ({
      ready: false,
      controlsVerified: false,
      languages: [],
      message:
        "Explicit controlled UI fixture: no code execution is configured.",
    }),
    validateCustomInput: loader.validateCustomInput,
  };
}
if (!existsSync(snapshotPath))
  writeFileSync(snapshotPath, JSON.stringify(catalogue));
const evidencePrefix =
  process.env.CODEWISE2_FIXTURE_EVIDENCE_PREFIX ??
  (grading ? "frontend-final-native" : "frontend-final-provider");
if (!/^frontend-[a-z0-9-]+$/.test(evidencePrefix))
  throw Error("Use a safe test evidence filename prefix.");
const metricsPath = resolve(
  `docs/release-evidence/${evidencePrefix}-metrics.json`,
);
const previous = existsSync(metricsPath)
  ? JSON.parse(readFileSync(metricsPath, "utf8"))
  : null;
const metrics =
  previous?.dataDir === dataDir
    ? previous
    : {
        schemaVersion: 1,
        dataDir,
        modelListings: 0,
        streamCalls: 0,
        externalRequests: 0,
        startedAt: new Date().toISOString(),
      };
const record = () =>
  writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
record();
const provider: any = {
  models: async (key: string) => {
    metrics.modelListings++;
    record();
    if (key.includes("denied"))
      throw new ProviderError(
        "INVALID_KEY",
        "Explicit local fixture rejected the test candidate.",
      );
    if (key.includes("offline"))
      throw new ProviderError(
        "UNREACHABLE",
        "Explicit local fixture simulates an unavailable provider.",
      );
    if (!key.startsWith("fixture-only-no-real-credential-"))
      throw new ProviderError(
        "INVALID_KEY",
        "Only explicit fake fixture credentials are accepted.",
      );
    return ["fixture-controlled-local"];
  },
  stream: async (
    key: string,
    _model: string,
    _messages: unknown,
    limit: number,
    signal: AbortSignal,
    onChunk: (text: string) => void,
  ) => {
    if (!key.startsWith("fixture-only-no-real-credential-"))
      throw new ProviderError(
        "INVALID_KEY",
        "Only explicit fake fixture credentials are accepted.",
      );
    metrics.streamCalls++;
    record();
    onChunk(
      "# Controlled local provider fixture\n\nNo external AI provider was contacted. This output exercises the application only.\n\n",
    );
    const chunks = Math.min(40, Math.max(4, Math.floor(limit / 16)));
    for (let i = 1; i <= chunks; i++) {
      if (
        evidencePrefix === "frontend-live-scroll" &&
        process.env.CODEWISE2_FIXTURE_STREAM_GATES === "1" &&
        [17, 18, 40].includes(i)
      ) {
        const gate = join(dataDir, "r55-gates", `allow-${i}`),
          deadline = Date.now() + 90000;
        while (!existsSync(gate)) {
          if (signal.aborted) throw Error("Controlled fixture aborted");
          if (Date.now() > deadline)
            throw Error("R55 controlled gate exceeded90seconds");
          await new Promise((done) => setTimeout(done, 50));
        }
      }
      await new Promise<void>((done, reject) => {
        const timer = setTimeout(() => {
          signal.removeEventListener("abort", abort);
          done();
        }, 350);
        const abort = () => {
          clearTimeout(timer);
          reject(Error("Controlled fixture aborted"));
        };
        signal.addEventListener("abort", abort, { once: true });
        if (signal.aborted) abort();
      });
      if (signal.aborted) throw Error("Controlled fixture aborted");
      onChunk(
        `Local fixture checkpoint ${i}. Preserve complete saved text.\n\n`,
      );
    }
    return { finishReason: "stop" };
  },
};
const app = createApp({
  dataDir,
  catalogue,
  fixture: true,
  internalFixtureIds: grading ? [] : catalogue.map((p) => p.id),
  provider,
  judge,
  onStop: () => {
    app.close();
    process.exit(0);
  },
});
const port = Number(process.env.PORT ?? 3191);
app.server.listen(port, "127.0.0.1", () => {
  const metadata = {
    schemaVersion: 1,
    kind: grading
      ? "published-real-runner-controlled-provider-journey"
      : catalogue.some((p) => p.status !== "published")
        ? "draft-preview-controlled-provider-no-runner"
        : "published-catalogue-controlled-provider-no-runner",
    address: `http://127.0.0.1:${port}`,
    pid: process.pid,
    dataDir,
    published: catalogue.filter((p) => p.status === "published").length,
    preview: catalogue.filter((p) => p.status !== "published").length,
    expected: 243,
    provider: "explicit local controlled fixture; no live DeepSeek",
    gradingEnabled: grading,
    maximumApprovedJobs: grading ? 10 : 0,
    catalogueSnapshotHash: hash(JSON.stringify(catalogue)),
    startedAt: new Date().toISOString(),
    command: "node --import tsx tests/frontend/fixture-final-provider.ts",
  };
  writeFileSync(
    resolve(`docs/release-evidence/${evidencePrefix}-fixture.json`),
    JSON.stringify(metadata, null, 2),
  );
  console.log(JSON.stringify(metadata));
});
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    app.close();
    process.exit(0);
  });
