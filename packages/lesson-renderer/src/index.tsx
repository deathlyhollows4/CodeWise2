import React, { createContext, useContext, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";

import { IdeaMapAnswer, IdeaMapView } from "./IdeaMap";
import { safeLink } from "./transforms";
export { safeLink, lessonSections, RENDERER_VERSION } from "./transforms";
const StreamingContext = createContext(false);
function CodeBlock({ children, ...props }: any) {
  const streaming = useContext(StreamingContext);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const element = React.Children.toArray(
    children,
  )[0] as React.ReactElement<any>;
  const language =
    element?.props?.className?.match(/language-([\w-]+)/)?.[1] || "text";
  function textOf(node: any): string {
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(textOf).join("");
    return node?.props?.children ? textOf(node.props.children) : "";
  }
  const code = textOf(element);
  if (language === "idea-map")
    return <IdeaMapView source={code} streaming={streaming} />;
  return (
    <div className={`lesson-code ${expanded ? "expanded" : ""}`}>
      <div className="code-label">
        <span>{language === "cpp" ? "C++" : language}</span>
        <button
          onClick={() => {
            if (!navigator.clipboard?.writeText) {
              setCopyError(true);
              return;
            }
            navigator.clipboard
              .writeText(code)
              .then(() => {
                setCopied(true);
                setCopyError(false);
                setTimeout(() => setCopied(false), 1800);
              })
              .catch(() => setCopyError(true));
          }}
        >
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>
      {copyError && (
        <small role="status">
          Clipboard access failed. Select the code text to copy it.
        </small>
      )}
      <pre {...props}>{children}</pre>
      {code.split("\n").length > 18 && (
        <button className="code-expand" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Collapse code" : "Show complete code"}
        </button>
      )}
    </div>
  );
}
export function LessonRenderer({
  markdown,
  streaming = false,
  mapOnly = false,
}: {
  markdown: string;
  streaming?: boolean;
  mapOnly?: boolean;
}) {
  if (mapOnly)
    return (
      <article className="lesson-content" aria-busy={streaming}>
        <IdeaMapAnswer markdown={markdown} streaming={streaming} />
      </article>
    );
  let heading = 0;
  return (
    <StreamingContext.Provider value={streaming}>
      <article className="lesson-content" aria-busy={streaming}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[
            [rehypeKatex, { trust: false, strict: "ignore" }],
            [rehypeHighlight, { ignoreMissing: true }],
          ]}
          skipHtml
          urlTransform={safeLink}
          components={{
            pre: CodeBlock,
            img: () => <span className="muted">[External image omitted]</span>,
            a: ({ href, children }) => (
              <a
                href={safeLink(href || "")}
                target={href?.startsWith("#") ? undefined : "_blank"}
                rel="noopener noreferrer"
              >
                {children}
                {href?.startsWith("http") && (
                  <span aria-label="external link"> ↗</span>
                )}
              </a>
            ),
            h1: ({ children }) => (
              <h2 id={`section-${heading++}`}>{children}</h2>
            ),
            h2: ({ children }) => (
              <h2 id={`section-${heading++}`}>{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 id={`section-${heading++}`}>{children}</h3>
            ),
            table: ({ children }) => (
              <div
                className="table-scroll"
                role="region"
                aria-label="Lesson table"
                tabIndex={0}
              >
                <table>{children}</table>
              </div>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
        {streaming && (
          <span className="stream-indicator">Response in progress</span>
        )}
      </article>
    </StreamingContext.Provider>
  );
}
