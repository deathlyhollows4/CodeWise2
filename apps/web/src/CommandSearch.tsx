import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, X } from "lucide-react";
import { api } from "./api";

type Destination = { href: string; label: string; kind?: string };
export function CommandSearch({
  topics,
  destinations,
}: {
  topics: ReadonlyArray<{ id: string; name: string }>;
  destinations: ReadonlyArray<Destination>;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    input = useRef<HTMLInputElement>(null),
    previous = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [problems, setProblems] = useState<Array<Destination & { kind: string }>>(
      [],
    ),
    [active, setActive] = useState(0),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const show = () => {
    if (document.querySelector(".modal-backdrop")) return;
    previous.current = document.activeElement as HTMLElement;
    setQuery("");
    setActive(0);
    setOpen(true);
    dialog.current?.showModal();
    input.current?.focus();
  };
  const close = () => dialog.current?.close();
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        if (dialog.current?.open) close();
        else show();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    let current = true;
    setProblems([]);
    setError("");
    setActive(0);
    if (!open || !query.trim()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      api(`problems?q=${encodeURIComponent(query.trim())}`)
        .then((rows: any[]) => {
          if (current)
            setProblems(
              rows.slice(0, 8).map((p) => ({
                href: `/problems/${p.id}`,
                label: p.title,
                kind: p.status === "published" ? "Problem" : "Preview problem",
              })),
            );
        })
        .catch((e: any) => {
          if (current) setError(e.message);
        })
        .finally(() => {
          if (current) setLoading(false);
        });
    }, 180);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [open, query, retry]);
  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return [
      ...destinations.map((d) => ({ ...d, kind: "Page" })),
      ...topics.map((t) => ({
        href: `/topics/${t.id}`,
        label: t.name,
        kind: "Topic",
      })),
    ]
      .filter((d) => !q || d.label.toLocaleLowerCase().includes(q))
      .concat(problems)
      .slice(0, 12);
  }, [query, topics, destinations, problems]);
  useEffect(() => {
    setActive((index) => Math.min(index, Math.max(0, results.length - 1)));
  }, [results]);
  useEffect(() => {
    if (open)
      document
        .getElementById(`command-result-${active}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);
  return (
    <>
      <button
        className="ghost command-trigger"
        aria-label="Quick search (Ctrl or Command K)"
        onClick={show}
        title="Quick search · Ctrl/Cmd+K"
      >
        <Search size={17} />
        <span>Search</span>
      </button>
      <dialog
        ref={dialog}
        className="command-palette"
        aria-labelledby="command-title"
        onKeyDownCapture={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            close();
          }
        }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(
            dialog.current?.querySelectorAll<HTMLElement>(
              "button,input,a,[tabindex]",
            ) || [],
          ).filter(
            (element) =>
              element.tabIndex >= 0 &&
              !element.hasAttribute("disabled") &&
              element.getClientRects().length > 0,
          );
          const first = controls[0],
            last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClose={() => {
          setOpen(false);
          previous.current?.focus();
        }}
        onClick={(event) => {
          if (event.target !== dialog.current) return;
          const box = dialog.current.getBoundingClientRect();
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            close();
        }}
      >
        <div className="command-heading">
          <h2 id="command-title">Quick search</h2>
          <button
            className="ghost"
            aria-label="Close quick search"
            onClick={close}
          >
            <X size={18} />
          </button>
        </div>
        <div className="command-input">
          <Search size={18} />
          <input
            ref={input}
            type="search"
            role="combobox"
            aria-label="Search navigation, topics and problems"
            aria-controls="command-results"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-activedescendant={
              results.length ? `command-result-${active}` : undefined
            }
            value={query}
            maxLength={200}
            placeholder="Find a page, topic or problem…"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                setActive((index) =>
                  results.length
                    ? (index +
                        (event.key === "ArrowDown" ? 1 : results.length - 1)) %
                      results.length
                    : 0,
                );
              }
              if (event.key === "Enter") {
                event.preventDefault();
                document.getElementById(`command-result-${active}`)?.click();
              }
            }}
          />
        </div>
        <div
          id="command-results"
          className="command-results"
          role="listbox"
          aria-label="Quick search results"
          aria-busy={loading}
        >
          {results.map((result, index) => (
            <Link
              key={result.href}
              id={`command-result-${index}`}
              to={result.href}
              role="option"
              aria-selected={active === index}
              tabIndex={-1}
              onMouseEnter={() => setActive(index)}
              onClick={close}
            >
              <span>{result.label}</span>
              <small>{result.kind}</small>
            </Link>
          ))}
        </div>
        {loading && (
          <p className="command-state" role="status">
            Searching your local catalogue…
          </p>
        )}
        {error && (
          <div className="command-state" role="alert">
            {error}{" "}
            <button onClick={() => setRetry((count) => count + 1)}>
              Retry
            </button>
          </div>
        )}
        {!loading && !error && !results.length && (
          <p className="command-state">
            No matches. Try a shorter title or topic name.
          </p>
        )}
        <div className="command-footer">
          ↑ ↓ choose · Enter open · Esc close{" "}
          <span>Local search · no AI request</span>
        </div>
      </dialog>
    </>
  );
}
