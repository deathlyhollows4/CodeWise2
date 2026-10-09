import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  readFileSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";
import {
  currentSourceReviews,
  sourceReviewRows,
} from "../../apps/server/src/source-reviews.ts";
test("Sources derives exact current independent records without mutating original provenance; stale missing malformed and oversized records fail closed", () => {
  const root = join(process.cwd(), ".runtime", "tests");
  mkdirSync(root, { recursive: true });
  const dir = mkdtempSync(join(root, "source-reviews-")),
    identity = "a".repeat(64),
    id = "source-test",
    privateDir = join(dir, id, "private");
  mkdirSync(privateDir, { recursive: true });
  const record = {
    status: "passed",
    contentIdentity: identity,
    reviewer: "Explicit independent fixture reviewer",
    reviewedAt: "2026-10-08T00:00:00Z",
  };
  const paths = ["rights", "progression", "diversity"].map((kind) =>
    join(privateDir, kind + "-review.json"),
  );
  for (const path of paths) writeFileSync(path, JSON.stringify(record));
  const provenance = {
      problemId: id,
      reviewIdentity: identity,
      independentReview: "pending",
      assets: { statement: { origin: "original", license: "fixture" } },
    },
    before = JSON.stringify(provenance);
  const row = sourceReviewRows([provenance], dir)[0];
  assert.equal(row.independentReview, "passed");
  assert.equal(row.authorIndependentReview, "pending");
  assert.equal(row.reviewIdentity, undefined);
  assert.equal(row.reviewSnapshot.overall, "passed");
  assert.equal(JSON.stringify(provenance), before);
  writeFileSync(
    paths[1],
    JSON.stringify({ ...record, contentIdentity: "b".repeat(64) }),
  );
  assert.equal(currentSourceReviews(id, identity, dir).progression, "stale");
  assert.equal(
    sourceReviewRows([provenance], dir)[0].independentReview,
    "pending",
  );
  writeFileSync(paths[1], JSON.stringify({ ...record, reviewer: "" }));
  assert.equal(currentSourceReviews(id, identity, dir).progression, "invalid");
  writeFileSync(paths[1], "{bad");
  assert.equal(currentSourceReviews(id, identity, dir).progression, "invalid");
  writeFileSync(paths[1], "x".repeat(65537));
  assert.equal(currentSourceReviews(id, identity, dir).progression, "invalid");
  unlinkSync(paths[1]);
  assert.equal(currentSourceReviews(id, identity, dir).progression, "missing");
  assert.equal(
    currentSourceReviews("../outside", identity, dir).rights,
    "missing",
  );
  assert.equal(currentSourceReviews(id, null, dir).overall, "pending");
  assert.equal(
    JSON.parse(readFileSync(paths[0], "utf8")).contentIdentity,
    identity,
  );
});
