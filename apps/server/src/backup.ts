import { z } from "zod";
import {
  PreferencesSchema,
  JobRequestSchema,
  TutorRequestSchema,
  LanguageSchema,
  JobStatusSchema,
  JudgeResultSchema,
  LessonDocumentSchema,
  JsonValueSchema,
  PublicProblemSchema,
  ReferenceProvenanceSchema,
  StoredAssessmentSchema,
  submissionCountMeetsScope,
} from "../../../packages/contracts/src/index.ts";
const id = z.string().uuid();
const blob = z.string().max(1000000);
const timestamp = z.string().datetime();
export const GenerationStatusSchema = z.enum([
  "queued",
  "streaming",
  "complete",
  "interrupted",
  "canceled",
  "failed",
]);
const ErrorSchema = z
  .object({ code: z.string().max(100), message: z.string().max(1000) })
  .strict();
const UsageSchema = z
  .object({
    prompt_tokens: z.number().int().min(0).optional(),
    completion_tokens: z.number().int().min(0).optional(),
    total_tokens: z.number().int().min(0).optional(),
    prompt_cache_hit_tokens: z.number().int().min(0).optional(),
    prompt_cache_miss_tokens: z.number().int().min(0).optional(),
    completion_tokens_details: JsonValueSchema.optional(),
    prompt_tokens_details: JsonValueSchema.optional(),
  })
  .strict()
  .nullable();
const UsageLedgerEntrySchema = z
  .object({
    id,
    idempotencyHash: z.string().regex(/^[a-f0-9]{64}$/),
    createdAt: timestamp,
    model: z.string().max(100),
    status: GenerationStatusSchema,
    dispatch: z.enum(["not_sent", "sent", "unknown"]),
    inputBudgetTokens: z.number().int().min(0).max(250000),
    maxOutputTokens: z.number().int().min(128).max(8192),
    reservedCostUsd: z.number().nonnegative().nullable(),
    estimatedCostUsd: z.number().nonnegative().nullable(),
    usage: UsageSchema,
    pricingSnapshotDate: z.string().max(100),
    finishedAt: timestamp.optional(),
  })
  .strict();
export const StoredJobSchema = JobRequestSchema.extend({
  id,
  status: JobStatusSchema,
  result: JudgeResultSchema.nullable().default(null),
  createdAt: timestamp,
  finishedAt: timestamp.optional(),
  codeHash: z.string().max(64).optional(),
  problemVersion: z.string().max(100).optional(),
  problemSnapshot: PublicProblemSchema.optional(),
  attemptHash: z.string().max(64).optional(),
  attemptHeuristicVersion: z.string().max(100).optional(),
  meaningfulConceptualAttempt: z.boolean().optional(),
  executionIdentity: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
  assessmentId: id.optional(),
  assessmentSelectedAt: timestamp.optional(),
  assessmentAssisted: z.boolean().optional(),
}).strict();
export const StoredGenerationSchema = TutorRequestSchema.extend({
  id,
  threadId: id,
  status: GenerationStatusSchema,
  problemVersion: z.string().max(100).optional(),
  problemSnapshot: PublicProblemSchema.optional(),
  title: z.string().max(300),
  updatedAt: timestamp.optional(),
  markdown: z.string().max(250000),
  document: LessonDocumentSchema.nullable().default(null),
  bookmarked: z.boolean(),
  notes: z.string().max(30000),
  tags: z.array(z.string().max(80)).max(20),
  createdAt: timestamp,
  finishedAt: timestamp.optional(),
  provider: z.enum(["deepseek", "fixture"]),
  model: z.string().max(100),
  promptVersion: z.string().max(100).optional(),
  maxOutputTokens: z.number().int().min(128).max(8192).optional(),
  hintDepth: z.enum(["nudge", "concept", "steps"]).optional(),
  referenceProvenance: ReferenceProvenanceSchema.optional(),
  contextMessages: z
    .array(
      z
        .object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string().max(250000),
        })
        .strict(),
    )
    .max(8)
    .optional(),
  schemaVersion: z.literal(1),
  rendererVersion: z.number().int().positive(),
  version: z.number().int().positive(),
  usage: UsageSchema.default(null),
  verification: z.enum([
    "not-run",
    "checked-visible",
    "checked-full",
    "failed",
  ]),
  finishReason: z.string().nullable().optional(),
  error: ErrorSchema.optional(),
  contentHash: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
  contextHash: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
  sourceResultSnapshot: JudgeResultSchema.nullable().optional(),
  reservedCostUsd: z.number().nonnegative().nullable().optional(),
  estimatedCostUsd: z.number().nonnegative().nullable().optional(),
  pricingSnapshotDate: z.string().optional(),
  inputBudgetTokens: z.number().int().nonnegative().optional(),
  deletedAt: timestamp.optional(),
}).strict();
const StreamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("chunk"), text: z.string().max(250000) }).strict(),
  z
    .object({
      type: z.literal("status"),
      status: GenerationStatusSchema,
      error: ErrorSchema.optional(),
    })
    .strict(),
]);
const SelectionSchema = z
  .object({
    problemId: z.string().max(100),
    mode: z.enum(["manual", "review"]),
    selectedAt: timestamp,
  })
  .strict();
