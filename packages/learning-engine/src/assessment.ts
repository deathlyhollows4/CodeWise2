import { randomUUID } from "node:crypto";
import {
  AssessmentStateSchema,
  LegacyAssessmentSchema,
  TopicQuotas,
  submissionCountMeetsScope,
  type AssessmentState,
  type PublicProblem,
  type Language,
} from "../../contracts/src/index.ts";
const core = [
  "arrays-hashing",
  "two-pointers",
  "binary-search",
  "dp-1d",
  "stack",
  "sliding-window",
  "trees",
  "heap",
];
export const ASSESSMENT_RULE_VERSION = "assessment-1";
type Experience = AssessmentState["experience"];
type PlacementJob = {
  id: string;
  problemId: string;
  problemVersion?: string;
  language: Language;
  mode: string;
  review?: boolean;
  status: string;
  createdAt: string;
  finishedAt?: string;
  meaningfulConceptualAttempt?: boolean;
  assessmentId?: string;
  assessmentSelectedAt?: string;
  assessmentAssisted?: boolean;
  result?: {
    counts: {
      total: number;
      executed: number;
      passed: number;
      failed: number;
      notRun: number;
      unverified?: number;
    };
  } | null;
};
const pool = (
  catalogue: PublicProblem[],
  language: Language,
  fixtures: string[],
) =>
  catalogue.filter(
    (p) =>
      core.includes(p.primaryTopic) &&
      (p.status === "published" || fixtures.includes(p.id)) &&
      !!p.starters[language],
  );
