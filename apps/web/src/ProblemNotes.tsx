import React, { useEffect, useState } from "react";
import { Bookmark, Check } from "lucide-react";
import { api } from "./api";
export function ProblemNotes({
  problemId,
  notify,
}: {
  problemId: string;
  notify: (message: string) => void;
}) {
  const [state, setState] = useState<any>(null),
    [notes, setNotes] = useState(""),
    [status, setStatus] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api(`problems/${problemId}/state`)
      .then((value) => {
        if (active) {
          setState(value);
          setNotes(value.notes || "");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [problemId]);
  async function patch(value: any) {
    setStatus("Saving…");
    try {
      const next = await api(`problems/${problemId}/state`, "PATCH", value);
      setState(next);
      setStatus("Saved on this device");
    } catch (e: any) {
      setStatus("Could not save");
      notify(e.message);
    }
  }
  return (
    <section className="problem-notes">
      <div className="row">
        <h3>Your study notes</h3>
        <button
          disabled={!state}
          aria-pressed={!!state?.bookmarked}
          onClick={() => patch({ bookmarked: !state?.bookmarked })}
        >
          <Bookmark size={15} />
          {state?.bookmarked ? "Bookmarked" : "Bookmark"}
        </button>
      </div>
      <p className="muted" style={{ fontSize: 12 }}>
        Your own notes work without an AI key and stay on this device.
      </p>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      <textarea
        aria-label="Personal problem notes"
        rows={4}
        disabled={!state}
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setStatus("Unsaved changes");
        }}
        placeholder="Write down the invariant, an edge case, or what you want to revisit."
      />
      <div className="actions" style={{ marginTop: 10 }}>
        <button
          disabled={!state || status === "Saving…"}
          onClick={() => patch({ notes })}
        >
          <Check size={14} />
          Save notes
        </button>
        <small role="status">{status}</small>
      </div>
      {state && (
        <small style={{ display: "block", marginTop: 14 }}>
          {state.independent
            ? "Solved independently"
            : state.assisted
              ? "Learned with help"
              : "No accepted evidence yet"}{" "}
          ·{" "}
          {["java", "cpp", "python"]
            .map(
              (l) =>
                `${languageName(l)} ${state.languages?.[l]?.attempts || 0} attempts`,
            )
            .join(" · ")}
        </small>
      )}
    </section>
  );
}
function languageName(value: string) {
  return { java: "Java", cpp: "C++", python: "Python" }[value] || value;
}
