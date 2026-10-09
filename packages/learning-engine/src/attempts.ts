import type { Language } from "../../contracts/src/index.ts";
export const ATTEMPT_HEURISTIC_VERSION = "source-comments-2";
/** A deliberately limited source heuristic, not a claim of semantic equivalence.
 * It removes comments outside quoted literals and empty/comment-only lines.
 * It preserves Python indentation and executable whitespace; whitespace edits
 * may remain different rather than risking equivalence of different programs. */
export function normalizeAttemptCode(code: string, language: Language) {
  let out = "",
    i = 0;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '"' || ch === "'") {
      const triple =
        language === "python" && code.slice(i, i + 3) === ch.repeat(3);
      const quote = triple ? ch.repeat(3) : ch;
      out += quote;
      i += quote.length;
      while (i < code.length) {
        if (code[i] === "\\") {
          out += code.slice(i, i + 2);
          i += 2;
          continue;
        }
        if (code.slice(i, i + quote.length) === quote) {
          out += quote;
          i += quote.length;
          break;
        }
        out += code[i++];
      }
      continue;
    }
    if (
      (language === "python" && ch === "#") ||
      (language !== "python" && code.slice(i, i + 2) === "//")
    ) {
      while (i < code.length && code[i] !== "\n") i++;
      continue;
    }
    if (language !== "python" && code.slice(i, i + 2) === "/*") {
      i += 2;
      while (i < code.length && code.slice(i, i + 2) !== "*/") {
        if (code[i] === "\n") out += "\n";
        i++;
      }
      i = Math.min(code.length, i + 2);
      if (
        out &&
        i < code.length &&
        !/\s/.test(out.at(-1)!) &&
        !/\s/.test(code[i])
      )
        out += " ";
      continue;
    }
    out += ch;
    i++;
  }
  return out
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .join("\n");
}
