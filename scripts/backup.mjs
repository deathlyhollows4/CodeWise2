import { readFileSync, writeFileSync, statSync } from "node:fs";
const [operation, path, ...rest] = process.argv.slice(2);
if (!["export", "preview", "restore"].includes(operation) || !path) {
  console.error(
    "Usage: node scripts/backup.mjs export|preview|restore PATH [--url http://127.0.0.1:3000] [--confirm RESTORE]",
  );
  process.exit(2);
}
const address = rest.includes("--url")
  ? rest[rest.indexOf("--url") + 1]
  : "http://127.0.0.1:3000";
const url = new URL(address);
if (
  url.protocol !== "http:" ||
  !["127.0.0.1", "localhost"].includes(url.hostname) ||
  url.username ||
  url.password ||
  url.search ||
  url.hash ||
  url.pathname !== "/"
)
  throw Error("Use the printed localhost application address.");
const base = url.origin;
try {
  const bootstrapResponse = await fetch(base + "/api/bootstrap");
  if (!bootstrapResponse.ok) throw Error("Local session bootstrap failed.");
  const bootstrap = await bootstrapResponse.json();
  const cookie = bootstrapResponse.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw Error("Local session cookie unavailable.");
  const request = async (route, body) => {
    const response = await fetch(base + "/api/" + route, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Cookie: cookie,
        Origin: base,
        "X-CSRF-Token": bootstrap.csrfToken,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw Error(data.message ?? "Backup request failed.");
    return data;
  };
  if (operation === "export") {
    const backup = await request("data/export");
    writeFileSync(path, JSON.stringify(backup), {
      flag: "wx",
      mode: 0o600,
    });
    console.log("Learning backup exported without credentials: " + path);
  } else {
    if (statSync(path).size > 64 * 1024 * 1024)
      throw Error(
        "Backup exceeds the supported 64 MiB UTF-8 JSON import limit.",
      );
    const backup = JSON.parse(readFileSync(path, "utf8"));
    const preview = await request("data/import/preview", { backup });
    console.log(JSON.stringify({ validated: true, counts: preview.counts }));
    if (operation === "restore") {
      if (
        rest[rest.indexOf("--confirm") + 1] !== "RESTORE" ||
        !rest.includes("--confirm")
      )
        throw Error(
          "Review the preview, then rerun with --confirm RESTORE to intentionally replace learning data.",
        );
      await request("data/import", {
        backup,
        token: preview.token,
        confirmation: "RESTORE",
      });
      console.log(
        "Restore completed transactionally. Credentials were excluded.",
      );
    }
  }
} catch (e) {
  console.error(e.message ?? "Backup failed.");
  process.exitCode = 1;
}
