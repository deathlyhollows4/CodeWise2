import { seeded } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { validateInput } from "../../packages/judge-adapter/src/schema-validator.mjs";
import { validateSemantics } from "../../packages/judge-adapter/src/semantic.mjs";
import { writeFileSync } from "node:fs";
function schedules(
  { release, duration, deadline },
  ignoreRelease = false,
  strictDeadline = false,
  ignoreDeadline = false,
) {
  const out = [],
    path = [],
    used = Array(release.length).fill(false);
  function visit(time) {
    if (path.length === release.length) {
      out.push([...path]);
      return;
    }
    for (let id = 0; id < release.length; id++) {
      if (used[id]) continue;
      const finish =
        Math.max(time, ignoreRelease ? 0 : release[id]) + duration[id];
      if (
        !ignoreDeadline &&
        (strictDeadline ? finish >= deadline[id] : finish > deadline[id])
      )
        continue;
      used[id] = true;
      path.push(id);
      visit(finish);
      path.pop();
      used[id] = false;
    }
  }
  visit(0);
  return out;
}
function permutationOracle({ release, duration, deadline }) {
  const n = release.length,
    p = Array.from({ length: n }, (_, i) => i),
    out = [];
  while (true) {
    let time = 0,
      valid = true;
    for (const id of p) {
      time = Math.max(time, release[id]) + duration[id];
      if (time > deadline[id]) {
        valid = false;
        break;
      }
    }
    if (valid) out.push([...p]);
    let i = n - 2;
    while (i >= 0 && p[i] >= p[i + 1]) i--;
    if (i < 0) break;
    let j = n - 1;
    while (p[j] <= p[i]) j--;
    [p[i], p[j]] = [p[j], p[i]];
    for (let a = i + 1, b = n - 1; a < b; a++, b--) [p[a], p[b]] = [p[b], p[a]];
  }
  return out;
}
const visible = [
  {
    input: { release: [0, 0], duration: [2, 1], deadline: [2, 3] },
    expected: [[0, 1]],
    explanation:
      "Task 0 must finish by time 2; placing task 1 first would make task 0 finish too late.",
  },
  {
    input: { release: [0, 0], duration: [1, 1], deadline: [2, 2] },
    expected: [
      [0, 1],
      [1, 0],
    ],
    explanation:
      "Original task IDs stay distinct even though their release, duration, and deadline are equal.",
  },
  {
    input: { release: [], duration: [], deadline: [] },
    expected: [[]],
    explanation: "There is one empty execution order for no tasks.",
  },
];
function cases() {
  const out = [],
    seen = new Set(visible.map((c) => JSON.stringify(c.input)));
  function add(input, category) {
    const key = JSON.stringify(input);
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ input, category });
  }
  for (const input of [
    { release: [0], duration: [1], deadline: [0] },
    { release: [0], duration: [1], deadline: [1] },
    { release: [5], duration: [2], deadline: [7] },
    { release: [5], duration: [2], deadline: [6] },
    { release: [7], duration: [1], deadline: [6] },
    { release: [0, 3], duration: [2, 1], deadline: [2, 4] },
    { release: [3, 0], duration: [1, 2], deadline: [4, 2] },
    { release: [0, 0], duration: [2, 2], deadline: [2, 2] },
    { release: [0, 0, 0], duration: [1, 1, 1], deadline: [3, 3, 3] },
    {
      release: [0, 0, 0, 0, 0, 0, 0],
      duration: [1, 1, 1, 1, 1, 1, 1],
      deadline: [7, 7, 7, 7, 7, 7, 7],
    },
    {
      release: [0, 0, 0, 0, 0, 0, 0],
      duration: [
        1000000000, 1000000000, 1000000000, 1000000000, 1000000000, 1000000000,
        1000000000,
      ],
      deadline: [
        1000000000, 2000000000, 3000000000, 4000000000, 5000000000, 6000000000,
        7000000000,
      ],
    },
    {
      release: [0, 0, 0, 0, 0, 0, 0],
      duration: [
        1000000000, 1000000000, 1000000000, 1000000000, 1000000000, 1000000000,
        1000000000,
      ],
      deadline: [
        7000000000, 6000000000, 5000000000, 4000000000, 3000000000, 2000000000,
        1000000000,
      ],
    },
    { release: [1000000000], duration: [1000000000], deadline: [2000000000] },
    {
      release: [
        1000000000, 1000000000, 1000000000, 1000000000, 1000000000, 1000000000,
        1000000000,
      ],
      duration: [
        1000000000, 1000000000, 1000000000, 1000000000, 1000000000, 1000000000,
        1000000000,
      ],
      deadline: [
        2000000000, 3000000000, 4000000000, 5000000000, 6000000000, 7000000000,
        8000000000,
      ],
    },
    {
      release: [1000000000, 0],
      duration: [1000000000, 1000000000],
      deadline: [1999999999, 8000000000],
    },
    { release: [0, 10, 0], duration: [5, 1, 5], deadline: [10, 11, 10] },
    { release: [9, 0, 0], duration: [1, 4, 4], deadline: [10, 4, 8] },
  ])
    add(
      input,
      "inclusive-endpoint-idle-release-impossible-and-wide-time-boundary",
    );
  const random = seeded(0xb710);
  let serial = 0;
  while (out.length < 60) {
    const n = 2 + (serial % 6),
      duration = Array.from({ length: n }, () => 1 + ((random() >>> 12) % 9)),
      release = Array.from({ length: n }, () => (random() >>> 12) % 13),
      deadline = Array(n),
      order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = (random() >>> 12) % (i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    let time = 0;
    for (const id of order) {
      time = Math.max(time, release[id]) + duration[id];
      deadline[id] = time + ((random() >>> 12) % 5);
    }
    if (serial % 3 === 0) deadline[order[n - 1]] = 0;
    add(
      { release, duration, deadline },
      serial % 3
        ? "feasible-derived-order-with-variable-release-slack"
        : "explicit-impossible-positive-task-deadline",
    );
    serial++;
  }
  return out;
}
const fn = {
    arguments: [
      { name: "release", type: "long[]" },
      { name: "duration", type: "long[]" },
      { name: "deadline", type: "long[]" },
    ],
    returnType: "int[][]",
  },
  starters = buildFunctionStarters(fn),
  array = (minimum, maximum) => ({
    kind: "array",
    maxLength: 7,
    items: { kind: "integer", minimum, maximum },
  });
