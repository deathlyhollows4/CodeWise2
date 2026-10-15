# CodeWise2: new features to create a stronger paid product

12 October 2026. This supersedes the earlier positioning/cohort recommendation for product direction. The user clarified that “USP addition” means **new app capabilities**, not a tagline based on existing features. Research/planning only; none of the additions below was implemented, tested with learners or commercially validated.

## Build-first recommendation

**Build a Constraint-Change Lab, supported by a Counterexample Workbench and a learner-controlled record of recurring mistakes.** Keep explanation questions inside this activity rather than building a separate general chatbot. The proposed benefit is learning to adapt an approach when assumptions change, and identifying the specific reasoning that failed. It is a product hypothesis, not proven market uniqueness or learning efficacy.

The current app already chooses related checkpoints, records in-app assistance and schedules reviews. Those foundations are useful, but **selecting another existing question is different from preserving the student's code, changing the problem contract, eliciting a prediction, demonstrating the failure and testing an adaptation**. That new interaction is the proposed hero feature.

## 1. Constraint-Change Lab

**What the learner does:**

1. Open a completed solution or start a reviewed lab with a supplied working baseline.
2. See one explicit change to the task's assumptions or required output.
3. Predict whether the old approach remains correct and feasible; explain the assumption and propose a breaking input if it does not.
4. Run the preserved code against reviewed teaching cases for the changed contract.
5. Change the approach/code and submit against the new variant's validated suite.
6. Later attempt another unseen change, with the family labels and explanation hidden until after the attempt.

**Concrete example:** The task asks whether a pair sums to a target. The student's two-pointer solution works on a sorted array. Change to unsorted input: `[3, 2, 4]`, target6. The unchanged sorted-array method can discard4 after seeing3+4>6, then fail even though2+4=6. Ask why that discard was justified before but not now; let the learner choose sorting or hashing within the new task's explicit constraints. Then test a different case. A second change could ask for the count of all index pairs, where duplicate handling matters. Another change adds negative values while keeping the array sorted: the two-pointer argument still works. Include valid-unchanged cases so the learner cannot pass by always declaring failure.

**Other potential families:** nonnegative→signed values in a sum-window task; unweighted→positive-weight shortest paths; fixed data→updates; existence→count; offline→streaming. Each needs a precise new contract, feasible solution and independent review. A tighter constraint can make a task infeasible; do not manufacture a required solution to an impossible contract.

**New engineering/content:** versioned transformation packs, base/variant code snapshots, prediction and counterexample submissions, separate rubrics, variant-specific oracles/checkers, exposure records and delayed forms. Use reviewed transformations first. AI may help word an explanation but must not publish arbitrary generated tasks, expected answers or correctness claims.

**What competitors already cover:** VisuAlgo compares algorithms and supports custom inputs; Codewars supports code remixes/tests; Educative advertises coding follow-ups. The integrated learner-code prediction/adaptation workflow is the candidate differentiator, not algorithm comparison alone. [Official overlap research](2026-10-12-feature-competition.md).

## 2. Counterexample Workbench

**What the learner sees:** a safe reproducing input, the specification's expected result and their program's observed result. They first predict what will happen, explain the divergence, and repair the relevant decision. The workbench tries bounded input reductions while preserving validity and the failure. Label the result “smaller reproducing example” or “smallest found under these reductions,” not a globally minimal counterexample.

For reviewed algorithms, add an active state table: ask for the next pointer position, queue contents or accumulated value before revealing the verified next state. This should be an exercise, not only autoplay animation.

**MVP limit:** replay actual input/output from the student's isolated execution and display an authored, reviewed algorithm-state panel where available. Do not call the authored trace a trace of arbitrary learner code. Full step-by-step Python/Java/C++ learner-code instrumentation is a separate, substantially harder addition requiring language-specific execution and containment validation. Never guess the failing line from an output mismatch.

Use separately authored teaching cases, not disclosure of a private assessment suite. Input reduction requires a budget, such as at most20 isolated trials per requested replay, plus time/resource caps; this is a proposal to benchmark, not established runner capacity. A found counterexample proves a failure on that case. Lack of a found case does not prove correctness, and a limited sample cannot establish acceptance.

