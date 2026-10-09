import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
const all = new Map();
for (const id of readdirSync("content/problems")) {
  const path = `content/problems/${id}/problem.json`;
  if (existsSync(path)) all.set(id, JSON.parse(readFileSync(path)));
}
const owned = [...all.values()].filter((d) =>
  ["two-pointers", "sliding-window", "stack"].includes(d.primaryTopic),
);
const report = {
  timestamp: new Date().toISOString(),
  scope:
    "Independent C-B concrete IDs, same-step checkpoints, and next-route prerequisite coverage through explicitly named real teachers. No learner skill completion inferred.",
  routes: [],
  invalidIds: [],
  badCheckpoints: [],
  uncovered: [],
};
for (const def of owned) {
  for (const kind of ["checkpointIds", "remedialIds", "nextIds"])
    for (const id of def[kind] ?? []) {
      if (!all.has(id)) report.invalidIds.push({ from: def.id, kind, id });
      if (
        kind === "checkpointIds" &&
        all.has(id) &&
        all.get(id).step !== def.step
      )
        report.badCheckpoints.push({ from: def.id, id });
    }
  for (const id of def.nextIds ?? []) {
    const target = all.get(id);
    if (!target) continue;
    const demonstrated = new Set([...def.skillIds, ...def.prerequisites]);
    const missing = target.prerequisites.filter(
      (skill) => !demonstrated.has(skill),
    );
    const teachers = [
      ...new Set([...(def.remedialIds ?? []), ...(target.remedialIds ?? [])]),
    ]
      .map((id) => all.get(id))
      .filter(Boolean);
    const coverage = missing.map((skill) => ({
      skill,
      teachers: teachers
        .filter((p) => p.skillIds.includes(skill))
        .map((p) => p.id),
    }));
    report.routes.push({ from: def.id, to: id, requiredRemediation: coverage });
    for (const entry of coverage)
      if (!entry.teachers.length)
        report.uncovered.push({ from: def.id, to: id, skill: entry.skill });
  }
}
writeFileSync(
  "docs/release-evidence/content-CB-link-audit.json",
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify(
    {
      packs: owned.length,
      routes: report.routes.length,
      invalidIds: report.invalidIds,
      badCheckpoints: report.badCheckpoints,
      uncovered: report.uncovered,
    },
    null,
    2,
  ),
);
if (
  report.invalidIds.length ||
  report.badCheckpoints.length ||
  report.uncovered.length
)
  process.exitCode = 1;
