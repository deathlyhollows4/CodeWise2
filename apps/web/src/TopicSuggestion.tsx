import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";

export function TopicSuggestion({
  topicId,
  topicName,
  language,
}: {
  topicId: string;
  topicName: string;
  language: string;
}) {
  const navigate = useNavigate(),
    request = useRef(0);
  const [suggestion, setSuggestion] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<any>(null);
  useEffect(() => {
    request.current++;
    setSuggestion(null);
    setError(null);
    setBusy(false);
    return () => {
      request.current++;
    };
  }, [topicId, language]);
  async function suggest() {
    const selected = ++request.current;
    setBusy(true);
    setError(null);
    try {
      const recommendation = await api(
        `recommendation?topic=${encodeURIComponent(topicId)}&language=${encodeURIComponent(language)}`,
      );
      const problem = recommendation.problemId
        ? await api(`problems/${recommendation.problemId}`)
        : null;
      if (selected === request.current)
        setSuggestion({ recommendation, problem });
    } catch (e) {
      if (selected === request.current) setError(e);
    } finally {
      if (selected === request.current) setBusy(false);
    }
  }
  async function start() {
    if (!suggestion?.problem || busy) return;
    const selected = ++request.current;
    setBusy(true);
    setError(null);
    try {
      await api("learning/select", "POST", {
        problemId: suggestion.problem.id,
        mode: "manual",
      });
      if (selected === request.current)
        navigate(`/problems/${suggestion.problem.id}`);
    } catch (e) {
      if (selected === request.current) setError(e);
    } finally {
      if (selected === request.current) setBusy(false);
    }
  }
  const r = suggestion?.recommendation,
    p = suggestion?.problem;
  return (
    <section
      className="card section"
      aria-label="Topic challenge suggestion"
      style={{ marginBottom: 22 }}
    >
      <div className="row">
        <h2>Suggested next challenge</h2>
        <button disabled={busy} onClick={() => void suggest()}>
          {busy
            ? "Finding your next step…"
            : suggestion
              ? "Refresh suggestion"
              : "Suggest a challenge"}
        </button>
      </div>
      {!suggestion && (
        <p className="muted">
          Find an eligible starting point in {topicName}. If a prerequisite is
          missing, practise its real foundation first. Your topic goal remains
          separate from that preparation.
        </p>
      )}
      {error && (
        <div className="notice error" role="alert">
          <div>
            {error.message || "The suggestion could not be loaded."}
            {error.recoveryAction && (
              <small style={{ display: "block" }}>{error.recoveryAction}</small>
            )}
          </div>
        </div>
      )}
      {r && (
        <>
          {p ? (
            <>
              <span className="badge">
                {r.mode === "prerequisite_remediation"
                  ? "Prerequisite practice"
                  : "Eligible challenge"}
              </span>
              <h3>{p.title}</h3>
              <p>{r.rationale}</p>
              {r.learningRequirement && (
                <p>
                  <strong>What you’ll practise: </strong>
                  {r.learningRequirement}
                </p>
              )}
              <button
                className="primary"
                disabled={busy}
                onClick={() => void start()}
              >
                {r.mode === "prerequisite_remediation"
                  ? "Start prerequisite practice"
                  : "Open suggested challenge"}
              </button>
            </>
          ) : (
            <>
              <h3>No eligible new challenge right now</h3>
              <p>{r.rationale}</p>
              <p className="muted">
                You can still choose a question from this topic’s list. Existing
                evidence is preserved.
              </p>
            </>
          )}
        </>
      )}
    </section>
  );
}
