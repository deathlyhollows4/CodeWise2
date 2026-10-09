import { test } from "node:test";
import assert from "node:assert/strict";
import {
  localDate,
  RateLimiter,
  estimateCost,
} from "../../apps/server/src/usage.ts";
test("local budget calendar follows stored timezone across UTC boundary", () => {
  assert.equal(
    localDate("2026-10-08T00:10:00Z", "America/Los_Angeles"),
    "2026-10-07",
  );
  assert.equal(localDate("2026-10-07T20:00:00Z", "Asia/Kolkata"), "2026-10-08");
});
test("bounded per-session rate window resets deterministically", () => {
  const rate = new RateLimiter();
  assert.equal(rate.take("secret", 2, 1000), true);
  assert.equal(rate.take("secret", 2, 1001), true);
  assert.equal(rate.take("secret", 2, 1002), false);
  assert.equal(rate.take("other", 2, 1002), true);
  assert.equal(rate.take("secret", 2, 61000), true);
});
test("published pricing snapshot computes estimates and unknown models stay unknown", () => {
  assert.equal(estimateCost("deepseek-flash", 1000000, 1000000), 1.5);
  assert.equal(estimateCost("unknown", 10, 10), null);
});
