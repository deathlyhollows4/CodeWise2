# CodeWise2 USP delivery and economics

Read-only inspection and public-source research, 2026-10-12. Rates are dated observations; workloads, caps, labour prices and margins are planning assumptions. No commercial service, live provider behavior or hosted judge was validated.

## Current implementation evidence

Checkout: `a8b3db423a2d3bd4c70e2e84667b53a3ae60fa55`. Source flags and existing acceptance documents are different evidence types. No app build, grading job, submitted code, provider request or WSL policy operation was run for this research.

| Claim | Inspected source pointer | Bounded finding |
|---|---|---|
| Curriculum | `content/catalogue.json`; each listed `problem.json`, `visible-cases.json` and starter file path | Static inspection counted 243 entries, all catalogue statuses published, 18 topics, 729 visible cases and 243 starter files in each of Java/C++/Python. This proves presence, not fresh acceptance. |
| Progression | `packages/learning-engine/src/index.ts:25` | `recommend` distinguishes independent next step from same-step assisted checkpoint, filters solved/exposed tasks and checks prerequisites/explicit teacher routes. Finite checkpoint exhaustion is reported. |
| Prerequisite repair | `packages/learning-engine/src/teacher-closure.ts:3` | Bounded search only follows explicit remedial links. It does not grant independent skill evidence just because a link exists. |
| Evidence | `apps/server/src/app.ts:425`; `apps/server/src/store.ts:210`; `packages/learning-engine/src/path-state.ts:3` | Full Submit outcomes record assistance; languages have separate evidence. Assistance is retained by problem, not erased by switching language or deleting a lesson. Cannot detect help outside the app or prove identity. |
| Review | `packages/learning-engine/src/review-calendar.ts:3`; `apps/server/src/app.ts:232` | Local calendar intervals are 1/3/7/14/30; due queue derives from accepted/review evidence. Repeating the same task is not fresh transfer. |
| Entry assessment | `packages/learning-engine/src/assessment.ts` | 6–10 bounded probes; unsupported/incomplete observations remain unknown. Not a validated interview-readiness score. |
| Provider boundary | `apps/server/src/deepseek.ts:49`; `apps/server/src/tutor-context.ts:66` | Fixed official endpoint; explicit actions, bounded context, saved outputs. System prompt requests restrained hints and cannot establish that actual model responses comply. |
| Tutor limits/accounting | `apps/server/src/app.ts:1749`; `packages/contracts/src/index.ts:195`; `apps/server/src/usage.ts:1`; `apps/server/src/usage-ledger.ts` | Hint output ≤512 and error explanation ≤768 tokens; preference output ≤8192, daily requests ≤100 and daily tokens ≤500000. Spend cap optional. Unknown usage/cost is represented separately; these are local controls, not a paid-service quota. |
| Platform/startup | `scripts/start.ps1`; `README.md`; `docs/RELEASE_HANDOVER.md` | Windows ARM64/dedicated WSL is the historically verified configuration. Startup performs runner preflight; unavailable containment does not permit host execution. No other platform was verified here. |
| Content evidence identity | `packages/judge-adapter/src/content.mjs:16` | Validation identity includes contract, statement, visible cases, suite, language files and checker code. New/changed assessment content or harnesses requires new evidence. |

Graph first: project `C-Users-brawl-OneDrive-Desktop-CodeWise2`; initial generation 2026-10-07 contained specification sections and no matching implementation symbols. Coverage reported relied-on files not tracked, so source fallback was used. During research an automatic refresh appeared at 2026-10-12T17:13:13Z; relied-on paths still returned metadata-changed/excluded signals. No manual reindex was requested. Direct source reads/searches remain the evidence. A sampled broader content scope exposed C++/Java wrapper parser gaps; no wrapper-coverage or exhaustive execution claim is made, and that scope was not used to infer absence or correctness. A generated source manifest records inspected-file hashes and final drift verification.

## Product work actually required

The fresh-checkpoint foundation fits the proposed promise, but a commercially credible assessment service needs its own timed sessions, exposure declarations, item/form identifiers, version-bound receipts, reasoning rubrics, reviewer calibration, delayed fresh forms and intelligible reports. Self-directed local records are useful for learning; they are not tamper-resistant hiring evidence.

Use a narrow concept pool for the pilot, not all 18 topics. Prepare matched forms A/B/C and weekly checks; prevent reuse within each learner. Different numbers, titles or variable names alone do not establish transfer. Include changed constraints/representations and mixed strategy choices. Inventory enough eligible tasks before promising a duration. Content-authoring and expert QA are ongoing costs, even when the code is public. Rights clearance includes problem assets and notices; GitHub repository metadata returned `license: null`, so do not assume a permissive software license.

Add plan-before-hint or a partial worked example only after live tutor evaluation shows usefulness without uncontrolled answer leakage. Code correctness comes from the isolated judge, not an AI verdict. Assistance can be deliberately offered during learning; assessment mode must state its different conditions. Scoring a verbal explanation requires a rubric/reviewer, with AI assistance labeled if used and disagreement audited.

The local single-learner server is not a ready multi-tenant SaaS. Hosting adds accounts, authorization, per-user secrets/storage/entitlements, queue isolation, tenant limits, abuse resistance, backups, incident handling and privacy consent. A loopback security assumption cannot simply be moved to a public URL. Prove common student-device access before advertising broad compatibility. Keep confidential pilot identities, exports and consent records outside source/build/version control.

