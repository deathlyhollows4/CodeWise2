# CodeWise2 — Complete Product Specification and Codex Build Directive

**Version:** 1.0  
**Prepared:** 8 October 2026  
**Product:** CodeWise2  
**Deliverable:** A complete, working, professionally designed local-first adaptive DSA learning application.  
**Development workers:** `gpt-6.1-sol`, reasoning effort `medium`, Standard speed; never Fast mode.  
**Application AI provider:** DeepSeek, using the user's key entered through the application's localhost Settings page.

---

## 0. Start here: instructions to Codex

Build the application described in this file. This is an implementation assignment, not a request for a proposal, scaffold, tutorial, or another specification.

Treat this document as the source of truth. Preserve every locked product requirement. Make reasonable implementation decisions where defaults are permitted, record them, and continue without asking the user to approve each development phase. Do not stop after an attractive frontend, an architecture diagram, a few example questions, or a mocked demonstration.

The main agent must orchestrate, assign work, review evidence, resolve decisions, and judge completion. Subagents must perform substantive research, design, implementation, content creation, integration, testing, and fixes. Maintain useful parallel work throughout development rather than spawning agents once and then completing everything sequentially yourself.

A functioning slice is a milestone, not the final deliverable. The finished release must contain all 300 validated problems, all three programming languages, a real isolated judge, deterministic adaptive progression, a working DeepSeek integration, durable saved AI outputs, and the complete polished interface.

Do not request the user's DeepSeek key in the development conversation. Implement the Settings interface so the user can enter it locally after launching the application. Development and ordinary practice must not require that key.

### 0.1 Locked requirements

| ID | Non-negotiable requirement |
|---|---|
| CW-01 | App name: **CodeWise2**. |
| CW-02 | Every core problem supports **Java, C++, and Python** in version one. |
| CW-03 | Exactly **300 distinct published core questions**, with the topic quotas in section 3. |
| CW-04 | Exactly **three visible examples/test cases** per core question. |
| CW-05 | Default **at least 200 distinct hidden cases per question**, with only narrowly justified finite-input-domain exceptions. |
| CW-06 | Independently solving a new question moves the next new challenge up **one manageable internal step**, subject to prerequisites and available validated content. |
| CW-07 | Struggling leads to integrated teaching in **simple English with necessary technical terms explained**. |
| CW-08 | A **LeetCode-style problem/editor/run/submit/results workflow**, with an original CodeWise2 visual identity. |
| CW-09 | **DeepSeek is the sole provider for application AI inference.** |
| CW-10 | A real **localhost Settings page accepts, tests, saves, replaces, and removes the DeepSeek key**. Editing environment files is not required for normal key setup. |
| CW-11 | The application must be **beautiful, professional, cohesive, and comfortable for sustained study**. |
| CW-12 | **All user-facing AI outputs are saved automatically and persist across refreshes and application restarts.** |
| CW-13 | AI output must be **attractively typeset and structured**, including readable prose, syntax-highlighted code, examples, tables, and complexity notation. |
| CW-14 | Prefer suitable **reusable online problem data**; verify rights and supplement gaps with independently authored, validated problems. |
| CW-15 | Use continuous useful parallel development workers with **`gpt-6.1-sol` + `medium` effort**, not another model or effort level. |
| CW-16 | Reuse suitable subagents; do not close them immediately after each task. No Fast mode. |
| CW-17 | Real code execution determines acceptance. AI never substitutes for the judge. |
| CW-18 | No fake progress, placeholder question bank, invented tests, fabricated validation evidence, or silent weakening of requirements. |

### 0.2 Defaults that resolve previously unanswered implementation questions

These are implementation defaults, not claims that the user previously chose every detail:

- **Local-first, personal, single-learner application** for version one. No public account system or paid hosting is required. Design the data model cleanly enough to add profiles later, without implementing multi-tenant infrastructure now.
- Desktop/laptop-first, responsive on smaller screens. Provide Windows-friendly setup and detect the actual operating system and CPU architecture rather than assuming x86 hardware.
- Serve the app on loopback, normally `http://localhost:3000`. Choose a free alternate port only when needed, and print/open the actual address.
- Use a TypeScript web frontend and Node.js backend, durable local storage, and a separately isolated local execution service.
- Default to a refined dark theme, with equally finished light and system-theme options.
- No payments, advertisements, external analytics, social feeds, leaderboards, cloud sync, or mandatory external authentication.
- No runtime AI-generated question may silently enter the validated 300-question core bank.

Where implementation details change, write an architectural decision record. Changing a library does not authorize changing the product requirements.

---

## 1. Codex parallel-subagent operating contract

### 1.1 Model and reasoning settings

Use **GPT-6.1 Sol**, model identifier **`gpt-6.1-sol`**, at **`medium` reasoning effort** for every development subagent. This applies to explorers, content workers, implementers, reviewers, browser testers, and integration workers—not only the primary coding worker.

Current official documentation provides subagent model/effort defaults and custom-agent settings. Verify the installed Codex client's supported configuration before applying it. See [R1], [R2], and [R3]. Model availability still depends on the actual account and runtime.

For a client supporting the current schema, use a project configuration equivalent to:

```toml
# .codex/config.toml
[agents]
enabled = true
max_concurrent_threads_per_session = 6
default_subagent_model = "gpt-6.1-sol"
default_subagent_reasoning_effort = "medium"
```

Each custom worker configuration must also explicitly contain:

```toml
model = "gpt-6.1-sol"
model_reasoning_effort = "medium"
```

Use the installed client's documented method to ensure **Standard speed / Fast mode off** [R13]. Inspect effective settings and inherited overrides; simply omitting a Fast setting is insufficient when a parent or global configuration enables it. Do not invent an unsupported configuration key. Do not modify unrelated global user settings.

If the exact model, medium effort, or real subagent tools are unavailable, report the precise limitation and the smallest user action needed. Do not pretend to have spawned workers, simulate them with role labels, silently choose a different model, or downgrade to sequential implementation. A model-access blocker is not permission to fabricate compliance.

Configuration changes may only affect newly started sessions. Verify actual worker sessions, not merely the contents of a file.

### 1.2 Main-agent responsibilities

The main agent owns the task graph, priorities, file ownership, interface decisions, acceptance criteria, and final judgment. It may inspect files and test evidence and maintain coordination artifacts. Delegate substantive edits and test execution to workers, including merge/integration changes.

Do not make the main agent a single overloaded implementation bottleneck. Conversely, do not spawn agents for trivial work that is faster and clearer within an existing worker's assignment.

### 1.3 Recommended reusable worker pool

| Worker | Primary responsibility |
|---|---|
| Architecture/backend | Contracts, database, migrations, APIs, local settings, job lifecycle. |
| Design/frontend | Visual system, responsive shell, workspace, Settings, accessibility. |
| Judge/languages | Isolated execution, wrappers, language mapping, grading, resource limits. |
| Learning/tutor | Deterministic adaptation, review logic, DeepSeek adapter, lesson persistence. |
| Curriculum/content | Source audit, topic coverage, problem packs, references, generators. |
| Quality/integration | Independent reviews, browser flows, security tests, regression fixes, release evidence. |

These are roles, not a requirement to have exactly six active workers at all times. Use a resource-aware pool, normally four to six concurrent workers when independent tasks exist. Use fewer when dependencies or machine capacity require it. Rotate available workers into topic-specific content batches after foundational work stabilizes.

The independent reviewer should not be the sole author of the component being accepted. Keep review responsibility separate where feasible.

### 1.4 Task and file-ownership rules

Each assignment must specify its objective, owned files/directories, input contracts, expected artifacts, tests, and acceptance conditions. Agree shared schemas before parallel implementation. Assign a single writer to shared migrations, root package files, the lockfile, and other high-conflict files.

Use isolated worktrees when useful and available, or clear non-overlapping ownership in one workspace. Integrate small verified changes frequently. Do not overwrite another worker's uncommitted work or run destructive repository-reset commands.

After a worker finishes:

1. Review its actual diff, test output, and unresolved issues.
2. Reuse it for related follow-up work while its context remains relevant.
3. Keep it available rather than immediately closing it.
4. Replace or close it only for context contamination/bloat, resource or thread limits, a genuine task-boundary benefit, failure, or final shutdown.

Maintain a simple agent registry with worker ID, role, model/effort verification status, current task, file ownership, and state. Do not claim indefinite session persistence when the runtime does not support it.

### 1.5 Continuous execution, not endless activity

Continue implementation, validation, review, and repair until the release criteria pass. Do not repeatedly ask whether to proceed to the next phase. Continue meaningful parallel work while other tasks are blocked.

Respect actual permissions, rate limits, context limits, and resource limits. Do not bypass approval controls, make unapproved purchases, install privileged system components without required approval, or promise work after the current execution session has stopped.

Before a genuine interruption, save an accurate `BUILD_STATUS.md` and task ledger containing completed work, exact remaining work, test evidence, blockers, and the next assignments. A checkpoint is not a completion claim.

---

## 2. Product experience and scope

### 2.1 Core promise

> CodeWise2 chooses a suitable next DSA challenge from demonstrated understanding, advances gradually after independent success, and teaches the missing piece when the learner struggles.

The three authorities must remain separate:

