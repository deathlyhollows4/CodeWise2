import test from "node:test";
import assert from "node:assert/strict";
import {
  calendarReviewDue,
  REVIEW_SCHEDULE_VERSION,
} from "../../packages/learning-engine/src/review-calendar.ts";
import {
  recommend,
  type Evidence,
} from "../../packages/learning-engine/src/index.ts";
test("calendar-day review preserves local wall time across spring and autumn DST", () => {
  assert.equal(
    calendarReviewDue("2026-03-07T17:00:00.000Z", 0, "America/New_York"),
    "2026-03-08T16:00:00.000Z",
  );
  assert.equal(
    calendarReviewDue("2026-10-31T16:00:00.000Z", 0, "America/New_York"),
    "2026-11-01T17:00:00.000Z",
  );
  assert.equal(
    calendarReviewDue("2026-03-07T07:30:00.000Z", 0, "America/New_York"),
    "2026-03-08T07:30:00.000Z",
  );
  assert.equal(
    calendarReviewDue("2026-10-31T05:30:00.000Z", 0, "America/New_York"),
    "2026-11-01T05:30:00.000Z",
  );
  assert.equal(REVIEW_SCHEDULE_VERSION, "review-calendar-1");
});
test("saved-zone calendar arithmetic crosses midnight, leap dates and month ends without host TZ changes", () => {
  const before = process.env.TZ;
  assert.equal(
    calendarReviewDue("2026-01-31T18:45:00.123Z", 0, "Asia/Calcutta"),
    "2026-02-01T18:45:00.123Z",
  );
  assert.equal(
    calendarReviewDue("2028-02-28T23:00:00.000Z", 0, "Europe/London"),
    "2028-02-29T23:00:00.000Z",
  );
  assert.equal(
    calendarReviewDue("2026-01-31T12:00:00.000Z", 4, "UTC"),
    "2026-03-02T12:00:00.000Z",
  );
  assert.equal(
    calendarReviewDue("2026-03-07T17:00:00.000Z", 1, "America/New_York"),
    "2026-03-10T16:00:00.000Z",
  );
  assert.equal(process.env.TZ, before);
  assert.throws(() =>
    calendarReviewDue("2026-01-01T00:00:00Z", 0, "Invented/Zone"),
  );
});
test("review clock calculation neither advances nor displaces a harder pending challenge", () => {
  const catalogue = [
    {
      id: "source",
      status: "published",
      primaryTopic: "p",
      step: 2,
      skillIds: ["base"],
      prerequisites: [],
      checkpointIds: [],
      nextIds: ["hard"],
      remedialIds: [],
    },
    {
      id: "hard",
      status: "published",
      primaryTopic: "p",
      step: 3,
      skillIds: ["next"],
      prerequisites: ["base"],
      checkpointIds: [],
      nextIds: [],
      remedialIds: [],
    },
  ] as any;
  const accepted: Evidence = {
    id: "accepted",
    problemId: "source",
    language: "python",
    step: 2,
    skills: ["base"],
    outcome: "accepted",
    assisted: false,
    review: false,
    createdAt: "2026-03-07T17:00:00.000Z",
  };
  const reviewed = {
    ...accepted,
    id: "review",
    review: true,
    advancementEligible: false,
    createdAt: "2026-03-08T16:00:00.000Z",
  };
  const history = [accepted, reviewed],
    before = JSON.stringify(history),
    pending = {
      topic: "p",
      step: 3,
      sourceProblemId: "source",
      resumeMode: "next_step" as const,
    };
  calendarReviewDue(reviewed.createdAt, 1, "America/New_York");
  const r = recommend(catalogue, history, "python", undefined, [], pending);
  assert.equal(r.problemId, "hard");
  assert.equal(r.requestedStep, 3);
  assert.equal(JSON.stringify(history), before);
});
