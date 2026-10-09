import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import scope from "../../packages/contracts/src/delivery-scope.json" with { type: "json" };
const helper: any = await import(
    new URL(
      "../../packages/judge-adapter/src/learning-metadata.mjs",
      import.meta.url,
    ).href
  ),
  validation: any = await import(
    new URL(
      "../../packages/judge-adapter/src/pack-validation.mjs",
      import.meta.url,
    ).href
  ),
  canonical: any = await import(
    new URL("../../packages/judge-adapter/src/canonical.mjs", import.meta.url)
      .href
  ),
  content: any = await import(
    new URL("../../packages/judge-adapter/src/content.mjs", import.meta.url)
      .href
  );
const pack: any = {
  manifest: {
    id: "arrays-hashing-01",
    version: "1.0.0",
    status: "published",
    checker: { kind: "exact" },
    primaryTopic: "arrays-hashing",
    skillIds: ["fixture"],
    prerequisites: [],
    checkpointIds: [],
    nextIds: [],
    remedialIds: [],
    sourceIds: ["fixture"],
  },
  statement: "Explicit classification fixture, no native execution",
  visibleCases: [],
  suite: { suiteHash: "a".repeat(64) },
  provenance: { origin: "original" },
  languages: Object.fromEntries(
    ["java", "cpp", "python"].map((l) => [
      l,
      {
        starter: "fixture starter",
        wrapper: "fixture wrapper",
        reference: "fixture reference",
      },
    ]),
  ),
};
function fixture() {
  const base = join(process.cwd(), ".runtime", "tests");
  mkdirSync(base, { recursive: true });
  const root = mkdtempSync(join(base, "metadata-"));
  const identity = validation.packIdentity(pack),
    records = scope.topics.flatMap(([topic, , quota]) =>
      Array.from({ length: Number(quota) }, (_, i) => ({
        problemId: `${topic}-${String(i + 1).padStart(2, "0")}`,
        contentIdentity:
          topic === "arrays-hashing" && i === 0 ? identity : "0".repeat(64),
        secondaryTopics: [] as string[],
        approachTags: ["linear-scan"],
        rationale: "Explicit test-only classification",
      })),
    );
  const document = {
    schemaVersion: 1,
    approachVocabulary: ["linear-scan"],
    records,
  };
  const review = {
    schemaVersion: 1,
    status: "passed",
    metadataHash: createHash("sha256")
      .update(canonical.canonicalJson(document))
      .digest("hex"),
    reviewer: "Independent fixture reviewer only",
    reviewedAt: "2026-10-09T00:00:00Z",
  };
  const save = () => {
    writeFileSync(join(root, "learning-tags.json"), JSON.stringify(document));
    writeFileSync(
      join(root, "learning-tags-review.json"),
      JSON.stringify(review),
    );
  };
  save();
  return { root, document, review, save };
}
const code = (name: string) => (error: any) => error.code === name;
test("approved ancillary classifications bind exact core identity while leaving grading/public snapshots unchanged", () => {
  const f = fixture(),
    before = validation.packIdentity(pack),
    publicBefore = canonical.canonicalJson(content.publicProblem(pack)),
    metadata = helper.currentLearningMetadata(pack, f.root);
  assert.equal(metadata.problemId, pack.manifest.id);
  assert.deepEqual(metadata.approachTags, ["linear-scan"]);
  assert.equal(metadata.metadataVersion, f.review.metadataHash);
  metadata.approachTags.push("caller-edit");
  assert.deepEqual(helper.currentLearningMetadata(pack, f.root).approachTags, [
    "linear-scan",
  ]);
  assert.equal(validation.packIdentity(pack), before);
  assert.equal(
    canonical.canonicalJson(content.publicProblem(pack)),
    publicBefore,
  );
  assert.throws(
    () =>
      helper.currentLearningMetadata(
        { ...pack, statement: "Changed core version bytes" },
        f.root,
      ),
    code("LEARNING_METADATA_STALE"),
  );
});
test("mapping/approval/schema/catalogue failures close access rather than migrating independent approval", () => {
  const f = fixture();
  f.document.records[0].rationale = "Changed delivered content";
  f.save();
  assert.throws(
    () => helper.currentLearningMetadata(pack, f.root),
    code("LEARNING_METADATA_STALE"),
  );
  const other = fixture();
  other.review.status = "pending" as any;
  other.save();
  assert.throws(
    () => helper.currentLearningMetadata(pack, other.root),
    code("LEARNING_METADATA_INVALID"),
  );
  const duplicate = fixture();
  duplicate.document.records[1] = duplicate.document.records[0];
  assert.throws(
    () =>
      helper.validateReviewedLearningMetadata(
        duplicate.document,
        duplicate.review,
      ),
    code("LEARNING_METADATA_INVALID"),
  );
  const unknown = fixture();
  unknown.document.records[1].problemId = "other-01";
  unknown.review.metadataHash = createHash("sha256")
    .update(canonical.canonicalJson(unknown.document))
    .digest("hex");
  assert.throws(
    () =>
      helper.validateReviewedLearningMetadata(unknown.document, unknown.review),
    code("LEARNING_METADATA_INVALID"),
  );
  const tags = fixture();
  tags.document.records[0].approachTags = ["unapproved-tag"];
  assert.throws(
    () => helper.validateReviewedLearningMetadata(tags.document, tags.review),
    code("LEARNING_METADATA_INVALID"),
  );
  const draft = fixture();
  assert.throws(
    () =>
      helper.validateReviewedLearningMetadata(
        { ...draft.document, status: "draft-independent-review-required" },
        draft.review,
      ),
    code("LEARNING_METADATA_INVALID"),
  );
});
test("missing malformed oversized and primary-repeated classifications are unavailable; cache rechecks changed delivered bytes", () => {
  const f = fixture();
  assert.equal(
    helper.currentLearningMetadata(pack, f.root).primaryTopic,
    "arrays-hashing",
  );
  f.document.records[0].secondaryTopics = ["arrays-hashing"];
  f.review.metadataHash = createHash("sha256")
    .update(canonical.canonicalJson(f.document))
    .digest("hex");
  f.save();
  assert.throws(
    () => helper.currentLearningMetadata(pack, f.root),
    code("LEARNING_METADATA_INVALID"),
  );
  writeFileSync(join(f.root, "learning-tags.json"), "{bad");
  assert.throws(
    () => helper.currentLearningMetadata(pack, f.root),
    code("LEARNING_METADATA_INVALID"),
  );
  writeFileSync(
    join(f.root, "learning-tags.json"),
    "x".repeat(2 * 1024 * 1024 + 1),
  );
  assert.throws(
    () => helper.currentLearningMetadata(pack, f.root),
    code("LEARNING_METADATA_INVALID"),
  );
  assert.throws(
    () => helper.currentLearningMetadata(pack, join(f.root, "missing")),
    code("LEARNING_METADATA_MISSING"),
  );
});
