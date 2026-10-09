// Trusted retained near-limit cases for previously small SW/Stack suites.
const n = 2000,
  up = () => Array.from({ length: n }, (_, i) => i),
  down = () => up().reverse(),
  flat = (value) => Array(n).fill(value),
  alternating = (a, b) => Array.from({ length: n }, (_, i) => (i % 2 ? b : a));
export function retainedMaxCases(id) {
  let inputs = [];
  switch (id) {
    case "sliding-window-03":
      inputs = [
        { values: flat(1), target: n },
        { values: flat(1), target: n + 1 },
        { values: flat(1000000), target: 2000000000 },
        { values: alternating(1, 1000000), target: 1000001 },
      ];
      break;
    case "sliding-window-04":
      inputs = [
        { text: "a".repeat(n) },
        {
          text: Array.from({ length: n }, (_, i) =>
            String.fromCharCode(97 + (i % 26)),
          ).join(""),
        },
        { text: "a".repeat(999) + "bc" + "a".repeat(999) },
      ];
      break;
    case "sliding-window-05":
      inputs = [
        { values: alternating(0, 1), k: 0 },
        { values: alternating(0, 1), k: 999 },
        { values: flat(0), k: n },
        { values: flat(0), k: 0 },
      ];
      break;
    case "sliding-window-06":
      inputs = [
        {
          text: "a".repeat(999) + "bb" + "a".repeat(999),
          pattern: "a".repeat(1000) + "b",
        },
        { text: "a".repeat(n), pattern: "a".repeat(n) },
        { text: "a".repeat(n), pattern: "z" },
        { text: "a".repeat(n), pattern: "" },
      ];
      break;
    case "sliding-window-07":
      inputs = [
        { text: "a".repeat(n), pattern: "a" },
        { text: "a".repeat(n), pattern: "a".repeat(n) },
        {
          text: Array.from({ length: n }, (_, i) =>
            String.fromCharCode(97 + (i % 26)),
          ).join(""),
          pattern: "abcdefghijklmnopqrstuvwxyz",
        },
      ];
      break;
    case "sliding-window-08":
      inputs = [
        { values: up(), k: 1 },
        { values: up(), k: n },
        { values: down(), k: 999 },
        { values: flat(7), k: 37 },
      ];
      break;
    case "sliding-window-10":
      inputs = [
        { values: up(), k: 0 },
        { values: up(), k: n },
        { values: up(), k: 3 },
        { values: alternating(-1000000, 1000000), k: 1 },
      ];
      break;
    case "sliding-window-11":
      inputs = [
        { values: up(), k: n },
        { values: flat(5), k: n },
        { values: flat(5), k: 1 },
        { values: [...Array(n - 1).fill(0), 1], k: 2 },
      ];
      break;
    case "sliding-window-12":
      inputs = [
        { values: up(), limit: 0 },
        { values: up(), limit: n - 1 },
        { values: alternating(-1000000, 1000000), limit: 1999999 },
        { values: alternating(-1000000, 1000000), limit: 2000000 },
        { values: flat(42), limit: 0 },
      ];
      break;
    case "stack-02":
      inputs = [
        {
          commands: [
            ...Array.from({ length: 1000 }, (_, i) => i + 1),
            ...Array(1000).fill(-1),
          ],
        },
        { commands: [...Array(1000).fill(-1), ...Array(1000).fill(1)] },
        { commands: flat(1000000) },
        { commands: alternating(1000000, -1) },
      ];
      break;
    case "stack-03":
      inputs = [
        { text: "a".repeat(n) },
        { text: "ab".repeat(1000) },
        { text: "ab".repeat(500) + "ba".repeat(500) },
        { text: "Aa".repeat(1000) },
      ];
      break;
    case "stack-04":
      inputs = [
        { values: up() },
        { values: down() },
        { values: flat(7) },
        { values: [...Array(n - 1).fill(7), 8] },
      ];
      break;
    case "stack-05":
      inputs = [
        { values: up() },
        { values: down() },
        { values: flat(7) },
        { values: [1000000, ...Array(n - 1).fill(-1000000)] },
      ];
      break;
    case "stack-06":
      inputs = [
        { values: flat(1000000) },
        { values: up() },
        { values: down() },
        { values: flat(0) },
        { values: alternating(0, 1000000) },
      ];
      break;
    case "stack-08":
      inputs = [
        { pushes: up(), pops: down() },
        { pushes: up(), pops: up() },
        {
          pushes: up(),
          pops: [1, 0, ...Array.from({ length: n - 2 }, (_, i) => i + 2)],
        },
        {
          pushes: up(),
          pops: [2, 0, 1, ...Array.from({ length: n - 3 }, (_, i) => i + 3)],
        },
        {
          pushes: up(),
          pops: [...Array.from({ length: n - 1 }, (_, i) => i), 0],
        },
        {
          pushes: up(),
          pops: [...Array.from({ length: n - 1 }, (_, i) => i), 999999],
        },
      ];
      break;
    case "stack-09":
      inputs = [
        {
          values: [...Array(1000).fill(999999), ...Array(1000).fill(-1000000)],
        },
        {
          values: [...Array(1000).fill(1000000), ...Array(1000).fill(-1000000)],
        },
        { values: flat(-1000000) },
        { values: flat(1000000) },
      ];
      break;
  }
  return inputs.map((input, index) => ({
    input,
    category: "retained-declared-max-" + id + "-" + (index + 1),
  }));
}
