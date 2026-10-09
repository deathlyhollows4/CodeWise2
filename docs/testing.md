# Reproduce the checks

Use Node24+ from repository root. `npm ci` installs the pinned lockfile. `npm test` combines offline backend, renderer, security, adapter and content-pipeline fixtures. Individual commands: test:backend, test:renderer, test:security, test:runner and test:content. Fixture executions do not count as live judge/provider evidence.

Run `node scripts/check.mjs backend` (or renderer/security/runner/content/typecheck/lint/build/audit) to preserve the exact command, exit code, timestamps, Node/platform/architecture and SHA-256 hashes of relevant source/tests/config/lockfile. The report flags files changing during execution. Logs alone without identity are weaker evidence.

`npm run audit:content` must check actual quotas/publication/test/rights/progression evidence; `npm run validate:bank` reconciles exact current full receipts and dispatches fresh isolated references only when needed; it fails when the runner/full bank is unavailable. Its versioned content/harness/checker/runtime hashes determine which validations remain current.

Browser testing requires a compatible Chromium browser. `npm exec playwright install chromium` installs one, or set PLAYWRIGHT_BROWSER_EXECUTABLE to an installed binary. Start `npm run fixture:ui` with PORT as needed, and point the documented browser test address to it. `npm run test:e2e` captures real pages; screenshots still require visual review at all sizes/themes.

Production lifecycle smoke uses an isolated CODEWISE2_DATA_DIR and a distinct PORT. Run the compiled `node dist/server/index.mjs`, bootstrap a local session, verify health/static assets, then use scripts/stop.ps1 with the actual printed URL and confirm no listener plus failed HTTP. Production-smoke/stop reports record the already performed Windows ARM64 check.

Live DeepSeek smoke requires the user key entered locally in Settings and explicit consent to a small billable response. None was tested during development without that key.

The reserved real-runner normal-API slice is `node --import tsx tests/integration/real-runner-slice.mjs --run`. It discovers the approved private runner configuration, uses isolated temporary app data and explicitly labelled internal draft preview, and never changes global publication. Coordinate an exclusive runner window first. The passed report records all nine Arrays01-to03 language references, three incorrect submissions, real assisted acceptance with an explicitly mocked tutor hint, visible Run counts, persistence/idempotency and source identities. Fixture hints are never live DeepSeek evidence. Initial integration failure remains separately recorded.

Streaming regression tests exercise30000 one-character chunks (four durable text batches), exact Unicode preservation, short timer/terminal/cancel flush,128-row retention and expired HTTP cursor snapshot. The forced COMMIT failure check verifies both sequence and payload identity so a rolled-back sequence reused by a later status cannot acknowledge unsaved text.

