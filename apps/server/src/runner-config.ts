import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
const endpointSchema = z.string().refine((value) => {
  try {
    const u = new URL(value);
    return (
      u.protocol === "http:" &&
      ["127.0.0.1", "[::1]"].includes(u.hostname) &&
      !u.username &&
      !u.password &&
      !u.search &&
      !u.hash &&
      u.pathname === "/"
    );
  } catch {
    return false;
  }
}, "Runner endpoint must be fixed loopback HTTP");
const ConfigSchema = z
  .object({ schemaVersion: z.literal(1), endpoint: endpointSchema })
  .strict();
export function loadRunnerConfiguration(
  dataDir: string,
  env: NodeJS.ProcessEnv = process.env,
) {
  try {
    const configPath = join(dataDir, "runner.json");
    let endpoint = "http://127.0.0.1:2358";
    if (existsSync(configPath)) {
      if (statSync(configPath).size > 4096) throw new Error("oversized");
      endpoint = ConfigSchema.parse(
        JSON.parse(readFileSync(configPath, "utf8")),
      ).endpoint;
    }
    if (env.CODEWISE_RUNNER_URL)
      endpoint = endpointSchema.parse(env.CODEWISE_RUNNER_URL);
    return {
      ok: true,
      endpoint,
      tokenFile:
        env.CODEWISE_RUNNER_TOKEN_FILE ??
        join(dataDir, "credentials", "runner", "token"),
      ...(env.CODEWISE_RUNNER_TOKEN
        ? { token: env.CODEWISE_RUNNER_TOKEN }
        : {}),
    };
  } catch {
    return {
      ok: false,
      endpoint: "http://127.0.0.1:2358",
      tokenFile: join(dataDir, "credentials", "runner", "token"),
      message:
        "The private local runner configuration is invalid. Rerun the approved runner setup; editing and saved work remain available.",
    };
  }
}
