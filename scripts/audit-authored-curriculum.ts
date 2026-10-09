import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import {
  PublicProblemSchema,
  TopicQuotas,
  type PublicProblem,
} from "../packages/contracts/src/index.ts";
import { auditCurriculum } from "../packages/learning-engine/src/curriculum-audit.ts";
import {
  recommend,
  type Evidence,
} from "../packages/learning-engine/src/index.ts";
const plannedIds = new Set(
  TopicQuotas.flatMap(([topic, , quota]) =>
    Array.from(
      { length: quota },
      (_, index) => `${topic}-${String(index + 1).padStart(2, "0")}`,
    ),
  ),
);
const root = join(process.cwd(), "content", "problems"),
  problems: PublicProblem[] = [],
  hashes: Record<string, string> = {},
  loads: any[] = [];
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const schema = PublicProblemSchema.pick({
  schemaVersion: true,
  id: true,
  version: true,
  primaryTopic: true,
  step: true,
  status: true,
  skillIds: true,
  prerequisites: true,
  checkpointIds: true,
  nextIds: true,
  remedialIds: true,
}).strip();
for (const entry of (await readdir(root, { withFileTypes: true })).sort(
  (a, b) => a.name.localeCompare(b.name),
)) {
  if (!entry.isDirectory()) continue;
  const path = join(root, entry.name, "problem.json");
  try {
    const raw = await readFile(path, "utf8");
    hashes[entry.name] = sha(raw);
    problems.push(schema.parse(JSON.parse(raw)) as PublicProblem);
  } catch (error: any) {
    loads.push({
      problemId: entry.name,
      code: "METADATA_LOAD_FAILURE",
      message:
        error.code === "ENOENT"
          ? "Pack authoring not yet materialized."
          : error.message,
    });
  }
}
const ids = problems.map((p) => p.id),
  byId = new Map(problems.map((p) => [p.id, p]));
const topology = auditCurriculum(problems, {
  maxStatesPerEntry: 1024,
  maxTotalStates: 20000,
});
const issues: any[] = [],
  checkpointCases: any[] = [],
  teacherCases: any[] = [],
  paths: any[] = [];
const evidence = (
  p: PublicProblem,
  index: number,
  assisted = false,
): Evidence => ({
  id: `simulation-${index}-${p.id}`,
  problemId: p.id,
  language: "python",
  step: p.step,
  skills: p.skillIds,
  outcome: "accepted",
  assisted,
  review: false,
  advancementEligible: true,
  createdAt: new Date(Date.UTC(2026, 9, 8, 0, 0, index)).toISOString(),
});
const known = (history: Evidence[]) =>
  new Set(history.filter((e) => !e.assisted).flatMap((e) => e.skills));
