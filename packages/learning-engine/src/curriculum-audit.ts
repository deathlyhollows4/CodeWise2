import type { PublicProblem } from "../../contracts/src/index.ts";
export type CurriculumMetadata = Pick<
  PublicProblem,
  | "id"
  | "primaryTopic"
  | "step"
  | "skillIds"
  | "prerequisites"
  | "checkpointIds"
  | "nextIds"
  | "remedialIds"
>;
export type CurriculumIssue = {
  code: string;
  problemId: string;
  targetId?: string;
  message: string;
  skills?: string[];
};
export function auditCurriculum(
  problems: CurriculumMetadata[],
  options: { maxStatesPerEntry?: number; maxTotalStates?: number } = {},
) {
  const maxStates = Math.max(
      1,
      Math.min(options.maxStatesPerEntry ?? 2048, 10000),
    ),
    maxTotalStates = Math.max(
      1,
      Math.min(options.maxTotalStates ?? 50000, 100000),
    );
  let exploredStates = 0,
    capped = false;
  const issues: CurriculumIssue[] = [],
    byId = new Map(problems.map((p) => [p.id, p]));
  const add = (
    code: string,
    p: CurriculumMetadata,
    targetId: string | undefined,
    message: string,
    skills?: string[],
  ) =>
    issues.push({
      code,
      problemId: p.id,
      ...(targetId ? { targetId } : {}),
      message,
      ...(skills ? { skills } : {}),
    });
  if (byId.size !== problems.length)
    issues.push({
      code: "DUPLICATE_ID",
      problemId: "catalogue",
      message: "Problem IDs must be unique.",
    });
  for (const p of problems) {
    for (const [kind, ids] of [
      ["checkpoint", p.checkpointIds],
      ["next", p.nextIds],
      ["remedial", p.remedialIds],
    ] as const)
      for (const targetId of ids) {
        const t = byId.get(targetId);
        if (!t) {
          add("MISSING_TARGET", p, targetId, `The ${kind} target is absent.`);
          continue;
        }
        if (kind !== "remedial" && t.primaryTopic !== p.primaryTopic)
          add(
            "CROSS_PATH_STEP",
            p,
            targetId,
            "Internal steps cannot be compared across different topic paths.",
          );
        if (kind === "checkpoint" && t.step !== p.step)
          add(
            "CHECKPOINT_WRONG_STEP",
            p,
            targetId,
            "Assisted checkpoint must stay at the same internal step.",
          );
        if (kind === "next" && t.step !== p.step + 1)
          add(
            "NEXT_NOT_ONE_STEP",
            p,
            targetId,
            "Independent advancement must add exactly one internal step.",
          );
      }
    if (!p.checkpointIds.length)
      add(
        "ASSISTED_BRANCH_GAP",
        p,
        undefined,
        "No different same-step independent checkpoint is recorded.",
      );
    const highest = Math.max(
      ...problems
        .filter((t) => t.primaryTopic === p.primaryTopic)
        .map((t) => t.step),
    );
    if (p.step < highest && !p.nextIds.length)
      add(
        "INDEPENDENT_BRANCH_GAP",
        p,
        undefined,
        "A higher step exists but no explicit independent transition is recorded.",
      );
  }
  const entries = problems.filter((p) => !p.prerequisites.length);
  const reached = new Set<string>(),
    branches: Array<{ entryId: string; reachable: string[] }> = [];
  for (const entry of entries) {
    const visited = new Set<string>(),
      reachable = new Set<string>(),
      queue: Array<{ p: CurriculumMetadata; known: Set<string> }> = [
        { p: entry, known: new Set() },
      ];
    while (queue.length) {
      const { p, known } = queue.shift()!;
      const state = p.id + "|" + [...known].sort().join(",");
      if (visited.has(state)) continue;
      visited.add(state);
      exploredStates++;
      if (visited.size > maxStates || exploredStates > maxTotalStates) {
        capped = true;
        add(
          "AUDIT_STATE_LIMIT",
          entry,
          undefined,
          "Representative transition exploration reached its declared state limit; unvisited histories remain unverified.",
        );
        break;
      }
      const missing = p.prerequisites.filter((s) => !known.has(s));
      if (missing.length) {
        add(
          "UNMET_PATH_PREREQUISITE",
          p,
          undefined,
          `Entry ${entry.id} cannot reach this challenge with the independently demonstrated skills on its path.`,
          missing,
        );
        continue;
      }
      reachable.add(p.id);
      reached.add(p.id);
      const after = new Set([...known, ...p.skillIds]);
      for (const id of p.nextIds) {
        const t = byId.get(id);
        if (t && t.primaryTopic === p.primaryTopic && t.step === p.step + 1)
          queue.push({ p: t, known: after });
      }
      for (const id of p.checkpointIds) {
        const t = byId.get(id);
        if (t && t.primaryTopic === p.primaryTopic && t.step === p.step) {
          const unmet = t.prerequisites.filter((s) => !known.has(s));
          if (unmet.length)
            add(
              "ASSISTED_CHECKPOINT_PREREQUISITE",
              p,
              t.id,
              "An assisted solve does not independently demonstrate the prerequisite required by its checkpoint.",
              unmet,
            );
          else queue.push({ p: t, known: new Set(known) });
        }
      }
    }
    branches.push({ entryId: entry.id, reachable: [...reachable].sort() });
  }
  for (const p of problems)
    if (!reached.has(p.id))
      add(
        capped ? "REACHABILITY_UNVERIFIED" : "UNREACHABLE_FROM_ENTRY",
        p,
        undefined,
        capped
          ? "Bounded exploration did not verify this target; reachability remains unknown."
          : "No independently eligible entry path reaches this problem through recorded transitions.",
      );
  const unique = [
    ...new Map(issues.map((i) => [JSON.stringify(i), i])).values(),
  ];
  return {
    schemaVersion: 1,
    ruleVersion: "curriculum-audit-1",
    explorationMode: "bounded-recorded-transition-branches",
    bounds: { maxStatesPerEntry: maxStates, maxTotalStates },
    exploredStates,
    capped,
    learnerHistoryCoverage: "not-exhaustive",
    ok: unique.length === 0,
    problemCount: problems.length,
    entryCount: entries.length,
    reachableCount: reached.size,
    issues: unique,
    branches,
  };
}
