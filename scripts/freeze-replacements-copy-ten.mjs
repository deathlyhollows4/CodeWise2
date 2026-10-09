import { readFileSync, writeFileSync } from "node:fs";
import { getPrivatePack } from "../packages/judge-adapter/src/content.mjs";
import { packIdentity } from "../packages/judge-adapter/src/pack-validation.mjs";
const ids = [
  "bit-manipulation-02",
  "bit-manipulation-07",
  "heap-04",
  "trees-18",
  "trees-19",
  "trees-20",
  "trees-23",
  "two-pointers-02",
  "two-pointers-04",
  "trees-08",
];
const audit = JSON.parse(
  readFileSync(
    "docs/release-evidence/content-replacements-copy-ten-selected-audit.json",
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
  command: "node scripts/freeze-replacements-copy-ten.mjs",
  ids,
  packs,
  languagePairs: ids.length * 3,
  catalogueCount: 243,
  scope:
    "reviewed source repairs; current trusted oracle passed; fresh ordinary references required; publication separate",
  nativeExecution: "not-yet-run",
};
writeFileSync(
  "docs/release-evidence/native-replacements-copy-ten-freeze.json",
  JSON.stringify(report, null, 2) + "\n",
);
writeFileSync(
  "docs/release-evidence/native-replacements-copy-ten-freeze.ids",
  ids.join("\n") + "\n",
);
console.log("Frozen10 current packs/30 language pairs");
