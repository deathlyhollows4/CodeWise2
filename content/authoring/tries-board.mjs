import { seeded, logicalCases } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { writeFileSync } from "node:fs";
import { validateInput } from "../../packages/judge-adapter/src/schema-validator.mjs";
const neighbors = (position, rows, columns) => {
  const r = Math.floor(position / columns),
    c = position % columns,
    out = [];
  if (r) out.push(position - columns);
  if (c) out.push(position - 1);
  if (c + 1 < columns) out.push(position + 1);
  if (r + 1 < rows) out.push(position + columns);
  return out;
};
function boardWords({ board, words }, reuse = false, stopAtTerminal = false) {
  if (!board.length) return [];
  const root = { next: new Map(), word: null },
    found = new Set();
  for (const word of words) {
    let n = root;
    for (const letter of word) {
      if (!n.next.has(letter))
        n.next.set(letter, { next: new Map(), word: null });
      n = n.next.get(letter);
    }
    n.word = word;
  }
  const rows = board.length,
    columns = board[0].length;
  function visit(position, node, used, depth) {
    if (!reuse && used & (1 << position)) return;
    if (depth >= 8) return;
    const letter = board[Math.floor(position / columns)][position % columns],
      child = node.next.get(letter);
    if (!child) return;
    if (child.word) {
      found.add(child.word);
      if (stopAtTerminal) return;
    }
    for (const next of neighbors(position, rows, columns))
      visit(next, child, used | (1 << position), depth + 1);
  }
  for (let p = 0; p < rows * columns; p++) visit(p, root, 0, 0);
  return [...found].sort();
}
function directWords({ board, words }) {
  if (!board.length) return [];
  const rows = board.length,
    columns = board[0].length;
  return [...new Set(words)]
    .filter((word) => {
      const stack = [];
      for (let p = 0; p < rows * columns; p++) stack.push([p, 0, 0]);
      while (stack.length) {
        const [p, at, used] = stack.pop();
        if (
          used & (1 << p) ||
          board[Math.floor(p / columns)][p % columns] !== word[at]
        )
          continue;
        if (at + 1 === word.length) return true;
        for (const next of neighbors(p, rows, columns))
          stack.push([next, at + 1, used | (1 << p)]);
      }
      return false;
    })
    .sort();
}
function cases() {
  const random = seeded(0x7a1e03),
    out = [];
  for (let test = 0; test < 710; test++) {
    const rows = 1 + ((random() >>> 16) % 4),
      columns = 1 + ((random() >>> 16) % 4),
      board = Array.from({ length: rows }, () =>
        Array.from({ length: columns }, () =>
          String.fromCharCode(97 + (random() % 6)),
        ).join(""),
      ),
      words = [];
    for (let trial = 0; trial < 14; trial++) {
      let p = random() % (rows * columns),
        used = 0,
        word = "";
      const length = 1 + (random() % Math.min(8, rows * columns));
      for (let at = 0; at < length; at++) {
        word += board[Math.floor(p / columns)][p % columns];
        used |= 1 << p;
        const options = neighbors(p, rows, columns).filter(
          (next) => !(used & (1 << next)),
        );
        if (!options.length) break;
        p = options[random() % options.length];
      }
      words.push(word);
    }
    for (let trial = 0; trial < 12; trial++)
      words.push(
        Array.from({ length: 1 + (random() % 8) }, () =>
          String.fromCharCode(97 + (random() % 8)),
        ).join(""),
      );
    if (test % 9 === 0) words.push(words[0]);
    out.push({
      input: { board, words },
      category: "rectangular-feasible-and-missing-dictionary-paths",
    });
  }
  for (const input of [
    { board: ["ab", "cd"], words: [] },
    { board: ["ab", "cd"], words: ["zz", "zzz", "zzzz"] },
    {
      board: ["aaaa", "aaaa", "aaaa", "aaaa"],
      words: [
        ...Array.from({ length: 8 }, (_, i) => "a".repeat(i + 1)),
        "aaaaaaab",
        "bbbbbbbb",
      ],
    },
    { board: [], words: ["a"] },
    { board: ["a"], words: ["a", "aa", "aaa"] },
    { board: ["aa", "aa"], words: ["a", "aa", "aaa", "aaaa", "aaaaa"] },
    {
      board: ["ab", "cd"],
      words: ["aba", "abd", "acdb", "a", "abcd", "dcab", "ab", "ab"],
    },
  ])
    out.push({
      input,
      category: "empty-reuse-prefix-and-diagonal-counterexample",
    });
  const board = ["abcd", "efgh", "ijkl", "mnop"],
    found = new Set();
  function paths(p, used, word) {
    const nextWord = word + board[Math.floor(p / 4)][p % 4];
    found.add(nextWord);
    if (found.size >= 2000 || nextWord.length === 8) return;
    for (const next of neighbors(p, 4, 4))
      if (!(used & (1 << next))) {
        paths(next, used | (1 << next), nextWord);
        if (found.size >= 2000) return;
      }
  }
  for (let p = 0; p < 16 && found.size < 2000; p++) paths(p, 1 << p, "");
  if (found.size !== 2000)
    throw Error("Maximum dictionary fixture insufficient");
  out.push({
    input: { board, words: [...found] },
    category: "maximum-distinct-found-dictionary",
  });
  return out;
}
const word = { kind: "string", minLength: 1, maxLength: 8, ascii: true };
const d = {
  id: "tries-03",
  slug: "all-dictionary-words-on-native-letter-board",
  title: "Find the dictionary words on a letter board",
  primaryTopic: "tries",
  step: 2,
  skillIds: [
    "tries.prefix-navigation",
    "tries.board-prefix-pruning",
    "backtracking.branch-restoration",
    "tries.nonreused-word-path",
  ],
  prerequisites: ["tries.prefix-navigation", "backtracking.branch-restoration"],
  remedialIds: ["tries-01", "tries-02", "backtracking-01"],
  checkpointIds: [],
  nextIds: [],
  objective:
    "Find every distinct dictionary word formed by a nonrepeating orthogonal board path, sharing Trie prefix search across dictionary entries.",
  rationale:
    "Prefix branches constrain the next letter while visited cells are local to one path; a found word can be a prefix of another and must not stop deeper exploration.",
  statement:
    "## All dictionary words on the board\n\nReturn every distinct entry from `words` that can be formed on `board`. Start at any cell and move to a horizontally or vertically adjacent cell for each next letter. Do not move diagonally, wrap around an edge, or reuse a cell within one word path. A one-letter word may use one matching cell.\n\nPaths for different words are independent: finding one word does not consume its cells. Duplicate dictionary entries produce one result. A found word may be a prefix of a longer found word, so keep exploring its Trie branch. Return the found words in ascending lexicographic order. An empty board or dictionary returns an empty array.\n\n### Native interface\n\n`solve(board,words)` receives two native string arrays. board contains equal-length row strings; words contains the dictionary. All letters are lowercase ASCII. Return string[]. No character-table parsing is required. Build one Trie for the dictionary and search viable prefixes while tracking cells used on the current path.",
  constraints: [
    "The board has 0 to 4 rows; a nonempty board has 1 to 4 columns, with equal-length rows.",
    "0 ≤ words.length ≤ 2,000. Every dictionary word has 1 to 8 lowercase ASCII letters.",
    "Each word path uses distinct cells and only orthogonal neighboring positions.",
    "Return distinct found words in lexicographic order; input dictionary order does not matter.",
  ],
  interface:
    "Solution.solve(board,words) receives string[] row strings and dictionary, returns sorted string[].",
  inputSchema: {
    kind: "object",
    properties: {
      board: {
        kind: "array",
        maxLength: 4,
        items: { kind: "string", minLength: 1, maxLength: 4, ascii: true },
      },
      words: {
        kind: "array",
        maxLength: 2000,
        unordered: true,
        deduplicate: true,
        items: word,
      },
    },
  },
  semanticConstraints: [
    {
      kind: "rectangular-strings",
      field: "board",
      minColumns: 1,
      maxColumns: 4,
      maxRows: 4,
    },
    { kind: "alphabet", field: "board", alphabet: "lowercase", each: true },
    { kind: "alphabet", field: "words", alphabet: "lowercase", each: true },
  ],
  valid: ({ board }) =>
    !board.length || board.every((row) => row.length === board[0].length),
  outputSchema: { kind: "array", maxLength: 2000, items: word },
  function: {
    arguments: [
      { name: "board", type: "string[]" },
      { name: "words", type: "string[]" },
    ],
    returnType: "string[]",
  },
  generatorModule: "content/authoring/tries-board.mjs",
  generate: cases,
  visible: [
    {
      input: {
        board: ["ab", "cd"],
        words: ["aba", "abd", "acdb", "a", "abcd", "dcab", "ab", "ab"],
      },
      expected: ["a", "ab", "abd", "acdb", "dcab"],
      explanation:
        "Keep both short and longer prefix words. aba would reuse a cell and abcd would need a diagonal move; duplicate ab appears once.",
    },
    {
      input: { board: ["a"], words: ["a", "aa"] },
      expected: ["a"],
      explanation: "The only cell forms a but cannot be reused to form aa.",
    },
    {
      input: { board: [], words: ["a"] },
      expected: [],
      explanation: "No cell is available to begin a path.",
    },
  ],
  oracle: boardWords,
  independent: directWords,
  mutations: {
    "reuse-board-cells-in-one-path": (input) => boardWords(input, true),
    "stop-after-short-terminal-word": (input) => boardWords(input, false, true),
    "return-duplicates-in-dictionary-order": (input) => {
      const found = new Set(boardWords(input));
      return input.words.filter((word) => found.has(word));
    },
  },
  languages: {
    java: {
      starter: "GENERATE",
      reference:
        "class Solution {static class T{T[] next=new T[26];String word;}String[] board;int rows,columns;HashSet<String> found;void visit(int r,int c,T node,int used){int bit=1<<(r*columns+c);if((used&bit)!=0)return;T child=node.next[board[r].charAt(c)-'a'];if(child==null)return;if(child.word!=null)found.add(child.word);used|=bit;if(r>0)visit(r-1,c,child,used);if(c>0)visit(r,c-1,child,used);if(c+1<columns)visit(r,c+1,child,used);if(r+1<rows)visit(r+1,c,child,used);}public String[] solve(String[] board,String[] words){if(board.length==0)return new String[0];this.board=board;rows=board.length;columns=board[0].length();found=new HashSet<>();T root=new T();for(String word:words){T node=root;for(int i=0;i<word.length();i++){int at=word.charAt(i)-'a';if(node.next[at]==null)node.next[at]=new T();node=node.next[at];}node.word=word;}for(int r=0;r<rows;r++)for(int c=0;c<columns;c++)visit(r,c,root,0);String[] result=found.toArray(new String[0]);Arrays.sort(result);return result;}}",
    },
    cpp: {
      starter: "GENERATE",
      reference:
        "class Solution {struct T{array<int,26> next;string word;T(){next.fill(-1);}};public:vector<string> solve(vector<string> board,vector<string> words){if(board.empty())return {};vector<T> trie(1);for(auto& word:words){int node=0;for(char c:word){int at=c-'a';if(trie[node].next[at]==-1){trie[node].next[at]=trie.size();trie.emplace_back();}node=trie[node].next[at];}trie[node].word=word;}int rows=board.size(),columns=board[0].size();set<string> found;function<void(int,int,int,int)> visit=[&](int r,int c,int node,int used){int bit=1<<(r*columns+c);if(used&bit)return;int child=trie[node].next[board[r][c]-'a'];if(child==-1)return;if(!trie[child].word.empty())found.insert(trie[child].word);used|=bit;if(r)visit(r-1,c,child,used);if(c)visit(r,c-1,child,used);if(c+1<columns)visit(r,c+1,child,used);if(r+1<rows)visit(r+1,c,child,used);};for(int r=0;r<rows;r++)for(int c=0;c<columns;c++)visit(r,c,0,0);return vector<string>(found.begin(),found.end());}};",
    },
    python: {
      starter: "GENERATE",
      reference:
        'class Solution:\n    def solve(self, board, words):\n        if not board:\n            return []\n        trie={}\n        for word in words:\n            node=trie\n            for letter in word:\n                node=node.setdefault(letter,{})\n            node["#"]=word\n        rows,columns=len(board),len(board[0])\n        found=set()\n        def visit(r,c,node,used):\n            bit=1<<(r*columns+c)\n            if used&bit:\n                return\n            child=node.get(board[r][c])\n            if child is None:\n                return\n            if "#" in child:\n                found.add(child["#"])\n            used|=bit\n            if r:\n                visit(r-1,c,child,used)\n            if c:\n                visit(r,c-1,child,used)\n            if c+1<columns:\n                visit(r,c+1,child,used)\n            if r+1<rows:\n                visit(r+1,c,child,used)\n        for r in range(rows):\n            for c in range(columns):\n                visit(r,c,trie,0)\n        return sorted(found)\n',
    },
  },
};
export const definitions = [d];
const starters = buildFunctionStarters(d.function);
for (const language of ["java", "cpp", "python"])
  d.languages[language].starter = starters[language];
