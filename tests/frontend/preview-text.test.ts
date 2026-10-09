import { test } from "node:test";
import assert from "node:assert/strict";
import { plainPreview } from "../../apps/web/src/preview-text";
test("readable Markdown summary preserves labels/code/table content without syntax", () => {
  const text = plainPreview(
    "# Total\n\n**Accumulate** with `sum += x`. [Documentation](https://example.test)\n\n| Step | Total |\n| --- | --- |\n| 1 | 5 |",
  );
  assert.equal(
    text,
    "Total Accumulate with sum += x. Documentation Step · Total 1 · 5",
  );
});
test("HTML and external image markup are omitted without rendering or exposing URLs", () => {
  const text = plainPreview(
    "<script>alert(1)</script>\n\n![remote](https://outside.test/x) [safe label](javascript:alert(1))",
  );
  assert.equal(text, "safe label");
  assert.equal(text.includes("outside.test"), false);
});
test("partial fences and long tokens remain bounded; search stays near the excerpt start", () => {
  assert.equal(
    plainPreview("```python\nsum = 0\nfor x in values:"),
    "sum = 0 for x in values:",
  );
  const text = plainPreview(
    "a ".repeat(90) + "**needle** " + "z ".repeat(90),
    "needle",
  );
  assert.ok(text.includes("needle"));
  assert.ok(text.indexOf("needle") <= 37);
  assert.ok(plainPreview("z".repeat(100000)).length <= 400);
});
test("preview and search clipping never split a UTF16 surrogate pair", () => {
  const valid = (value: string) =>
    [...value].every(
      (c) =>
        c.length > 1 || c.charCodeAt(0) < 0xd800 || c.charCodeAt(0) > 0xdfff,
    );
  assert.equal(plainPreview("x".repeat(399) + "😀"), "x".repeat(399));
  const source =
    "x".repeat(144) +
    "😀" +
    "y".repeat(34) +
    "needle" +
    "z".repeat(198) +
    "😀end";
  const excerpt = plainPreview(source, "needle");
  assert.ok(valid(excerpt));
  assert.ok(excerpt.includes("needle"));
  assert.ok(valid(plainPreview(source)));
});
