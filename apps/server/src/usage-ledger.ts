import { createHash } from "node:crypto";
import type { Store } from "./store.ts";
import { localDate } from "./usage.ts";
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export type UsageEntry = {
  id: string;
  idempotencyHash: string;
  createdAt: string;
  model: string;
  status: string;
  dispatch: "not_sent" | "sent" | "unknown";
  inputBudgetTokens: number;
  maxOutputTokens: number;
  reservedCostUsd: number | null;
  estimatedCostUsd: number | null;
  usage: Record<string, number> | null;
  pricingSnapshotDate: string;
  finishedAt?: string;
};
export class UsageLedger {
  constructor(private store: Store) {
    const existing = this.list();
    for (const row of existing)
      if (["queued", "streaming"].includes(row.status)) {
        row.status = "interrupted";
        row.finishedAt = new Date().toISOString();
      }
    const ids = new Set(existing.map((x) => x.id));
    for (const g of store
      .list("generations")
      .filter((g) => g.provider === "deepseek"))
      if (!ids.has(g.id)) {
        const dispatched =
          g.error?.code === "NO_KEY" || g.error?.code === "NO_MODEL"
            ? "not_sent"
            : g.usage || g.markdown
              ? "sent"
              : "unknown";
        existing.push({
          id: g.id,
          idempotencyHash: hash(g.idempotencyKey),
          createdAt: g.createdAt,
          model: g.model,
          status: g.status,
          dispatch: dispatched,
          inputBudgetTokens: g.inputBudgetTokens ?? 0,
          maxOutputTokens: store.meta("preferences").maxOutputTokens,
          reservedCostUsd: g.reservedCostUsd ?? null,
          estimatedCostUsd: g.estimatedCostUsd ?? null,
          usage: g.usage ?? null,
          pricingSnapshotDate: g.pricingSnapshotDate ?? "unknown",
          finishedAt: g.finishedAt,
        });
      }
    this.save(existing);
  }
  list(): UsageEntry[] {
    return this.store.meta("tutorUsage") ?? [];
  }
  private save(rows: UsageEntry[]) {
    this.store.setMeta("tutorUsage", rows);
  }
  findIdempotency(key: string) {
    const idempotencyHash = hash(key);
    return this.list().find((r) => r.idempotencyHash === idempotencyHash);
  }
  reserve(g: any, maxOutputTokens: number) {
    const rows = this.list();
    rows.push({
      id: g.id,
      idempotencyHash: hash(g.idempotencyKey),
      createdAt: g.createdAt,
      model: g.model,
      status: "queued",
      dispatch: "not_sent",
      inputBudgetTokens: g.inputBudgetTokens,
      maxOutputTokens,
      reservedCostUsd: g.reservedCostUsd ?? null,
      estimatedCostUsd: null,
      usage: null,
      pricingSnapshotDate: g.pricingSnapshotDate,
    });
    this.save(rows);
  }
  dispatched(id: string) {
    this.update(id, (r) => {
      r.dispatch = "sent";
      r.status = "streaming";
    });
  }
  finalize(g: any) {
    this.update(g.id, (r) => {
      r.status = g.status;
      r.finishedAt = g.finishedAt;
      r.usage = g.usage ?? null;
      r.estimatedCostUsd = g.estimatedCostUsd ?? null;
    });
  }
  private update(id: string, fn: (row: UsageEntry) => void) {
    const rows = this.list(),
      row = rows.find((r) => r.id === id);
    if (row) {
      fn(row);
      this.save(rows);
    }
  }
  static consumes(row: UsageEntry) {
    return (
      row.dispatch !== "not_sent" ||
      ["queued", "streaming"].includes(row.status)
    );
  }
  static tokens(row: UsageEntry) {
    return (
      row.usage?.total_tokens ?? row.inputBudgetTokens + row.maxOutputTokens
    );
  }
  static cost(row: UsageEntry) {
    return row.estimatedCostUsd ?? row.reservedCostUsd ?? 0;
  }
  day(timezone: string, now = new Date().toISOString()) {
    const date = localDate(now, timezone);
    return this.list().filter(
      (row) =>
        localDate(row.createdAt, timezone) === date &&
        UsageLedger.consumes(row),
    );
  }
  summary() {
    const allRows = this.list(),
      rows = allRows.filter((r) => r.dispatch !== "not_sent"),
      tokenRows = rows.filter(
        (r) =>
          Number.isSafeInteger(r.usage?.total_tokens) &&
          r.usage!.total_tokens >= 0,
      ),
      costRows = rows.filter(
        (r) =>
          typeof r.estimatedCostUsd === "number" &&
          Number.isFinite(r.estimatedCostUsd) &&
          r.estimatedCostUsd >= 0,
      ),
      tokensKnown = tokenRows.length === rows.length,
      costKnown = costRows.length === rows.length;
    return {
      requests: rows.length,
      totalRecordedRequests: allRows.length,
      notSentRequests: allRows.filter((r) => r.dispatch === "not_sent").length,
      pendingRequests: allRows.filter((r) =>
        ["queued", "streaming"].includes(r.status),
      ).length,
      failedRequests: rows.filter((r) => r.status === "failed").length,
      tokenReportedRequests: tokenRows.length,
      tokenMissingRequests: rows.length - tokenRows.length,
      knownTokens: tokenRows.reduce((n, r) => n + r.usage!.total_tokens, 0),
      costEstimatedRequests: costRows.length,
      costMissingRequests: rows.length - costRows.length,
      knownCostUsd: costRows.reduce((n, r) => n + r.estimatedCostUsd!, 0),
      tokens: tokensKnown
        ? rows.reduce((n, r) => n + (r.usage?.total_tokens ?? 0), 0)
        : null,
      tokensKnown,
      reservedTokens: rows
        .filter((r) => !r.usage)
        .reduce((n, r) => n + UsageLedger.tokens(r), 0),
      cost: costKnown
        ? rows.reduce((n, r) => n + UsageLedger.cost(r), 0)
        : null,
      costKnown,
      reservedCostUsd: rows
        .filter((r) => r.estimatedCostUsd == null)
        .reduce((n, r) => n + (r.reservedCostUsd ?? 0), 0),
    };
  }
  merge(rows: UsageEntry[]) {
    const merged = new Map(rows.map((r) => [r.id, r]));
    for (const current of this.list()) merged.set(current.id, current);
    this.save(
      [...merged.values()].sort(
        (a, b) =>
          a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
      ),
    );
  }
}