| Responsibility | Authority |
|---|---|
| Whether submitted code passes the published requirements and test suite | Deterministic execution and checker. |
| Which problem comes next and how progress changes | Versioned deterministic learning engine. |
| How to explain, hint, clarify, and teach | DeepSeek using approved problem/context information. |

### 2.2 First-run journey

The learner launches the app, sees an original polished welcome screen, chooses Java, C++, or Python, and optionally enters a preferred display name. The app then offers a short placement assessment or a beginner start.

The assessment must use selected questions from the core bank, not inflate the 300-question count. Start from the stated experience, adapt conservatively, and stop after approximately six to ten questions or earlier at the learner's request. Do not pretend that a short assessment establishes proficiency in every topic. Unassessed skills remain unknown.

The learner can add a DeepSeek key during onboarding or later under Settings. Explain what leaves the device before their first AI request. Skipping the key must not block code practice, the roadmap, progress, saved non-AI notes, or ordinary execution when the local runner is ready.

### 2.3 Normal practice journey

Home → Continue learning → problem workspace → write code → Run → Submit → result → next action.

After independent success, present a short explanation of the next step. After an assisted solve, present a related independent checkpoint. After a failed attempt, offer integrated teaching and keep the learner's code intact.

Always answer these questions on screen: **What happened? What does it mean? What should I do next?**

### 2.4 Scope boundaries

Version one is not a social coding network, contest platform, commercial course marketplace, general-purpose chatbot, or automated interview assistant. Do not spend the project budget on unrelated features while any core requirement remains incomplete.

---

## 3. Curriculum: exact 300-question allocation

The following is the frozen allocation approved for this build. It doubles the NeetCode 150 per-topic baseline checked for this specification [R4]. Future changes to the external site must not silently change our quotas.

| Order | Topic | Baseline | CodeWise2 quota |
|---:|---|---:|---:|
| 1 | Arrays & Hashing | 9 | 18 |
| 2 | Two Pointers | 5 | 10 |
| 3 | Sliding Window | 6 | 12 |
| 4 | Stack | 6 | 12 |
| 5 | Binary Search | 7 | 14 |
| 6 | Linked List | 11 | 22 |
| 7 | Trees | 15 | 30 |
| 8 | Heap / Priority Queue | 7 | 14 |
| 9 | Backtracking | 10 | 20 |
| 10 | Tries | 3 | 6 |
| 11 | Graphs | 13 | 26 |
| 12 | Advanced Graphs | 6 | 12 |
| 13 | 1-D Dynamic Programming | 12 | 24 |
| 14 | 2-D Dynamic Programming | 11 | 22 |
| 15 | Greedy | 8 | 16 |
| 16 | Intervals | 6 | 12 |
| 17 | Math & Geometry | 8 | 16 |
| 18 | Bit Manipulation | 7 | 14 |
| | **Total** | **150** | **300** |

A problem belongs to exactly one primary topic for counting and may have multiple secondary tags. Java, C++, and Python implementations of the same problem count as one problem. Renaming, changing a story, or changing constants does not create a distinct problem.

Practice repeats, assessments, language switches, and review sessions do not increase the core question count. Any auxiliary teaching micro-exercise must be clearly separated from that count.

### 3.1 Coverage, not numerical padding

Create a curriculum matrix before authoring the bank. Map questions to skills, prerequisites, difficulty steps, approaches, common errors, same-level checkpoints, and easier/harder transitions.

The extra questions should bridge learning gaps rather than merely double the number of hard interview exercises. Cover, where appropriate:

| Topic | Representative coverage to distribute within the quota |
|---|---|
| Arrays & Hashing | Traversal, counts, membership, grouping, prefix/suffix information, invariant maintenance. |
| Two Pointers | Opposing pointers, read/write pointers, sorted-input reasoning, duplicate handling. |
| Sliding Window | Fixed and variable windows, frequency tracking, valid-window conditions. |
| Stack | Matching/nesting, expression processing, monotonic stacks and related invariants. |
| Binary Search | Exact search, boundaries, rotated structure, search over an answer space. |
| Linked List | Pointer changes, reversal, merging, cycles, two-pointer relationships. |
| Trees | Traversals, recursive returns, breadth-first search, search-tree properties, subtree reasoning. |
| Heap / Priority Queue | Top-k, repeated extraction, merging, scheduling and stream-style operations. |
| Backtracking | Subsets, combinations, permutations, pruning, constraint exploration. |
| Tries | Prefix operations, insertion/search, wildcard or compound prefix applications. |
| Graphs | Representation, traversal, components, grid graphs, cycle detection, topological concepts. |
| Advanced Graphs | Weighted shortest paths, disjoint sets, spanning structures, harder graph composition. |
| 1-D Dynamic Programming | State definition, recurrence, memoization/tabulation, optimization over sequences. |
| 2-D Dynamic Programming | Grid and two-sequence states, multidimensional transitions, bounded choices. |
| Greedy | Local-choice justification, ordering, feasibility, contrast with invalid greedy rules. |
| Intervals | Overlap, merging, insertion, scheduling, event ordering. |
| Math & Geometry | Number properties, coordinate reasoning, transformations, safe arithmetic. |
| Bit Manipulation | Masks, set bits, XOR properties, shifts, signedness and fixed-width interpretation. |

These are coverage directions, not permission to exceed quotas or force every named technique into an unsuitable exercise.

### 3.2 Roadmap presentation

Include all 18 topics in a recognizable connected roadmap based on the user's supplied topic layout, but create original styling and components. Provide pan/zoom, keyboard-accessible topic selection, fit-to-view, and a compact list alternative.

Topic connections represent recommended learning relationships, not universal hard academic prerequisites. Do not, for example, prevent all mathematics exercises merely because a learner has not finished dynamic programming. Eligibility comes from each problem's actual prerequisite metadata.

Show not started, in progress, learned with help, independently demonstrated, and review-due information using text/icons as well as color. Separate completion from mastery. Clicking a topic opens its overview, skills, eligible next challenge, and problem list.

---

## 4. Question sourcing, rights, and publication pipeline

### 4.1 Source policy

Prefer appropriate, clearly reusable online content. Record provenance at the level of the actual assets reused: statement, examples, tests, reference code, diagrams, and explanations can have different origins or permissions.

Exercism's official problem-specifications repository is an initial candidate: it provides exercise descriptions, metadata, and optional canonical test data [R7]. Its repository license is MIT [R8]. Preserve required notices and inspect asset-level provenance; do not assume every exercise fits this curriculum.

DeepMind CodeContests is a secondary candidate. It contains problem/test/solution material, but its documentation flags separate third-party terms despite its stated code and non-code licenses [R9]. Verify each selected record instead of treating the dataset as blanket republication permission.

Use NeetCode as the selected curriculum baseline, not as automatic permission to copy its content or hidden tests. Do not scrape restricted platforms, bypass access controls, or assume that material in a random public repository is licensed simply because it is downloadable.

If suitable rights-cleared content is unavailable for a slot, independently author a new exercise teaching that skill. It must have an original statement and validated tests, not a lightly paraphrased proprietary problem. Do not fabricate a source or claim that an original exercise came from a licensed dataset.

### 4.2 Required provenance record

Each published question must record:

- Stable internal ID and content version.
- Origin type: imported, adapted, or original.
- Source URL/repository/path and pinned revision where applicable.
- Source author/organization and attribution text when available.
- License identifier and evidence location for each reused asset class.
- Modifications made to imported material.
- Review date, reviewer identity/type, and status.
- Any limitations or excluded source assets.

Use honest labels: automated review is not legal counsel or human expert review. Unclear rights block publication of that imported asset; replace it with a suitable alternative rather than quietly omitting the audit.

Include third-party notices and an in-app Sources & Licenses page. Do not falsely claim affiliation with NeetCode, LeetCode, Exercism, or DeepSeek.

### 4.3 Build-time workflow

Candidate discovery → rights screening → curriculum fit → normalized problem pack → reference solutions → visible examples → hidden-suite expansion → validation → independent review → published core manifest.

External websites must not be needed whenever the app starts. Pin sources and bundle approved problem packs so the validated bank works offline after installation. Import/download tools are build-time or explicit maintenance tools, not a runtime dependency.

Batch the curriculum work across workers with non-overlapping problem IDs/topic ownership. Keep a machine-readable catalogue from the start. A placeholder title or unvalidated pack never counts toward the 300.

---

## 5. Problem-pack contract

Use a versioned schema and generated/public DTOs rather than passing internal records directly to the browser. Shared TypeScript types alone are insufficient; validate runtime data.

Each problem pack must include:

| Area | Required information |
|---|---|
| Identity | ID, slug, version, title, primary topic, secondary topics, skill tags. |
| Learning | Specific objective, prerequisites, local difficulty step, approach tags, common mistakes, related checkpoints, remedial links, next-step links. |
| Statement | Original/licensed Markdown, precise task, constraints, required output semantics. |
| Interface | Function or class contract, input/output schemas, representations for data structures. |
| Visible examples | Exactly three, each with input, expected output, and explanation. |
| Hidden suite | Versioned actual cases or reproducible materialized cases, suite hash, case categories, input hashes, validation evidence. |
| Languages | Starter, wrapper, reference solution, runtime mapping, and limits for Java, C++, and Python. |
| Grading | Checker kind, ordering rules, duplicate rules, numerical rules, tolerance where relevant. |
| Provenance | Asset-level source/license records and required notices. |
| Publication | Draft/validated/published state and audit references. |

