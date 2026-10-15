import React, { useEffect, useId, useRef, useState } from "react";
import {
  IDEA_MAP_MAX_CHARACTERS,
  parseIdeaMapDefinition,
} from "../../contracts/src/idea-map";

/** Missing measurements are retried after layout; large maps may fit below 1%. */
export function fitIdeaMapZoom(
  containerWidth: number,
  containerHeight: number,
  graphWidth: number,
  graphHeight: number,
): number | null {
  if (
    ![containerWidth, containerHeight, graphWidth, graphHeight].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  )
    return null;
  const zoom = Math.min(
    1.6,
    (containerWidth - 16) / graphWidth,
    (containerHeight - 16) / graphHeight,
  );
  return Number.isFinite(zoom) && zoom > 0 ? zoom : null;
}

function labelLines(label: string, width = 25, maxLines = 5) {
  const lines: string[] = [];
  let line = "";
  for (const word of label.split(/\s+/)) {
    if (line && line.length + word.length > width) {
      lines.push(line);
      line = "";
    }
    if (word.length > width) {
      if (line) {
        lines.push(line);
        line = "";
      }
      for (let index = 0; index < word.length; index += width)
        lines.push(word.slice(index, index + width));
    } else line += (line ? " " : "") + word;
  }
  if (line) lines.push(line);
  return lines
    .slice(0, maxLines)
    .map((text, index) =>
      index === maxLines - 1 && lines.length > maxLines
        ? text.slice(0, width - 3) + "…"
        : text,
    );
}

