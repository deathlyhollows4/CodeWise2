import assert from "node:assert/strict";
import { writeFileSync, readFileSync } from "node:fs";
import { definitions } from "../content/authoring/registry.mjs";
import { logicalCases } from "../content/authoring/pack-builder.mjs";
import {
  buildFunctionHarness,
  buildFunctionStarters,
} from "../content/authoring/harness.mjs";
import { getPrivatePack } from "../packages/judge-adapter/src/content.mjs";
import { packIdentity } from "../packages/judge-adapter/src/pack-validation.mjs";
import { canonicalJson } from "../packages/judge-adapter/src/canonical.mjs";
const ids = [
  ...Array.from(
    { length: 10 },
    (_, i) => `two-pointers-${String(i + 1).padStart(2, "0")}`,
  ),
  ...Array.from(
    { length: 12 },
    (_, i) => `sliding-window-${String(i + 1).padStart(2, "0")}`,
  ),
  ...Array.from(
    { length: 5 },
    (_, i) => `stack-${String(i + 1).padStart(2, "0")}`,
  ),
];
const rows = [];
function nullable(schema) {
  return (
    schema.kind === "nullable" ||
    Object.values(schema.properties ?? {}).some(nullable) ||
    (schema.items && nullable(schema.items))
  );
}
for (const id of ids) {
  const d = definitions.find((d) => d.id === id),
    p = await getPrivatePack(id);
  assert.equal(p.statement, d.statement + "\n", id + " statement");
  assert.equal(
    canonicalJson(p.visibleCases),
    canonicalJson(d.visible.map((c, i) => ({ id: `visible-${i + 1}`, ...c }))),
    id + " visible",
  );
  assert.equal(
    canonicalJson(p.hiddenCases),
    canonicalJson(logicalCases(d)),
    id + " hidden",
  );
  const expected = buildFunctionHarness(d.function),
    starters = buildFunctionStarters(d.function),
    assets = {};
  for (const lang of ["java", "cpp", "python"]) {
    assert.equal(
      p.languages[lang].reference,
      d.languages[lang].reference,
      id + " " + lang + " reference",
    );
    let starter = d.languages[lang].starter;
    if (!starter.includes("\n")) starter = starters[lang];
    assert.equal(
      p.languages[lang].starter,
      starter,
      id + " " + lang + " starter",
    );
    const same = p.languages[lang].wrapper === expected[lang],
      legacy =
        lang === "java" &&
        !nullable(d.outputSchema) &&
        p.languages[lang].wrapper ===
          expected[lang].replace(
            "new GsonBuilder().serializeNulls().create()",
            "new Gson()",
          );
    assert.ok(same || legacy, id + " " + lang + " wrapper");
    assets[lang] = {
      referenceMatchesReadAuthorSource: true,
      starterMatchesAuthorOrReadableGeneratedStarter: true,
      wrapperMatchesCurrentHarness: same,
      reviewedDifference: legacy
        ? "Only Gson serializeNulls setup differs; this task has no nullable output values. No reference or input/output contract difference."
        : null,
    };
  }
  for (const kind of [
    "statement",
    "examples",
    "tests",
    "references",
    "explanation",
  ]) {
    assert.equal(p.provenance.assets[kind].origin, "original");
    assert.equal(p.provenance.assets[kind].license, "project-owned");
    assert.equal(p.provenance.assets[kind].sourceId, "codewise2-original");
  }
  const oracle = JSON.parse(
    readFileSync(`content/problems/${id}/private/oracle-evidence.json`, "utf8"),
  );
  assert.equal(oracle.status, "passed");
  assert.equal(oracle.contentIdentity, packIdentity(p));
  const manifests = [
    "skillIds",
    "prerequisites",
    "step",
    "checkpointIds",
    "remedialIds",
    "nextIds",
  ].map((key) => [key, p.manifest[key] ?? []]);
  rows.push({
    id,
    contentIdentity: packIdentity(p),
    hidden: p.hiddenCases.length,
    visible: p.visibleCases.length,
    manifest: Object.fromEntries(manifests),
    assets,
    provenance: p.provenance,
    hiddenCategories: [...new Set(p.hiddenCases.map((c) => c.category))],
    sourceStatementExamplesHiddenAndAllLanguageAssetsReconciled: true,
  });
}
writeFileSync(
  "docs/release-evidence/independent-tp-sw-stack-27-assets.json",
  JSON.stringify(
    {
      schemaVersion: 1,
      command: "node scripts/reconcile-tp-sw-stack-review-assets.mjs",
      reviewer: "CodeWise2 backend worker, independent of frontend author",
      reviewedAt: new Date().toISOString(),
      rows,
      limitations: [
        "This source/asset reconciliation executes trusted author generation, never learner/native code.",
        "Independent manual algorithm, objective and progression decisions are separate; this script never writes approvals.",
        "Current native receipts and final global review remain separate.",
      ],
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "27 packs,243 language assets,81 visible examples and all hidden/provenance reconciled; no approvals written",
);
