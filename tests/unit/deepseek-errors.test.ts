import test from "node:test";
import assert from "node:assert/strict";
import { DeepSeek, ProviderError } from "../../apps/server/src/deepseek.ts";
const stream = (provider: DeepSeek, signal = new AbortController().signal) =>
  provider.stream(
    "fixture-secret-not-real",
    "fixture-model",
    [],
    128,
    signal,
    () => {},
  );
test("network failure reports recovery without disclosing raw transport details", async () => {
  const provider = new DeepSeek((async () => {
    throw new Error("fixture-secret-not-real Authorization details");
  }) as typeof fetch);
  await assert.rejects(
    stream(provider),
    (error: any) =>
      error instanceof ProviderError &&
      error.code === "UNREACHABLE" &&
      !error.message.includes("fixture-secret-not-real"),
  );
});
test("deadline and user cancellation remain distinct", async () => {
  const provider = new DeepSeek((async () => {
    throw new Error("aborted");
  }) as typeof fetch);
  const deadline = new AbortController();
  deadline.abort(new DOMException("deadline", "TimeoutError"));
  await assert.rejects(
    stream(provider, deadline.signal),
    (error: any) => error.code === "TIMEOUT",
  );
  const cancel = new AbortController();
  const reason = new DOMException("canceled", "AbortError");
  cancel.abort(reason);
  await assert.rejects(
    stream(provider, cancel.signal),
    (error: any) => error === reason,
  );
});
test("insufficient balance reports an actionable cause without reading the response body", async () => {
  const provider = new DeepSeek(
    (async () =>
      new Response("fixture-secret-not-real", { status: 402 })) as typeof fetch,
  );
  await assert.rejects(
    stream(provider),
    (error: any) =>
      error.code === "INSUFFICIENT_BALANCE" &&
      /credit/.test(error.message) &&
      !error.message.includes("fixture-secret-not-real"),
  );
});
test("broken response stream reports a network failure after preserving delivered text", async () => {
  let delivered = "";
  let reads = 0;
  const provider = new DeepSeek(
    (async () =>
      new Response(
        new ReadableStream({
          pull(c) {
            if (reads++ === 0)
              c.enqueue(
                new TextEncoder().encode(
                  'data: {"choices":[{"delta":{"content":"saved partial"}}]}\n\n',
                ),
              );
            else c.error(new Error("private transport details"));
          },
        }),
      )) as typeof fetch,
  );
  await assert.rejects(
    provider.stream(
      "fixture",
      "model",
      [],
      128,
      new AbortController().signal,
      (text) => {
        delivered += text;
      },
    ),
    (error: any) => error.code === "UNREACHABLE",
  );
  assert.equal(delivered, "saved partial");
});
