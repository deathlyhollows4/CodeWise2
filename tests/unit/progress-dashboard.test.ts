import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { projectProgressDashboard } from "../../apps/server/src/progress-dashboard.ts";
import {
  ProgressDashboardSchema,
  type JobStatus,
} from "../../packages/contracts/src/index.ts";

const catalogue = [
  {
    id: "a",
    title: "Sum values",
    step: 1,
    status: "published",
    primaryTopic: "arrays-hashing",
    skillIds: ["sum"],
  },
  {
    id: "b",
    title: "Count matching values",
    step: 3,
    status: "published",
    primaryTopic: "arrays-hashing",
    skillIds: ["sum", "count"],
  },
  {
    id: "draft",
    title: "Unpublished fixture title",
    step: 99,
    status: "draft",
    primaryTopic: "arrays-hashing",
    skillIds: ["draft-skill"],
  },
];
const evidence = (overrides: Record<string, unknown> = {}) => ({
  id: randomUUID(),
  problemId: "a",
  language: "python" as const,
  step: 1,
  skills: ["sum"],
  outcome: "accepted" as JobStatus,
  assisted: false,
  review: false,
  createdAt: "2026-10-12T19:00:00.000Z",
  ...overrides,
});

test("completion dedupes IDs, gives independent priority and ignores nonpublished history", () => {
  const assisted = evidence({ assisted: true });
  const independent = evidence({ createdAt: "2026-10-13T00:00:00.000Z" });
  const entries = [
    assisted,
    independent,
    independent,
    evidence({ language: "java" }),
    evidence({ problemId: "old" }),
    evidence({ problemId: "draft" }),
  ];
  const data = projectProgressDashboard(catalogue, entries, [], "Asia/Kolkata");
  assert.equal(data.totalPublished, 2);
  assert.equal(data.completed, 1);
  assert.equal(data.independent, 1);
  assert.equal(data.assisted, 0);
  assert.equal(
    data.languages.find((x) => x.language === "python")!.completed,
    1,
  );
  assert.equal(
    data.activity.reduce((n, d) => n + d.submissions, 0),
    5,
  );
  ProgressDashboardSchema.parse(data);
});

test("language mastery is isolated and infrastructure/compile outcomes are neutral", () => {
  const entries = [
    evidence({ assisted: true }),
    evidence({ language: "java", outcome: "wrong_answer", step: 2 }),
    ...["infrastructure_error", "canceled", "interrupted", "compile_error"].map(
      (outcome) => evidence({ language: "cpp", outcome }),
    ),
    evidence({
      language: "cpp",
      outcome: "wrong_answer",
      meaningfulConceptualAttempt: false,
    }),
  ];
  const data = projectProgressDashboard(catalogue, entries, [], "UTC");
  assert.equal(
    data.languages.find((x) => x.language === "python")!.skills[0].status,
    "learned_with_help",
  );
  assert.equal(
    data.languages.find((x) => x.language === "java")!.skills[0].status,
    "practising",
  );
  assert.equal(
    data.languages.find((x) => x.language === "cpp")!.skills[0].status,
    "not_assessed",
  );
  assert.deepEqual(
    data.languages.find((x) => x.language === "cpp")!.skills[0].evidenceIds,
    [],
  );
  assert.equal(
    data.languages[0].skills.find((x) => x.skillId === "count")!.status,
    "not_assessed",
  );
});

test("heatmap counts submissions once at local action time, includes compile failure and excludes runs", () => {
  const accepted = evidence({ createdAt: "2026-10-13T01:00:00.000Z" });
  const jobs = [
    {
      id: accepted.id,
      mode: "submit",
      status: "accepted" as const,
      createdAt: "2026-10-12T18:29:59.000Z",
    },
    {
      id: randomUUID(),
      mode: "submit",
      status: "compile_error" as const,
      createdAt: "2026-10-12T18:30:00.000Z",
    },
    {
      id: randomUUID(),
      mode: "run",
      status: "accepted" as const,
      createdAt: "2026-10-12T18:30:00.000Z",
    },
  ];
  const data = projectProgressDashboard(
    catalogue,
    [accepted],
    [...jobs, jobs[0]],
    "Asia/Kolkata",
    "2026-10-12T18:30:00.000Z",
  );
  assert.equal(data.asOfDate, "2026-10-13");
  assert.deepEqual(data.activity, [
    { date: "2026-10-12", submissions: 1, accepted: 1 },
    { date: "2026-10-13", submissions: 1, accepted: 0 },
  ]);
});

test("fresh profiles contain zero activity and actual catalogue skill placeholders", () => {
  const data = projectProgressDashboard(
    catalogue,
    [],
    [],
    "UTC",
    "2026-10-13T00:00:00.000Z",
  );
  assert.equal(data.completed, 0);
  assert.deepEqual(data.problems, [
    { id: "a", title: "Sum values", topic: "arrays-hashing", step: 1 },
    {
      id: "b",
      title: "Count matching values",
      topic: "arrays-hashing",
      step: 3,
    },
  ]);
  assert.deepEqual(data.activity, []);
  assert.deepEqual(data.topicSkills, [
    { topic: "arrays-hashing", skillIds: ["sum", "count"], steps: [1, 3] },
  ]);
  assert(
    data.languages.every((l) =>
      l.skills.every(
        (s) => s.status === "not_assessed" && s.workingStep === null,
      ),
    ),
  );
});

test("review is language specific and highest demonstrated step survives lower review", () => {
  const data = projectProgressDashboard(
    catalogue,
    [
      evidence({ step: 4 }),
      evidence({
        review: true,
        step: 1,
        createdAt: "2026-10-13T00:00:00.000Z",
      }),
    ],
    [],
    "UTC",
  );
  const skill = data.languages.find((l) => l.language === "python")!.skills[0];
  assert.equal(skill.status, "reviewed_successfully");
  assert.equal(skill.highestIndependentStep, 4);
  assert.equal(skill.workingStep, 1);
  assert.equal(
    data.languages.find((l) => l.language === "java")!.skills[0].status,
    "not_assessed",
  );
});

test("topic paths isolate languages and preserve working step when lower reviews or language demonstrations arrive", () => {
  const working = evidence({ step: 4, advancementEligible: true });
  const java = evidence({
    language: "java",
    step: 2,
    outcome: "wrong_answer",
    advancementEligible: true,
  });
  const data = projectProgressDashboard(
    catalogue,
    [
      working,
      java,
      evidence({
        step: 1,
        review: true,
        createdAt: "2026-10-13T00:00:00.000Z",
      }),
      evidence({
        step: 2,
        advancementEligible: false,
        createdAt: "2026-10-13T01:00:00.000Z",
      }),
      evidence({ language: "cpp", step: 9, outcome: "infrastructure_error" }),
    ],
    [],
    "UTC",
  );
  assert.deepEqual(data.languages.find((l) => l.language === "python")!.paths, [
    {
      topic: "arrays-hashing",
      workingStep: 4,
      highestIndependentStep: 4,
      lastEvidenceId: working.id,
    },
  ]);
  assert.deepEqual(data.languages.find((l) => l.language === "java")!.paths, [
    {
      topic: "arrays-hashing",
      workingStep: 2,
      highestIndependentStep: null,
      lastEvidenceId: java.id,
    },
  ]);
  assert.deepEqual(data.languages.find((l) => l.language === "cpp")!.paths, [
    {
      topic: "arrays-hashing",
      workingStep: 1,
      highestIndependentStep: null,
      lastEvidenceId: null,
    },
  ]);
  ProgressDashboardSchema.parse(data);
});
