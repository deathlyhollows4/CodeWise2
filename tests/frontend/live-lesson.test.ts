import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LiveLesson } from "../../apps/web/src/LiveLesson";

test("no-answer records do not offer follow controls or describe answer text", () => {
  for (const markdown of ["", "  \n"]) {
    const html = renderToStaticMarkup(
      React.createElement(LiveLesson, {
        id: "failed-request",
        markdown,
        streaming: false,
        reducedMotion: true,
      }),
    );
    assert.doesNotMatch(html, /Follow new text|Answer text|New response below/);
  }
});
test("partial and streaming answers retain reader controls and readable text", () => {
  const html = renderToStaticMarkup(
    React.createElement(LiveLesson, {
      id: "partial-answer",
      markdown: "Keep this partial explanation",
      streaming: true,
      reducedMotion: true,
    }),
  );
  assert.match(html, /Follow new text/);
  assert.match(html, /New text is arriving/);
  assert.match(html, /Keep this partial explanation/);
});
