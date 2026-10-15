import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import {
  activityWindow,
  evidenceSegments,
  practiceDestination,
  revealProgressEvidence,
  reviewPreview,
} from "../../apps/web/src/progress-projection";

test("evidence navigation opens its disclosure and focuses the summary before scrolling", () => {
  const events: string[] = [];
  const target = {
    open: false,
    querySelector: (selector: string) => {
      assert.equal(selector, "summary");
      return {
        focus: (options: FocusOptions) => {
          assert.equal(target.open, true);
          assert.equal(options.preventScroll, true);
          events.push("focus");
        },
      };
    },
    scrollIntoView: (options: ScrollIntoViewOptions) => {
      assert.equal(options.behavior, "auto");
      assert.equal(options.block, "start");
      events.push("scroll");
    },
  };
  assert.equal(revealProgressEvidence(target), true);
  assert.equal(target.open, true);
  assert.deepEqual(events, ["focus", "scroll"]);
  assert.equal(revealProgressEvidence(null), false);
});
import { ProgressDashboard } from "../../apps/web/src/ProgressDashboard";
import type { ProgressData } from "../../packages/contracts/src";
import { RecommendationSchema } from "../../packages/contracts/src";

test("review-first practice uses review context and human question titles", () => {
  const progress = emptyProgress();
  progress.reviewQueue = [
    {
      problemId: "arrays-01",
      dueAt: "2026-10-12T00:00:00.000Z",
      timezone: "Asia/Kolkata",
      scheduleRuleVersion: "review-1",
    },
  ];
  progress.scheduledReviews = progress.reviewQueue;
  const recommendation = RecommendationSchema.parse({
    problemId: null,
    mode: "beginner",
    requestedStep: 1,
    selectedStep: null,
    pendingStep: null,
    pendingMode: null,
    practiceSkills: [],
    ruleVersion: "engine-1",
    language: "cpp",
    consideredCandidates: [],
    excludedExposures: [],
    rationale: "No eligible first challenge",
    learningRequirement: "Unrelated challenge skill",
    practicePresentation: {
      ruleVersion: "learning-settings-1",
      preference: "review-first",
      first: "review",
      dueReviews: 1,
      reason: "Revisit a due review at your own pace.",
    },
  });
  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(ProgressDashboard, {
        progress,
        topics: [
          {
            id: "arrays",
            name: "Arrays",
            count: 30,
            independent: 0,
            assisted: 0,
          },
        ],
        language: "cpp",
        onLanguage: () => {},
        recommendation,
        recommendationLoading: false,
        recommendationError: null,
        retryRecommendation: () => {},
        formatDate: (date) => date,
      }),
    ),
  );
  assert.match(markup, /Revisit a due review at your own pace/);
  assert.match(markup, /Trail sum/);
  assert.match(markup, /href="\/problems\/arrays-01\?mode=review"/);
  assert.doesNotMatch(
    markup,
    /No eligible first challenge|Unrelated challenge skill/,
  );
});

test("review preview sorts due dates without losing the complete schedule", () => {
  const source = Array.from({ length: 37 }, (_, index) => ({
    problemId: `arrays-${index}`,
    dueAt: `2026-10-${String(28 - (index % 28)).padStart(2, "0")}T00:00:00.000Z`,
    timezone: "Asia/Kolkata",
    scheduleRuleVersion: "review-1",
  }));
  const original = source.map((review) => review.problemId);
  const preview = reviewPreview(source);
  assert.equal(preview.visible.length, 5);
  assert.equal(preview.remaining.length, 32);
  assert.equal(preview.total, 37);
  assert.deepEqual(
    source.map((review) => review.problemId),
    original,
  );
  const combined = [...preview.visible, ...preview.remaining];
  assert.equal(new Set(combined.map((review) => review.problemId)).size, 37);
  assert.ok(
    combined.every(
      (review, index) =>
        index === 0 || combined[index - 1].dueAt <= review.dueAt,
    ),
  );
});

test("annual activity preserves real attempts across leap day and excludes adjacent periods", () => {
  const activity = [
    { date: "2024-02-28", submissions: 2, accepted: 1 },
    { date: "2024-02-29", submissions: 4, accepted: 0 },
    { date: "2024-03-01", submissions: 1, accepted: 1 },
    { date: "2023-03-02", submissions: 99, accepted: 99 },
  ];
  const result = activityWindow(activity, "2024-03-01");
  assert.equal(result.days.length, 365);
  assert.equal(result.days[0].date, "2023-03-03");
  assert.equal(result.total, 7);
  assert.equal(result.active, 3);
  assert.equal(result.longest, 3);
  const previous = activityWindow(activity, "2024-03-01", true);
  assert.equal(previous.days.at(-1)?.date, "2023-03-02");
  assert.equal(previous.total, 99);
});

test("next practice honors review presentation and preserves explicit review mode", () => {
  const due = [{ problemId: "arrays-01" }];
  assert.equal(
    practiceDestination(
      {
        problemId: "greedy-01",
        mode: "resume",
        practicePresentation: { first: "review" },
      },
      due,
    ),
    "/problems/arrays-01?mode=review",
  );
  assert.equal(
    practiceDestination(
      {
        problemId: "greedy-01",
        mode: "same_step_checkpoint",
        practicePresentation: { first: "challenge" },
      },
      due,
    ),
    "/problems/greedy-01",
  );
  assert.equal(
    practiceDestination({ problemId: "greedy-01", mode: "review" }, []),
    "/problems/greedy-01?mode=review",
  );
  assert.equal(practiceDestination(null, []), "/roadmap");
});

