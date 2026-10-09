import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LessonRenderer } from "../../packages/lesson-renderer/src/index.tsx";
import {
  safeLink,
  lessonSections,
} from "../../packages/lesson-renderer/src/transforms.ts";
test("links reject executable, local, protocol-relative, encoded and control-obfuscated destinations", () => {
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,boom",
    "file:///secret",
    "//tracker.invalid",
    " javascript:alert(1)",
    "java\nscript:alert(1)",
    "https://safe.invalid\u0000evil",
    "%6aavascript:alert(1)",
    "&#106;avascript:alert(1)",
    "vbscript:boom",
  ])
    assert.equal(safeLink(value), "", value);
  for (const value of [
    "https://example.org/path",
    "http://localhost:3000",
    "mailto:user@example.org",
    "#section-0",
  ])
    assert.equal(safeLink(value), value);
});
test("raw HTML, executable links and external images cannot render executable markup", () => {
  const markdown =
    "<script>alert(1)</script>\n\n[bad](javascript:alert)\n\n![track](https://tracker.invalid/a.png)";
  const html = renderToStaticMarkup(
    React.createElement(LessonRenderer, { markdown }),
  );
  assert.doesNotMatch(html, /<script|<img|javascript:|tracker.invalid/);
  assert.match(html, /External image omitted/);
});
test("partial code fences retain complete visible source rather than discarding streamed code", () => {
  const markdown =
    "## Key idea\n\n```python\ndef solve(nums):\n    return sum(nums)";
  const html = renderToStaticMarkup(
    React.createElement(LessonRenderer, { markdown }),
  );
  const visible = html.replace(/<[^>]*>/g, "");
  assert.match(visible, /def solve\(nums\)/);
  assert.match(visible, /return sum\(nums\)/);
  assert.equal(lessonSections(markdown)[0].title, "Key idea");
});
test("long tokens and wide tables remain text without executing HTML", () => {
  const markdown = `| Input | Expected |\n|---|---|\n| ${"x".repeat(20000)} | &lt;script&gt; |`;
  const html = renderToStaticMarkup(
    React.createElement(LessonRenderer, { markdown }),
  );
  assert.match(html, /<table>/);
  assert.doesNotMatch(html, /<script>/);
  assert.ok(html.includes("x".repeat(20000)));
});
test("mathematics rendering disables trusted HTML and executable href commands", () => {
  const html = renderToStaticMarkup(
    React.createElement(LessonRenderer, {
      markdown:
        "A safe formula $O(n \\log n)$ and $\\href{javascript:alert(1)}{click}$ plus $\\htmlClass{evil}{x}$.",
    }),
  );
  assert.doesNotMatch(html, /<a[^>]*href="javascript:|class="evil"|<script/);
  assert.match(html, /katex/);
});
