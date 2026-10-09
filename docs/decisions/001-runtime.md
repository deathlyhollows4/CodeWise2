# Runtime and local boundaries

Verified 2026-10-08: Windows ARM64 Node v24.19.0. Built-in node:sqlite avoids an incompatible native SQLite addon. Its documented experimental warning is retained rather than hidden. SQLite uses WAL, foreign keys, busy timeout and explicit write transactions. Data lives outside build outputs.

Vite8.3.3's Rolldown path handling failed with Windows ARM sandbox realpath EPERM. Selected supported patched Vite7.3.7 with preserveSymlinks; actual production build passes. TypeScript6.0.3 is the newest stable version within current typescript-eslint8.71.1's documented <6.1 peer range; TypeScript7 is not forced through an unsupported dependency tree. React19.3.0 and Monaco0.57.0 bundle local assets/worker. Overrides pin patched DOMPurify3.4.16 and KaTeX0.19.0; npm audit reports zero vulnerabilities at this snapshot.

Official DeepSeek completion/model/pricing pages were checked. The live model-list result determines selection; no old ID is guessed. Visible Markdown streams are stored before SSE delivery; private reasoning fields are discarded. Price snapshots use conservative peak/cache-miss rates checked 2026-10-08, distinguish estimates from billed totals, and unknown model rates stay unknown. Spend caps block unknown-priced models. No live provider inference was tested without a user key.

References: https://nodejs.org/api/sqlite.html, https://vite.dev/guide/, https://typescript-eslint.io/users/dependency-versions/, https://api-docs.deepseek.com/api/create-chat-completion/, https://api-docs.deepseek.com/api/list-models/, https://api-docs.deepseek.com/quick_start/pricing/.
