# 1-D DP calibration before the next batch

Question IDs identify assets; they do not determine difficulty. This authoring decision keeps the unchanged24-question DP1D quota and the user-amended243-question total. It does not publish or validate a question.

| Asset | Planned path step | Limited added requirement |
|---|---:|---|
| DP13 maximum contiguous sum |2|Choose whether to restart or extend a contiguous state, after basic one-dimensional state. Require a nonempty chosen segment so all-negative inputs remain meaningful. |
| DP14 maximum contiguous product |3|Carry both minimum and maximum ending products because a negative multiplier swaps their roles; zero restarts the state. |
| DP11 strict LIS length |6, unchanged|Maintain a monotone tail frontier and use strict lower-bound semantics. |
| DP12 count optimal strict subsequences |6, unchanged|Replace counts for a better length and merge tied indexed optimal choices. |

DP13 can offer DP03/04 as explicitly related step2 optimization checkpoints. Its step3 routes can include DP14/05/06, with independently demonstrated prerequisites enforced. DP14 can offer DP05/06 as step3 checkpoints and route to DP07/08 at step4. These are path choices, not claims that IDs13/14 are harder than IDs11/12.

The current DP11/12 next links to13/14 are provisional authoring placeholders and must be replaced before final progression acceptance. Proposed later step7 candidates are cooldown trading (a time-constrained multi-state transition) and weighted interval profit (compatibility predecessor search plus take/skip DP). Their final contracts and prerequisites will be reviewed during authoring; until then their absence remains pending authoring, not reachability proof. Coordinate rematerialization with the judge's snapshot handback so historical reference receipts remain intact.

DP14's numeric domain must bound every intermediate contiguous product, not only the final result; choose exact safe JSON output or explicit decimal-string encoding before materialization. DP15/16 segmentation objectives, DP21/22 trading distinctness, and representative reduced DP2D11 coverage still need their separate objective review. No mechanically paired step numbers are assumed for those tasks.
