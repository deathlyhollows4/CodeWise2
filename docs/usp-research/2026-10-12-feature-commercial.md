# New-feature commercial assessment

2026-10-12. Proposed features, not implemented or commercially validated. Research only; no outreach, spend or app edits. This addresses a self-serve app, not a coached-service pivot. Rankings and prices are hypotheses.

## Recommendation

Lead with **Constraint-change lab**: after solving a task, change a meaningful constraint so the previous algorithm fails; ask the learner to predict the failure, produce a counterexample and repair the approach. Combine this with **actual-code counterexample replay**. These create a concrete reason to choose the app beyond another explanation or schedule. **Persistent misconception memory** provides continuity; **explanation cross-examination** supports the lab rather than becoming an open-ended chatbot.

| Rank | Feature | Purchase / return hypothesis | Principal risk |
|---|---|---|---|
| 1 | Constraint-change lab | “Can I adapt when memorized patterns stop working?” Return for a new, validated constraint shift and delayed transfer check. | Content difficulty, valid oracles and meaningful novelty require work; reskinning tasks adds little value. |
| 2 | Actual-code counterexample replay | “Show where my own approach breaks.” Replay the smallest available failing case, compare expected/actual state and classify the mistake. Return when a new implementation fails. | Many failures already have judge diagnostics; replay must explain a decision rather than merely show an input. Sandboxed language instrumentation is new engineering, not existing capability. |
| 3 | Misconception memory + repair drills | “Remember the mistakes I repeat and retest them.” Return for a due drill selected from an observed misconception, then a fresh check that it was repaired. | Wrong labels feel intrusive or unhelpful. Let learners inspect/correct/delete labels; do not infer a psychological diagnosis. |
| 4 | Explanation cross-examination | “Can I defend correctness and complexity?” Ask bounded follow-ups about an invariant, changed constraint or edge case; return before an interview. | General AI can imitate this easily; unconstrained scoring can invent confidence. Use reviewed questions/rubrics and show uncertainty. |

A generic deadline planner is easier to ship but weak as a paid differentiator. Generic mock interviews have episodic demand and strong alternatives. Site-wide AI adds provider costs and duplicates free assistants. These can support navigation or practice, but should not lead this feature package. The existing app's adaptive/review foundations are context, not evidence these additions work.

## Why repeatedly pay — and why someone would not

A plausible self-serve recurring bundle is a maintained stream of reviewed constraint variants plus personalized repair scheduling and interoperable history. Payment buys new content/service availability and convenience, not the claim that yesterday's downloadable code cannot be copied. Public source and visible references weaken software secrecy; a competent user can self-host and copy features. GitHub visibility alone does not establish reuse rights: clear software/content rights before packaging.

Keep purchase options finite. Placement prep often ends. Test a four-week pass first; subscriptions need actual second-period buying. Graduation, deadline completion and taking a break are acceptable exits. Do not trap learner history or exports behind renewal. Broad learning purchases demonstrate category demand only: [Coursera's reported consumer revenue](https://investor.coursera.com/news/news-details/2026/Coursera-Reports-Fourth-Quarter-and-Full-Year-2025-Financial-Results/default.aspx) cannot establish CodeWise2 willingness to pay. Interview price enthusiasm also requires behavioral confirmation; [research on hypothetical bias](https://arxiv.org/abs/2102.02940) shows context-dependent gaps between stated and actual choices.

## Bound the offer and costs

Initial hypothesis: one language, two concepts, four constraint-change labs/month, up to twelve matched repair drills and bounded explanation follow-ups; no unlimited fresh problems or AI. Test ₹199–₹399 per four-week pass after a useful free lab. These are experiment prices, not market evidence. Explicitly disclose provider costs if BYOK remains; test without AI first. No learner-facing human service is included, but content authoring, independent QA, maintenance and support still cost money. Count them before claiming profitable automation. Do not sell unvalidated variants or AI-generated expected outputs.

## Cheapest concrete validation

Build one vertical prototype: sorted-array binary search fails under a changed ordering assumption; the learner predicts failure, sees a validated code/input replay, repairs the approach and completes a different delayed check. Ship two fully reviewed lab chains, not four unfinished modules. Label the proposed features and limits honestly; use approved isolated execution only.

Measure completed unaided changed-constraint tasks, useful replay-to-repair transitions, voluntary return within seven days and actual purchases of the next clearly scoped pack. Predeclare a directional gate: among 20 target users who finish the free lab, ≥6 return and ≥4 buy a real next pack; <2 purchases stops expansion. Small convenience samples cannot prove market demand or causal learning gains. Payment testing requires later authorization and a deliverable/refundable offer; no fake checkout, concealed renewal or invented scarcity. [FTC dark-pattern guidance](https://www.ftc.gov/news-events/news/press-releases/2022/09/ftc-report-shows-rise-sophisticated-dark-patterns-designed-trick-trap-consumers).
