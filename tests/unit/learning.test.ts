import { test } from "node:test";
import assert from "node:assert/strict";
import {
  recommend,
  reviewDue,
  type Evidence,
} from "../../packages/learning-engine/src/index.ts";
import {
  CountsSchema,
  JsonValueSchema,
} from "../../packages/contracts/src/index.ts";
const catalogue = [
  {
    id: "a",
    status: "published",
    step: 1,
    primaryTopic: "arrays-hashing",
    skillIds: ["sum"],
    prerequisites: [],
    checkpointIds: ["c"],
    nextIds: ["b"],
  },
  {
    id: "b",
    status: "published",
    step: 2,
    primaryTopic: "arrays-hashing",
    skillIds: ["sum"],
    prerequisites: ["sum"],
  },
  {
    id: "c",
    status: "published",
    step: 1,
    primaryTopic: "arrays-hashing",
    skillIds: ["sum"],
    prerequisites: [],
  },
] as any;
const e: Evidence = {
  id: "j1",
  problemId: "a",
  language: "python",
  step: 1,
  skills: ["sum"],
  outcome: "accepted",
  assisted: false,
  review: false,
  createdAt: "2026-10-08T00:00:00Z",
};
test("draft eligibility is empty by default and explicitly scoped for internal fixtures", () => {
  const drafts = catalogue.map((p: any) => ({ ...p, status: "draft" }));
  assert.equal(recommend(drafts, [], "python").problemId, null);
  assert.equal(
    recommend(drafts, [], "python", undefined, [], undefined, ["a"]).problemId,
    "a",
  );
  assert.equal(
    recommend(drafts, [e], "python", undefined, [], undefined, ["a"]).problemId,
    null,
  );
  assert.equal(
    recommend(drafts, [e], "python", undefined, [], undefined, ["a", "b"])
      .problemId,
    "b",
  );
});
test("assisted checkpoint prerequisite bridge preserves same-step purpose, original link priority and repeated refresh", () => {
  const c = [
    { ...catalogue[0], id: "foundation", skillIds: ["base"] },
    {
      ...catalogue[0],
      id: "original",
      step: 3,
      skillIds: ["source"],
      prerequisites: ["base"],
      checkpointIds: ["z-checkpoint"],
      remedialIds: ["teacher"],
      nextIds: ["harder"],
    },
    {
      ...catalogue[0],
      id: "teacher",
      primaryTopic: "other-topic",
      skillIds: ["missing"],
      prerequisites: ["base"],
    },
    {
      ...catalogue[0],
      id: "a-other-checkpoint",
      step: 3,
      skillIds: ["other"],
      prerequisites: ["missing"],
    },
    {
      ...catalogue[0],
      id: "z-checkpoint",
      step: 3,
      skillIds: ["checkpoint"],
      prerequisites: ["missing"],
    },
    {
      ...catalogue[0],
      id: "harder",
      step: 4,
      skillIds: ["hard"],
      prerequisites: ["checkpoint"],
    },
  ] as any;
  const foundation = {
    ...e,
    id: "base",
    problemId: "foundation",
    skills: ["base"],
  };
  const assisted = {
    ...e,
    id: "assisted",
    problemId: "original",
    step: 3,
    skills: ["source"],
    assisted: true,
  };
  const r = recommend(c, [foundation, assisted], "python", "arrays-hashing");
  assert.equal(r.mode, "prerequisite_remediation");
  assert.equal(r.problemId, "teacher");
  assert.equal(r.pendingStep, 3);
  assert.equal(r.pendingMode, "same_step_checkpoint");
  assert.match(r.rationale, /same-step checkpoint/);
  assert.doesNotMatch(r.rationale, /harder next step/);
  const pending = {
    topic: "arrays-hashing",
    step: 3,
    sourceProblemId: "original",
    resumeMode: "same_step_checkpoint" as const,
  };
  const taught = {
    ...e,
    id: "taught",
    problemId: "teacher",
    skills: ["missing"],
  };
  const after = recommend(
    c,
    [foundation, assisted, taught],
    "python",
    undefined,
    [],
    pending,
  );
  assert.equal(after.focusTopic, "arrays-hashing");
  assert.equal(after.requestedStep, 3);
  assert.equal(after.mode, "same_step_checkpoint");
  assert.equal(after.problemId, "z-checkpoint");
  assert.deepEqual(
    recommend(
      c,
      [foundation, assisted, taught],
      "python",
      undefined,
      [],
      pending,
    ),
    after,
  );
  const completed = {
    ...e,
    id: "checkpoint-complete",
    problemId: "z-checkpoint",
    step: 3,
    skills: ["checkpoint"],
  };
  assert.equal(
    recommend(
      c,
      [foundation, assisted, taught, completed],
      "python",
      "arrays-hashing",
    ).problemId,
    "harder",
  );
});
test("introduced skill grants related checkpoint practice access only, never mastery or next-step access", () => {
  const source = {
    ...catalogue[0],
    id: "source",
    skillIds: ["introduced"],
    checkpointIds: ["checkpoint"],
    nextIds: ["higher"],
  };
  const checkpoint = {
    ...catalogue[0],
    id: "checkpoint",
    skillIds: ["introduced", "checkpoint-test"],
    prerequisites: ["introduced"],
  };
  const higher = {
    ...catalogue[1],
    id: "higher",
    skillIds: ["advanced"],
    prerequisites: ["introduced"],
  };
  const helped = {
    ...e,
    id: "helped",
    problemId: "source",
    skills: ["introduced"],
    assisted: true,
  };
  const history = [helped],
    before = JSON.stringify(history),
    c = [source, checkpoint, higher] as any;
  const r = recommend(c, history, "python");
  assert.equal(r.problemId, "checkpoint");
  assert.equal(r.mode, "same_step_checkpoint");
  assert.deepEqual(r.practiceSkills, ["introduced"]);
  assert.match(r.rationale, /ready to practise/);
  assert.equal(JSON.stringify(history), before);
  const failedCheckpoint = {
    ...e,
    id: "checkpoint-attempt",
    problemId: "checkpoint",
    skills: ["introduced"],
    outcome: "wrong_answer" as const,
  };
  const resumed = recommend(c, [helped, failedCheckpoint], "python");
  assert.equal(resumed.problemId, "checkpoint");
  assert.equal(resumed.mode, "resume");
  assert.deepEqual(resumed.practiceSkills, ["introduced"]);
  assert.notEqual(
    recommend(c, history, "python", undefined, ["checkpoint"]).problemId,
    "checkpoint",
  );
  assert.notEqual(
    recommend(
      c,
      [
        helped,
        { ...e, id: "solved", problemId: "checkpoint", skills: ["introduced"] },
      ],
      "python",
    ).problemId,
    "checkpoint",
  );
  assert.notEqual(
    recommend(
      [{ ...source, checkpointIds: [] }, checkpoint, higher] as any,
      history,
      "python",
    ).problemId,
    "checkpoint",
  );
  const unrelated = {
    ...checkpoint,
    id: "unrelated-known",
    prerequisites: [],
    skillIds: ["introduced"],
  };
  assert.equal(
    recommend(
      [{ ...source, checkpointIds: [] }, unrelated, higher] as any,
      history,
      "python",
    ).problemId,
    null,
  );
  assert.equal(
    recommend(
      [
        source,
        { ...checkpoint, prerequisites: ["external"] },
        unrelated,
        higher,
      ] as any,
      history,
      "python",
    ).problemId,
    null,
  );
  assert.notEqual(
    recommend(
      [source, { ...checkpoint, skillIds: ["different-test"] }, higher] as any,
      history,
      "python",
    ).problemId,
    "checkpoint",
  );
  assert.notEqual(
    recommend(
      [source, { ...checkpoint, step: 2 }, higher] as any,
      history,
      "python",
    ).problemId,
    "checkpoint",
  );
  assert.notEqual(
    recommend(
      [
        source,
        { ...checkpoint, primaryTopic: "unrelated-topic" },
        higher,
      ] as any,
      history,
      "python",
    ).problemId,
    "checkpoint",
  );
  assert.notEqual(
    recommend(c, [{ ...helped, review: true }], "python").problemId,
    "checkpoint",
  );
  assert.notEqual(
    recommend(
      [
        source,
        { ...checkpoint, prerequisites: ["introduced", "external"] },
        higher,
      ] as any,
      history,
      "python",
    ).problemId,
    "checkpoint",
  );
  assert.notEqual(
    recommend(c, [{ ...helped, outcome: "wrong_answer" }], "python").problemId,
    "checkpoint",
  );
  const pendingNext = {
    topic: "arrays-hashing",
    step: 2,
    sourceProblemId: "source",
    resumeMode: "next_step" as const,
  };
  assert.equal(
    recommend(c, history, "python", undefined, [], pendingNext).problemId,
    null,
  );
  const accepted = {
    ...e,
    id: "checkpoint-accepted",
    problemId: "checkpoint",
    skills: ["introduced", "checkpoint-test"],
  };
  assert.equal(recommend(c, [helped, accepted], "python").problemId, "higher");
});
test("three starter-language failures do not remediate, but distinct edited failures can", () => {
  const c = [
    { ...catalogue[0], id: "earlier", step: 2 },
    { ...catalogue[0], id: "current", step: 3 },
  ] as any;
  const starters = ["java", "cpp", "python"].map((language, index) => ({
    ...e,
    id: "starter-" + index,
    problemId: "current",
    step: 3,
    language: language as any,
    outcome: "wrong_answer" as const,
    codeHash: "starter-" + language,
    meaningfulConceptualAttempt: false,
  }));
  const unchanged = recommend(c, starters, "python");
  assert.equal(unchanged.requestedStep, 3);
  assert.equal(unchanged.mode, "resume");
  assert.equal(unchanged.problemId, "current");
  const edits = [0, 1, 2].map((index) => ({
    ...e,
    id: "edit-" + index,
    problemId: "current",
    step: 3,
    outcome: "wrong_answer" as const,
    codeHash: "edited-expression-" + index,
    meaningfulConceptualAttempt: true,
  }));
  const changed = recommend(c, [...starters, ...edits], "python");
  assert.equal(changed.requestedStep, 2);
  assert.equal(changed.mode, "remediation");
  assert.equal(changed.problemId, "earlier");
});
test("independent advances one actual step, assisted stays, failures do not lower, replay stable", () => {
  assert.equal(recommend(catalogue, [e], "python").problemId, "b");
  assert.equal(
    recommend(catalogue, [{ ...e, assisted: true }], "python").problemId,
    "c",
  );
  assert.deepEqual(
    recommend(catalogue, [e, e], "python"),
    recommend(catalogue, [e], "python"),
  );
  assert.equal(
    recommend(
      catalogue,
      [e, { ...e, id: "infra", outcome: "infrastructure_error" }],
      "python",
    ).problemId,
    "b",
  );
  assert.equal(recommend(catalogue, [], "python").requestedStep, 1);
  assert.equal(recommend(catalogue, [e], "java").requestedStep, 2);
  assert.equal(
    recommend(catalogue.slice(0, 1), [e], "python").mode,
    "consolidation",
  );
});
test("prerequisites unknown stay excluded; review does not grant advancement; fixed scheduling", () => {
  assert.equal(recommend([catalogue[1]], [], "python").problemId, null);
  assert.equal(
    recommend(catalogue, [{ ...e, review: true }], "python").requestedStep,
    1,
  );
  assert.equal(reviewDue(e.createdAt, 0), "2026-10-09T00:00:00.000Z");
  assert.equal(reviewDue(e.createdAt, 4), "2026-11-07T00:00:00.000Z");
});
test("runtime input and execution counts reject unsafe and fictional values", () => {
  assert.equal(
    JsonValueSchema.safeParse(Number.MAX_SAFE_INTEGER + 1).success,
    false,
  );
  assert.equal(
    CountsSchema.safeParse({
      total: 200,
      executed: 3,
      passed: 200,
      failed: 0,
      notRun: 197,
    }).success,
    false,
  );
  assert.equal(
    CountsSchema.safeParse({
      total: 200,
      executed: 3,
      passed: 3,
      failed: 0,
      notRun: 197,
    }).success,
    true,
  );
});

