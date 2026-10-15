import { test } from "node:test";
import assert from "node:assert/strict";
import {
  prepareTutorContext,
  summarizeTutorSkills,
  publicGeneration,
  tutorOutputPolicy,
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
  for (const action of ["hint", "error", "walkthrough", "tests", "idea_map"])
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

test("idea map guidance requests only a complete algorithm graph grounded in public context without solver code or private references", () => {
  const prepared = prepareTutorContext({ ...base, action: "idea_map" });
  const policy = prepared.messages[0].content;
  assert.match(policy, /supplied public problem and constraints/);
  assert.match(policy, /exactly one fenced ```idea-map/);
  assert.match(
    policy,
    /Include no headings, prose, explanations, complexity discussion, or other text before or after the block/,
  );
  assert.doesNotMatch(
    policy,
    /Use meaningful headings|Finish with|Briefly restate|explain why it fits/,
  );
  assert.match(policy, /24 nodes and 48 edges/);
  assert.match(policy, /complete algorithm/);
  assert.match(policy, /not solver code/);
  assert.match(policy, /not evidence of correctness or execution/);
  const context = JSON.parse(prepared.messages.at(-1)!.content);
  assert.equal(context.action, "idea_map");
  assert.deepEqual(context.problem, base.problem);
  assert.equal(context.verifiedReference, null);
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
    system("complexity"),
    /allocation, initialization and materialization of mandatory output in time cost/,
  );
  assert.match(
    system("complexity"),
    /auxiliary space excludes the returned output/,
  );
  assert.match(
    system("complexity"),
    /Do not assume duplicate input entries are bounded/,
  );
  assert.match(
    system("complexity"),
    /incomplete starter is not a completed algorithm/,
  );
  assert.match(
    system("complexity"),
    /Mandatory output size is a lower bound on final time/,
  );
  assert.match(
    system("complexity"),
    /r-by-c dense output costs O\(r\*c\).*n-by-n output costs O\(n\^2\)/,
  );
  assert.match(
    system("complexity"),
    /Sum or take the maximum of actual phase costs in the final time Big-O/,
  );
  assert.match(
    system("complexity"),
    /final time bound explicitly includes the output construction bound/,
  );
  assert.match(
    system("hint"),
    /without imposing a long template on short hints/,
  );
});

test("short tutor actions have bounded prose policies, diagrams have a schema-sized budget, solutions retain detail", () => {
  const system = (action: string, hintDepth?: "nudge" | "concept" | "steps") =>
    prepareTutorContext({ ...base, action, hintDepth }).messages[0].content;
  assert.match(system("hint", "nudge"), /one sentence, at most 30 words/);
  assert.match(
    system("hint", "concept"),
    /1-3 short sentences, at most 60 words/,
  );
  assert.match(
    system("hint", "steps"),
    /three short sentences or bullets, at most 60 words/,
  );
  assert.match(
    system("complexity"),
    /time and auxiliary space bounds.*100 words/,
  );
  for (const action of ["error", "simplify", "followup"])
    assert.match(system(action), /within 100 words/);
  assert.match(system("walkthrough"), /within 150 words/);
  assert.match(system("idea_map"), /prefer 6-10 nodes/);
  assert.doesNotMatch(system("solution"), /within \d+ words|at most \d+ words/);
  for (const action of [
    "hint",
    "error",
    "simplify",
    "followup",
    "complexity",
    "walkthrough",
    "idea_map",
  ]) {
    assert.equal(tutorOutputPolicy(action, 128).maxOutputTokens, 128);
    assert.equal(tutorOutputPolicy(action, 4096).thinking, "disabled");
  }
  assert.equal(tutorOutputPolicy("idea_map", 1525).maxOutputTokens, 1525);
  assert.equal(tutorOutputPolicy("idea_map", 4096).maxOutputTokens, 2048);
  assert.deepEqual(tutorOutputPolicy("solution", 4096), {
    maxOutputTokens: 4096,
  });
  assert.deepEqual(tutorOutputPolicy("solution", 128), {
    maxOutputTokens: 128,
  });
});
