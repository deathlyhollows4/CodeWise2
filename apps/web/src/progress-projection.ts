import type {
  ProgressDashboard,
  ProgressData,
} from "../../../packages/contracts/src";

export function reviewPreview(
  reviews: ProgressData["scheduledReviews"],
  limit = 5,
) {
  const sorted = [...reviews].sort(
    (a, b) =>
      a.dueAt.localeCompare(b.dueAt) || a.problemId.localeCompare(b.problemId),
  );
  return {
    visible: sorted.slice(0, limit),
    remaining: sorted.slice(limit),
    total: sorted.length,
  };
}
export function learningOutcomeLabel(
  evidence: ProgressData["evidence"][number],
) {
  if (evidence.outcome === "accepted")
    return evidence.review
      ? evidence.assisted
        ? "Reviewed with help"
        : "Reviewed successfully"
      : evidence.assisted
        ? "Learned with help"
        : "Solved independently";
  return (
    (
      {
        wrong_answer: "Practising",
        compile_error: "Compiler error",
        runtime_error: "Runtime error",
        infrastructure_error: "Runner unavailable",
        interrupted: "Interrupted",
        cancelled: "Canceled",
        queued: "Queued",
        running: "Running",
        time_limit: "Time limit reached",
        memory_limit: "Memory limit reached",
      } as Record<string, string>
    )[evidence.outcome] ??
    evidence.outcome
      .replaceAll("_", " ")
      .replace(/^./, (letter) => letter.toUpperCase())
  );
}

/** Keep the native fragment URL while making its collapsed destination usable. */
export function revealProgressEvidence(
  target: {
    open: boolean;
    querySelector(
      selector: string,
    ): { focus(options: FocusOptions): void } | null;
    scrollIntoView(options: ScrollIntoViewOptions): void;
  } | null,
) {
  if (!target) return false;
  target.open = true;
  target.querySelector("summary")?.focus({ preventScroll: true });
  target.scrollIntoView({ block: "start", behavior: "auto" });
  return true;
}

export const skillStates = [
  "reviewed_successfully",
  "solved_independently",
  "learned_with_help",
  "practising",
  "not_assessed",
] as const;
export const skillLabels = [
  "Reviewed successfully",
  "Solved independently",
  "Learned with help",
  "Practising",
  "Not assessed",
];
export function activityWindow(
  activity: ProgressDashboard["activity"],
  asOfDate: string,
  previous = false,
) {
  const end = new Date(`${asOfDate}T00:00:00Z`);
  if (previous) end.setUTCDate(end.getUTCDate() - 365);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 364);
  const indexed = new Map(activity.map((day) => [day.date, day]));
  const days = Array.from({ length: 365 }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(day.getUTCDate() + index);
    const date = day.toISOString().slice(0, 10);
    return indexed.get(date) ?? { date, submissions: 0, accepted: 0 };
  });
  let longest = 0,
    streak = 0;
  for (const day of days) {
    streak = day.submissions > 0 ? streak + 1 : 0;
    longest = Math.max(longest, streak);
  }
  return {
    days,
    total: days.reduce((sum, day) => sum + day.submissions, 0),
    active: days.filter((day) => day.submissions > 0).length,
    longest,
    offset: (start.getUTCDay() + 6) % 7,
  };
}
export function evidenceSegments(
  skills: ProgressDashboard["languages"][number]["skills"],
) {
  return skillStates.map((status, index) => ({
    status,
    label: skillLabels[index],
    count: skills.filter((skill) => skill.status === status).length,
  }));
}
export function practiceDestination(
  recommendation: {
    problemId: string | null;
    mode: string;
    practicePresentation?: { first: string };
  } | null,
  due: { problemId: string }[],
) {
  if (recommendation?.practicePresentation?.first === "review" && due.length)
    return `/problems/${encodeURIComponent(due[0].problemId)}?mode=review`;
  if (recommendation?.problemId)
    return `/problems/${encodeURIComponent(recommendation.problemId)}${recommendation.mode === "review" ? "?mode=review" : ""}`;
  return "/roadmap";
}
