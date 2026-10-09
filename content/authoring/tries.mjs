import { seeded, logicalCases } from "./pack-builder.mjs";
import { buildFunctionStarters, buildFunctionHarness } from "./harness.mjs";
import { writeFileSync } from "node:fs";
import { inputKey } from "../../packages/judge-adapter/src/canonical.mjs";
function trie(words) {
  const root = { next: new Map(), end: false };
  for (const word of words) {
    let node = root;
    for (const letter of word) {
      if (!node.next.has(letter))
        node.next.set(letter, { next: new Map(), end: false });
      node = node.next.get(letter);
    }
    node.end = true;
  }
  return root;
}
function replaceRoots({ roots, words }, longest = false) {
  const root = trie(roots);
  return words.map((word) => {
    let node = root,
      found = null,
      prefix = "";
    for (const letter of word) {
      node = node.next.get(letter);
      if (!node) break;
      prefix += letter;
      if (node.end) {
        found = prefix;
        if (!longest) break;
      }
    }
    return found ?? word;
  });
}
function replaceIndependent({ roots, words }) {
  return words.map((word) => {
    let best = null;
    for (const prefix of roots)
      if (word.startsWith(prefix) && (!best || prefix.length < best.length))
        best = prefix;
    return best ?? word;
  });
}
function wildcard({ words, pattern }, prefixAccept = false) {
  const root = trie(words),
    stack = [[root, 0]];
  while (stack.length) {
    const [node, at] = stack.pop();
    if (at === pattern.length) {
      if (prefixAccept || node.end) return true;
      continue;
    }
    const letter = pattern[at];
    if (letter === "?")
      for (const child of node.next.values()) stack.push([child, at + 1]);
    else if (node.next.has(letter)) stack.push([node.next.get(letter), at + 1]);
  }
  return false;
}
function wildcardIndependent({ words, pattern }) {
  return words.some(
    (word) =>
      word.length === pattern.length &&
      [...word].every((c, i) => pattern[i] === "?" || pattern[i] === c),
  );
}
function generators() {
  const random = seeded(0x7a1e21),
    word = () => {
      const length = 1 + (random() % 8);
      return Array.from({ length }, () =>
        String.fromCharCode(97 + (random() % 7)),
      ).join("");
    };
  const rootCases = [],
    patternCases = [];
  for (let i = 0; i < 700; i++) {
    const roots = Array.from({ length: 1 + (random() % 16) }, word),
      words = Array.from({ length: 1 + (random() % 24) }, (_, j) =>
        j % 4 === 0
          ? roots[j % roots.length] + word()
          : j % 4 === 1
            ? "zz" + roots[j % roots.length]
            : word(),
      );
    if (i % 7 === 0) roots.push(roots[0]);
    if (i % 9 === 0) words.push("");
    rootCases.push({
      input: { roots, words },
      category: "shortest-prefix-terminal-infix-and-unmatched",
    });
    const dictionary = Array.from({ length: 1 + (random() % 20) }, word),
      selected = dictionary[random() % dictionary.length];
    let pattern = i % 5 === 0 ? word() : selected;
    if (i % 5 === 1) pattern = selected.slice(0, -1);
    else if (i % 5 === 2)
      pattern = [...selected].map((c, j) => (j % 2 === 0 ? "?" : c)).join("");
    else if (i % 5 === 3) pattern = "?".repeat(selected.length);
    patternCases.push({
      input: { words: dictionary, pattern },
      category:
        i % 5 === 1
          ? "nonterminal-prefix-rejection"
          : "fixed-length-branching-dictionary-query",
    });
  }
  rootCases.push({
    input: { roots: ["a", "ab", "abc"], words: ["abcde", "zzabc", "a", ""] },
    category: "shortest-root-before-longer-terminal",
  });
  rootCases.push({
    input: { roots: [], words: ["alpha", ""] },
    category: "empty-dictionary",
  });
  rootCases.push({
    input: { roots: [], words: [] },
    category: "both-arrays-empty",
  });
  rootCases.push({
    input: { roots: ["a"], words: [] },
    category: "empty-output-word-array",
  });
  rootCases.push({
    input: { roots: ["z".repeat(32)], words: ["z".repeat(32), "z".repeat(31)] },
    category: "maximum-word-and-exact-terminal",
  });
  for (const pattern of [
    "",
    "?",
    "??",
    "ca",
    "cat",
    "c?t",
    "c??",
    "????",
    "?at",
  ])
    patternCases.push({
      input: { words: ["cat", "car", "a", "cat"], pattern },
      category: "empty-pattern-exact-terminal-and-wildcard-length",
    });
  patternCases.push({
    input: { words: [], pattern: "?" },
    category: "empty-dictionary",
  });
  patternCases.push({
    input: { words: ["z".repeat(32)], pattern: "?".repeat(32) },
    category: "maximum-branch-pattern-length",
  });
  const large = Array.from(
    { length: 2000 },
    (_, i) =>
      String.fromCharCode(
        97 + Math.floor(i / 676),
        97 + (Math.floor(i / 26) % 26),
        97 + (i % 26),
      ) + "z".repeat(29),
  );
  rootCases.push({
    input: { roots: large, words: [...large] },
    category: "maximum-dictionary-and-word-count",
  });
  patternCases.push({
    input: { words: large, pattern: "?".repeat(3) + "z".repeat(28) + "a" },
    category: "maximum-dictionary-all-branches-fail-at-final-letter",
  });
  patternCases.push({
    input: { words: large, pattern: "?".repeat(32) },
    category: "maximum-dictionary-wildcard-success",
  });
  return { rootCases, patternCases };
}
const refs = (java, cpp, python) => ({
  java: { starter: "GENERATE", reference: java },
  cpp: { starter: "GENERATE", reference: cpp },
  python: { starter: "GENERATE", reference: python },
});
const wordSchema = { kind: "string", minLength: 1, maxLength: 32, ascii: true },
  wordsSchema = {
    kind: "array",
    maxLength: 2000,
    unordered: true,
    deduplicate: true,
    items: wordSchema,
  };
