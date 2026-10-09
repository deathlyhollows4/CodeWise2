import test from "node:test";
import assert from "node:assert/strict";
import { validateSemantics } from "../../packages/judge-adapter/src/semantic.mjs";
import { buildFunctionHarness } from "../../content/authoring/harness.mjs";
const listRule = {
  kind: "node-table",
  field: "data",
  links: ["next"],
  heads: "heads",
  requireReachable: true,
};
const validate = (rule, data) => validateSemantics([rule], { data });
test("reachability rejects disconnected padding and null-root nonempty tables", () => {
  assert.equal(
    validate(listRule, { values: [7, 7], next: [null, null], heads: [0] }),
    false,
  );
  assert.equal(
    validate(listRule, { values: [7], next: [null], heads: [null] }),
    false,
  );
  assert.equal(
    validate(listRule, { values: [], next: [], heads: [null] }),
    true,
  );
  assert.equal(
    validate(listRule, { values: [7, 7], next: [1, 0], heads: [1] }),
    true,
    "Valid cycles remain allowed",
  );
  assert.equal(
    validate(listRule, { values: [7, 7], next: [null, null], heads: [0, 1] }),
    true,
    "Two heads jointly reach all original identities",
  );
});
test("all declared links and ordered graph neighbors contribute reachability", () => {
  const randomRule = { ...listRule, links: ["next", "random"] };
  assert.equal(
    validate(randomRule, {
      values: [7, 7],
      next: [null, null],
      random: [1, 0],
      heads: [0],
    }),
    true,
  );
  const graphRule = {
    kind: "node-table",
    field: "data",
    neighbors: "neighbors",
    root: "root",
    requireReachable: true,
  };
  assert.equal(
    validate(graphRule, { values: [3, 3], neighbors: [[1, 1], [0]], root: 0 }),
    true,
  );
  assert.equal(
    validate(graphRule, { values: [3, 3], neighbors: [[], [0]], root: 0 }),
    false,
  );
  assert.equal(
    validate(graphRule, { values: [], neighbors: [], root: null }),
    true,
  );
  assert.equal(
    validate(graphRule, { values: [3], neighbors: [[null]], root: 0 }),
    false,
  );
  assert.equal(
    validate(graphRule, { values: [3], neighbors: [[1]], root: 0 }),
    false,
  );
});
test("acyclic next links reject self loops and longer cycles while permitting shared tails", () => {
  const rule = { ...listRule, acyclicLinks: ["next"] };
  assert.equal(validate(rule, { values: [1], next: [0], heads: [0] }), false);
  assert.equal(
    validate(rule, { values: [1, 2, 3], next: [1, 2, 1], heads: [0] }),
    false,
  );
  assert.equal(
    validate(rule, { values: [7, 7, 7], next: [2, 2, null], heads: [0, 1] }),
    true,
  );
  assert.equal(
    validate(rule, { values: [1, 2, 3], next: [1, null, 2], heads: [0, 2] }),
    false,
  );
  assert.equal(
    validate(
      { ...rule, requireReachable: false },
      { values: [1, 2], next: [null, 1], heads: [0] },
    ),
    false,
    "Disconnected cycles also violate an explicit acyclic rule",
  );
  assert.equal(
    validate(
      { ...listRule, links: ["next", "random"], acyclicLinks: ["next"] },
      { values: [1, 2], next: [1, null], random: [1, 0], heads: [0] },
    ),
    true,
    "Random-link cycles remain allowed",
  );
});
test("guards reject invalid policy fields and invalid node indexes before traversal", () => {
  const data = { values: [1], next: [null], heads: [0] };
  assert.equal(
    validate({ ...listRule, acyclicLinks: ["random"] }, data),
    false,
  );
  assert.equal(validate({ ...listRule, acyclicLinks: "next" }, data), false);
  assert.equal(validate({ ...listRule, requireReachable: "yes" }, data), false);
  assert.equal(validate(listRule, { ...data, next: [-1] }), false);
  assert.equal(validate(listRule, { ...data, heads: [1] }), false);
  assert.equal(
    validate(
      {
        kind: "node-table",
        field: "data",
        links: ["next"],
        requireReachable: true,
      },
      data,
    ),
    false,
  );
});
test("large acyclic/reachable chains are validated iteratively", () => {
  const n = 50000,
    data = {
      values: Array(n).fill(7),
      next: Array.from({ length: n }, (_, i) => (i + 1 < n ? i + 1 : null)),
      heads: [0],
    };
  assert.equal(validate({ ...listRule, acyclicLinks: ["next"] }, data), true);
  data.next[n - 1] = 25000;
  assert.equal(validate({ ...listRule, acyclicLinks: ["next"] }, data), false);
});
test("read-only policy is explicit and generated after construction but before output", () => {
  const args = [
    { name: "head", type: "ListNode" },
    { name: "k", type: "int" },
  ];
  assert.throws(() =>
    buildFunctionHarness({
      arguments: args,
      returnType: "ListNodeIdentity",
      readOnlyNodes: "true",
    }),
  );
  assert.throws(() =>
    buildFunctionHarness({
      arguments: [{ name: "n", type: "int" }],
      returnType: "int",
      readOnlyNodes: true,
    }),
  );
  const wrappers = buildFunctionHarness({
    arguments: args,
    returnType: "ListNodeIdentity",
    readOnlyNodes: true,
  });
  for (const [lang, text] of Object.entries(wrappers)) {
    const main = text.slice(text.indexOf("{{USER_CODE}}"));
    assert.ok(
      main.indexOf("cwArgument0=") < main.indexOf("cw.snapshot_inputs()"),
      lang + " construction precedes snapshot",
    );
    assert.ok(
      main.indexOf("cw.snapshot_inputs()") < main.indexOf("Solution"),
      lang + " snapshot precedes learner call",
    );
    assert.ok(
      main.indexOf("cw.check_inputs()") > main.indexOf("Solution"),
      lang + " guard follows learner call",
    );
    assert.ok(
      main.indexOf("cw.check_inputs()") <
        main.indexOf("cw.list_identity(result)"),
      lang + " guard precedes result serialization",
    );
  }
});