A conceptual folder structure:

```text
content/problems/<problem-id>/
  problem.json
  statement.md
  visible-cases.json
  private/
    hidden-cases.jsonl
    suite-manifest.json
    generator.*
    oracle.*
    mutation-cases.json
  languages/
    java/{starter,wrapper,reference}.*
    cpp/{starter,wrapper,reference}.*
    python/{starter,wrapper,reference}.*
  provenance.json
  validation.json
```

The layout may differ, but enforce the public/private boundary in code and build outputs. Private packs must never be part of the frontend bundle, public static directory, browser source maps, or ordinary question API responses.

### 5.1 Cross-language representation rules

Default to function/class-based problems so learners do not repeatedly implement input parsers. Supply language-appropriate helpers for arrays, matrices, lists, trees, graphs, and operation sequences.

Document zero/one-based indices, null handling, allowed characters, mutation requirements, overflow behavior, and ordering semantics. Where values exceed JavaScript's safe integer range, use a schema-defined lossless encoding rather than silently rounding them in the Node/browser layer.

State whether strings use ASCII or a particular Unicode interpretation. Define fixed-width bit behavior where needed. Reject unsupported NaN/infinity values. For object identity problems, preserve node identity instead of equating nodes solely by value.

For stateful class problems, one operation sequence is one test case; reset the object between cases. For stateless problems, prevent accidental shared inputs or mutable state from contaminating subsequent cases.

---

## 6. Visible and hidden tests

### 6.1 Exactly three visible cases

Each problem initially displays three fixed examples:

1. An ordinary example demonstrating the task.
2. A valid boundary case.
3. A meaningful tricky case clarifying a rule.

Custom inputs and post-failure diagnostic counterexamples are separate features, not extra default visible examples. Label them accordingly.

### 6.2 Hidden-suite minimum

The default minimum is **200 unique valid hidden inputs per problem**, distinct from the three visible inputs. The default bank therefore contains at least 60,000 hidden cases and exactly 900 visible examples. All three languages use the same logical tests.

A smaller hidden suite is permitted only where the valid input domain genuinely contains fewer distinct remaining inputs. In that situation, enumerate the eligible domain where feasible and document its cardinality, visible-case exclusion, actual hidden count, and rationale. Storage cost, slow execution, authoring effort, or schedule pressure are not exception reasons.

Do not pad counts with duplicate inputs, different labels on the same input, repeated execution of one case, or the same semantic case serialized differently. Use canonicalized input hashes and an additional structural-diversity review where applicable.

### 6.3 Suite composition and correctness

Use a problem-appropriate mix of boundary, structured, common-mistake, generated, and performance cases. Record generation seeds and generator versions. Do not impose irrelevant categories on a problem simply to fill a template.

Every input must satisfy the published constraints. Every expected result must be verified by execution/checking, not trusted merely because an AI wrote it. Use independent simple/brute-force oracles on small inputs where feasible, cross-language reference comparisons, and metamorphic/property checks appropriate to the problem.

Agreement between three translations of one incorrect algorithm is not sufficient independent verification. Have another worker inspect the recurrence/invariant and checker, especially for difficult problems and non-unique outputs.

Create representative deliberately incorrect implementations or mutations and demonstrate that the suite rejects them. Include boundary errors, duplicate mishandling, invalid complexity choices, or state mistakes as relevant. Record which faults are actually detected; do not advertise an unmeasured mutation score.

### 6.4 Checker behavior

Support exact structured equality, sequence equality, set/multiset comparisons, numeric tolerances, and custom validity checks as required. A different valid solution must not fail merely because it differs from one reference output.

Custom checkers are trusted reviewed application code, not AI-generated executable code evaluated dynamically. Validate checker correctness using both valid alternatives and deliberately invalid answers.

Do not claim to prove asymptotic complexity from a runtime measurement. Use calibrated performance cases and clear resource limits, with manual/content-review checks on the intended algorithmic requirements.

### 6.5 Execution accounting

A submitted run can stop early for a decisive failure or safety limit, but then report executed, passed, failed, and not-run counts honestly. Never display “200 passed” when only three examples or a subset ran.

Full-bank validation must execute all reference implementations against the complete suite. At the default sizes, this is at least 180,000 hidden case evaluations across the three languages, plus visible cases; it is not a requirement to create one container per evaluation.

Persist audit checkpoints so full validation can resume by problem/version/language/suite hash. Revalidate affected packs after changes.

### 6.6 Hidden does not mean cryptographically secret

Hidden means not exposed upfront through the learning interface. Publicly sourced tests may exist elsewhere, and a machine owner with access to local application files can inspect them. Do not claim DRM or secrecy against the owner.

Nevertheless, browser clients and submitted programs must not receive the full bank, expected answers, trusted checker internals, reference solutions, or credentials. The submitted program may receive the inputs it must solve, never the expected outputs used to grade it.

---

## 7. Real execution and three-language support

### 7.1 Runner architecture

Use a maintained, patched, self-hosted isolated execution service. Judge0 is the recommended first candidate, behind a narrow adapter; its API documents language execution and configurable limits [R10]. Verify actual supported runtime versions and the installed deployment's architecture compatibility.

Do not rely on a public demo judge or paid remote execution subscription. Bundle reproducible local setup for the selected service. If a different maintained local sandbox is needed, document the decision and preserve all three languages and security requirements.

The web backend must not run submitted code directly using a host shell/subprocess. No unsafe “temporary fallback” is allowed when Docker or the runner is unavailable. Instead, show a runner-not-ready state and preserve editing, reading, and saved work.

If the runner implementation requires a privileged controller or setup step, document and isolate it and obtain required installation permission. The web application and submitted programs must not receive broad host privileges. Do not confuse a privileged control plane with safe execution inside its sandbox.

### 7.2 Mandatory controls

- Isolate compilation as well as program execution.
- Disable outbound network access for submitted programs and prevent request-level overrides from enabling it.
- Enforce CPU time, wall time, memory, process/thread, output-size, file-size, and input-size limits.
- Keep application secrets, databases, home directories, source repositories, and the Docker socket inaccessible to submissions.
- Use ephemeral workspaces, restrictive mounts/permissions, cleanup, and reviewed sandbox profiles.
- Keep runner administration private and authenticated where supported. Browser requests must go through the application backend.
- Allow only approved languages and compiler options. Do not accept arbitrary callback URLs, runner endpoints, mount paths, shell commands, or extra files supplied by the browser.
- Apply bounded job concurrency, cancellation, timeouts, and queue limits.

Verify these controls with harmless canary fixtures and bounded test cases. Never use real secrets as test canaries.

### 7.3 Language readiness

Every published problem requires three passing reference implementations and three usable starters/wrappers. Record compiler/interpreter version, image/build identity, and calibrated limits.

Use Python 3, a supported Java runtime, and a supported C++ standard available in the chosen runner. Pin exact versions after verification and show them in the UI. Do not promise a runtime version that is not actually installed.

Account for language startup overhead and memory differences. Do not apply one untested time limit that unfairly fails all Java or Python references.

Preserve separate drafts and submission histories for each problem/language pair. Switching languages must not translate code through AI automatically or discard earlier code.

### 7.4 Efficient but honest judging

Use safe batching and compiled-artifact reuse when supported. A trusted harness can process multiple input cases, but expected results and acceptance decisions remain outside the learner-controlled process. Reset state according to the problem contract.

Do not spend 200 compilation startups unnecessarily if a safe batch design is available. Do not sacrifice isolation or correctness to optimize latency. Measure representative warmed-up submissions on the actual machine and record the results rather than promising a universal runtime.

Use immutable submission snapshots. A code edit made while an older job runs must not change what that older job grades.

### 7.5 Result states

At minimum distinguish queued, compiling, running, accepted, wrong answer, compile error, runtime error, time limit, memory limit, output limit, canceled, infrastructure error, and interrupted.

Only actual judged learning outcomes affect learning evidence. Infrastructure errors and canceled jobs never lower mastery. Preserve raw compiler/runtime output privately as bounded text, and show readable safe diagnostics without exposing host paths or secrets.


## 8. Deterministic adaptive learning engine

### 8.1 Model the learner at skill level

Track proficiency separately for topic, subskill, and implementation language. Do not assign one permanent global DSA level.

Keep at least: assessment state, current working step, highest independently demonstrated step, assistance history, independent evidence, review evidence, last activity, and due review time. Maintain algorithm-understanding evidence separately from language-implementation evidence.

Use understandable states such as **Not assessed**, **Practising**, **Learned with help**, **Solved independently**, and **Reviewed successfully**. Completion percentages may describe actual completed counts, but must not masquerade as scientifically calibrated probabilities of mastery.

Every progress update must reference the originating submission/evidence event and the version of the learning rules used.

### 8.2 Define a step using real content

An internal step is an ordered challenge level within a skill/path, not simply Easy/Medium/Hard and not necessarily comparable across topics.

Each transition should introduce a limited additional requirement while reusing familiar skills. Store a short learner-facing rationale, such as: “You already handle a single running maximum. This question adds duplicate handling.”