test("review keeps outstanding harder challenge; cross-language evidence never grants another advancement", () => {
  const c = [...catalogue, { ...catalogue[1], id: "d", step: 3 }];
  const second = { ...e, id: "new2", problemId: "b", step: 2 };
  const review = {
    ...e,
    id: "review1",
    review: true,
    createdAt: "2026-10-10T00:00:00Z",
  };
  assert.equal(recommend(c, [e, second, review], "python").requestedStep, 3);
  assert.equal(recommend(c, [e, second, review], "python").problemId, "d");
  const java = {
    ...e,
    id: "java",
    language: "java" as const,
    advancementEligible: false,
  };
  assert.equal(recommend(c, [e, java], "java").requestedStep, 2);
});
test("explicit transitions and small skill changes outrank ID; solution-exposed repeats excluded", () => {
  const c = [
    { ...catalogue[0], nextIds: ["z"] },
    { ...catalogue[1], id: "aa", skillIds: ["sum", "totally-new"] },
    { ...catalogue[1], id: "z" },
  ];
  assert.equal(recommend(c, [e], "python").problemId, "z");
  assert.equal(recommend(c, [e], "python", undefined, ["z"]).problemId, "aa");
});

test("steps stay local to the selected topic and switching back preserves the advanced path", () => {
  const c = [
    ...catalogue,
    { ...catalogue[0], id: "g7", primaryTopic: "graphs", step: 7 },
    { ...catalogue[0], id: "g8", primaryTopic: "graphs", step: 8 },
  ];
  const advanced = { ...e, id: "graph-done", problemId: "g7", step: 7 };
  assert.equal(
    recommend(c, [advanced], "python", "arrays-hashing").requestedStep,
    1,
  );
  assert.equal(recommend(c, [advanced], "python", "graphs").requestedStep, 8);
  const beginner = {
    ...e,
    id: "array-attempt",
    outcome: "wrong_answer" as const,
  };
  assert.equal(
    recommend(c, [advanced, beginner], "python", "graphs").requestedStep,
    8,
  );
  assert.equal(recommend(c, [advanced], "python").focusTopic, "graphs");
});
test("identical wrong code retries cannot trigger remediation; distinct conceptual code snapshots can", () => {
  const wrong = {
    ...e,
    id: "w1",
    step: 2,
    outcome: "wrong_answer" as const,
    problemId: "b",
    codeHash: "same",
  };
  assert.equal(
    recommend(
      catalogue,
      [e, wrong, { ...wrong, id: "2" }, { ...wrong, id: "3" }],
      "python",
    ).mode,
    "resume",
  );
  assert.equal(
    recommend(
      catalogue,
      [
        e,
        wrong,
        { ...wrong, id: "2", codeHash: "different2" },
        { ...wrong, id: "3", codeHash: "different3" },
      ],
      "python",
    ).requestedStep,
    1,
  );
});

