import type { z } from "zod";
import type {
  LearningEvidenceSchema,
  ProgressDashboardData,
  JobStatus,
  PublicProblem,
} from "../../../packages/contracts/src/index.ts";
import { derivePathStates } from "../../../packages/learning-engine/src/path-state.ts";
import { localDate } from "./usage.ts";

type Evidence = z.infer<typeof LearningEvidenceSchema>;
type Problem = {
  id: string;
  title: string;
  status: string;
  primaryTopic: string;
  skillIds: string[];
  step: number;
};
// Deliberately consume only submission metadata. Never return code, snapshots,
// result payloads, hidden tests, provider content or reference implementations.
type Submission = {
  id: string;
  mode: string;
  status: JobStatus;
  createdAt: string;
};

const conceptualOutcomes = new Set<JobStatus>([
  "wrong_answer",
  "runtime_error",
  "time_limit",
  "memory_limit",
  "output_limit",
]);

export function projectProgressDashboard(
  catalogue: readonly Problem[],
  rawEvidence: readonly Evidence[],
  jobs: readonly Submission[],
  timezone: string,
  now = new Date().toISOString(),
): ProgressDashboardData {
  const published = [
    ...new Map(
      catalogue.filter((p) => p.status === "published").map((p) => [p.id, p]),
    ).values(),
  ];
  const publishedIds = new Set(published.map((p) => p.id));
  const evidence = [...new Map(rawEvidence.map((e) => [e.id, e])).values()]
    .filter((e) => publishedIds.has(e.problemId))
    .sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    );
  const completion = (entries: readonly Evidence[]) => {
    const independent = new Set(
      entries
        .filter((e) => e.outcome === "accepted" && !e.assisted)
        .map((e) => e.problemId),
    );
    const assisted = new Set(
      entries
        .filter(
          (e) =>
            e.outcome === "accepted" &&
            e.assisted &&
            !independent.has(e.problemId),
        )
        .map((e) => e.problemId),
    );
    return {
      independent: independent.size,
      assisted: assisted.size,
      completed: independent.size + assisted.size,
    };
  };
  const days = new Map<
    string,
    { date: string; submissions: number; accepted: number }
  >();
  const allJobs = new Map(jobs.map((j) => [j.id, j]));
  const record = (createdAt: string, accepted: boolean) => {
    if (!Number.isFinite(Date.parse(createdAt))) return;
    const date = localDate(createdAt, timezone);
    const day = days.get(date) ?? { date, submissions: 0, accepted: 0 };
    day.submissions++;
    if (accepted) day.accepted++;
    days.set(date, day);
  };
  // Submission creation is the user's action time; completion may cross midnight.
  // Count failed compile and neutral infrastructure outcomes as recorded actions.
  for (const job of allJobs.values()) {
    if (job.mode === "submit") record(job.createdAt, job.status === "accepted");
  }
  // Export/restore can retain evidence after its originating job is absent.
  for (const e of new Map(rawEvidence.map((e) => [e.id, e])).values()) {
    if (!allJobs.has(e.id)) record(e.createdAt, e.outcome === "accepted");
  }
  const skillIds = [...new Set(published.flatMap((p) => p.skillIds))];
  return {
    timezone,
    asOfDate: localDate(now, timezone),
    totalPublished: published.length,
    ...completion(evidence),
    problems: published.map((p) => ({
      id: p.id,
      title: p.title,
      topic: p.primaryTopic,
      step: p.step,
    })),
    topicSkills: [...new Set(published.map((p) => p.primaryTopic))].map(
      (topic) => ({
        topic,
        steps: [
          ...new Set(
            published
              .filter((p) => p.primaryTopic === topic)
              .map((p) => p.step)
              .filter(
                (step): step is number =>
                  typeof step === "number" &&
                  Number.isInteger(step) &&
                  step > 0,
              ),
          ),
        ].sort((a, b) => a - b),
        skillIds: [
          ...new Set(
            published
              .filter((p) => p.primaryTopic === topic)
              .flatMap((p) => p.skillIds),
          ),
        ],
      }),
    ),
    activity: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
    languages: (["java", "cpp", "python"] as const).map((language) => {
      const languageEntries = evidence.filter((e) => e.language === language);
      return {
        language,
        ...completion(languageEntries),
        // The path engine reads identity/topic only from catalogue entries.
        // Keep its existing advancement and review semantics; this projection
        // supplies the published scope and one language without modifying it.
        paths: derivePathStates(
          published as PublicProblem[],
          languageEntries,
        ).map(
          ({ topic, workingStep, highestIndependentStep, lastEvidenceId }) => ({
            topic,
            workingStep,
            highestIndependentStep,
            lastEvidenceId,
          }),
        ),
        skills: skillIds.map((skillId) => {
          const entries = languageEntries.filter(
            (e) =>
              e.skills.includes(skillId) &&
              (e.outcome === "accepted" ||
                (conceptualOutcomes.has(e.outcome) &&
                  e.meaningfulConceptualAttempt !== false)),
          );
          const good = entries.filter((e) => e.outcome === "accepted");
          const independent = good.filter((e) => !e.assisted);
          return {
            skillId,
            status: good.some((e) => e.review && !e.assisted)
              ? ("reviewed_successfully" as const)
              : independent.length
                ? ("solved_independently" as const)
                : good.length
                  ? ("learned_with_help" as const)
                  : entries.length
                    ? ("practising" as const)
                    : ("not_assessed" as const),
            workingStep: entries.at(-1)?.step ?? null,
            highestIndependentStep: independent.length
              ? Math.max(...independent.map((e) => e.step))
              : null,
            evidenceIds: entries.map((e) => e.id),
          };
        }),
      };
    }),
  };
}
