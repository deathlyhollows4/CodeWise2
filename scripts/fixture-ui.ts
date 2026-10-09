import { createApp } from "../apps/server/src/app.ts";

import { join } from "node:path";

import { randomUUID } from "node:crypto";

import { mkdtempSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { tmpdir } from "node:os";

const dir =
  process.env.CODEWISE2_FIXTURE_DATA_DIR ??
  mkdtempSync(join(tmpdir(), "codewise2-visible-test-fixture-"));
const controlledStream = process.env.CODEWISE2_FIXTURE_STREAM === "1";
const fullPreview = process.env.CODEWISE2_FIXTURE_FULL_CATALOGUE === "1";
const previewLoader: any = fullPreview
  ? await import(
      pathToFileURL(resolve("packages/judge-adapter/src/index.mjs")).href
    )
  : null;
const previewReviewTools: any = fullPreview
  ? await import(
      pathToFileURL(resolve("packages/judge-adapter/src/pack-validation.mjs"))
        .href
    )
  : null;
const previewCatalogue: any[] = fullPreview
  ? await previewLoader.loadCatalogue({ includeDrafts: true })
  : [];
const previewSources = fullPreview
  ? await Promise.all(
      previewCatalogue.map(async (problem) => {
        const pack = await previewLoader.getPrivatePack(problem.id);
        return {
          ...pack.provenance,
          problemId: problem.id,
          title: problem.title,
          reviewIdentity: previewReviewTools.packIdentity(pack),
        };
      }),
    )
  : undefined;
const fixtureProvider = controlledStream
  ? {
      models: async () => ["fixture-controlled-stream"],
      stream: async (
        _key: string,
        _model: string,
        _messages: unknown,
        _limit: number,
        signal: AbortSignal,
        onChunk: (text: string) => void,
      ) => {
        onChunk(
          "# Controlled fixture stream\n\nThis is a local test provider. No external AI request or real credential is used.\n\n",
        );
        for (let i = 1; i <= 150; i++) {
          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => {
              signal.removeEventListener("abort", abort);
              resolve();
            }, 110);
            const abort = () => {
              clearTimeout(timer);
              reject(new Error("Fixture stream canceled"));
            };
            signal.addEventListener("abort", abort, { once: true });
          });
          if (signal.aborted) throw new Error("Fixture stream canceled");
          onChunk(
            `Fixture paragraph ${i}: keep the saved and live answer identical. This line exists only to exercise durable batching and reconnect recovery.\n\n`,
          );
        }
        return { finishReason: "stop" };
      },
    }
  : undefined;

const visualProblem = {
  schemaVersion: 1,

  id: "fixture-running-total",

  version: "fixture-1",

  slug: "fixture-running-total",

  title: "Running total · browser fixture",

  primaryTopic: "arrays-hashing",

  skillIds: ["running-total"],

  prerequisites: [],

  step: 1,

  status: "published",

  statement:
    "## Keep a running total\n\nGiven an array of integers, return their sum. This is an explicitly marked visual test fixture, excluded from the released question bank.\n\n### Think about empty inputs\n\nAn empty array has total zero. Negative numbers count too.",

  objective: "Practise maintaining an accumulator.",

  constraints: [
    "0 ≤ array length ≤ 10,000",

    "Every value is a signed 32-bit integer",
  ],

  interface: "Return an integer from solve(values).",

  visibleCases: [
    {
      id: "ordinary",

      input: [2, 4, 1],

      expected: 7,

      explanation: "2 + 4 + 1 = 7.",
    },

    {
      id: "boundary",

      input: [],

      expected: 0,

      explanation: "No values means total zero.",
    },

    {
      id: "tricky",

      input: [-3, 3, 9],

      expected: 9,

      explanation: "Opposite values cancel.",
    },
  ],

  starters: {
    java: "class Solution {\n    public long solve(int[] values) {\n        return 0;\n    }\n}",

    cpp: "class Solution {\npublic:\n    long long solve(vector<int> values) {\n        return 0;\n    }\n};",

    python: "class Solution:\n    def solve(self, values):\n        return 0\n",
  },

  sourceIds: ["original-test-fixture"],
};

