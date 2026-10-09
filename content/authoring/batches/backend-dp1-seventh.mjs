import {seeded,materializePack} from '../pack-builder.mjs';
const common={primaryTopic:'dp-1d',generatorModule:'content/authoring/batches/backend-dp1-seventh.mjs',checker:{kind:'exact'}};
function palindromeCounts({text}){const pal=Array(text.length).fill(false);let count=0;for(let end=0;end<text.length;end++)for(let left=0;left<=end;left++){pal[left]=text[left]===text[end]&&(end-left<2||pal[left+1]);if(pal[left])count++;}return count;}
function minimumCuts({text}){if(!text.length)return 0;const pal=Array(text.length).fill(false),pieces=Array(text.length+1).fill(text.length+1);pieces[0]=0;for(let end=0;end<text.length;end++)for(let left=0;left<=end;left++){pal[left]=text[left]===text[end]&&(end-left<2||pal[left+1]);if(pal[left])pieces[end+1]=Math.min(pieces[end+1],pieces[left]+1);}return pieces[text.length]-1;}
function isPalindrome(text,left,right){while(left<right)if(text[left++]!==text[right--])return false;return true;}
function distinctPalindromeMutant({text}){if(text.length>30){if([...text].every(c=>c===text[0]))return text.length;if([...text].every((c,i)=>c==='ab'[i%2]))return text.length;return new Set(text).size;}const found=new Set();for(let i=0;i<text.length;i++)for(let j=i;j<text.length;j++)if(isPalindrome(text,i,j))found.add(text.slice(i,j+1));return found.size;}
function oddPalindromeMutant({text}){let count=0;for(let center=0;center<text.length;center++)for(let radius=0;center-radius>=0&&center+radius<text.length&&text[center-radius]===text[center+radius];radius++)count++;return count;}
function countIndependent({text}){if(text.length>30){if([...text].every(c=>c===text[0]))return text.length*(text.length+1)/2;if([...text].every((c,i)=>c==='ab'[i%2])){let count=0;for(let length=1;length<=text.length;length+=2)count+=text.length-length+1;return count;}if([...text].every((c,i)=>c==='abc'[i%3]))return text.length;throw Error('Independent large palindrome count certificate unavailable');}let count=0;for(let left=0;left<text.length;left++)for(let right=left;right<text.length;right++)if(isPalindrome(text,left,right))count++;return count;}
function cutsIndependent({text}){if(!text.length)return 0;if(text.length>12){if([...text].every(c=>c===text[0]))return 0;if([...text].every((c,i)=>c==='ab'[i%2]))return text.length%2?0:1;if([...text].every((c,i)=>c==='abc'[i%3]))return text.length-1;let runs=0,previous='',seen=new Set();for(const c of text)if(c!==previous){if(seen.has(c))throw Error('Independent distinct-run certificate unavailable');seen.add(c);runs++;previous=c;}return runs-1;}let best=text.length-1;for(let mask=0;mask<(1<<(text.length-1));mask++){let start=0,cuts=0,valid=true;for(let end=0;end<text.length;end++)if(end===text.length-1||(mask&(1<<end))){if(!isPalindrome(text,start,end)){valid=false;break;}if(end<text.length-1)cuts++;start=end+1;}if(valid)best=Math.min(best,cuts);}return best;}
function countCases(){const r=seeded(0xcc217),out=[];for(let i=0;i<760;i++)out.push({input:{text:Array.from({length:r()%25},()=> 'abcd'[(r()>>>8)%4]).join('')},category:'direct-interval-palindrome-enumeration'});for(const text of ['', 'a','aa','aba','abba','a!a','Aba',' a ', 'a'.repeat(2000),'ab'.repeat(1000),Array.from({length:2000},(_,i)=>'abc'[i%3]).join('')])out.push({input:{text},category:text.length>30?'upper-bound-closed-form-palindrome-family':'empty-even-odd-repeated-and-literal-ascii'});return out;}
function cutsCases(){const r=seeded(0xcc218),out=[];for(let i=0;i<760;i++)out.push({input:{text:Array.from({length:r()%13},()=> 'abc'[r()%3]).join('')},category:'all-cut-masks-independent-partitions'});for(const text of ['','a','aa','aab','abacdc','abc','a!a','Aba','a'.repeat(1000),'ab'.repeat(500),'ab'.repeat(499)+'a',Array.from({length:1000},(_,i)=>'abc'[i%3]).join(''),'a'.repeat(200)+'b'.repeat(500)+'c'.repeat(300)])out.push({input:{text},category:text.length>12?'upper-bound-certified-block-partitions':'empty-cuts-versus-pieces-and-multiple-palindromes'});return out;}
function languages(optimize){
  const javaBody=optimize?`if (text.isEmpty()) return 0;
        boolean[] pal = new boolean[text.length()];
        int[] pieces = new int[text.length()+1];
        java.util.Arrays.fill(pieces, text.length()+1);
        pieces[0] = 0;
        for (int end = 0; end < text.length(); end++) {
            for (int left = 0; left <= end; left++) {
                pal[left] = text.charAt(left) == text.charAt(end) && (end-left < 2 || pal[left+1]);
                if (pal[left]) pieces[end+1] = Math.min(pieces[end+1], pieces[left]+1);
            }
        }
        return pieces[text.length()]-1;`:`boolean[] pal = new boolean[text.length()];
        int count = 0;
        for (int end = 0; end < text.length(); end++) {
            for (int left = 0; left <= end; left++) {
                pal[left] = text.charAt(left) == text.charAt(end) && (end-left < 2 || pal[left+1]);
                if (pal[left]) count++;
            }
        }
        return count;`;
  const cppBody=optimize?`if (text.empty()) return 0;
        vector<bool> pal(text.size(), false);
        vector<int> pieces(text.size()+1, text.size()+1);
        pieces[0] = 0;
        for (int end = 0; end < (int) text.size(); ++end) {
            for (int left = 0; left <= end; ++left) {
                pal[left] = text[left] == text[end] && (end-left < 2 || pal[left+1]);
                if (pal[left]) pieces[end+1] = min(pieces[end+1], pieces[left]+1);
            }
        }
        return pieces[text.size()]-1;`:`vector<bool> pal(text.size(), false);
        int count = 0;
        for (int end = 0; end < (int) text.size(); ++end) {
            for (int left = 0; left <= end; ++left) {
                pal[left] = text[left] == text[end] && (end-left < 2 || pal[left+1]);
                if (pal[left]) count++;
            }
        }
        return count;`;
  const pyBody=optimize?`if not text:
            return 0
        pal = [False]*len(text)
        pieces = [len(text)+1]*(len(text)+1)
        pieces[0] = 0
        for end in range(len(text)):
            for left in range(end+1):
                pal[left] = text[left] == text[end] and (end-left < 2 or pal[left+1])
                if pal[left]:
                    pieces[end+1] = min(pieces[end+1], pieces[left]+1)
        return pieces[-1]-1`:`pal = [False]*len(text)
        count = 0
        for end in range(len(text)):
            for left in range(end+1):
                pal[left] = text[left] == text[end] and (end-left < 2 or pal[left+1])
                if pal[left]:
                    count += 1
        return count`;
  return {java:{starter:'class Solution {\n    public int solve(String text) {\n        // TODO: apply the stated palindrome contract.\n        return 0;\n    }\n}\n',reference:`class Solution {\n    public int solve(String text) {\n        ${javaBody}\n    }\n}\n`},cpp:{starter:'class Solution {\npublic:\n    int solve(string text) {\n        // TODO: apply the stated palindrome contract.\n        return 0;\n    }\n};\n',reference:`class Solution {\npublic:\n    int solve(string text) {\n        ${cppBody}\n    }\n};\n`},python:{starter:'class Solution:\n    def solve(self, text):\n        # TODO: apply the stated palindrome contract.\n        return 0\n',reference:`class Solution:\n    def solve(self, text):\n        ${pyBody}\n`}};
}
export const definitions=[{
  ...common,id:'dp-1d-17',slug:'count-indexed-palindromic-substrings',title:'Count palindromic substrings',step:5,seed:'0xCC217',skillIds:['strings.palindrome-interval-state','dp.rolling-interval-state'],prerequisites:['dp.one-dimensional-state'],checkpointIds:['dp-1d-09','dp-1d-10','dp-1d-16'],remedialIds:['dp-1d-01','dp-1d-02'],nextIds:['dp-1d-18','dp-1d-11','dp-1d-12'],objective:'Count all indexed contiguous palindromes using mirrored endpoints and their previously solved interior.',rationale:'Matching endpoints form a palindrome only when their interior is also a palindrome; equal text at different positions counts separately.',statement:'Count the nonempty contiguous substrings of text that read the same forward and backward. Count by index interval: equal substring text occurring at different positions counts separately. Single characters count, as do both odd-length and even-length palindromes. The empty text returns 0. Matching is literal and case-sensitive for ASCII characters, including spaces and punctuation. This asks for the number of palindrome occurrences, not the number of distinct palindrome strings or the longest palindrome length.',constraints:['0 <= text.length <= 2000','Text contains ASCII characters','The answer is at most 2001000'],interface:'Solution.solve(text) returns the number of indexed nonempty palindromic substrings.',inputSchema:{kind:'object',properties:{text:{kind:'string',minLength:0,maxLength:2000,ascii:true}}},outputSchema:{kind:'integer',minimum:0,maximum:2001000},function:{arguments:[{name:'text',type:'string'}],returnType:'int'},visible:[{input:{text:'aaa'},expected:6,explanation:'Three single characters, two length-2 intervals and one length-3 interval count.'},{input:{text:'abba'},expected:6,explanation:'The four singles, bb and abba are palindromes.'},{input:{text:''},expected:0,explanation:'There are no nonempty intervals.'}],generate:countCases,oracle:palindromeCounts,independent:countIndependent,mutations:{'count-distinct-text-only':distinctPalindromeMutant,'omit-even-palindromes':oddPalindromeMutant},languages:languages(false),
},{
  ...common,id:'dp-1d-18',slug:'minimum-cuts-into-palindromic-pieces',title:'Minimum palindrome partition cuts',step:6,seed:'0xCC218',skillIds:['strings.palindrome-interval-state','dp.minimum-prefix-partition-cost'],prerequisites:['dp.one-dimensional-state','strings.palindrome-interval-state','dp.minimum-cost-recurrence'],checkpointIds:['dp-1d-11','dp-1d-12'],remedialIds:['dp-1d-01','dp-1d-02','dp-1d-17','binary-search-01','binary-search-02'],nextIds:['dp-1d-21','dp-1d-23'],objective:'Partition every character into palindrome pieces while minimizing cuts between consecutive pieces.',rationale:'A recognized palindrome can finish a partition of a prefix; minimize the preceding prefix cost rather than choosing the locally longest piece.',statement:'Split the entire text into consecutive nonempty pieces, each a palindrome. Return the smallest number of cuts between pieces. Every character must belong to exactly one piece, in order. A partition with k pieces has k-1 cuts, so a nonempty whole-text palindrome needs 0 cuts. The empty text also needs 0 cuts. Matching is literal and case-sensitive for ASCII characters. Return cuts, not the number of pieces, the longest palindrome length, or a list of pieces. Choosing a locally longest palindrome is not a proof of an optimal global partition.',constraints:['0 <= text.length <= 1000','Text contains ASCII characters','Return 0 for the empty text; otherwise at most text.length-1 cuts'],interface:'Solution.solve(text) returns the minimum number of palindrome partition cuts.',inputSchema:{kind:'object',properties:{text:{kind:'string',minLength:0,maxLength:1000,ascii:true}}},outputSchema:{kind:'integer',minimum:0,maximum:999},function:{arguments:[{name:'text',type:'string'}],returnType:'int'},visible:[{input:{text:'aab'},expected:1,explanation:'The partition aa | b has two pieces and one cut.'},{input:{text:'abacdc'},expected:1,explanation:'The partition aba | cdc has one cut even though the entire text is not a palindrome.'},{input:{text:''},expected:0,explanation:'No characters and no pieces require no cuts.'}],generate:cutsCases,oracle:minimumCuts,independent:cutsIndependent,mutations:{'return-piece-count':input=>input.text.length?minimumCuts(input)+1:0,'recognize-only-whole-text':({text})=>!text.length||isPalindrome(text,0,text.length-1)?0:text.length-1},languages:languages(true),
}];
if(process.argv[1]?.endsWith('backend-dp1-seventh.mjs'))for(const def of definitions)console.log(await materializePack(def));
