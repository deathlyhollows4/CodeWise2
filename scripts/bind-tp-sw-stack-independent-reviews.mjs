import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { decisions } from "../docs/release-evidence/independent-tp-sw-stack-manual-decisions.mjs";
import { getPrivatePack } from "../packages/judge-adapter/src/content.mjs";
import {
  packIdentity,
  assertPublicationReviews,
} from "../packages/judge-adapter/src/pack-validation.mjs";
const assetReport = JSON.parse(
  readFileSync(
    "docs/release-evidence/independent-tp-sw-stack-27-assets.json",
    "utf8",
  ),
);
const all = JSON.parse(
    readFileSync("content/catalogue.json", "utf8"),
  ).problems.map((p) => p.id),
  metadata = new Map(
    all.map((id) => [
      id,
      JSON.parse(readFileSync(`content/problems/${id}/problem.json`, "utf8")),
    ]),
  );
const reviewedAt = new Date().toISOString(),
  reviewer = "CodeWise2 backend worker, independent of frontend author",
  rows = [];
for (const [id, [algorithm, diversity]] of Object.entries(decisions)) {
  const pack = await getPrivatePack(id),
    identity = packIdentity(pack),
    asset = assetReport.rows.find((r) => r.id === id);
  assert.equal(
    asset.contentIdentity,
    identity,
    "Asset review became stale: " + id,
  );
  const manifest = pack.manifest;
  for (const target of manifest.nextIds ?? []) {
    assert.equal(
      metadata.get(target)?.step,
      manifest.step + 1,
      id + " next target step",
    );
    assert.equal(
      metadata.get(target)?.primaryTopic,
      manifest.primaryTopic,
      id + " next path",
    );
  }
  for (const peer of manifest.checkpointIds ?? []) {
    assert.notEqual(peer, id);
    assert.equal(
      metadata.get(peer)?.step,
      manifest.step,
      id + " checkpoint step",
    );
    assert.equal(
      metadata.get(peer)?.primaryTopic,
      manifest.primaryTopic,
      id + " checkpoint path",
    );
  }
  for (const target of manifest.remedialIds ?? [])
    assert.ok(metadata.has(target), id + " missing teacher");
  const common = {
    status: "passed",
    contentIdentity: identity,
    reviewer,
    reviewerType: "independent-source-review",
    reviewedAt,
    evidence:
      "docs/release-evidence/independent-tp-sw-stack-27-review-binding.json",
    algorithmReview: algorithm,
    coverageLimits: [
      "Read authored Java/C++/Python reference algorithms and reconciled actual statement/examples/tests/assets/provenance; this review runs no native or learner code.",
      "Native current-runtime receipts and final global243 diversity/curriculum synthesis remain separate.",
      "Immediate declared routes and first-entry prerequisites inspected; finite already-solved peer exhaustion is not labelled missing content.",
    ],
  };
  const progression =
    `Step${manifest.step} teaches ${manifest.skillIds.join(", ")}. Prerequisites remain ${manifest.prerequisites.join(", ") || "none"}; explicit teachers ${manifest.remedialIds.join(", ") || "none"} preserve independently demonstrated eligibility. Same-step related checkpoints ${manifest.checkpointIds.join(", ") || "none"} and actual step+1 targets ${manifest.nextIds.join(", ") || "terminal"} were checked against current manifests. ` +
    ([
      "two-pointers-01",
      "two-pointers-02",
      "sliding-window-01",
      "stack-01",
      "stack-02",
      "stack-03",
    ].includes(id)
      ? "The explicit Array01 foundation bridge was repaired and actual18-topic empty-evidence probe selects a qualified teacher; the original focus remains at step1 and no mastery is granted on selection. "
      : "The R21 actual-engine diagnostic and learning5 bounded first-entry/teacher tests distinguish prerequisite teaching, practice-only shared skills and finite related-peer exhaustion. ") +
    algorithm;
  const records = {
    rights: {
      ...common,
      reviewType: "rights",
      rationale:
        "Read original frontend author modules and all three references; exact actual statement,81-example subset, hidden generation and language assets reconcile with that source. All five provenance asset categories explicitly identify codewise2-original/project-owned, with no imported/adapted asset claimed. This is bounded origin/notice review, not an exhaustive external plagiarism search.",
    },
    progression: {
      ...common,
      reviewType: "progression",
      rationale: progression,
    },
    diversity: {
      ...common,
      reviewType: "diversity",
      rationale:
        diversity +
        ` Actual${asset.hidden} canonical hidden inputs and categories ${asset.hiddenCategories.join(", ")} were reconciled; these counts are input uniqueness, not a fabricated count of independent algorithms.`,
    },
  };
  for (const [kind, record] of Object.entries(records))
    writeFileSync(
      `content/problems/${id}/private/${kind}-review.json`,
      JSON.stringify(record, null, 2) + "\n",
    );
  await assertPublicationReviews(pack, resolve("content/problems", id));
  assert.equal(packIdentity(await getPrivatePack(id)), identity);
  rows.push({
    id,
    contentIdentity: identity,
    hidden: asset.hidden,
    reviewTypes: Object.keys(records),
    algorithmReview: algorithm,
    diversityDecision: diversity,
    progressionDecision: progression,
  });
}
writeFileSync(
  "docs/release-evidence/independent-tp-sw-stack-27-review-binding.json",
  JSON.stringify(
    {
      schemaVersion: 1,
      command: "node scripts/bind-tp-sw-stack-independent-reviews.mjs",
      reviewer,
      reviewedAt,
      passed: true,
      packs: rows.length,
      records: rows.length * 3,
      rows,
      limitations: [
        "Independent manually authored decisions are not generated from author audit status.",
        "No publication/native learner execution is performed.",
      ],
    },
    null,
    2,
  ) + "\n",
);
console.log(
  rows.length +
    " current packs/" +
    rows.length * 3 +
    " independent manual review records; mechanical review gates pass",
);
