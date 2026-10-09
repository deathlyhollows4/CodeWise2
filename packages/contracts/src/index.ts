import { z } from "zod";
import scopeData from "./delivery-scope.json";
export const API_VERSION = 2;
export const SourceReviewSnapshotSchema = z
  .object({
    contentIdentity: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
    rights: z.enum(["passed", "pending", "missing", "stale", "invalid"]),
    progression: z.enum(["passed", "pending", "missing", "stale", "invalid"]),
    diversity: z.enum(["passed", "pending", "missing", "stale", "invalid"]),
    overall: z.enum(["passed", "pending"]),
  })
  .strict();
export const LanguageSchema = z.enum(["java", "cpp", "python"]);
export type Language = z.infer<typeof LanguageSchema>;
export const DeliveryScopeSchema = z
  .object({
    schemaVersion: z.literal(1),
    amendment: z.string().min(1),
    originalQuestionTarget: z.literal(300),
    questionTarget: z.number().int().positive(),
    visibleCasesPerQuestion: z.literal(3),
    minimumHiddenCasesPerQuestion: z.literal(200),
    hiddenCaseOverrides: z
      .array(
        z
          .object({
            problemId: z.string().regex(/^[a-z][a-z0-9-]*-\d{2}$/),
            requiredHiddenCases: z.literal(60),
            exact: z.literal(true),
          })
          .strict(),
      )
      .max(243)
      .default([]),
    languages: z.tuple([
      z.literal("java"),
      z.literal("cpp"),
      z.literal("python"),
    ]),
    topics: z
      .array(
        z.tuple([
          z.string().min(1),
          z.string().min(1),
          z.number().int().positive(),
        ]),
      )
      .length(18),
  })
  .strict()
  .refine(
    (scope) =>
      new Set(scope.topics.map(([id]) => id)).size === 18 &&
      scope.topics.reduce((sum, [, , quota]) => sum + quota, 0) ===
        scope.questionTarget &&
      new Set(scope.hiddenCaseOverrides.map((row) => row.problemId)).size ===
        scope.hiddenCaseOverrides.length &&
      scope.hiddenCaseOverrides.every((row) =>
        scope.topics.some(([id, , quota]) => {
          const match = row.problemId.match(/^(.*)-(\d{2})$/);
          return (
            match?.[1] === id &&
            Number(match[2]) >= 1 &&
            Number(match[2]) <= quota
          );
        }),
      ),
    "Delivery topic quotas must uniquely sum to the authorized target",
  );
export const DeliveryScope = DeliveryScopeSchema.parse(scopeData);
export {
  hiddenCaseRequirement,
  submissionCountMeetsScope,
} from "./hidden-case-requirement.mjs";
export const TopicQuotas = DeliveryScope.topics;
export const TopicIdSchema = z.enum(TopicQuotas.map(([id]) => id));
export const LearningPreferencesSchema = z
  .object({
    focusTopic: TopicIdSchema.nullable().default(null),
    reviewPreference: z
      .enum(["balanced", "new-first", "review-first"])
      .default("balanced"),
    defaultHintDepth: z.enum(["nudge", "concept", "steps"]).default("concept"),
  })
  .strict();
export const EXPECTED_QUESTIONS = DeliveryScope.questionTarget;
export const EXPECTED_VISIBLE_CASES =
  EXPECTED_QUESTIONS * DeliveryScope.visibleCasesPerQuestion;
export const EXPECTED_LANGUAGE_PAIRS =
  EXPECTED_QUESTIONS * DeliveryScope.languages.length;
export const JsonValueSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    z.string(),
    z
      .number()
      .finite()
      .refine(
        (n) => !Number.isInteger(n) || Number.isSafeInteger(n),
        "Large integers must use schema-defined strings",
      ),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);
export const ContractMetadataSchema = JsonValueSchema.refine((value) => {
  let nodes = 0;
  function visit(v: any, depth: number): boolean {
    if (++nodes > 5000 || depth > 24) return false;
    if (v && typeof v === "object")
      return Object.values(v).every((x) => visit(x, depth + 1));
    return true;
  }
  return visit(value, 0) && JSON.stringify(value).length <= 20000;
}, "Representation metadata exceeds the safe bound");
export const VisibleCaseSchema = z
  .object({
    id: z.string(),
    input: JsonValueSchema,
    expected: JsonValueSchema,
    explanation: z.string(),
  })
  .strict();