function buildPrerequisites(target: PublicProblem) {
  const history: Evidence[] = [];
  let searches = 0,
    capped = false;
  function teach(skill: string, chain = new Set<string>()): boolean {
    if (known(history).has(skill)) return true;
    if (chain.has(skill)) return false;
    if (++searches > 512 || history.length >= 32 || chain.size >= 16) {
      capped = true;
      return false;
    }
    const candidates = problems
      .filter(
        (p) =>
          p.id !== target.id &&
          p.skillIds.includes(skill) &&
          !history.some((e) => e.problemId === p.id),
      )
      .sort(
        (a, b) =>
          a.prerequisites.length - b.prerequisites.length ||
          a.step - b.step ||
          a.id.localeCompare(b.id),
      );
    for (const candidate of candidates) {
      const before = history.length;
      if (
        candidate.prerequisites.every((required) =>
          teach(required, new Set([...chain, skill])),
        )
      ) {
        history.push(evidence(candidate, history.length));
        return true;
      }
      history.splice(before);
      if (capped) break;
    }
    return false;
  }
  for (const skill of target.prerequisites) teach(skill);
  return {
    history,
    searches,
    capped,
    missing: target.prerequisites.filter((skill) => !known(history).has(skill)),
  };
}
for (const p of problems) {
  const preparation = buildPrerequisites(p);
  const required = p.prerequisites.map((skill) => ({
    skill,
    teachers: problems
      .filter((t) => t.id !== p.id && t.skillIds.includes(skill))
      .map((t) => t.id),
    linkedTeachers: p.remedialIds.filter((id) =>
      byId.get(id)?.skillIds.includes(skill),
    ),
  }));
  teacherCases.push({
    problemId: p.id,
    required,
    preparedBy: preparation.history.map((e) => e.problemId),
    unresolved: preparation.missing,
    searchCapped: preparation.capped,
  });
  for (const entry of required)
    if (!entry.teachers.length)
      issues.push({
        code: "UNTAUGHT_PREREQUISITE",
        problemId: p.id,
        skills: [entry.skill],
        message:
          "No other authored task declares this prerequisite skill as taught.",
      });
  if (preparation.missing.length) {
    issues.push({
      code: preparation.capped
        ? "PREREQUISITE_PREPARATION_UNVERIFIED"
        : "PREREQUISITE_PREPARATION_BLOCKED",
      problemId: p.id,
      skills: preparation.missing,
      message:
        "Bounded prerequisite-only teacher construction cannot demonstrate all prerequisites without borrowing unknown skills.",
    });
    continue;
  }
  const history = [
    ...preparation.history,
    evidence(p, preparation.history.length, true),
  ];
  let r = recommend(
    problems,
    history,
    "python",
    p.primaryTopic,
    [],
    undefined,
    ids,
  );
  const bridgeTrace: any[] = [];
  for (
    let turn = 0;
    turn < 16 && r.mode === "prerequisite_remediation" && r.problemId;
    turn++
  ) {
    if (r.pendingMode !== "same_step_checkpoint")
      issues.push({
        code: "ASSISTED_PENDING_MODE_LOST",
        problemId: p.id,
        message: "The prerequisite bridge lost its SAME_STEP purpose.",
      });
    const teacher = byId.get(r.problemId)!;
    if (history.some((e) => e.problemId === teacher.id)) break;
    const pending = {
      topic: p.primaryTopic,
      step: p.step,
      sourceProblemId: p.id,
      resumeMode: "same_step_checkpoint" as const,
    };
    history.push(evidence(teacher, history.length));
    r = recommend(problems, history, "python", undefined, [], pending, ids);
    const repeated = recommend(
      problems,
      history,
      "python",
      undefined,
      [],
      pending,
      ids,
    );
    bridgeTrace.push({
      teacherId: teacher.id,
      pending,
      recommendation: r,
      stableRefresh: JSON.stringify(r) === JSON.stringify(repeated),
    });
    if (
      r.requestedStep !== p.step ||
      r.focusTopic !== p.primaryTopic ||
      JSON.stringify(r) !== JSON.stringify(repeated)
    )
      issues.push({
        code: "ASSISTED_PENDING_FOCUS_LOST",
        problemId: p.id,
        targetId: teacher.id,
        message:
          "Teacher completion or refresh displaced the assisted original path/step.",
      });
  }
  const unseen =
      r.problemId && !history.some((e) => e.problemId === r.problemId),
    sameStep = r.requestedStep === p.step && r.selectedStep === p.step;
  checkpointCases.push({
    problemId: p.id,
    priorIndependentIds: preparation.history.map((e) => e.problemId),
    checkpointIds: p.checkpointIds,
    bridgeTrace,
    recommendation: r,
    unseen: !!unseen,
    sameStep,
  });
  if (!r.problemId || !unseen || !sameStep)
    issues.push({
      code:
        p.checkpointIds.some((id) => byId.get(id)?.step === p.step) &&
        p.checkpointIds
          .filter((id) => byId.get(id)?.step === p.step)
          .every((id) =>
            history.some((e) => e.problemId === id && e.outcome === "accepted"),
          )
          ? "FINITE_HISTORY_CHECKPOINT_EXHAUSTION"
          : "NO_ELIGIBLE_UNSEEN_ASSISTED_CHECKPOINT",
      problemId: p.id,
      targetId: r.problemId,
      skills: preparation.missing,
      blockedCandidates: problems
        .filter(
          (candidate) =>
            candidate.primaryTopic === p.primaryTopic &&
            candidate.step === p.step &&
            candidate.id !== p.id &&
            !history.some((e) => e.problemId === candidate.id),
        )
        .map((candidate) => ({
          problemId: candidate.id,
          missing: candidate.prerequisites.filter(
            (skill) => !known(history).has(skill),
          ),
          linkedEligibleTeachers: [
            ...p.remedialIds,
            ...candidate.remedialIds,
          ].filter((id) => {
            const teacher = byId.get(id);
            return (
              teacher &&
              !history.some((e) => e.problemId === id) &&
              teacher.prerequisites.every((skill) => known(history).has(skill))
            );
          }),
        })),
      message: `Actual engine returns ${r.mode} after assisted acceptance; no unseen eligible same-step challenge was selected.`,
    });
}
const entries = problems.filter((p) => !p.prerequisites.length);
let totalTurns = 0;
for (const entry of entries) {
  let history = [evidence(entry, 0)],
    pending:
      | undefined
      | { topic: string; step: number; sourceProblemId?: string },
    trace: any[] = [];
  const visited = new Set([entry.id]);
  for (let turn = 0; turn < 64 && totalTurns < 10000; turn++, totalTurns++) {
    const r = recommend(
      problems,
      history,
      "python",
      pending ? undefined : entry.primaryTopic,
      [],
      pending,
      ids,
    );
    trace.push({ after: history.at(-1)?.problemId, recommendation: r });
    if (!r.problemId) {
      const workingKnown = known(history),
        blocked = problems
          .filter(
            (p) =>
              p.primaryTopic === r.focusTopic &&
              p.step === r.requestedStep &&
              !visited.has(p.id),
          )
          .map((p) => ({
            problemId: p.id,
            missing: p.prerequisites.filter(
              (skill) => !workingKnown.has(skill),
            ),
            linkedTeachers: p.remedialIds
              .map((id) => byId.get(id))
              .filter(Boolean)
              .map((p) => ({
                id: p!.id,
                skills: p!.skillIds,
                unknown: p!.prerequisites.filter(
                  (skill) => !workingKnown.has(skill),
                ),
                alreadySolved: visited.has(p!.id),
              })),
          }));
      if (blocked.length)
        issues.push({
          code: "ACTUAL_PATH_BLOCKED_AT_AUTHORED_STEP",
          problemId: history.at(-1)!.problemId,
          entryId: entry.id,
          requestedStep: r.requestedStep,
          focusTopic: r.focusTopic,
          blocked,
          message:
            "Actual deterministic recommendation found no eligible challenge or prerequisite teacher at an authored next step.",
        });
      break;
    }
    if (visited.has(r.problemId)) {
      issues.push({
        code: "RECOMMENDATION_REPEATS_SOLVED_TASK",
        problemId: r.problemId,
        entryId: entry.id,
        message:
          "Actual recommendation returned a previously solved simulation task.",
      });
      break;
    }
    const target = byId.get(r.problemId)!;
    if (r.mode === "prerequisite_remediation")
      pending = {
        topic: r.focusTopic!,
        step: r.pendingStep!,
        sourceProblemId: r.sourceProblemId,
      };
    const beforePending = pending;
    history.push(evidence(target, history.length));
    visited.add(target.id);
    if (
      beforePending &&
      target.primaryTopic === beforePending.topic &&
      target.step === beforePending.step
    ) {
      trace.push({
        originalTargetCompleted: target.id,
        clearedPending: beforePending,
      });
      pending = undefined;
      continue;
    }
    if (beforePending) {
      const refreshed = recommend(
          problems,
          history,
          "python",
          undefined,
          [],
          beforePending,
          ids,
        ),
        stable = recommend(
          problems,
          history,
          "python",
          undefined,
          [],
          beforePending,
          ids,
        );
      trace.push({
        teacherAccepted: target.id,
        preservedPending: beforePending,
        refreshed,
        stableRefresh: JSON.stringify(refreshed) === JSON.stringify(stable),
      });
      if (
        refreshed.focusTopic !== beforePending.topic ||
        refreshed.requestedStep !== beforePending.step ||
        JSON.stringify(refreshed) !== JSON.stringify(stable)
      )
        issues.push({
          code: "PENDING_ORIGINAL_FOCUS_LOST",
          problemId: target.id,
          entryId: entry.id,
          message:
            "Teacher acceptance or repeated refresh displaced the original pending path/step.",
          beforePending,
          refreshed,
        });
      if (
        target.primaryTopic === beforePending.topic &&
        target.step === beforePending.step
      )
        pending = undefined;
    }
  }
  paths.push({
    entryId: entry.id,
    trace,
    acceptedIds: history.map((e) => e.problemId),
    pending: pending ?? null,
  });
}
const hashesAfter = Object.fromEntries(
  await Promise.all(
    Object.keys(hashes).map(async (id) => [
      id,
      sha(await readFile(join(root, id, "problem.json"), "utf8")),
    ]),
  ),
);
const unique = [
  ...new Map(
    [
      ...loads,
      ...topology.issues.filter(
        (issue) =>
          ![
            "UNREACHABLE_FROM_ENTRY",
            "UNMET_PATH_PREREQUISITE",
            "ASSISTED_CHECKPOINT_PREREQUISITE",
          ].includes(issue.code),
      ),
      ...issues,
    ].map((issue) => [JSON.stringify(issue), issue]),
  ).values(),
];
for (const issue of unique)
  if (
    issue.code === "MISSING_TARGET" &&
    plannedIds.has(issue.targetId) &&
    !byId.has(issue.targetId)
  )
    issue.classification = "pending-authoring";
