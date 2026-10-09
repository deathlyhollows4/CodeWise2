import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { StreamBatcher } from "../../apps/server/src/stream-batcher.ts";
import { Store } from "../../apps/server/src/store.ts";

test("thousands of tiny chunks use bounded batches and terminal flush preserves exact Unicode", () => {
  const expected = "a🙂\n".repeat(10000),
    batches: string[] = [];
  const buffer = new StreamBatcher(
    (text) => batches.push(text),
    (error) => {
      throw error;
    },
  );
  for (const text of expected) buffer.push(text);
  buffer.flush();
  buffer.dispose();
  assert.equal(batches.join(""), expected);
  assert.ok(batches.length < 10);
  assert.ok(
    batches.every(
      (text) => text.length <= 8192 && !/[\uD800-\uDBFF]$/.test(text),
    ),
  );
});
test("delayed batches flush short partial output and disposal cancels timers", async () => {
  const batches: string[] = [];
  const buffer = new StreamBatcher(
    (text) => batches.push(text),
    (error) => {
      throw error;
    },
    8192,
    5,
  );
  buffer.push("partial");
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.deepEqual(batches, ["partial"]);
  buffer.push("discarded on deletion");
  buffer.dispose();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.deepEqual(batches, ["partial"]);
});
test("bounded replay uses authoritative saved snapshot for expired and initial cursors", () => {
  const root = join(process.cwd(), ".runtime", "tests");
  mkdirSync(root, { recursive: true });
  const store = new Store(mkdtempSync(join(root, "bounded-replay-")));
  try {
    store.insert("generations", {
      id: "g",
      idempotencyKey: "g",
      markdown: "durable full answer",
      status: "streaming",
    });
    for (let i = 0; i < 2000; i++)
      store.tx(() => store.event("g", { type: "chunk", text: "x" }));
    const retained = store.events("g", 0);
    assert.equal(retained.length, 128);
    assert.equal(retained.at(-1)?.seq, 2000);
    for (const after of [0, 1, 500, 2001])
      assert.deepEqual(store.replay("g", after), [
        {
          seq: 2000,
          type: "snapshot",
          text: "durable full answer",
          status: "streaming",
        },
      ]);
    assert.equal(store.replay("g", 1998).length, 2);
    assert.equal(store.replay("g", 2000).length, 0);
    assert.equal(
      store.event("g", { type: "status", status: "complete" }),
      2001,
    );
  } finally {
    store.close();
  }
});
