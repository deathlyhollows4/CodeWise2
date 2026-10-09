import { z } from "zod";
import scope from "./delivery-scope.json" with { type: "json" };
const hash = z.string().regex(/^[a-f0-9]{64}$/),
  topic = z.enum(scope.topics.map(([id]) => id)),
  tag = z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100);
export const LearningMetadataRecordSchema = z
  .object({
    problemId: z.string().regex(/^[a-z0-9-]+-\d{2}$/),
    contentIdentity: hash,
    secondaryTopics: z.array(topic).max(scope.topics.length - 1),
    approachTags: z.array(tag).min(1).max(16),
    rationale: z.string().min(1).max(2000),
  })
  .strict()
  .superRefine((record, ctx) => {
    for (const key of ["secondaryTopics", "approachTags"])
      if (new Set(record[key]).size !== record[key].length)
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "Duplicate classification value",
        });
  });
export const LearningMetadataDocumentSchema = z
  .object({
    schemaVersion: z.literal(1),
    approachVocabulary: z.array(tag).min(1).max(512),
    records: z.array(LearningMetadataRecordSchema).length(scope.questionTarget),
  })
  .strict()
  .superRefine((doc, ctx) => {
    if (new Set(doc.approachVocabulary).size !== doc.approachVocabulary.length)
      ctx.addIssue({
        code: "custom",
        path: ["approachVocabulary"],
        message: "Duplicate closed vocabulary value",
      });
    if (
      new Set(doc.records.map((r) => r.problemId)).size !== doc.records.length
    )
      ctx.addIssue({
        code: "custom",
        path: ["records"],
        message: "Duplicate problem classification",
      });
    const allowed = new Set(doc.approachVocabulary);
    doc.records.forEach((record, index) => {
      if (record.approachTags.some((value) => !allowed.has(value)))
        ctx.addIssue({
          code: "custom",
          path: ["records", index, "approachTags"],
          message: "Unknown approach tag",
        });
    });
  });
export const LearningMetadataReviewSchema = z
  .object({
    schemaVersion: z.literal(1),
    status: z.literal("passed"),
    metadataHash: hash,
    reviewer: z.string().min(1),
    reviewedAt: z.string().datetime(),
  })
  .strict();
export const PublicLearningMetadataSchema = z
  .object({
    schemaVersion: z.literal(1),
    metadataVersion: hash,
    problemVersion: z.string().min(1).max(100),
    problemId: z.string().regex(/^[a-z0-9-]+-\d{2}$/),
    contentIdentity: hash,
    primaryTopic: topic,
    secondaryTopics: z.array(topic).max(scope.topics.length - 1),
    approachTags: z.array(tag).min(1).max(16),
    rationale: z.string().min(1).max(2000),
  })
  .strict()
  .superRefine((record, ctx) => {
    if (record.secondaryTopics.includes(record.primaryTopic))
      ctx.addIssue({
        code: "custom",
        path: ["secondaryTopics"],
        message: "Primary topic repeated as secondary",
      });
    for (const key of ["secondaryTopics", "approachTags"])
      if (new Set(record[key]).size !== record[key].length)
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "Duplicate classification value",
        });
  });