visualProblem.statement +=
  "\n\n## Representation and reasoning\n\n" +
  Array.from(
    { length: 6 },
    (_, i) =>
      `### Reading note ${i + 1}\n\nThe input is an ordered list of signed integers. Return one integer total without modifying the input. A useful invariant describes the values already visited, so it helps explain why the result is correct when the loop ends. This longer statement is explicit browser test content, excluded from the published release catalogue.`,
  ).join("\n\n");
const problem = fullPreview
  ? previewCatalogue.find((entry) => entry.id === "arrays-hashing-01")
  : visualProblem;
if (!problem)
  throw new Error(
    "Full catalogue fixture could not select its saved-lesson problem",
  );
const app = createApp({
  dataDir: dir,

  catalogue: fullPreview ? previewCatalogue : [problem],
  sources: previewSources,
  learningMetadata: fullPreview
    ? previewLoader.getPublicLearningMetadata
    : undefined,
  internalFixtureIds: fullPreview
    ? previewCatalogue.map((entry) => entry.id)
    : [],

  fixture: true,
  tutorFixture: controlledStream,
  provider: fixtureProvider,
  onStop: () => {
    app.close();
    process.exit(0);
  },
} as any);
if (controlledStream) {
  app.store.setMeta("keyMetadata", {
    configured: true,
    masked: "LOCAL FIXTURE ONLY - no real key",
    status: "fixture",
    version: "controlled-local-fixture",
    lastChecked: null,
  });
  app.store.setMeta("modelCapabilities", {
    keyVersion: "controlled-local-fixture",
    models: ["fixture-controlled-stream"],
    checkedAt: new Date().toISOString(),
  });
  app.store.setMeta("preferences", {
    ...app.store.meta("preferences"),
    model: "fixture-controlled-stream",
    dailyRequests: 100,
    dailyTokens: 500000,
    dailySpendUsd: null,
  });
}

const id = randomUUID();

const markdown =
  "# The key idea\n\nAn **accumulator** is a variable that keeps a result as you work through the input. Start the total at zero, then add each value once.\n\n## Walk through a small example\n\n| Value | Previous total | New total |\n|---|---:|---:|\n| 2 | 0 | 2 |\n| 4 | 2 | 6 |\n| 1 | 6 | 7 |\n\n## Build the approach\n\n1. Set `total` to zero.\n2. Visit each number in order.\n3. Add the number to `total`.\n4. Return the total after the loop.\n\n```python\nclass Solution:\n    def solve(self, values):\n        total = 0\n        for value in values:\n            total += value\n        return total\n```\n\n## Time and space complexity\n\nThe time is $O(n)$, where $n$ is the number of values. The extra space is $O(1)$ because the total uses one variable.\n\n> **Verification:** This is a saved browser test fixture. It is not a live DeepSeek response and its code has not been judged.\n\n## What to try next\n\nTry explaining why an empty array returns zero. Then return to the problem and write your own version.";

app.store.insert("generations", {
  id,

  idempotencyKey: randomUUID(),

  threadId: randomUUID(),

  problemId: problem.id,

  problemVersion: problem.version,

  language: "python",

  action: "solution",

  prompt: "Show me the idea using a small example.",

  code: "",

  consent: true,

  title: "Running totals: a simple walkthrough · fixture",

  markdown,

  status: "complete",

  createdAt: new Date().toISOString(),

  finishedAt: new Date().toISOString(),

  provider: "fixture",

  model: "fixture-no-inference",

  version: 1,

  schemaVersion: 1,

  rendererVersion: 1,

  notes: "",

  tags: ["fixture"],

  bookmarked: true,

  usage: null,

  verification: "not-run",

  document: {
    schemaVersion: 1,

    title: "Running totals",

    markdown,

    sections: [{ id: "idea", kind: "general", markdown }],

    language: "python",

    verification: "not-run",
  },
});

const original = app.store.get("generations", id);
const simpler =
  "# The key idea\n\nThink of `total` as a running receipt. It starts at zero. Each number adds one more line to the receipt.\n\n```python\ntotal = 0\nfor value in values:\n    total += value\n```\n\nFor `[2, 4, 1]`, the receipt changes from `0` to `2`, then `6`, then `7`.\n\n> This is a second saved browser fixture version. It makes no provider call and the code has not been judged.";
