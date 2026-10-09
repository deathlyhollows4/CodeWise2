import { readFileSync, writeFileSync } from "node:fs";
import { getPrivatePack } from "../packages/judge-adapter/src/content.mjs";
import { packIdentity } from "../packages/judge-adapter/src/pack-validation.mjs";
const ids = [
  "two-pointers-01",
  "two-pointers-02",
  "sliding-window-01",
  "stack-01",
  "stack-02",
  "stack-03",
  "dp-2d-09",
  "dp-2d-10",
  "dp-2d-11",
  "graphs-08",
  "graphs-09",
  "graphs-10",
  "graphs-11",
  "graphs-12",
  "graphs-13",
  "advanced-graphs-06",
];
const audit = JSON.parse(
  readFileSync(
    "docs/release-evidence/content-entry-terminal-structural-sixteen-selected-audit.json",
    "utf8",
  ),
);
if (!audit.passed || audit.packs.length !== ids.length)
  throw Error("Selected trusted audit unavailable");
const packs = [];
for (const id of ids) {
  const p = await getPrivatePack(id),
    identity = packIdentity(p),
    entry = audit.packs.find((q) => q.id === id);
  if (entry?.evidence?.contentIdentity !== identity)
    throw Error("Identity changed after audit: " + id);
  packs.push({
    id,
    version: p.manifest.version,
    contentIdentity: identity,
    hidden: p.hiddenCases.length,
    visible: p.visibleCases.length,
  });
}
const report = {
  schemaVersion: 1,
  timestamp: new Date().toISOString(),
  command: "node scripts/freeze-entry-terminal-structural-sixteen.mjs",
  ids,
  packs,
  languagePairs: ids.length * 3,
  catalogueCount: 243,
  scope:
    "reviewed source repairs; current trusted oracle passed; fresh ordinary references required; publication separate",
  nativeExecution: "not-yet-run",
};
writeFileSync(
  "docs/release-evidence/native-entry-terminal-structural-sixteen-freeze.json",
  JSON.stringify(report, null, 2) + "\n",
);
writeFileSync(
  "docs/release-evidence/native-entry-terminal-structural-sixteen-freeze.ids",
  ids.join("\n") + "\n",
);
console.log("Frozen16 current packs/48 language pairs");