export function audit() {
  const hidden = logicalCases(d),
    report = {
      timestamp: new Date().toISOString(),
      scope:
        "Tries03 source-only author/independent word-search audit; rectangular runtime guard pending, no native reference execution",
      id: d.id,
      candidates: hidden.length,
      visible: 3,
      feasibleCases: 0,
      aggregateOutputBytes: 0,
      mutations: [],
      failures: [],
    };
  for (const c of [...d.visible, ...hidden]) {
    const result = d.oracle(c.input);
    if (
      !d.valid(c.input) ||
      !validateInput(d.inputSchema, c.input) ||
      !validateInput(d.outputSchema, result)
    )
      report.failures.push("schema/rectangle rejection");
    if (JSON.stringify(result) !== JSON.stringify(d.independent(c.input)))
      report.failures.push("independent mismatch");
    if (
      c.expected !== undefined &&
      JSON.stringify(result) !== JSON.stringify(c.expected)
    )
      report.failures.push("expected mismatch");
    if (result.length) report.feasibleCases++;
    report.aggregateOutputBytes += Buffer.byteLength(
      JSON.stringify(result) + "\n",
    );
  }
  report.boardDimensions = [
    ...new Set(
      hidden.map(
        (c) => c.input.board.length + "x" + (c.input.board[0]?.length || 0),
      ),
    ),
  ].sort();
  report.conservativeStdoutBytes =
    report.aggregateOutputBytes + 512 * (hidden.length + 3);
  report.conservativeEnvelopeBytes = 2 * report.conservativeStdoutBytes + 65536;
  if (
    report.conservativeStdoutBytes > 4 * 1024 * 1024 ||
    report.conservativeEnvelopeBytes > 6 * 1024 * 1024
  )
    report.failures.push("aggregate output capacity exceeded");
  report.mutations = Object.entries(d.mutations).map(([name, fn]) => ({
    name,
    detected: hidden.some(
      (c) => JSON.stringify(fn(c.input)) !== JSON.stringify(c.expected),
    ),
  }));
  for (const m of report.mutations)
    if (!m.detected) report.failures.push("mutation " + m.name);
  writeFileSync(
    "docs/release-evidence/content-tries-board-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-tries-board-template-sources.json",
    JSON.stringify([
      {
        id: d.id,
        languages: d.languages,
        wrappers: buildFunctionHarness(d.function),
      },
    ]),
  );
  console.log(report);
  if (report.failures.length) throw Error(JSON.stringify(report.failures));
}
if (process.argv[1]?.endsWith("tries-board.mjs")) audit();