export const PublicProblemSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string(),
    version: z.string(),
    slug: z.string(),
    title: z.string(),
    primaryTopic: z.string(),
    skillIds: z.array(z.string()),
    prerequisites: z.array(z.string()),
    step: z.number().int().min(0),
    status: z.enum(["draft", "validated", "published"]),
    statement: z.string(),
    objective: z.string(),
    learnerRationale: z.string().min(1).max(2000).optional(),
    constraints: z.array(z.string()),
    interface: z.string(),
    inputSchema: ContractMetadataSchema.optional(),
    outputSchema: ContractMetadataSchema.optional(),
    semanticConstraints: z.array(ContractMetadataSchema).max(100).optional(),
    visibleCases: z.array(VisibleCaseSchema).length(3),
    starters: z
      .object({ java: z.string(), cpp: z.string(), python: z.string() })
      .strict(),
    sourceIds: z.array(z.string()),
    checkpointIds: z.array(z.string()).default([]),
    remedialIds: z.array(z.string()).default([]),
    nextIds: z.array(z.string()).default([]),
  })
  .strict();
export type PublicProblem = z.infer<typeof PublicProblemSchema>;
export const DraftSaveSchema = z
  .object({ code: z.string().max(100000), revision: z.number().int().min(0) })
  .strict();
export const JobRequestSchema = z
  .object({
    problemId: z.string().max(100),
    language: LanguageSchema,
    code: z.string().max(100000),
    mode: z.enum(["run", "submit", "custom"]),
    customInput: JsonValueSchema.optional(),
    idempotencyKey: z.string().min(8).max(100),
    review: z.boolean().default(false),
  })
  .strict();
export const TutorRequestSchema = z
  .object({
    problemId: z.string(),
    language: LanguageSchema,
    code: z.string().max(100000),
    action: z.enum([
      "hint",
      "error",
      "simplify",
      "walkthrough",
      "solution",
      "complexity",
      "followup",
    ]),
    prompt: z.string().max(12000),
    threadId: z.string().uuid().optional(),
    parentId: z.string().uuid().optional(),
    submissionId: z.string().uuid().optional(),
    idempotencyKey: z.string().min(8).max(100),
    consent: z.literal(true),
  })
  .strict();
export const PreferencesSchema = z
  .object({
    displayName: z.string().max(80),
    language: LanguageSchema,
    theme: z.enum(["dark", "light", "system"]),
    timezone: z
      .string()
      .max(100)
      .refine((v) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: v });
          return true;
        } catch {
          return false;
        }
      }, "Use a valid IANA timezone"),
    fontSize: z.number().int().min(12).max(24),
    tabWidth: z.number().int().min(2).max(8),
    reducedMotion: z.boolean(),
    autoExplain: z.boolean(),
    maxOutputTokens: z.number().int().min(128).max(8192),
    dailyRequests: z.number().int().min(1).max(100),
    dailyTokens: z.number().int().min(128).max(500000),
    dailySpendUsd: z.number().min(0.01).max(100).nullable().default(null),
    model: z.string().max(100),
    onboarded: z.boolean(),
    ...LearningPreferencesSchema.shape,
  })
  .strict();
