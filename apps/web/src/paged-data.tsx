import { useCallback, useEffect, useRef, useState } from "react";
import {
  LibraryPageSchema,
  JobPageSchema,
} from "../../../packages/contracts/src/index";
import { api, RequestError } from "./api";

export type Page<T> = {
  items: T[];
  nextCursor: string | null;
  total: number;
  pageSize: number;
};
export function pagePath(
  path: string,
  pageSize: number,
  cursor: string | null,
) {
  const [endpoint, query = ""] = path.split("?");
  const params = new URLSearchParams(
    [...new URLSearchParams(query)].filter(
      ([name, value]) => name === "q" || value !== "",
    ),
  );
  params.set("pageSize", String(Math.max(1, Math.min(100, pageSize))));
  params.delete("cursor");
  if (cursor) params.set("cursor", cursor);
  return endpoint + "?" + params.toString();
}
export function usePagedData<T = any>(path: string, pageSize = 30) {
  const sequence = useRef(0),
    [data, setData] = useState<Page<T> | null>(null),
    [error, setError] = useState<any>(null),
    [loading, setLoading] = useState(true),
    [pageIndex, setPageIndex] = useState(0),
    [cursors, setCursors] = useState<(string | null)[]>([null]),
    [resetNotice, setResetNotice] = useState("");
  const request = useCallback(
    async function perform(
      cursor: string | null,
      index: number,
    ): Promise<void> {
      const current = ++sequence.current;
      setLoading(true);
      setError(null);
      setData(null);
      const endpoint = path.split("?")[0];
      try {
        const incoming = await api(pagePath(path, pageSize, cursor));
        const parsed = (
          endpoint === "jobs" ? JobPageSchema : LibraryPageSchema
        ).safeParse(incoming);
        if (!parsed.success)
          throw new RequestError(
            "PAGE_RESPONSE_INVALID",
            "The saved-list response could not be read.",
            "Restart the local app with matching frontend and server versions, then retry.",
          );
        if (current === sequence.current) {
          setData(parsed.data as Page<T>);
          setPageIndex(index);
        }
      } catch (e: any) {
        if (current !== sequence.current) return;
        if (cursor && e.code === "CURSOR_INVALID") {
          setCursors([null]);
          setPageIndex(0);
          setResetNotice(
            "This saved list changed. Showing its first page again.",
          );
          return perform(null, 0);
        }
        setError(e);
      } finally {
        if (current === sequence.current) setLoading(false);
      }
    },
    [path, pageSize],
  );
  const reload = useCallback(async () => {
    setCursors([null]);
    setPageIndex(0);
    await request(null, 0);
  }, [request]);
  useEffect(() => {
    setResetNotice("");
    void reload();
    return () => {
      sequence.current++;
    };
  }, [reload]);
  const next = useCallback(async () => {
    if (loading || !data?.nextCursor) return;
    const nextIndex = pageIndex + 1,
      cursor = data.nextCursor;
    setCursors((previous) => [...previous.slice(0, nextIndex), cursor]);
    await request(cursor, nextIndex);
  }, [data, loading, pageIndex, request]);
  const previous = useCallback(async () => {
    if (loading || pageIndex === 0) return;
    await request(cursors[pageIndex - 1] ?? null, pageIndex - 1);
  }, [loading, pageIndex, cursors, request]);
  return {
    data,
    error,
    loading,
    pageIndex,
    resetNotice,
    reload,
    next,
    previous,
  };
}
type PagerProps = { page: ReturnType<typeof usePagedData>; label: string };
export function PageControls({ page, label }: PagerProps) {
  if (!page.data)
    return page.resetNotice ? (
      <p className="muted" role="status">
        {page.resetNotice}
      </p>
    ) : null;
  return (
    <div
      aria-label={label + " pages"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        marginTop: 14,
      }}
    >
      <small className="muted" role="status">
        {page.data.items.length} of {page.data.total} {label.toLowerCase()} ·
        Page {page.pageIndex + 1}
      </small>
      <button
        disabled={page.loading || page.pageIndex === 0}
        onClick={() => void page.previous()}
        aria-label={"Newer " + label.toLowerCase()}
      >
        Newer
      </button>
      <button
        disabled={page.loading || !page.data.nextCursor}
        onClick={() => void page.next()}
        aria-label={"Older " + label.toLowerCase()}
      >
        Older
      </button>
      {page.resetNotice && (
        <small className="muted" role="status">
          {page.resetNotice}
        </small>
      )}
    </div>
  );
}
