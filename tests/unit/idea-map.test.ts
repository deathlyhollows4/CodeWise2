import { test } from "node:test";
import assert from "node:assert/strict";
import {
  IdeaMapSchema,
  parseIdeaMapDefinition,
} from "../../packages/contracts/src/idea-map.ts";
import {
  TutorRequestSchema,
  LibrarySummarySchema,
} from "../../packages/contracts/src/index.ts";

const graph = {
  version: 1,
  title: "Sum a visible input",
  nodes: [
    { id: "start", label: "Read input", kind: "start", row: 0, column: 0 },
    { id: "more", label: "Another item?", kind: "decision", row: 1, column: 0 },
    { id: "add", label: "Add item to sum", kind: "process", row: 2, column: 1 },
    { id: "end", label: "Return sum", kind: "end", row: 3, column: 0 },
  ],
  edges: [
    { from: "start", to: "more" },
    { from: "more", to: "add", label: "Yes" },
    { from: "add", to: "more" },
    { from: "more", to: "end", label: "No" },
  ],
};
test("idea maps accept decisions and algorithm loops, with a bounded data-only parser", () => {
  assert.deepEqual(parseIdeaMapDefinition(JSON.stringify(graph)), {
    ok: true,
    map: graph,
  });
  assert.equal(parseIdeaMapDefinition('{"version":').ok, false);
  assert.equal(parseIdeaMapDefinition(" ".repeat(20001)).ok, false);
  assert.equal(parseIdeaMapDefinition("null").ok, false);
});
test("idea maps reject ambiguous nodes, dangling/duplicate edges, markup fields and unbounded layout", () => {
  for (const change of [
    { nodes: [...graph.nodes, { ...graph.nodes[0], row: 4 }] },
    { nodes: graph.nodes.map((n, i) => (i === 1 ? { ...n, row: 0 } : n)) },
    { nodes: graph.nodes.map((n, i) => (i === 1 ? { ...n, column: 999 } : n)) },
    { nodes: graph.nodes.map((n, i) => (i === 1 ? { ...n, row: -1 } : n)) },
    {
      nodes: graph.nodes.map((n, i) =>
        i === 1 ? { ...n, id: "javascript:bad" } : n,
      ),
    },
    {
      nodes: graph.nodes.map((n, i) =>
        i === 1 ? { ...n, label: "x".repeat(141) } : n,
      ),
    },
    { nodes: graph.nodes.map((n) => ({ ...n, kind: "process" })) },
    { edges: [...graph.edges, { from: "missing", to: "end" }] },
    { edges: [...graph.edges, graph.edges[0]] },
    { edges: [{ from: "start", to: "end", href: "https://invalid.test" }] },
    { script: "model supplied markup" },
  ])
    assert.equal(
      IdeaMapSchema.safeParse({ ...graph, ...change }).success,
      false,
    );
});
test("idea_map is accepted by the request and inherited Library action schemas", () => {
  assert.equal(TutorRequestSchema.shape.action.parse("idea_map"), "idea_map");
  assert.equal(LibrarySummarySchema.shape.action.parse("idea_map"), "idea_map");
});
