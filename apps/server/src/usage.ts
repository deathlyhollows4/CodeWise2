export const pricingSnapshot = {
  checkedAt: "2026-10-08",
  source: "https://api-docs.deepseek.com/quick_start/pricing/",
  currency: "USD",
  basis: "Conservative peak cache-miss estimate; account billing can differ.",
  models: {
    "deepseek-flash": { inputPerMillion: 0.3, outputPerMillion: 1.2 },
    "deepseek-v4-pro": { inputPerMillion: 1.32, outputPerMillion: 3.96 },
  },
};
export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
) {
  const p =
    pricingSnapshot.models[model as keyof typeof pricingSnapshot.models];
  return p
    ? (inputTokens * p.inputPerMillion + outputTokens * p.outputPerMillion) /
        1000000
    : null;
}
export function localDate(instant: string, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(instant));
}
export class RateLimiter {
  private windows = new Map<string, { start: number; count: number }>();
  take(key: string, max: number, now = Date.now(), duration = 60000) {
    const old = this.windows.get(key);
    const bucket =
      !old || now - old.start >= duration ? { start: now, count: 0 } : old;
    bucket.count++;
    this.windows.set(key, bucket);
    if (this.windows.size > 1000)
      for (const [k, b] of this.windows)
        if (now - b.start >= duration) this.windows.delete(k);
    return bucket.count <= max;
  }
}
