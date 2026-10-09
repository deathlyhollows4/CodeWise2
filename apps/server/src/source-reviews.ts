import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { SourceReviewSnapshotSchema } from "../../../packages/contracts/src/index.ts";
type Status = "passed" | "pending" | "missing" | "stale" | "invalid";
export function currentSourceReviews(
  problemId: string,
  identity: unknown,
  root = resolve("content/problems"),
) {
  const validIdentity =
    typeof identity === "string" && /^[a-f0-9]{64}$/.test(identity)
      ? identity
      : null;
  const validId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(problemId);
  const read = (kind: string): Status => {
    if (!validIdentity || !validId) return "missing";
    try {
      const path = resolve(root, problemId, "private", kind + "-review.json");
      if (statSync(path).size > 65536) return "invalid";
      const record = JSON.parse(readFileSync(path, "utf8"));
      if (!record || typeof record !== "object" || Array.isArray(record))
        return "invalid";
      if (record.contentIdentity !== validIdentity) return "stale";
      if (record.status !== "passed") return "pending";
      if (
        typeof record.reviewer !== "string" ||
        !record.reviewer.trim() ||
        typeof record.reviewedAt !== "string" ||
        !record.reviewedAt.trim()
      )
        return "invalid";
      return "passed";
    } catch (error: any) {
      return error.code === "ENOENT" ? "missing" : "invalid";
    }
  };
  const rights = read("rights"),
    progression = read("progression"),
    diversity = read("diversity");
  return SourceReviewSnapshotSchema.parse({
    contentIdentity: validIdentity,
    rights,
    progression,
    diversity,
    overall: [rights, progression, diversity].every(
      (status) => status === "passed",
    )
      ? "passed"
      : "pending",
  });
}
export function sourceReviewRows(
  rows: any[],
  root = resolve("content/problems"),
) {
  return rows.map((row) => {
    const { reviewIdentity, ...publicMetadata } = row;
    const reviewSnapshot = currentSourceReviews(
      row.problemId,
      reviewIdentity,
      root,
    );
    return {
      ...publicMetadata,
      authorIndependentReview: row.independentReview ?? null,
      independentReview: reviewSnapshot.overall,
      reviewSnapshot,
    };
  });
}