test("skill segments retain unassessed skills rather than inventing mastery", () => {
  const result = evidenceSegments([
    {
      skillId: "a",
      status: "not_assessed",
      workingStep: null,
      highestIndependentStep: null,
      evidenceIds: [],
    },
    {
      skillId: "b",
      status: "learned_with_help",
      workingStep: 2,
      highestIndependentStep: null,
      evidenceIds: [],
    },
  ]);
  assert.equal(result.find((part) => part.status === "not_assessed")?.count, 1);
  assert.equal(
    result.find((part) => part.status === "learned_with_help")?.count,
    1,
  );
  assert.equal(
    result.find((part) => part.status === "solved_independently")?.count,
    0,
  );
});

function emptyProgress(): ProgressData {
  return {
    independent: 0,
    assisted: 0,
    evidence: [],
    paths: [],
    reviewQueue: [],
    scheduledReviews: [],
    skills: [],
    dashboard: {
      timezone: "Asia/Kolkata",
      asOfDate: "2026-10-13",
      totalPublished: 243,
      completed: 0,
      independent: 0,
      assisted: 0,
      topicSkills: [
        { topic: "arrays", skillIds: ["array.traversal"], steps: [1, 2, 3] },
      ],
      problems: [
        { id: "arrays-01", title: "Trail sum", topic: "arrays", step: 1 },
      ],
      activity: [],
      languages: ["cpp", "java", "python"].map((language) => ({
        language: language as "cpp" | "java" | "python",
        completed: 0,
        independent: 0,
        assisted: 0,
        paths: [],
        skills: [
          {
            skillId: "array.traversal",
            status: "not_assessed" as const,
            workingStep: null,
            highestIndependentStep: null,
            evidenceIds: [],
          },
        ],
      })),
    },
  };
}

test("topic details keep language paths distinct and retain all evidence behind a compact disclosure", () => {
  const progress = emptyProgress();
  const dashboard = progress.dashboard!;
  const ids = Array.from({ length: 9 }, (_, index) => `array.skill-${index}`);
  dashboard.topicSkills[0].skillIds = ids;
  for (const entry of dashboard.languages) {
    entry.skills = ids.map((skillId) => ({
      skillId,
      status: "not_assessed",
      workingStep: null,
      highestIndependentStep: null,
      evidenceIds: [],
    }));
    entry.paths = [
      {
        topic: "arrays",
        workingStep: entry.language === "cpp" ? 2 : 7,
        highestIndependentStep: entry.language === "cpp" ? 1 : 6,
        lastEvidenceId: "8d851bfb-d58c-46e0-9195-4560484bafbe",
      },
    ];
  }
  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(ProgressDashboard, {
        progress,
        topics: [
          {
            id: "arrays",
            name: "Arrays",
            count: 30,
            independent: 2,
            assisted: 1,
          },
        ],
        language: "cpp",
        onLanguage: () => {},
        recommendation: null,
        recommendationLoading: false,
        recommendationError: null,
        retryRecommendation: () => {},
        formatDate: (date) => date,
      }),
    ),
  );
  assert.match(markup, /Working step · C\+\+<\/span><strong>2<\/strong>/);
  assert.match(markup, /Independent step · C\+\+<\/span><strong>1<\/strong>/);
  assert.match(markup, /3 \/ 30 questions completed · All languages/);
  assert.match(
    markup,
    /<details class="pd-remaining-skills"><summary>View all 9 skills and their evidence<\/summary>/,
  );
  assert.match(markup, /Skill 8/);
  assert.doesNotMatch(
    markup,
    /Working step · C\+\+<\/span><strong>7<\/strong>/,
  );
});

test("empty progress renders real zeros, accessible activity and working navigation without fixture scores", () => {
  const progress = emptyProgress();
  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(ProgressDashboard, {
        progress,
        topics: [
          {
            id: "arrays",
            name: "Arrays",
            count: 30,
            independent: 0,
            assisted: 0,
          },
        ],
        language: "cpp",
        onLanguage: () => {},
        recommendation: null,
        recommendationLoading: false,
        recommendationError: null,
        retryRecommendation: () => {},
        formatDate: (date) => date,
      }),
    ),
  );
  assert.match(markup, /0 of 243 published questions completed, 0\.0 percent/);
  assert.match(markup, /class="pd-ring-track"/);
  assert.doesNotMatch(markup, /class="pd-ring"/);
  assert.match(markup, /2026-10-13: 0 submissions, 0 accepted/);
  assert.match(markup, /Independent step: <b>Not demonstrated/);
  assert.match(markup, /href="\/topics\/arrays"/);
  assert.match(markup, /No submissions in this period/);
  assert.match(markup, /Mastery evidence in/);
  assert.doesNotMatch(markup, /rating|rank|Easy.*Medium.*Hard|sample profile/i);
  assert.equal((markup.match(/tabindex="0"/g) ?? []).length, 1);
});
