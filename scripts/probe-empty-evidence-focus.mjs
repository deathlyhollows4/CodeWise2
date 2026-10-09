import { readFileSync, writeFileSync } from "node:fs";
import { getPublicProblem } from "../packages/judge-adapter/src/content.mjs";
import {
  recommend,
  RULE_VERSION,
} from "../packages/learning-engine/src/index.ts";
import { TopicQuotas } from "../packages/contracts/src/index.ts";
const ids = JSON.parse(
    readFileSync("content/catalogue.json", "utf8"),
  ).problems.map((p) => p.id),
  catalogue = await Promise.all(ids.map((id) => getPublicProblem(id)));
const results = TopicQuotas.map(([topic]) => ({
  topic,
  ...recommend(catalogue, [], "python", topic, [], undefined, ids),
}));
const traces = TopicQuotas.map(([topic]) => {
  const evidence = [],
    seen = new Set(),
    steps = [];
  let pending;
  for (let iteration = 0; iteration < 32; iteration++) {
    const r = recommend(catalogue, evidence, "python", topic, [], pending, ids);
    steps.push({
      problemId: r.problemId,
      mode: r.mode,
      requestedStep: r.requestedStep,
      focusTopic: r.focusTopic,
    });
    const selected = catalogue.find((p) => p.id === r.problemId);
    if (!selected)
      return {
        topic,
        passed: false,
        reason: "No eligible explicit route",
        steps,
      };
    if (r.mode !== "prerequisite_remediation")
      return {
        topic,
        passed:
          selected.primaryTopic === topic &&
          selected.step === 1 &&
          r.requestedStep === 1,
        steps,
      };
    if (seen.has(selected.id))
      return { topic, passed: false, reason: "Repeated teacher route", steps };
    seen.add(selected.id);
    pending = {
      topic,
      step: r.pendingStep,
      sourceProblemId: r.sourceProblemId,
      resumeMode: r.pendingMode,
    };
    // Explicit hypothetical full independent teacher outcome for metadata replay only. No database or real learner mastery is written.
    evidence.push({
      id: `simulation-${topic}-${iteration}`,
      problemId: selected.id,
      language: "python",
      step: selected.step,
      skills: selected.skillIds,
      outcome: "accepted",
      assisted: false,
      review: false,
      advancementEligible: true,
      createdAt: new Date(Date.UTC(2026, 9, 8, 0, 0, iteration)).toISOString(),
    });
  }
  return {
    topic,
    passed: false,
    reason: "Declared32-teacher bound reached",
    steps,
  };
});
writeFileSync(
  "docs/release-evidence/independent-empty-evidence-focus-probe.json",
  JSON.stringify(
    {
      command: "node --import tsx scripts/probe-empty-evidence-focus.mjs",
      generatedAt: new Date().toISOString(),
      ruleVersion: RULE_VERSION,
      topics: results.length,
      scope:
        "actual current public metadata/pure engine simulation; no mastery/native execution",
      results,
      traces,
      passed:
        results.length === 18 &&
        results.every((r) => r.problemId) &&
        traces.every((t) => t.passed),
      coverageBound:
        "One deterministic empty-evidence route per topic, at most32 hypothetical teacher accepts each; not exhaustive learner-history coverage",
    },
    null,
    2,
  ) + "\n",
);
console.log(
  results.map((r) => ({ topic: r.topic, id: r.problemId, mode: r.mode })),
);
if (traces.some((t) => !t.passed)) process.exitCode = 1;
