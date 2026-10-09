import test from "node:test";
import assert from "node:assert/strict";
import {
  DeliveryScope,
  DeliveryScopeSchema,
  EXPECTED_QUESTIONS,
  EXPECTED_VISIBLE_CASES,
  EXPECTED_LANGUAGE_PAIRS,
  TopicQuotas,
  hiddenCaseRequirement,
  submissionCountMeetsScope,
} from "../../packages/contracts/src/index.ts";
test("authorized reduced topic scope keeps all three-language/visible/hidden quality gates", () => {
  assert.equal(EXPECTED_QUESTIONS, 243);
  assert.equal(EXPECTED_VISIBLE_CASES, 729);
  assert.equal(EXPECTED_LANGUAGE_PAIRS, 729);
  assert.equal(TopicQuotas.length, 18);
  assert.equal(
    TopicQuotas.reduce((sum, [, , quota]) => sum + quota, 0),
    243,
  );
  assert.equal(
    new Map(TopicQuotas.map(([id, , quota]) => [id, quota])).get("dp-1d"),
    24,
  );
  assert.equal(
    new Map(TopicQuotas.map(([id, , quota]) => [id, quota])).get("dp-2d"),
    11,
  );
  assert.equal(
    DeliveryScopeSchema.safeParse({
      ...DeliveryScope,
      visibleCasesPerQuestion: 2,
    }).success,
    false,
  );
  assert.equal(
    DeliveryScopeSchema.safeParse({
      ...DeliveryScope,
      minimumHiddenCasesPerQuestion: 100,
    }).success,
    false,
  );
  assert.equal(
    DeliveryScopeSchema.safeParse({ ...DeliveryScope, languages: ["cpp"] })
      .success,
    false,
  );
  assert.equal(
    DeliveryScopeSchema.safeParse({ ...DeliveryScope, questionTarget: 300 })
      .success,
    false,
  );
});
test("explicit leftover-only hidden overrides retain earlier200 minimum and require exact60 for selected IDs", () => {
  const scope = DeliveryScopeSchema.parse({
    ...DeliveryScope,
    hiddenCaseOverrides: [
      { problemId: "dp-1d-23", requiredHiddenCases: 60, exact: true },
    ],
  });
  assert.deepEqual(hiddenCaseRequirement("dp-1d-23", scope), {
    minimum: 60,
    exact: 60,
  });
  assert.deepEqual(hiddenCaseRequirement("dp-1d-22", scope), {
    minimum: 200,
    exact: null,
  });
  assert.equal(submissionCountMeetsScope("dp-1d-23", 63, scope), true);
  assert.equal(submissionCountMeetsScope("dp-1d-23", 62, scope), false);
  assert.equal(submissionCountMeetsScope("dp-1d-23", 64, scope), false);
  assert.equal(submissionCountMeetsScope("dp-1d-22", 63, scope), false);
  assert.equal(submissionCountMeetsScope("dp-1d-22", 203, scope), true);
  assert.equal(submissionCountMeetsScope("dp-1d-22", 450, scope), true);
  assert.equal(
    DeliveryScopeSchema.safeParse({
      ...scope,
      hiddenCaseOverrides: [
        ...scope.hiddenCaseOverrides,
        ...scope.hiddenCaseOverrides,
      ],
    }).success,
    false,
  );
  assert.equal(
    DeliveryScopeSchema.safeParse({
      ...scope,
      hiddenCaseOverrides: [
        { problemId: "dp-2d-12", requiredHiddenCases: 60, exact: true },
      ],
    }).success,
    false,
  );
  assert.equal(
    DeliveryScopeSchema.safeParse({
      ...scope,
      hiddenCaseOverrides: [
        { problemId: "dp-1d-23", requiredHiddenCases: 60, exact: false },
      ],
    }).success,
    false,
  );
});
