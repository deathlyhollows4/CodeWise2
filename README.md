# CodeWise2

## Start studying from a clone

Install Git and Node.js 24 or later, clone this repository, and open a terminal in the cloned folder:

```sh
npm ci
npm run build
npm start
```

On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm`. Open the loopback address printed in the terminal (normally `http://127.0.0.1:3000`). Each friend gets a separate local learning profile; no account or AI key is required for reading questions, editing code, or saved history. This repository includes software and question assets, not the original user's progress, credentials, or runner installation.

**Run and Submit require a separately installed isolated runner on each computer.** Cloning alone does not install WSL, compilers, sandbox controls, or private runner credentials. Begin with [runner setup](docs/runner.md) and `npm run doctor:runner`. The verified installation is Windows ARM64 with a dedicated Ubuntu 24.04 WSL runner; other platforms are not yet verified. Missing readiness leaves execution disabled. Historical reference receipts describe the original reviewed runtime and do not certify a friend's computer.

For optional AI help, open Settings and enter your own DeepSeek key locally. Provider usage is charged to that key. Never put keys in source files or share your data folder. [Data storage and backups](docs/data-storage.md) explains where personal progress lives. Press Ctrl+C in the app terminal to stop.

## Project details

Local-first adaptive DSA practice, Java/C++/Python editing, durable saved lessons and a backend-only DeepSeek tutor. The current core catalogue contains243 independently reviewed, validated published packs. Final application, ancillary metadata and operational acceptance are tracked separately; a working interface alone does not prove those gates. The [topic amendment](docs/decisions/0003-reduced-unstarted-topic-quotas.md) halves only unstarted topic quotas. The [hidden-case amendment](docs/decisions/0004-remaining-question-hidden-case-target.md) preserves 191 already authored larger suites and requires exactly 60 distinct hidden cases for the explicitly listed 52 remaining questions. Every question still has 3 visible cases and Java/C++/Python assets, full-suite grading and independent publication gates. The original specification is unchanged.

Tested environment: Windows ARM64, Node v24.19.0. Expected other-platform support is unverified. Install Node24+, then run:

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd start
```

The loopback server normally prints `http://127.0.0.1:3000`; it chooses another loopback port through3010 if occupied. Press Ctrl+C in its terminal to stop it. `scripts/setup.ps1` and `scripts/start.ps1` wrap setup/start. `npm run doctor` prints platform, storage and build diagnostics. Runner setup is separately documented under infra/runner; unavailable isolation never triggers host execution.

For a detached process, run `./scripts/stop.ps1 -Address http://127.0.0.1:ACTUAL_PORT` using its printed address. The script requests a session-protected shutdown and preserves durable data.

On the approved Windows dedicated-runner installation, normal startup holds an app-owned `CodeWise2Runner` WSL client for the application's lifetime. Shutdown sends EOF to that verified client; it never shuts down shared WSL services or reapplies crash policy. Missing/reset runner controls remain a readiness error. Startup failures outside the automatic port retry range return a nonzero exit code after owned cleanup. `CODEWISE2_DATA_DIR` relocates learning data; internal validation may separately set `CODEWISE2_RUNNER_DATA_DIR` to the approved installed private runner configuration directory. Runner tokens remain outside the database, backups and browser.

Enter, test, replace or remove your DeepSeek key through Settings. Development and ordinary reading/saving do not require a key. Explicit tutoring sends relevant problem/constraint/visible-example data, selected language, immutable learner code and safe judge feedback, bounded recent messages and independent-skill evidence, and an explicitly selected saved partial parent to the fixed official DeepSeek endpoint. A requested full solution may also include a historically verified selected-language reference; hints and error explanations do not receive that reference. Private prepared messages stay server-side and are excluded from normal exports/backups. Reopening saved answers never triggers inference. Dependency installation and explicit tutoring require internet; bundled content and saved lessons work locally.

