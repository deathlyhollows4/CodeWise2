import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeAttemptCode } from "../../packages/learning-engine/src/attempts.ts";
test("comment-only edits do not create a different attempt and expressions do", () => {
  assert.equal(
    normalizeAttemptCode("x = 1 # old", "python"),
    normalizeAttemptCode("x = 1 # changed", "python"),
  );
  assert.equal(
    normalizeAttemptCode("return x; // note", "cpp"),
    normalizeAttemptCode("return x; // another note", "cpp"),
  );
  assert.notEqual(
    normalizeAttemptCode("x = a+b", "python"),
    normalizeAttemptCode("x = a-b", "python"),
  );
  assert.equal(
    normalizeAttemptCode("/* only a note */class Solution {}", "java"),
    normalizeAttemptCode("class Solution {}", "java"),
  );
  assert.equal(
    normalizeAttemptCode("return /* only a note */0;", "cpp"),
    normalizeAttemptCode("return 0;", "cpp"),
  );
});
test("Python indentation and quoted comment markers retain their program meaning", () => {
  assert.notEqual(
    normalizeAttemptCode("if x:\n  y()", "python"),
    normalizeAttemptCode("if x:\n    y()", "python"),
  );
  assert.equal(
    normalizeAttemptCode('x = "# literal" # comment', "python"),
    'x = "# literal"',
  );
  assert.equal(
    normalizeAttemptCode('string s = "// literal"; // comment', "cpp"),
    'string s = "// literal";',
  );
  assert.equal(
    normalizeAttemptCode('x = """# literal\n  text""" # comment', "python"),
    'x = """# literal\n  text"""',
  );
});
