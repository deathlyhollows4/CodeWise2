import { test } from "node:test";
import assert from "node:assert/strict";
import {
  auditCurriculum,
  type CurriculumMetadata,
} from "../../packages/learning-engine/src/curriculum-audit.ts";
const p = (
  id: string,
  step: number,
  skills: string[],
  prerequisites: string[],
  nextIds: string[] = [],
  checkpointIds: string[] = [],
): CurriculumMetadata => ({
  id,
  step,
  skillIds: skills,
  prerequisites,
  nextIds,
  checkpointIds,
  remedialIds: [],
  primaryTopic: "arrays",
});
test("audit exposes skipped steps, missing targets, wrong checkpoints and unknown path skills", () => {
  const report = auditCurriculum([
    p("a", 1, ["max"], [], ["c"], ["missing"]),
    p("b", 2, ["membership"], ["traversal"], ["c"], ["c"]),
    p("c", 3, ["pairs"], ["traversal", "membership"]),
  ]);
  const codes = new Set(report.issues.map((i) => i.code));
  for (const code of [
    "NEXT_NOT_ONE_STEP",
    "MISSING_TARGET",
    "CHECKPOINT_WRONG_STEP",
    "UNREACHABLE_FROM_ENTRY",
    "ASSISTED_BRANCH_GAP",
  ])
    assert.ok(codes.has(code), code);
  assert.equal(report.ok, false);
});
test("entry branch cannot borrow demonstrated prerequisites from another unvisited entry", () => {
  const report = auditCurriculum([
    p("sum", 1, ["traversal"], [], ["counts"]),
    p("max", 1, ["maximum"], [], ["counts"]),
    p("counts", 2, ["counts"], ["traversal"]),
  ]);
  assert.ok(
    report.issues.some(
      (i) => i.code === "UNMET_PATH_PREREQUISITE" && i.problemId === "counts",
    ),
  );
  assert.deepEqual(
    report.branches.find((b) => b.entryId === "max")!.reachable,
    ["max"],
  );
});
test("assisted checkpoints cannot assume independent skill evidence from the assisted original", () => {
  const report = auditCurriculum([
    p("a", 1, ["traversal"], [], [], ["b"]),
    p("b", 1, ["max"], ["traversal"]),
  ]);
  assert.ok(
    report.issues.some(
      (i) =>
        i.code === "ASSISTED_CHECKPOINT_PREREQUISITE" && i.targetId === "b",
    ),
  );
});

test("a capped audit reports unverified coverage rather than proving absence", () => {
  const r = auditCurriculum(
    [
      p("a", 1, ["x"], [], ["b"]),
      p("b", 2, ["y"], ["x"], ["c"]),
      p("c", 3, ["z"], ["y"]),
    ],
    { maxStatesPerEntry: 1 },
  );
  assert.equal(r.capped, true);
  assert.equal(r.learnerHistoryCoverage, "not-exhaustive");
  assert.ok(r.issues.some((i) => i.code === "REACHABILITY_UNVERIFIED"));
  assert.ok(!r.issues.some((i) => i.code === "UNREACHABLE_FROM_ENTRY"));
});
