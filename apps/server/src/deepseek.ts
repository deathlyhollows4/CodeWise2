export class ProviderError extends Error {
  usage?: Record<string, number> | null;
  finishReason?: string | null;
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export class DeepSeek {
  constructor(private fetcher: typeof fetch = fetch) {}
  async models(key: string) {
    let r: Response;
    try {
      r = await this.fetcher("https://api.deepseek.com/models", {
        headers: { Authorization: `Bearer ${key}` },
        redirect: "error",
        signal: AbortSignal.timeout(20000),
      });
    } catch {
      throw new ProviderError(
        "UNREACHABLE",
        "DeepSeek could not be reached. The existing key has been preserved.",
      );
    }
    if (!r.ok)
      throw new ProviderError(
        r.status === 401
          ? "INVALID_KEY"
          : r.status === 429
            ? "RATE_LIMIT"
            : r.status >= 500
              ? "UNREACHABLE"
              : r.status === 403
                ? "ACCESS_DENIED"
                : "PROVIDER_ERROR",
        `DeepSeek model listing returned HTTP ${r.status}.`,
      );
    const data = (await r.json()) as any;
    return (data.data ?? [])
      .map((m: any) => String(m.id))
      .filter(
        (s: string) => /^[A-Za-z0-9._-]{1,100}$/.test(s) && !s.includes(key),
      );
  }
  async stream(
    key: string,
    model: string,
    messages: Array<{ role: string; content: string }>,
    max: number,
    signal: AbortSignal,
    onChunk: (text: string) => void,
  ) {
    const connectionError = () => {
      if (signal.aborted && signal.reason?.name !== "TimeoutError")
        return signal.reason;
      return new ProviderError(
        signal.aborted ? "TIMEOUT" : "UNREACHABLE",
        signal.aborted
          ? "DeepSeek did not finish before the response deadline. Retry explicitly; any partial answer is saved."
          : "DeepSeek could not be reached. Check your internet connection and retry; your key is preserved.",
      );
    };
    let r: Response;
    try {
      r = await this.fetcher("https://api.deepseek.com/chat/completions", {
        method: "POST",
        redirect: "error",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: max,
          stream: true,
          stream_options: { include_usage: true },
        }),
        signal,
      });
    } catch {
      throw connectionError();
    }
    if (!r.ok)
      throw new ProviderError(
        r.status === 402
          ? "INSUFFICIENT_BALANCE"
          : r.status === 401
            ? "INVALID_KEY"
            : r.status === 429
              ? "RATE_LIMIT"
              : r.status >= 500
                ? "UNREACHABLE"
                : r.status === 403
                  ? "ACCESS_DENIED"
                  : "PROVIDER_ERROR",
        r.status === 402
          ? "DeepSeek reports insufficient API balance. Add credit to your DeepSeek account before retrying."
          : r.status === 401
            ? "DeepSeek rejected the API key. Test or replace it in Settings."
            : r.status === 429
              ? "DeepSeek is rate limiting requests. Wait a little before retrying."
              : r.status === 403
                ? "DeepSeek denied access. Check your account and selected model in Settings."
                : `DeepSeek returned HTTP ${r.status}. Check the selected model in Settings, then retry.`,
      );
    if (!r.body)
      throw new ProviderError(
        "EMPTY_RESPONSE",
        "DeepSeek returned no response stream.",
      );
    const reader = r.body.getReader(),
      decoder = new TextDecoder();
    let buffer = "",
      usage: any = null,
      finishReason: string | null = null,
      total = 0;
    try {
      for (;;) {
        let next: ReadableStreamReadResult<Uint8Array>;
        try {
          next = await reader.read();
        } catch {
          throw connectionError();
        }
        const { value, done } = next;
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        if (buffer.length > 1000000)
          throw new ProviderError(
            "OUTPUT_LIMIT",
            "The provider stream exceeded the safe limit.",
          );
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (raw === "[DONE]") continue;
          let packet: any;
          try {
            packet = JSON.parse(raw);
          } catch {
            throw new ProviderError(
              "MALFORMED_RESPONSE",
              "DeepSeek returned an invalid stream event.",
            );
          }
          const text = packet.choices?.[0]?.delta?.content;
          if (typeof text === "string") {
            total += text.length;
            if (total > 250000)
              throw new ProviderError(
                "OUTPUT_LIMIT",
                "The response exceeded the saved answer limit.",
              );
            onChunk(text);
          }
          if (packet.usage) {
            usage = {};
            for (const field of [
              "prompt_tokens",
              "completion_tokens",
              "total_tokens",
              "prompt_cache_hit_tokens",
              "prompt_cache_miss_tokens",
            ]) {
              const value = packet.usage[field];
              if (Number.isSafeInteger(value) && value >= 0)
                usage[field] = value;
            }
            if (!Object.keys(usage).length) usage = null;
          }
          if (packet.choices?.[0]?.finish_reason)
            finishReason = packet.choices[0].finish_reason;
        }
      }
      if (!total)
        throw new ProviderError(
          "EMPTY_RESPONSE",
          "DeepSeek returned no user-facing answer.",
        );
      if (!finishReason)
        throw new ProviderError(
          "INTERRUPTED",
          "The provider stream ended without a completion marker.",
        );
      return { usage, finishReason };
    } catch (error) {
      if (error instanceof ProviderError) {
        error.usage = usage;
        error.finishReason = finishReason;
      }
      throw error;
    }
  }
}
