import {seeded,materializePack} from '../pack-builder.mjs';
const MOD=1000000007;
function derangements({n}){let a=1,b=0;if(n===0)return a;for(let i=2;i<=n;i++){const next=((i-1)*(a+b))%MOD;a=b;b=next;}return b;}
const factorial=[1n],inverseFactorial=[];
function power(a,n){let out=1n;while(n){if(n&1n)out=out*a%1000000007n;a=a*a%1000000007n;n>>=1n;}return out;}
function prepareInclusionExclusion(){for(let i=1;i<=100000;i++)factorial[i]=factorial[i-1]*BigInt(i)%1000000007n;inverseFactorial[100000]=power(factorial[100000],1000000005n);for(let i=100000;i>0;i--)inverseFactorial[i-1]=inverseFactorial[i]*BigInt(i)%1000000007n;}
function derangementsIndependent({n}){if(!inverseFactorial.length)prepareInclusionExclusion();let sum=0n;for(let fixed=0;fixed<=n;fixed++)sum=(sum+(fixed%2?-1n:1n)*inverseFactorial[fixed]+1000000007n)%1000000007n;return Number(factorial[n]*sum%1000000007n);}
function derangementCases(){const out=[];for(let n=0;n<=600;n++)out.push({input:{n},category:'distinct-size-independent-inclusion-exclusion'});for(const n of [999,1000,10000,99999,100000])out.push({input:{n},category:'upper-bound-modular-factorial-certificate'});return out;}
function cooldown({prices}){let hold=-Infinity,sold=-Infinity,rest=0;for(const price of prices){const nextHold=Math.max(hold,rest-price),nextSold=hold+price,nextRest=Math.max(rest,sold);hold=nextHold;sold=nextSold;rest=nextRest;}return Math.max(rest,sold);}
function exhaustiveTrades(prices,from=0){let best=0;for(let buy=from;buy<prices.length;buy++)for(let sell=buy+1;sell<prices.length;sell++)best=Math.max(best,prices[sell]-prices[buy]+exhaustiveTrades(prices,sell+2));return best;}
function cooldownIndependent({prices}){if(prices.length<=12)return exhaustiveTrades(prices);if(prices.every((v,i)=>!i||v>=prices[i-1]))return prices.at(-1)-prices[0];if(prices.every((v,i)=>!i||v<=prices[i-1]))return 0;if(prices.every((v,i)=>v===[0,2,2][i%3]))return 2*Math.floor((prices.length+1)/3);if(prices.every((v,i)=>v===[0,1000000000,1000000000][i%3]))return 1000000000*Math.floor((prices.length+1)/3);throw Error('Large input lacks an independent trading certificate');}
function cooldownCases(){const r=seeded(0xcc221),out=[];for(let i=0;i<850;i++)out.push({input:{prices:Array.from({length:r()%13},()=>r()%31)},category:'all-buy-sell-pair-plans-with-explicit-sale-plus-two-next-buy'});for(const prices of [[],[0],[1,2,3,0,2],[1,2,1,2],[10,1,10,1,10],[0,1000000000,0,1000000000],Array(100000).fill(1000000000),Array.from({length:100000},(_,i)=>i*10000),Array.from({length:100000},(_,i)=>(99999-i)*10000),Array.from({length:100000},(_,i)=>[0,2,2][i%3]),Array.from({length:100000},(_,i)=>[0,1000000000,1000000000][i%3])])out.push({input:{prices},category:prices.length>12?'upper-bound-monotone-or-separated-profitable-block-certificate':'empty-single-day-and-mandatory-rest-day'});return out;}
function simpleLanguages({javaSignature,cppSignature,pythonArgs,zero='0',javaBody,cppBody,pythonBody}){const returnType=javaSignature.startsWith('long')?'long':'int';return {
 java:{starter:`class Solution {\n    public ${javaSignature} {\n        // TODO: implement the stated contract.\n        return ${zero};\n    }\n}\n`,reference:`class Solution {\n    public ${javaSignature} {\n${javaBody}\n    }\n}\n`},
 cpp:{starter:`class Solution {\npublic:\n    ${cppSignature} {\n        // TODO: implement the stated contract.\n        return ${zero==='0L'?'0LL':zero};\n    }\n};\n`,reference:`class Solution {\npublic:\n    ${cppSignature} {\n${cppBody}\n    }\n};\n`},
 python:{starter:`class Solution:\n    def solve(self, ${pythonArgs}):\n        # TODO: implement the stated contract.\n        return 0\n`,reference:`class Solution:\n    def solve(self, ${pythonArgs}):\n${pythonBody}\n`},returnType
};}
const cooldownLanguages=simpleLanguages({javaSignature:'long solve(int[] prices)',cppSignature:'long long solve(vector<int> prices)',pythonArgs:'prices',zero:'0L',javaBody:`        long hold=Long.MIN_VALUE/4,sold=Long.MIN_VALUE/4,rest=0;
        for(int price:prices) {
            long nextHold=Math.max(hold,rest-price);
            long nextSold=hold+price;
            long nextRest=Math.max(rest,sold);
            hold=nextHold; sold=nextSold; rest=nextRest;
        }
        return Math.max(rest,sold);`,cppBody:`        long long hold=-(1LL<<60),sold=-(1LL<<60),rest=0;
        for(int price:prices) {
            long long nextHold=max(hold,rest-price);
            long long nextSold=hold+price;
            long long nextRest=max(rest,sold);
            hold=nextHold; sold=nextSold; rest=nextRest;
        }
        return max(rest,sold);`,pythonBody:`        hold = sold = float('-inf')
        rest = 0
        for price in prices:
            hold, sold, rest = max(hold, rest-price), hold+price, max(rest, sold)
        return max(rest, sold)`});