The curriculum must include actual validated same-level and next-level candidates. Do not invent a ten-level ladder for a six-question topic. Audit progression coverage, not only topic totals.

### 8.3 Outcome policy

| Observed outcome | Evidence update | Next action |
|---|---|---|
| New problem accepted without algorithmic assistance | Record independent success for supported skills and language. | Select an eligible question at the next internal step. |
| Learner fixes their own compiler errors or failed tests without a hint | Preserve independence. | Advance after eventual acceptance. |
| Accepted after a strategy hint or partial walkthrough | Record assisted success, not independent mastery. | Offer a different same-step checkpoint. |
| Full explanation, reference solution, or substantial code revealed | Record solution exposure and learned-with-help status. | Teach, then offer a related independent checkpoint. |
| Wrong answer on a genuine algorithmic attempt | Record attempt and observed failure, not permanent inability. | Show diagnostic feedback and integrated teaching path. |
| Repeated conceptual difficulty across meaningful attempts | Preserve historical evidence; adjust the working challenge conservatively. | Offer a prerequisite or one-step-easier exercise with an explanation. |
| Compile error, accidental interruption, runner/API failure | No negative conceptual mastery update. | Let the learner correct/retry or restore services. |
| Same accepted code resubmitted or old question reopened | Do not award another independent advancement. | Resume/review with its existing history. |
| Previously solved problem passed in review | Add retention evidence. | Do not manufacture a new-question advancement. |

Do not infer failure from time spent, a single typo, one test failure, or the learner using a different valid approach. No automatic full reset of a topic.

### 8.4 Assistance tracking

Use server-owned assistance events, for example:

- `feedback_only`: compiler messages, visible-case diffs, basic verdict explanation.
- `hint`: a strategy/pattern/concept clue.
- `walkthrough`: a worked approach or substantial guided derivation.
- `solution`: solution code, reference explanation, or equivalent disclosure.

Only `feedback_only` permits an independently solved classification for that exposure episode. Treat ambiguous teaching output conservatively as assistance. Do not rely on the model declaring that its own answer contained no hints.

Opening a saved solution for the same problem, revealing a reference solution, or asking for equivalent code in another language records exposure too. Switching languages or deleting the lesson must not erase that event.

The product cannot detect all outside help; communicate independence as “without recorded in-app assistance,” not a proctoring guarantee. Do not add surveillance or clipboard restrictions.

### 8.5 Next-question algorithm

Implement this as a pure, unit-tested service with deterministic tie-breaking:

```text
Given learner state, focus skill/path, latest evidence, and published catalogue:
1. Resume the current unfinished challenge when appropriate.
2. Classify the evidence using judge results and recorded assistance.
3. Set requested mode: next_step, same_step_checkpoint, remediation, or review.
4. Filter to published/validated problems in the requested scope and language.
5. Check actual prerequisites and exclude unsuitable solution-exposed repeats.
6. Prefer unseen problems with the intended step and a small skill-change distance.
7. Rank by prerequisite fit, skill coverage, transition quality, and exposure history.
8. Break ties by a stable catalogue ordering/ID.
9. Persist the recommendation, rationale, rule version, and considered constraints.
10. Return the next action with a plain-language explanation.
```

An independent success requests `current_step + 1`, not an arbitrary jump. If no eligible next-step candidate exists, return an explicit consolidation/path-completion result. Never disguise a same-level problem as harder or generate an unvalidated problem to hide a coverage gap.

Manual topic/problem selection remains available. Explain recommended prerequisites but do not impose nonsensical roadmap locks. Record manual selection so the learning engine can interpret resulting evidence correctly.

### 8.6 Review and retention

Provide a review queue with an initially simple, versioned scheduling heuristic, for example 1, 3, 7, 14, and 30 days after successful review. Treat those intervals as an implementation default, not a guaranteed optimal learning schedule.

Review must be clearly labelled. After an independent solve, keep the next harder new question readily available; do not silently replace it with a much easier review. Show due reviews as a distinct next-action option and dashboard section.

Use stored timezone/local-date settings for display and scheduling. A missed day does not destroy progress. Optional “explain your approach” prompts can strengthen evidence, but do not force an AI-marked essay before every advancement.

### 8.7 Required learning-engine tests

Test independent advancement, assisted same-step selection, solution exposure across languages, self-corrected compiler errors, infrastructure failures, repeated submissions, manual selection, unknown prerequisites, exhausted ladders, review scheduling, timezone boundaries, and deterministic replay.

Use fixed fixtures and clocks. A stochastic model must not decide whether these tests pass.

---

## 9. DeepSeek tutor: teaching behavior and integration

### 9.1 Runtime boundary

All application AI inference goes from browser to the CodeWise2 backend to DeepSeek. The frontend must not call DeepSeek directly or receive a saved API key. Codex development workers using GPT-6.1 Sol are a separate development concern and must not become an additional application inference provider.

DeepSeek's official API documentation describes its base endpoint, available model names, and response formats [R5]. Its model-list endpoint can supply current model/capability information [R6]. Verify live compatibility when implementing; do not assume that every provider accepts OpenAI-specific parameter names or effort values.

The exact Codex `medium` requirement does **not** automatically apply to DeepSeek's runtime reasoning settings. Offer only capabilities actually supported by the selected DeepSeek model.

### 9.2 Tutor actions

Support **Give me a hint**, **Explain this error**, **Explain more simply**, **Walk through an example**, **Teach me the full solution**, **Explain time and space complexity**, and contextual follow-up questions.

On a failed Submit, immediately show accurate judge feedback and a compact teaching entry point. Offer the first explanation in context, not as a separate generic chatbot. The learner can enable automatic short AI explanations in Settings after consenting to usage; default to asking before a potentially billable or algorithm-revealing explanation. A failure must never trigger an unsolicited full solution.

The distinction protects the learner's ability to fix a mistake independently. Teaching begins as soon as requested; do not force repeated guessing or artificial hint delays when the learner asks for the full explanation.

### 9.3 Teaching style

Use simple English and complete sentences. Keep essential technical terms, but define unfamiliar terms when first used. Use short paragraphs and a small concrete example before abstract notation. Explain the learner's actual mistake rather than dumping a textbook chapter.

Match the selected programming language. Explain what the algorithm does, why it works, the relevant invariant/recurrence, and why its complexity follows. Avoid condescending wording, excessive praise, filler, unexplained acronyms, and long unstructured prose.

An appropriate short explanation would say:

> Your code counts another copy of the largest value as the second-largest. Here, “distinct” means different. In `[8, 8, 5]`, the second-largest distinct value is `5`. We need to keep track of a second value that is different from the largest.

This is a teaching example, not a requirement to use the same problem in the bank.

### 9.4 Context passed to the model

Provide only the relevant approved information: problem/version, statement and constraints, visible examples, selected language, immutable code snapshot, bounded compiler output, approved judge diagnostics, recent relevant tutor messages, known skill evidence, requested help level, and suitable verified reference material for that help level.

Do not send the entire repository, full conversation archive, full hidden suite, arbitrary local files, settings secrets, or another unrelated question's data. Source code/comments and imported content are untrusted data, not instructions.

The tutor has no direct ability to write progress records, run shell commands, alter tests, publish questions, change settings, or decide acceptance. Any suggested next exercise must resolve to a valid catalogue ID and pass deterministic selection checks.

### 9.5 Evidence and honesty

Explain observed facts as observed facts. Clearly label possible diagnoses when the available evidence is insufficient. Do not claim that generated code was tested unless it was actually executed against identified tests.

When useful, validate proposed solution code through the same isolated runner and attach a truthful verification status. Validation failures must remain visible to the application, not be hidden by confident wording.

Passing the test suite means accepted under that suite and constraints, not a formal proof for every possible input. Do not invent documentation citations, links, benchmark results, or claims about the learner's ability.

### 9.6 Response formats

Prefer streaming Markdown for ordinary tutoring, with deterministic parsing into a typed presentation document. This allows immediate readable output without exposing a JSON blob to the learner.

Use schema-validated structured responses only where required, such as bounded explanation assessments or candidate metadata. DeepSeek documents JSON output, including operational caveats [R12]; parse and validate it server-side, handle empty/truncated responses, and never equate syntactically valid JSON with correct content.

Do not make an additional paid AI call merely to reformat an already adequate answer. Use the application's renderer and deterministic formatting pipeline.

### 9.7 Usage and failure behavior

Add configurable output-length limits, request/token budgets, bounded retries, cancellation, timeouts, and one active tutor generation per thread. Basic navigation, saving, selecting the next question, judging code, loading history, and calculating progress must not require inference.

Track usage returned by the provider. Display estimated costs only with a documented pricing snapshot; distinguish estimates from billed totals. A local budget controls requests made by CodeWise2, not the entire DeepSeek account or other applications using the same key.

Retries after uncertain provider acceptance can incur duplicate charges. Do not endlessly retry or automatically restart an interrupted generation. Explain the state and request explicit retry when appropriate.

Use a deterministic development-only provider fixture for automated tests, clearly labelled as a fixture. Never present mocked responses as live DeepSeek results in the released app. Live smoke testing can be completed from Settings once the user supplies a key.

