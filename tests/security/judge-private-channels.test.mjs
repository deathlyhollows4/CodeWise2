import test from "node:test";
import assert from "node:assert/strict";
import { judgePack } from "../../packages/judge-adapter/src/index.mjs";
import {
  getPrivatePack,
  encodeCases,
} from "../../packages/judge-adapter/src/content.mjs";

// Independent adapter boundary fixtures. These do not execute learner code or
// attest actual Linux compilation/isolation; the runner canaries own that gate.
const pack = await getPrivatePack("arrays-hashing-01");
const visibleOutput =
  pack.visibleCases.map((c) => JSON.stringify(c.expected)).join("\n") + "\n";
test("visible stdin has exactly public cases; hidden partial output/error never enters public DTO", async () => {
  const requests = [];
  const adapter = {
    readiness: async () => ({ ready: true }),
    execute: async (request) => {
      requests.push(request);
      if (requests.length === 1)
        return { status: "executed", stdout: visibleOutput };
      return {
        status: "runtime_error",
        stdout:
          pack.hiddenCases
            .slice(0, 2)
            .map((c) => JSON.stringify(c.expected))
            .join("\n") + "\nPRIVATE_PARTIAL_LINE",
        diagnostics: "PRIVATE_HIDDEN_INPUT_IN_STDERR",
        runtime: {
          identity: { privatePath: "PRIVATE_CONTROLLER_PATH" },
          meta: { message: "PRIVATE_META_MESSAGE", time: "0.01" },
        },
      };
    },
  };
  const result = await judgePack({
    problemId: pack.manifest.id,
    language: "python",
    code: "# Trusted fixture string; not executed",
    adapter,
  });
  assert.equal(requests.length, 2);
  assert.equal(requests[0].stdin, encodeCases(pack, pack.visibleCases));
  assert.equal(requests[1].stdin, encodeCases(pack, pack.hiddenCases));
  assert.equal(result.status, "runtime_error");
  assert.equal(
    result.counts.executed,
    5,
    "Only three visible and two complete hidden lines counted",
  );
  assert.equal(result.counts.notRun, result.counts.total - 5);
  assert.equal(result.cases.length, 3);
  assert.deepEqual(
    result.cases.map((c) => c.actual),
    pack.visibleCases.map((c) => c.expected),
  );
  assert.ok(!JSON.stringify(result).includes("PRIVATE_"));
});
test("custom input runs in its sole public channel without hidden expected data", async () => {
  const requests = [];
  const customInput = pack.visibleCases[0].input;
  const adapter = {
    readiness: async () => ({ ready: true }),
    execute: async (request) => {
      requests.push(request);
      return { status: "executed", stdout: "314159\n" };
    },
  };
  const result = await judgePack({
    problemId: pack.manifest.id,
    language: "cpp",
    code: "// Fixture only",
    mode: "custom",
    customInput,
    adapter,
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].stdin, encodeCases(pack, [{ input: customInput }]));
  assert.equal(result.status, "executed");
  assert.equal(result.counts.total, 1);
  assert.equal(result.counts.unverified, 1);
  assert.equal(result.counts.passed, 0);
  assert.equal(Object.hasOwn(result.cases[0], "expected"), false);
});
test("visible failure never starts a hidden execution", async () => {
  const requests = [];
  const adapter = {
    readiness: async () => ({ ready: true }),
    execute: async (request) => {
      requests.push(request);
      return {
        status: "runtime_error",
        stdout: "",
        diagnostics: "Visible failure",
      };
    },
  };
  const result = await judgePack({
    problemId: pack.manifest.id,
    language: "java",
    code: "// Fixture only",
    adapter,
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].stdin, encodeCases(pack, pack.visibleCases));
  assert.equal(result.counts.executed, 0);
  assert.equal(result.counts.notRun, result.counts.total);
});
