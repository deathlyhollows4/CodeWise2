# New feature candidates: learning evidence

2026-10-12. Research only; no application edits, learner contact or spending. These are new capabilities, not new names for existing checkpoints/reviews. Effective runtime model/effort/speed is not independently visible. Every proposed benefit below is a hypothesis; sources do not establish CodeWise2 efficacy or purchase demand.

## 1. Constraint-change lab — strongest differentiated candidate

**Student interaction:** Start from a solved problem and its code. Change exactly one relevant constraint: positive values become signed, input becomes a stream, a sorted array becomes unsorted, or memory becomes bounded. Before running anything, the learner selects whether the old method still works, identifies the assumption it relied on, supplies a counterexample or complexity argument, and changes the plan/code. The app reveals a reviewed contrast explanation after the attempt. Include cases where the algorithm still works so “always replace it” cannot become a shortcut.

**Evidence:** Schwartz and Bransford's experiments on psychological phenomena found that analyzing contrasting cases prepared students to learn from subsequent explanation; repeated case analysis without instruction was insufficient. This supports comparison followed by explanation, not unguided discovery. It is indirect evidence for DSA. [Opened primary paper, 1998](https://aaalab.stanford.edu/papers/time_for_telling.pdf).

**Boundary:** Three undergraduate physics experiments found benefits from comparison between synthesis examples, but not from corresponding pairs of single-concept examples; self-explanation was better on a harder synthesis task. Comparing superficially similar questions therefore is not automatically productive. [Opened primary paper, 2017](https://journals.aps.org/prper/abstract/10.1103/PhysRevPhysEducRes.13.020112).

**Bounded proof:** Pilot three reviewed constraint families in one language. Equal-time comparison: lab versus reading the same contrasting examples/explanations. Primary test one week later: unseen constraint variants, no labels/help; score correct validity judgment, valid counterexample, adaptation correctness and time. Report near-family transfer separately from unfamiliar multi-constraint problems. Kill or simplify if completion rises but delayed adaptation does not.

## 2. Counterexample and state-prediction workbench — strongest direct mechanism

**Student interaction:** Show a short relevant code slice and input. Require the next pointer, queue, visited-set or accumulator state before revealing it. On failure, the learner constructs a small input that breaks the code, predicts expected/actual results, locates the first diverging state and patches the cause. Compare the proposed counterexample against a trusted specification. Fade state tables as competence improves; avoid an autoplay-only visualization.

**Evidence:** Xie, Nelson and Ko's block-randomized study of 24 university CS1 novices found better short-program tracing after teaching line-by-line execution and external memory tables. Small sample, self-selection, imperfect randomization and short follow-up limit generalization; arrays/objects and code-writing transfer were not established. It supports requiring prediction rather than merely watching execution. [Opened primary paper, SIGCSE 2018](https://faculty.washington.edu/ajko/papers/Xie2018TracingStrategies.pdf).

**Disconfirming caution:** A 128-student factorial programming experiment found syntactic erroneous examples useful when learners correctly fixed them; semantic errors were too difficult to detect/fix and did not improve learning. Do not begin with arbitrary hard DSA bugs. [Primary publisher abstract, 2021](https://doi.org/10.1016/j.learninstruc.2021.101497) (indexed abstract available; full-text open blocked).

**Bounded proof:** Test 10–12 short reviewed exercises against equal-time passive traces. Delayed unaided test: novel trace, locate first divergence, create a valid breaking input and repair a matched bug. Track random guessing, hint need and frustration by baseline skill. Execution feedback must come from the verified isolated runner or precomputed reviewed traces, never host execution of learner code or an LLM inventing states.

## 3. Explain-back plus misconception micro-drills — useful supporting candidate

**Student interaction:** Ask a precise question about the learner's solution: “Why can this pointer move only forward?”, “What invariant holds before the loop?”, or “Which input disproves your claim?” Accept text; oral answers are optional with an editable transcript. Mark a specific claim against a reviewed rubric, show the conflicting trace, then assign a two-minute discrimination/drill for that misconception. Say “possible misconception” when evidence is weak; allow correction. Assess reasoning, not accent or fluency.

**Evidence:** A programming study evaluated active stepwise engagement with AI code through studies of 82 and 42 learners, measuring isomorphic unaided tasks and perceived/actual ability calibration; proposing steps before code revelation was the strongest reported technique. This supports structured reasoning turns, not unlimited chat. [Opened author preprint, 2024](https://arxiv.org/abs/2410.08922). It does not validate oral scoring or reliable misconception classification.

**Bounded proof:** Compare explanation/drill versus matched editorial plus generic chat with equal time. Blind-review rubric scores and false misconception flags; measure a fresh explanation and matched implementation one week later. Validate text first; test oral modality separately. The feature fails if it only produces longer responses or higher self-confidence.

**Priority:** Prototype constraint changes with explicit prediction and a small reviewed state/counterexample panel; add targeted explain-back after scoring reliability exists. Use deterministic truth for inputs, states and correctness, with AI limited to grounded wording. None is a placement guarantee, anxiety treatment or established subscription USP until learners use it, transfer improves and separate paid behavior is observed.