---

## 10. Save every AI output: durable Learning Library

This is a core feature, not an optional enhancement. An attractive chat window whose answers disappear on refresh does not meet the specification.

### 10.1 What must be saved automatically

Save every learner-facing AI hint, explanation, walkthrough, complexity discussion, code suggestion, follow-up answer, clarification, and generated teaching artifact. Saving must not depend on pressing a bookmark button.

Store the user message/request and its output together with:

| Field group | Required information |
|---|---|
| Identity | Thread ID, message ID, generation/job ID, sequence/version, parent message. |
| Association | Problem ID/version, topic/skill links, selected language, attempt/submission ID when applicable. |
| Context snapshot | The relevant code snapshot or immutable reference, requested help level, source-result snapshot/hash. |
| Content | Complete user-facing Markdown/text and a versioned parsed presentation document. |
| Lifecycle | Queued/streaming/complete/interrupted/canceled/failed status, timestamps, finish reason. |
| Model metadata | Provider/model, applicable runtime settings, prompt-template version. |
| Usage | Reported token usage, available estimates, and explicit unknown values when unavailable. |
| Organization | Title, bookmarks, learner notes, tags, archive/deletion state. |
| Integrity | Content hash, schema version, renderer version, associated assistance evidence. |

“Complete output” means the answer intended for the user, not private provider reasoning, hidden chain-of-thought, authentication headers, or transport internals. Never expose or retain raw private reasoning as a study-note feature.

### 10.2 Persistence and streaming

Use the backend database as the durable source of truth. Browser state/localStorage alone is not sufficient.

Create the generation record before contacting DeepSeek. Persist visible response chunks in bounded batches before broadcasting them to the UI. Use monotonic event sequence numbers so reconnecting clients can resume from the last saved event without duplicating text or starting a second paid request.

A refresh or navigation away must not erase the answer. On server restart, recover completed records and mark unfinished generations honestly as interrupted. Preserve saved partial text with an **Interrupted — partial answer saved** label and an explicit retry/continue action.

Make completion, final content, usage metadata, and final status updates transactionally consistent. Do not show **Saved** until durable persistence has succeeded. If saving fails, show the problem and offer copying the visible answer instead of pretending it is safe.

### 10.3 Reopen without regeneration

Reopening a lesson, expanding a code block, switching themes, searching history, or returning to a prior question must load stored data and incur **zero new inference calls**.

Regenerate and Explain differently are explicit new generation actions. Keep the prior version; do not silently replace it. Allow comparing or navigating versions without cluttering the normal reading view.

Conversation summarization for context limits may create a separate derived summary. It must not overwrite or delete the original saved messages. Only send relevant history on the next request.

### 10.4 Library experience

Provide a first-class **Learning Library** page, not an obscure log viewer. Include full-text search and filters for question, topic, language, date, output type, bookmarked status, and completion status.

Search both user-facing prose and code in stored outputs. Results show a useful title, short matching excerpt, associated question, date, and language. Open the saved lesson at the relevant section and provide a link back to the original problem/attempt.

All outputs are saved by default. **Bookmark** means “pin for easy access,” not “finally save this message.” Include **Copy answer**, **Copy code**, **Export Markdown**, **Export JSON**, **Continue conversation**, and **Return to problem** where appropriate.

### 10.5 Edits, deletion, and backups

Keep original AI responses immutable; learner annotations are separate editable notes. Regeneration produces another version. A corrected explanation can be marked superseding an earlier one without falsifying history.

Support deleting an individual conversation/lesson with clear confirmation and a full-history reset with stronger confirmation. Deleting content must not silently convert an assisted success into an independent one. Explain that minimal assistance/progress events remain unless the learner explicitly resets progress too.

Provide export and restore for learning data, saved outputs, notes, progress, and settings that are safe to export. Exclude the DeepSeek key and encryption material from ordinary exports by default. Validate import schemas and sizes, preview what will change, and make restoration transactional.

Store data in a stable app-data location outside disposable build directories. Migrations and application updates must preserve existing lessons. Provide a documented backup procedure and a tested backup/restore round trip.

---

## 11. Visual design: beautiful and professional

### 11.1 Design direction

Build a focused premium learning workspace, not a generic admin dashboard or a flashy landing page. Use an original CodeWise2 identity with a restrained wordmark, consistent iconography, refined surfaces, and excellent typography.

The product should feel cohesive across Home, roadmap, editor, tutor, library, progress, and Settings. The design quality of error states and saved lessons is as important as the dashboard.

Use a restrained blue/indigo primary accent, neutral layered surfaces, and separate accessible success/warning/error roles. Avoid neon gradients across large surfaces, excessive glass effects, decorative charts, rainbow badges, oversized empty cards, and arbitrary mixed corner radii.

These visual choices are a default direction. The frontend worker may refine the palette and exact values while preserving the professional, readable result.

### 11.2 Design-system requirements

Create reusable tokens for color, typography, spacing, border, radius, elevation, motion, and z-index. Use a consistent four/eight-pixel spacing rhythm, subtle borders, modest corner radii, and shadows only where they clarify layering.

Use a clean interface font and a distinct readable monospace font for code, with correct licenses and local/offline-ready assets or system fallbacks. Font files are application dependencies, not a separate deliverable to the user.

Suggested starting dimensions: 15–16 px interface text, 16–18 px lesson text, approximately 1.6–1.75 lesson line height, 14–16 px code, and 60–80 characters of prose per line. Adjust responsively and test real long content.

No important text should depend on very low contrast. Dark mode is not simply black backgrounds with gray text; use distinct surfaces and readable semantic colors. Light mode must be independently designed and tested.

### 11.3 Desktop layout

Use a compact collapsible sidebar and a restrained top bar. Home may use a centred content width; the coding workspace should use the available width with resizable panels.

The main visual hierarchy should be obvious: current task, primary action, supporting explanation, then secondary metadata. Give **Continue learning**, **Run**, **Submit**, and the immediate next learning action clear prominence in their respective contexts.

Use a dense-enough workspace for coding without making the rest of the application cramped. Avoid forcing three narrow columns onto laptop screens where two panes plus a drawer are clearer.

### 11.4 Responsive behavior

At wide desktop widths, allow problem, code, and optional tutor panes. At ordinary laptop widths, use problem/editor split with a collapsible tutor drawer or tab. At tablet and phone widths, use explicit Problem / Code / Results / Tutor tabs and an easy-to-reach action bar.

All screens must remain usable around 390 px, 768 px, 1366 px, and 1920 px widths. Coding on a phone may be less comfortable, but navigation, lessons, history, settings, and code viewing must not break.

Use horizontal scrolling only inside genuinely wide code blocks, tables, or the roadmap—not on the entire page.

### 11.5 Interaction and accessibility

Provide visible keyboard focus, accessible labels, correctly associated errors, semantic headings, usable tab order, and meaningful text for icons. Do not communicate state through color alone.

Keyboard-operable splitters, dialogs, dropdowns, command search, and the roadmap/list view must be tested. Avoid focus traps and accidental submission keyboard shortcuts while typing in unrelated fields.

Use modest motion, typically short state transitions. Respect reduced-motion preferences. No fake typing delays, distracting celebration loops, or compulsory sound.

Define loading, empty, error, disabled, offline, reconnecting, and success states for every major feature. Skeletons should resemble the incoming layout. Errors should explain recovery, not merely display “Something went wrong.”

### 11.6 Visual acceptance

The design worker must implement, run, inspect, and refine actual pages in a browser. Capture desktop/mobile and dark/light screenshots with realistic long content. A component library's default styles or a screenshot of a mockup do not establish that the app is finished.

At minimum inspect Home, roadmap, coding workspace with results, full tutor lesson, Learning Library, and Settings. Fix clipping, poor line lengths, low contrast, unstable layout, blank states, and overflow before release.

---

## 12. AI text must be attractive, not a raw chat dump

### 12.1 One reusable lesson renderer

Use a consistent safe renderer for live answers, saved answers, full-screen lessons, search previews, and exports. Persist semantic content independently of the current theme so a saved answer looks correct after a theme or renderer update.

Support properly spaced headings, paragraphs, ordered steps, nested lists where genuinely useful, inline code, fenced code, small tables, blockquotes/callouts, links, and mathematical complexity notation. Do not expose literal Markdown markers when a supported construct should render.

Use syntax highlighting appropriate to Java, C++, Python, JSON, and plain text. Code blocks need a language label, copy control, stable monospace spacing, overflow handling, and optional expansion for long examples. The complete code must remain stored even when collapsed.

### 12.2 Semantic lesson structure

A full solution lesson should normally have:

1. **The key idea** — a short plain-English explanation.
2. **Why your attempt failed**, when relevant — tied to observed evidence.
3. **Walk through a small example** — a trace or short table.
4. **Build the approach** — explain the logic in manageable steps.
5. **Code in the selected language** — only at the requested assistance level.
6. **Time and space complexity** — notation plus what the variables mean.
7. **What to try next** — one specific validated practice action.

Short hints must remain short; do not force seven empty sections into every answer. A follow-up clarification should answer the question rather than repeat the entire lesson.

Use restrained callouts for **Key idea**, **Common mistake**, and **Next step**. Avoid turning every paragraph into a card or highlighting half the page. Emphasis should be selective.

