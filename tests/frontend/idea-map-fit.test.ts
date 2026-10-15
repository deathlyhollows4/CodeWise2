import test from "node:test";
import assert from "node:assert/strict";
import { fitIdeaMapZoom } from "../../packages/lesson-renderer/src/IdeaMap.tsx";

test("whole-map fit uses both container dimensions and permits a 24-row map below 20 percent", () => {
  const zoom = fitIdeaMapZoom(390, 440, 1270, 3494)!;
  assert.ok(zoom > 0 && zoom < 0.2);
  assert.ok(1270 * zoom <= 374);
  assert.ok(3494 * zoom <= 424);
  assert.equal(fitIdeaMapZoom(100, 400, 500, 200), 84 / 500);
  assert.equal(fitIdeaMapZoom(400, 100, 200, 500), 84 / 500);
  assert.equal(fitIdeaMapZoom(1000, 1000, 100, 100), 1.6);
});
test("fit waits for measurable layout and never emits zero, negative or nonfinite zoom", () => {
  for (const measurements of [
    [0, 440, 286, 326],
    [390, 0, 286, 326],
    [390, 440, 0, 326],
    [390, 440, 286, Number.NaN],
    [16, 16, 100, 100],
    [-1, 440, 286, 326],
  ])
    assert.equal(
      fitIdeaMapZoom(...(measurements as [number, number, number, number])),
      null,
    );
  const zoom = fitIdeaMapZoom(30, 30, 1270, 3494)!;
  assert.ok(zoom > 0 && zoom < 0.01);
});
