import { test } from "node:test";
import assert from "node:assert/strict";
import {
  prepareTutorContext,
  summarizeTutorSkills,
  publicGeneration,
} from "../../apps/server/src/tutor-context.ts";
import type { Evidence } from "../../packages/learning-engine/src/index.ts";
const base = {
  problem: {
    id: "fixture",
    version: "1",
    statement: "Fixture",
    constraints: [],
    visibleCases: [],
  },
  language: "python" as const,
  code: "learner source",
  action: "hint",
  prompt: "Explain one next step",
  prior: [],
};
test("tutor skill summary is bounded relevant independently accepted evidence, never inferred from failures or assistance", () => {
  const e: Evidence = {
    id: "a",
    problemId: "fixture",
    language: "python",
    step: 1,
    skills: ["wanted", "irrelevant"],
    outcome: "accepted",
    assisted: false,
    review: false,
    createdAt: "2026-10-08T00:00:00.000Z",
  };
  const summary = summarizeTutorSkills(
    ["wanted", "unknown"],
    [
      e,
      { ...e, id: "wrong", outcome: "wrong_answer", skills: ["unknown"] },
      { ...e, id: "helped", assisted: true, skills: ["unknown"] },
      { ...e, id: "review", review: true },
    ],
  );
  assert.deepEqual(summary, [
    {
      skillId: "wanted",
      evidenceIds: ["a", "review"],
      languages: ["python"],
      basis: "independent-accepted",
    },
  ]);
  assert.equal(
    summarizeTutorSkills(
      Array.from({ length: 100 }, (_, i) => "s" + i),
      [{ ...e, skills: Array.from({ length: 100 }, (_, i) => "s" + i) }],
    ).length,
    32,
  );
});
test("explicit partial parent is quoted with lifecycle and bounded original suffix; saved contexts remain private", () => {
  const markdown = "prior ".repeat(3000),
    prepared = prepareTutorContext({
      ...base,
      parent: {
        id: "parent",
        status: "canceled",
        prompt: "Old request",
        markdown,
      },
    });
  const payload = JSON.parse(prepared.messages.at(-1)!.content);
  assert.equal(payload.continuation.status, "canceled");
  assert.equal(payload.continuation.savedPartial, markdown.slice(-12000));
  assert.equal(
    prepared.inputBudgetTokens,
    Buffer.byteLength(JSON.stringify(prepared.messages)) + 4096,
  );
  const visible = publicGeneration({
    id: "g",
    markdown: "User-facing partial",
    contextHash: "hash",
    contextMessages: [{ role: "user", content: "PRIVATE_REFERENCE_MARKER" }],
  });
  assert.equal(visible.markdown, "User-facing partial");
  assert.equal(visible.contextHash, "hash");
  assert.ok(!JSON.stringify(visible).includes("PRIVATE_REFERENCE_MARKER"));
});
test("trusted selected-language reference is accepted only for explicit full solution and matching content version", () => {
  const verifiedReference = {
    code: "VERIFIED_REFERENCE",
    language: "python" as const,
    version: "1",
    executionIdentity: "a".repeat(64),
  };
  const payload = (input: any) =>
    JSON.parse(prepareTutorContext(input).messages.at(-1)!.content);
  for (const action of ["hint", "error", "walkthrough", "tests"])
    assert.equal(
      payload({ ...base, action, verifiedReference }).verifiedReference,
      null,
    );
  assert.deepEqual(
    payload({ ...base, action: "solution", verifiedReference })
      .verifiedReference,
    verifiedReference,
  );
  assert.equal(
    payload({
      ...base,
      action: "solution",
      language: "java",
      verifiedReference,
    }).verifiedReference,
    null,
  );
  assert.equal(
    payload({
      ...base,
      action: "solution",
      verifiedReference: { ...verifiedReference, version: "old" },
    }).verifiedReference,
    null,
  );
});

test("action-specific teaching guidance requests examples, justified reasoning and evidence-limited claims without promising tested output", () => {
  const system = (action: string) =>
    prepareTutorContext({ ...base, action, language: "cpp" }).messages[0]
      .content;
  assert.match(system("error"), /observed mistake from a hypothesis/);
  assert.match(system("error"), /Do not invent failing hidden cases/);
  assert.match(system("walkthrough"), /actual supplied visible example/);
  assert.match(system("walkthrough"), /invariant or recurrence/);
  assert.match(system("solution"), /complete C\+\+ code/);
  assert.match(system("solution"), /justified time\/space complexity/);
  assert.match(system("solution"), /newly generated code is still not tested/);
  assert.match(system("complexity"), /Define the input quantities/);
  assert.match(
    system("hint"),
    /without imposing a long template on short hints/,
  );
});