export const definitions = [
  {
    id: "tries-01",
    slug: "replace-by-shortest-known-dictionary-root",
    title: "Replace words with their shortest known root",
    primaryTopic: "tries",
    step: 1,
    skillIds: [
      "arrays.traversal",
      "tries.prefix-navigation",
      "tries.shortest-terminal-root",
    ],
    prerequisites: ["arrays.traversal"],
    remedialIds: ["arrays-hashing-01"],
    checkpointIds: ["tries-02"],
    nextIds: ["tries-03"],
    objective:
      "Replace each word with its shortest dictionary prefix while preserving unmatched words and their order.",
    rationale:
      "A terminal prefix wins before deeper branches; dictionary entries inside a word or longer matching prefixes are not valid replacements.",
    statement:
      "## Shortest known root\n\nFor each word in `words`, find dictionary entries in `roots` that are prefixes of that word. Replace the word with the shortest matching entry. If no entry matches, keep the original word. Preserve word order and duplicates. An empty word stays empty because dictionary roots are nonempty. Duplicate roots have no extra effect.\n\nMatch from the beginning of the word only. A root appearing later inside a word does not match. If both a short and a longer root match, always choose the short one, even when the longer one equals the whole word.\n\n`solve(roots,words)` receives two native string arrays and returns a string array of the same length as words. All text is lowercase ASCII. No sentence splitting or punctuation parsing is required. A Trie can stop at the first terminal prefix while following a word’s letters.",
    constraints: [
      "0 ≤ roots.length, words.length ≤ 2,000.",
      "Roots contain 1 to 32 lowercase ASCII letters.",
      "Words contain 0 to 32 lowercase ASCII letters.",
      "Match literal prefixes; do not case-fold, match infixes, or replace by the longest root.",
    ],
    interface:
      "Solution.solve(roots,words) receives string[] arrays and returns string[].",
    inputSchema: {
      kind: "object",
      properties: {
        roots: wordsSchema,
        words: {
          kind: "array",
          maxLength: 2000,
          items: { kind: "string", maxLength: 32, ascii: true },
        },
      },
    },
    semanticConstraints: [
      { kind: "alphabet", field: "roots", alphabet: "lowercase", each: true },
      { kind: "alphabet", field: "words", alphabet: "lowercase", each: true },
    ],
    outputSchema: {
      kind: "array",
      maxLength: 2000,
      items: { kind: "string", maxLength: 32, ascii: true },
    },
    function: {
      arguments: [
        { name: "roots", type: "string[]" },
        { name: "words", type: "string[]" },
      ],
      returnType: "string[]",
    },
    generatorModule: "content/authoring/tries.mjs",
    generate: () => generators().rootCases,
    visible: [
      {
        input: {
          roots: ["cat", "ca", "dog"],
          words: ["cattle", "dogma", "scatter", "cat"],
        },
        expected: ["ca", "dog", "scatter", "ca"],
        explanation:
          "ca is the shortest prefix of cattle and cat; dog prefixes dogma; cat inside scatter is not a prefix.",
      },
      {
        input: { roots: ["ab", "a", "ab"], words: ["abc", "", "b"] },
        expected: ["a", "", "b"],
        explanation:
          "The shortest root a wins; duplicate roots do not change the result, and empty/unmatched words stay unchanged.",
      },
      {
        input: { roots: [], words: ["alpha", "beta"] },
        expected: ["alpha", "beta"],
        explanation: "No dictionary entry exists to replace either word.",
      },
    ],
    oracle: replaceRoots,
    independent: replaceIndependent,
    mutations: {
      "choose-longest-terminal-root": (input) => replaceRoots(input, true),
      "replace-infix-as-if-prefix": ({ roots, words }) =>
        words.map(
          (word) =>
            roots
              .filter((r) => word.includes(r))
              .sort((a, b) => a.length - b.length)[0] ?? word,
        ),
    },
    languages: refs(
      "class Solution {static class T{T[] next=new T[26];boolean end;}public String[] solve(String[] roots,String[] words){T root=new T();for(String word:roots){T n=root;for(int i=0;i<word.length();i++){int at=word.charAt(i)-'a';if(n.next[at]==null)n.next[at]=new T();n=n.next[at];}n.end=true;}String[] result=new String[words.length];for(int i=0;i<words.length;i++){String word=words[i];result[i]=word;T n=root;for(int j=0;j<word.length();j++){n=n.next[word.charAt(j)-'a'];if(n==null)break;if(n.end){result[i]=word.substring(0,j+1);break;}}}return result;}}",
      "class Solution {struct T{array<int,26> next;bool end=false;T(){next.fill(-1);}};public:vector<string> solve(vector<string> roots,vector<string> words){vector<T> trie(1);for(auto& word:roots){int n=0;for(char c:word){int at=c-'a';if(trie[n].next[at]==-1){trie[n].next[at]=trie.size();trie.emplace_back();}n=trie[n].next[at];}trie[n].end=true;}vector<string> result=words;for(size_t i=0;i<words.size();i++){int n=0;for(size_t j=0;j<words[i].size();j++){n=trie[n].next[words[i][j]-'a'];if(n==-1)break;if(trie[n].end){result[i]=words[i].substr(0,j+1);break;}}}return result;}};",
      'class Solution:\n    def solve(self, roots, words):\n        trie={}\n        for word in roots:\n            node=trie\n            for letter in word:\n                node=node.setdefault(letter,{})\n            node["#"]=True\n        result=[]\n        for word in words:\n            node=trie\n            replacement=word\n            for index,letter in enumerate(word):\n                node=node.get(letter)\n                if node is None:\n                    break\n                if "#" in node:\n                    replacement=word[:index+1]\n                    break\n            result.append(replacement)\n        return result\n',
    ),
  },
  {
    id: "tries-02",
    slug: "fixed-length-wildcard-dictionary-match",
    title: "Match a dictionary word with one-letter wildcards",
    primaryTopic: "tries",
    step: 1,
    skillIds: [
      "arrays.traversal",
      "tries.prefix-navigation",
      "tries.wildcard-branch-search",
      "tries.exact-terminal-match",
    ],
    prerequisites: ["arrays.traversal", "tries.prefix-navigation"],
    remedialIds: ["arrays-hashing-01", "tries-01"],
    checkpointIds: ["tries-01"],
    nextIds: ["tries-03"],
    objective:
      "Decide whether one whole dictionary word matches a literal-and-one-letter-wildcard pattern.",
    rationale:
      "A wildcard branches to existing child letters; matching a prefix without a terminal node or accepting a different word length is incorrect.",
    statement:
      "## Exact-length wildcard lookup\n\nReturn true when at least one whole word in `words` matches `pattern`. Lowercase letters match themselves. A question mark `?` matches exactly one lowercase letter, never zero letters or an arbitrary-length suffix. The dictionary word and pattern must have equal lengths. Prefix matches alone do not count.\n\nDictionary words are nonempty, so an empty pattern returns false. An empty dictionary also returns false. Duplicate dictionary entries have no extra effect.\n\n`solve(words,pattern)` receives a native string array and a string, and returns boolean. All dictionary text is lowercase ASCII; the pattern contains only lowercase letters and `?`. Search Trie child branches when a wildcard occurs and require a terminal node when the pattern ends.",
    constraints: [
      "0 ≤ words.length ≤ 2,000.",
      "Dictionary words contain 1 to 32 lowercase ASCII letters.",
      "The pattern contains 0 to 32 lowercase ASCII letters or question marks.",
      "Each ? consumes exactly one letter; no other pattern operators exist.",
    ],
    interface:
      "Solution.solve(words,pattern) receives string[] and string and returns boolean.",
    inputSchema: {
      kind: "object",
      properties: {
        words: wordsSchema,
        pattern: { kind: "string", maxLength: 32, ascii: true },
      },
    },
    semanticConstraints: [
      { kind: "alphabet", field: "words", alphabet: "lowercase", each: true },
      { kind: "alphabet", field: "pattern", alphabet: "lowercase-wildcard" },
    ],
    valid: ({ pattern }) => /^[a-z?]*$/.test(pattern),
    outputSchema: { kind: "boolean" },
    function: {
      arguments: [
        { name: "words", type: "string[]" },
        { name: "pattern", type: "string" },
      ],
      returnType: "boolean",
    },
    generatorModule: "content/authoring/tries.mjs",
    generate: () => generators().patternCases,
    visible: [
      {
        input: { words: ["cat", "car", "dog"], pattern: "ca?" },
        expected: true,
        explanation:
          "The wildcard matches t or r, producing a complete dictionary word.",
      },
      {
        input: { words: ["cat"], pattern: "ca" },
        expected: false,
        explanation:
          "ca is only a nonterminal prefix and has the wrong length.",
      },
      {
        input: { words: ["a", "ab"], pattern: "??" },
        expected: true,
        explanation:
          "Two wildcards consume the two letters of ab; they cannot match the shorter word a.",
      },
    ],
    oracle: wildcard,
    independent: wildcardIndependent,
    mutations: {
      "accept-nonterminal-prefix": (input) => wildcard(input, true),
      "treat-question-mark-as-zero-or-many": ({ words, pattern }) => {
        const escaped = pattern.replaceAll("?", ".*");
        return words.some((word) => new RegExp("^" + escaped + "$").test(word));
      },
    },
    languages: refs(
      "class Solution {static class T{T[] next=new T[26];boolean end;}static class Frame{T node;int at;Frame(T n,int i){node=n;at=i;}}public boolean solve(String[] words,String pattern){T root=new T();for(String word:words){T n=root;for(int i=0;i<word.length();i++){int at=word.charAt(i)-'a';if(n.next[at]==null)n.next[at]=new T();n=n.next[at];}n.end=true;}ArrayDeque<Frame> stack=new ArrayDeque<>();stack.push(new Frame(root,0));while(!stack.isEmpty()){Frame f=stack.pop();if(f.at==pattern.length()){if(f.node.end)return true;continue;}char c=pattern.charAt(f.at);if(c=='?'){for(T child:f.node.next)if(child!=null)stack.push(new Frame(child,f.at+1));}else{T child=f.node.next[c-'a'];if(child!=null)stack.push(new Frame(child,f.at+1));}}return false;}}",
      "class Solution {struct T{array<int,26> next;bool end=false;T(){next.fill(-1);}};public:bool solve(vector<string> words,string pattern){vector<T> trie(1);for(auto& word:words){int n=0;for(char c:word){int at=c-'a';if(trie[n].next[at]==-1){trie[n].next[at]=trie.size();trie.emplace_back();}n=trie[n].next[at];}trie[n].end=true;}vector<pair<int,size_t>> stack{{0,0}};while(!stack.empty()){auto [n,at]=stack.back();stack.pop_back();if(at==pattern.size()){if(trie[n].end)return true;continue;}char c=pattern[at];if(c=='?'){for(int child:trie[n].next)if(child!=-1)stack.push_back({child,at+1});}else{int child=trie[n].next[c-'a'];if(child!=-1)stack.push_back({child,at+1});}}return false;}};",
      'class Solution:\n    def solve(self, words, pattern):\n        trie={}\n        for word in words:\n            node=trie\n            for letter in word:\n                node=node.setdefault(letter,{})\n            node["#"]=True\n        stack=[(trie,0)]\n        while stack:\n            node,at=stack.pop()\n            if at==len(pattern):\n                if "#" in node:\n                    return True\n                continue\n            letter=pattern[at]\n            if letter=="?":\n                for key,child in node.items():\n                    if key!="#":\n                        stack.append((child,at+1))\n            elif letter in node:\n                stack.append((node[letter],at+1))\n        return False\n',
    ),
  },
];
for (const d of definitions) {
  const starters = buildFunctionStarters(d.function);
  for (const language of ["java", "cpp", "python"])
    d.languages[language].starter = starters[language];
}
export function audit() {
  const report = {
    timestamp: new Date().toISOString(),
    scope:
      "Tries01/02 source-only author audit; no language reference execution",
    prepared: [],
    failures: [],
  };
  const ordered = { roots: ["do", "ca"], words: ["dog", "cat", "dog"] };
  report.dictionaryIdentityRegressions = {
    duplicateRootIdentityIgnored:
      inputKey(definitions[0].inputSchema, ordered) ===
      inputKey(definitions[0].inputSchema, {
        ...ordered,
        roots: ["ca", "do", "do"],
      }),
    duplicateQueryIdentityIgnored:
      inputKey(definitions[1].inputSchema, {
        words: ["cat", "dog"],
        pattern: "?at",
      }) ===
      inputKey(definitions[1].inputSchema, {
        words: ["dog", "cat", "cat"],
        pattern: "?at",
      }),
    rootOrderIgnored:
      inputKey(definitions[0].inputSchema, ordered) ===
      inputKey(definitions[0].inputSchema, { ...ordered, roots: ["ca", "do"] }),
    outputWordOrderPreserved:
      inputKey(definitions[0].inputSchema, ordered) !==
      inputKey(definitions[0].inputSchema, {
        ...ordered,
        words: ["cat", "dog", "dog"],
      }),
    queryDictionaryOrderIgnored:
      inputKey(definitions[1].inputSchema, {
        words: ["cat", "dog"],
        pattern: "?at",
      }) ===
      inputKey(definitions[1].inputSchema, {
        words: ["dog", "cat"],
        pattern: "?at",
      }),
    duplicateRootBehavior:
      JSON.stringify(replaceRoots(ordered)) ===
      JSON.stringify(replaceRoots({ ...ordered, roots: ["ca", "do", "do"] })),
    duplicateQueryBehavior:
      wildcard({ words: ["cat", "dog"], pattern: "?at" }) ===
      wildcard({ words: ["dog", "cat", "cat"], pattern: "?at" }),
    countedAsHidden: false,
  };
  if (
    Object.entries(report.dictionaryIdentityRegressions).some(
      ([key, value]) => key !== "countedAsHidden" && !value,
    )
  )
    report.failures.push("dictionary identity/order regression");
  for (const d of definitions) {
    const hidden = logicalCases(d);
    for (const c of [...d.visible, ...hidden]) {
      const result = d.oracle(c.input);
      if (JSON.stringify(result) !== JSON.stringify(d.independent(c.input)))
        report.failures.push(d.id + ": independent mismatch");
      if (
        c.expected !== undefined &&
        JSON.stringify(result) !== JSON.stringify(c.expected)
      )
        report.failures.push(d.id + ": expected mismatch");
    }
    const mutations = Object.entries(d.mutations).map(([name, fn]) => ({
      name,
      detected: hidden.some(
        (c) => JSON.stringify(fn(c.input)) !== JSON.stringify(c.expected),
      ),
    }));
    for (const m of mutations)
      if (!m.detected) report.failures.push(d.id + ": mutation " + m.name);
    report.prepared.push({
      id: d.id,
      candidates: hidden.length,
      visible: 3,
      mutations,
    });
  }
  writeFileSync(
    "docs/release-evidence/content-tries-first-author-audit.json",
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    "docs/release-evidence/content-tries-first-template-sources.json",
    JSON.stringify(
      definitions.map((d) => ({
        id: d.id,
        languages: d.languages,
        wrappers: buildFunctionHarness(d.function),
      })),
    ),
  );
  console.log(report);
  if (report.failures.length) throw Error(JSON.stringify(report.failures));
}
if (process.argv[1]?.endsWith("tries.mjs")) audit();