app.store.insert("generations", {
  ...original,
  id: randomUUID(),
  idempotencyKey: randomUUID(),
  parentId: id,
  version: 2,
  action: "simplify",
  prompt: "Explain this more simply.",
  title: "Running totals: a simpler explanation - fixture",
  markdown: simpler,
  createdAt: new Date().toISOString(),
  document: {
    ...original.document,
    title: "A running receipt",
    markdown: simpler,
    sections: [{ id: "idea", kind: "idea", markdown: simpler }],
  },
});

const fixtureJobId = randomUUID(),
  at = new Date(Date.now() - 2 * 86400000).toISOString();
if (!fullPreview) {
  app.store.insert("jobs", {
    id: fixtureJobId,
    idempotencyKey: randomUUID(),
    problemId: problem.id,
    problemVersion: problem.version,
    language: "python",
    code: "class Solution:\n    def solve(self, values):\n        return sum(values)\n",
    mode: "submit",
    review: false,
    status: "accepted",
    createdAt: at,
    finishedAt: at,
    result: {
      status: "accepted",
      counts: { total: 3, executed: 3, passed: 3, failed: 0, notRun: 0 },
      diagnostics:
        "Explicit test-only simulated result for browser QA. No isolated execution occurred.",
    },
  });
  app.store.db.prepare("INSERT INTO evidence VALUES (?,?)").run(
    fixtureJobId,
    JSON.stringify({
      id: fixtureJobId,
      problemId: problem.id,
      language: "python",
      step: 1,
      skills: problem.skillIds,
      skillIds: problem.skillIds,
      outcome: "accepted",
      assisted: true,
      review: false,
      advancementEligible: true,
      ruleVersion: "fixture-not-live",
      classification: "assisted",
      createdAt: at,
    }),
  );
  app.store.assistance(problem.id, "solution");
}

