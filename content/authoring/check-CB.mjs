import { definitions as pointers } from "./two-pointers.mjs";
import { definitions as windows } from "./sliding-window.mjs";
import { definitions as stacks } from "./stack.mjs";
import { logicalCases } from "./pack-builder.mjs";
import { writeFileSync } from "node:fs";
const report = {
  timestamp: new Date().toISOString(),
  scope: "C-B independent authored-draft oracle and mutation check",
  runtimeExecution: "not-run",
  published: 0,
  packs: [],
  failures: [],
};
for (const def of [...pointers, ...windows, ...stacks]) {
  const cases = [...def.visible, ...logicalCases(def)];
  for (const c of cases)
    if (
      JSON.stringify(def.oracle(c.input)) !==
      JSON.stringify(def.independent(c.input))
    )
      report.failures.push(
        `${def.id}: independent expected mismatch ${JSON.stringify(c.input).slice(0, 200)}`,
      );
  const mutations = Object.entries(def.mutations).map(([name, fn]) => ({
    name,
    detected: cases
      .slice(3)
      .some((c) => JSON.stringify(fn(c.input)) !== JSON.stringify(c.expected)),
  }));
  for (const mutation of mutations)
    if (!mutation.detected)
      report.failures.push(`${def.id}: mutation ${mutation.name} not detected`);
  const checkpoints = def.checkpointIds || [];
  for (const id of checkpoints) {
    const peer = [...pointers, ...windows, ...stacks].find((x) => x.id === id);
    if (peer && peer.step !== def.step)
      report.failures.push(`${def.id}: checkpoint ${id} has a different step`);
  }
  report.packs.push({
    id: def.id,
    step: def.step,
    visible: 3,
    hidden: cases.length - 3,
    mutations,
    independentOracleChecks: cases.length,
  });
}
writeFileSync(
  "docs/release-evidence/content-CB-author-audit.json",
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify(
    {
      authored: report.packs.length,
      hidden: report.packs.reduce((s, p) => s + p.hidden, 0),
      failures: report.failures,
    },
    null,
    2,
  ),
);
if (report.failures.length) process.exitCode = 1;
