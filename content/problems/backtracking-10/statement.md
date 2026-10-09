## One resource, all tasks

Task i is identified by its original array position. It cannot start before `release[i]`, takes `duration[i]` time without interruption, and must finish at or before `deadline[i]`. One resource executes at most one task at a time. Time starts at zero, and every task must execute exactly once.

Return every feasible task order as an array of original task IDs. For a proposed order, schedule each task as early as possible: its start is the larger of the previous finish time and its release time. Do not list start times or additional voluntary idle periods; for a fixed order, starting later cannot improve deadline feasibility. Sort answer rows lexicographically by their task-ID arrays. Tasks with identical metadata remain distinct original IDs.

Return an empty array if no full order exists. With no tasks, return the one empty order, `[[]]`. Finishing exactly at a deadline is allowed.

### Native interface

`solve(release, duration, deadline)` receives three native wide-integer arrays of equal length and returns an integer matrix of execution orders. Accumulate time with wide integers: supported schedules may reach eight billion time units.