const AnnotationSchema = z
  .object({
    bookmarked: z.boolean(),
    notes: z.string().max(30000),
    tags: z.array(z.string().max(80)).max(20),
  })
  .strict();
const AssessmentSchema = StoredAssessmentSchema;
const EvidenceSchema = z
  .object({
    id,
    problemId: z.string().max(100),
    language: LanguageSchema,
    step: z.number().int().min(1),
    skills: z.array(z.string().max(100)).max(100),
    outcome: JobStatusSchema,
    assisted: z.boolean(),
    review: z.boolean(),
    createdAt: z.string().datetime(),
    ruleVersion: z.string().optional(),
    advancementEligible: z.boolean().optional(),
    codeHash: z.string().optional(),
    languageDemonstration: z.boolean().optional(),
    meaningfulConceptualAttempt: z.boolean().optional(),
    classification: z.string().optional(),
    skillIds: z.array(z.string()).optional(),
  })
  .strict();
const RecommendationSchema = z
  .object({
    id: id.optional(),
    problemId: z.string().nullable(),
    mode: z.string(),
    requestedStep: z.number().int().min(1),
    selectedStep: z.number().int().min(1).nullable().optional(),
    pendingStep: z.number().int().min(1).nullable().optional(),
    practiceSkills: z.array(z.string().max(100)).max(100).optional(),
    pendingMode: z
      .enum(["next_step", "same_step_checkpoint"])
      .nullable()
      .optional(),
    sourceProblemId: z.string().max(100).optional(),
    ruleVersion: z.string(),
    rationale: z.string(),
    learningRequirement: z.string().max(2000).optional(),
    language: LanguageSchema.optional(),
    focusTopic: z.string().optional(),
    consideredCandidates: z.array(z.string()).optional(),
    excludedExposures: z.array(z.string()).optional(),
  })
  .strict();
