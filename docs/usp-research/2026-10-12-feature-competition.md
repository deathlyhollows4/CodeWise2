# New-feature competition: CodeWise2

Accessed 2026-10-12. Proposal research only: these are **new app features to build**, not rebranding existing checkpoints or a coached-cohort pivot. Official pages below were opened; advertised capabilities were not personally tested. Bounded research cannot establish that a competitor lacks a feature. No source edits, code execution, purchases or outreach.

## Recommended hero: Constraint-Change Lab

**Commercial hypothesis:** a learner who can solve a familiar question but fails interviewer variations has a concrete reason to use this. Build a lab that changes an assumption in their accepted solution and makes them predict, defend, test and adapt it. Sell the integrated activity and reliable evidence, not another chatbot or animation library.

Example: after an unweighted shortest-path solution, introduce different positive edge weights. Ask whether its shortest-path guarantee survives; require a three-node counterexample, run the unchanged algorithm against a validated oracle, then implement the appropriate algorithm. Later introduce negative weights without negative cycles and test whether the chosen guarantee survives. Changing conditions need not always break a solution: include unchanged-valid cases so learners cannot guess “switch algorithm” every time.

Start with 12–20 author-reviewed families: sorted→unsorted, distinct→duplicates, positive→signed, offline→streaming, existence→count, static→updates, unweighted→weighted, small→large input. Each family needs explicit semantics, independent reference/checker, adversarial cases and feasible variants. An arbitrary LLM-generated variation must never become a scored problem without validation.

Bundle it with **Counterexample Replay** and a **Misconception Ledger**. Text code-defense questions support the lab; postpone general voice interviews until the core evidence is trustworthy. This is a ranked product hypothesis, not proven market uniqueness or willingness to pay.

## Overlap and specific opportunity

| Proposed addition | Observed competitor/substitute overlap | More concrete proposed behavior |
|---|---|---|
| Constraint-change lab | [VisuAlgo shortest paths](https://visualgo.net/en/sssp) compares BFS, Dijkstra, Bellman-Ford, tree and DAG methods; [Codewars Kumite](https://www.codewars.com/kumite) supports remixing/refactoring code with tests. [Educative mocks](https://www.educative.io/mock-interview) advertise coding follow-ups and complexity evaluation. | Keep the learner's accepted code; change one certified contract; require prediction and counterexample before revealing results; score adaptation on unseen tests and explicit invariants. The packaging is more specific than these observed offers, not an absence claim. |
| Learner-specific small failing-input replay and state prediction | [Python Tutor](https://pythontutor.com/) is free and visualizes actual Python/Java/C/C++/JS variables, objects, pointers and frames; its teacher guidance already recommends guessing execution states. [VisuAlgo](https://visualgo.net/en) accepts custom inputs and offers algorithm animation. [NeetCode](https://neetcode.io/pro) advertises code analysis and suggested-fix diffs. | Find a reproducible failing case for the submitted code; shrink under the valid problem contract; pause before a divergent branch and ask for variable/queue/DP-state prediction. Show actual versus predicted states. Say “smallest found under these reductions,” not universally minimal. |
| Oral/text explanation cross-examination grounded in code | [LeetCode](https://leetcode.com/subscribe/) advertises Ask Leet debugging/test generation/analysis. Educative offers detailed follow-ups. [interviewing.io](https://interviewing.io/) offers AI coding/system-design interviews and human technical feedback. [Aced](https://www.aced.io/practice) offers shared-code peer interviews; its listed AI transcript feedback covers specified non-coding categories. | Ask “Why is this exact loop safe?” and “What breaks if this comparison changes?” Attach questions and feedback to code lines and executable examples. Grade factual assertions against runner evidence; mark judgment-based explanation scores separately. Do not infer Aced coding AI feedback from its broader marketing. |
| Persistent misconceptions driving micro-drills | [Educative Unlimited](https://www.educative.io/unlimited) advertises adaptive progress-based plans, skill-gap feedback and roadmaps. [VisuAlgo training](https://visualgo.net/training) offers generated graded quizzes by topic/difficulty. Generic chat plus notes can approximate a manual ledger. | Record a narrow evidence-backed error such as “marks BFS visited too late,” with source attempt, confidence and learner correction. Schedule a two-minute contrasting-case drill; retire the tag only after independent fresh success. Wrong submissions alone must not diagnose a misconception. |

## Free build-it-yourself substitute and validation

[Hypothesis introduction](https://hypothesis.readthedocs.io/en/latest/tutorial/introduction.html) demonstrates changing input domains and discovering counterexamples; Python Tutor provides free replay; VisuAlgo provides explanation/quizzes; a generic assistant can propose follow-ups. The paid hypothesis is reduced assembly effort plus trusted learner-specific validation and continuity. Counterexample generation alone is an established testing technique, not a moat.

Pilot one family before building breadth. Compare the same study time against a free sheet/judge/visualizer workflow. Measure success on new contract changes after seven days, counterexample quality, time to independent repair, false diagnoses and return usage. Test willingness to pay for repeated labs; a content pack or one-time purchase may outperform subscription unless new validated families and continuing diagnostics create recurring value.

Use isolated approved execution, bounded traces and explicit consent for saved code/audio. All suggestions need language-specific behavior checks. Privacy and validated runner coverage are delivery requirements; efficacy, provider quality and universal language/platform support remain unproven.

## Source/claim limits

All twelve linked official pages were successfully opened on 2026-10-12. Each contributes under 200 attributed paraphrased words; no testimonials copied. Hypothesis settings page extracted empty, so shrinking implementation details are not sourced from it. No relevant memory used. Coordinator retained Sol/low authorization; no separate effective runtime or speed claim is made.
