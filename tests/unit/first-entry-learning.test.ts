import { test } from "node:test";
import assert from "node:assert/strict";
import {
  recommend,
  type Evidence,
} from "../../packages/learning-engine/src/index.ts";
const entry = {
  id: "focused-entry",
  status: "published",
  primaryTopic: "two-pointers",
  step: 1,
  skillIds: ["opposing"],
  prerequisites: ["traversal"],
  remedialIds: ["array-teacher"],
  checkpointIds: [],
  nextIds: [],
} as any;
const teacher = {
  id: "array-teacher",
  status: "published",
  primaryTopic: "arrays-hashing",
  step: 1,
  skillIds: ["traversal"],
  prerequisites: [],
  remedialIds: [],
  checkpointIds: [],
  nextIds: [],
} as any;
const accepted = (overrides: Partial<Evidence> = {}) =>
  ({
    id: "teacher-outcome",
    problemId: teacher.id,
    language: "python",
    step: 1,
    skills: ["traversal"],
    outcome: "accepted",
    assisted: false,
    review: false,
    advancementEligible: true,
    createdAt: "2026-10-08T00:00:00Z",
    ...overrides,
  }) as Evidence;
test("explicit empty-evidence focus selects only linked independent prerequisite teacher and returns to first step without fictional focus advancement", () => {
  const catalogue = [entry, teacher];
  const initial = recommend(catalogue, [], "java", "two-pointers");
  assert.equal(initial.problemId, teacher.id);
  assert.equal(initial.mode, "prerequisite_remediation");
  assert.equal(initial.pendingStep, 1);
  assert.equal(initial.pendingMode, "next_step");
  assert.match(initial.rationale, /first challenge/);
  assert.deepEqual(initial.practiceSkills, []);
  const pending = {
    topic: "two-pointers",
    step: 1,
    resumeMode: initial.pendingMode!,
  };
  for (const outcome of [
    accepted({ outcome: "wrong_answer" }),
    accepted({ outcome: "infrastructure_error" }),
    accepted({ assisted: true }),
  ])
    assert.notEqual(
      recommend(catalogue, [outcome], "java", undefined, [], pending).problemId,
      entry.id,
    );
  const resumed = recommend(
    catalogue,
    [accepted()],
    "java",
    undefined,
    [],
    pending,
  );
  assert.equal(resumed.problemId, entry.id);
  assert.equal(resumed.requestedStep, 1);
  assert.equal(resumed.selectedStep, 1);
  assert.equal(resumed.focusTopic, "two-pointers");
  assert.equal(resumed.language, "java");
  assert.match(resumed.rationale, /first step/);
  assert.deepEqual(resumed.practiceSkills, []);
});
test("first-entry teacher search remains bounded over explicit two-hop links and refuses exposed, nonpublished, solved-without-independent-skill or cyclic routes", () => {
  const middle = {
    ...teacher,
    id: "middle",
    skillIds: ["traversal"],
    prerequisites: ["foundation"],
    remedialIds: ["foundation"],
  };
  const foundational = {
    ...teacher,
    id: "foundation",
    skillIds: ["foundation"],
  };
  const target = { ...entry, remedialIds: ["middle"] };
  assert.equal(
    recommend([target, middle, foundational], [], "python", "two-pointers")
      .problemId,
    "foundation",
  );
  assert.equal(
    recommend(
      [target, middle, { ...foundational, status: "draft" }],
      [],
      "python",
      "two-pointers",
    ).problemId,
    null,
  );
  assert.equal(
    recommend([target, middle, foundational], [], "python", "two-pointers", [
      "foundation",
    ]).problemId,
    null,
  );
  const cycle = {
    ...foundational,
    prerequisites: ["traversal"],
    remedialIds: ["middle"],
  };
  const exhausted = recommend(
    [target, middle, cycle],
    [],
    "python",
    "two-pointers",
  );
  assert.equal(exhausted.problemId, null);
  assert.match(exhausted.rationale, /explicit prerequisite route/);
  assert.equal(
    recommend(
      [entry, teacher],
      [accepted({ assisted: true })],
      "python",
      "two-pointers",
    ).problemId,
    null,
  );
});
test("first-entry remediation cannot infer an unrelated teacher or unlock an unlinked higher step", () => {
  assert.equal(
    recommend(
      [{ ...entry, remedialIds: [] }, teacher],
      [],
      "python",
      "two-pointers",
    ).problemId,
    null,
  );
  const result = recommend(
    [{ ...entry, step: 2 }, teacher],
    [],
    "python",
    "two-pointers",
  );
  assert.equal(result.problemId, null);
  assert.equal(result.requestedStep, 1);
  assert.deepEqual(result.consideredCandidates, []);
});