for (const issue of unique)
  if (issue.code === "FINITE_HISTORY_CHECKPOINT_EXHAUSTION") {
    issue.classification = "finite-history-exhaustion";
    issue.severity = "informational";
    issue.message =
      "All authored related peers in this representative history were already independently solved as necessary teachers. Consolidation is finite-history exhaustion, not proof of a missing prerequisite route.";
  }
const report = {
  schemaVersion: 1,
  command:
    "node --import tsx scripts/audit-authored-curriculum.ts" +
    (process.argv.includes("--release") ? " --release" : ""),
  generatedAt: new Date().toISOString(),
  runtime: {
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
  },
  scope:
    "read-only current materialized metadata; drafts simulated explicitly, no persistence or mastery writes",
  problemCount: problems.length,
  sourceHashes: hashes,
  sourceChangedDuringAudit:
    JSON.stringify(hashes) !== JSON.stringify(hashesAfter),
  bounds: {
    maxPrerequisiteTeachers: 32,
    maxPrerequisiteSearches: 512,
    maxAssistedBridges: 16,
    maxTransitionsPerEntry: 64,
    maxTotalTransitions: 10000,
  },
  totalTransitions: totalTurns,
  exhaustiveLearnerHistoryClaim: false,
  graphCoverage:
    "learning modules not_tracked; direct source/public manifest fallback",
  issues: unique,
  emptyFocusedEntries: TopicQuotas.map(([topic]) => ({
    topic,
    ...recommend(
      problems,
      [],
      "python",
      topic,
      [],
      undefined,
      problems.map((p) => p.id),
    ),
  })),
  checkpointCases,
  teacherCases,
  paths,
  recordedTopologyOnly: topology,
  limitations: [
    "Prerequisite preparation is a deterministic representative construction, not all possible learner histories.",
    "Future unmaterialized targets remain explicit pending authoring gaps.",
    "Pure metadata topology reachability excludes remediation; actual engine traces separately exercise teacher bridges.",
    "No referenced task, skill declaration or learner-code execution is validated by this read-only audit.",
  ],
};
const releaseFailures = [
  ...unique.filter((issue) => issue.severity !== "informational"),
  ...(report.sourceChangedDuringAudit
    ? [{ code: "SOURCE_CHANGED_DURING_AUDIT" }]
    : []),
  ...(problems.length !== plannedIds.size
    ? [{ code: "INCOMPLETE_CATALOGUE_SCOPE" }]
    : []),
  ...report.emptyFocusedEntries
    .filter((entry) => !entry.problemId)
    .map((entry) => ({
      code: "EMPTY_FOCUS_PREREQUISITE_GAP",
      topic: entry.topic,
    })),
  ...(totalTurns >= 10000 ? [{ code: "TOTAL_TRANSITION_CAP_REACHED" }] : []),
  ...(topology.capped ? [{ code: "TOPOLOGY_EXPLORATION_CAP_REACHED" }] : []),
  ...paths
    .filter((path) => path.trace.length >= 64)
    .map((path) => ({
      code: "ENTRY_TRANSITION_CAP_REACHED",
      problemId: path.entryId,
    })),
];
Object.assign(report, {
  releaseMode: process.argv.includes("--release"),
  releasePassed: releaseFailures.length === 0,
  releaseFailures,
});
if (process.argv.includes("--release") && releaseFailures.length)
  process.exitCode = 1;
await writeFile(
  "docs/release-evidence/authored-curriculum-r21.json",
  JSON.stringify(report, null, 2),
);
await writeFile(
  "docs/release-evidence/authored-curriculum-r21.md",
  `# R21 authored curriculum audit\n\n${problems.length} materialized tasks; ${totalTurns} deterministic transitions. No exhaustive history coverage or execution claim.\n\n` +
    unique
      .map(
        (issue) =>
          `- **${issue.problemId}** ${issue.code}${issue.targetId ? " → " + issue.targetId : ""}${issue.skills?.length ? " [" + issue.skills.join(", ") + "]" : ""}: ${issue.message}`,
      )
      .join("\n") +
    "\n",
);
console.log(
  JSON.stringify({
    problemCount: problems.length,
    issues: unique.length,
    totalTransitions: totalTurns,
    sourceChangedDuringAudit: report.sourceChangedDuringAudit,
    report: "docs/release-evidence/authored-curriculum-r21.json",
  }),
);