const derangementLanguages=simpleLanguages({javaSignature:'int solve(int n)',cppSignature:'int solve(int n)',pythonArgs:'n',javaBody:`        if(n==0) return 1;
        long a=1,b=0;
        for(int size=2;size<=n;size++) {
            long next=(size-1)*(a+b)%1000000007L;
            a=b; b=next;
        }
        return (int)b;`,cppBody:`        if(n==0) return 1;
        long long a=1,b=0;
        for(int size=2;size<=n;size++) {
            long long next=(size-1)*(a+b)%1000000007LL;
            a=b; b=next;
        }
        return (int)b;`,pythonBody:`        if n == 0:
            return 1
        a, b = 1, 0
        for size in range(2, n+1):
            a, b = b, (size-1)*(a+b) % 1000000007
        return b`});
delete cooldownLanguages.returnType;delete derangementLanguages.returnType;
const common={primaryTopic:'dp-1d',generatorModule:'content/authoring/batches/backend-dp1-ninth.mjs',checker:{kind:'exact'}};
export const definitions=[{
 ...common,id:'dp-1d-21',slug:'complete-transactions-with-a-full-next-day-cooldown',title:'Trading with a full-day cooldown',step:7,seed:'0xCC221',skillIds:['dp.temporal-action-state','dp.cooldown-transition'],prerequisites:['dp.one-dimensional-state','dp.take-or-skip'],checkpointIds:['dp-1d-23'],remedialIds:['dp-1d-01','dp-1d-03'],nextIds:[],objective:'Optimize complete buy/sell transactions while distinguishing a just-sold state from cash that is allowed to buy.',rationale:'A sale disables buying on the following day, so two cash states with equal profit can have different legal next actions.',statement:'prices[i] is the nonnegative price of one share on day i. Start with no shares and may hold at most one share. Each day you may buy, sell a previously held share, or do nothing; at most one action is allowed that day. After a sale on day i, you may not buy on day i+1. The earliest next purchase is day i+2. There is no transaction fee and no limit on the number of transactions. End with no shares and return the maximum total realized profit; doing no transactions is allowed. Empty or single-day prices returns 0. Selling and buying on the same day is not allowed. This cooldown is a temporal eligibility constraint, not a deduction from each transaction price.',constraints:['0 <= prices.length <= 100000','0 <= prices[i] <= 1000000000','Use a signed 64-bit accumulator; the answer is JavaScript-safe and at most 50000000000000'],interface:'Solution.solve(prices) returns the maximum complete-transaction profit.',inputSchema:{kind:'object',properties:{prices:{kind:'array',minLength:0,maxLength:100000,items:{kind:'integer',minimum:0,maximum:1000000000}}}},outputSchema:{kind:'safe-integer',minimum:0,maximum:50000000000000},function:{arguments:[{name:'prices',type:'int[]'}],returnType:'long'},visible:[{input:{prices:[1,2,3,0,2]},expected:3,explanation:'Buy day0 and sell day1 for1, rest day2, then buy day3 and sell day4 for2.'},{input:{prices:[1,2,1,2]},expected:1,explanation:'Two adjacent profitable trades would buy immediately after a sale; that violates the full-day cooldown.'},{input:{prices:[]},expected:0,explanation:'There are no complete transactions.'}],generate:cooldownCases,oracle:cooldown,independent:cooldownIndependent,mutations:{'narrow-profit-to-int32':input=>cooldown(input)|0,'ignore-cooldown':({prices})=>prices.reduce((sum,p,i)=>sum+(i?Math.max(0,p-prices[i-1]):0),0),'allow-only-one-transaction':({prices})=>{let low=Infinity,best=0;for(const p of prices){low=Math.min(low,p);best=Math.max(best,p-low);}return best;}},languages:cooldownLanguages,
},{
 ...common,id:'dp-1d-22',slug:'count-permutations-with-no-original-position',title:'Count derangements',step:4,seed:'0xCC222',skillIds:['dp.combinatorial-insertion-state','math.forbidden-fixed-point-count'],prerequisites:['dp.one-dimensional-state'],checkpointIds:['dp-1d-15','dp-1d-24'],remedialIds:['dp-1d-01'],nextIds:['dp-1d-09','dp-1d-16','dp-1d-17','dp-1d-20'],objective:'Count permutations in which every labelled item leaves its original position, using the paired-cycle insertion cases.',rationale:'Placing the first item introduces two different cases: its destination item either returns to the first position or continues a longer cycle.',statement:'There are n distinct labelled items and n distinct positions, both numbered 0 through n-1. Count permutations of the items into the positions for which no item appears in its original position. Every item appears exactly once and every position receives exactly one item. Return the count modulo 1000000007. The empty permutation is valid, so n=0 returns 1; n=1 returns 0. Labels are fixed by n and are not an input list: changing their names does not create extra test inputs or extra permutations. This asks for the number of derangements, not all permutations, assignments that merely move at least one item, or an explicit enumeration.',constraints:['0 <= n <= 100000','All n labelled items and positions are distinct','Return a residue from 0 through 1000000006'],interface:'Solution.solve(n) returns the no-fixed-position permutation count modulo 1000000007.',inputSchema:{kind:'object',properties:{n:{kind:'integer',minimum:0,maximum:100000}}},outputSchema:{kind:'integer',minimum:0,maximum:1000000006},function:{arguments:[{name:'n',type:'int'}],returnType:'int'},visible:[{input:{n:0},expected:1,explanation:'The empty permutation violates no position constraint.'},{input:{n:2},expected:1,explanation:'Only swapping the two items moves both away from their original positions.'},{input:{n:3},expected:2,explanation:'The two directed three-cycles are the only permutations with no fixed position.'}],generate:derangementCases,oracle:derangements,independent:derangementsIndependent,mutations:{'count-all-permutations':({n})=>{let f=1;for(let i=2;i<=n;i++)f=f*i%MOD;return f;},'empty-permutation-is-invalid':input=>input.n?derangements(input):0},languages:derangementLanguages,
}];
if(process.argv[1]?.endsWith('backend-dp1-ninth.mjs'))for(const def of definitions)console.log(await materializePack(def));