export type Preferences = z.infer<typeof PreferencesSchema>;
export const JobStatusSchema = z.enum([
  "queued",
  "compiling",
  "running",
  "executed",
  "accepted",
  "wrong_answer",
  "compile_error",
  "runtime_error",
  "time_limit",
  "memory_limit",
  "output_limit",
  "canceled",
  "infrastructure_error",
  "interrupted",
]);
export type JobStatus = z.infer<typeof JobStatusSchema>;
export type Counts = {
  total: number;
  executed: number;
  passed: number;
  failed: number;
  notRun: number;
  unverified?: number;
};
export type JudgeResult = {
  status: JobStatus;
  counts: Counts;
  diagnostics: string;
  cases?: Array<{
    id: string;
    input?: unknown;
    expected?: unknown;
    actual?: unknown;
    passed: boolean;
  }>;
  runtime?: Record<string, unknown>;
};
export type RunnerReadiness = {
  ready: boolean;
  message: string;
  languages: Array<{ id: Language; version: string }>;
  controlsVerified: boolean;
};
export const LessonDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  title: z.string(),
  markdown: z.string(),
  sections: z.array(
    z.object({
      id: z.string(),
      kind: z.enum([
        "idea",
        "diagnosis",
        "walkthrough",
        "approach",
        "code",
        "complexity",
        "next-step",
        "general",
      ]),
      heading: z.string().optional(),
      markdown: z.string(),
    }),
  ),
  language: LanguageSchema.optional(),
  verification: z.enum([
    "not-run",
    "checked-visible",
    "checked-full",
    "failed",
  ]),
});
export type LessonDocument = z.infer<typeof LessonDocumentSchema>;
export type ApiError = {
  code: string;
  message: string;
  recoveryAction: string;
  requestId: string;
};
export const CountsSchema = z
  .object({
    total: z.number().int().min(0),
    executed: z.number().int().min(0),
    passed: z.number().int().min(0),
    failed: z.number().int().min(0),
    notRun: z.number().int().min(0),
    unverified: z.number().int().min(0).optional(),
  })
  .strict()
  .refine(
    (c) =>
      c.executed + c.notRun === c.total &&
      c.passed + c.failed + (c.unverified ?? 0) === c.executed,
    "Execution counts are inconsistent",
  );
export const TutorStreamEventSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("chunk"),
      text: z.string().max(250000),
      seq: z.number().int().nonnegative().optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("snapshot"),
      text: z.string().max(250000),
      status: z.enum([
        "queued",
        "streaming",
        "complete",
        "failed",
        "interrupted",
        "canceled",
      ]),
      seq: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({
      type: z.literal("status"),
      status: z.enum([
        "queued",
        "streaming",
        "complete",
        "failed",
        "interrupted",
        "canceled",
      ]),
      error: JsonValueSchema.optional(),
      seq: z.number().int().nonnegative().optional(),
    })
    .strict(),
]);
export const ExecutionIdentitySchema = z
  .object({
    identity: z.string().regex(/^[a-f0-9]{64}$/),
    version: z.string().min(1).max(100),
  })
  .strict();
export const ReferenceProvenanceSchema = z
  .object({
    language: LanguageSchema,
    version: z.string().min(1).max(100),
    validationIdentity: z.string().regex(/^[a-f0-9]{64}$/),
    verifiedAt: z.string().datetime(),
    runtimeIdentity: z.string().regex(/^[a-f0-9]{64}$/),
    basis: z.literal("historical-full-reference-execution"),
  })
  .strict();
export const VerifiedReferenceResultSchema = z.discriminatedUnion("available", [
  z
    .object({ available: z.literal(false), reason: z.string().max(300) })
    .strict(),
  ReferenceProvenanceSchema.omit({ basis: true })
    .extend({ available: z.literal(true), code: z.string().min(1).max(64000) })
    .strict(),
]);
export const JudgeResultSchema = z
  .object({
    status: JobStatusSchema,
    counts: CountsSchema,
    diagnostics: z.string().max(20000),
    cases: z
      .array(
        z.object({
          id: z.string(),
          input: JsonValueSchema.optional(),
          expected: JsonValueSchema.optional(),
          actual: JsonValueSchema.optional(),
          passed: z.boolean(),
        }),
      )
      .max(50)
      .optional(),
    runtime: z.record(z.string(), JsonValueSchema).optional(),
  })
  .strict();
export const GenerationStatusSchema = z.enum([
  "queued",
  "streaming",
  "complete",
  "interrupted",
  "canceled",
  "failed",
]);
export const LibrarySummarySchema = z
  .object({
    id: z.string().uuid(),
    problemId: z.string().max(100),
    threadId: z.string().uuid(),
    version: z.number().int().positive(),
    language: LanguageSchema,
    action: TutorRequestSchema.shape.action,
    status: GenerationStatusSchema,
    title: z.string().max(300),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    bookmarked: z.boolean(),
    tags: z.array(z.string().max(80)).max(20),
    preview: z.string().max(400),
    searchExcerpt: z.string().max(400),
    provider: z.enum(["deepseek", "fixture"]),
    model: z.string().max(100),
  })
  .strict();