export const definitions = [
  {
    id: "backtracking-10",
    slug: "enumerate-release-deadline-single-resource-orders",
    title: "Find every feasible order on one resource",
    primaryTopic: "backtracking",
    step: 5,
    skillIds: [
      "backtracking.branch-restoration",
      "backtracking.used-item-state",
      "numbers.signed-accumulation",
      "backtracking.schedule-prefix-pruning",
    ],
    prerequisites: [
      "backtracking.branch-restoration",
      "backtracking.used-item-state",
      "numbers.signed-accumulation",
    ],
    remedialIds: ["backtracking-02", "backtracking-04"],
    checkpointIds: ["backtracking-09"],
    nextIds: [],
    objective:
      "Enumerate all original-task orders feasible under release times, durations and inclusive deadlines, pruning failed prefixes.",
    rationale:
      "All tasks must execute; this is not selecting maximum reward, optimizing one ordering, or enumerating arbitrary idle times. Release times and nonpreemption make a fixed order’s earliest schedule the correct feasibility certificate.",
    statement:
      "## One resource, all tasks\n\nTask i is identified by its original array position. It cannot start before `release[i]`, takes `duration[i]` time without interruption, and must finish at or before `deadline[i]`. One resource executes at most one task at a time. Time starts at zero, and every task must execute exactly once.\n\nReturn every feasible task order as an array of original task IDs. For a proposed order, schedule each task as early as possible: its start is the larger of the previous finish time and its release time. Do not list start times or additional voluntary idle periods; for a fixed order, starting later cannot improve deadline feasibility. Sort answer rows lexicographically by their task-ID arrays. Tasks with identical metadata remain distinct original IDs.\n\nReturn an empty array if no full order exists. With no tasks, return the one empty order, `[[]]`. Finishing exactly at a deadline is allowed.\n\n### Native interface\n\n`solve(release, duration, deadline)` receives three native wide-integer arrays of equal length and returns an integer matrix of execution orders. Accumulate time with wide integers: supported schedules may reach eight billion time units.",
    constraints: [
      "0 ≤ release.length = duration.length = deadline.length ≤ 7.",
      "Release times lie in [0,1,000,000,000].",
      "Durations lie in [1,1,000,000,000].",
      "Deadlines lie in [0,8,000,000,000]; impossible deadlines are valid input.",
      "No preemption or parallel execution is allowed.",
      "At most 7! = 5,040 task orders exist; all answer rows include every original ID once.",
    ],
    interface:
      "Solution.solve(release:long[],duration:long[],deadline:long[]) returns lexicographically ordered int[][].",
    inputSchema: {
      kind: "object",
      properties: {
        release: array(0, 1000000000),
        duration: array(1, 1000000000),
        deadline: array(0, 8000000000),
      },
    },
    semanticConstraints: [
      { kind: "lengths-equal", left: "release", right: "duration" },
      { kind: "lengths-equal", left: "release", right: "deadline" },
    ],
    valid: ({ release, duration, deadline }) =>
      release.length === duration.length && release.length === deadline.length,
    outputSchema: {
      kind: "array",
      maxLength: 5040,
      items: {
        kind: "array",
        maxLength: 7,
        items: { kind: "integer", minimum: 0, maximum: 6 },
      },
    },
    function: fn,
    generatorModule: "content/authoring/backtracking-schedules.mjs",
    generate: cases,
    oracle: schedules,
    independent: permutationOracle,
    visible,
    mutations: {
      "ignore-release-times": (i) => schedules(i, true),
      "treat-deadline-as-exclusive": (i) => schedules(i, false, true),
      "ignore-deadline-failures": (i) => schedules(i, false, false, true),
    },
    languages: {
      java: {
        starter: starters.java,
        reference:
          "class Solution {long[] release,duration,deadline;boolean[] used;int[] path;ArrayList<int[]> out;void visit(int at,long time){if(at==release.length){out.add(path.clone());return;}for(int id=0;id<release.length;id++){if(used[id])continue;long finish=Math.max(time,release[id])+duration[id];if(finish>deadline[id])continue;used[id]=true;path[at]=id;visit(at+1,finish);used[id]=false;}}public int[][] solve(long[] release,long[] duration,long[] deadline){this.release=release;this.duration=duration;this.deadline=deadline;used=new boolean[release.length];path=new int[release.length];out=new ArrayList<>();visit(0,0L);return out.toArray(new int[0][]);}}",
      },
      cpp: {
        starter: starters.cpp,
        reference:
          "class Solution {public:vector<vector<int>> solve(vector<long long> release,vector<long long> duration,vector<long long> deadline){int n=release.size();vector<vector<int>> out;vector<int> path(n);vector<bool> used(n,false);function<void(int,long long)> visit=[&](int at,long long time){if(at==n){out.push_back(path);return;}for(int id=0;id<n;id++){if(used[id])continue;long long finish=max(time,release[id])+duration[id];if(finish>deadline[id])continue;used[id]=true;path[at]=id;visit(at+1,finish);used[id]=false;}};visit(0,0);return out;}};",
      },
      python: {
        starter: starters.python,
        reference:
          "class Solution:\n    def solve(self, release, duration, deadline):\n        n=len(release)\n        out=[]\n        used=[False]*n\n        path=[]\n        def visit(time):\n            if len(path)==n:\n                out.append(list(path))\n                return\n            for task in range(n):\n                if used[task]:\n                    continue\n                finish=max(time,release[task])+duration[task]\n                if finish>deadline[task]:\n                    continue\n                used[task]=True\n                path.append(task)\n                visit(finish)\n                path.pop()\n                used[task]=False\n        visit(0)\n        return out\n",
      },
    },
  },
];
export function audit() {
  const d = definitions[0],
    hidden = cases(),
    seen = new Set(visible.map((c) => JSON.stringify(c.input))),
    failures = [];
  let bytes = 0,
    feasible = 0,
    max = 0;
  for (const c of [...hidden, ...visible]) {
    if (
      !validateInput(d.inputSchema, c.input) ||
      !validateSemantics(d.semanticConstraints, c.input) ||
      !d.valid(c.input)
    )
      failures.push("input rejection");
    if (hidden.includes(c)) {
      const key = JSON.stringify(c.input);
      if (seen.has(key)) failures.push("duplicate hidden");
      seen.add(key);
    }
    const out = d.oracle(c.input);
    if (JSON.stringify(out) !== JSON.stringify(d.independent(c.input)))
      failures.push("independent mismatch");
    if (c.expected && JSON.stringify(out) !== JSON.stringify(c.expected))
      failures.push("visible mismatch");
    if (!validateInput(d.outputSchema, out)) failures.push("output rejection");
    bytes += Buffer.byteLength(JSON.stringify(out) + "\n");
    if (out.length) feasible++;
    max = Math.max(max, out.length);
  }
  if (hidden.length !== 60 || max !== 5040)
    failures.push("exact60/max missing");
  const mutations = Object.entries(d.mutations).map(([name, f]) => ({
    name,
    detected: hidden.some(
      (c) => JSON.stringify(f(c.input)) !== JSON.stringify(d.oracle(c.input)),
    ),
  }));
  for (const m of mutations)
    if (!m.detected) failures.push("undetected " + m.name);
  const stdout = bytes + 512 * 63,
    envelope = 2 * stdout + 65536;
  if (stdout > 4 * 1024 * 1024 || envelope > 6 * 1024 * 1024)
    failures.push("aggregate budget");
  const report = {
    timestamp: new Date().toISOString(),
    scope:
      "Trusted JS independent models/template sources only; no native execution",
    id: d.id,
    hidden: 60,
    visible: 3,
    feasible,
    maxRetainedAnswers: max,
    maximumOutputJsonNodes: 40321,
    outputBytes: bytes,
    conservativeStdoutBytes: stdout,
    conservativeEnvelopeBytes: envelope,
    mutations,
    failures,
  };
  writeFileSync(
    "docs/release-evidence/content-backtracking-schedules-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-backtracking-schedules-template-sources.json",
    JSON.stringify(
      { languages: d.languages, wrappers: buildFunctionHarness(d.function) },
      null,
      2,
    ),
  );
  console.log(report);
  if (failures.length) throw Error(JSON.stringify(failures));
  return report;
}
if (process.argv[1]?.endsWith("backtracking-schedules.mjs")) audit();
