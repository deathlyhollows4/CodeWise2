# Local threat model and controls

Threats covered: malicious websites targeting localhost, DNS rebinding, hostile submitted source, untrusted Markdown/imported content, oversized requests, accidental secret logging and unsafe restore archives. Account/administrator compromise is outside the claimed protection.

The server binds to127.0.0.1, rejects unrecognized Host, bootstraps an HttpOnly SameSite=Strict session and checks exact Origin, CSRF token and JSON content type on mutations. Methods are allowlisted; sensitive/read/write request windows and durable tutor budgets bound abuse. There is no arbitrary filesystem, URL-fetch, shell or runner pass-through endpoint. Responses return sanitized errors and request IDs.

Credentials never enter URLs, browser persistence, ordinary backups or diagnostics. DPAPI protects stored Windows bytes for the current user. Other systems use AES-256-GCM and randomly generated restrictive local key material. Atomic replacement preserves the old credential when encryption/write fails. Capability caches are bound to credential identity; removal prevents new use and aborts active requests. Local budgets are estimates/reservations for this application, not the account bill.

The runner has a separately verified containment contract: compilation/execution must be isolated, network disabled, resource/process/file/output limits enforced, secrets/database/repository inaccessible. Application readiness remains false until controls and language/runtime identities pass. Missing containment never enables a host fallback. Actual runner canary evidence is a separate release gate.

Markdown is untrusted and rendered through reviewed safe components; raw HTML, script URLs and remote image execution/loading are disabled. Restore accepts bounded versioned JSON only, strict stored records and reference associations, with preview/confirmation and a safety backup before transactional replacement. It does not execute archive scripts or restore credentials.

Independent tests include commit-before-SSE, deletion during streaming, multitab CSRF, unknown lifecycle/counted-output rejection, credential failure preservation and provider-failure assistance behavior. Exact logs/check identities live in release-evidence. Security documents and offline fixtures alone do not prove live runner containment.

Single-profile startup is fail-closed before recovery: ownership uses a separate SQLite exclusive VFS lock, rather than deleting a stale JSON marker or trusting PID reuse. Ownership metadata contains no credentials or learner content and is excluded from backups. Reclaim never kills a process; distinct data profiles may run concurrently.
