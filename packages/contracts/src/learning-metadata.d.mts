import type { ZodType } from "zod";
export type LearningMetadataRecord = {
  problemId: string;
  contentIdentity: string;
  secondaryTopics: string[];
  approachTags: string[];
  rationale: string;
};
export type LearningMetadataDocument = {
  schemaVersion: 1;
  approachVocabulary: string[];
  records: LearningMetadataRecord[];
};
export type LearningMetadataReview = {
  schemaVersion: 1;
  status: "passed";
  metadataHash: string;
  reviewer: string;
  reviewedAt: string;
};
export type PublicLearningMetadata = LearningMetadataRecord & {
  schemaVersion: 1;
  metadataVersion: string;
  problemVersion: string;
  primaryTopic: string;
};
export const LearningMetadataRecordSchema: ZodType<LearningMetadataRecord>;
export const LearningMetadataDocumentSchema: ZodType<LearningMetadataDocument>;
export const LearningMetadataReviewSchema: ZodType<LearningMetadataReview>;
export const PublicLearningMetadataSchema: ZodType<PublicLearningMetadata>;
