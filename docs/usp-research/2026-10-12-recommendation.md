# CodeWise2 USP decision — 12 October 2026

**Superseded for product direction:** the user clarified that USP addition means new app features. Use [the new-feature plan](2026-10-12-feature-additions.md). This earlier positioning/cohort analysis remains background research; its service prices are not prices for the self-serve feature package.

## Recommendation

**Test a paid service around fresh, unaided DSA solving before building a subscription platform.** The proposed promise is: **“Turn solutions you understand into new problems you can solve on your own.”** The mechanism is targeted practice, help that gradually recedes, a related unseen checkpoint, delayed retrieval, and feedback on the learner's reasoning. The proof is performance on fresh tasks under stated conditions, rather than problems completed, AI messages, streaks or a mastery percentage.

This is a **competitive positioning hypothesis**, not a proven unique capability or validated outcome. Add a small coached cohort as delivery, not a second sprawling product. Start with a four-week block; offer another block only when it addresses an actual remaining goal. A perpetual individual subscription is not yet justified. If students improve but do not repurchase, a finite preparation program can still be a good business.

Initial customer hypothesis: **adult third/final-year Indian students targeting software internships or placements in 6–12 weeks, comfortable with basic syntax, who can follow editorials but struggle to choose and implement an approach on a fresh task.** Student is the initial buyer/user; parent can fund with learner agreement. Begin with one reachable college club and one language chosen from demand, not all India or all learner levels. DSA is only one part of placement preparation; eligibility, aptitude, communication, projects and hiring conditions remain outside this promise.

No interviews, surveys, sales, learning experiments or provider calls were performed. This is desk research and a read-only source inspection. Findings, interpretation and proposals are separated below. All web research was accessed on 2026-10-12; unavailable prices remain unavailable.

## Why this need is plausible, and what is not established

**Facts:** Programming studies give mixed AI results: assistance can improve immediate authoring, and the learner's interaction strategy matters. One programming intervention asks learners to propose a step before revealing code. Retrieval, spacing and faded examples support testing a transition from supported learning to independent use. Evidence ranges from programming studies to mathematics/text learning; it does not validate CodeWise2 or an exact review schedule. See the primary-paper summaries and applicability limits in [learning research](2026-10-12-learning.md), including [programming engagement techniques](https://arxiv.org/abs/2410.08922).