export const JobSummarySchema = z
  .object({
    id: z.string().uuid(),
    problemId: z.string().max(100),
    problemTitle: z.string().max(300),
    language: LanguageSchema,
    mode: JobRequestSchema.shape.mode,
    status: JobStatusSchema,
    createdAt: z.string().datetime(),
    finishedAt: z.string().datetime().optional(),
    review: z.boolean(),
    meaningfulConceptualAttempt: z.boolean().optional(),
    counts: CountsSchema.nullable(),
  })
  .strict();
const pageFields = {
  nextCursor: z.string().max(2048).nullable(),
  total: z.number().int().nonnegative(),
  pageSize: z.number().int().min(1).max(100),
};
export const LibraryPageSchema = z
  .object({ ...pageFields, items: z.array(LibrarySummarySchema).max(100) })
  .strict()
  .refine(
    (p) => p.items.length <= p.pageSize && p.items.length <= p.total,
    "Page counts are inconsistent",
  );
export const JobPageSchema = z
  .object({ ...pageFields, items: z.array(JobSummarySchema).max(100) })
  .strict()
  .refine(
    (p) => p.items.length <= p.pageSize && p.items.length <= p.total,
    "Page counts are inconsistent",
  );
export type LibrarySummary = z.infer<typeof LibrarySummarySchema>;
export type JobSummary = z.infer<typeof JobSummarySchema>;
export type LibraryPage = z.infer<typeof LibraryPageSchema>;
export type JobPage = z.infer<typeof JobPageSchema>;
export const RunnerReadinessSchema = z
  .object({
    ready: z.boolean(),
    message: z.string(),
    languages: z.array(z.object({ id: LanguageSchema, version: z.string() })),
    controlsVerified: z.boolean(),
    identityHash: z.string().optional(),
    phaseEventsSupported: z.boolean().optional(),
  })
  .strict();
export const AssessmentStartSchema = z
  .object({
    experience: z.enum(["beginner", "some", "comfortable"]),
    language: LanguageSchema,
  })
  .strict();
export const LegacyAssessmentSchema = z
  .object({
    status: z.enum([
      "not_started",
      "active",
      "unavailable",
      "stopped",
      "complete",
    ]),
    language: LanguageSchema.optional(),
    experience: AssessmentStartSchema.shape.experience.optional(),
    problemIds: z.array(z.string().max(100)).max(10),
    completed: z.array(z.string().max(100)).max(10),
    currentProblemId: z.string().nullable().optional(),
    startedAt: z.string().datetime().optional(),
    stoppedAt: z.string().datetime().optional(),
    unassessedSkills: z.literal(true).optional(),
    message: z.string().max(1000).optional(),
  })
  .strict()
  .refine(
    (a) =>
      a.completed.every((id) => a.problemIds.includes(id)) &&
      (!a.currentProblemId || a.problemIds.includes(a.currentProblemId)),
    "Assessment references unresolved questions",
  );
export const AssessmentQuestionSchema = z
  .object({
    problemId: z.string().max(100),
    version: z.string().max(100),
    title: z.string().max(300),
    topic: z.string().max(100),
    step: z.number().int().nonnegative(),
    skillIds: z.array(z.string().max(100)).max(50),
    selectedAt: z.string().datetime(),
    reason: z.string().max(1000),
  })
  .strict();
export const AssessmentObservationSchema = z
  .object({
    jobId: z.string().uuid(),
    problemId: z.string().max(100),
    outcome: z.enum([
      "independent-accepted",
      "assisted-accepted",
      "wrong_answer",
    ]),
    createdAt: z.string().datetime(),
    skillIds: z.array(z.string().max(100)).max(50),
  })
  .strict();
