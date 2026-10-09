import React, { useEffect, useRef, useState } from "react";
import { LessonRenderer } from "../../../packages/lesson-renderer/src";

export function LiveLesson({
  id,
  markdown,
  streaming,
  reducedMotion,
}: {
  id: string;
  markdown: string;
  streaming: boolean;
  reducedMotion: boolean;
}) {
  const end = useRef<HTMLDivElement>(null),
    following = useRef(false),
    lastScroll = useRef(0),
    previousText = useRef("");
  const [follow, setFollow] = useState(false),
    [unread, setUnread] = useState(false),
    [top, setTop] = useState(12);
  const scrollPosition = () =>
    (end.current?.closest(".tutor-drawer") as HTMLElement | null)?.scrollTop ??
    window.scrollY;
  const scrollToEnd = (behavior: ScrollBehavior) => {
    const panel = end.current?.closest(".tutor-drawer") as HTMLElement | null;
    if (panel) panel.scrollTo({ top: panel.scrollHeight, behavior });
    else end.current?.scrollIntoView({ block: "end", behavior });
  };
  const latest = () => {
    setUnread(false);
    scrollToEnd(
      reducedMotion || matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    );
    lastScroll.current = scrollPosition();
  };
  useEffect(() => {
    previousText.current = "";
    following.current = false;
    setFollow(false);
    setUnread(false);
    lastScroll.current = scrollPosition();
  }, [id]);
  useEffect(() => {
    const banner = document.querySelector(".main > .fixture-banner");
    const measure = () =>
      setTop((banner?.getBoundingClientRect().height || 0) + 12);
    measure();
    const observer = new ResizeObserver(measure);
    if (banner) observer.observe(banner);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const scrolled = () => {
      if (scrollPosition() < lastScroll.current && following.current) {
        following.current = false;
        setFollow(false);
      }
      lastScroll.current = scrollPosition();
    };
    const scrollTarget = end.current?.closest(".tutor-drawer") || window;
    scrollTarget.addEventListener("scroll", scrolled, { passive: true });
    return () => scrollTarget.removeEventListener("scroll", scrolled);
  }, [id]);
  useEffect(() => {
    if (markdown === previousText.current) return;
    previousText.current = markdown;
    if (!markdown) return;
    setUnread(true);
    if (!following.current) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      if (scrollPosition() < lastScroll.current) {
        following.current = false;
        setFollow(false);
        return;
      }
      if (following.current) {
        setUnread(false);
        scrollToEnd("instant");
        lastScroll.current = scrollPosition();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [id, markdown, reducedMotion]);
  return (
    <div className="live-lesson" data-live-generation={id}>
      {markdown.trim() && (
        <div className="live-lesson-controls" style={{ top }}>
          <label>
            <input
              type="checkbox"
              checked={follow}
              onChange={(event) => {
                following.current = event.target.checked;
                setFollow(event.target.checked);
                if (event.target.checked) latest();
              }}
            />{" "}
            Follow new text
          </label>
          {unread && <button onClick={latest}>New response below ↓</button>}
          <small>{streaming ? "New text is arriving" : "Answer text"}</small>
        </div>
      )}
      <LessonRenderer markdown={markdown} streaming={streaming} />
      <div ref={end} className="live-response-end" aria-hidden="true" />
    </div>
  );
}