const traceRows = Array.from(
  { length: 30 },
  (_, i) => `| ${i} | ${i + 1} | ${((i + 1) * (i + 2)) / 2} |`,
).join("\n");
const codeLines = Array.from(
  { length: 46 },
  (_, i) =>
    `    # Trace checkpoint ${i + 1}: the accumulator stores only the visited prefix.`,
).join("\n");
const longProse = Array.from(
  { length: 8 },
  (_, i) =>
    `### Study checkpoint ${i + 1}\n\nBefore the loop starts, no values have been visited, so the total is zero. After each addition, the total matches exactly the values already visited. This statement is called an invariant: it remains true each time the loop advances. Negative values still add normally. An empty list therefore needs no special loop body. Explain this in your own words before trying a new challenge.`,
).join("\n\n");
const partialMarkdown = `# A running total: saved partial fixture\n\n> Interrupted - partial test answer saved. This is development-only test data, not a live provider response or judged code.\n\n${longProse}\n\n## A longer trace\n\n| Position | Value | Running total |\n|---|---:|---:|\n${traceRows}\n\n## Code under discussion\n\n\`\`\`python\nclass Solution:\n    def solve(self, values):\n        total = 0\n${codeLines}\n        for value in values:\n            total += value\n        return total\n`;
const partialId = randomUUID();
app.store.insert("generations", {
  ...original,
  id: partialId,
  idempotencyKey: randomUUID(),
  threadId: randomUUID(),
  title: "Running totals - interrupted long fixture",
  action: "walkthrough",
  markdown: partialMarkdown,
  status: "interrupted",
  version: 1,
  bookmarked: false,
  prompt: "Show a longer trace and explain the invariant.",
  finishReason: "fixture-interruption",
  document: {
    ...original.document,
    title: "Saved partial answer",
    markdown: partialMarkdown,
    sections: [{ id: "partial", kind: "general", markdown: partialMarkdown }],
  },
});
if (process.env.CODEWISE2_FIXTURE_HISTORY === "1") {
  const threadId = "43000000-0000-4000-8000-000000000001";
  const lessonId = (i: number) =>
    `43000000-0000-4000-8001-${String(i).padStart(12, "0")}`;
  const jobId = (i: number) =>
    `43000000-0000-4000-8002-${String(i).padStart(12, "0")}`;
  for (let i = 1; i <= 68; i++) {
    const createdAt = new Date(Date.UTC(2026, 8, 1, 0, i)).toISOString();
    const body =
      `# Paging test fixture version ${i}\n\n> Explicit development fixture: not a provider response, not executed, excluded from the core bank.\n\n` +
      Array.from(
        { length: 55 },
        (_, n) =>
          `Paragraph ${n + 1}: this labelled text tests complete saved history and bounded summaries. The content is constructed locally for browser checks; it grants no real learner execution or live model claim.`,
      ).join("\n\n") +
      (i === 1
        ? "\n\nR43_OLDEST_PAGE_TAIL_MATCH: this unique phrase is beyond the first page and far beyond its preview."
        : "");
    const id = lessonId(i);
    if (!app.store.get("generations", id))
      app.store.insert("generations", {
        ...original,
        id,
        idempotencyKey: id,
        threadId,
        version: i,
        parentId: i > 1 ? lessonId(i - 1) : undefined,
        title: `Paging fixture version ${i} - locally constructed`,
        action: "followup",
        status: "complete",
        markdown: body,
        code:
          `# Immutable paging fixture code ${i}; not submitted or executed\nclass Solution:\n    def solve(self, values):\n        return ${i}\n` +
          "# fixture-only source padding\n".repeat(100),
        prompt: `Explicit paging fixture version ${i}`,
        createdAt,
        finishedAt: createdAt,
        bookmarked: i % 2 === 0,
        notes: "Explicit paging test fixture",
        tags: ["fixture", "paging"],
        usage: null,
        verification: "not-run",
        provider: "fixture",
        model: "fixture-controlled-stream",
        document: {
          ...original.document,
          title: `Paging fixture ${i}`,
          markdown: body,
          sections: [{ id: "fixture-body", kind: "general", markdown: body }],
        },
      });
    const jid = jobId(i);
    if (!app.store.get("jobs", jid))
      app.store.insert("jobs", {
        id: jid,
        idempotencyKey: jid,
        problemId: problem.id,
        problemVersion: problem.version,
        problemSnapshot: problem,
        language: "python",
        code: `# Immutable history fixture ${i}: never executed\nclass Solution:\n    def solve(self, values):\n        return ${i}\n`,
        mode: "submit",
        review: false,
        meaningfulConceptualAttempt: false,
        status: "infrastructure_error",
        createdAt,
        finishedAt: createdAt,
        result: {
          status: "infrastructure_error",
          counts: { total: 3, executed: 0, passed: 0, failed: 0, notRun: 3 },
          diagnostics: `Explicit paging fixture ${i}; no compilation or execution occurred.`,
        },
      });
  }
  console.log(
    "Paging fixture seeded:68 saved versions and68 non-executed job histories; no execution evidence.",
  );
}
const port = Number(process.env.PORT ?? 3100);

app.server.listen(port, "127.0.0.1", () => {
  if (fullPreview)
    writeFileSync(
      resolve("docs/release-evidence/final-catalogue-ui-fixture.json"),
      JSON.stringify(
        {
          schemaVersion: 1,
          kind: "full-catalogue-local-fixture-no-runner-no-provider",
          address: `http://127.0.0.1:${port}`,
          pid: process.pid,
          dataDir: dir,
          catalogue: {
            preview: previewCatalogue.filter((p) => p.status !== "published")
              .length,
            published: previewCatalogue.filter((p) => p.status === "published")
              .length,
          },
          apiVersion: 2,
          controlledProvider: controlledStream,
          simulatedAcceptedEvidence: false,
          startedAt: new Date().toISOString(),
          command: "node --import tsx scripts/fixture-ui.ts",
          environmentNames: [
            "PORT",
            "CODEWISE2_FIXTURE_DATA_DIR",
            "CODEWISE2_FIXTURE_HISTORY",
            "CODEWISE2_FIXTURE_FULL_CATALOGUE",
          ],
        },
        null,
        2,
      ),
    );
  console.log(
    `VISIBLE TEST FIXTURE http://127.0.0.1:${port}\nTemporary data: ${dir}`,
  );
});

for (const s of ["SIGINT", "SIGTERM"] as const)
  process.on(s, () => {
    app.close();

    process.exit(0);
  });