export const AssessmentStateSchema = z
  .object({
    schemaVersion: z.literal(2),
    ruleVersion: z.literal("assessment-1"),
    id: z.string().uuid(),
    status: LegacyAssessmentSchema.shape.status,
    experience: AssessmentStartSchema.shape.experience,
    language: LanguageSchema,
    targetQuestions: z.number().int().min(6).max(10),
    problemIds: z.array(z.string().max(100)).max(10),
    completed: z.array(z.string().max(100)).max(10),
    currentProblemId: z.string().nullable(),
    currentSelectedAt: z.string().datetime().nullable(),
    questions: z.array(AssessmentQuestionSchema).max(10),
    observations: z.array(AssessmentObservationSchema).max(10),
    knownSkillIds: z.array(z.string().max(100)).max(2000),
    unknownSkillIds: z.array(z.string().max(100)).max(2000),
    startedAt: z.string().datetime().optional(),
    stoppedAt: z.string().datetime().optional(),
    unassessedSkills: z.literal(true),
    message: z.string().max(1000),
    legacy: LegacyAssessmentSchema.optional(),
  })
  .strict()
  .superRefine((a, ctx) => {
    const unique = (values: string[]) => new Set(values).size === values.length;
    if (
      !unique(a.problemIds) ||
      !unique(a.completed) ||
      !unique(a.observations.map((o) => o.problemId)) ||
      !unique(a.observations.map((o) => o.jobId)) ||
      !unique(a.knownSkillIds) ||
      !unique(a.unknownSkillIds)
    )
      ctx.addIssue({ code: "custom", message: "Duplicate assessment records" });
    if (
      a.questions.length !== a.problemIds.length ||
      a.questions.some((q, i) => q.problemId !== a.problemIds[i]) ||
      a.completed.length !== a.observations.length ||
      a.observations.some(
        (o, i) =>
          o.problemId !== a.completed[i] || !a.problemIds.includes(o.problemId),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Assessment question/observation associations differ",
      });
    if (
      a.observations.some((o) => {
        const q = a.questions.find((q) => q.problemId === o.problemId);
        return (
          !q ||
          JSON.stringify([...o.skillIds].sort()) !==
            JSON.stringify([...q.skillIds].sort())
        );
      })
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Observation skill declarations differ from the selected question",
      });
    const demonstrated = [
      ...new Set(
        a.observations
          .filter((o) => o.outcome === "independent-accepted")
          .flatMap((o) => o.skillIds),
      ),
    ].sort();
    if (
      JSON.stringify([...a.knownSkillIds].sort()) !==
        JSON.stringify(demonstrated) ||
      a.knownSkillIds.some((id) => a.unknownSkillIds.includes(id))
    )
      ctx.addIssue({
        code: "custom",
        message: "Unknown assessment mastery cannot be inferred",
      });
    if (
      a.status === "active" &&
      (!a.currentProblemId ||
        !a.currentSelectedAt ||
        a.completed.includes(a.currentProblemId) ||
        !a.questions.some(
          (q) =>
            q.problemId === a.currentProblemId &&
            q.selectedAt === a.currentSelectedAt,
        ))
    )
      ctx.addIssue({
        code: "custom",
        message: "Active assessment has no fresh selected question",
      });
    if (a.status === "complete" && a.completed.length < a.targetQuestions)
      ctx.addIssue({
        code: "custom",
        message: "Assessment completed before its bounded target",
      });
    if (
      a.status !== "active" &&
      (a.currentProblemId !== null || a.currentSelectedAt !== null)
    )
      ctx.addIssue({
        code: "custom",
        message: "Inactive assessment retains a current selection",
      });
    if (
      a.observations.some(
        (o) =>
          Date.parse(o.createdAt) <
          Date.parse(
            a.questions.find((q) => q.problemId === o.problemId)?.selectedAt ??
              "",
          ),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Assessment observation precedes question selection",
      });
  });
