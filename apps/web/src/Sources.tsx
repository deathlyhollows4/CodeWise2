import React, { useEffect, useState } from "react";
import { ShieldCheck, Download, RefreshCw } from "lucide-react";
import { api, download } from "./api";
import notices from "./dependency-notices.json";
import { safeLink } from "../../../packages/lesson-renderer/src";
export function Sources() {
  const [sources, setSources] = useState<any[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [noticeSearch, setNoticeSearch] = useState(""),
    [allNotices, setAllNotices] = useState(false);
  const focused = new Set([
    "dompurify",
    "highlight.js",
    "@monaco-editor/loader",
  ]);
  const visibleNotices = notices.filter((n) =>
    noticeSearch
      ? `${n.name} ${n.license}`
          .toLowerCase()
          .includes(noticeSearch.toLowerCase())
      : allNotices || n.direct || focused.has(n.name),
  );
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setSources(await api("sources"));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Transparent by design</div>
          <h1>Sources & licenses</h1>
          <p className="subtitle">
            Content provenance and the license notices that accompany your local
            application.
          </p>
        </div>
        <button
          onClick={() =>
            download(
              "CodeWise2-dependency-notices.txt",
              notices
                .map(
                  (n) => `${n.name} ${n.version} — ${n.license}\n\n${n.notice}`,
                )
                .join("\n\n────────────────\n\n"),
            )
          }
        >
          <Download size={16} />
          Export notices
        </button>
      </div>
      <div className="notice">
        <ShieldCheck size={18} />
        <div>
          CodeWise2 is an independent learning application. NeetCode is a
          curriculum topic/count reference. No affiliation with NeetCode,
          LeetCode, Exercism or DeepSeek is claimed.
        </div>
      </div>
      <section className="section">
        <h2>Content provenance</h2>
        {error ? (
          <div className="notice error" role="alert">
            {error}
            <button onClick={load}>
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        ) : loading ? (
          <p className="muted" aria-busy="true">
            Loading bundled source records…
          </p>
        ) : sources.length ? (
          sources.map((s: any) => (
            <div className="card section" key={s.problemId}>
              <div className="row">
                <h3 style={{ margin: 0 }}>{s.title || s.problemId}</h3>
                <span className="badge">
                  {s.originType === "test-fixture"
                    ? "Test fixture · excluded from release"
                    : s.origin || "Recorded content"}
                </span>
              </div>
              <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
                {s.author ? `Author: ${s.author}. ` : ""}
                {s.rightsStatus ||
                  (s.originType === "test-fixture"
                    ? "Explicit temporary browser fixture, not a published core source record."
                    : "Asset-level rights are shown below.")}
              </p>
              {s.assets && (
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Asset</th>
                        <th>Origin</th>
                        <th>License / permission</th>
                        <th>Attribution and modifications</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(s.assets).map(
                        ([kind, record]: [string, any]) => (
                          <tr key={kind}>
                            <td>
                              {kind.replace(/^./, (c) => c.toUpperCase())}
                            </td>
                            <td>{record.origin || "Not recorded"}</td>
                            <td>
                              {record.license || "Not recorded"}
                              {record.sourceUrl &&
                                safeLink(record.sourceUrl) && (
                                  <small style={{ display: "block" }}>
                                    <a
                                      href={safeLink(record.sourceUrl)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      Source evidence ↗
                                    </a>
                                  </small>
                                )}
                              {record.revision && (
                                <small style={{ display: "block" }}>
                                  Pinned revision: {record.revision}
                                </small>
                              )}
                            </td>
                            <td>
                              {record.attribution ||
                                s.author ||
                                "See preserved source notice"}
                              {record.modifications && (
                                <small style={{ display: "block" }}>
                                  Changes:{" "}
                                  {typeof record.modifications === "string"
                                    ? record.modifications
                                    : record.modifications.join(", ")}
                                </small>
                              )}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <small style={{ display: "block", marginTop: 14 }}>
                Review: {s.reviewerType || "Test fixture metadata"} ·{" "}
                {s.reviewDate || "Not recorded"} · Independent review:{" "}
                {s.independentReview || "Not recorded"}
              </small>
              {s.excludedAssets?.length > 0 && (
                <p className="muted" style={{ fontSize: 12 }}>
                  Excluded assets: {s.excludedAssets.join(", ")}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="empty">
            <h3>No published source records yet</h3>
            <p>
              Only validated published packs contribute to the production
              catalogue. Authoring drafts and test fixtures are not publication
              proof.
            </p>
          </div>
        )}
      </section>
      <section className="section">
        <h2>Application dependency notices</h2>
        <p className="muted">
          These are the actual installed package versions. Interface and code
          text use local system font fallbacks; KaTeX math fonts and editor
          assets are bundled with their package notices.
        </p>
        <div className="card list-card">
          <div className="notice-filter">
            <input
              aria-label="Search dependency notices"
              placeholder="Search package or license…"
              value={noticeSearch}
              onChange={(e) => setNoticeSearch(e.target.value)}
            />
            <button onClick={() => setAllNotices(!allNotices)}>
              {allNotices ? "Key packages" : `All ${notices.length} packages`}
            </button>
          </div>
          {visibleNotices.map((n) => (
            <details
              className="dependency-notice"
              key={`${n.name}@${n.version}`}
            >
              <summary>
                <span>
                  {n.name} <small>{n.version}</small>
                </span>
                <span className="badge">{n.license}</span>
              </summary>
              <pre className="notice-text">{n.notice}</pre>
            </details>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>
          Complete notices are also preserved in the source documentation.
          Installed Node.js, browser and isolated execution runtimes retain
          their own distribution notices. Automated content review is identified
          explicitly in each provenance record.
        </p>
      </section>
    </div>
  );
}