Durable storage: `%LOCALAPPDATA%/CodeWise2` on Windows, `~/.local/share/CodeWise2` elsewhere. See [data storage](docs/data-storage.md) for relocation, DPAPI/authenticated encryption and backup. Settings export/restore excludes secrets. Never commit actual databases, exports, credentials or learner code.

While the app is running, `node scripts/backup.mjs export PATH --url ACTUAL_URL` creates a new secret-free backup; `preview PATH` validates an existing file; `restore PATH --confirm RESTORE` explicitly replaces learning data after preview and a local safety backup. Add the same `--url` when using an alternate port. Compact UTF-8 JSON exports and imports share a 64 MiB limit (67,108,864 bytes). Export checks the complete validated history before sending it; oversize returns an explicit error, with no trimming or unusable download. JSON is buffered in bounded memory, not streamed or compressed; import requests allow another 4 KiB for their preview/confirmation wrapper. Larger profiles can export individual lessons or copy the SQLite database after a clean shutdown, as described in data storage. Existing backup files are never silently overwritten.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run audit:content
npm.cmd run validate:bank
npm.cmd run doctor
```

`npm run fixture:ui` launches an explicitly labelled test fixture on3100 with temporary data and a stored lesson. It is excluded from the released catalogue and makes no live provider call. API/schema and fixture tests are evidence about application behavior, not full-bank/runtime validation. Live DeepSeek inference remains untested until a user supplies their own key locally.

Offline suite commands: `test:backend`, `test:renderer`, `test:security`, `test:runner` (adapter fixtures), and `test:content` (pipeline fixtures); `npm test` combines them. Actual isolated reference execution is `validate:bank`, and requires a ready contained runner. Missing runner/full bank fails rather than becoming a skipped pass.

Browser QA: install an available Chromium browser with `npm exec playwright install chromium` or supply `PLAYWRIGHT_BROWSER_EXECUTABLE` pointing to an installed compatible browser. Start the visible test fixture and use `npm run test:e2e` with the test's documented address override. This creates real screenshots; inspect them and record findings before claiming visual acceptance.

Only one app instance may own a data folder. A second start fails before recovery or port binding; use the running instance or stop it through `scripts/stop.ps1`. Different isolated data folders may run concurrently. Do not delete ownership files to bypass this guard: the OS-backed SQLite lock is authoritative, and crash recovery acquires it before changing unfinished work.

Publication is an explicit build-time gate: `npm run publish:content -- --preflight --runtime=APPROVED_RUNTIME_HASH` produces the exact prospective map and checks every current language receipt, independent category/oracle record, quota and release curriculum. The coordinator's independent `content/global-review.json` must match that plan before `--publish`. Status-only backups are retained under `.runtime/publication-backups`. An interrupted transaction blocks normal startup; after verifying no publication process is active, `npm run publish:content -- --recover` restores its recorded status bytes. Ordinary content mutation after publication requires new identities/reviews/receipts, not receipt migration. See `docs/publication-review-contract.md`.

`npm run doctor:runner` is read-only: it inspects configured local readiness/control/phase/runtime metadata without running code or changing WSL policy. For current API2 full-catalogue browser QA, launch `fixture:ui` with `CODEWISE2_FIXTURE_FULL_CATALOGUE=1`, `CODEWISE2_FIXTURE_HISTORY=1` and a fresh explicit `.runtime` data folder, then set `CODEWISE2_QA_URL` to its printed loopback address before `npm run test:e2e`. The historical API1 harness remains only under `test:e2e:historical`; it is not current release evidence.

For source development after the initial frontend build, run `npm.cmd run dev` (or `npm run dev` in a POSIX shell). This entry runs the TypeScript backend with `tsx` and serves the most recent `dist/web` client. It is not a Vite HMR server and does not watch either frontend or backend changes. Rebuild the frontend after web edits and restart the backend after server edits. Setup/build require pinned dependencies; ordinary bundled practice/history do not require internet or an AI key.
