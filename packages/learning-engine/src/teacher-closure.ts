import type { PublicProblem } from "../../contracts/src/index.ts";
// Search only explicitly linked teachers. Never infer skill evidence from a link.
export function qualifiedTeacherClosure(
  catalogue: PublicProblem[],
  roots: string[],
  missing: string[],
  known: Set<string>,
  solved: Set<string>,
  exposed: string[],
  eligible: (problem: PublicProblem) => boolean,
  bounds = { maxDepth: 8, maxVisits: 128 },
) {
  const byId = new Map(catalogue.map((p) => [p.id, p])),
    visited = new Set<string>(),
    results = new Map<string, { problem: PublicProblem; chain: string[] }>();
  const uniqueRoots = [...new Set(roots)];
  const queue = uniqueRoots
    .slice(0, bounds.maxVisits)
    .map((id) => ({ id, missing, chain: [] as string[] }));
  let capped = uniqueRoots.length > bounds.maxVisits,
    cycles = 0;
  while (queue.length) {
    const state = queue.shift()!;
    if (state.chain.includes(state.id)) {
      cycles++;
      continue;
    }
    if (
      state.chain.length > bounds.maxDepth ||
      visited.size >= bounds.maxVisits
    ) {
      capped = true;
      continue;
    }
    const key = state.id + "|" + [...state.missing].sort().join(",");
    if (visited.has(key)) continue;
    visited.add(key);
    const p = byId.get(state.id);
    if (
      !p ||
      !eligible(p) ||
      solved.has(p.id) ||
      exposed.includes(p.id) ||
      !p.skillIds.some((skill) => state.missing.includes(skill))
    )
      continue;
    const unmet = p.prerequisites.filter((skill) => !known.has(skill)),
      chain = [...state.chain, p.id];
    if (!unmet.length) {
      const previous = results.get(p.id);
      if (!previous || chain.length < previous.chain.length)
        results.set(p.id, { problem: p, chain });
    } else {
      const links = p.remedialIds ?? [];
      if (links.length > bounds.maxVisits) capped = true;
      for (const id of links.slice(0, bounds.maxVisits)) {
        if (queue.length >= bounds.maxVisits) {
          capped = true;
          break;
        }
        queue.push({ id, missing: unmet, chain });
      }
    }
  }
  return {
    teachers: [...results.values()].sort(
      (a, b) =>
        a.chain.length - b.chain.length ||
        a.problem.id.localeCompare(b.problem.id),
    ),
    visited: visited.size,
    cycles,
    capped,
    bounds,
  };
}
