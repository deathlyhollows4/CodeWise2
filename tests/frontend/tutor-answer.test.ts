import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TutorAnswer } from "../../apps/web/src/TutorAnswer";

test("empty failed or waiting tutor requests render no answer document or unsupported diagram warning", () => {
  for (const markdown of [null, undefined, "", " \n\t "])
    for (const live of [false, true])
      for (const streaming of [false, true]) {
        const html = renderToStaticMarkup(
          React.createElement(TutorAnswer, {
            id: "empty-request",
            markdown,
            live,
            streaming,
            mapOnly: true,
          }),
        );
        assert.equal(html, "");
      }
});

test("a real partial malformed idea map retains its status without leaking accompanying prose", () => {
  const markdown = 'UNRELATED_TEACHING\n\n```idea-map\n{"version":';
  for (const live of [false, true]) {
    const html = renderToStaticMarkup(
      React.createElement(TutorAnswer, {
        id: "partial-request",
        markdown,
        live,
        mapOnly: true,
        streaming: live,
      }),
    );
    assert.match(html, /role="status"/);
    assert.match(html, /waiting for|no complete supported/);
    assert.doesNotMatch(html, /UNRELATED_TEACHING|<svg\b/);
  }
});

test("ordinary saved and live solutions preserve complete supplied prose", () => {
  const markdown =
    "# Full solution\n\nOriginal explanation with reasoning.\n\n```python\nprint(42)\n```\n\nFINAL_SAVED_PARAGRAPH";
  for (const live of [false, true]) {
    const html = renderToStaticMarkup(
      React.createElement(TutorAnswer, { id: "solution", markdown, live }),
    );
    assert.match(html, /Original explanation with reasoning/);
    assert.match(html, /FINAL_SAVED_PARAGRAPH/);
    assert.match(html, /print/);
  }
});
