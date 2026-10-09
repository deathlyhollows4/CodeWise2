import type {
  PublicProblem,
  Language,
  JobStatus,
} from "../../contracts/src/index.ts";
import { qualifiedTeacherClosure } from "./teacher-closure.ts";
import { calendarReviewDue } from "./review-calendar.ts";
export const RULE_VERSION = "learning-5";
export type Evidence = {
  id: string;
  problemId: string;
  language: Language;
  step: number;
  skills: string[];
  outcome: JobStatus;
  assisted: boolean;
  review: boolean;
  createdAt: string;
  advancementEligible?: boolean;
  codeHash?: string;
  meaningfulConceptualAttempt?: boolean;
};
export function recommend(
  catalogue: PublicProblem[],
  evidence: Evidence[],
  language: Language,
  topic?: string,
  exposedProblemIds: string[] = [],
  pendingChallenge?: {
    topic: string;
    step: number;
    sourceProblemId?: string;
    resumeMode?: "next_step" | "same_step_checkpoint";
  },
  internalFixtureIds: string[] = [],
) {
  const fixtureIds = new Set(internalFixtureIds);
  const eligibleStatus = (p: PublicProblem) =>
    p.status === "published" || fixtureIds.has(p.id);
  const lastPathEvidence = evidence
    .filter(
      (e) =>
        !e.review &&
        e.advancementEligible !== false &&
        ["accepted", "wrong_answer"].includes(e.outcome),
    )
    .at(-1);
  const focusTopic =
    topic ??
    pendingChallenge?.topic ??
    catalogue.find((p) => p.id === lastPathEvidence?.problemId)?.primaryTopic ??
    catalogue[0]?.primaryTopic;
  const relevant = evidence.filter(
    (e, i, a) =>
      a.findIndex((x) => x.id === e.id) === i &&
      ["accepted", "wrong_answer"].includes(e.outcome) &&
      (!focusTopic ||
        catalogue.find((p) => p.id === e.problemId)?.primaryTopic ===
          focusTopic),
  );
  const latest = relevant
    .filter((e) => !e.review && e.advancementEligible !== false)
    .at(-1);
  const solved = new Set(
    evidence.filter((e) => e.outcome === "accepted").map((e) => e.problemId),
  );
  const demonstrated = new Set(
    evidence
      .filter((e) => e.outcome === "accepted" && !e.assisted)
      .flatMap((e) => e.skills),
  );
  let mode = "beginner",
    step = 1;
  if (latest) {
    step = latest.step;
    mode = "resume";
    if (latest.outcome === "accepted" && !latest.review) {
      mode = latest.assisted ? "same_step_checkpoint" : "next_step";
      if (!latest.assisted)
        step = Math.max(
          step + 1,
          ...relevant
            .filter(
              (e) =>
                e.outcome === "accepted" &&
                !e.assisted &&
                !e.review &&
                e.advancementEligible !== false,
            )
            .map((e) => e.step + 1),
        );
    } else if (
      new Set(
        relevant
          .filter(
            (e) =>
              e.outcome === "wrong_answer" &&
              e.meaningfulConceptualAttempt !== false &&
              e.problemId === latest.problemId &&
              e.codeHash,
          )
          .map((e) => e.codeHash),
      ).size >= 3
    ) {
      step = Math.max(1, step - 1);
      mode = "remediation";
    }
  }
  if (pendingChallenge && pendingChallenge.topic === focusTopic) {
    step = pendingChallenge.step;
    mode = pendingChallenge.resumeMode ?? "next_step";
  }
  const assistedSource =
    mode === "resume" && latest?.outcome === "wrong_answer"
      ? [...evidence]
          .reverse()
          .filter((e) => e.outcome === "accepted" && e.assisted && !e.review)
          .map((e) => catalogue.find((p) => p.id === e.problemId))
          .find(
            (p) =>
              p?.primaryTopic === focusTopic &&
              p.step === latest.step &&
              (p.checkpointIds ?? []).includes(latest.problemId),
          )
      : mode === "same_step_checkpoint"
        ? catalogue.find(
            (p) =>
              p.id === (pendingChallenge?.sourceProblemId ?? latest?.problemId),
          )
        : undefined;
  const acceptedAssistedSource =
    assistedSource &&
    evidence.some(
      (e) =>
        e.problemId === assistedSource.id &&
        e.outcome === "accepted" &&
        e.assisted &&
        !e.review,
    );
  const practiceAccess = (candidate: PublicProblem, skill: string) =>
    !!acceptedAssistedSource &&
    (mode !== "resume" || candidate.id === latest?.problemId) &&
    candidate.primaryTopic === assistedSource!.primaryTopic &&
    candidate.step === assistedSource!.step &&
    (assistedSource!.checkpointIds ?? []).includes(candidate.id) &&
    assistedSource!.skillIds.includes(skill) &&
    candidate.skillIds.includes(skill);
  const candidates = catalogue
    .filter(
      (p) =>
        eligibleStatus(p) &&
        (!focusTopic || p.primaryTopic === focusTopic) &&
        p.step === step &&
        (mode !== "same_step_checkpoint" ||
          (assistedSource?.checkpointIds ?? []).includes(p.id)) &&
        !solved.has(p.id) &&
        !exposedProblemIds.includes(p.id) &&
        p.prerequisites.every(
          (s) => demonstrated.has(s) || practiceAccess(p, s),
        ),
    )
    .sort((a, b) => {
      const prev = catalogue.find(
        (p) =>
          p.id === (pendingChallenge?.sourceProblemId ?? latest?.problemId),
      );
      const preferred =
        mode === "next_step"
          ? prev?.nextIds
          : mode === "same_step_checkpoint"
            ? prev?.checkpointIds
            : mode === "remediation"
              ? prev?.remedialIds
              : [];
      const rank = (p: PublicProblem) => [
        (preferred ?? []).includes(p.id) ? 0 : 1,
        [...new Set([...(prev?.skillIds ?? []), ...p.skillIds])].filter(
          (s) =>
            (prev?.skillIds.includes(s) ?? false) !== p.skillIds.includes(s),
        ).length,
      ];
      const ar = rank(a),
        br = rank(b);
      return ar[0] - br[0] || ar[1] - br[1] || a.id.localeCompare(b.id);
    });
  if (mode === "resume" && latest?.outcome === "wrong_answer") {
    const current = candidates.find((p) => p.id === latest.problemId);
    if (current) {
      candidates.splice(candidates.indexOf(current), 1);
      candidates.unshift(current);
    }
  }
  let selected = candidates[0];
  let pendingStep: number | null = null;
  let pendingMode: "next_step" | "same_step_checkpoint" | null = null;
  if (
    !selected &&
    ["beginner", "next_step", "same_step_checkpoint"].includes(mode)
  ) {
    const intended = catalogue.filter(
      (p) =>
        eligibleStatus(p) &&
        p.primaryTopic === focusTopic &&
        p.step === step &&
        (mode !== "same_step_checkpoint" ||
          (assistedSource?.checkpointIds ?? []).includes(p.id)) &&
        !solved.has(p.id) &&
        !exposedProblemIds.includes(p.id),
    );
    const missing = [
      ...new Set(
        intended.flatMap((p) =>
          p.prerequisites.filter(
            (s) => !demonstrated.has(s) && !practiceAccess(p, s),
          ),
        ),
      ),
    ];
    const previous = catalogue.find(
      (p) => p.id === (pendingChallenge?.sourceProblemId ?? latest?.problemId),
    );
    const teacherIds = [
      ...(previous?.remedialIds ?? []),
      ...intended.flatMap((p) => p.remedialIds),
    ];
    const teachers = qualifiedTeacherClosure(
      catalogue,
      teacherIds,
      missing,
      demonstrated,
      solved,
      exposedProblemIds,
      eligibleStatus,
    ).teachers;
    if (teachers.length) {
      selected = teachers[0].problem;
      // First-entry remediation preserves the requested path at step1; the teacher is not advancement in that path.
      pendingMode =
        mode === "beginner"
          ? "next_step"
          : (mode as "next_step" | "same_step_checkpoint");
      mode = "prerequisite_remediation";
      pendingStep = step;
    }
  }

  const related = (assistedSource?.checkpointIds ?? [])
    .map((id) => catalogue.find((p) => p.id === id))
    .filter(
      (p): p is PublicProblem =>
        !!p &&
        p.id !== assistedSource?.id &&
        p.primaryTopic === focusTopic &&
        p.step === step &&
        eligibleStatus(p),
    );
  const checkpointsExhausted =
    !selected &&
    mode === "same_step_checkpoint" &&
    related.length > 0 &&
    related.every((p) => solved.has(p.id) || exposedProblemIds.includes(p.id));
  return {
    problemId: selected?.id ?? null,
    mode: selected ? mode : "consolidation",
    requestedStep: step,
    selectedStep: selected?.step ?? null,
    pendingStep,
    pendingMode,
    practiceSkills:
      selected && ["same_step_checkpoint", "resume"].includes(mode)
        ? selected.prerequisites.filter(
            (skill) =>
              !demonstrated.has(skill) && practiceAccess(selected, skill),
          )
        : [],
    sourceProblemId: pendingStep
      ? (pendingChallenge?.sourceProblemId ?? latest?.problemId)
      : undefined,
    ruleVersion: RULE_VERSION,
    language,
    focusTopic,
    consideredCandidates: candidates.map((p) => p.id),
    excludedExposures: exposedProblemIds,
    rationale: selected
      ? mode === "prerequisite_remediation"
        ? step === 1 &&
          !(pendingChallenge?.sourceProblemId ?? latest?.problemId)
          ? "Demonstrate this missing prerequisite first. Your first challenge in the chosen topic is preserved."
          : pendingMode === "same_step_checkpoint"
            ? "Practise this missing prerequisite first. Your related same-step checkpoint is preserved."
            : "Demonstrate this missing prerequisite first. Your harder next step is preserved."
        : mode === "next_step"
          ? step === 1 && !latest && !pendingChallenge?.sourceProblemId
            ? "The prerequisite is demonstrated. Begin your chosen topic at its first step."
            : "Your independent solve adds one manageable step."
          : mode === "same_step_checkpoint"
            ? selected.prerequisites.some(
                (skill) =>
                  !demonstrated.has(skill) && practiceAccess(selected, skill),
              )
              ? "The shared idea is ready to practise. Solve this related same-step question independently to demonstrate it."
              : "Try a different challenge at the same step without recorded in-app help."
            : mode === "remediation"
              ? "Practise one earlier step while keeping your existing evidence."
              : "Build evidence with this eligible challenge."
      : checkpointsExhausted
        ? "All related checkpoints at this step have already been solved or exposed. Review your work or choose another topic."
        : mode === "same_step_checkpoint"
          ? "No eligible related checkpoint or prerequisite route is available at this step."
          : mode === "beginner"
            ? "No eligible first challenge or explicit prerequisite route is available in this topic. Choose another topic or demonstrate its prerequisites."
            : "No validated eligible challenge exists at the requested step. Choose another topic or review your work.",
  };
}
export function reviewDue(at: string, reviewCount: number, timezone = "UTC") {
  return calendarReviewDue(at, reviewCount, timezone);
}
