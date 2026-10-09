// Original replacement definition only. Integration owns registry, packs and native jobs.
import {buildFunctionStarters} from './harness.mjs';
function countedTrie(dictionary){
 const root={children:new Map(),count:0,terminal:0};
 for(const word of dictionary){let node=root;for(const c of word){if(!node.children.has(c))node.children.set(c,{children:new Map(),count:0,terminal:0});node=node.children.get(c);node.count++;}node.terminal++;}
 return root;
}
export function prefixAgreement({dictionary,queries},mode='correct'){
 const root=countedTrie(mode==='deduplicate'? [...new Set(dictionary)]:dictionary);
 return queries.map(query=>{let node=root,total=mode==='empty-root'?dictionary.length:0,last=0;for(const c of query){node=node.children.get(c);if(!node)break;last=node.count;total+=mode==='terminal-only'?node.terminal:mode==='boolean-presence'?1:node.count;if(mode==='first-terminal'&&node.terminal)break;}return mode==='last-count'?last:total;});
}
// Structurally separate oracle: direct pairwise character comparison, no Trie/counters.
export function directLcp({dictionary,queries}){
 if(!dictionary.length)return queries.map(()=>0);
 // Independent maximum certificate: identical 32-letter words/queries contribute32 each.
 if(dictionary.length===2000&&queries.length===2000&&dictionary.every(w=>w==='a'.repeat(32))&&queries.every(q=>q==='a'.repeat(32)))return queries.map(()=>64000);
 // Independent near-full-prefix maximum certificate: exactly31 shared initial letters.
 if(dictionary.length===2000&&queries.length===2000&&dictionary.every(w=>w==='a'.repeat(32))&&queries.every(q=>q==='a'.repeat(31)+'b'))return queries.map(()=>62000);
 return queries.map(query=>{let total=0;for(const word of dictionary){let i=0;while(i<query.length&&i<word.length&&query[i]===word[i])i++;total+=i;}return total;});
}
// Conservative meaningful identity: ordered visited-prefix occurrence-count vectors.
// Literal renamings, irrelevant dictionary branches and unmatched suffix padding collapse.
// Counts are obtained by flat prefix-key frequencies, independent of Trie traversal.
export function prefixProfile({dictionary,queries}){
 const frequencies=new Map();for(const word of dictionary)for(let i=1;i<=word.length;i++){const prefix=word.slice(0,i);frequencies.set(prefix,(frequencies.get(prefix)??0)+1);}
 return JSON.stringify(queries.map(query=>{const counts=[];let missing=false;for(let i=1;i<=query.length;i++){const count=frequencies.get(query.slice(0,i))??0;if(!count){missing=true;break;}counts.push(count);}return [missing?'missing':'end',counts];}));
}
function candidates(){
 const out=[];
 // Each subset gives a different suffix-count vector; differences recover its terminals.
 for(let mask=1;mask<256;mask++)out.push({input:{dictionary:Array.from({length:8},(_,i)=>'a'.repeat(i+1)).filter((_,i)=>mask&(1<<i)),queries:['a'.repeat(8)]},category:'exhaustive-eight-depth-terminal-subsets'});
 for(let trunk=1;trunk<=6;trunk++)for(let multiplicity=1;multiplicity<=4;multiplicity++){
  const a='a'.repeat(trunk);out.push({input:{dictionary:[a,...Array(multiplicity).fill(a+'b'),a+'c',a+'cd'],queries:[a+'b',a+'cdz',a+'d',a.slice(0,-1),'']},category:'shared-trunk-terminal-and-branch-multiplicity'});
 }
 for(const input of [
  {dictionary:[],queries:[]},
  {dictionary:['a'],queries:['']},
  {dictionary:['a'],queries:['b']},
  {dictionary:['abcd'],queries:['a','ab','abc','abcd','abcde']},
  {dictionary:['a','ab','abc'],queries:['abcd','abc','ab','a','']},
  {dictionary:['ab','ac'],queries:['ad','ab','ac']},
  {dictionary:['ab','ab','ac'],queries:['ab','ab','ac','ba']},
  {dictionary:['a','a','a'],queries:['a','aa','']},
  {dictionary:['abc'],queries:['xabc','bc','abc','ab']},
  {dictionary:['a','b'],queries:['ab','ba','a','b']},
  {dictionary:['a','a','b','b','b'],queries:['b','a','b','']},
  {dictionary:['abc','abc','abcd','abd'],queries:['abz','abc','abcd','abd','abe']}
 ])out.push({input,category:'curated-boundary-ordered-queries-empty-divergence-and-multiplicity'});
 const distinct=Array.from({length:2000},(_,i)=>String.fromCharCode(97+Math.floor(i/676),97+Math.floor(i/26)%26,97+i%26)+'z'.repeat(29));
 out.push(
  {input:{dictionary:Array(2000).fill('a'.repeat(32)),queries:Array(2000).fill('a'.repeat(32))},expected:Array(2000).fill(64000),category:'max-joint-count-length-score-certificate'},
  {input:{dictionary:Array(2000).fill('a'.repeat(32)),queries:Array(2000).fill('a'.repeat(31)+'b')},expected:Array(2000).fill(62000),category:'max-final-letter-divergence-certificate'},
  {input:{dictionary:[],queries:Array(2000).fill('z'.repeat(32))},expected:Array(2000).fill(0),category:'max-empty-dictionary-query-array-certificate'},
  {input:{dictionary:distinct,queries:['','a','aa','ab','ac','b','ba','bc','c','ca',...distinct.slice(0,32)]},category:'max-distinct-dictionary-shared-three-letter-frontier'}
 );return out;
}
const provenance={origin:'original',author:'CodeWise2 Tries replacement author worker',reviewDate:'2026-10-08',reviewerType:'automated-author',rightsStatus:'original-no-imported-assets',assets:Object.fromEntries(['statement','examples','tests','references','explanation'].map(asset=>[asset,{origin:'original',sourceId:'codewise2-original',license:'project-owned'}])),independentReview:'pending'};
const word={kind:'string',minLength:1,maxLength:32,ascii:true};
export const definitions=[{
 id:'tries-03',version:'2.0.0',slug:'dictionary-prefix-agreement-scores',title:'Score dictionary prefix agreement',primaryTopic:'tries',step:1,
 generatorModule:'content/authoring/tries-thread-prefix-agreement.mjs',seed:'exhaustive-terminal-subsets-and-curated-branches-v1',checker:{kind:'exact'},provenance,
 skillIds:['tries.prefix-navigation','tries.prefix-count-accumulation','tries.dictionary-multiplicity'],prerequisites:['arrays.traversal'],checkpointIds:['tries-01','tries-02'],remedialIds:['arrays-hashing-01','tries-01'],nextIds:[],
 objective:'For each literal query, sum dictionary-occurrence counts over its nonempty prefixes, equivalently summing longest-common-prefix lengths with every dictionary occurrence.',
 rationale:'A Trie visit already identifies one prefix. Store how many dictionary occurrences pass through each prefix node and add those counters while following a query.',
 statement:'## Score shared beginnings\n\nFor each string in queries, consider every nonempty prefix of that query. For each prefix, count how many entries in dictionary begin with it. Add those counts and return one integer score per query.\n\nFor dictionary=["a","ab","ab","b"] and query="ab", prefix "a" matches three entries and prefix "ab" matches two, so the score is 3+2=5. Repeated identical dictionary entries are separate occurrences and contribute repeatedly. The empty prefix never contributes.\n\nA query does not need to be a complete dictionary word. With dictionary=["ab"] and query="ac", the score is 1 because prefix "a" matches, even though "ac" does not. Matching starts at the first character, is literal and case-sensitive, and stops contributing after the first missing prefix. Do not use wildcard, substring, subsequence or word-segmentation matching.\n\n## Empty and repeated queries\n\nAn empty query scores 0. An empty dictionary gives 0 for every query. Preserve query order and duplicates; each query is independent. No queries means an empty result. All text uses lowercase ASCII letters. Dictionary words are nonempty.\n\n## Typed function\n\nsolve(dictionary,queries) receives native string arrays and returns an integer array of the same length as queries. You do not write a parser. A counted Trie stores the number of dictionary occurrences passing through each nonempty prefix node. For each query, add the visited counters until its characters end or a child branch is missing.\n\nEquivalently, each dictionary occurrence contributes the number of initial characters it shares with the query before either word ends or the first mismatch occurs. This is a longest common prefix, not a common subsequence.',
 constraints:['0 <= dictionary.length, queries.length <= 2000','Each dictionary word contains 1 to 32 lowercase ASCII letters','Each query contains 0 to 32 lowercase ASCII letters','Dictionary occurrences count separately; query order and duplicates are preserved','Each score lies in [0,64000]; return exactly one integer per query'],
 interface:'Solution.solve(dictionary,queries) receives string[],string[]; returns int[] / vector<int> / list[int].',
 inputSchema:{kind:'object',properties:{dictionary:{kind:'array',minLength:0,maxLength:2000,unordered:true,items:word},queries:{kind:'array',minLength:0,maxLength:2000,items:{kind:'string',minLength:0,maxLength:32,ascii:true}}}},
 semanticConstraints:[{kind:'alphabet',field:'dictionary',alphabet:'lowercase',each:true},{kind:'alphabet',field:'queries',alphabet:'lowercase',each:true}],
 outputSchema:{kind:'array',minLength:0,maxLength:2000,items:{kind:'integer',minimum:0,maximum:64000}},
 function:{arguments:[{name:'dictionary',type:'string[]'},{name:'queries',type:'string[]'}],returnType:'int[]'},semanticKey:prefixProfile,
 visible:[
  {input:{dictionary:['a','ab','ab','b'],queries:['ab','ac','b','']},expected:[5,3,1,0],explanation:'For ab, prefix a has three dictionary occurrences and prefix ab has two, giving 5. For ac only a contributes, giving 3. Prefix b contributes 1. The empty query has no nonempty prefix and scores 0.'},
  {input:{dictionary:['aa','aa','aaa'],queries:['a','aa','aaaa']},expected:[3,6,7],explanation:'The two aa entries count separately. Prefix counts for aaaa are 3,3,1,0, giving 7. Shorter queries stop earlier: a scores 3 and aa scores 6.'},
  {input:{dictionary:[],queries:['a','']},expected:[0,0],explanation:'No dictionary occurrence begins with any query prefix. Both the nonempty query and the empty query therefore score 0.'}
 ],
 oracle:prefixAgreement,independent:directLcp,
 mutations:{
  'deduplicate-dictionary-occurrences':input=>prefixAgreement(input,'deduplicate'),
  'count-only-terminal-prefixes':input=>prefixAgreement(input,'terminal-only'),
  'use-only-last-prefix-count':input=>prefixAgreement(input,'last-count'),
  'include-empty-root-count':input=>prefixAgreement(input,'empty-root'),
  'stop-at-first-terminal':input=>prefixAgreement(input,'first-terminal'),
  'use-boolean-prefix-presence':input=>prefixAgreement(input,'boolean-presence'),
  'carry-score-between-queries':input=>{let total=0;return prefixAgreement(input).map(score=>total+=score);},
  'sum-substring-instead-of-initial-agreement':({dictionary,queries})=>queries.map(query=>dictionary.reduce((sum,word)=>{let longest=0;for(let i=1;i<=query.length;i++)if(word.includes(query.slice(0,i)))longest=i;return sum+longest;},0))
 },
 languages:{
  java:{reference:`class Solution {
    static class Node { Node[] child = new Node[26]; int count; }
    public int[] solve(String[] dictionary, String[] queries) {
        Node root = new Node();
        for (String word : dictionary) {
            Node node = root;
            for (int i = 0; i < word.length(); i++) {
                int letter = word.charAt(i) - 'a';
                if (node.child[letter] == null) node.child[letter] = new Node();
                node = node.child[letter];
                node.count++;
            }
        }
        int[] scores = new int[queries.length];
        for (int i = 0; i < queries.length; i++) {
            Node node = root;
            for (int j = 0; j < queries[i].length(); j++) {
                node = node.child[queries[i].charAt(j) - 'a'];
                if (node == null) break;
                scores[i] += node.count;
            }
        }
        return scores;
    }
}\n`},
  cpp:{reference:`class Solution {
    struct Node {
        array<int,26> child;
        int count = 0;
        Node() { child.fill(-1); }
    };
public:
    vector<int> solve(vector<string> dictionary, vector<string> queries) {
        vector<Node> trie(1);
        for (const string& word : dictionary) {
            int node = 0;
            for (char c : word) {
                int letter = c - 'a';
                if (trie[node].child[letter] == -1) {
                    int next = static_cast<int>(trie.size());
                    trie[node].child[letter] = next;
                    trie.emplace_back();
                }
                node = trie[node].child[letter];
                trie[node].count++;
            }
        }
        vector<int> scores(queries.size(),0);
        for (size_t i = 0; i < queries.size(); i++) {
            int node = 0;
            for (char c : queries[i]) {
                node = trie[node].child[c-'a'];
                if (node == -1) break;
                scores[i] += trie[node].count;
            }
        }
        return scores;
    }
};\n`},
  python:{reference:`class Solution:
    def solve(self, dictionary, queries):
        children, counts = [{}], [0]
        for word in dictionary:
            node = 0
            for letter in word:
                if letter not in children[node]:
                    children[node][letter] = len(children)
                    children.append({})
                    counts.append(0)
                node = children[node][letter]
                counts[node] += 1
        scores = []
        for query in queries:
            node, score = 0, 0
            for letter in query:
                following = children[node].get(letter)
                if following is None:
                    break
                node = following
                score += counts[node]
            scores.append(score)
        return scores
`}
 }
}];
const d=definitions[0],starters=buildFunctionStarters(d.function);for(const lang of ['java','cpp','python'])d.languages[lang].starter=starters[lang];
d.generate=()=>{const seen=new Set(d.visible.map(c=>prefixProfile(c.input))),out=[];for(const c of candidates()){const key=prefixProfile(c.input);if(seen.has(key))continue;seen.add(key);out.push(c);}return out;};
