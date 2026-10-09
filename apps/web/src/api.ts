export class RequestError extends Error {
  constructor(
    public code: string,
    message: string,
    public recoveryAction = "",
    public requestId = "",
  ) {
    super(message);
  }
}
let csrfToken = "";
export async function api<T = any>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/${path}`, {
      method,
      credentials: "same-origin",
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(method !== "GET" ? { "X-CSRF-Token": csrfToken } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new RequestError(
      "OFFLINE",
      "The local server could not be reached.",
      "Check that CodeWise2 is running, then retry.",
    );
  }
  const data = await response
    .json()
    .catch(() => ({ message: "The server returned an unreadable response." }));
  if (!response.ok)
    throw new RequestError(
      data.code || "REQUEST_FAILED",
      data.message || "The request failed.",
      data.recoveryAction || "",
      data.requestId || "",
    );
  if (path === "bootstrap") csrfToken = data.csrfToken;
  return data;
}
export const download = (
  filename: string,
  text: string,
  type = "text/plain",
) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
