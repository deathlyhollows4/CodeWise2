import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { BackupSchema } from "../../apps/server/src/backup.ts";
import { defaultPreferences } from "../../apps/server/src/store.ts";
const empty = () => ({
  schemaVersion: 1,
  exportedAt: "2026-10-08T00:00:00Z",
  preferences: defaultPreferences,
  drafts: [],
  jobs: [],
  generations: [],
  events: [],
  assistance: [],
  evidence: [],
  recommendations: [],
  learningMetadata: { assessment: null, currentSelection: null },
});
const job = () => ({
  id: randomUUID(),
  idempotencyKey: randomUUID(),
  problemId: "p",
  problemVersion: "1",
  language: "python",
  code: "x=1",
  mode: "submit",
  review: false,
  status: "accepted",
  createdAt: "2026-10-08T00:00:00Z",
  result: {
    status: "accepted",
    counts: { total: 3, executed: 3, passed: 3, failed: 0, notRun: 0 },
    diagnostics: "All selected cases passed.",
  },
});
const generation = () => ({
  id: randomUUID(),
  idempotencyKey: randomUUID(),
  threadId: randomUUID(),
  problemId: "p",
  problemVersion: "1",
  language: "python",
  code: "x=1",
  action: "hint",
  prompt: "Help",
  consent: true,
  status: "complete",
  title: "Hint",
  markdown: "Answer",
  document: null,
  bookmarked: false,
  notes: "",
  tags: [],
  createdAt: "2026-10-08T00:00:00Z",
  provider: "deepseek",
  model: "fixture-model",
  schemaVersion: 1,
  rendererVersion: 1,
  version: 1,
  usage: null,
  verification: "not-run",
});
test("backup rejects unknown lifecycle, invalid counts, arbitrary stored fields and executable event shapes", () => {
  const b = empty() as any;
  const j = job();
  b.jobs = [j];
  assert.equal(BackupSchema.safeParse(b).success, true);
  b.jobs = [{ ...j, status: "fake-success" }];
  assert.equal(BackupSchema.safeParse(b).success, false);
  b.jobs = [{ ...j, credential: "forbidden" }];
  assert.equal(BackupSchema.safeParse(b).success, false);
  b.jobs = [
    {
      ...j,
      result: { ...j.result, counts: { ...j.result.counts, passed: 200 } },
    },
  ];
  assert.equal(BackupSchema.safeParse(b).success, false);
  b.jobs = [];
  const g = generation();
  b.generations = [g];
  b.events = [
    {
      generation: g.id,
      seq: 1,
      data: JSON.stringify({ type: "script", code: "alert(1)" }),
    },
  ];
  assert.equal(BackupSchema.safeParse(b).success, false);
});
test("backup associations bind parent/version/thread and immutable source submission", () => {
  const b = empty() as any,
    j = job(),
    g = generation();
  b.jobs = [j];
  b.generations = [{ ...g, submissionId: j.id }];
  assert.equal(BackupSchema.safeParse(b).success, true);
  b.generations = [{ ...g, submissionId: j.id, problemVersion: "different" }];
  assert.equal(BackupSchema.safeParse(b).success, false);
  b.generations = [{ ...g, parentId: randomUUID() }];
  assert.equal(BackupSchema.safeParse(b).success, false);
});
test("assessment metadata restore rejects unresolved current/completed questions", () => {
  const b = empty() as any;
  b.learningMetadata.assessment = {
    status: "active",
    problemIds: ["p"],
    completed: ["other"],
    currentProblemId: "p",
  };
  assert.equal(BackupSchema.safeParse(b).success, false);
  b.learningMetadata.assessment.completed = [];
  assert.equal(BackupSchema.safeParse(b).success, true);
});
