import { definitions as windows } from "./sliding-window.mjs";
import { definitions as stacks } from "./stack.mjs";
import { retainedMaxCases } from "./owned-max-cases.mjs";
import { validateInput } from "../../packages/judge-adapter/src/schema-validator.mjs";
import { validateSemantics } from "../../packages/judge-adapter/src/semantic.mjs";
import { writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const report = {
  timestamp: new Date().toISOString(),
  scope:
    "Trusted near-limit owned case/oracle certificates only; no native execution or materialization, historical receipts preserved",
  problems: [],
  failures: [],
};
for (const d of [...windows, ...stacks]) {
  const cases = retainedMaxCases(d.id);
  if (!cases.length) continue;
  let bytes = 0;
  const hashes = [];
  for (const c of cases) {
    if (
      !validateInput(d.inputSchema, c.input) ||
      !validateSemantics(d.semanticConstraints || [], c.input) ||
      (d.valid && !d.valid(c.input))
    ) {
      report.failures.push(d.id + ": illegal supplement");
      continue;
    }
    const expected = d.oracle(c.input),
      independent = d.independent(c.input);
    if (JSON.stringify(expected) !== JSON.stringify(independent))
      report.failures.push(d.id + ": independent mismatch");
    if (!validateInput(d.outputSchema, expected))
      report.failures.push(d.id + ": expected output rejected");
    bytes += Buffer.byteLength(JSON.stringify(expected) + "\n");
    hashes.push(
      createHash("sha256")
        .update(JSON.stringify({ input: c.input, expected }))
        .digest("hex"),
    );
  }
  report.problems.push({
    id: d.id,
    retainedCases: cases.length,
    supplementOutputBytes: bytes,
    certificateHashes: hashes,
  });
}
report.sourceHash = createHash("sha256")
  .update(readFileSync("content/authoring/owned-max-cases.mjs"))
  .digest("hex");
writeFileSync(
  "docs/release-evidence/owned-max-cases-certificates.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
if (report.failures.length) process.exitCode = 1;