export function IdeaMapView({
  source,
  streaming = false,
}: {
  source: string;
  streaming?: boolean;
}) {
  const [tab, setTab] = useState("diagram"),
    [zoom, setZoom] = useState(1),
    [autoFit, setAutoFit] = useState(true),
    [selected, setSelected] = useState("");
  const pane = useRef<HTMLDivElement>(null),
    drag = useRef<{ x: number; y: number; left: number; top: number } | null>(
      null,
    );
  const marker = "idea-arrow-" + useId().replace(/:/g, "");
  const parsed = parseIdeaMapDefinition(source);
  const width = parsed.ok
    ? (Math.max(...parsed.map.nodes.map((node) => node.column)) + 1) * 246 + 40
    : 0;
  const height = parsed.ok
    ? (Math.max(...parsed.map.nodes.map((node) => node.row)) + 1) * 144 + 38
    : 0;
  const fit = () => {
    const container = pane.current;
    if (!container) return;
    const scale = fitIdeaMapZoom(
      container.clientWidth,
      container.clientHeight,
      width,
      height,
    );
    if (scale === null) return;
    setZoom(scale);
    container.scrollTo({ top: 0, left: 0 });
  };
  useEffect(() => {
    if (!autoFit || !parsed.ok || tab !== "diagram") return;
    const container = pane.current;
    if (!container) return;
    const update = () => {
      const scale = fitIdeaMapZoom(
        container.clientWidth,
        container.clientHeight,
        width,
        height,
      );
      if (scale !== null) {
        setZoom(scale);
        container.scrollTo({ top: 0, left: 0 });
      }
    };
    update();
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(container);
    window.addEventListener("resize", update);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [autoFit, parsed.ok, tab, width, height]);
  if (!parsed.ok)
    return (
      <div className="idea-map-invalid">
        <p role="status">
          {streaming
            ? "Building the diagram — waiting for a complete definition."
            : parsed.error}
        </p>
        {!streaming && (
          <details>
            <summary>View saved diagram definition</summary>
            <pre>{source}</pre>
          </details>
        )}
      </div>
    );
  const map = parsed.map;
  const position = (id: string) => {
    const node = map.nodes.find((item) => item.id === id)!;
    return { x: 142 + node.column * 246, y: 68 + node.row * 144 };
  };
  return (
    <section className="idea-map" aria-label={`Idea map: ${map.title}`}>
      <div className="idea-map-header">
        <strong>{map.title}</strong>
        <span>Generated · not execution-verified</span>
      </div>
      <div className="idea-map-toolbar">
        <div className="idea-map-tabs">
          <button
            aria-pressed={tab === "diagram"}
            onClick={() => setTab("diagram")}
          >
            Diagram
          </button>
          <button aria-pressed={tab === "code"} onClick={() => setTab("code")}>
            Code
          </button>
        </div>
        {tab === "diagram" && (
          <div className="idea-map-zoom">
            <button
              aria-label="Zoom out idea map"
              disabled={zoom <= 0.01}
              onClick={() => {
                setAutoFit(false);
                setZoom((value) => Math.max(0.01, value - 0.1));
              }}
            >
              −
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              aria-label="Zoom in idea map"
              disabled={zoom >= 1.6}
              onClick={() => {
                setAutoFit(false);
                setZoom((value) => Math.min(1.6, value + 0.1));
              }}
            >
              +
            </button>
            <button
              onClick={() => {
                setAutoFit(true);
                fit();
              }}
            >
              Fit
            </button>
            <button
              onClick={() => {
                setAutoFit(true);
                fit();
              }}
            >
              Reset
            </button>
          </div>
        )}
      </div>
      {tab === "code" ? (
        <div className="idea-map-definition">
          <small>Graph JSON definition · this is diagram data.</small>
          <pre>
            <code>{JSON.stringify(map, null, 2)}</code>
          </pre>
        </div>
      ) : (
        <div
          className="idea-map-canvas"
          ref={pane}
          tabIndex={0}
          aria-label="Scrollable idea map. Drag the background to pan."
          onPointerDown={(event) => {
            if ((event.target as Element).closest("[data-node-id]")) return;
            const container = event.currentTarget;
            drag.current = {
              x: event.clientX,
              y: event.clientY,
              left: container.scrollLeft,
              top: container.scrollTop,
            };
            container.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            if (
              event.clientX !== drag.current.x ||
              event.clientY !== drag.current.y
            )
              setAutoFit(false);
            event.currentTarget.scrollLeft =
              drag.current.left - event.clientX + drag.current.x;
            event.currentTarget.scrollTop =
              drag.current.top - event.clientY + drag.current.y;
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
        >
          <svg
            width={width * zoom}
            height={height * zoom}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={map.title}
          >
            <defs>
              <marker
                id={marker}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" className="idea-map-arrow" />
              </marker>
            </defs>
            {map.edges.map((edge) => {
              const from = position(edge.from),
                to = position(edge.to);
              let path: string, labelX: number, labelY: number;
              if (to.y > from.y) {
                const middle = (from.y + to.y) / 2;
                path = `M ${from.x} ${from.y + 48} V ${middle} H ${to.x} V ${to.y - 49}`;
                labelX = (from.x + to.x) / 2 + 8;
                labelY = middle - 7;
              } else if (to.y === from.y && to.x !== from.x) {
                const direction = to.x > from.x ? 1 : -1;
                path = `M ${from.x + direction * 96} ${from.y} H ${to.x - direction * 98}`;
                labelX = (from.x + to.x) / 2;
                labelY = from.y - 9;
              } else {
                const side = Math.min(from.x, to.x) - 119;
                path = `M ${from.x - 96} ${from.y} H ${side} V ${to.y - 60} H ${to.x} V ${to.y - 49}`;
                labelX = side + 6;
                labelY = (from.y + to.y) / 2;
              }
              return (
                <g key={`${edge.from}:${edge.to}`}>
                  <path
                    d={path}
                    className="idea-map-edge"
                    markerEnd={`url(#${marker})`}
                  />
                  {edge.label && (
                    <text x={labelX} y={labelY} className="idea-map-edge-label">
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
            {map.nodes.map((node) => {
              const { x, y } = position(node.id),
                lines = labelLines(
                  node.label,
                  node.kind === "decision" ? 16 : 25,
                  node.kind === "decision" ? 3 : 5,
                );
              return (
                <g
                  key={node.id}
                  data-node-id={node.id}
                  className={`idea-map-node ${node.kind} ${selected === node.id ? "selected" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.kind}: ${node.label}`}
                  aria-pressed={selected === node.id}
                  onClick={() => setSelected(node.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected(node.id);
                    }
                  }}
                >
                  <title>{node.label}</title>
                  {node.kind === "decision" ? (
                    <path
                      d={`M ${x} ${y - 48} L ${x + 102} ${y} L ${x} ${y + 48} L ${x - 102} ${y} Z`}
                    />
                  ) : (
                    <rect
                      x={x - 96}
                      y={y - 46}
                      width="192"
                      height="92"
                      rx={node.kind === "process" ? 8 : 40}
                    />
                  )}
                  <text
                    x={x}
                    y={y - (lines.length - 1) * 7.5}
                    textAnchor="middle"
                  >
                    {lines.map((line, index) => (
                      <tspan key={index} x={x} dy={index ? 15 : 0}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
      <div className="idea-map-footer">
        {selected
          ? map.nodes.find((node) => node.id === selected)?.label
          : "Select a node to read it. Scroll or drag to explore the branches."}
      </div>
    </section>
  );
}

/** Idea-map actions expose only bounded diagram data; stored output stays untouched. */
export function IdeaMapAnswer({
  markdown,
  streaming = false,
}: {
  markdown: string;
  streaming?: boolean;
}) {
  const opening = /(?:^|\n)[ \t]*```idea-map[ \t]*\r?\n/.exec(markdown);
  if (opening) {
    const definition = markdown.slice(
      opening.index + opening[0].length,
      opening.index + opening[0].length + IDEA_MAP_MAX_CHARACTERS + 1,
    );
    const closing = definition.search(/\r?\n[ \t]*```/);
    if (closing >= 0)
      return (
        <IdeaMapView
          source={definition.slice(0, closing)}
          streaming={streaming}
        />
      );
  }
  return (
    <div className="idea-map-invalid">
      <p role="status">
        {streaming
          ? "Building the diagram — waiting for a complete diagram definition."
          : "This saved idea map has no complete supported diagram definition."}
      </p>
      {!streaming && (
        <small>
          The original response stays saved. Export the saved lesson to recover
          its original output.
        </small>
      )}
    </div>
  );
}
