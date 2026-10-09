# Durable local data

Windows default: `%LOCALAPPDATA%/CodeWise2/codewise2.sqlite`. Other systems use `~/.local/share/CodeWise2`. `CODEWISE2_DATA_DIR` relocates the whole data directory before launch. Back up before relocation; never put real user data in replaceable build directories.

SQLite WAL and synchronous transactions preserve drafts, immutable jobs, assistance evidence, user requests, complete/partial answers and replay events. Startup marks unfinished work interrupted and never resubmits billable requests. Export excludes credential ciphertext and protection material.

Windows stores the credential using current-user Windows DPAPI through a fixed PowerShell operation, with the key transferred by stdin, never command arguments. Other systems use AES-256-GCM with a random separately stored 0600 master key in a 0700 directory. Account/machine compromise can expose secrets; this protects stored bytes, not an attacker controlling your account. Credential removal aborts active tutoring and prevents new uses. Key reads never return the credential to the browser.

Use Settings data export for learning backups. Validate/preview then confirm restore; a pre-restore backup is saved locally before atomic replacement. Secrets are unaffected by restore and must be set separately on another machine.

JSON backup export and restore share a 64 MiB UTF-8 bound. Export validates the complete record graph and checks size before sending; exceeding the bound returns an explicit error without trimming history. Preview/import use the same bound, plus 4 KiB for the HTTP confirmation wrapper. JSON is buffered within that limit. For a larger profile, stop the app and verify shutdown, then copy `codewise2.sqlite` and any remaining matching `-wal`/`-shm` files together while no process uses them. Preserve the original directory until the copied profile is verified. Credential and runner configuration files are separate from learning-only JSON backups.

Approved runner setup writes private `runner.json` and `credentials/runner/token` beneath the same data directory. The token file has an ACL restricted to the current Windows SID and SYSTEM; the installer owns that protection. Ordinary startup discovers these files without source/environment edits. JSON may configure only an approved loopback endpoint, never an arbitrary token path. Explicit CODEWISE_RUNNER_URL/TOKEN_FILE/TOKEN overrides are for controlled runtime/test setup; no token is returned by APIs, written to SQLite, printed or included in backups.
