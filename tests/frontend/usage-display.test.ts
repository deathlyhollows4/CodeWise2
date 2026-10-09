import test from "node:test";
import assert from "node:assert/strict";
import { usageDisplay } from "../../apps/web/src/usage-display";

test("partial reports retain known subtotals and expose missing request coverage", () => {
  const display = usageDisplay({
    requests: 4,
    tokens: null,
    cost: null,
    knownTokens: 2500,
    tokenReportedRequests: 2,
    tokenMissingRequests: 2,
    knownCostUsd: 0.0000036,
    costEstimatedRequests: 1,
    costMissingRequests: 3,
  });
  assert.equal(display.tokens, "2,500");
  assert.match(display.tokenCoverage, /2 of 4.*2 missing/);
  assert.equal(display.cost, "$0.0000036");
  assert.match(display.costCoverage, /1 of 4.*3 missing/);
});
test("sent requests without reports do not disguise missing tokens or costs as zero", () => {
  const display = usageDisplay({
    requests: 2,
    knownTokens: 0,
    knownCostUsd: 0,
    tokenReportedRequests: 0,
    tokenMissingRequests: 2,
    costEstimatedRequests: 0,
    costMissingRequests: 2,
  });
  assert.equal(display.tokens, "No provider usage reported yet");
  assert.equal(display.cost, "No priced usage available yet");
  assert.match(display.tokenCoverage, /2 missing/);
});
test("no sent requests and genuinely reported zero remain distinguishable", () => {
  assert.equal(usageDisplay({ requests: 0 }).tokens, "0");
  assert.equal(usageDisplay({ requests: 0 }).cost, "$0.000000");
  const reportedZero = usageDisplay({
    requests: 1,
    knownTokens: 0,
    knownCostUsd: 0,
    tokenReportedRequests: 1,
    tokenMissingRequests: 0,
    costEstimatedRequests: 1,
    costMissingRequests: 0,
  });
  assert.equal(reportedZero.tokens, "0");
  assert.match(reportedZero.tokenCoverage, /1 of 1.*0 missing/);
  assert.equal(reportedZero.cost, "$0.000000");
  assert.match(usageDisplay().tokens, /Loading/);
});
