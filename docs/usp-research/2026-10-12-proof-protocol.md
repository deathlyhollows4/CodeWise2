# Proof protocol for the proposed CodeWise2 service

Proposed on 2026-10-12; not executed. Primary management decisions and commercial thresholds are in [the recommendation](2026-10-12-recommendation.md). This document defines the evidence needed to make the outcome credible.

## Outcome and evidence levels

Outcome: a learner can choose, explain and implement an appropriate approach on a fresh problem without assistance under stated conditions, and can do so again later. Distinguish these levels:

1. **Recorded practice:** no in-app help recorded; local public-bank acceptance. Useful personal history, with outside-help and prior-exposure limitations.
2. **Declared fresh attempt:** learner reports no prior statement/solution exposure and no help during the attempt; a reviewed fresh form, frozen versions and time are recorded. Still self-report, not an anti-cheat guarantee.
3. **Observed assessment:** a facilitator observes the task, asks a short explanation and modification question, and records the declared allowed resources. Stronger condition evidence, still not perfect surveillance or proof of identity.
4. **Validated comparison:** a predeclared sufficiently powered evaluation with comparable practice time, independently matched tasks, blind scoring and a comparator supports a bounded efficacy claim for that sample and protocol.

CodeWise2 currently provides foundations for level1. None implies a placement guarantee, certified mastery, hiring reliability or an accredited credential. Private problem solving and observed interview communication are separate outcomes.

## Freshness and assessment design

Pilot scope: one or two concept families with four graded tasks per assessment and a fixed time budget, initially 60 minutes. Calibrate this budget/tasks in a separate dry run before enrollment; do not silently change it after seeing outcomes. Offer accessibility adjustments beforehand and record them. The protocol is assessment practice, not treatment for anxiety.

Prepare A/B/C forms for baseline, end of week4 and two weeks later, plus weekly practice/checkpoint forms. Each should sample comparable prerequisites, strategy choices and difficulty. Author or license content lawfully; independent reviewers check novelty, oracle/checker validity, ambiguity and language-specific friction. Freeze item, statement, harness, suite, language and rubric versions. Run genuine references and meaningful wrong-solution checks only through approved isolation in the later implementation task. Changed checkers/content/harnesses invalidate dependent execution receipts.

“Fresh” means no previous task/solution exposure for that learner. Holdout assessment forms must be excluded from instruction and tutoring retrieval. Changing only an array's numbers, story names or identifiers tests recollection of the same procedure more than transfer. Include at least two near-transfer tasks and two strategy-selection/change-of-constraint tasks; report them separately. Neither guarantees far transfer to real interviews. Public-bank tasks may be used for training, but their local help record cannot prove blindness. Rotate leaked forms and label any compromised results; secrecy alone is not a business moat.

Keep practice help available and nonpunitive. During the declared assessment, prohibit hints/AI/editorials if measuring unaided solving; define whether documentation, compiler feedback and visible Run tests are allowed. Full-suite Submit establishes acceptance. Freeze the first submitted assessment artifact for the outcome, while permitting subsequent learning attempts labeled as such. Distinguish first attempt, later within-window accepted solution and assisted correction; do not select each learner's best historical attempt as the test result.

Record outside-help/exposure declarations per task, language, allowed resources, form/version, start/end times, verdict and explanation rating. Do not collect browsing history or covert surveillance. New-source exposure outside the session is possible; show the limitation in every report. For optional observed rehearsal, use the same consented observation format at baseline and end, since interviewer presence can affect performance.

## Measures and pilot gates

Primary measure: **first-attempt accepted count out of four fresh tasks**, with complete correct full-suite execution and no recorded/declared disallowed help. Also report accepted within the full time window, time used, assistance/exposure exclusions and infrastructure/compile outcomes. Do not convert infrastructure failure into lack of skill. Rebook a technically invalid assessment using a reserved matched form under a prespecified rule.

