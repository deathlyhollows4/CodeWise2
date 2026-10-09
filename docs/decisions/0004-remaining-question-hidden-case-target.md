# User-authorized hidden-case amendment

Date: 2026-10-08. The user instructed: “for the leftover questions create only 60 hidden test cases, i believe it will reduce workload a little bit”. This supersedes the default hidden-case minimum only for the unfinished question IDs frozen below. The original specification is unchanged.

Exactly **52 remaining questions require 60 distinct hidden cases each**. The **191 already authored questions retain their larger suites** and the existing minimum of200. Completed source batches awaiting materialization count as authored. Reservations and incomplete future drafts do not. This preserves useful completed work while reducing new authoring effort.

| Topic | IDs requiring exactly60 hidden cases |
|---|---|
| Heap |03,10,12,14 |
| Backtracking |03–10 |
| Graphs |01–13 |
| Advanced Graphs |01–06 |
| 1-D DP |23–24 |
| 2-D DP |07–11 |
| Greedy |01–08 |
| Intervals |01–06 |

The immutable cutoff evidence is `docs/release-evidence/hidden-case-amendment-cutoff.json`. Its preserved set consists of the179 IDs from `content-current-179-full-draft-audit.json`, plus completed source questions DP1D19–22, Tries03, Heap09 and DP2D01–06. The parallel DP2D thread's first and second author audits establish those six completed sources. Later authoring does not move this cutoff.

The authoritative machine policy is `packages/contracts/src/delivery-scope.json`: its default minimum remains200 and explicit per-ID overrides require exactly60. Builders, content audits, native validation, assessment acceptance and backup validation consume the same policy. Unknown IDs do not inherit a lower threshold. Historical evidence retains its actual counts and identities.

Each new60-case suite must be deliberately curated for the declared input domain, maximum and minimum bounds, degenerate shapes, arithmetic limits where applicable, and representative incorrect approaches. Taking the first60 random cases or dropping important maximum cases is insufficient. All60 must be semantically distinct under the problem's declared equivalence rules, independently checked and executed in each supported language before publication.

The243-question quota, three explained visible examples per question, Java/C++/Python support, independent oracle and mutation checks, safe isolated execution, rights, curriculum, diversity, identity-bound receipts and every other release requirement remain unchanged. There is no publication or release-completion claim in this amendment.

Backend owns shared policy/assessment/backup changes. Judge owns builder, audit and native-validation enforcement. Each topic author owns curated suites for its listed IDs. The coordinator owns the cutoff and checks evidence without editing the original specification.

## Diversity repairs after the cutoff

An already-authored ID rejected for duplication does not move into the 60-case set. Its replacement objective keeps the 200-case minimum and requires a new independently checked suite and fresh three-language receipts. Incompatible cases from the retired objective are preserved with its archived assets and evidence; they are not counted as tests of the replacement. This is an objective repair under the existing diversity gate, not permission to trim unchanged question suites. The four later version1 packs are preserved under `retired-content/pre-replacement-20261008T111143Z`, with a hash receipt in `docs/release-evidence/retired-four-draft-archive.json`.
