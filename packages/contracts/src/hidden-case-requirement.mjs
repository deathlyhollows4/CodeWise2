import scopeData from "./delivery-scope.json" with { type: "json" };
import { z } from "zod";
const PolicySchema = z
  .object({
    minimumHiddenCasesPerQuestion: z.literal(200),
    visibleCasesPerQuestion: z.literal(3),
    topics: z
      .array(z.tuple([z.string(), z.string(), z.number().int().positive()]))
      .length(18),
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
  })
  .passthrough()
  .refine(
    (scope) =>
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
  );
const defaultPolicy = PolicySchema.parse(scopeData);
export function hiddenCaseRequirement(problemId, scope) {
  const policy =
    scope === undefined ? defaultPolicy : PolicySchema.parse(scope);
  const override = policy.hiddenCaseOverrides.find(
    (row) => row.problemId === problemId,
  );
  return override
    ? {
        minimum: override.requiredHiddenCases,
        exact: override.requiredHiddenCases,
      }
    : { minimum: policy.minimumHiddenCasesPerQuestion, exact: null };
}
export function submissionCountMeetsScope(problemId, total, scope) {
  const policy =
      scope === undefined ? defaultPolicy : PolicySchema.parse(scope),
    requirement = hiddenCaseRequirement(problemId, policy);
  return (
    Number.isSafeInteger(total) &&
    total >= requirement.minimum + policy.visibleCasesPerQuestion &&
    (requirement.exact === null ||
      total === requirement.exact + policy.visibleCasesPerQuestion)
  );
}