`tests/integration/large-backup.test.ts` exports more than10MB of complete lessons, linked answer versions, immutable submissions, drafts, progress, saved public snapshots and ordinary notes. The actual JSON file is previewed/restored over HTTP and the target is reopened. Every restored section, Markdown/code hash and parent/submission/version association must remain identical. Source credentials are absent and the target's encrypted credential bytes are unchanged. Over-limit import and export return413 while preserving the profile; no history is silently omitted. Both use64MiB canonical UTF-8 JSON, with4KiB HTTP wrapper allowance. The request reader preserves UTF-8 across network chunk boundaries, maintains a byte counter and collects bounded buffers rather than repeatedly rescanning a growing string. Node24's documented [`Readable.iterator` option](https://nodejs.org/download/release/v24.20.0/docs/api/stream.html#readableiteratoroptions) permits a structured size-error response without destroying the connection prematurely.

`node --import tsx scripts/audit-authored-curriculum.ts` reads actual materialized manifests and emits per-ID route/checkpoint/teacher defects plus bounded actual-engine traces. Planned but absent targets retain their missing-target issue and are classified as pending authoring. It never edits another owner's metadata or persists simulation mastery. Declared teacher/search/transition bounds and capped coverage are explicit. Arrays01/02 entry branches and original-focus restoration after teacher completion are included. Learning-3 regressions cover same-step purpose across refresh/manual teacher navigation/backup/restart; practice-only shared introduced skills cannot create independent evidence or unlock a higher step until an independent accepted checkpoint. Exposed, solved, unrelated, higher-step and untaught candidates remain excluded.

Learning-4 tests submit untouched starters in Java/C++/Python and comment-only variants, retaining every wrong verdict while preventing remediation. Three actually edited distinct failures still select remediation. Historical unflagged rows are replay-classified from captured job starters without rewriting evidence. Accepted starter-only status fixtures still produce ordinary accepted evidence. The conservative normalization preserves Python indentation and quoted comment markers; no general semantic-equivalence claim is made.

Profile admission: `node --import tsx --test --test-concurrency=1 tests/integration/profile-owner.test.ts` covers simultaneous admission, live-job preservation, clean release, startup failure and crash reclaim with inert markers. `powershell.exe -NoProfile -NonInteractive -File scripts/prove-profile-cli.ps1` checks documented compiled CLI startup on isolated ports3180/3181, second-start exit1 without recovery or port consumption, clean stop and same-profile restart. It runs no submitted code or provider request and refuses occupied proof ports. Exact hashes and outcomes are saved in `profile-owner-actual-cli.json`; fixture evidence is distinct from native grading.

Current curriculum release gate: `npm run audit:curriculum` invokes `node --import tsx scripts/audit-authored-curriculum.ts --release`. Diagnostic mode remains available without `--release`; its exit0 is not a release pass. Release mode exits nonzero for metadata load failures, source changes during read, incomplete243 scope, noninformational route/checkpoint/teacher gaps, exhausted declared exploration caps, or a focused topic with no eligible first question/explicit teacher. All18 empty-focus entries are recorded; separate bounded teacher-return traces are in `independent-empty-evidence-focus-probe.json`. Finite already-solved/exposed peer exhaustion is explicitly informational. Current learning5 retains historical bridge tests and adds first-entry focus preservation without awarding mastery.

`npm run validate:bank` is the complete243/729 reference gate. It reuses only exact current suite/version/language/checker identities with full accepted counts and the current attested runtime; otherwise it dispatches fresh ordinary isolated references. A cached729 pass is not729 newly executed jobs. Immutable reports distinguish cache/fresh counts and represented suite checks. Ancillary secondary-topic/approach approval is a separate identity-bound presentation gate, not permission to migrate core reviews or language receipts.

Complete current browser-fixture recipe (two terminals; use a fresh profile):

```powershell
# Terminal1, from the repository root after npm.cmd ci and npm.cmd run build:
$env:PORT='3100'
$env:CODEWISE2_FIXTURE_DATA_DIR=Join-Path $PWD ('.runtime/browser-fixture-'+[Guid]::NewGuid())
$env:CODEWISE2_FIXTURE_FULL_CATALOGUE='1'
$env:CODEWISE2_FIXTURE_HISTORY='1'
$env:CODEWISE2_FIXTURE_STREAM='0'
npm.cmd run fixture:ui
```

```powershell
# Terminal2: copy the address actually printed by Terminal1.
$env:CODEWISE2_QA_URL='http://127.0.0.1:3100'
# If needed, set PLAYWRIGHT_BROWSER_EXECUTABLE to an installed compatible Chromium.
npm.cmd run test:e2e
```

The profile contains labelled saved-history fixtures, no real provider connection and no fabricated accepted learner evidence in full-catalogue mode. Existing profiles are preserved. Use the printed address with `scripts/stop.ps1 -Address ...` for graceful cleanup after verifying that listener belongs to this fixture. The historical API1 harness under `test:e2e:historical` is not the current API2/publication test. The current harness/report explicitly distinguishes draft-preview versus published-source fixtures and never proves native grading or live DeepSeek output by screenshots.
