import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { validateInput } from "../../packages/judge-adapter/src/schema-validator.mjs";
import { validateSemantics } from "../../packages/judge-adapter/src/semantic.mjs";
const prefixes = /^(two-pointers|sliding-window|stack|linked-list|trees)-/;
function maximumVisits(schema) {
  switch (schema.kind) {
    case "object":
      return (
        1 +
        Object.values(schema.properties).reduce(
          (n, s) => n + maximumVisits(s),
          0,
        )
      );
    case "array":
      return 1 + (schema.maxLength ?? 100000) * maximumVisits(schema.items);
    case "nullable":
      return 1 + maximumVisits(schema.value);
    case "json":
      return null;
    case "integer-array":
      return schema.maxLength + 2;
    default:
      return 1;
  }
}
function maximumDimension(schema) {
  if (schema.kind === "object")
    return Math.max(
      0,
      ...Object.values(schema.properties).map(maximumDimension),
    );
  if (schema.kind === "array")
    return Math.max(schema.maxLength ?? 100000, maximumDimension(schema.items));
  if (schema.kind === "nullable") return maximumDimension(schema.value);
  if (schema.kind === "string") return schema.maxLength ?? 100000;
  return 0;
}
function boundary(schema) {
  switch (schema.kind) {
    case "object":
      return Object.fromEntries(
        Object.entries(schema.properties).map(([k, s]) => [k, boundary(s)]),
      );
    case "array":
      return Array.from({ length: schema.maxLength ?? 100000 }, () =>
        boundary(schema.items),
      );
    case "nullable":
      return boundary(schema.value);
    case "string":
      return "a".repeat(schema.maxLength ?? 100000);
    case "integer":
    case "safe-integer":
    case "number":
      return Math.max(
        schema.minimum ?? -1000000,
        Math.min(schema.maximum ?? 1000000, 0),
      );
    case "boolean":
      return false;
    case "null":
      return null;
    case "enum":
      return schema.values[0];
    default:
      throw Error("Unhandled boundary kind " + schema.kind);
  }
}
function primitiveLargest(value) {
  if (typeof value === "string") return value.length;
  if (Array.isArray(value))
    return Math.max(value.length, ...value.map(primitiveLargest));
  if (value && typeof value === "object")
    return Math.max(0, ...Object.values(value).map(primitiveLargest));
  return 0;
}
const report = {
  timestamp: new Date().toISOString(),
  scope:
    "Read-only owned actual-manifest domain node-budget/large-case scan; schema upper bounds are potential until semantic-valid boundary confirmation, no native execution or shared control changes",
  sharedVisitLimit: 200000,
  manifests: [],
  confirmedInputRejections: [],
  potentialOutputBounds: [],
  structuralOutputProofs: [],
  largeDimensionCoverage: [],
};
for (const id of readdirSync("content/problems").filter((id) =>
  prefixes.test(id),
)) {
  const dir = "content/problems/" + id;
  if (!existsSync(dir + "/problem.json")) continue;
  const m = JSON.parse(readFileSync(dir + "/problem.json", "utf8")),
    inputMax = maximumVisits(m.inputSchema),
    outputMax = maximumVisits(m.outputSchema);
  const row = {
    id,
    inputDeclaredMaxVisits: inputMax,
    outputDeclaredMaxVisits: outputMax,
    declaredMaxDimension: maximumDimension(m.inputSchema),
    maxObservedInputDimension: 0,
    maxObservedInputBytes: 0,
    maxObservedOutputBytes: 0,
  };
  for (const line of readFileSync(
    dir + "/private/hidden-cases.jsonl",
    "utf8",
  ).split("\n"))
    if (line.trim()) {
      const c = JSON.parse(line);
      row.maxObservedInputDimension = Math.max(
        row.maxObservedInputDimension,
        primitiveLargest(c.input),
      );
      row.maxObservedInputBytes = Math.max(
        row.maxObservedInputBytes,
        Buffer.byteLength(JSON.stringify(c.input)),
      );
      row.maxObservedOutputBytes = Math.max(
        row.maxObservedOutputBytes,
        Buffer.byteLength(JSON.stringify(c.expected)),
      );
    }
  if (inputMax > 200000) {
    try {
      const input = boundary(m.inputSchema);
      for (const rule of m.semanticConstraints || []) {
        if (rule.kind === "unique" && Array.isArray(input[rule.field]))
          input[rule.field] = input[rule.field].map((_, i) => i);
        if (rule.kind === "length-relative")
          input[rule.field] = Math.max(
            rule.minimum ?? 0,
            Math.min(
              input[rule.array].length + (rule.maxOffset ?? 0),
              input[rule.field],
            ),
          );
      }
      const semanticValid = validateSemantics(
          m.semanticConstraints || [],
          input,
        ),
        actualAccepted = validateInput(m.inputSchema, input);
      row.maxBoundaryProbe = {
        semanticValid,
        actualAccepted,
        bytes: Buffer.byteLength(JSON.stringify(input)),
        fields: Object.fromEntries(
          Object.entries(input).map(([k, v]) => [
            k,
            Array.isArray(v) ? v.length : typeof v === "string" ? v.length : v,
          ]),
        ),
      };
      if (semanticValid && !actualAccepted)
        report.confirmedInputRejections.push({ id, ...row.maxBoundaryProbe });
    } catch (e) {
      row.probeUnavailable = e.message;
    }
  }
  if (outputMax > 200000)
    report.potentialOutputBounds.push({
      id,
      maxVisits: outputMax,
      note: "Output schema bound alone is not proof a legal expected result reaches it.",
    });
  if (
    row.declaredMaxDimension >= 500 &&
    row.maxObservedInputDimension < row.declaredMaxDimension * 0.9
  )
    report.largeDimensionCoverage.push({
      id,
      declared: row.declaredMaxDimension,
      observed: row.maxObservedInputDimension,
      note: "Review semantic actual-size caps before declaring a missing large case.",
    });
  if (["linked-list-21", "trees-05", "trees-07"].includes(id)) {
    const nodes =
      id === "linked-list-21"
        ? m.inputSchema.properties.head.maxLength
        : m.semanticConstraints.find(
            (r) => r.kind === "tree-level" && r.field === "root",
          ).maxNodes;
    const rows =
      id === "linked-list-21" ? m.inputSchema.properties.k.maximum : nodes;
    report.structuralOutputProofs.push({
      id,
      maxCells: nodes,
      maxRows: rows,
      maxActualVisits: 1 + nodes + rows,
      reason:
        id === "linked-list-21"
          ? "Every original node belongs to exactly one part; empty parts add only row nodes."
          : "Every original tree node occurs exactly once across the output rows.",
    });
  }
  report.manifests.push(row);
}
writeFileSync(
  "docs/release-evidence/owned-domain-budget-audit.json",
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify(
    {
      manifests: report.manifests.length,
      confirmedInputRejections: report.confirmedInputRejections,
      potentialOutputBounds: report.potentialOutputBounds,
    },
    null,
    2,
  ),
);
