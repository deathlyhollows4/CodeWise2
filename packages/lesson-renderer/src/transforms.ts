export const RENDERER_VERSION = "1.0.0";
export function safeLink(url: string) {
  if (/[\u0000-\u0020\u007f]/.test(url)) return "";
  return /^(https?:\/\/|mailto:|#)/i.test(url) ? url : "";
}
export function lessonSections(markdown: string) {
  return Array.from(markdown.matchAll(/^#{1,3}\s+(.+)$/gm)).map(
    (match, index) => ({ id: `section-${index}`, title: match[1] }),
  );
}
