import React from "react";
function metric(value: unknown, seconds = false) {
  if (value === null || value === undefined || value === "")
    return "Not reported";
  if (!["number", "string"].includes(typeof value)) return "Not reported";
  const n = Number(value);
  return Number.isFinite(n) && n >= 0
    ? seconds
      ? n.toFixed(3)
      : n.toLocaleString()
    : "Not reported";
}
export function RuntimeMeasurements({ runtime }: { runtime: any }) {
  if (!runtime)
    return (
      <small>
        Program measurements were not reported. Queue time is not program
        runtime.
      </small>
    );
  const phases = runtime.phases || [runtime];
  return (
    <details className="runtime-measurements">
      <summary>Measured runtime details</summary>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Isolated phase</th>
              <th>CPU seconds</th>
              <th>Wall seconds</th>
              <th>Maximum RSS (KiB)</th>
            </tr>
          </thead>
          <tbody>
            {phases.map((phase: any, i: number) => (
              <tr key={i}>
                <td>
                  {phase.name || "Run"}
                  {phase.phase === "compile" ? " · compilation" : ""}
                </td>
                <td>{metric(phase.cpuSeconds, true)}</td>
                <td>{metric(phase.wallSeconds, true)}</td>
                <td>{metric(phase.memoryKb)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <small>
        These are reported sandbox measurements, including the harness and
        runtime overhead. Queue time is excluded; measurements do not prove
        asymptotic complexity.
      </small>
    </details>
  );
}