**Facts:** A small randomized university interview study found performance differed between private and observed whiteboard conditions. A direct college DSA qualitative study identified abstraction and misconception difficulties. Neither provides a representative India prevalence estimate or proves that this product reduces anxiety. [Interview experiment](https://www.chrisparnin.me/pdf/stress_FSE_20.pdf); exact context and limits in the learning brief.

**Inference:** Resource abundance makes “more explanations” a weak purchase reason. The unresolved learner question is often whether apparent understanding survives a new task, time pressure and a later date. Specific observed evidence can calibrate confidence better than a generic encouragement score. Help-seeking must remain safe: receiving a hint is a learning event, not a moral failure.

**Hypotheses to interview:** resource overload, tutorial familiarity mistaken for transferable skill, missing prerequisites, inconsistent practice, forgetting between sessions and deadline anxiety. Ask about recent episodes before pitching. Do not describe these as measured characteristics of Indian students.

**Payment evidence limit:** NPTEL's historical assessment registrations and public Coursera/Udemy results demonstrate purchases in broader education categories. Their reputations, credentials, users and reported revenue cannot be transferred to an unknown DSA product. No direct CodeWise2 willingness-to-pay, subscriber retention or market size was established. The [buyer brief](2026-10-12-buyers-validation.md) distinguishes transactions, posted offers, hypothetical intent and anecdotes.

## Competitors and the practical alternative

AI tutoring, adaptive planning and revision already overlap with established products. LeetCode advertises Ask Leet; NeetCode has AI hints/debugging; Educative describes adaptive preparation; TUF combines a curriculum with planning/revision and AI. Do not claim that none assesses independence, uses spacing or adapts help: this was a bounded page review, not an exhaustive absence audit.

Observed official offers include [NeetCode Pro](https://neetcode.io/pro) at USD119/year or USD297 lifetime, and [TUF DSA Pass](https://takeuforward.org/pricing) at USD51/12 months on the accessed page. Promotions, regional checkout, taxes and duration controls matter. General LeetCode monthly/annual pricing did not render reliably; its [school-group page](https://leetcode.com/student/) advertises USD99 annually subject to conditions, not a one-time lifetime purchase. The [market brief](2026-10-12-market.md) records the remaining competitors, free mocks and extraction limitations. These prices are offered terms, not sales evidence or an INR willingness-to-pay anchor.

**Inference:** The strongest everyday substitute is a free sheet/video course + a free judge + free general AI + a notebook or friend. ChatGPT has a free plan, and peer/AI interview practice has free options. Generic assistants can be prompted to withhold answers and generate exercises; CodeWise2 must demonstrate that validated tasks, consistent sequencing and accountable feedback save effort or improve outcomes enough to pay for. A buyer need not abandon Striver, NeetCode or LeetCode to use a focused assessment/practice service.

## Ranking concrete directions

Scores are coordinator judgments, **not customer evidence**. Each criterion is 1 weak to 5 strong. Cost means affordability of delivery (5 cheapest); credibility means closeness to a supportable promise, not proven efficacy. Equal weighting makes assumptions visible; a one-point difference is not meaningful precision. Rankings should change after behavioral tests.

| Direction | Urgency | Differentiation | Measurable benefit | Credibility | Defensibility | Recurring value | Acquisition fit | Cost | Existing-app fit | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Fresh unaided solving, delayed checks and reasoning feedback | 5 | 4 | 5 | 3 | 3 | 4 | 4 | 3 | 5 | 36 |
| Small coached placement-practice cohort | 5 | 3 | 4 | 4 | 3 | 4 | 5 | 2 | 4 | 34 |
| Deadline plan and spaced revision alone | 4 | 2 | 3 | 4 | 2 | 3 | 4 | 5 | 5 | 32 |
| College diagnostic and teaching-action reports | 4 | 3 | 4 | 2 | 4 | 5 | 2 | 2 | 3 | 29 |
| Timed interviews with spoken feedback | 5 | 2 | 4 | 3 | 2 | 3 | 3 | 2 | 3 | 27 |
| Private local study workspace / easy setup | 2 | 3 | 2 | 4 | 2 | 2 | 2 | 3 | 5 | 25 |
| Bundled general AI explanations | 4 | 1 | 2 | 2 | 1 | 2 | 4 | 3 | 4 | 23 |

The first two are a promise and a way to deliver it. Planning/review is supporting infrastructure, not a sufficient paid headline. College reporting could produce genuine semester-to-semester recurrence, but procurement, trusted assessment, consent and device access make it a later buyer. Interview rehearsal is useful once private solving is established; it has strong substitutes and different evaluation requirements. Local privacy is supporting value with setup friction. Unlimited AI risks selling consumption instead of learning and has no strong differentiation.

## What exists versus what the promise requires

The current checkout was inspected at commit `a8b3db423a2d3bd4c70e2e84667b53a3ae60fa55`. Git status was clean at entry. Initial graph generation `2026-10-07T22:57:49Z` contained the old specification structure rather than relied-on implementation files; coverage returned `not_tracked`. An automatic refresh later appeared at `2026-10-12T17:13:13Z`, with metadata-changed/excluded signals for relied-on paths. Direct source reads/searches supplied the fallback. This inspection did not re-run historical execution/acceptance gates.

| Inspected capability | Current bounded evidence | Required addition or limit |
|---|---|---|
| Published curriculum | Static catalogue lists 243 published entries and 18 topics; release documents record three-language validation | Flags/documents are not a fresh runner test. New assessment content needs independent review and new execution receipts. |
| Adaptive practice | Learning engine uses independent/assisted evidence, prerequisites, related same-step checkpoints, remediation and explicit exhausted-path states | No proof the policy optimizes learning; finite fresh content can run out. |
| Assistance evidence | Backend records in-app help; explicit solution exposure excludes candidates; language evidence is separated | External AI, copied references and earlier exposure are not detected. “No recorded in-app help” is not verified unaided performance. |
| Review | Calendar intervals 1/3/7/14/30 days; due queue and review evidence | Existing repeat-question review is not fresh delayed transfer. Exact intervals are not scientifically optimal by default. |
| Initial assessment | Bounded 6–10-question welcome probes with unknown skills retained | Not a timed blind interview assessment or calibrated hiring benchmark. |
| AI/library | Backend DeepSeek adapter, bounded prompt/output, saved explanations, usage accounting | Live response quality/efficacy unverified; own key adds billing and onboarding friction. |
| Local operation | Windows startup/runner checks; release evidence for Windows ARM64/dedicated WSL | New student-device/platform support must be verified; local evidence is editable by the device owner. |
| Paid delivery | No paid cohort/service evidence established by the inspected paths | Pilot administration, fresh forms, rubrics, reviewer process and payment terms; later commercial controls only if demand passes. |

The technical and economic details, source line pointers and guardrails are in [feasibility](2026-10-12-feasibility.md). Historical app acceptance must not be confused with a new learning or commercial claim.

## Why pay repeatedly when the source is public?

Public GitHub metadata confirms visibility and a `main` branch; it returned `license: null`. Public access is not a permissive redistribution license. A rights audit is required before new commercial packaging or reused content. Nonetheless, visible code, questions and references weaken a secrecy-based software/content moat.

**Hypothesis:** Students pay for dependable ongoing work: new independently reviewed assessment forms, diagnosis of a fresh failure, feedback on explanations, useful practice adjustments and a group that reliably meets. A public clone reproduces the current software but does not automatically supply that maintained service. A disciplined self-hosting learner may reasonably choose the clone and free alternatives. Convenience alone is weak until setup is substantially easier.

Defensibility is initially modest: trust, reviewer reliability, rights-cleared validated content, calibration and distribution relationships take work, but competitors can reproduce features. Consented aggregate learning evidence can improve calibration; do not create a moat from private learner data. Do not hide source already public, claim proprietary independence detection or sell an unrecognized certificate as employer proof.

Renewal should follow a named remaining need: another weak skill, a later interview window or continued maintenance. Offer pause/graduation, retained exports and no payment required to view the learner's historical report. Successful exit is distinct from dissatisfaction. For a college, future cohorts may justify recurrent purchasing more naturally than the same student paying forever.

## Packaging and price hypotheses

Keep the existing local practice option available. Test a **four-week ₹999 group pilot** with a baseline, four weekly checkpoints/group reviews, individual bounded feedback and a delayed assessment. No automatic renewal. Disclose device eligibility, tutor/provider costs and the exact human-review allowance. This is a test price, not a demonstrated affordable price or profitable business.

If delivered value supports it, test **₹1,499 and ₹2,499 per four-week supported block** in separate comparable offer runs; the higher price is needed by the illustrative labour model below, but may be unacceptable to the intended buyer. A later **₹299/₹499 per month** self-guided service would need reliable fresh assessment supply and effortless access; compare it with a semester pass and fixed blocks. Do not infer self-guided demand from purchases of a coached service. A separate college pilot could test ₹10,000–₹20,000 for 20–30 learners with aggregate actionable reports, after an actual budget owner agrees to a scoped offer. All prices need tax/fee treatment and transparent final payable totals before collection. Global prices require separate local research; do not merely convert rupees.

At 20 learners × ₹1,499, block revenue is ₹29,980 before taxes/refunds. Planning assumptions: five hours total onboarding, 10 minutes of individual practice review per learner/week over four weeks, four one-hour group sessions, and **11 additional hours** for baseline/end/delayed grading, calibration, reports and retests. At an assumed ₹600/hour loaded labour rate, 33⅓ delivery hours cost ₹20,000. With a ₹1,000 operating reserve, contribution is only about **30%**, before acquisition, taxes, refunds and content development. Each additional eight hours of content work adds ₹4,800; with eight such hours, first-cohort margin falls to about **14%**. Eight hours is a sensitivity example, not an estimate that the full fresh pool can be authored and validated that quickly; that estimate is unresolved. At ₹999, the same service loses money before content. At ₹2,499, repeat-block contribution is about **58%** before acquisition/tax/refunds, provided the time assumptions and ongoing QA allocation hold. This exposes a serious price/service tradeoff, not a settled business model. Founder time counts as cost. These are feasibility arithmetic, not market rates or demonstrated margins; actual assessment-review time could be higher.

## Lean validation and explicit decisions

The following gates supersede differing exploratory ranges in the supporting briefs. They are management thresholds chosen to constrain investment, not research-derived industry benchmarks. Nothing below has been executed or authorized as outreach in this task.

1. **Problem interviews:** 12 target students from at least two reachable groups, including paid-tool quitters/free-only learners; separately 3 budget-owning college stakeholders and 2 potential parent payers. Ask about the last fresh failure, help used, next-day/week recall, time budget, upcoming assessment format, real spending and the decision-maker. Ask what they would replace and why they might decline after a neutral demo. Proceed with the student offer only if at least 7/12 describe a recent concrete transfer problem and at least 5 identify an upcoming assessment plus feasible weekly study time. Courtesy agreement alone fails. Do not combine parent enthusiasm with student demand.
2. **Message test:** Same scoped pilot, price and audience; compare “Solve a fresh problem after the hint is gone,” “A four-week plan with weekly feedback,” and “Check what you can solve for your upcoming placement test.” Use balanced traffic from consenting campus/club referrals and relevant content. At least 60 qualified prospects, about 20 per message; count diagnostics attended and actual paid seats, not likes. Results are directional, not statistically decisive. Proceed if at least 6/60 pay, including at least 4 outside close friends/family; stop/rework if fewer than 3 pay, buyers require placement guarantees, or refusals show the core problem is irrelevant. For 3–5 buyers, revise once and repeat with a fixed learning budget. Show free alternatives and honest availability; no fabricated urgency or deceptive checkout.
3. **Delivery gate:** Before taking money, verify assessment execution and every participant's access; independently review fresh forms and publish support/refund terms. If the actual students mostly use unverified x86 laptops, pause the app-dependent pilot until that environment passes. An accessible independently validated assessment service can test service demand separately, clearly excluding any inference about CodeWise2 install success. Never execute submissions on the host or treat WSL/container configuration as isolation evidence.
4. **Paid pilot:** 10–20 people, four weeks, one or two tightly bounded skill families. Primary metric: first-attempt full-suite acceptance on a fixed number of matched, fresh unaided tasks, accompanied by a reasoning/complexity rubric. Record help/exposure and conditions separately. See [measurement protocol](2026-10-12-proof-protocol.md). Proceed to a second pilot only if ≥70% complete the end assessment and ≥60% of all enrollees meet the predeclared improvement criterion; missing tests remain missing and fail this completion/improvement gate. At least 70% of enrollees should complete the delayed assessment. Median individual paired delayed/final rubric ratios should be ≥80%, and ≥60% of all enrollees should retain at least their final fresh-accepted count minus one **and** remain at least one accepted task above baseline. Zero-final-score ratios are undefined and do not pass retention. Report survivor bias and ceiling effects. These small-sample gates do not prove causal efficacy.
5. **Retention and economics:** Measure weekly fresh-check participation (target ≥60% of enrolled learners in week three), refunds (target ≤10%, never suppress requests), support time, setup failure and variable costs. Require ≥50% contribution at the intended supported price across a repeat cohort, including reviewer labour/ongoing assessment QA, and acquisition cost recoverable from the first paid block's contribution. Report numerators and denominators. If fewer than 10 learners remain genuinely eligible for another block, make no renewal conclusion. With ≥10 eligible learners, seek ≥40% actual optional repurchase within 14 days, at the same disclosed price; separately report successful exits, pauses and dissatisfied churn. A ₹999 pilot renewal cannot establish demand at ₹2499 or for self-guided software; validate each intended offer separately. Failing renewal with good learning supports fixed blocks, not an artificial subscription.

Predeclare a first-pilot cash-loss cap (proposed ₹10,000) and labour cap (proposed 45 hours including content work), with refund capacity. Estimate the full fresh-pool cost before enrollment; if it cannot fit, narrow the concept/language scope or do not launch. Stop when a cap is exceeded; do not keep adding features to rescue weak demand. If buyers pay but independent outcomes fail, suspend the outcome pitch. If outcomes improve but setup prevents access, solve delivery before acquisition. If both pass, run a stronger controlled study before superiority claims.

## Minimal staged roadmap

**Stage 0, research-to-offer:** Interview guide, plain truthful landing-page copy, demo and payment/refund specification; test messages and buyer identity. No new AI model, question-bank expansion or SaaS account system required.

**Stage 1, deliver a manual pilot:** Device verification; a narrow independently reviewed fresh item pool with three-language support only where promised; reviewer rubric; timed assessment conditions; external-help declaration; minimal opt-in evidence report; facilitated weekly reviews. Author enough non-overlapping forms before enrollment. Preserve current content and invalidate/revalidate execution evidence for new/changed harnesses. No claim of covert anti-cheat capability.

**Stage 2, automate a repeated successful service:** A separate assessment session model with frozen item/harness identities, timer, exposure/assistance state, explanation capture, delayed checks and clear evidence provenance. Add a simple per-skill report with dates/language/conditions and next practice action. Add paid entitlement/payment administration only after its scope is confirmed; do not make raw code an institutional default export. Validate live DeepSeek pedagogy and failure/latency/cost only if bundling tutoring is material.

**Stage 3, remove delivery friction:** Choose between verified installers on demanded platforms and a professionally isolated hosted judge; cost, privacy and abuse-test that choice. A multi-tenant cloud service is a new operational/security project, not deploying the single-learner localhost app. Add consent-based sync only if students value it.

**Stage 4, institutional expansion:** Pilot aggregate reports that faculty actually use, review calibration and separate procurement. Validate identity/assessment integrity and role relevance before employer-facing evidence. Subscription or semester pricing follows observed repeat buying.

## Honest pitch examples

- **Research/pilot headline:** “Can you solve the next problem without the hint?”
- **Proposed outcome headline:** “Turn understood solutions into fresh problems you can solve yourself.” Use as a program aim until efficacy is established.
- **Pilot pitch:** “A four-week DSA practice group for students preparing for software placements. Get targeted practice, fresh checkpoints and feedback on your reasoning. Your report separates helped work from what you demonstrated under the stated assessment conditions.”
- **Current app pitch:** “Practise in Java, C++ or Python with related checkpoints after in-app help and scheduled reviews. See your recorded independent and assisted work separately.” State platform/BYOK requirements alongside this claim.

Avoid “guaranteed placement,” “verified mastery,” “eliminates AI dependence,” “scientifically optimal schedule,” “first/only adaptive tutor” or anxiety-treatment claims. Do not present confidence gain as skill gain. Transparent cancellation, complete charges and learner-controlled sharing are part of trustworthy delivery; see the primary ethics references in the buyer brief.

## Questions that would materially change the decision

Which assessment format and companies are students actually targeting? Is transfer the painful bottleneck, rather than syntax, aptitude or eligibility? Can reachable students access a verified environment within 20 minutes? Do they pay for fresh feedback or mainly for an expert/group? How much qualified reviewer time does each learner need? Can enough non-repeated, difficulty-matched content be maintained lawfully? Does improvement persist and extend beyond closely related questions? Will enough still-preparing learners repurchase without pressure? Does a college have a real budget and a concrete decision for the report? Is the owner aiming for a service business or strictly self-serve software?

**Decision now:** approve this direction for demand testing, not a large build. A four-week paid pilot is the smallest honest commercial test. A recurring subscription is earned only by repeated paid value, reliable access, measured learning evidence and delivery economics.