function unknown(catalogue: PublicProblem[], known: string[]) {
  return [...new Set(catalogue.flatMap((p) => p.skillIds))]
    .filter((id) => !known.includes(id))
    .sort();
}
export function emptyAssessment(
  catalogue: PublicProblem[],
  language: Language,
): AssessmentState {
  return AssessmentStateSchema.parse({
    schemaVersion: 2,
    ruleVersion: ASSESSMENT_RULE_VERSION,
    id: randomUUID(),
    status: "not_started",
    experience: "beginner",
    language,
    targetQuestions: 6,
    problemIds: [],
    completed: [],
    currentProblemId: null,
    currentSelectedAt: null,
    questions: [],
    observations: [],
    knownSkillIds: [],
    unknownSkillIds: unknown(catalogue, []),
    unassessedSkills: true,
    message:
      "The welcome check has not started. Untested skills remain unknown.",
  });
}
function initial(candidates: PublicProblem[], experience: Experience) {
  for (const topic of core) {
    const path = candidates.filter((p) => p.primaryTopic === topic);
    if (!path.length) continue;
    const entry = Math.min(...path.map((p) => p.step));
    if (entry > 1) continue;
    const depth = { beginner: 0, some: 1, comfortable: 2 }[experience],
      target = entry + depth;
    const early = path
      .filter((p) => p.step <= target)
      .sort((a, b) => b.step - a.step || a.id.localeCompare(b.id));
    if (early.length) return early[0];
  }
  return null;
}
function select(
  a: AssessmentState,
  p: PublicProblem,
  at: string,
  reason: string,
): AssessmentState {
  a.problemIds.push(p.id);
  a.questions.push({
    problemId: p.id,
    version: p.version,
    title: p.title.slice(0, 300),
    topic: p.primaryTopic,
    step: p.step,
    skillIds: p.skillIds.slice(0, 50),
    selectedAt: at,
    reason,
  });
  a.currentProblemId = p.id;
  a.currentSelectedAt = at;
  a.message = reason;
  return AssessmentStateSchema.parse(a);
}
export function startAssessment(
  catalogue: PublicProblem[],
  language: Language,
  experience: Experience,
  at: string,
  fixtures: string[] = [],
): AssessmentState {
  const available = pool(catalogue, language, fixtures),
    state = emptyAssessment(catalogue, language);
  state.experience = experience;
  state.startedAt = at;
  state.targetQuestions = Math.max(
    6,
    Math.min(
      { beginner: 6, some: 8, comfortable: 10 }[experience],
      available.length,
    ),
  );
  const first = initial(available, experience);
  if (available.length < 6 || !first) {
    state.status = "unavailable";
    state.message =
      "At least six real core questions with an early starting point are needed. No placement or mastery has been inferred.";
    return AssessmentStateSchema.parse(state);
  }
  state.status = "active";
  const topic =
    TopicQuotas.find(([id]) => id === first.primaryTopic)?.[1] ??
    first.primaryTopic;
  return select(
    state,
    first,
    at,
    `Your reported ${experience} experience starts with an early ${topic} probe: ${first.objective}. This is a question to assess, not an assumption that its prerequisites are known.`,
  );
}
function outcome(job: PlacementJob) {
  const c = job.result?.counts;
  if (
    !c ||
    !submissionCountMeetsScope(job.problemId, c.total) ||
    c.executed + c.notRun !== c.total ||
    c.passed + c.failed + (c.unverified ?? 0) !== c.executed
  )
    return null;
  if (
    job.status === "accepted" &&
    c.executed === c.total &&
    c.passed === c.total &&
    c.failed === 0 &&
    c.notRun === 0 &&
    (c.unverified ?? 0) === 0 &&
    typeof job.assessmentAssisted === "boolean"
  )
    return job.assessmentAssisted
      ? "assisted-accepted"
      : "independent-accepted";
  if (
    job.status === "wrong_answer" &&
    c.executed > 0 &&
    c.failed > 0 &&
    job.meaningfulConceptualAttempt === true
  )
    return "wrong_answer";
  return null;
}
function nextProbe(
  a: AssessmentState,
  available: PublicProblem[],
  source: PublicProblem,
  observed: string,
) {
  const unused = available.filter((p) => !a.problemIds.includes(p.id)),
    counts = (topic: string) =>
      a.questions.filter((q) => q.topic === topic).length;
  const linked =
    observed === "independent-accepted" ? source.nextIds : source.checkpointIds;
  const related = unused
    .filter(
      (p) =>
        linked.includes(p.id) &&
        p.primaryTopic === source.primaryTopic &&
        p.step ===
          (observed === "independent-accepted" ? source.step + 1 : source.step),
    )
    .sort((x, y) => x.id.localeCompare(y.id));
  if (counts(source.primaryTopic) < 2 && related[0])
    return {
      problem: related[0],
      reason:
        observed === "independent-accepted"
          ? "Independent full-suite success probes the next linked increment."
          : "This same-level checkpoint probes the requirement again without assuming independent knowledge.",
    };
  if (observed !== "independent-accepted") {
    const remedial = unused
      .filter((p) => source.remedialIds.includes(p.id) && p.step <= source.step)
      .sort((x, y) => y.step - x.step || x.id.localeCompare(y.id));
    if (remedial[0])
      return {
        problem: remedial[0],
        reason:
          "The observed result calls for an explicit foundation/remediation probe; this does not lower any previously demonstrated skill.",
      };
  }
  const topics = [...core].sort(
    (x, y) => counts(x) - counts(y) || core.indexOf(x) - core.indexOf(y),
  );
  for (const topic of topics) {
    const path = unused.filter((p) => p.primaryTopic === topic),
      candidate = initial(path, a.experience);
    if (candidate)
      return {
        problem: candidate,
        reason:
          "A breadth probe checks another unobserved core requirement; skills outside the observed questions remain unknown.",
      };
  }
  for (const topic of topics) {
    const observed = a.questions.filter(
      (q) =>
        q.topic === topic &&
        a.observations.some(
          (o) =>
            o.problemId === q.problemId && o.outcome === "independent-accepted",
        ),
    );
    if (!observed.length) continue;
    const maximum = Math.max(...observed.map((q) => q.step));
    const relatedIds = new Set(
      observed.flatMap((q) => {
        const p = available.find((p) => p.id === q.problemId);
        return [...(p?.nextIds ?? []), ...(p?.checkpointIds ?? [])];
      }),
    );
    const candidate = unused
      .filter(
        (p) =>
          p.primaryTopic === topic &&
          p.step <= maximum + 1 &&
          relatedIds.has(p.id),
      )
      .sort((x, y) => x.step - y.step || x.id.localeCompare(y.id))[0];
    if (candidate)
      return {
        problem: candidate,
        reason:
          "A fresh linked probe checks a remaining requirement within this already observed path; no untested prerequisite is granted.",
      };
  }
  if (related[0])
    return {
      problem: related[0],
      reason:
        "The next linked task probes one increment within this path; untested prerequisites remain unknown.",
    };
  const entry = unused
    .filter((p) => p.step <= 1)
    .sort((x, y) => x.id.localeCompare(y.id))[0];
  return entry
    ? {
        problem: entry,
        reason:
          "An unseen early foundation question checks remaining unknown skills.",
      }
    : null;
}
function summary(a: AssessmentState, prefix: string) {
  const language = { python: "Python", java: "Java", cpp: "C++" }[a.language];
  const questions = `${a.completed.length} ${a.completed.length === 1 ? "question" : "questions"}`;
  const known = `${a.knownSkillIds.length} ${a.knownSkillIds.length === 1 ? "skill" : "skills"}`;
  const unknown = `${a.unknownSkillIds.length} available ${a.unknownSkillIds.length === 1 ? "skill remains" : "skills remain"}`;
  return `${prefix} Outcomes observed for ${questions}. You independently demonstrated ${known} in ${language}. ${unknown} unassessed. This is bounded placement; other skills are still unknown.`;
}
function consumeCurrentObservation(
  a: AssessmentState,
  catalogue: PublicProblem[],
  jobs: PlacementJob[],
) {
  const selected = a.questions.find((q) => q.problemId === a.currentProblemId)!;
  const relevant = jobs
    .filter(
      (j) =>
        j.assessmentId === a.id &&
        j.assessmentSelectedAt === selected.selectedAt &&
        j.problemId === selected.problemId &&
        j.problemVersion === selected.version &&
        j.language === a.language &&
        j.mode === "submit" &&
        !j.review &&
        Date.parse(j.createdAt) >= Date.parse(selected.selectedAt) &&
        !!j.finishedAt &&
        Date.parse(j.finishedAt) >= Date.parse(selected.selectedAt),
    )
    .map((job) => ({ job, outcome: outcome(job) }))
    .filter((x) => x.outcome)
    .sort(
      (x, y) =>
        Number(y.outcome === "independent-accepted") -
          Number(x.outcome === "independent-accepted") ||
        Date.parse(y.job.finishedAt!) - Date.parse(x.job.finishedAt!),
    );
  const observed = relevant[0];
  if (!observed) {
    a.message =
      "No eligible finished full Submit attempt in the selected language has assessed this question. Visible runs, starter-only failures and infrastructure/compile errors do not establish placement; retry or stop early.";
    return null;
  }
  a.completed.push(selected.problemId);
  a.observations.push({
    jobId: observed.job.id,
    problemId: selected.problemId,
    outcome: observed.outcome as
      | "independent-accepted"
      | "assisted-accepted"
      | "wrong_answer",
    createdAt: observed.job.finishedAt!,
    skillIds: selected.skillIds,
  });
  a.knownSkillIds = [
    ...new Set(
      a.observations
        .filter((o) => o.outcome === "independent-accepted")
        .flatMap((o) => o.skillIds),
    ),
  ].sort();
  a.unknownSkillIds = unknown(catalogue, a.knownSkillIds);
  return { selected, observed };
}
export function advanceAssessment(
  saved: AssessmentState,
  catalogue: PublicProblem[],
  jobs: PlacementJob[],
  at: string,
  fixtures: string[] = [],
): AssessmentState {
  const a = AssessmentStateSchema.parse(structuredClone(saved));
  if (a.status !== "active") return a;
  const consumed = consumeCurrentObservation(a, catalogue, jobs);
  if (!consumed) return AssessmentStateSchema.parse(a);
  const { selected, observed } = consumed;
  if (a.completed.length >= a.targetQuestions) {
    a.status = "complete";
    a.currentProblemId = null;
    a.currentSelectedAt = null;
    a.message = summary(a, "Welcome check complete.");
    return AssessmentStateSchema.parse(a);
  }
  const available = pool(catalogue, a.language, fixtures),
    source = available.find(
      (p) => p.id === selected.problemId && p.version === selected.version,
    ),
    next = source ? nextProbe(a, available, source, observed.outcome!) : null;
  if (!next) {
    a.status = "stopped";
    a.currentProblemId = null;
    a.currentSelectedAt = null;
    a.stoppedAt = at;
    a.message = summary(
      a,
      "No fresh eligible probe remains; restart after the core bank is available.",
    );
    return AssessmentStateSchema.parse(a);
  }
  return select(
    a,
    next.problem,
    at,
    next.reason + " " + next.problem.objective,
  );
}
export function stopAssessment(
  saved: AssessmentState,
  at: string,
  catalogue: PublicProblem[] = [],
  jobs: PlacementJob[] = [],
): AssessmentState {
  const a = AssessmentStateSchema.parse(structuredClone(saved));
  if (a.status !== "active") return a;
  consumeCurrentObservation(a, catalogue, jobs);
  a.status = a.completed.length >= a.targetQuestions ? "complete" : "stopped";
  a.currentProblemId = null;
  a.currentSelectedAt = null;
  a.stoppedAt = at;
  a.message = summary(
    a,
    a.status === "complete"
      ? "Welcome check complete."
      : "Stopped early; observed evidence is preserved.",
  );
  return AssessmentStateSchema.parse(a);
}
export function normalizeAssessment(
  saved: unknown,
  catalogue: PublicProblem[],
  language: Language,
  at: string,
): AssessmentState {
  if (saved === null || saved === undefined)
    return emptyAssessment(catalogue, language);
  const current = AssessmentStateSchema.safeParse(saved);
  if (current.success) return current.data;
  const legacy = LegacyAssessmentSchema.parse(saved),
    state = emptyAssessment(catalogue, legacy.language ?? language);
  state.status =
    legacy.status === "not_started"
      ? "not_started"
      : legacy.status === "unavailable"
        ? "unavailable"
        : "stopped";
  state.experience = legacy.experience ?? "beginner";
  state.legacy = legacy;
  state.stoppedAt = at;
  state.message =
    "Saved legacy assessment history is preserved, but its old results are not reinterpreted as independent mastery. Explicitly restart to use the current welcome check.";
  return AssessmentStateSchema.parse(state);
}