### 12.3 Rendering details

Format `O(n)`, `O(n log n)`, subscripts, and simple formulas legibly. Use a safe mathematics renderer when necessary, with trusted-input features disabled. Keep prose widths comfortable and table headers distinct. Large trace tables should have controlled scrolling and meaningful labels.

On long lessons, offer section navigation and a distraction-free reading view. Keep regenerate/copy/export metadata visually secondary to the explanation itself.

Do not force auto-scroll when the learner has scrolled upward. Show a **New response below** affordance instead. Streaming should not repeatedly reflow the entire page or flash raw partial JSON.

### 12.4 Rendering security

Treat model text and imported Markdown as untrusted. Disable raw HTML or sanitize it with an allowlist. Reject script URLs, event handlers, iframes, executable embeds, and arbitrary style injection. Do not evaluate AI-supplied JavaScript, JSX, or templates.

Avoid remote image loading in AI responses by default. Render any diagrams using reviewed components and validated data, not executable model-produced diagram scripts. Any external link must be safe to open and visually identifiable.

Keep parser/sanitizer/plugin ordering intentional and covered by tests. Test malicious Markdown, malformed fences, huge tables, incomplete streamed content, nested constructs, and long tokens. A pretty renderer must not become an execution surface.

### 12.5 Presentation document

A versioned internal shape may include:

```ts
type LessonDocument = {
  schemaVersion: number;
  title: string;
  markdown: string;
  sections: Array<{
    id: string;
    kind: "idea" | "diagnosis" | "walkthrough" | "approach" |
          "code" | "complexity" | "next-step" | "general";
    heading?: string;
    markdown: string;
  }>;
  language?: "java" | "cpp" | "python";
  verification: "not-run" | "checked-visible" | "checked-full" | "failed";
};
```

This is a proposed contract, not permission to trust arbitrary JSON. Use strict runtime validation. Verification metadata must come from application execution records, never from the model's self-report.

---

## 13. Required screens and controls

| Screen | Required capabilities |
|---|---|
| Welcome/onboarding | Language choice, optional assessment, beginner start, runner readiness, optional DeepSeek setup. |
| Home | Continue learning, current focus, next-step rationale, review queue summary, recent saved lessons, honest progress. |
| Roadmap | All 18 topics, connected overview, progress states, topic selection, accessible list alternative. |
| Topic detail | Skill breakdown, prerequisite guidance, question list, counts against quota, suggested next challenge. |
| Problem library | Search/filter by topic, skill, difficulty, completion, assistance, bookmarks, and language history. |
| Coding workspace | Statement, three examples, constraints, editor, Run, Submit, custom input, results, tutor, submission history. |
| Lesson reading view | Full formatted saved answer, context, versions, follow-up, copy/bookmark/export. |
| Learning Library | All saved AI outputs, full-text search, filters, pinned lessons, notes, return-to-problem actions. |
| Progress | Independent versus assisted completion, skill evidence, review status, language proficiency, recent activity. |
| Settings | DeepSeek key and model, appearance, editor, learning behavior, usage controls, storage/export, diagnostics. |
| Sources & Licenses | Content provenance, third-party attribution, app/runtime notices. |

### 13.1 Coding workspace details

The problem panel contains description, examples, constraints, and interface instructions. The code panel contains language/runtime selection, starter code, draft-save status, reset-with-confirmation, editor preferences, and Run/Submit controls.

Use Monaco or another professional editor that meets the requirements. Basic syntax completion is allowed; AI solution completion is off in independent practice. Do not add an unsolicited auto-solve button.

Autosave drafts with debouncing and show **Saving / Saved / Could not save**. Flush relevant changes before submitting. Use draft revisions to detect conflicts across tabs instead of silently overwriting newer work.

Run executes visible examples or bounded validated custom input. Submit executes the complete grading policy with hidden tests. Invalid custom input shows a schema/constraint error, not a misleading algorithm failure.

Results should show actionable expected/actual differences for visible/custom cases. For hidden failures, provide an approved diagnostic category and, when appropriate, a separate small diagnostic counterexample without dumping the full hidden suite. Clearly label any generated counterexample and validate it first.

Preserve bounded output, runtime details, code snapshot, and result history. Show what the measurements include. Do not label overall queue time as the program's algorithm runtime.

### 13.2 Progress presentation

Show actual completed counts and separate independently solved versus assisted questions. Skill status should reveal supporting attempts and last review rather than an unexplained “mastery score.”

An optional activity calendar may summarize real practice events; do not insert sample activity into the user's actual history or use guilt-based streak messaging. Empty states should be useful and truthful.

---

## 14. Localhost Settings and DeepSeek-key entry

### 14.1 Required user journey

The learner opens **Settings → AI & DeepSeek**, pastes a key into a password-style field, tests the connection, saves it, selects a supported model, and returns to practice. No terminal editing or environment-file editing is required.

Include **Show/hide** for the currently entered value, **Test connection**, **Save key**, **Replace key**, and **Remove key**. Show clear configured/unconfigured/invalid/unreachable status, last successful check time, and a safe masked identifier after saving.

Once saved, do not fetch the full key back to the browser to fill the input. Show a placeholder such as **A key is saved on this device** and let replacement use a new empty input.

Explain that the key is saved on this device and used by the backend to contact DeepSeek. Explain which problem/code/messages are sent for tutoring and that ordinary saved-history viewing does not contact DeepSeek.

### 14.2 Test and save behavior

Validate keys by an appropriate provider endpoint such as model listing when available. Distinguish invalid credentials, network failures, rate limits, account/model access issues, and successful connectivity. Do not claim model generation is proven merely because listing models worked.

Offer a separate small **Test tutor response** action when needed, clearly indicating that it can consume API usage. Do not generate a large lesson merely to test the key.

Allow saving while temporarily offline, but label the state **Saved, not yet verified**. Failed validation must not overwrite a previously working saved key without the learner intentionally choosing replacement.

After a successful save, the backend must use the new key without a manual application restart. Removing a key stops its use for new requests; explain the handling of any active request.

### 14.3 Secret storage

Use an operating-system credential store when supported. Otherwise, use authenticated encryption with a randomly generated local master key stored separately with restrictive permissions. Never hardcode the encryption key or derive it from a public constant.

Document platform-specific storage and limitations. Encrypting a secret while storing the decryption material on the same compromised machine does not protect against an attacker who controls that account or machine. Do not advertise absolute security. Follow established secret-management practices [R11].

The key necessarily exists briefly in the password field and the save/test request during entry. Minimize that exposure, clear the field after completion, and do not place it in browser persistence, URLs, telemetry, logs, error messages, exported archives, or frontend bundles.

Restrict secret endpoints to the local authorized session, enforce origin/CSRF protections, redact request bodies/headers, and validate fixed provider destinations. Never allow an arbitrary model-supplied URL to receive the credential.

### 14.4 Other Settings sections

**Appearance:** dark/light/system theme, comfortable text size, reduced motion.

**Editor:** default language, font size, tab width, key bindings where supported, autosave status.

**Learning:** assessment restart, focus topic, review preferences, automatic short-explanation preference, default hint depth.

**Usage:** model selection from verified capabilities, response-length controls, local request/token/spend caps, current recorded usage and estimation caveats.

**Data:** storage location, export learning data, backup/restore, clear selected history, reset progress with confirmation.

**Diagnostics:** app version, runner health, installed language versions, platform/architecture, database health, sanitized diagnostics export. Diagnostics must not reveal the saved key or full private tutoring history.


## 15. Implementation architecture and durable storage

### 15.1 Recommended default stack

Use React + TypeScript with a modern build tool, a professional embedded code editor, Node.js + TypeScript for the backend, SQLite for local persistence, and the isolated runner described earlier. Use a maintained component foundation, but implement the CodeWise2 design system rather than shipping unmodified defaults.

A practical starting combination is Vite, React Router, TanStack Query, an accessible headless component layer, a token-based styling system, Monaco, Express, a typed SQLite data layer, and a schema validator. These are implementation choices, not instructions to install obsolete or incompatible versions.

Verify current official documentation, select mutually compatible supported versions, pin them in a lockfile, and record the chosen Node/runtime requirements. Check native SQLite-driver compatibility with the detected operating system and architecture. Do not accidentally force an unsupported x86-only package onto an ARM machine.

Use a simple modular application rather than unnecessary microservices. A SQLite-backed job queue can serve the application's single-user needs; do not add remote queues or cloud databases. A selected self-hosted judge may have its own local dependencies, which must be documented and isolated.

### 15.2 Service boundaries

```text
Local browser
  └── CodeWise2 frontend and same-origin API
       ├── Local durable database and approved content store
       ├── Deterministic learning engine
       ├── Tutor service ── HTTPS ── DeepSeek
       └── Judge adapter ── private local connection ── isolated runner
```

The frontend receives public problem data, safe results, progress, and user-facing saved lessons. It does not receive secret records, hidden suites, expected hidden outputs, or runner administration credentials.

The runner receives bounded execution requests. It cannot access the application database, secret store, or network on behalf of submitted programs. The tutor service receives only explicitly prepared context, never direct filesystem or runner-control access.

### 15.3 Database entities