export const BackupSchema = z
  .object({
    schemaVersion: z.literal(1),
    exportedAt: z.string().datetime(),
    preferences: PreferencesSchema,
    drafts: z
      .array(
        z
          .object({
            problem: z.string(),
            language: z.enum(["java", "cpp", "python"]),
            revision: z.number().int().min(1),
            code: z.string().max(100000),
            updated: z.string().datetime(),
          })
          .strict(),
      )
      .max(2000),
    jobs: z.array(StoredJobSchema).max(20000),
    generations: z.array(StoredGenerationSchema).max(10000),
    learningMetadata: z
      .object({
        assessment: AssessmentSchema.nullable(),
        currentSelection: SelectionSchema.nullable(),
        problemVersions: z
          .record(z.string().max(200), PublicProblemSchema)
          .default({}),
        pendingChallenge: z
          .object({
            topic: z.string().max(100),
            step: z.number().int().min(1),
            sourceProblemId: z.string().max(100).optional(),
            teacherId: z.string().nullable().optional(),
            teacherIds: z.array(z.string().max(100)).max(64).optional(),
            resumeMode: z
              .enum(["next_step", "same_step_checkpoint"])
              .optional(),
            createdAt: timestamp,
          })
          .strict()
          .nullable()
          .default(null),
        problemAnnotations: z
          .record(z.string().max(100), AnnotationSchema)
          .default({}),
      })
      .strict()
      .default({
        assessment: null,
        currentSelection: null,
        problemAnnotations: {},
        problemVersions: {},
        pendingChallenge: null,
      }),
    events: z
      .array(
        z
          .object({
            generation: id,
            seq: z.number().int().positive(),
            data: blob,
          })
          .strict(),
      )
      .max(100000),
    assistance: z
      .array(
        z
          .object({
            id,
            problem: z.string(),
            kind: z.enum(["hint", "walkthrough", "solution", "feedback_only"]),
            created: z.string().datetime(),
          })
          .strict(),
      )
      .max(50000),
    evidence: z.array(EvidenceSchema).max(50000),
    recommendations: z.array(RecommendationSchema).max(50000),
    usageLedger: z.array(UsageLedgerEntrySchema).max(100000).default([]),
  })
  .strict()
  .superRefine((b, ctx) => {
    const ids = new Set(b.generations.map((g) => g.id));
    if (ids.size !== b.generations.length)
      ctx.addIssue({ code: "custom", message: "Duplicate generation IDs" });
    for (const e of b.events) {
      if (!ids.has(e.generation))
        ctx.addIssue({
          code: "custom",
          message: "Unresolved generation event reference",
        });
      try {
        StreamEventSchema.parse(JSON.parse(e.data));
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid event JSON" });
      }
    }
    for (const g of b.generations) {
      if (g.parentId) {
        const parent = b.generations.find((x) => x.id === g.parentId);
        if (
          !parent ||
          parent.threadId !== g.threadId ||
          parent.problemId !== g.problemId ||
          parent.version >= g.version
        )
          ctx.addIssue({
            code: "custom",
            message: "Invalid parent/version association",
          });
      }
      if (g.submissionId) {
        const job = b.jobs.find((j) => j.id === g.submissionId);
        if (
          !job ||
          job.problemId !== g.problemId ||
          job.language !== g.language ||
          (job.problemVersion &&
            g.problemVersion &&
            job.problemVersion !== g.problemVersion)
        )
          ctx.addIssue({
            code: "custom",
            message: "Invalid lesson submission/version association",
          });
      }
      if (g.document && g.document.markdown !== g.markdown)
        ctx.addIssue({
          code: "custom",
          message: "Presentation and saved content differ",
        });
    }
    for (const e of b.evidence) {
      const job = b.jobs.find((j) => j.id === e.id);
      if (!job || job.problemId !== e.problemId || job.language !== e.language)
        ctx.addIssue({
          code: "custom",
          message: "Unresolved submission evidence reference",
        });
    }
    const assessment = b.learningMetadata.assessment;
    if (
      assessment &&
      "schemaVersion" in assessment &&
      assessment.schemaVersion === 2
    ) {
      for (const observation of assessment.observations) {
        const job = b.jobs.find((j) => j.id === observation.jobId),
          question = assessment.questions.find(
            (q) => q.problemId === observation.problemId,
          );
        if (
          !job ||
          !question ||
          job.assessmentId !== assessment.id ||
          job.assessmentSelectedAt !== question.selectedAt ||
          job.problemId !== question.problemId ||
          job.problemVersion !== question.version ||
          job.language !== assessment.language ||
          job.mode !== "submit" ||
          job.review ||
          job.finishedAt !== observation.createdAt ||
          !job.problemSnapshot ||
          job.problemSnapshot.primaryTopic !== question.topic ||
          job.problemSnapshot.step !== question.step ||
          JSON.stringify(
            [...job.problemSnapshot.skillIds].slice(0, 50).sort(),
          ) !== JSON.stringify([...question.skillIds].sort())
        ) {
          ctx.addIssue({
            code: "custom",
            message: "Unresolved assessment submission/selection association",
          });
          continue;
        }
        const c = job.result?.counts;
        if (
          !c ||
          !submissionCountMeetsScope(job.problemId, c.total) ||
          ((observation.outcome === "independent-accepted" ||
            observation.outcome === "assisted-accepted") &&
            (job.status !== "accepted" ||
              c.passed !== c.total ||
              c.executed !== c.total ||
              c.notRun !== 0 ||
              c.failed !== 0 ||
              job.assessmentAssisted !==
                (observation.outcome === "assisted-accepted"))) ||
          (observation.outcome === "wrong_answer" &&
            (job.status !== "wrong_answer" ||
              job.meaningfulConceptualAttempt !== true ||
              c.failed === 0 ||
              c.executed === 0))
        )
          ctx.addIssue({
            code: "custom",
            message:
              "Assessment outcome is not supported by its graded submission",
          });
      }
    }
    for (const section of [b.jobs, b.generations])
      if (new Set(section.map((x) => x.idempotencyKey)).size !== section.length)
        ctx.addIssue({ code: "custom", message: "Duplicate idempotency key" });
  });
