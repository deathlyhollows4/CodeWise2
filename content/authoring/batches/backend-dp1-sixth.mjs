import {seeded,materializePack} from '../pack-builder.mjs';
const common={primaryTopic:'dp-1d',generatorModule:'content/authoring/batches/backend-dp1-sixth.mjs',checker:{kind:'exact'}};
const inputSchema={kind:'object',properties:{text:{kind:'string',minLength:0,maxLength:500,ascii:true},words:{kind:'array',minLength:0,maxLength:100,unordered:true,items:{kind:'string',minLength:1,maxLength:20,ascii:true}}}};
const semanticConstraints=[{kind:'unique',field:'words'}];
function feasible({text,words}){const reachable=Array(text.length+1).fill(false);reachable[0]=true;for(let i=0;i<text.length;i++)if(reachable[i])for(const word of words)if(text.startsWith(word,i))reachable[i+word.length]=true;return reachable[text.length];}
function unmatched({text,words}){const cost=Array(text.length+1).fill(text.length+1);cost[0]=0;for(let i=0;i<text.length;i++){cost[i+1]=Math.min(cost[i+1],cost[i]+1);for(const word of words)if(text.startsWith(word,i))cost[i+word.length]=Math.min(cost[i+word.length],cost[i]);}return cost[text.length];}
function smallCover({text,words},allowSkip){function visit(index){if(index===text.length)return allowSkip?0:true;if(allowSkip){let best=1+visit(index+1);for(const word of words)if(text.startsWith(word,index))best=Math.min(best,visit(index+word.length));return best;}for(const word of words)if(text.startsWith(word,index)&&visit(index+word.length))return true;return false;}return visit(0);}
function independent(input,allowSkip){const {text,words}=input;if(text.length<=12)return smallCover(input,allowSkip);
  // Large tests use only one dictionary word, allowing an independent block certificate.
  if(words.length===0)return allowSkip?text.length:text.length===0;
  if(words.length!==1)throw Error('Independent large dictionary certificate unavailable');
  const word=words[0];
  if(text.split('').every(c=>c==='a')&&word.split('').every(c=>c==='a'))return allowSkip?text.length%word.length:text.length%word.length===0;
  if(word==='ab'&&/^(ab)+$/.test(text))return allowSkip?0:true;
  if(word==='a'&&/^[a!]*$/.test(text)){const extra=[...text].filter(c=>c==='!').length;return allowSkip?extra:extra===0;}
  throw Error('Independent large dictionary certificate unavailable');
}
function cases(seed){const r=seeded(seed),out=[];const token=length=>Array.from({length},()=> 'abc'[r()%3]).join('');
  for(let i=0;i<760;i++){const text=token(r()%13),words=[...new Set(Array.from({length:r()%9},()=>token(1+r()%5)))];out.push({input:{text,words},category:'exhaustive-nonoverlapping-dictionary-cover'});}
  for(let length=2;length<=12;length++)out.push({input:{text:'a'.repeat(length),words:['aa','aaa']},category:'ambiguous-boundaries-defeat-longest-token-greedy'});
  for(const input of [{text:'',words:[]},{text:'abc',words:[]},{text:'aaa',words:['aa']},{text:'aaaa',words:['a','aa','aaa']},{text:'abcde',words:['ab','bc','cde']},{text:'a!a',words:['a']},{text:'A a',words:['A',' ','a']},{text:'A a',words:['a']},{text:'a'.repeat(500),words:['a']},{text:'a'.repeat(499),words:['aa']},{text:'a'.repeat(500),words:['a'.repeat(20)]},{text:'ab'.repeat(250),words:['ab']},{text:'a!'.repeat(250),words:['a']},{text:'!'.repeat(500),words:[]}])out.push({input,category:input.text.length>12?'upper-bound-independent-block-certificate':'empty-partial-coverage-overlap-and-literal-ascii'});
  // Maximum dictionary count: length>text candidates cannot match, so small exhaustive proof applies.
  out.push({input:{text:'abc',words:Array.from({length:100},(_,i)=>'x'+String(i).padStart(3,'0'))},category:'maximum-distinct-dictionary-count'});
  return out;
}
function languages(optimize){
  const type=optimize?'int':'boolean',initial=optimize?'return 0;':'return false;',cppType=optimize?'int':'bool',pyInitial=optimize?'0':'False';
  const javaBody=optimize?`int[] cost = new int[text.length()+1];
        java.util.Arrays.fill(cost, text.length()+1);
        cost[0] = 0;
        for (int i = 0; i < text.length(); i++) {
            cost[i+1] = Math.min(cost[i+1], cost[i]+1);
            for (String word : words) if (text.startsWith(word, i))
                cost[i+word.length()] = Math.min(cost[i+word.length()], cost[i]);
        }
        return cost[text.length()];`:`boolean[] reachable = new boolean[text.length()+1];
        reachable[0] = true;
        for (int i = 0; i < text.length(); i++) if (reachable[i])
            for (String word : words) if (text.startsWith(word, i))
                reachable[i+word.length()] = true;
        return reachable[text.length()];`;
  const cppBody=optimize?`vector<int> cost(text.size()+1, text.size()+1);
        cost[0] = 0;
        for (int i = 0; i < (int) text.size(); ++i) {
            cost[i+1] = min(cost[i+1], cost[i]+1);
            for (const string& word : words) if (text.compare(i, word.size(), word) == 0)
                cost[i+word.size()] = min(cost[i+word.size()], cost[i]);
        }
        return cost[text.size()];`:`vector<bool> reachable(text.size()+1, false);
        reachable[0] = true;
        for (int i = 0; i < (int) text.size(); ++i) if (reachable[i])
            for (const string& word : words) if (text.compare(i, word.size(), word) == 0)
                reachable[i+word.size()] = true;
        return reachable[text.size()];`;
  const pyBody=optimize?`cost = [len(text)+1]*(len(text)+1)
        cost[0] = 0
        for i in range(len(text)):
            cost[i+1] = min(cost[i+1], cost[i]+1)
            for word in words:
                if text.startswith(word, i):
                    cost[i+len(word)] = min(cost[i+len(word)], cost[i])
        return cost[-1]`:`reachable = [False]*(len(text)+1)
        reachable[0] = True
        for i in range(len(text)):
            if reachable[i]:
                for word in words:
                    if text.startswith(word, i):
                        reachable[i+len(word)] = True
        return reachable[-1]`;
  return {java:{starter:`class Solution {\n    public ${type} solve(String text, String[] words) {\n        // TODO: apply the dictionary coverage contract.\n        ${initial}\n    }\n}\n`,reference:`class Solution {\n    public ${type} solve(String text, String[] words) {\n        ${javaBody}\n    }\n}\n`},cpp:{starter:`class Solution {\npublic:\n    ${cppType} solve(string text, vector<string> words) {\n        // TODO: apply the dictionary coverage contract.\n        ${initial}\n    }\n};\n`,reference:`class Solution {\npublic:\n    ${cppType} solve(string text, vector<string> words) {\n        ${cppBody}\n    }\n};\n`},python:{starter:`class Solution:\n    def solve(self, text, words):\n        # TODO: apply the dictionary coverage contract.\n        return ${pyInitial}\n`,reference:`class Solution:\n    def solve(self, text, words):\n        ${pyBody}\n`}};
}
const shared={inputSchema,semanticConstraints,valid:({words})=>new Set(words).size===words.length,constraints:['0 <= text.length <= 500','0 <= words.length <= 100; dictionary words are distinct','1 <= words[i].length <= 20','Text and dictionary contain ASCII characters; matching is literal and case-sensitive','Dictionary order has no meaning; every word may be reused'],function:{arguments:[{name:'text',type:'string'},{name:'words',type:'string[]'}]}};
export const definitions=[{
  ...common,...shared,id:'dp-1d-15',slug:'exact-dictionary-segmentation-feasibility',title:'Can the dictionary cover the whole text?',step:4,seed:'0xCC215',skillIds:['dp.text-position-state','strings.word-boundary-reachability'],prerequisites:['dp.one-dimensional-state'],checkpointIds:['dp-1d-07','dp-1d-08'],remedialIds:['dp-1d-01','dp-1d-02'],nextIds:['dp-1d-16','dp-1d-09','dp-1d-10'],
  objective:'Determine whether consecutive dictionary words cover every character exactly, without greedy boundary choices.',rationale:'A reachable character boundary can open several matching next words; every character must belong to one chosen token.',statement:'Return true if the entire text can be split into one or more consecutive dictionary words, and false otherwise. Every character must be covered exactly once, in order, without overlaps or gaps. You may reuse a dictionary word any number of times. Dictionary order does not affect the answer. Matching is literal and case-sensitive, including spaces or punctuation. The empty text returns true because an empty token sequence covers it. A nonempty text and empty dictionary return false. Dictionary words themselves are never empty.',interface:'Solution.solve(text,words) returns a boolean for complete dictionary coverage.',outputSchema:{kind:'boolean'},function:{...shared.function,returnType:'boolean'},
  visible:[{input:{text:'aaaa',words:['aaa','aa']},expected:true,explanation:'Choose aa followed by aa; greedily taking aaa would leave one uncovered character.'},{input:{text:'a!a',words:['a']},expected:false,explanation:'The exclamation mark cannot be covered by a dictionary word.'},{input:{text:'',words:[]},expected:true,explanation:'The empty sequence of tokens covers the empty text.'}],
  generate:()=>cases(0xcc215),oracle:feasible,independent:input=>independent(input,false),mutations:{'accept-any-dictionary-substring':({text,words})=>!text.length||words.some(w=>text.includes(w)),'greedy-longest-next-token':({text,words})=>{let i=0;while(i<text.length){const word=[...words].sort((a,b)=>b.length-a.length).find(w=>text.startsWith(w,i));if(!word)return false;i+=word.length;}return true;}},languages:languages(false),
},{
  ...common,...shared,id:'dp-1d-16',slug:'minimum-unmatched-characters-with-dictionary-cover',title:'Leave the fewest unmatched characters',step:5,seed:'0xCC216',skillIds:['dp.text-position-state','dp.skip-or-cover-cost'],prerequisites:['dp.one-dimensional-state','strings.word-boundary-reachability'],checkpointIds:['dp-1d-09','dp-1d-10'],remedialIds:['dp-1d-01','dp-1d-02','dp-1d-15'],nextIds:['dp-1d-11','dp-1d-12'],
  objective:'Minimize uncovered characters using disjoint dictionary substrings and explicit one-character skip transitions.',rationale:'Full segmentation may be impossible, but a skip transition allows the best partial coverage; count uncovered characters rather than chosen words.',statement:'Choose zero or more nonoverlapping substrings of text, each equal to a dictionary word. A dictionary word may be reused. Return the smallest number of characters left outside the chosen substrings. Uncovered characters may appear anywhere, including between two chosen words. Words must match consecutive original characters; they cannot jump over an uncovered character. Matching is literal and case-sensitive. Count unmatched characters, not dictionary words. The empty text returns 0. With an empty dictionary, every character is unmatched. Unlike complete dictionary segmentation, a text with no complete cover can still have useful partial coverage.',interface:'Solution.solve(text,words) returns the minimum unmatched character count.',outputSchema:{kind:'integer',minimum:0,maximum:500},function:{...shared.function,returnType:'int'},
  visible:[{input:{text:'a!a',words:['a']},expected:1,explanation:'Cover both a characters using separate occurrences of a, leaving only !.'},{input:{text:'abcde',words:['ab','bc','cde']},expected:0,explanation:'Cover ab then cde without overlaps. Choosing bc alone would leave more characters unmatched.'},{input:{text:'abc',words:[]},expected:3,explanation:'No dictionary substring can cover a character.'}],
  generate:()=>cases(0xcc216),oracle:unmatched,independent:input=>independent(input,true),mutations:{'all-or-nothing-coverage':input=>feasible(input)?0:input.text.length,'remove-all-matching-characters-without-contiguity':({text,words})=>{const chars=new Set(words.join(''));return [...text].filter(c=>!chars.has(c)).length;}},languages:languages(true),
}];
if(process.argv[1]?.endsWith('backend-dp1-sixth.mjs'))for(const def of definitions)console.log(await materializePack(def));