Implement at least these concepts, combining tables only where doing so preserves the distinctions:

| Entity | Purpose |
|---|---|
| Learner/profile | Local identity, preferences, language defaults, timezone. |
| Topic/skill/path | Curriculum relationships, prerequisites, local difficulty steps. |
| Problem/version | Public metadata and references to versioned private packs. |
| Language implementation | Starter/wrapper/runtime/reference metadata per problem. |
| Draft/revision | Editable source per problem/language with conflict detection. |
| Submission/result | Immutable code snapshot, judge job, outcome, limits, safe diagnostics. |
| Assistance event | Recorded in-app hints, walkthroughs, and solution exposure. |
| Skill evidence/state | Auditable independent/assisted/review evidence and derived working state. |
| Recommendation | Selected next question/mode, rationale, rule and catalogue versions. |
| Review item | Due schedule, interval step, and review results. |
| Tutor thread/message | Saved learner prompts and complete user-facing model outputs. |
| Generation/event | Durable job lifecycle, replayable chunks, model metadata, usage. |
| Bookmark/note | User annotations and pinned problems/lessons. |
| Settings/secret metadata | Non-secret preferences and masked credential metadata. |
| Source/license/audit | Provenance, content publication gates, validation evidence. |

Store secret material separately from ordinary settings. Use foreign keys, appropriate indexes, migrations, transaction boundaries, and stable IDs. Enable and test a suitable SQLite concurrency strategy; serialize conflicting writes rather than relying on accidental behavior.

Use immutable references/hashes for historical content versions. A changed statement, suite, or code draft must not rewrite what an older submission or lesson originally referred to.

### 15.4 Data lifecycle

Initialize an empty learner profile and the published problem catalogue without fake progress. Seeding must be idempotent and must not erase learning history. Never run destructive reset logic automatically on normal startup or upgrade.

Keep durable data outside `dist`, temporary directories, and replaceable source-tree build outputs. Document its path and provide a supported relocation/backup procedure.

Make application jobs idempotent. Double-clicking Submit or retrying a request with the same idempotency key must not double-count progress or create duplicate work. Use leases/heartbeats where needed and recover stale jobs without falsifying successful completion.

---

## 16. API and state contracts

Define and validate a versioned API contract before frontend/backend workers diverge. Use explicit public response shapes and consistent safe error objects, for example `{ code, message, recoveryAction, requestId }`.

A suitable route inventory:

| Area | Operations |
|---|---|
| Bootstrap/health | App readiness, local session bootstrap, runner readiness, safe runtime information. |
| Catalogue | List topics/problems, problem details, visible examples, starters, sources. |
| Drafts | Get/save a revision per problem/language, detect conflict, reset explicitly. |
| Execution | Create Run/Submit job, poll/subscribe, cancel, fetch safe result/history. |
| Learning | Get next recommendation, rationale, skill state, review queue, record review. |
| Tutor | Create thread/request, stream saved events, cancel, explicitly regenerate, read messages. |
| Library | Search/filter messages, bookmark, annotate, export, delete with confirmation. |
| Settings | Read safe settings, write preferences, test/save/delete key without returning it. |
| Data | Export backup, validate import, preview/confirm restore, reset selected data. |

Do not expose a generic “update mastery” endpoint that trusts a browser-provided score. Progress changes derive from server-owned evidence. Do not expose generic filesystem reads, arbitrary URL fetches, command execution, or direct runner pass-through endpoints.

### 16.1 Streaming and reconnect behavior

Use server-sent events or an equivalently simple transport. Assign persistent event IDs. A subscriber reconnecting with its last seen ID must resume saved events without another generation request.

Bound event retention and payload sizes while preserving the final complete saved answer. Avoid storing every token as a separate permanent row if coalesced chunks and final content provide the same recovery guarantee.

Keep job state independent from whether a browser tab is currently open. On application shutdown/restart, reconcile unfinished jobs explicitly. Do not silently charge for an automatic replacement request.

### 16.2 Safe custom-input and result handling

Validate custom inputs against the problem schema/constraints before execution. Limit code, input, output, and message sizes. Treat stdout/stderr as text, not HTML. Prevent huge outputs or unexpected structures from freezing the UI.

Public result payloads must omit private suite material. Serialize large numbers losslessly. Keep output-order and tolerance rules identical between frontend explanations and backend grading.

---

## 17. Local security, privacy, and graceful failure

### 17.1 Localhost is not an authentication strategy by itself

Bind application listeners to loopback by default and restrict accepted Host/Origin values. Use a locally bootstrapped session, suitable cookie protections, CSRF checks, strict CORS, validated content types, and rate limits for sensitive endpoints. Prevent cross-site requests and DNS-rebinding-style access from mutating Settings or initiating costly work.

Do not expose the app on `0.0.0.0` or the local network as an unnoticed convenience. Public/LAN deployment and multi-user authorization are outside this version's default scope.

A threat model must cover malicious websites targeting localhost, hostile submitted code, malicious Markdown, accidental secret logging, poisoned imported content, oversized payloads, and unsafe backup archives. It need not pretend to defeat an administrator who controls the machine.

### 17.2 Privacy requirements

No external analytics, advertising scripts, remote fonts required at runtime, or automatic code uploads to another service. Outbound tutor traffic goes only to the configured official DeepSeek destination. Build-time dependency downloads and explicit source imports are separate and documented.

Show the learner what categories of data tutoring sends. Saved explanations and source code remain local unless explicitly exported or sent as relevant tutoring context. Logs should contain request IDs and operational metadata rather than full private conversations by default.

Strip secrets from errors and diagnostics. Exclude local databases, keys, exports, and user code history from version control and public build artifacts.

### 17.3 Expected degraded states

| Condition | Required behavior |
|---|---|
| No DeepSeek key | Code practice works; tutor explains how to configure it. |
| DeepSeek unavailable | Preserve the request/history, show retry options, keep ordinary practice usable. |
| Invalid key or model access | Clear actionable Settings guidance; no endless retries. |
| Runner unavailable | Editing/reading/history remain usable; Run/Submit explain setup rather than faking a result. |
| Application restart | Restore drafts, progress, saved outputs, and truthful interrupted-job states. |
| Database write failure | Report unsaved data and protect existing records; never claim success. |
| Budget limit reached | Stop new AI requests, retain history and non-AI features. |
| Unsupported CPU/OS runner | Explain the actual limitation and supported setup path; never execute unsandboxed code instead. |
| Malformed model response | Preserve safe user-facing text when possible, label failure/partial status, do not change mastery. |

### 17.4 Destructive actions

Resetting drafts, deleting lessons, removing credentials, restoring backups, and clearing progress need context-appropriate confirmation. Do not bundle unrelated destructive actions into one button. Clarify exactly what remains afterward.

Backup import must validate paths, record counts, sizes, schemas, and references. Never execute scripts from an archive or allow path traversal. Back up existing data before a confirmed replacement restore.

---

## 18. Automated validation and browser testing

### 18.1 Test layers

Implement unit tests for pure learning rules, checkers, schemas, formatting transforms, and budget logic. Add integration tests for persistence, API contracts, key lifecycle, job idempotency, and migrations. Add real-runner tests for Java/C++/Python and end-to-end browser tests for complete learner journeys.

Use development-only fixtures for DeepSeek failures/streaming and a clear live smoke-test path. Mark skipped live-provider or unsupported-platform tests honestly. A test skipped because credentials are absent is not evidence that the live provider was tested.

### 18.2 Required end-to-end scenarios

- A fresh install starts with no key, no fake progress, and exactly 300 published problems.
- All three languages load usable starters and execute real accepted and incorrect submissions.
- An independent solve produces the next-step recommendation and persists after restart.
- A hint-assisted solve produces a same-step independent checkpoint.
- A compiler typo corrected without teaching does not become conceptual failure.
- A full solution viewed in one language records assistance across the same problem's other language views.
- A key entered through localhost Settings is saved, masked, tested, replaced, removed, and never returned by a read endpoint.
- A streamed answer appears attractively, saves automatically, survives refresh/restart, and reopens without an API call.
- A canceled or interrupted answer preserves its saved partial output and truthful status.
- Reconnecting or double-clicking does not duplicate generation, submission, or mastery updates.
- Library search finds text/code, bookmarks do not control whether data is saved, and exports preserve complete answers.
- Backup/restore preserves drafts, progress, AI outputs, and associations while excluding secrets.
- Theme changes preserve readability and content across live/saved lessons.
- Malicious Markdown and oversized outputs are safely contained.
- Hidden tests, reference solutions, and credentials are absent from frontend bundles and public API payloads.
- Runner network/file-access/resource-limit canaries are contained without touching real secrets or unrelated files.

### 18.3 Curriculum audit command

Provide a machine-readable and human-readable audit covering:

```text
Expected primary-topic quotas versus actual published counts
Distinct problem count and near-duplicate review flags
Exactly three visible examples per problem
Hidden counts, unique-input counts, and exception evidence
Valid inputs and verified expected outputs
Three-language starter/wrapper/reference completeness
Reference pass results by problem/version/language/suite hash
Checker alternative-output and deliberately-wrong-output tests
Detected common-error/mutation cases
Difficulty/prerequisite/next-step/checkpoint coverage
Provenance, notices, and unresolved rights issues
Public/private bundle and API separation
```

