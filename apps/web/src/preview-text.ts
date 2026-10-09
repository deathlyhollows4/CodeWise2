import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
type Node = { type: string; value?: string; children?: Node[] };
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);
function safeSlice(value: string, start: number, end: number) {
  const high = (at: number) =>
    value.charCodeAt(at) >= 0xd800 && value.charCodeAt(at) <= 0xdbff;
  const low = (at: number) =>
    value.charCodeAt(at) >= 0xdc00 && value.charCodeAt(at) <= 0xdfff;
  if (start > 0 && low(start) && high(start - 1)) start++;
  if (end < value.length && high(end - 1) && low(end)) end--;
  return value.slice(start, end);
}
function text(node: Node): string {
  if (["html", "image", "imageReference", "definition"].includes(node.type))
    return "";
  if (node.type === "text")
    return (node.value || "")
      .replace(/\*\*|__|`/g, "")
      .replace(/\s*\|\s*/g, " · ");
  if (["code", "inlineCode", "math", "inlineMath"].includes(node.type))
    return node.value || "";
  if (node.type === "break") return " ";
  const parts = (node.children || []).map(text);
  if (node.type === "tableRow") return parts.join(" · ") + "\n";
  if (["root", "table", "list"].includes(node.type)) return parts.join("\n");
  if (["paragraph", "heading", "listItem", "blockquote"].includes(node.type))
    return parts.join("") + "\n";
  return parts.join("");
}
export function plainPreview(markdown: string, query = "") {
  const source = safeSlice(String(markdown || ""), 0, 400);
  const clean = safeSlice(
    text(parser.parse(source) as Node)
      .replace(/\s+/g, " ")
      .trim(),
    0,
    400,
  );
  const needle = query.trim().replace(/\s+/g, " ").toLowerCase(),
    index = needle ? clean.toLowerCase().indexOf(needle) : -1;
  if (index < 0) return clean;
  const start = Math.max(0, index - 35),
    end = Math.min(clean.length, start + 240);
  return (
    (start ? "… " : "") +
    safeSlice(clean, start, end) +
    (end < clean.length ? " …" : "")
  );
}
