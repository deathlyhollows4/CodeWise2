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

test("non-thinking option is sent only for documented compatible models and never by default", async () => {
  const bodies: any[] = [];
  const provider = new DeepSeek((async (_url, init) => {
    bodies.push(JSON.parse(String(init?.body)));
    return new Response(
      'data: {"choices":[{"delta":{"content":"Brief answer"},"finish_reason":"stop"}]}',
    );
  }) as typeof fetch);
  for (const model of ["deepseek-flash", "deepseek-v4-pro", "legacy-model"]) {
    await provider.stream(
      "fixture",
      model,
      [],
      256,
      new AbortController().signal,
      () => {},
      { thinking: "disabled" },
    );
  }
  await provider.stream(
    "fixture",
    "deepseek-flash",
    [],
    4096,
    new AbortController().signal,
    () => {},
  );
  assert.deepEqual(
    bodies.map((b) => b.thinking),
    [{ type: "disabled" }, { type: "disabled" }, undefined, undefined],
  );
  assert.deepEqual(
    bodies.map((b) => b.max_tokens),
    [256, 256, 256, 4096],
  );
});

test("trailing SSE frame without newline retains usage and completion while discarding private reasoning", async () => {
  let delivered = "";
  const provider = new DeepSeek(
    (async () =>
      new Response(
        'data: {"choices":[{"delta":{"reasoning_content":"PRIVATE_REASONING"}}]}\n\n' +
          'data: {"choices":[{"delta":{"content":"Visible answer"}}]}\n\n' +
          'data: {"choices":[{"delta":{},"finish_reason":"length"}],"usage":{"prompt_tokens":10,"completion_tokens":128,"total_tokens":138,"reasoning_content":"PRIVATE_USAGE"}}',
      )) as typeof fetch,
  );
  const result = await provider.stream(
    "fixture",
    "deepseek-flash",
    [],
    128,
    new AbortController().signal,
    (text) => (delivered += text),
  );
  assert.equal(delivered, "Visible answer");
  assert.deepEqual(result, {
    usage: { prompt_tokens: 10, completion_tokens: 128, total_tokens: 138 },
    finishReason: "length",
  });
  assert(!JSON.stringify(result).includes("PRIVATE"));
});

test("reasoning-only or whitespace-only token exhaustion is explanatory and retains reported usage", async () => {
  for (const content of [undefined, " \n\t"]) {
    let delivered = "";
    const provider = new DeepSeek(
      (async () =>
        new Response(
          "data: " +
            JSON.stringify({
              choices: [
                {
                  delta: { content, reasoning_content: "PRIVATE_REASONING" },
                  finish_reason: "length",
                },
              ],
              usage: {
                prompt_tokens: 11,
                completion_tokens: 1525,
                total_tokens: 1536,
              },
            }),
        )) as typeof fetch,
    );
    await assert.rejects(
      provider.stream(
        "fixture",
        "deepseek-flash",
        [],
        1525,
        new AbortController().signal,
        (text) => (delivered += text),
      ),
      (e: any) => {
        assert.equal(e.code, "EMPTY_RESPONSE");
        assert.match(e.message, /output token limit/);
        assert.equal(e.finishReason, "length");
        assert.equal(e.usage.completion_tokens, 1525);
        assert(!JSON.stringify(e).includes("PRIVATE_REASONING"));
        return true;
      },
    );
    assert.equal(delivered, "");
  }
});

test("leading whitespace split across provider chunks preserves the exact visible Markdown answer", async () => {
  const chunks = ["\n", "    ", "indented code", "\n", "more text"];
  let delivered = "";
  const provider = new DeepSeek(
    (async () =>
      new Response(
        chunks
          .map(
            (content) =>
              "data: " +
              JSON.stringify({ choices: [{ delta: { content } }] }) +
              "\n\n",
          )
          .join("") + 'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}',
      )) as typeof fetch,
  );
  await provider.stream(
    "fixture",
    "deepseek-flash",
    [],
    128,
    new AbortController().signal,
    (text) => (delivered += text),
  );
  assert.equal(delivered, chunks.join(""));
});