**Existing versus new:** ordinary judge verdicts and AI error explanations already exist. Reproducible learner-specific input reduction, prediction capture, validated state exercises and repair evidence are the additions.

**Competitive reality:** free [Python Tutor](https://pythontutor.com/) already visualizes program state, and [VisuAlgo](https://visualgo.net/en) provides visualization/quizzes. Therefore a generic visualizer is a weak paid headline. The hypothesis is that connecting the student's observed failure to a short adaptation/repair activity reduces assembly effort and improves useful practice.

## 3. Recurring-mistake record and repair drills

**What the app does:** retain a narrow, reviewable finding from an attempt—for example, “sorted-input reasoning reused on two tested unsorted tasks”—with links to the input, program outcome and learner explanation. Offer a small drill that distinguishes when that assumption is safe. After fresh successful checks, show that the previously observed mistake was not repeated under those conditions.

This adds **specific misconception evidence and targeted interventions**, beyond a topic-level skill history or review of the same question. Existing problem metadata's `commonMistakes` is an author list; it is not evidence that a particular learner has that misconception.

Start with a small authored taxonomy and deterministic exercise outcomes. A wrong submission alone cannot identify the conceptual cause: it may be a typo, bug, misunderstood output or infrastructure problem. Mark uncertain interpretations as hypotheses; let learners inspect, correct, dismiss and delete them. Deleting a diagnostic note must not rewrite immutable grading/assistance history. No personality judgments or mastery percentages.

**Return-value hypothesis:** learners revisit specific unresolved mistakes across different problems, and the app remembers evidence they otherwise assemble manually. Generic adaptive skill-gap planners already overlap with this category. Diagnosis precision and useful repair are the features to prove.

## 4. Code-specific explanation questions

After a solution, ask one or two bounded questions grounded in its code: “Why can this pointer move forward safely?”, “What input breaks this early return?” or “Why is the auxiliary space linear?” Require an answer before showing the authored rationale, then connect a weak claim to a case or repair exercise.

Use typed answers initially. AI explanation scores must be labeled, benchmarked against reviewed rubrics and correctable; they do not control judge acceptance. Matching prose length or fluency is not evidence of understanding. Optional voice would require separate transcription/provider/privacy work; the current sole-DeepSeek application-provider constraint does not authorize silently adding another inference provider.

This is a supporting feature: generic chat and commercial mock interviews already ask follow-ups. The proposed extra value is grounding each question in an actual program, validated behavior and its changed assumptions. Build it after reliable deterministic exercises, not as another broad AI conversation panel.

## Ranking and scope

The following judgments are hypotheses. Each score is1 weak to5 strong; cost5 means cheapest. Credibility means proximity to a testable, supportable promise, not established outcomes. Equal weights expose assumptions; small score differences are not measurement precision.

| New capability | Urgency | Difference | Measurable benefit | Credibility | Defensibility | Recurring value | Acquisition fit | Cost | App fit | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Constraint-change lab | 5 | 4 | 5 | 3 | 3 | 4 | 4 | 3 | 4 | 35 |
| Counterexample workbench | 5 | 3 | 5 | 3 | 3 | 4 | 4 | 2 | 4 | 33 |
| Mistake record + targeted drills | 4 | 3 | 4 | 2 | 3 | 5 | 3 | 3 | 4 | 31 |
| Code-specific explanation questions | 4 | 2 | 4 | 2 | 2 | 3 | 4 | 3 | 4 | 28 |
| Generic placement mock interviews | 5 | 2 | 4 | 2 | 2 | 3 | 4 | 2 | 3 | 27 |
| Generic animated algorithm library | 3 | 1 | 3 | 4 | 1 | 2 | 3 | 3 | 3 | 23 |

Make the first lab the product's visible new activity. Add bounded input/output replay as support, then verified mistake-specific drills. Explanation questions can initially use fixed reviewed prompts. Postpone universal code tracing, voice interviewing, all-topic transformation generation and institutional dashboards.

## Feasibility and recurring payment

Initial buyer hypothesis remains a student who knows basic syntax and familiar patterns but struggles with changed questions before software placements. A distinctive demo can show their old solution failing under a new contract and being repaired. This is a stronger acquisition demonstration than a generic chat response; whether it attracts paying learners remains unknown.

Test a **₹199–₹399 four-week feature pass** after one useful free lab: one supported language, two concepts, four reviewed transformation labs and up to twelve repair drills, with bounded explanation requests. This is a self-serve price experiment, distinct from the earlier coached-service pricing. No human learner-review service is included. QA, authoring, support, runner operations and provider use still cost money.

Why recur: a maintained supply of meaningful new transformations and diagnosis-driven exercises across a learner's continuing mistakes. The public clone can reproduce released code/content; a static one-time pack alone does not justify subscription. A competent self-hosting learner may prefer that route. Compare a fixed pack and four-week pass against recurring access; do not gate history/export behind renewal. Public visibility does not establish permissive software/content reuse rights.

Content economics must be measured. At20 buyers ×₹299, revenue is₹5980 before fees/tax/refunds. If a release needs12 authoring/QA hours at an assumed₹600/hour, content labour alone is₹7200: that small release loses money before operations. At100 buyers, the same shared content cost averages₹72/buyer; maintaining a USD5 provider budget per buyer would still be excessive for a low-priced pass unless unused allowances are bounded and costed. Do not import the earlier service-funded AI allowance automatically. BYOK keeps provider billing separate; deterministic labs can work without it. Scale, reusable reviewed content, actual consumption and support cost determine viability—not “AI is cheap.”

## Smallest validation and build order

Research has not authorized application implementation or sales. For a subsequent build, implement **two complete lab chains in one language**, with preservation of old code, one meaningful changed contract, prediction, reviewed cases, actual isolated outcomes, adaptation and a delayed fresh task. Start with a reliable learner-state exercise rather than universal debugger integration.

Author/review and execute all new content through the approved isolated runner before delivery. Every changed contract/checker/harness requires new validation identities and receipts. Do not touch live learner profiles while prototyping. Verify participant-platform access; only Windows ARM64/dedicated WSL has historical established local execution evidence. An accessible hosted judge would require its own security/operational validation.

Behavioral test hypothesis: among20 target learners completing a free lab, at least6 return within seven days and at least4 voluntarily purchase a genuinely deliverable next pack; fewer than2 purchases stops expansion. Record initial starters, dropouts and reasons too, rather than reporting only successful completers. This small convenience sample provides directional evidence, not a market estimate. Paid-variant content must be ready and refundable; no fake checkout or undeclared renewal.

Learning test: equal-time comparison against ordinary explanations/free-tool assembly; one-week-delayed unseen contract-change tasks. Score validity judgments, constructed counterexamples, adaptation correctness and time. Repeat with harder or unrelated changes to distinguish near-family success from broader transfer. Track false mistake labels and frustration. Improvement in lab completion alone is insufficient. [Primary learning evidence, including mixed/null findings](2026-10-12-feature-learning.md).

Proceed only if learners use and pay for repeated activities, new-task performance is promising, and actual delivery costs fit. If students value only explanations, redesign rather than claim a distinctive feature. If they buy a finite pack but do not return, offer packs rather than invent subscription demand. [Commercial analysis](2026-10-12-feature-commercial.md).

## Source inspection and limits

Current source baseline remains commit `a8b3db423a2d3bd4c70e2e84667b53a3ae60fa55`. Codebase-memory status/graph searches were attempted first; coverage generation `2026-10-12T17:20:46Z` returned metadata-changed for `apps/server/src/app.ts`, `tutor-context.ts`, learning-engine `index.ts` and `attempts.ts`. Direct source reads and scope searches supplied fallback. Existing tutor actions are hint/error/walkthrough/solution/complexity/simplify/follow-up; existing attempt normalization is a limited source heuristic. This is bounded inspection, not an exhaustive absence audit. Official competitors' advertised features were opened, not personally efficacy-tested. No proposed addition is a placement guarantee or established USP until tested.
