export type UsageSummary = {
  requests: number;
  tokens?: number | null;
  cost?: number | null;
  knownTokens?: number;
  knownCostUsd?: number;
  tokenReportedRequests?: number;
  tokenMissingRequests?: number;
  costEstimatedRequests?: number;
  costMissingRequests?: number;
};

export function usageDisplay(usage?: UsageSummary) {
  if (!usage)
    return {
      tokens: "Loading usage records…",
      tokenCoverage: "",
      cost: "Loading usage records…",
      costCoverage: "",
    };
  if (usage.requests === 0)
    return {
      tokens: "0",
      tokenCoverage: "No requests were sent in this period.",
      cost: "$0.000000",
      costCoverage: "No requests were sent in this period.",
    };
  const reported = usage.tokenReportedRequests;
  const estimated = usage.costEstimatedRequests;
  const knownTokens = usage.knownTokens ?? usage.tokens;
  const knownCost = usage.knownCostUsd ?? usage.cost;
  return {
    tokens:
      (reported === undefined || reported > 0) &&
      typeof knownTokens === "number"
        ? knownTokens.toLocaleString("en-US")
        : "No provider usage reported yet",
    tokenCoverage:
      reported === undefined
        ? "Only provider-reported tokens are shown; unreported usage is not counted as zero."
        : `${reported} of ${usage.requests} requests reported tokens · ${usage.tokenMissingRequests ?? usage.requests - reported} missing`,
    cost:
      (estimated === undefined || estimated > 0) &&
      typeof knownCost === "number"
        ? `$${knownCost.toLocaleString("en-US", { minimumFractionDigits: 6, maximumFractionDigits: 10 })}`
        : "No priced usage available yet",
    costCoverage:
      estimated === undefined
        ? "A local estimate from reported tokens and recorded pricing; unpriced usage is not counted as zero."
        : `${estimated} of ${usage.requests} requests have an estimate · ${usage.costMissingRequests ?? usage.requests - estimated} missing`,
  };
}
