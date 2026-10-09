export type TutorStreamEvent = {
  type?: string;
  text?: string;
  chunk?: string;
  markdown?: string;
  status?: string;
  error?: { code: string; message: string } | null;
};
// Retry the persisted snapshot, even when the learner has since edited the draft.
export function tutorRetryContext(generation: {
  id: string;
  problemId: string;
  language: string;
  code: string;
  action: string;
  prompt: string;
  submissionId?: string;
  threadId?: string;
}) {
  return {
    problemId: generation.problemId,
    language: generation.language,
    code: generation.code,
    action: generation.action,
    prompt: generation.prompt,
    submissionId: generation.submissionId,
    threadId: generation.threadId,
    parentId: generation.id,
  };
}
export function parseTutorEvent(raw: unknown): TutorStreamEvent {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("The saved tutor event is not readable.");
  const event = raw as Record<string, unknown>;
  for (const field of ["type", "text", "chunk", "markdown", "status"])
    if (event[field] !== undefined && typeof event[field] !== "string")
      throw new Error("The saved tutor event is not readable.");
  if (event.type === "snapshot" && typeof event.text !== "string")
    throw new Error("The saved tutor snapshot has no readable content.");
  if (event.error !== undefined && event.error !== null) {
    const error = event.error as Record<string, unknown>;
    if (
      typeof error !== "object" ||
      Array.isArray(error) ||
      typeof error.code !== "string" ||
      typeof error.message !== "string"
    )
      throw new Error("The saved tutor error is not readable.");
    event.error = { code: error.code, message: error.message };
  }
  return event as TutorStreamEvent;
}
export function applyTutorEvent<T extends { markdown: string; status: string }>(
  generation: T,
  event: TutorStreamEvent,
): T {
  let markdown = generation.markdown;
  if (event.type === "snapshot") {
    if (typeof event.text !== "string")
      throw new Error("The saved tutor snapshot has no readable content.");
    markdown = event.text;
  } else if (event.markdown !== undefined) {
    if (typeof event.markdown !== "string")
      throw new Error("The saved tutor response has no readable content.");
    markdown = event.markdown;
  } else {
    const text = event.text ?? event.chunk;
    if (text !== undefined && typeof text !== "string")
      throw new Error("The saved tutor chunk has no readable content.");
    if (typeof text === "string") markdown += text;
  }
  return {
    ...generation,
    markdown,
    status: typeof event.status === "string" ? event.status : generation.status,
    ...(event.error !== undefined ? { error: event.error } : {}),
  };
}
