import test from "node:test";
import assert from "node:assert/strict";
import { UsageLedger } from "../../apps/server/src/usage-ledger.ts";
import type { UsageEntry } from "../../apps/server/src/usage-ledger.ts";
import type { Store } from "../../apps/server/src/store.ts";
const entry = (overrides: Partial<UsageEntry> = {}): UsageEntry => ({
  id: "fixture",
  idempotencyHash: "fixture",
  createdAt: "2026-10-09T00:00:00Z",
  model: "fixture",
  status: "complete",
  dispatch: "sent",
  inputBudgetTokens: 100,
  maxOutputTokens: 200,
  reservedCostUsd: 0.01,
  estimatedCostUsd: 0.001,
  usage: { total_tokens: 100 },
  pricingSnapshotDate: "fixture",
  ...overrides,
});
function ledger(rows: UsageEntry[]) {
  const meta = new Map<string, unknown>([["tutorUsage", rows]]);
  return new UsageLedger({
    meta: (key: string) => meta.get(key),
    setMeta: (key: string, value: unknown) => meta.set(key, value),
    list: () => [],
  } as unknown as Store);
}
test("missing historical usage does not erase known token and cost subtotals", () => {
  const s = ledger([
    entry(),
    entry({
      id: "missing",
      status: "failed",
      usage: null,
      estimatedCostUsd: null,
    }),
    entry({
      id: "setup",
      status: "failed",
      dispatch: "not_sent",
      usage: null,
      estimatedCostUsd: null,
    }),
  ]).summary();
  assert.equal(s.requests, 2);
  assert.equal(s.totalRecordedRequests, 3);
  assert.equal(s.notSentRequests, 1);
  assert.equal(s.knownTokens, 100);
  assert.equal(s.tokenReportedRequests, 1);
  assert.equal(s.tokenMissingRequests, 1);
  assert.equal(s.tokens, null);
  assert.equal(s.knownCostUsd, 0.001);
  assert.equal(s.costEstimatedRequests, 1);
  assert.equal(s.costMissingRequests, 1);
  assert.equal(s.cost, null);
  assert.equal(s.failedRequests, 1);
});
test("complete and empty ledgers preserve exact totals including true zero usage", () => {
  const s = ledger([
    entry({ usage: { total_tokens: 0 }, estimatedCostUsd: 0 }),
  ]).summary();
  assert.equal(s.tokens, 0);
  assert.equal(s.cost, 0);
  assert.equal(s.tokensKnown, true);
  assert.equal(s.tokenMissingRequests, 0);
  const empty = ledger([]).summary();
  assert.equal(empty.requests, 0);
  assert.equal(empty.tokens, 0);
  assert.equal(empty.cost, 0);
  assert.equal(empty.knownTokens, 0);
});
test("token coverage and price coverage are independent and pending requests are explicit", () => {
  const rows = [entry({ estimatedCostUsd: null })];
  const active = ledger(rows);
  // Add a live reservation after startup recovery has finished.
  rows.push(
    entry({
      id: "pending",
      status: "queued",
      dispatch: "not_sent",
      usage: null,
      estimatedCostUsd: null,
    }),
  );
  const s = active.summary();
  assert.equal(s.tokenReportedRequests, 1);
  assert.equal(s.costEstimatedRequests, 0);
  assert.equal(s.costMissingRequests, 1);
  assert.equal(s.pendingRequests, 1);
  assert.equal(s.tokens, 100);
  assert.equal(s.cost, null);
});