The audit must fail nonzero for violated release requirements. It must not count a draft pack as published or treat a missing test log as a pass. Save exact validation commands and reproducible reports.

### 18.4 Visual QA

Capture real browser screenshots at representative phone, tablet, laptop, and wide-desktop sizes in both themes. Use realistic long statements, code, trace tables, partial AI answers, error messages, and saved histories.

Check overflow, readable contrast, spacing, focus states, dialog behavior, resizing, touch targets, keyboard use, and motion preferences. Do not accept a design solely because it compiles or a screenshot exists. Record findings and fixes.

---

## 19. Build sequence and parallel delivery milestones

### Milestone A — Inspect, configure, and establish contracts

Inspect the repository and preserve existing user work. Verify Codex worker settings, installed tooling, machine architecture, and sandbox availability. Establish contracts, tokens, schemas, task ownership, and the catalogue plan.

Run architecture, design-system, source-audit, and runner-feasibility work in parallel. Produce the initial decision log and task ledger.

### Milestone B — One complete vertical slice

Implement a small number of validated original/rights-cleared problems through all three languages, real judging, draft persistence, one-step progression, local key settings, tutoring fixtures/live adapter, and saved formatted lessons.

Use this to validate interfaces and UX, not to shrink the final scope. The same production pipeline must support the entire 300-question bank.

### Milestone C — Expand content and product breadth

Parallelize disjoint topic batches while other workers complete roadmap, library, progress, Settings, and robust job behavior. Integrate small audited content batches continuously.

Every batch must include real statements, exactly three visible cases, the hidden suite, all three language implementations, provenance, and learning metadata. Review batches before publication.

### Milestone D — Hardening and visual refinement

Run the complete bank audit, language validation, security tests, persistence/restart tests, and browser journeys. Keep workers on independent failure clusters and UI polish. Do not defer the whole validation workload to the very end.

### Milestone E — Release verification and handover

Run the clean-install path and final acceptance matrix. Produce runnable source, scripts, locked dependencies, approved content, documentation, notices, and actual test/visual evidence.

Stop only when requirements are met or a genuine capability/access blocker prevents further work. In the latter case, give an accurate partial status and recovery steps, not a fabricated complete release.

---

## 20. Required repository deliverables and commands

A suitable repository organization:

```text
apps/
  web/
  server/
packages/
  contracts/
  learning-engine/
  lesson-renderer/
  judge-adapter/
content/
  catalogue.json
  problems/
  sources/
  notices/
infra/
  runner/
scripts/
  setup.*
  start.*
  stop.*
  doctor.*
  audit-content.*
  validate-bank.*
  backup.*
tests/
  unit/
  integration/
  runner/
  e2e/
docs/
  architecture.md
  decisions/
  security.md
  data-storage.md
  content-pipeline.md
  testing.md
  release-evidence/
.codex/
  config.toml
  agents/
AGENTS.md
README.md
BUILD_STATUS.md
THIRD_PARTY_NOTICES.md
specs_CodeWise2.md
```

Equivalent organization is acceptable. Do not add empty directories and claim their names establish working components.

Provide documented commands/scripts for dependency setup, runner setup/start/stop, development, production build/start, health diagnostics, type checks, linting, unit/integration/end-to-end tests, full content audit, full bank validation, and backup/restore.

Provide Windows PowerShell-friendly launch/setup scripts and a shell equivalent where supported. Detect missing requirements and print specific recovery instructions. Do not silently install or reconfigure privileged system components.

After prerequisites are installed, launching the application should be a simple documented action that prints/opens the correct localhost address and preserves all user data. Changing the DeepSeek key must remain an in-app workflow.

The README must state what is installed, what runs locally, what requires internet, where data is stored, how to stop the app, how to back it up, and how to diagnose an unavailable runner. Document actually tested platforms separately from expected compatibility.

---

## 21. Definition of done: release acceptance matrix

Every row needs real evidence. A claim in a README is not a passing test.

| Gate | Pass condition |
|---|---|
| Agent workflow | Actual reusable parallel workers used with verified requested model/effort and Fast off, or an explicit unresolved access blocker. |
| Complete app | Real frontend/backend/runner integration, not a mock-only interface. |
| Catalogue | Exactly 300 distinct published problems and every section 3 quota matches. |
| Visible cases | Exactly 900 default visible cases: three per problem. |
| Hidden suites | Default minimum 200 distinct hidden cases per problem, all exceptions genuinely justified and audited. |
| Languages | All 300 problems have working Java/C++/Python starters, wrappers, and passing references. |
| Validation | Full-suite reference and checker audits passed with saved versioned evidence. |
| Adaptation | Independent next-step, assisted checkpoint, remediation, review, and exhausted-path behavior pass deterministic tests. |
| Key setup | User can configure DeepSeek entirely through localhost Settings, without editing files. |
| Tutor | Real DeepSeek adapter, appropriate teaching, tested failure handling, and accurate live-test status. |
| Saved AI | All user-facing outputs auto-save, survive restart, and reopen with no new inference. |
| Library | Search, filters, bookmarks, versions, follow-up, deletion, Markdown/JSON export, and context links work. |
| Output appearance | Live and saved lessons render prose/code/tables/complexity attractively and safely. |
| Visual quality | All main pages inspected and refined at required sizes and in dark/light themes. |
| Persistence | Drafts, progress, settings, lessons, migrations, and backup/restore tested. |
| Security | Local endpoint defenses, secret handling, renderer safety, and runner containment verified. |
| Resilience | No-key, offline-provider, unavailable-runner, interruption, duplicate request, and database-error states behave honestly. |
| Sources | Provenance and required notices present; no unresolved-rights assets counted as published. |
| Operation | Clean install and documented launch/stop/doctor workflows work on the tested platform. |
| Handover | Final status names what was built, test results, actual platform coverage, and any remaining blocker without exaggeration. |

### Explicitly unacceptable shortcuts

Do not ship 20 real questions plus 280 placeholders. Do not give each question three tests and label 200 unexecuted strings as a hidden suite. Do not count translated implementations or renamed duplicates as new problems.

Do not hardcode Accepted, mastery, timestamps, usage, or successful API-key validation. Do not run untrusted code on the host as a shortcut. Do not put the key in localStorage, a frontend environment variable, a query string, or a source-controlled file.

Do not store only the last AI message. Do not require the learner to bookmark an answer to preserve it. Do not regenerate stored answers on page load. Do not overwrite earlier answers when regenerating. Do not render raw Markdown/JSON blobs and call the output polished.

Do not silently remove content audits, reduce language coverage, abandon medium-effort Sol workers, or call a partially implemented app complete to fit a session limit.

---

## 22. Documentation references and verification notes

These are primary-source implementation references checked while preparing this specification. Product requirements and proposed defaults above are our own design decisions. Recheck changing APIs, model access, client configuration, dependencies, and source licenses during implementation. Preserve locked quotas even if the external curriculum later changes.

[R1]: https://learn.chatgpt.com/docs/agent-configuration/subagents
[R2]: https://learn.chatgpt.com/docs/config-file/config-reference
[R3]: https://developers.openai.com/api/docs/models/gpt-6.1-sol
[R4]: https://neetcode.io/practice/practice/neetcode150
[R5]: https://api-docs.deepseek.com/
[R6]: https://api-docs.deepseek.com/api/list-models/
[R7]: https://github.com/exercism/problem-specifications
[R8]: https://raw.githubusercontent.com/exercism/problem-specifications/main/LICENSE
[R9]: https://github.com/google-deepmind/code_contests
[R10]: https://ce.judge0.com/
[R11]: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
[R12]: https://api-docs.deepseek.com/guides/json_mode/
[R13]: https://learn.chatgpt.com/docs/agent-configuration/speed

| Reference | Use |
|---|---|
| [R1] | Codex subagent configuration and model/effort inheritance. |
| [R2] | Current configuration keys and client-level behavior. |
| [R3] | Exact GPT-6.1 Sol identifier and supported reasoning effort. |
| [R4] | Frozen baseline topic counts used to derive the 300-question allocation. |
| [R5] | DeepSeek API endpoint and integration behavior. |
| [R6] | Discovery of currently available DeepSeek models/capabilities. |
| [R7] | Exercism exercise descriptions, metadata, and optional canonical tests. |
| [R8] | Exercism repository license text; retain applicable notices. |
| [R9] | CodeContests data structure and third-party licensing caveats. |
| [R10] | Judge0 API capabilities and configurable execution limits. |
| [R11] | Secret storage, access, logging, and lifecycle guidance. |
| [R12] | DeepSeek JSON-output integration considerations. |
| [R13] | Codex speed controls; verify Fast mode is off. |

---

## 23. Final instruction to Codex

Read this entire file, inspect the actual workspace, establish the requested reusable Sol-medium worker pool, and build CodeWise2 through the release gates. Delegate substantive work, keep independent tasks moving in parallel, integrate and test continuously, and preserve evidence.

The finished experience must let the learner open localhost, enter a DeepSeek key in Settings, solve real DSA problems in Java/C++/Python, progress in manageable steps, receive clear teaching when needed, and revisit every saved AI explanation in a beautiful professional interface.

Do not return another plan in place of the application.