test("an independently solved prerequisite bridge preserves the harder outstanding path", () => {
  const c = [
    ...catalogue,
    { ...catalogue[1], id: "advanced4", step: 4 },
    { ...catalogue[1], id: "advanced5", step: 5 },
  ];
  const advanced = { ...e, id: "advanced", problemId: "advanced4", step: 4 };
  const bridge = { ...e, id: "bridge", problemId: "c", step: 1 };
  assert.equal(recommend(c, [advanced, bridge], "python").requestedStep, 5);
});

test("unknown prerequisite selects an explicitly linked teacher and preserves the pending harder step", () => {
  const c = [
    {
      ...catalogue[0],
      id: "advanced",
      step: 4,
      skillIds: ["known"],
      nextIds: ["hard"],
      remedialIds: ["teacher"],
    },
    {
      ...catalogue[0],
      id: "hard",
      step: 5,
      skillIds: ["new"],
      prerequisites: ["missing"],
      remedialIds: ["teacher"],
    },
    { ...catalogue[0], id: "teacher", step: 1, skillIds: ["missing"] },
  ];
  const advanced = {
    ...e,
    id: "advanced-job",
    problemId: "advanced",
    step: 4,
    skills: ["known"],
  };
  const r = recommend(c, [advanced], "python");
  assert.equal(r.mode, "prerequisite_remediation");
  assert.equal(r.problemId, "teacher");
  assert.equal(r.selectedStep, 1);
  assert.equal(r.pendingStep, 5);
  const bridge = {
    ...e,
    id: "teacher-job",
    problemId: "teacher",
    skills: ["missing"],
  };
  const next = recommend(c, [advanced, bridge], "python");
  assert.equal(next.problemId, "hard");
  assert.equal(next.requestedStep, 5);
});

