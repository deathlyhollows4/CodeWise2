import { join } from "node:path";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { loadRunnerConfiguration } from "./runner-config.ts";
import { createApp } from "./app.ts";
import { WslLifetime } from "./wsl-lifetime.ts";
import { ProfileOwner } from "./profile-owner.ts";
import { existsSync } from "node:fs";
const dataDir =
  process.env.CODEWISE2_DATA_DIR ??
  join(
    process.env.LOCALAPPDATA ?? join(homedir(), ".local", "share"),
    "CodeWise2",
  );
let profileOwner: ProfileOwner;
try {
  profileOwner = ProfileOwner.acquire(dataDir);
} catch (error: any) {
  console.error(error.message);
  process.exit(1);
}
let catalogue: any[] = [],
  judge: any,
  sources: any[] = [];
if (existsSync(resolve("content/publication-journal.json"))) {
  profileOwner.release();
  console.error(
    "An unfinished content publication blocks startup. Run the explicit publication recovery command before starting CodeWise2.",
  );
  process.exit(1);
}
const runnerDataDir = process.env.CODEWISE2_RUNNER_DATA_DIR ?? dataDir;
const lifetime = new WslLifetime(dataDir, process.cwd(), runnerDataDir);
try {
  const modulePath = pathToFileURL(
    resolve("packages/judge-adapter/src/index.mjs"),
  ).href;
  const loader: any = await import(modulePath);
  const reviewTools: any = await import(
    pathToFileURL(resolve("packages/judge-adapter/src/pack-validation.mjs"))
      .href
  );
  catalogue = (await loader.loadCatalogue?.()) ?? [];
  const configuration = loadRunnerConfiguration(runnerDataDir);
  if (configuration.ok) await lifetime.start();
  const adapter = new loader.JudgeAdapter(configuration);
  judge = {
    ...loader,
    readiness: () =>
      configuration.ok
        ? adapter.readiness()
        : Promise.resolve({
            ready: false,
            controlsVerified: false,
            languages: [],
            message: configuration.message,
          }),
    judgePack: (request: any) => loader.judgePack({ ...request, adapter }),
  };
  sources = await Promise.all(
    catalogue.map(async (p) => {
      const pack = await loader.getPrivatePack(p.id);
      return {
        ...pack.provenance,
        problemId: p.id,
        title: p.title,
        reviewIdentity: reviewTools.packIdentity(pack),
      };
    }),
  );
} catch (e) {
  console.error(
    "Catalogue/runner adapter could not load. See setup diagnostics.",
  );
  try {
    await lifetime.stop();
  } catch {
    console.error(
      "Runner lifetime cleanup was not verified; no shared shutdown was issued.",
    );
  }
  profileOwner.release();
  process.exit(1);
}
let app: ReturnType<typeof createApp>;
try {
  app = createApp({
    profileOwner,
    dataDir,
    catalogue,
    judge,
    sources,
    learningMetadata: judge.getPublicLearningMetadata,
    onStop: () => {
      void shutdown(false);
    },
  });
} catch {
  console.error(
    "Application initialization failed; storage ownership and owned runner lifetime will be released.",
  );
  try {
    await lifetime.stop();
  } finally {
    profileOwner.release();
  }
  process.exit(1);
}
let shuttingDown = false;
async function shutdown(closeApp = true, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  try {
    if (closeApp) app.close();
  } catch {
    console.error(
      "Application shutdown requested; remaining resources will close with the process.",
    );
  }
  try {
    await Promise.race([
      lifetime.stop(),
      new Promise((resolve) => {
        const timer = setTimeout(resolve, 12000);
        timer.unref();
      }),
    ]);
  } catch {
    console.error(
      "Runner lifetime stop was not fully verified; no shared shutdown was issued.",
    );
  } finally {
    profileOwner.release();
    process.exit(exitCode);
  }
}
let port = Number(process.env.PORT ?? 3000);
app.server.on("error", (e: any) => {
  if (e.code === "EADDRINUSE" && port < 3010) {
    port++;
    app.server.listen(port, "127.0.0.1");
  } else {
    console.error(`CodeWise2 could not listen: ${e.code}`);
    void shutdown(true, 1);
  }
});
app.server.listen(port, "127.0.0.1", () =>
  console.log(`CodeWise2: http://127.0.0.1:${port}\nData: ${dataDir}`),
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    void shutdown();
  });
