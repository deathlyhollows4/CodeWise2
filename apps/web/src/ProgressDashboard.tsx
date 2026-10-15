import React, { useState } from "react";
import { History, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import type {
  ProgressData,
  Language,
  RecommendationSchema,
} from "../../../packages/contracts/src";
import type { z } from "zod";
import {
  activityWindow,
  evidenceSegments,
  practiceDestination,
  skillStates,
  skillLabels,
  revealProgressEvidence,
  reviewPreview,
  learningOutcomeLabel,
} from "./progress-projection";

type Topic = {
  id: string;
  name: string;
  count: number;
  independent: number;
  assisted: number;
};
const languages = { cpp: "C++", python: "Python", java: "Java" };
const prettySkill = (id: string) =>
  (id.split(".").at(-1) ?? id)
    .replaceAll("-", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
type Recommendation = z.infer<typeof RecommendationSchema>;
export function ProgressDashboard({
  progress,
  topics,
  language,
  onLanguage,
  recommendation,
  recommendationLoading,
  recommendationError,
  retryRecommendation,
  formatDate,
}: {
  progress: ProgressData;
  topics: Topic[];
  language: Language;
  onLanguage: (language: Language) => void;
  recommendation: Recommendation | null;
  recommendationLoading: boolean;
  recommendationError: unknown;
  retryRecommendation: () => void;
  formatDate: (date: string, timezone?: string) => string;
}) {
  const [selected, setSelected] = useState(topics[0]?.id ?? "");
  const [expanded, setExpanded] = useState(false);
  const [previous, setPrevious] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const dashboard = progress.dashboard;
  if (!dashboard)
    return (
      <div className="notice" role="status">
        Dashboard data is unavailable. Your recorded evidence remains available
        below.
      </div>
    );
  const topic = topics.find((t) => t.id === selected) ?? topics[0];
  const languageSkills =
    dashboard.languages.find((entry) => entry.language === language)?.skills ??
    [];
  const forTopic = (id: string) => {
    const ids = new Set(
      dashboard.topicSkills.find((entry) => entry.topic === id)?.skillIds ?? [],
    );
    return languageSkills.filter((skill) => ids.has(skill.skillId));
  };
  const titleFor = (id: string) =>
    dashboard.problems.find((problem) => problem.id === id)?.title ??
    "Recorded practice";
  const schedule = reviewPreview(progress.scheduledReviews);
  const renderReview = (review: ProgressData["scheduledReviews"][number]) => (
    <div className="pd-review-row" key={review.problemId}>
      <History size={16} className="pd-row-icon" aria-hidden="true" />
      <div>
        <Link to={`/problems/${review.problemId}?mode=review`}>
          {titleFor(review.problemId)}
        </Link>
        <small>Due {formatDate(review.dueAt, review.timezone)}</small>
      </div>
    </div>
  );
  const skills = topic ? forTopic(topic.id) : [];
  const supportingSkills = [...skills].sort(
    (a, b) =>
      Number(a.status === "not_assessed") - Number(b.status === "not_assessed"),
  );
  const topicPath = dashboard.languages
    .find((entry) => entry.language === language)
    ?.paths.find((path) => path.topic === topic?.id);
  const skillEvidenceIds = new Set(
    skills.flatMap((skill) => skill.evidenceIds),
  );
  const latestReview = [...progress.evidence]
    .filter(
      (evidence) =>
        skillEvidenceIds.has(evidence.id) &&
        evidence.language === language &&
        evidence.review &&
        evidence.outcome === "accepted" &&
        !evidence.assisted,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const renderSkill = (skill: (typeof skills)[number]) => (
    <div key={skill.skillId}>
      <div className="pd-skill-title">
        <strong title={skill.skillId}>{prettySkill(skill.skillId)}</strong>
        <span>{skillLabels[skillStates.indexOf(skill.status)]}</span>
      </div>
      <details>
        <summary>{skill.evidenceIds.length} supporting outcomes</summary>
        <p>
          Working step: <b>{skill.workingStep ?? "Not assessed"}</b> ·
          Independent step:{" "}
          <b>{skill.highestIndependentStep ?? "Not demonstrated"}</b>
        </p>
        {skill.evidenceIds.map((id) => {
          const evidence = progress.evidence.find((item) => item.id === id);
          return evidence ? (
            <p key={id}>
              <Link to={`/problems/${titleFor(evidence.problemId)}`}>
                {titleFor(evidence.problemId)}
              </Link>{" "}
              ·{" "}
              {(evidence.classification || evidence.outcome).replaceAll(
                "_",
                " ",
              )}{" "}
              · {formatDate(evidence.createdAt)}
            </p>
          ) : null;
        })}
      </details>
    </div>
  );
  const window = activityWindow(
    dashboard.activity,
    dashboard.asOfDate,
    previous,
  );
  const day = window.days.find((item) => item.date === selectedDay);
  const percent = dashboard.totalPublished
    ? (dashboard.completed / dashboard.totalPublished) * 100
    : 0;
  const reviewFirst =
    recommendation?.practicePresentation.first === "review" &&
    progress.reviewQueue.length > 0;
  const href = practiceDestination(recommendation, progress.reviewQueue);
  const recent = [...progress.evidence]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const renderSegments = (id: string) => {
    const parts = evidenceSegments(forTopic(id));
    return (
      <span
        className="pd-segments"
        aria-label={parts
          .map((part) => `${part.count} ${part.label.toLowerCase()}`)
          .join(", ")}
      >
        {parts
          .filter((part) => part.count)
          .map((part) => (
            <span
              key={part.status}
              className={`pd-${part.status}`}
              style={{ flex: part.count }}
            />
          ))}
        {!forTopic(id).length && (
          <span className="pd-not_assessed" style={{ flex: 1 }} />
        )}
      </span>
    );
  };
  return (
    <div className="progress-dashboard">
      <div className="pd-language">
        <label htmlFor="progress-language">Mastery evidence in</label>
        <select
          id="progress-language"
          value={language}
          onChange={(event) => onLanguage(event.target.value as Language)}
        >
          {Object.entries(languages).map(([id, name]) => (
            <option value={id} key={id}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <section
        className="pd-summary"
        aria-label="Progress across all languages"
      >
        <article className="card pd-next">
          <span className="metric-label">Next best practice</span>
          <h2>
            {reviewFirst
              ? "Make room for a review"
              : recommendation?.problemId
                ? "Continue learning"
                : "Choose your focus"}
          </h2>
          {recommendationLoading ? (
            <p role="status">Finding your next practice…</p>
          ) : recommendationError ? (
            <div role="alert">
              <p>Your recommendation could not load.</p>
              <button className="ghost" onClick={retryRecommendation}>
                Retry recommendation
              </button>
            </div>
          ) : (
            <>
              <p>
                {reviewFirst
                  ? recommendation?.practicePresentation.reason ||
                    "A fresh attempt helps you revisit what you learned. Choose a due review at your own pace."
                  : recommendation?.rationale ||
                    "Choose a topic on your roadmap to start a path based on your practice."}
              </p>
              {!reviewFirst && recommendation?.learningRequirement && (
                <small>
                  What you’ll practise: {recommendation.learningRequirement}
                </small>
              )}
              {recommendation?.pendingStep != null && (
                <p className="pd-caption">
                  Pending goal: step {recommendation.pendingStep}.{" "}
                  {reviewFirst
                    ? "Review keeps your pending goal in place."
                    : "Prerequisite practice preserves this goal."}
                </p>
              )}
              <Link className="pd-action" to={href}>
                {reviewFirst
                  ? "Begin a review"
                  : recommendation?.problemId
                    ? "Continue learning"
                    : "Explore roadmap"}{" "}
                →
              </Link>
              {!reviewFirst && recommendation?.practicePresentation.reason && (
                <small>{recommendation.practicePresentation.reason}</small>
              )}
            </>
          )}
        </article>
        <article className="card pd-completion">
          <div className="pd-solve">
            <div>
              <span className="metric-label">Questions completed</span>
              <p className="pd-number">
                {dashboard.completed}{" "}
                <small>/ {dashboard.totalPublished}</small>
              </p>
              <p className="pd-caption">Completion is separate from mastery</p>
            </div>
            <div className="pd-donut">
              <svg
                viewBox="0 0 132 132"
                role="img"
                aria-label={`${dashboard.completed} of ${dashboard.totalPublished} published questions completed, ${percent.toFixed(1)} percent`}
              >
                <circle
                  cx="66"
                  cy="66"
                  r="56"
                  fill="none"
                  className="pd-ring-track"
                  strokeWidth="10"
                />
                {percent > 0 && (
                  <circle
                    cx="66"
                    cy="66"
                    r="56"
                    fill="none"
                    className="pd-ring"
                    strokeWidth="10"
                    strokeDasharray={`${(percent / 100) * 351.86} 351.86`}
                    strokeLinecap="round"
                    transform="rotate(-90 66 66)"
                  />
                )}
              </svg>
              <div>
                <strong>
                  {percent.toFixed(1)}
                  <small>%</small>
                </strong>
                <span>Completion</span>
              </div>
            </div>
          </div>
          <div className="pd-counts">
            <div>
              <strong>{dashboard.independent}</strong>
              <span>Independent questions</span>
            </div>
            <div>
              <strong>{dashboard.assisted}</strong>
              <span>Learned with help</span>
            </div>
          </div>
          <small>
            Across all languages ·{" "}
            {Math.max(0, dashboard.totalPublished - dashboard.completed)} still
            to explore
          </small>
        </article>
        <article className="card pd-due">
          <span className="metric-label">Due reviews</span>
          <p className="pd-number">{progress.reviewQueue.length}</p>
          <p>
            Retention practice at your own pace. Missing a day never removes
            your progress.
          </p>
          {progress.reviewQueue[0] ? (
            <Link
              className="pd-action"
              to={`/problems/${progress.reviewQueue[0].problemId}?mode=review`}
            >
              Begin a review →
            </Link>
          ) : (
            <small>
              No reviews due. Your queue grows from completed practice.
            </small>
          )}
          <a href="#progress-reviews">View review schedule ↓</a>
        </article>
      </section>
      <section className="card pd-activity" aria-labelledby="progress-activity">
        <div className="section-head">
          <div>
            <h2 id="progress-activity">
              {window.total} submissions in{" "}
              {previous ? "the previous year" : "the last year"}
            </h2>
            <p className="pd-caption">
              Every recorded attempt is part of practice. Submissions are not
              unique solves.
            </p>
          </div>
          <label className="pd-period">
            Activity period
            <select
              value={previous ? "previous" : "current"}
              onChange={(event) => {
                setPrevious(event.target.value === "previous");
                setSelectedDay(null);
              }}
            >
              <option value="current">Last 365 days</option>
              <option value="previous">Previous 365 days</option>
            </select>
          </label>
        </div>
        <div className="pd-activity-metrics">
          <span>
            Active days <b>{window.active}</b>
          </span>
          <span>
            Longest streak <b>{window.longest} days</b>
          </span>
          <span>{dashboard.timezone}</span>
        </div>
        <div className="pd-heat-scroll">
          <div
            className="pd-heat-months"
            aria-hidden="true"
            style={{
              gridTemplateColumns: `repeat(${Math.ceil((365 + window.offset) / 7)}, minmax(12px, 1fr))`,
            }}
          >
            {window.days.map((item, index) =>
              index === 0 || item.date.endsWith("-01") ? (
                <span
                  key={item.date}
                  style={{
                    gridRow: 1,
                    gridColumn: `${Math.min(Math.floor((index + window.offset) / 7) + 1, Math.ceil((365 + window.offset) / 7) - 2)} / span 3`,
                  }}
                >
                  {new Date(`${item.date}T00:00:00Z`).toLocaleString(
                    undefined,
                    { month: "short", timeZone: "UTC" },
                  )}
                </span>
              ) : null,
            )}
          </div>
          <div
            className="pd-heat"
            style={{
              gridTemplateColumns: `repeat(${Math.ceil((365 + window.offset) / 7)}, minmax(12px, 1fr))`,
            }}
            aria-label="Daily submission activity"
          >
            {Array.from({ length: window.offset }, (_, index) => (
              <span key={`pad-${index}`} aria-hidden="true" />
            ))}
            {window.days.map((item) => (
              <button
                key={item.date}
                type="button"
                className={`pd-heat-cell pd-heat-${item.submissions === 0 ? 0 : item.submissions < 3 ? 1 : item.submissions < 6 ? 2 : item.submissions < 10 ? 3 : 4}`}
                aria-label={`${item.date}: ${item.submissions} submissions, ${item.accepted} accepted`}
                aria-pressed={selectedDay === item.date}
                tabIndex={
                  item.date === (selectedDay ?? window.days[0].date) ? 0 : -1
                }
                onKeyDown={(event) => {
                  const shifts: Record<string, number> = {
                    ArrowUp: -1,
                    ArrowDown: 1,
                    ArrowLeft: -7,
                    ArrowRight: 7,
                    Home: -365,
                    End: 365,
                  };
                  if (!(event.key in shifts)) return;
                  event.preventDefault();
                  const index = window.days.findIndex(
                    (day) => day.date === item.date,
                  );
                  const next = Math.max(
                    0,
                    Math.min(364, index + shifts[event.key]),
                  );
                  setSelectedDay(window.days[next].date);
                  event.currentTarget.parentElement
                    ?.querySelectorAll<HTMLButtonElement>("button")
                    [next]?.focus();
                }}
                title={`${item.date}: ${item.submissions} submissions`}
                onClick={() => setSelectedDay(item.date)}
              />
            ))}
          </div>
        </div>
        <div className="pd-heat-foot">
          <span aria-live="polite">
            {day
              ? `${day.date}: ${day.submissions} submissions · ${day.accepted} accepted`
              : `${window.days[0].date} – ${window.days.at(-1)!.date} · Select a day for details.`}
          </span>
          <span
            className="pd-heat-legend"
            aria-label="Fewer to more submissions"
          >
            Less{" "}
            {[0, 1, 2, 3, 4].map((level) => (
              <i key={level} className={`pd-heat-${level}`} />
            ))}{" "}
            More
          </span>
        </div>
        {!window.total && (
          <p className="pd-caption">
            No submissions in this period.{" "}
            <Link to="/problems">Choose a first challenge →</Link>
          </p>
        )}
      </section>
      <section className="section" aria-labelledby="progress-mastery">
        <div className="section-head">
          <div>
            <h2 id="progress-mastery">Topic mastery</h2>
            <p className="pd-caption">
              Skill evidence in {languages[language]} · solved counts combine
              all languages
            </p>
          </div>
          <button
            className="ghost"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded
              ? "Show fewer topics"
              : `View all ${topics.length} topics`}{" "}
            ↗
          </button>
        </div>
        <div className="pd-mastery">
          <article className="card">
            <div className="pd-map-head">
              <strong>Your learning map</strong>
              <small>Select a topic to see its evidence</small>
            </div>
            <div className="pd-topic-labels" aria-hidden="true">
              <span>Topic</span>
              <span>Skill evidence</span>
              <span>Solved</span>
            </div>
            {(expanded ? topics : topics.slice(0, 8)).map((item) => (
              <button
                type="button"
                key={item.id}
                className="pd-topic-row"
                aria-pressed={item.id === topic?.id}
                onClick={() => setSelected(item.id)}
              >
                <span>{item.name}</span>
                {renderSegments(item.id)}
                <span className="pd-topic-count">
                  {item.independent + item.assisted}{" "}
                  <small>/ {item.count}</small>
                </span>
              </button>
            ))}
            <div className="pd-skill-key">
              {skillStates.map((state, index) => (
                <span key={state}>
                  <i className={`pd-${state}`} />
                  {skillLabels[index]}
                </span>
              ))}
            </div>
            <p className="pd-caption">
              Bars describe recorded skills, never a mastery percentage.
            </p>
          </article>
          <article className="card pd-topic-detail" aria-live="polite">
            {topic ? (
              <>
                <span className="eyebrow">
                  {languages[language]} skill evidence
                </span>
                <h2>{topic.name}</h2>
                <p className="pd-caption">
                  {topic.independent + topic.assisted} / {topic.count} questions
                  completed · All languages
                </p>
                <div
                  className="pd-skill-blocks"
                  aria-label={`Individual skill evidence in ${languages[language]}`}
                >
                  {skills.map((skill) => (
                    <span
                      key={skill.skillId}
                      className={`pd-${skill.status}`}
                      role="img"
                      aria-label={`${prettySkill(skill.skillId)}: ${skillLabels[skillStates.indexOf(skill.status)]}`}
                      title={`${prettySkill(skill.skillId)}: ${skillLabels[skillStates.indexOf(skill.status)]}`}
                    />
                  ))}
                </div>
                <div className="pd-evidence-counts">
                  {evidenceSegments(skills).map((part) => (
                    <div key={part.status}>
                      <strong>{part.count}</strong>
                      <span>{part.label}</span>
                    </div>
                  ))}
                </div>
                <div className="pd-path-steps">
                  <div>
                    <span>Working step · {languages[language]}</span>
                    <strong>
                      {topicPath?.lastEvidenceId
                        ? topicPath.workingStep
                        : "Not assessed"}
                    </strong>
                  </div>
                  <div>
                    <span>Independent step · {languages[language]}</span>
                    <strong>
                      {topicPath?.highestIndependentStep ?? "Not demonstrated"}
                    </strong>
                  </div>
                </div>
                <div
                  className="pd-step-track"
                  aria-label={`Published practice steps for ${topic.name}`}
                >
                  {(
                    dashboard.topicSkills.find(
                      (entry) => entry.topic === topic.id,
                    )?.steps ?? []
                  ).map((step) => (
                    <span
                      key={step}
                      className={
                        topicPath?.lastEvidenceId &&
                        topicPath.workingStep === step
                          ? "pd-step-working"
                          : topicPath?.highestIndependentStep === step
                            ? "pd-step-independent"
                            : ""
                      }
                      title={`Step ${step}${topicPath?.lastEvidenceId && topicPath.workingStep === step ? ": working step" : ""}${topicPath?.highestIndependentStep === step ? ": highest independently demonstrated step" : ""}`}
                    >
                      {step}
                    </span>
                  ))}
                </div>
                <p className="pd-caption">
                  Working and independently demonstrated steps are different.
                  Learning with help builds understanding before a fresh
                  checkpoint.
                </p>
                {latestReview && (
                  <p className="pd-caption">
                    Latest successful review:{" "}
                    <Link
                      to={`/problems/${titleFor(latestReview.problemId)}?mode=review`}
                    >
                      {titleFor(latestReview.problemId)}
                    </Link>{" "}
                    · {formatDate(latestReview.createdAt)}
                  </p>
                )}
                <div className="pd-small-step">
                  <strong>Your next small step</strong>
                  <p className="pd-caption">
                    Explore this topic to choose an eligible challenge. Your
                    next recommendation considers prerequisites and preserves
                    any pending goal.
                  </p>
                  <Link className="pd-action" to={`/topics/${topic.id}`}>
                    Explore {topic.name} →
                  </Link>
                </div>
                {skills.length ? (
                  <div className="pd-skills">
                    <h3>Supporting skills · {languages[language]}</h3>
                    {supportingSkills.slice(0, 4).map(renderSkill)}
                    {skills.length > 4 && (
                      <details
                        className="pd-remaining-skills"
                        key={`${topic.id}-${language}`}
                      >
                        <summary>
                          View all {skills.length} skills and their evidence
                        </summary>
                        {supportingSkills.slice(4).map(renderSkill)}
                      </details>
                    )}
                  </div>
                ) : (
                  <p className="pd-caption">
                    No assessed skills in this language yet. Practice creates
                    specific evidence.
                  </p>
                )}
              </>
            ) : (
              <p>No published topics are available.</p>
            )}
          </article>
        </div>
        <p className="pd-insight">
          One manageable step, when you’re ready. Independent practice can
          advance your path; learning with help leads to a fresh checkpoint.
        </p>
      </section>
      <div className="pd-bottom">
        <section className="card" id="progress-reviews">
          <h2>Review schedule</h2>
          {schedule.total ? (
            <>
              {schedule.visible.map(renderReview)}
              {schedule.remaining.length > 0 && (
                <details className="pd-full-schedule">
                  <summary>View all {schedule.total} scheduled reviews</summary>
                  {schedule.remaining.map(renderReview)}
                </details>
              )}
            </>
          ) : (
            <p className="pd-caption">
              No scheduled reviews yet. Complete practice to build your review
              queue.
            </p>
          )}
        </section>
        <section className="card">
          <div className="section-head">
            <h2>Recent learning evidence</h2>
            <a
              href="#progress-evidence"
              onClick={() =>
                revealProgressEvidence(
                  document.querySelector<HTMLDetailsElement>(
                    "#progress-evidence",
                  ),
                )
              }
            >
              All evidence ↓
            </a>
          </div>
          {recent.length ? (
            recent.map((evidence) => (
              <div key={evidence.id} className="pd-review-row">
                {evidence.outcome === "accepted" ? (
                  <CheckCircle2
                    size={16}
                    className="pd-row-icon"
                    aria-hidden="true"
                  />
                ) : (
                  <History
                    size={16}
                    className="pd-row-icon"
                    aria-hidden="true"
                  />
                )}
                <div>
                  <Link to={`/problems/${evidence.problemId}`}>
                    {titleFor(evidence.problemId)}
                  </Link>
                  <span>
                    {learningOutcomeLabel(evidence)} ·{" "}
                    {languages[evidence.language]}
                  </span>
                  <small>{formatDate(evidence.createdAt)}</small>
                </div>
              </div>
            ))
          ) : (
            <p className="pd-caption">
              Your practice will tell the story. A judged submission creates
              your first learning record.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