test("cross-topic prerequisite completion restores the server-owned original pending focus", () => {
  const c = [
    {
      ...catalogue[0],
      id: "tp-original",
      primaryTopic: "two-pointers",
      step: 2,
      skillIds: ["pairs"],
      nextIds: ["tp-next"],
      remedialIds: ["array-teacher"],
    },
    {
      ...catalogue[0],
      id: "tp-next",
      primaryTopic: "two-pointers",
      step: 3,
      skillIds: ["pointers"],
      prerequisites: ["signed"],
      remedialIds: ["array-teacher"],
    },
    {
      ...catalogue[0],
      id: "array-teacher",
      primaryTopic: "arrays-hashing",
      step: 1,
      skillIds: ["signed"],
    },
  ];
  const original = {
    ...e,
    id: "original",
    problemId: "tp-original",
    step: 2,
    skills: ["pairs"],
  };
  const r = recommend(c, [original], "python");
  assert.equal(r.mode, "prerequisite_remediation");
  const pending = {
    topic: "two-pointers",
    step: 3,
    sourceProblemId: "tp-original",
  };
  const teacher = {
    ...e,
    id: "teacher",
    problemId: "array-teacher",
    skills: ["signed"],
  };
  const next = recommend(
    c,
    [original, teacher],
    "python",
    undefined,
    [],
    pending,
  );
  assert.equal(next.focusTopic, "two-pointers");
  assert.equal(next.requestedStep, 3);
  assert.equal(next.problemId, "tp-next");
});
