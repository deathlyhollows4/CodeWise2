import { seeded, materializePack } from '../pack-builder.mjs';
const common = {primaryTopic:'dp-1d', generatorModule:'content/authoring/batches/backend-dp1-fifth.mjs', checker:{kind:'exact'}};
function maximumSum({values}) {
  let ending=values[0],best=ending;
  for(let i=1;i<values.length;i++){ending=Math.max(values[i],ending+values[i]);best=Math.max(best,ending);}
  return best;
}
function independentSum({values}) {
  if(values.length>100){
    if(values.every(v=>v<=0))return Math.max(...values);
    if(values.every(v=>v>=0))return values.reduce((a,b)=>a+b,0);
    if(values.every((v,i)=>v===(i%2?-9:7)))return 7;
    // A single positive block, surrounded by nonpositive values, has a direct certificate.
    const positive=values.filter(v=>v>0);let seenPositive=false,closed=false;
    for(const v of values){if(v>0){if(closed)throw Error('Invalid single-block certificate');seenPositive=true;}else if(seenPositive)closed=true;}
    if(positive.length)return positive.reduce((a,b)=>a+b,0);
    throw Error('Independent large sum certificate unavailable');
  }
  let best=-Infinity;
  for(let left=0;left<values.length;left++){let sum=0;for(let right=left;right<values.length;right++){sum+=values[right];best=Math.max(best,sum);}}
  return best;
}
function sumCases(){
  const r=seeded(0xcc213),out=[];
  for(let i=0;i<760;i++)out.push({input:{values:Array.from({length:1+r()%35},()=>r()%101-50)},category:'all-contiguous-segments-independent-enumeration'});
  for(const values of [[-1000000000],[0],[1000000000],[-5,-1,-7],[5,-100,6],[0,-1,0],Array(100000).fill(1000000000),Array(100000).fill(-1000000000),Array(100000).fill(0),Array.from({length:100000},(_,i)=>i%2?-9:7),[...Array(20000).fill(-1000000000),...Array.from({length:40000},(_,i)=>i%3+1),...Array(40000).fill(-1)]])out.push({input:{values},category:values.length>100?'upper-bound-closed-form-certificate':'nonempty-negative-zero-and-disjoint-segments'});
  return out;
}
function maximumProduct({values}){
  let low=values[0],high=low,best=high;
  for(let i=1;i<values.length;i++){const v=values[i],a=low*v,b=high*v;low=Math.min(v,a,b);high=Math.max(v,a,b);best=Math.max(best,high);}
  return best===0?0:best;
}
function independentProduct({values}){
  let best=null;
  for(let left=0;left<values.length;left++){let product=1n;for(let right=left;right<values.length;right++){product*=BigInt(values[right]);if(best===null||product>best)best=product;}}
  return Number(best);
}
function productCases(){
  const r=seeded(0xcc214),out=[];
  for(let i=0;i<900;i++)out.push({input:{values:Array.from({length:1+r()%45},()=>r()%5-2)},category:'exact-bigint-all-contiguous-products'});
  for(const values of [[-2],[0],[2],[-2,0,-2],[-2,-2,-2],Array(45).fill(2),Array(45).fill(-2),Array(44).fill(-2),Array(45).fill(0),Array.from({length:45},(_,i)=>i%2?-1:2),[...Array(20).fill(-2),0,...Array(24).fill(-2)]])out.push({input:{values},category:'max-length-sign-parity-zero-restart-and-wide-products'});
  return out;
}
export const definitions=[{
  ...common,id:'dp-1d-13',slug:'maximum-nonempty-contiguous-sum',title:'Maximum contiguous sum',step:2,seed:'0xCC213',
  skillIds:['dp.one-dimensional-state','dp.restart-or-extend'],prerequisites:['dp.one-dimensional-state'],checkpointIds:['dp-1d-03','dp-1d-04'],remedialIds:['dp-1d-01','dp-1d-02'],nextIds:['dp-1d-14','dp-1d-05','dp-1d-06'],
  objective:'Maximize a nonempty contiguous segment by deciding whether to restart or extend the ending state.',
  rationale:'The ending segment may restart at the current value; a segment must remain nonempty even when every value is negative.',
  statement:'Return the largest sum of any nonempty contiguous segment of values. A contiguous segment uses every position between its first and last index. You may choose a single value. You may not skip interior positions or choose an empty segment. In particular, an all-negative input returns its largest individual value, rather than 0. The input is nonempty. Return a 64-bit integer and use a wide accumulator. Aim for O(n) time and constant extra state.',
  constraints:['1 <= values.length <= 100000','-1000000000 <= values[i] <= 1000000000','Every segment sum is within -100000000000000..100000000000000, a safe JSON integer'],
  interface:'Solution.solve(values) returns the maximum nonempty contiguous sum as long/integer.',
  inputSchema:{kind:'object',properties:{values:{kind:'array',minLength:1,maxLength:100000,items:{kind:'integer',minimum:-1000000000,maximum:1000000000}}}},outputSchema:{kind:'safe-integer',minimum:-100000000000000,maximum:100000000000000},function:{arguments:[{name:'values',type:'int[]'}],returnType:'long'},
  visible:[{input:{values:[-2,3,-1,4,-5]},expected:6,explanation:'The contiguous segment 3,-1,4 sums to 6.'},{input:{values:[-5,-1,-7]},expected:-1,explanation:'Choose the single value -1. An empty segment is not allowed.'},{input:{values:[5,-100,6]},expected:6,explanation:'Choose the final 6; choosing 5 and 6 together would skip an interior position.'}],
  generate:sumCases,oracle:maximumSum,independent:independentSum,
  mutations:{'allow-empty-segment':input=>Math.max(0,maximumSum(input)),'skip-negative-interior-values':({values})=>values.filter(v=>v>0).reduce((a,b)=>a+b,0)},
  languages:{
    java:{starter:'class Solution {\n    public long solve(int[] values) {\n        // TODO: choose the best nonempty contiguous segment.\n        return 0L;\n    }\n}\n',reference:'class Solution {\n    public long solve(int[] values) {\n        long ending = values[0], best = ending;\n        for (int i = 1; i < values.length; i++) {\n            ending = Math.max((long) values[i], ending + values[i]);\n            best = Math.max(best, ending);\n        }\n        return best;\n    }\n}\n'},
    cpp:{starter:'class Solution {\npublic:\n    long long solve(vector<int> values) {\n        // TODO: choose the best nonempty contiguous segment.\n        return 0;\n    }\n};\n',reference:'class Solution {\npublic:\n    long long solve(vector<int> values) {\n        long long ending = values[0], best = ending;\n        for (int i = 1; i < (int) values.size(); ++i) {\n            ending = max((long long) values[i], ending + values[i]);\n            best = max(best, ending);\n        }\n        return best;\n    }\n};\n'},
    python:{starter:'class Solution:\n    def solve(self, values):\n        # TODO: choose the best nonempty contiguous segment.\n        return 0\n',reference:'class Solution:\n    def solve(self, values):\n        ending = best = values[0]\n        for value in values[1:]:\n            ending = max(value, ending + value)\n            best = max(best, ending)\n        return best\n'},
  },
},{
  ...common,id:'dp-1d-14',slug:'maximum-nonempty-signed-contiguous-product',title:'Maximum signed contiguous product',step:3,seed:'0xCC214',
  skillIds:['dp.restart-or-extend','dp.signed-product-extremes'],prerequisites:['dp.one-dimensional-state','dp.restart-or-extend'],checkpointIds:['dp-1d-05','dp-1d-06'],remedialIds:['dp-1d-01','dp-1d-02','dp-1d-13'],nextIds:['dp-1d-07','dp-1d-08'],
  objective:'Track both ending extrema when maximizing a signed contiguous product; negative values exchange their roles.',
  rationale:'The most negative ending product can become the next maximum after multiplying by a negative value; zeros break the segment.',
  statement:'Return the largest product of any nonempty contiguous segment of values. The segment may contain a single value and may not skip any interior position. Values can be negative, zero, or positive. An empty segment with product 1 is not allowed. Multiplication by a negative value can turn an earlier minimum into a new maximum, while zero can separate useful segments. Use a 64-bit integer for every intermediate product. The limited input length and magnitude ensure that every contiguous product is exact in both signed 64-bit integers and safe JSON numbers.',
  constraints:['1 <= values.length <= 45','-2 <= values[i] <= 2','Every contiguous product has magnitude at most 2^45 = 35184372088832'],
  interface:'Solution.solve(values) returns the maximum nonempty contiguous product as long/integer.',
  inputSchema:{kind:'object',properties:{values:{kind:'array',minLength:1,maxLength:45,items:{kind:'integer',minimum:-2,maximum:2}}}},outputSchema:{kind:'safe-integer',minimum:-35184372088832,maximum:35184372088832},function:{arguments:[{name:'values',type:'int[]'}],returnType:'long'},
  visible:[{input:{values:[-2,1,-2]},expected:4,explanation:'The entire segment has product 4; its negative intermediate product becomes useful.'},{input:{values:[-2,0,-2]},expected:0,explanation:'Choose the zero. The two -2 values cannot form one segment without the interior zero.'},{input:{values:[-2]},expected:-2,explanation:'The only nonempty segment is the single negative value.'}],
  generate:productCases,oracle:maximumProduct,independent:independentProduct,
  mutations:{'carry-only-maximum-ending-product':({values})=>{let ending=values[0],best=ending;for(const v of values.slice(1)){ending=Math.max(v,ending*v);best=Math.max(best,ending);}return best;},'allow-empty-product-one':input=>Math.max(1,maximumProduct(input))},
  languages:{
    java:{starter:'class Solution {\n    public long solve(int[] values) {\n        // TODO: choose the best nonempty contiguous product.\n        return 0L;\n    }\n}\n',reference:'class Solution {\n    public long solve(int[] values) {\n        long low = values[0], high = low, best = high;\n        for (int i = 1; i < values.length; i++) {\n            long value = values[i], a = low * value, b = high * value;\n            low = Math.min(value, Math.min(a, b));\n            high = Math.max(value, Math.max(a, b));\n            best = Math.max(best, high);\n        }\n        return best;\n    }\n}\n'},
    cpp:{starter:'class Solution {\npublic:\n    long long solve(vector<int> values) {\n        // TODO: choose the best nonempty contiguous product.\n        return 0;\n    }\n};\n',reference:'class Solution {\npublic:\n    long long solve(vector<int> values) {\n        long long low = values[0], high = low, best = high;\n        for (int i = 1; i < (int) values.size(); ++i) {\n            long long value = values[i], a = low * value, b = high * value;\n            low = min(value, min(a, b));\n            high = max(value, max(a, b));\n            best = max(best, high);\n        }\n        return best;\n    }\n};\n'},
    python:{starter:'class Solution:\n    def solve(self, values):\n        # TODO: choose the best nonempty contiguous product.\n        return 0\n',reference:'class Solution:\n    def solve(self, values):\n        low = high = best = values[0]\n        for value in values[1:]:\n            a, b = low * value, high * value\n            low, high = min(value, a, b), max(value, a, b)\n            best = max(best, high)\n        return best\n'},
  },
}];
if(process.argv[1]?.endsWith('backend-dp1-fifth.mjs'))for(const def of definitions)console.log(await materializePack(def));
