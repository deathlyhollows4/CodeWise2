import test from "node:test";
import assert from "node:assert/strict";
import {
  applyTutorEvent,
  parseTutorEvent,
  tutorRetryContext,
} from "../../apps/web/src/tutor-stream";
const original = {
  id: "stored-generation",
  markdown: "stale partial text",
  status: "streaming",
  notes: "Keep this note",
};
test("explicit retry reuses the original saved prompt, language and code, without mutating the request", () => {
  const saved = {
    id: "failed-request",
    problemId: "array-sum",
    language: "python",
    code: "original code snapshot",
    action: "followup",
    prompt: "Explain this loop",
    threadId: "thread",
    submissionId: "original-submission",
  };
  const draft = {
    code: "new edited code",
    language: "java",
    prompt: "new question",
  };
  const request = { ...draft, ...tutorRetryContext(saved) };
  assert.equal(request.code, saved.code);
  assert.equal(request.language, saved.language);
  assert.equal(request.prompt, saved.prompt);
  assert.equal(request.action, saved.action);
  assert.equal(request.parentId, saved.id);
  assert.equal(request.submissionId, saved.submissionId);
  assert.equal(saved.id, "failed-request");
});
test("expired cursor snapshot replaces stale text, then live chunks append once", () => {
  let state = applyTutorEvent(
    original,
    parseTutorEvent({
      type: "snapshot",
      text: "Durably saved full text",
      status: "streaming",
      seq: 200,
    }),
  );
  assert.equal(state.markdown, "Durably saved full text");
  assert.equal(state.notes, original.notes);
  state = applyTutorEvent(
    state,
    parseTutorEvent({ type: "chunk", text: "\nNew committed batch", seq: 201 }),
  );
  assert.equal(state.markdown, "Durably saved full text\nNew committed batch");
  state = applyTutorEvent(
    state,
    parseTutorEvent({ type: "status", status: "complete", seq: 202 }),
  );
  assert.equal(state.status, "complete");
  assert.equal(state.markdown, "Durably saved full text\nNew committed batch");
});
test("authoritative empty/repeated snapshots do not duplicate previously loaded content", () => {
  const event = parseTutorEvent({
    type: "snapshot",
    text: "same saved response",
    status: "interrupted",
  });
  const once = applyTutorEvent(original, event),
    twice = applyTutorEvent(once, event);
  assert.equal(twice.markdown, "same saved response");
  assert.equal(twice.status, "interrupted");
  const empty = applyTutorEvent(
    twice,
    parseTutorEvent({ type: "snapshot", text: "", status: "failed" }),
  );
  assert.equal(empty.markdown, "");
  assert.equal(empty.status, "failed");
});
test("legacy full-markdown and chunk events retain their documented behavior", () => {
  const full = applyTutorEvent(
    original,
    parseTutorEvent({ markdown: "saved", status: "streaming" }),
  );
  const chunk = applyTutorEvent(full, parseTutorEvent({ chunk: " code" }));
  assert.equal(chunk.markdown, "saved code");
  assert.equal(
    original.markdown,
    "stale partial text",
    "Event handling does not mutate the existing state",
  );
});
test("malformed snapshots are rejected before updating React state", () => {
  for (const raw of [
    null,
    [],
    { type: "snapshot" },
    { type: "snapshot", text: 123 },
    { type: "chunk", text: {} },
    { status: false },
  ])
    assert.throws(() => parseTutorEvent(raw));
  assert.equal(original.markdown, "stale partial text");
});
test("terminal events preserve sanitized error details and partial answer", () => {
  const state = applyTutorEvent(
    original,
    parseTutorEvent({
      type: "status",
      status: "failed",
      error: {
        code: "NO_MODEL",
        message: "Test your key and choose an available model in Settings.",
        private: "must not enter error UI state",
      },
    }),
  );
  assert.equal(state.status, "failed");
  assert.equal(state.markdown, original.markdown);
  assert.deepEqual((state as typeof state & { error: unknown }).error, {
    code: "NO_MODEL",
    message: "Test your key and choose an available model in Settings.",
  });
  assert.equal(original.status, "streaming");
});
test("snapshot errors and explicit null survive stream state; malformed errors reject", () => {
  const failed = applyTutorEvent(
    original,
    parseTutorEvent({
      type: "snapshot",
      text: "",
      status: "failed",
      error: { code: "EMPTY_RESPONSE", message: "No answer returned." },
    }),
  );
  assert.equal(failed.markdown, "");
  assert.equal(
    (failed as typeof failed & { error: { code: string } }).error.code,
    "EMPTY_RESPONSE",
  );
  const cleared = applyTutorEvent(
    failed,
    parseTutorEvent({ status: "complete", error: null }),
  );
  assert.equal((cleared as typeof cleared & { error: unknown }).error, null);
  for (const error of [
    "provider raw text",
    [],
    false,
    { code: 3, message: "bad" },
    { code: "X" },
  ])
    assert.throws(() => parseTutorEvent({ status: "failed", error }));
});
