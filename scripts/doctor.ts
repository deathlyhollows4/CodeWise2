import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
console.log(
  JSON.stringify(
    {
      app: "CodeWise2",
      node: process.version,
      platform: process.platform,
      architecture: process.arch,
      frontendBuilt: existsSync("dist/web/index.html"),
      dataPath:
        process.env.CODEWISE2_DATA_DIR ??
        join(
          process.env.LOCALAPPDATA ?? join(homedir(), ".local", "share"),
          "CodeWise2",
        ),
      runner:
        "Run npm.cmd run doctor:runner for read-only isolated service diagnostics.",
    },
    null,
    2,
  ),
);
