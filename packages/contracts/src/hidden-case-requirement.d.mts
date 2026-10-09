export type HiddenScopePolicy = {
  minimumHiddenCasesPerQuestion: 200;
  visibleCasesPerQuestion: 3;
  topics: [string, string, number][];
  hiddenCaseOverrides?: {
    problemId: string;
    requiredHiddenCases: 60;
    exact: true;
  }[];
};
export function hiddenCaseRequirement(
  problemId: string,
  scope?: HiddenScopePolicy,
): { minimum: 200 | 60; exact: 60 | null };
export function submissionCountMeetsScope(
  problemId: string,
  total: number,
  scope?: HiddenScopePolicy,
): boolean;
