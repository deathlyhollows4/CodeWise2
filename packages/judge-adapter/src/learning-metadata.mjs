import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import {
  LearningMetadataDocumentSchema,
  LearningMetadataReviewSchema,
  PublicLearningMetadataSchema,
} from "../../contracts/src/learning-metadata.mjs";
import scope from "../../contracts/src/delivery-scope.json" with { type: "json" };
import { canonicalJson } from "./canonical.mjs";
import { packIdentity } from "./pack-validation.mjs";
const defaultRoot = fileURLToPath(
    new URL("../../../content/", import.meta.url),
  ),
  expectedIds = scope.topics
    .flatMap(([topic, , quota]) =>
      Array.from(
        { length: quota },
        (_, i) => `${topic}-${String(i + 1).padStart(2, "0")}`,
      ),
    )
    .sort(),
  cache = new Map();
const hash = (value) => createHash("sha256").update(value).digest("hex");
export class LearningMetadataError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.status = 503;
  }
}
const invalid = (message) => {
  throw new LearningMetadataError("LEARNING_METADATA_INVALID", message);
};
export function validateReviewedLearningMetadata(document, review) {
  const parsed = LearningMetadataDocumentSchema.safeParse(document),
    approval = LearningMetadataReviewSchema.safeParse(review);
  if (!parsed.success || !approval.success || !approval.data.reviewer.trim())
    invalid(
      "Question classification data or its independent approval is invalid.",
    );
  const metadata = parsed.data,
    metadataVersion = hash(canonicalJson(metadata));
  if (approval.data.metadataHash !== metadataVersion)
    throw new LearningMetadataError(
      "LEARNING_METADATA_STALE",
      "Question classification approval does not match the delivered metadata.",
    );
  if (
    canonicalJson(metadata.records.map((r) => r.problemId).sort()) !==
    canonicalJson(expectedIds)
  )
    invalid(
      "Question classification does not cover the exact current catalogue IDs.",
    );
  return {
    metadataVersion,
    records: new Map(metadata.records.map((row) => [row.problemId, row])),
  };
}
function bounded(path, limit) {
  try {
    if (statSync(path).size > limit)
      invalid("Question classification metadata exceeded its safe size limit.");
    return readFileSync(path, "utf8");
  } catch (error) {
    if (error instanceof LearningMetadataError) throw error;
    throw new LearningMetadataError(
      error.code === "ENOENT"
        ? "LEARNING_METADATA_MISSING"
        : "LEARNING_METADATA_INVALID",
      "Reviewed question classification metadata is unavailable.",
    );
  }
}
export function loadReviewedLearningMetadata(root = defaultRoot) {
  const mapping = bounded(resolve(root, "learning-tags.json"), 2 * 1024 * 1024),
    review = bounded(resolve(root, "learning-tags-review.json"), 65536),
    key = hash(mapping + "\0" + review),
    location = resolve(root);
  const previous = cache.get(location);
  if (previous?.key === key) return previous.value;
  let parsed;
  try {
    parsed = validateReviewedLearningMetadata(
      JSON.parse(mapping),
      JSON.parse(review),
    );
  } catch (error) {
    if (error instanceof LearningMetadataError) throw error;
    invalid("Question classification metadata is not valid JSON.");
  }
  cache.set(location, { key, value: parsed });
  return parsed;
}
export function currentLearningMetadata(pack, root = defaultRoot) {
  const mapping = loadReviewedLearningMetadata(root),
    record = mapping.records.get(pack.manifest.id);
  if (!record)
    throw new LearningMetadataError(
      "LEARNING_METADATA_MISSING",
      "This published question has no reviewed classification.",
    );
  const identity = packIdentity(pack);
  if (record.contentIdentity !== identity)
    throw new LearningMetadataError(
      "LEARNING_METADATA_STALE",
      "Question classification is stale for the current content version.",
    );
  if (record.secondaryTopics.includes(pack.manifest.primaryTopic))
    invalid("A question primary topic cannot also be its secondary topic.");
  return PublicLearningMetadataSchema.parse({
    schemaVersion: 1,
    metadataVersion: mapping.metadataVersion,
    problemVersion: pack.manifest.version,
    problemId: record.problemId,
    contentIdentity: identity,
    primaryTopic: pack.manifest.primaryTopic,
    secondaryTopics: [...record.secondaryTopics],
    approachTags: [...record.approachTags],
    rationale: record.rationale,
  });
}
