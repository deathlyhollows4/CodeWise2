import React from "react";
import { LessonRenderer } from "../../../packages/lesson-renderer/src";
import { LiveLesson } from "./LiveLesson";

/** A saved request without answer text is a request status, not a document. */
export function TutorAnswer({
  id,
  markdown,
  live = false,
  streaming = false,
  reducedMotion = false,
  mapOnly = false,
}: {
  id: string;
  markdown?: string | null;
  live?: boolean;
  streaming?: boolean;
  reducedMotion?: boolean;
  mapOnly?: boolean;
}) {
  if (!markdown?.trim()) return null;
  return live ? (
    <LiveLesson
      id={id}
      markdown={markdown}
      streaming={streaming}
      reducedMotion={reducedMotion}
      mapOnly={mapOnly}
    />
  ) : (
    <LessonRenderer
      markdown={markdown}
      streaming={streaming}
      mapOnly={mapOnly}
    />
  );
}
