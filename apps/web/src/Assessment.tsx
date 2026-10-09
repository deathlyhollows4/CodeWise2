import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StoredAssessmentSchema } from "../../../packages/contracts/src/index";
import { api } from "./api";
const languageName = (language: string) =>
  ({ java: "Java", cpp: "C++", python: "Python" })[language] || language;
const skillName = (skill: string) =>
  skill.replaceAll(".", " · ").replaceAll("-", " ");
function readState(value: unknown) {
  const parsed = StoredAssessmentSchema.safeParse(value);
  if (!parsed.success)
    throw Error(
      "The assessment state could not be read. Restart the local app and retry.",
    );
  return parsed.data;
}
export function Assessment({
  preferredLanguage = "python",
}: {
  preferredLanguage?: string;
}) {
  const [state, setState] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [language, setLanguage] = useState(preferredLanguage),
    [experience, setExperience] = useState("beginner");
  useEffect(() => {
    let current = true;
    api("assessment")
      .then((value) => {
        if (current) setState(readState(value));
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, []);
  async function perform(start = false, stop = false) {
    setBusy(true);
    setError("");
    try {
      setState(
        readState(
          await api(
            start
              ? "assessment/start"
              : stop
                ? "assessment/stop"
                : "assessment/next",
            "POST",
            start ? { experience, language } : {},
          ),
        ),
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const current = state?.schemaVersion === 2 ? state : null,
    question = current?.questions.find(
      (q: any) => q.problemId === current.currentProblemId,
    );
  return (
    <div className="page">
      <div className="eyebrow">A conservative starting point</div>
      <h1>Your placement assessment</h1>
      <p className="subtitle">
        A short adaptive set of six to ten core questions helps choose your
        starting challenge. Untried skills stay unassessed.
      </p>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {!state && !error && (
        <div className="card" role="status">
          Loading the saved assessment…
        </div>
      )}
      {state && (
        <>
          <section className="card section">
            <div className="row">
              <h2>
                {state.status === "active"
                  ? "One question at a time"
                  : state.status === "complete"
                    ? "Your observed starting point"
                    : state.status === "stopped"
                      ? "Assessment stopped"
                      : state.status === "unavailable"
                        ? "Assessment is not available yet"
                        : "Choose your starting point"}
              </h2>
              {current && (
                <span className="badge">
                  {languageName(current.language)} · fixed for this assessment
                </span>
              )}
            </div>
            <p className="muted">
              {state.message ||
                "Start when you are ready. Your previous learning evidence stays intact."}
            </p>
            {current && (
              <p role="status" data-assessment-progress>
                {current.completed.length} of {current.targetQuestions}{" "}
                questions observed. {current.problemIds.length} selected so far.
              </p>
            )}
            {question && state.status === "active" && (
              <div className="notice" style={{ marginTop: 18 }}>
                <div>
                  <strong>{question.title}</strong>
                  <p style={{ margin: "8px 0" }}>{question.reason}</p>
                  <Link
                    className="primary"
                    style={{
                      display: "inline-flex",
                      padding: "10px 14px",
                      borderRadius: 8,
                      color: "#fff",
                    }}
                    to={`/problems/${question.problemId}?mode=assessment`}
                  >
                    Open current question →
                  </Link>
                </div>
              </div>
            )}
            {state.status === "active" && (
              <>
                <p className="muted" style={{ fontSize: 13, marginTop: 18 }}>
                  Only a meaningful, full graded Submit in{" "}
                  {languageName(current?.language || state.language)} after this
                  question was selected can become an observation. Run,
                  unfinished jobs, unchanged starters, compile/infrastructure
                  failures, older attempts and other languages do not complete
                  it.
                </p>
                <div className="actions">
                  <button disabled={busy} onClick={() => void perform()}>
                    Check saved graded submit and continue
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => void perform(false, true)}
                  >
                    Stop assessment early
                  </button>
                </div>
              </>
            )}
            <div className="divider" />
            <small>
              Independent acceptance supports a demonstrated skill. Accepted
              work with recorded assistance is kept as an observation, not
              independent mastery. This assessment does not establish
              proficiency in every topic.
            </small>
          </section>
          {current && (
            <section className="section">
              <div className="grid two">
                <div className="card">
                  <h2>Demonstrated independently</h2>
                  <div className="stat">{current.knownSkillIds.length}</div>
                  {current.knownSkillIds.length ? (
                    <ul>
                      {current.knownSkillIds.map((skill: string) => (
                        <li key={skill}>{skillName(skill)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">
                      No independently accepted skill observation yet.
                    </p>
                  )}
                </div>
                <div className="card">
                  <h2>Still unassessed</h2>
                  <div className="stat">{current.unknownSkillIds.length}</div>
                  <p className="muted">
                    These selected skills have no independent acceptance here.
                    Other topics remain outside this short assessment.
                  </p>
                  {current.unknownSkillIds.length > 0 && (
                    <details>
                      <summary>View these skills</summary>
                      <ul>
                        {current.unknownSkillIds.map((skill: string) => (
                          <li key={skill}>{skillName(skill)}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
              <h2 style={{ marginTop: 24 }}>Observed attempts</h2>
              {current.observations.length ? (
                <div className="card list-card">
                  {current.observations.map((observation: any) => {
                    const q = current.questions.find(
                      (q: any) => q.problemId === observation.problemId,
                    );
                    return (
                      <div key={observation.jobId} className="lesson-row">
                        <div className="problem-title">
                          <Link to={`/problems/${observation.problemId}`}>
                            {q?.title || observation.problemId}
                          </Link>
                          <small>
                            {observation.outcome === "independent-accepted"
                              ? "Accepted independently"
                              : observation.outcome === "assisted-accepted"
                                ? "Accepted with assistance"
                                : "Wrong answer · skills stay unassessed"}
                          </small>
                          <small>
                            Saved graded attempt {observation.jobId.slice(0, 8)}
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="muted">
                  Your first eligible graded Submit will appear here after you
                  check progress.
                </p>
              )}
            </section>
          )}
          {state.status !== "active" && (
            <section className="card section">
              <h2>
                {state.legacy ? "Start a new assessment" : "Ready when you are"}
              </h2>
              <div className="field-inline">
                <div className="field">
                  <label htmlFor="assessment-language">
                    Assessment language
                  </label>
                  <select
                    id="assessment-language"
                    value={language}
                    disabled={busy}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    {["java", "cpp", "python"].map((value) => (
                      <option key={value} value={value}>
                        {languageName(value)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="assessment-experience">Your experience</label>
                  <select
                    id="assessment-experience"
                    value={experience}
                    disabled={busy}
                    onChange={(e) => setExperience(e.target.value)}
                  >
                    <option value="beginner">I'm just starting</option>
                    <option value="some">I've tried a few topics</option>
                    <option value="comfortable">
                      I'm comfortable with the basics
                    </option>
                  </select>
                </div>
              </div>
              <button
                className="primary"
                disabled={busy}
                onClick={() => void perform(true)}
              >
                Start a new assessment
              </button>
              <p className="muted" style={{ fontSize: 13 }}>
                Starts a new placement session and keeps your existing learning
                evidence.
              </p>
            </section>
          )}
          <div className="actions section">
            <Link to="/roadmap">Explore the roadmap →</Link>
            <Link to="/">Return Home</Link>
          </div>
        </>
      )}
    </div>
  );
}
export function AssessmentWorkspacePanel({
  problemId,
  language,
  job,
  draftReady,
  onLanguage,
  onReady,
}: {
  problemId: string;
  language: string;
  job: any;
  draftReady: boolean;
  onLanguage: (language: string) => Promise<void>;
  onReady: (ready: boolean) => void;
}) {
  const [state, setState] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    sequence = useRef(0),
    navigate = useNavigate();
  useEffect(() => {
    const current = ++sequence.current;
    api("assessment")
      .then((value) => {
        if (current === sequence.current) setState(readState(value));
      })
      .catch((e) => {
        if (current === sequence.current) setError(e.message);
      });
    return () => {
      sequence.current++;
    };
  }, [problemId, job?.id, job?.status]);
  const active =
    state?.schemaVersion === 2 &&
    state.status === "active" &&
    state.currentProblemId === problemId;
  useEffect(() => {
    let current = true;
    if (!active) {
      onReady(false);
      return;
    }
    if (language === state.language && draftReady) {
      onReady(true);
      return;
    }
    onReady(false);
    if (language === state.language) return;
    void onLanguage(state.language).catch((e) => {
      if (current) setError(e.message);
    });
    return () => {
      current = false;
    };
  }, [active, state?.language, language, draftReady, problemId]);
  const question = state?.questions?.find(
      (q: any) => q.problemId === problemId,
    ),
    graded =
      active &&
      job?.mode === "submit" &&
      job.problemId === problemId &&
      job.language === state.language &&
      job.meaningfulConceptualAttempt !== false &&
      ["accepted", "wrong_answer"].includes(job.status) &&
      job.createdAt >= state.currentSelectedAt;
  async function advance(stop = false) {
    setBusy(true);
    setError("");
    try {
      const next = readState(
        await api(stop ? "assessment/stop" : "assessment/next", "POST", {}),
      );
      setState(next);
      if (stop || !("schemaVersion" in next) || next.status !== "active")
        navigate("/assessment");
      else if (next.currentProblemId !== problemId)
        navigate(`/problems/${next.currentProblemId}?mode=assessment`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="card"
      style={{ marginBottom: 18 }}
      aria-label="Current placement assessment"
    >
      <div className="row">
        <strong>
          Placement assessment
          {active ? ` · ${languageName(state.language)}` : ""}
        </strong>
        <Link to="/assessment">View assessment progress →</Link>
      </div>
      {error && (
        <p role="alert" className="muted">
          {error}
        </p>
      )}
      {!state && !error ? (
        <p role="status">Loading the saved question selection…</p>
      ) : active ? (
        <>
          <p>
            {state.completed.length} of {state.targetQuestions} questions
            observed.
          </p>
          <p className="muted">{question?.reason}</p>
          <small>
            The selected language is fixed. Run and unchanged starters do not
            count; a full graded Submit is required.
          </small>
          <div className="actions" style={{ marginTop: 14 }}>
            <button
              className="primary"
              disabled={busy || !graded}
              onClick={() => void advance()}
            >
              Use graded submit and continue
            </button>
            <button disabled={busy} onClick={() => void advance(true)}>
              Stop assessment early
            </button>
          </div>
        </>
      ) : (
        <p className="muted">
          This question is no longer selected in an active assessment.{" "}
          <Link to={`/problems/${problemId}`}>Practice normally →</Link>
        </p>
      )}
    </section>
  );
}
