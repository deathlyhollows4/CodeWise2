import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  startAssessment,
  advanceAssessment,
  stopAssessment,
  normalizeAssessment,
} from "../../packages/learning-engine/src/assessment.ts";
import {
  AssessmentStateSchema,
  type PublicProblem,
  type AssessmentState,
} from "../../packages/contracts/src/index.ts";
const at = "2026-10-08T10:00:00.000Z";
const base: any = {
  schemaVersion: 1,
  version: "fixture-1",
  slug: "fixture",
  title: "Assessment fixture",
  statement: "Fixture only",
  objective: "Check a declared fixture requirement",
  constraints: [],
  interface: "Fixture",
  status: "published",
  visibleCases: [0, 1, 2].map((i) => ({
    id: String(i),
    input: [],
    expected: 0,
    explanation: "Fixture",
  })),
  starters: { java: "fixture", cpp: "fixture", python: "fixture" },
  sourceIds: ["fixture"],
  prerequisites: [],
  checkpointIds: [],
  nextIds: [],
  remedialIds: [],
};
const catalogue: PublicProblem[] = Array.from({ length: 10 }, (_, i) => ({
  ...base,
  id: "q" + (i + 1),
  primaryTopic: i < 6 ? "arrays-hashing" : "binary-search",
  step: i < 6 ? 1 + Math.floor(i / 2) : 1 + Math.floor((i - 6) / 2),
  skillIds: ["skill" + (i + 1)],
}));
for (let i = 0; i < catalogue.length; i++) {
  const p = catalogue[i];
  p.checkpointIds = catalogue
    .filter(
      (x) =>
        x.primaryTopic === p.primaryTopic && x.step === p.step && x.id !== p.id,
    )
    .map((x) => x.id);
  p.nextIds = catalogue
    .filter((x) => x.primaryTopic === p.primaryTopic && x.step === p.step + 1)
    .map((x) => x.id);
  p.remedialIds = catalogue
    .filter(
      (x) => x.primaryTopic === p.primaryTopic && x.step <= 1 && x.id !== p.id,
    )
    .map((x) => x.id);
}
function job(a: AssessmentState, changes: any = {}) {
  const q = a.questions.find((q) => q.problemId === a.currentProblemId)!;
  return {
    id: randomUUID(),
    problemId: q.problemId,
    problemVersion: q.version,
    language: a.language,
    mode: "submit",
    review: false,
    status: "accepted",
    createdAt: q.selectedAt,
    finishedAt: new Date(Date.parse(q.selectedAt) + 100).toISOString(),
    meaningfulConceptualAttempt: true,
    assessmentId: a.id,
    assessmentSelectedAt: q.selectedAt,
    assessmentAssisted: false,
    result: {
      counts: { total: 203, executed: 203, passed: 203, failed: 0, notRun: 0 },
    },
    ...changes,
  };
}
test("experience changes a conservative path-local starting probe and bounded6/8/10 target without inferring prerequisites", () => {
  const first = ["beginner", "some", "comfortable"].map((experience) =>
    startAssessment(catalogue, "python", experience as any, at),
  );
  assert.deepEqual(
    first.map((a) => a.questions[0].step),
    [1, 2, 3],
  );
  assert.deepEqual(
    first.map((a) => a.targetQuestions),
    [6, 8, 10],
  );
  for (const a of first) {
    assert.equal(a.status, "active");
    assert.equal(a.knownSkillIds.length, 0);
    assert.equal(a.unknownSkillIds.length, 10);
    assert.match(a.questions[0].reason, /not an assumption/);
  }
  assert.equal(
    startAssessment(catalogue.slice(0, 5), "python", "beginner", at).status,
    "unavailable",
  );
});
test("only current selected-language full Submit evidence counts; hidden failures and assistance never imply independent mastery", () => {
  const a = startAssessment(catalogue, "python", "beginner", at),
    selected = job(a);
  const ignored = [
    { ...selected, assessmentId: randomUUID() },
    { ...selected, language: "java" as const },
    {
      ...selected,
      mode: "run",
      result: {
        counts: { total: 3, executed: 3, passed: 3, failed: 0, notRun: 0 },
      },
    },
    { ...selected, status: "compile_error" },
    { ...selected, status: "infrastructure_error" },
    {
      ...selected,
      status: "wrong_answer",
      meaningfulConceptualAttempt: false,
      result: {
        counts: {
          total: 203,
          executed: 203,
          passed: 0,
          failed: 203,
          notRun: 0,
        },
      },
    },
    {
      ...selected,
      result: {
        counts: { total: 203, executed: 3, passed: 3, failed: 0, notRun: 200 },
      },
    },
  ];
  assert.equal(
    advanceAssessment(a, catalogue, ignored, at).completed.length,
    0,
  );
  const hiddenFail = job(a, {
    status: "wrong_answer",
    result: {
      counts: { total: 203, executed: 203, passed: 3, failed: 200, notRun: 0 },
    },
  });
  const wrong = advanceAssessment(
    a,
    catalogue,
    [hiddenFail],
    new Date(Date.parse(at) + 1000).toISOString(),
  );
  assert.equal(wrong.completed.length, 1);
  assert.equal(wrong.knownSkillIds.length, 0);
  assert.equal(wrong.observations[0].outcome, "wrong_answer");
  assert.match(wrong.message, /checkpoint|remediation/);
  const assisted = advanceAssessment(
    a,
    catalogue,
    [job(a, { assessmentAssisted: true })],
    new Date(Date.parse(at) + 1000).toISOString(),
  );
  assert.equal(assisted.knownSkillIds.length, 0);
  assert.equal(assisted.observations[0].outcome, "assisted-accepted");
});
test("multi-step fixture placement finishes6distinct observed questions, rejects reselected/duplicate and stale-session results, and preserves unknown skills on early stop", () => {
  let a = startAssessment(catalogue, "python", "beginner", at);
  const priorJobs: any[] = [];
  while (a.status === "active") {
    const current = job(a);
    priorJobs.push(current, { ...current, id: randomUUID() });
    a = advanceAssessment(
      a,
      catalogue,
      priorJobs,
      new Date(Date.parse(at) + 1000 * (a.completed.length + 1)).toISOString(),
    );
    assert.ok(a.completed.length <= 6);
  }
  assert.equal(a.status, "complete");
  assert.equal(a.completed.length, 6);
  assert.equal(new Set(a.completed).size, 6);
  assert.equal(a.knownSkillIds.length, 6);
  assert.equal(a.unknownSkillIds.length, 4);
  assert.match(a.message, /bounded placement/);
  const restarted = startAssessment(catalogue, "python", "beginner", at);
  assert.notEqual(restarted.id, a.id);
  assert.equal(
    advanceAssessment(restarted, catalogue, priorJobs, at).completed.length,
    0,
  );
  const one = advanceAssessment(
    restarted,
    catalogue,
    [job(restarted)],
    new Date(Date.parse(at) + 1000).toISOString(),
  );
  const repeated = advanceAssessment(one, catalogue, priorJobs, at);
  assert.equal(repeated.completed.length, 1);
  assert.throws(() =>
    AssessmentStateSchema.parse({
      ...one,
      currentProblemId: one.completed[0],
      currentSelectedAt: one.questions[0].selectedAt,
    }),
  );
  const stopped = stopAssessment(one, at);
  assert.equal(stopped.status, "stopped");
  assert.equal(stopped.completed.length, 1);
  assert.equal(stopped.knownSkillIds.length, 1);
  assert.equal(stopped.unknownSkillIds.length, 9);
  assert.match(stopped.message, /Stopped early/);
  assert.throws(() =>
    AssessmentStateSchema.parse({
      ...stopped,
      currentProblemId: stopped.problemIds[0],
      currentSelectedAt: stopped.questions[0].selectedAt,
    }),
  );
  const backdated = structuredClone(one);
  backdated.observations[0].createdAt = "2025-01-01T00:00:00.000Z";
  assert.throws(() => AssessmentStateSchema.parse(backdated));
});
test("legacy assessment history is retained for explicit restart rather than inferred as current independent mastery", () => {
  const legacy = {
    status: "active",
    language: "java",
    experience: "comfortable",
    problemIds: ["q1", "q2"],
    completed: ["q1"],
    currentProblemId: "q2",
    startedAt: at,
    unassessedSkills: true,
  };
  const normalized = normalizeAssessment(legacy, catalogue, "python", at);
  assert.equal(normalized.status, "stopped");
  assert.deepEqual(normalized.legacy, legacy);
  assert.equal(normalized.knownSkillIds.length, 0);
  assert.equal(normalized.completed.length, 0);
  assert.equal(normalized.language, "java");
});