export const StoredAssessmentSchema = z.union([
  AssessmentStateSchema,
  LegacyAssessmentSchema,
]);
export type AssessmentState = z.infer<typeof AssessmentStateSchema>;
export type AssessmentQuestion = z.infer<typeof AssessmentQuestionSchema>;
export const RecommendationSchema = z
  .object({
    problemId: z.string().max(100).nullable(),
    mode: z.enum([
      "beginner",
      "resume",
      "next_step",
      "same_step_checkpoint",
      "remediation",
      "prerequisite_remediation",
      "consolidation",
      "review",
    ]),
    requestedStep: z.number().int().min(1),
    selectedStep: z.number().int().min(1).nullable(),
    pendingStep: z.number().int().min(1).nullable(),
    pendingMode: z.enum(["next_step", "same_step_checkpoint"]).nullable(),
    practiceSkills: z.array(z.string().max(100)).max(100),
    sourceProblemId: z.string().max(100).optional(),
    ruleVersion: z.string().max(100),
    language: LanguageSchema,
    focusTopic: z.string().max(100).optional(),
    consideredCandidates: z.array(z.string().max(100)).max(1000),
    excludedExposures: z.array(z.string().max(100)).max(50000),
    rationale: z.string().max(4000),
    learningRequirement: z.string().max(2000).optional(),
    practicePresentation: z
      .object({
        ruleVersion: z.literal("learning-settings-1"),
        preference: LearningPreferencesSchema.shape.reviewPreference,
        first: z.enum(["review", "challenge"]),
        dueReviews: z.number().int().nonnegative(),
        reason: z.string().max(1000),
      })
      .strict(),
  })
  .strict();
export const LearningEvidenceSchema = z
  .object({
    id: z.string().uuid(),
    problemId: z.string().max(100),
    language: LanguageSchema,
    step: z.number().int().min(1),
    skills: z.array(z.string().max(100)).max(100),
    outcome: JobStatusSchema,
    assisted: z.boolean(),
    review: z.boolean(),
    createdAt: z.string().datetime(),
    ruleVersion: z.string().max(100).optional(),
    advancementEligible: z.boolean().optional(),
    codeHash: z.string().max(100).optional(),
    languageDemonstration: z.boolean().optional(),
    meaningfulConceptualAttempt: z.boolean().optional(),
    classification: z.string().max(100).optional(),
    skillIds: z.array(z.string().max(100)).max(100).optional(),
  })
  .strict();
const languageEvidence = z
  .object({
    java: z.array(z.string().uuid()).max(50000),
    cpp: z.array(z.string().uuid()).max(50000),
    python: z.array(z.string().uuid()).max(50000),
  })
  .strict();
const reviewItem = z
  .object({
    problemId: z.string().max(100),
    scheduleRuleVersion: z.string().max(100),
    timezone: PreferencesSchema.shape.timezone,
    dueAt: z.string().datetime(),
  })
  .strict();
export const ProgressSchema = z
  .object({
    independent: z.number().int().nonnegative(),
    assisted: z.number().int().nonnegative(),
    evidence: z.array(LearningEvidenceSchema).max(50000),
    paths: z
      .array(
        z
          .object({
            topic: z.string().max(100),
            workingStep: z.number().int().min(1),
            highestIndependentStep: z.number().int().min(1).nullable(),
            lastEvidenceId: z.string().uuid().nullable(),
            independentEvidenceIds: z.array(z.string().uuid()).max(50000),
            languageEvidence,
          })
          .strict(),
      )
      .max(100),
    reviewQueue: z.array(reviewItem).max(50000),
    scheduledReviews: z.array(reviewItem).max(50000),
    skills: z
      .array(
        z
          .object({
            skillId: z.string().max(100),
            status: z.enum([
              "reviewed_successfully",
              "solved_independently",
              "learned_with_help",
              "practising",
              "not_assessed",
            ]),
            workingStep: z.number().int().min(1).nullable(),
            highestIndependentStep: z.number().int().min(1).nullable(),
            evidenceIds: z.array(z.string().uuid()).max(50000),
            languageEvidence,
          })
          .strict(),
      )
      .max(2000),
  })
  .strict();

export {
  LearningMetadataRecordSchema,
  LearningMetadataDocumentSchema,
  LearningMetadataReviewSchema,
  PublicLearningMetadataSchema,
} from "./learning-metadata.mjs";
export type {
  LearningMetadataRecord,
  LearningMetadataDocument,
  LearningMetadataReview,
  PublicLearningMetadata,
} from "./learning-metadata.mjs";