## Bounded AI economics

The official [DeepSeek pricing page](https://api-docs.deepseek.com/quick_start/pricing/) repeatedly timed out through the web reader; an unauthenticated direct HTTPS fetch succeeded on 2026-10-12 and exposed the pricing table. Peak cache-miss USD rates per million tokens: Flash input0.30/output1.20; Pro input1.32/output3.96. The source's 2026-10-08 conservative snapshot agrees. Use peak rates without assuming cache/off-peak savings. Pricing changes and account access still require rechecking before a paid offer.

| Assumed four-week workload | Input/output tokens | Flash estimate USD | Pro estimate USD |
|---|---:|---:|---:|
| 200 calls × 8000 input + 2000 total generated | 1.6m / 0.4m | 0.960 | 3.696 |
| Same calls, 50% extra for explicit retries/failures | 2.4m / 0.6m | 1.440 | 5.544 |
| Stress scenario: 200 calls × 16000 input + 8192 generated | 3.2m / 1.6384m | 2.92608 | 10.712064 |

Formula: `(input × input_rate + generated × output_rate) / 1,000,000`. These are token-cost scenarios, not observed average usage, all-in costs or a promised bill. Include billed reasoning, not only the learner-visible answer. The [official API](https://api-docs.deepseek.com/api/create-chat-completion/) describes thinking as enabled by default, output limits and reasoning-token usage. The current adapter does not explicitly choose thinking mode/effort; short visible answers therefore do not establish short latency or low billed generation. Evaluate the effective behavior using an authorized live test before bundling service-funded AI. Never log provider reasoning or credentials.

Proposed paid-service controls: allowlisted models; total serialized context and generated-token ceilings; at most one concurrent generation per learner; initial 200-request block allowance with a separate USD5 reserved-spend ceiling that stops earlier when necessary; short hints; no automatic retry loops; explicit paid top-up only with consent. Reserve before dispatch, reconcile reported usage and conservatively retain reservations when delivery/usage is unknown. Account for failed/canceled/empty outputs. Label local estimates; reconcile against actual provider billing. Preserve study/history when a cap stops AI.

BYOK means the learner, not the business, normally pays DeepSeek. State that separately from subscription price. Pilot can run without AI, using reviewed explanations and group support. A later bundled-key backend is a new security/billing design, not exposing a shared provider key to clients. No unlimited-AI claim is recommended.

## Judge economics and isolation

With local execution, cloud judge cost is absent but onboarding, device resources and support still cost time. Retain the verified dedicated runner and do not run learner code on the host. Hosted judging requires separate execution/security design and evidence, not a renamed local runner.

For an order-of-magnitude comparison only, [AWS Fargate pricing](https://aws.amazon.com/fargate/pricing/) gives a US East Linux/x86 example of USD0.000011244/vCPU-second and USD0.000001235/GB-second, with a one-minute minimum. At 1vCPU + 2GB, a 60-second task costs USD0.00082284; 500 such tasks cost USD0.41142. At 180 seconds, the same 500 cost USD1.23426. A continuously provisioned equivalent for 30 days costs approximately USD35.55. These exclude image start time, scheduler/API, database, logging, storage/network, IPv4, retries, idle capacity, security work and operational labour; compiler/full-suite workloads may take longer or need more memory. This is not a chosen judge architecture or an India-region quote.

Fargate task boundaries can isolate workloads, but [official security documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-security-considerations.html) restricts privileged containers and Linux capabilities. Compatibility with the current IOI-isolate runner is **not established**. Do not port it assuming nested containment works. Independently test network/file/resource canaries, secret/metadata access, tenant separation, timeouts and abuse before accepting hostile submissions in any cloud design.

Proposed paid-service limits: one running job per learner, a bounded queue, a defined monthly submission allowance (initial hypothesis 500), measured compile/full-suite ceilings, fail-fast errors, deduplication and total account/spend limits. Acceptance still requires the whole intended suite; quotas cannot turn a sample into acceptance. No task must contain app/provider credentials or another learner's data. Never use an AI-generated expected answer as an unreviewed judge oracle.

## Commercial implications

Compute may be a small part of cost; qualified feedback, content QA, onboarding and acquisition are likely to dominate this proposed service. This is an inference to measure. Track p50/p95 setup time, unsupported-device rate, support minutes, assessment authoring/reuse, review disagreement, full-suite duration, failure/retry rate and cost per active learner.

The main recommendation's revised labour model requires about 33.3 delivery hours per 20-person block: 22.3 hours onboarding/practice reviews/group calls plus 11 hours assessment grading, calibration, reports and retests. The illustrative assessment allocation is eight hours grading (about eight minutes per learner per assessment), one hour calibration and two hours report/retest work. This is a stringent assumption to measure, not an established sufficient review time. At ₹1499 the revised contribution is only about30% before content/acquisition/tax/refunds. At ₹2499 it is about58% before those costs, but actual buyer acceptance is unknown. If learners need 30-minute individual weekly practice reviews instead, those reviews alone take40 hours. Reduce promise/scope, raise a tested price or stop; do not quietly replace promised human feedback with unchecked AI.

Proceed only with a model that funds actual ongoing QA and support, and can fulfill refunds. First-cohort content costs may be a declared learning investment; repeat-cohort economics must include replenishment, not assume authoring disappears. Publishing checkout/pricing, collecting payment, contacting people and implementing any of this require a subsequent authorized task; none occurred in this research.