Each task also receives a 0–10 rubric: correctness0–4, approach/invariant reasoning0–3, complexity justification0–2, edge-case reasoning0–1. Define anchors before the pilot; average across the four tasks, and keep acceptance separate so eloquent incorrect code cannot look like an independent solve. Give partial credit in the rubric, not an Accepted verdict. Two reviewers independently rate a subset of explanations, blinded to timepoint when possible; investigate disagreements larger than one point. Reviewer-calibration reliability is a prerequisite to using rubric changes publicly.

Exploratory improvement criterion for a learner: at least **one additional first-attempt accepted task out of four**, and an average rubric gain of at least **one point out of ten** from baseline. Target the non-ceiling segment; if baseline is already 4/4, offer a harder calibrated form or exclude that learner from this pilot segment before purchase. Do not redefine success after enrollment.

Main decision gates: ≥70% of all enrollees complete the final assessment; ≥60% of all enrollees meet improvement; ≥70% complete the delayed test. Calculate the median of each paired learner's delayed average rubric score divided by their final average rubric score; require≥80%. A zero final score has an undefined ratio and cannot count as passing retention; show excluded-zero and missing counts. Independently, require≥60% of all enrollees to retain at least their final fresh-accepted count minus one and remain at least one accepted task above baseline at the delayed test. Stable explanations alone cannot pass the independent-coding retention gate. With10 enrollees the completion/improvement gates mean at least7 final completions and6 improvements; with20 they mean14 and12. Show numerator, denominator, raw distribution and uncertainty, not only a percentage. Missing data is unknown skill and noncompletion; it is not silently discarded or labeled zero ability. Infrastructure incidents and authorized re-tests are visible.

Secondary measures: private confidence before each attempt (e.g. predicted chance of success0–100), calibration against acceptance, voluntary study consistency, time-to-next-action, explanation quality, observed mock performance and self-reported pressure. Increased confidence without better performance is not success. Assistance use is diagnostic; do not optimize for zero help at the cost of effective learning or frustrate novices into quitting.

Commercial measures are separate: full-price payment/refunds, first diagnostic access, weekly fresh-check participation, review/support minutes, contribution and optional next-block repurchase. A paid cohort tests demand for the whole service, not willingness to subscribe to a self-guided app. Report successful exits, pauses, deadline passed and dissatisfaction separately; never remove ineligible users quietly to inflate retention.

## From a pilot to a defensible claim

A small single-group pre/post pilot is susceptible to ordinary study gains, regression to the mean, parallel-form mismatch, selection, novelty, reviewer bias and attrition. It can disconfirm feasibility and guide iteration; it cannot prove CodeWise2 caused improvement or beats LeetCode/free AI. Publish descriptive outcomes only with explicit consent and full limits.

For an efficacy study, define the intervention and equal-time comparator (ordinary bank/editorial practice, with or without free AI clearly specified). Randomize participants where feasible, stratify by baseline/language, assess blinded with reviewed parallel forms, preregister one primary delayed outcome, report all assigned participants and analyze missingness. Estimate variability from pilots and obtain a power calculation before selecting sample size; no invented claim that 20 learners is statistically sufficient. A supervised no-help arm can measure unaided outcomes while supported study is measured separately.

Later superiority copy must state population, sample, comparator, duration, conditions, effect and uncertainty. Example structure only: “In [actual study], [actual participants] improved [actual fresh outcome] versus [comparator] after [duration].” Fill none of these with invented values. A learning study is not an employability-validation study. Employer-facing assessment would require separate role relevance, fairness, accommodations, identity/integrity and decision-utility work.

## Report and data handling

The learner report should show assessed skill family, task/form version, language, date, assistance/exposure status, testing conditions, first-attempt outcome, explanation feedback, delayed outcome and the next bounded practice action. Show “not assessed” where evidence is absent. Do not produce an overall mastery percentage or placement probability.

Keep participant identities, consent, recordings, raw exports/code and payment records outside this public repository and build outputs. Prefer pseudonymous minimal outcome metadata; raw recordings should not be required. Separate consent for parent/faculty sharing and for public case studies; institutional default is aggregate actionable results with small-group suppression where identification is plausible. Retention/deletion/export rules must be explicit before a pilot. Logs must not contain authorization headers, request bodies, secrets or provider reasoning. Research documents contain no participant data.
