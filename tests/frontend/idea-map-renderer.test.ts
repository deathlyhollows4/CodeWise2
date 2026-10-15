import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LessonRenderer } from "../../packages/lesson-renderer/src/index.tsx";

const graph = {
  version: 1,
  title: "Walk through an accumulation loop",
  nodes: [
    {
      id: "start",
      label: "Read the visible input",
      kind: "start",
      row: 0,
      column: 0,
    },
    { id: "more", label: "Another item?", kind: "decision", row: 1, column: 0 },
    {
      id: "add",
      label: "Add the next item",
      kind: "process",
      row: 2,
      column: 1,
    },
    {
      id: "end",
      label: "Return the accumulated value",
      kind: "end",
      row: 3,
      column: 0,
    },
  ],
  edges: [
    { from: "start", to: "more" },
    { from: "more", to: "add", label: "Yes" },
    { from: "add", to: "more", label: "Continue" },
    { from: "more", to: "end", label: "No" },
  ],
};

function renderDefinition(source: string, streaming = false) {
  return renderToStaticMarkup(
    React.createElement(LessonRenderer, {
      markdown: "```idea-map\n" + source + "\n```",
      streaming,
    }),
  );
}

test("saved idea-map fences render a navigable decision and loop diagram with honest verification status", () => {
  const html = renderDefinition(JSON.stringify(graph));
  assert.match(html, /<svg\b/);
  assert.match(
    html,
    /aria-label="Idea map: Walk through an accumulation loop"/,
  );
  assert.match(html, /aria-label="decision: Another item\?"/);
  assert.match(html, /aria-label="end: Return the accumulated value"/);
  for (const label of ["Yes", "No", "Continue", "Diagram", "Code", "Reset"])
    assert.ok(html.includes(label), label);
  assert.match(html, /Generated · not execution-verified/);
  assert.match(html, /role="button"[^>]*tabindex="0"/);
  assert.doesNotMatch(html, /<script\b|<iframe\b|<img\b/);
});

test("model-supplied titles, nodes and edge labels remain escaped text, never executable SVG or HTML", () => {
  const hostile = {
    ...graph,
    title: "<script>alert(1)</script>",
    nodes: graph.nodes.map((node, index) =>
      index === 1
        ? {
            ...node,
            label: '<a href="javascript:alert(1)">click</a>',
          }
        : node,
    ),
    edges: graph.edges.map((edge, index) =>
      index === 1
        ? {
            ...edge,
            label: "<img src=x onerror=alert(1)>",
          }
        : edge,
    ),
  };
  const html = renderDefinition(JSON.stringify(hostile));
  assert.match(html, /<svg\b/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(
    html,
    /&lt;a href=&quot;javascript:alert\(1\)&quot;&gt;click&lt;\/a&gt;/,
  );
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(
    html,
    /<script\b|<img\b|<a\b|<foreignObject\b|<iframe\b|\s(?:href|onerror|onclick)="javascript:/i,
  );
});

test("malformed, truncated and out-of-range maps keep an honest escaped definition fallback without a diagram", () => {
  const invalidDefinitions = [
    '{"version":',
    '<script>alert("bad definition")</script>',
    JSON.stringify({
      ...graph,
      nodes: graph.nodes.map((node, index) =>
        index === 1 ? { ...node, row: 99 } : node,
      ),
    }),
  ];
  for (const source of invalidDefinitions) {
    const html = renderDefinition(source);
    assert.doesNotMatch(html, /<svg\b|<script\b/);
    assert.match(html, /View saved diagram definition/);
    assert.match(
      html,
      /incomplete or invalid JSON|does not match the supported graph format/,
    );
  }
  const partial = renderDefinition('{"version":', true);
  assert.match(
    partial,
    /Building the diagram — waiting for a complete definition/,
  );
  assert.doesNotMatch(partial, /<svg\b/);
});

test("map-only saved answers suppress surrounding legacy teaching while ordinary lessons preserve it", () => {
  const before = "LEGACY_BEFORE_ALGORITHM_TEACHING";
  const after = "LEGACY_AFTER_COMPLEXITY_EXPLANATION";
  const markdown = `${before}\n\n\`\`\`idea-map\n${JSON.stringify(graph)}\n\`\`\`\n\n${after}`;
  const only = renderToStaticMarkup(
    React.createElement(LessonRenderer, { markdown, mapOnly: true }),
  );
  assert.match(only, /<svg\b/);
  assert.doesNotMatch(only, /LEGACY_BEFORE|LEGACY_AFTER/);
  const ordinary = renderToStaticMarkup(
    React.createElement(LessonRenderer, { markdown }),
  );
  assert.match(ordinary, /LEGACY_BEFORE_ALGORITHM_TEACHING/);
  assert.match(ordinary, /LEGACY_AFTER_COMPLEXITY_EXPLANATION/);
});

test("map-only missing, incomplete and invalid diagrams show honest status without surrounding prose", () => {
  for (const [markdown, streaming] of [
    ["LEGACY_BEFORE_ALGORITHM_TEACHING without a diagram", false],
    ['LEGACY_BEFORE_ALGORITHM_TEACHING\n\n```idea-map\n{"version":', true],
    [
      'LEGACY_BEFORE_ALGORITHM_TEACHING\n\n```idea-map\n{"version":\n```\nLEGACY_AFTER_COMPLEXITY_EXPLANATION',
      false,
    ],
    [
      'LEGACY_BEFORE_ALGORITHM_TEACHING\n\n```idea-map\n{"version":\n```\nLEGACY_AFTER_COMPLEXITY_EXPLANATION',
      true,
    ],
  ] as const) {
    const html = renderToStaticMarkup(
      React.createElement(LessonRenderer, {
        markdown,
        streaming,
        mapOnly: true,
      }),
    );
    assert.doesNotMatch(html, /<svg\b|LEGACY_BEFORE|LEGACY_AFTER/);
    assert.match(html, /role="status"/);
    assert.match(
      html,
      /waiting for|no complete supported|incomplete or invalid JSON/,
    );
  }
});
