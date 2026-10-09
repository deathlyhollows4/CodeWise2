// Original authored assets. Definitions only: importing this module never writes packs.
import { seeded } from './pack-builder.mjs';
import { buildFunctionStarters } from './harness.mjs';

const MOD=1000000007;
const gridSchema=(maximum)=>({kind:'object',properties:{grid:{kind:'array',minLength:0,maxLength:200,rectangular:true,items:{kind:'array',minLength:0,maxLength:200,items:{kind:'integer',minimum:0,maximum}}}}});
const matrix=(rows,cols,value)=>Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>typeof value==='function'?value(r,c):value));
function chooseMod(n,k){let result=1n;for(let i=1;i<=k;i++)result=result*BigInt(n-k+i)/BigInt(i);return Number(result%BigInt(MOD));}
export function routes({grid}){
  const rows=grid.length,cols=grid[0]?.length??0;if(!rows||!cols)return 0;
  const ways=Array(cols).fill(0);ways[0]=1;
  for(const row of grid)for(let c=0;c<cols;c++)ways[c]=row[c]?0:(ways[c]+(c?ways[c-1]:0))%MOD;
  return ways[cols-1];
}
export function routeIndependent({grid}){
  const rows=grid.length,cols=grid[0]?.length??0;if(!rows||!cols)return 0;
  if(rows>6||cols>6){
    if(grid.every(row=>row.every(v=>v===0)))return chooseMod(rows+cols-2,rows-1);
    if(grid.every((row,r)=>row.every((v,c)=>v===(r===0||c===cols-1?0:1))))return 1;
    if(grid[0][0]===1||grid[rows-1][cols-1]===1)return 0;
    throw Error('Uncertified large obstacle grid');
  }
  // Exhaustive move-word enumeration, with no recurrence table or memoization.
  let count=0;const length=rows+cols-2;
  for(let mask=0;mask<2**length;mask++){
    let r=0,c=0,ok=grid[0][0]===0;
    for(let bit=0;bit<length&&ok;bit++){if(mask&(1<<bit))r++;else c++;if(r>=rows||c>=cols||grid[r][c])ok=false;}
    if(ok&&r===rows-1&&c===cols-1)count++;
  }
  return count%MOD;
}
function routeCases(){
  const out=[{input:{grid:[]},category:'empty'},{input:{grid:[[]]},category:'zero-columns'},...[[[0]],[[1]],[[0,0,0]],[[0],[1],[0]]].map(grid=>({input:{grid},category:'degenerate'}))];
  // Every 3x3 binary obstacle configuration, then genuinely larger shapes.
  for(let mask=0;mask<512;mask++)out.push({input:{grid:matrix(3,3,(r,c)=>(mask>>(3*r+c))&1)},category:'exhaustive-3x3-obstacles'});
  const raw=seeded(0xd2d01),random=()=>raw()>>>8;for(let i=0;i<800;i++){const rows=4+random()%3,cols=4+random()%3;out.push({input:{grid:matrix(rows,cols,(r,c)=>r===0&&c===0||r===rows-1&&c===cols-1?0:random()%4===0?1:0)},category:'seeded-open-endpoint-obstacles'});}
  out.push({input:{grid:matrix(200,200,0)},category:'max-open-modular-count'},{input:{grid:matrix(200,200,(r,c)=>r===0||c===199?0:1)},category:'max-unique-corridor'},{input:{grid:matrix(200,200,(r,c)=>r===199&&c===199?1:0)},category:'max-blocked-destination'});
  return out;
}
export function minimumCost({grid}){
  const cols=grid[0]?.length??0;if(!grid.length||!cols)return 0;
  const dp=Array(cols).fill(Infinity);
  for(let r=0;r<grid.length;r++)for(let c=0;c<cols;c++)dp[c]=grid[r][c]+(r===0&&c===0?0:Math.min(dp[c],c?dp[c-1]:Infinity));
  return dp[cols-1];
}
export function costIndependent({grid}){
  const rows=grid.length,cols=grid[0]?.length??0;if(!rows||!cols)return 0;
  if(rows>6||cols>6){
    if(grid.every(row=>row.every(v=>v===grid[0][0])))return (rows+cols-1)*grid[0][0];
    if(grid.every((row,r)=>row.every((v,c)=>v===(r===0||c===cols-1?0:1000000000))))return 0;
    throw Error('Uncertified large cost grid');
  }
  let best=Infinity;const length=rows+cols-2;
  for(let mask=0;mask<2**length;mask++){
    let r=0,c=0,total=grid[0][0],ok=true;
    for(let bit=0;bit<length&&ok;bit++){if(mask&(1<<bit))r++;else c++;if(r>=rows||c>=cols)ok=false;else total+=grid[r][c];}
    if(ok&&r===rows-1&&c===cols-1)best=Math.min(best,total);
  }
  return best;
}
function costCases(){
  const raw=seeded(0xd2d02),random=()=>raw()>>>8,out=[{input:{grid:[]},category:'empty'},{input:{grid:[[]]},category:'zero-columns'},{input:{grid:[[1000000000]]},category:'max-value-singleton'},{input:{grid:[[0,0,0]]},category:'zero-row'},{input:{grid:[[1000000000],[1000000000],[1000000000]]},category:'overflow-column'}];
  for(let i=0;i<720;i++){const rows=1+random()%6,cols=1+random()%6;out.push({input:{grid:matrix(rows,cols,()=>random()%1001)},category:'seeded-small-costs'});}
  out.push({input:{grid:matrix(200,200,1000000000)},category:'max-wide-total'},{input:{grid:matrix(200,200,(r,c)=>r===0||c===199?0:1000000000)},category:'max-zero-corridor'},{input:{grid:matrix(200,200,0)},category:'max-zero-grid'});return out;
}
export function commonLength({a,b}){
  let dp=Array(b.length+1).fill(0);
  for(const x of a){const next=Array(b.length+1).fill(0);for(let j=1;j<=b.length;j++)next[j]=x===b[j-1]?dp[j-1]+1:Math.max(dp[j],next[j-1]);dp=next;}
  return dp[b.length];
}
export function subsequenceIndependent({a,b}){
  // Enumerate index subsets of the shorter sequence and scan the other sequence.
  if(a.length>b.length)[a,b]=[b,a];
  if(a.length>12){
    if(JSON.stringify(a)===JSON.stringify(b))return a.length;
    if(a.every(x=>x===a[0])&&b.every(x=>x===b[0]))return a[0]===b[0]?Math.min(a.length,b.length):0;
    if(a.every(x=>!b.includes(x)))return 0;
    throw Error('Uncertified large subsequence pair');
  }
  let best=0;for(let mask=0;mask<2**a.length;mask++){
    const chosen=a.filter((_,i)=>(mask>>i)&1);if(chosen.length<=best)continue;
    let j=0;for(const x of b)if(j<chosen.length&&x===chosen[j])j++;
    if(j===chosen.length)best=j;
  }return best;
}
// Numeric labels carry only equality information; exclude label renamings and swapped pairs.
export function commonSemanticKey({a,b}){
  const key=(x,y)=>{const labels=new Map();return JSON.stringify([x,y].map(z=>z.map(v=>{if(!labels.has(v))labels.set(v,labels.size);return labels.get(v);})));};
  return [key(a,b),key(b,a)].sort()[0];
}
function commonCases(){
  const raw=seeded(0xd2d03),random=()=>raw()>>>8,out=[],seen=new Set();
  const add=(a,b,category)=>{const input={a,b},key=commonSemanticKey(input);if(!seen.has(key)){seen.add(key);out.push({input,category});}};
  add([],[],'empty');add([],[1],'one-empty');add([1],[2],'unequal-singletons');add([1],[1],'equal-singletons');add([1,2,1],[1,1,2],'order-and-repetitions');
  let attempts=0;while(out.length<720){if(++attempts>20000)throw Error("Insufficient semantic diversity");const n=random()%12,m=random()%12;add(Array.from({length:n},()=>random()%4),Array.from({length:m},()=>random()%4),'seeded-equality-pattern');}
  add(Array.from({length:500},(_,i)=>i%7),Array.from({length:500},(_,i)=>i%7),'max-identical-sequences');
  add(Array(500).fill(1),Array(500).fill(2),'max-disjoint-sequences');
  add(Array(500).fill(1),Array(499).fill(1),'max-repeated-length-boundary');return out;
}
const provenance={origin:'original',author:'CodeWise2 DP2D author worker',reviewDate:'2026-10-08',reviewerType:'automated-author',rightsStatus:'original-no-imported-assets',assets:Object.fromEntries(['statement','examples','tests','references','explanation'].map(asset=>[asset,{origin:'original',sourceId:'codewise2-original',license:'project-owned'}])),independentReview:'pending'};
const base={primaryTopic:'dp-2d',generatorModule:'content/authoring/dp2d-first.mjs',version:'1.0.0',checker:{kind:'exact'},provenance,semanticConstraints:[]};
export const definitions=[
  {...base,id:'dp-2d-01',slug:'routes-around-closed-cells',title:'Routes around closed cells',step:1,seed:'0xD2D01',
    skillIds:['dp.two-coordinate-state','dp.grid-counting'],prerequisites:['dp.one-dimensional-state'],checkpointIds:['dp-2d-02'],remedialIds:['dp-1d-01'],nextIds:['dp-2d-03','dp-2d-04'],
    objective:'Count monotone grid routes while resetting blocked states and combining two incoming directions.',rationale:'You already combine counts for line positions. Track a row and column, and let closed cells contribute zero.',
    statement:'A rectangular grid uses 0 for an open cell and 1 for a closed cell. Start at the top-left cell and finish at the bottom-right cell. A move goes exactly one cell right or one cell down. You may only stand on open cells. Return the number of distinct move sequences modulo 1000000007. The starting and finishing cells are part of the route: a closed endpoint makes the answer zero. An open 1 by 1 grid has one empty move sequence. A grid with no rows or no columns has no route and returns 0. Rows and columns keep their input order. Do not enumerate all routes for large grids.',
    constraints:['0 <= rows <= 200; 0 <= columns <= 200','All rows have equal length','Every grid value is 0 or 1','Return a modular integer in 0..1000000006'],interface:'Solution.solve(grid) receives int[][] / vector<vector<int>> / list[list[int]] and returns an int.',inputSchema:gridSchema(1),outputSchema:{kind:'integer',minimum:0,maximum:MOD-1},function:{arguments:[{name:'grid',type:'int[][]'}],returnType:'int'},
    visible:[{input:{grid:[[0,0,0],[0,1,0],[0,0,0]]},expected:2,explanation:'The center is closed. Only the route along the top then right edge and the route along the left then bottom edge survive.'},{input:{grid:[[0]]},expected:1,explanation:'The start is already the finish; no move is needed.'},{input:{grid:[[1,0],[0,0]]},expected:0,explanation:'A route cannot begin on a closed starting cell.'}],generate:routeCases,oracle:routes,independent:routeIndependent,
    semanticKey:({grid})=>!grid.length||!grid[0].length?'empty-grid':grid[0][0]||grid.at(-1).at(-1)?'closed-endpoint':JSON.stringify(grid),
    mutations:{'ignore-closed-cells':({grid})=>routes({grid:grid.map(row=>row.map(()=>0))}),'count-diagonal-moves':({grid})=>{if(!grid.length||!grid[0].length)return 0;const dp=grid.map(row=>row.map(()=>0));for(let r=0;r<grid.length;r++)for(let c=0;c<grid[0].length;c++)if(!grid[r][c])dp[r][c]=(r===0&&c===0?1:((r?dp[r-1][c]:0)+(c?dp[r][c-1]:0)+(r&&c?dp[r-1][c-1]:0))%MOD);return dp.at(-1).at(-1);}},
    languages:{java:{reference:'class Solution { public int solve(int[][] grid) { int m=grid.length,n=m==0?0:grid[0].length; if(n==0)return 0; int[] dp=new int[n]; dp[0]=1; for(int[] row:grid)for(int c=0;c<n;c++)dp[c]=row[c]==1?0:(dp[c]+(c>0?dp[c-1]:0))%1000000007; return dp[n-1]; } }'},cpp:{reference:'class Solution { public: int solve(vector<vector<int>> grid) { int n=grid.empty()?0:grid[0].size(); if(!n)return 0; vector<int> dp(n);dp[0]=1;for(auto& row:grid)for(int c=0;c<n;c++)dp[c]=row[c]?0:(dp[c]+(c?dp[c-1]:0))%1000000007;return dp[n-1]; } };'},python:{reference:'class Solution:\n    def solve(self, grid):\n        if not grid or not grid[0]:\n            return 0\n        dp = [0]*len(grid[0])\n        dp[0] = 1\n        for row in grid:\n            for c, closed in enumerate(row):\n                dp[c] = 0 if closed else (dp[c]+(dp[c-1] if c else 0))%1000000007\n        return dp[-1]\n'}}},
  {...base,id:'dp-2d-02',slug:'least-cost-right-down-route',title:'Least cost of a right-down route',step:1,seed:'0xD2D02',
    skillIds:['dp.two-coordinate-state','dp.grid-minimum-cost'],prerequisites:['dp.one-dimensional-state'],checkpointIds:['dp-2d-01'],remedialIds:['dp-1d-02'],nextIds:['dp-2d-03','dp-2d-04'],
    objective:'Minimize a monotone grid route using the cheaper incoming state and include both endpoints.',rationale:'Use familiar two-predecessor states to minimize a cost; a grid adds row and column boundaries.',
    statement:'Each cell of a rectangular grid has a nonnegative visit cost. Start at the top-left cell, finish at the bottom-right cell, and move exactly one cell right or down at a time. The total cost is the sum of every cell you stand on, including both endpoints. Return the smallest possible total. There are no closed cells, and you cannot move diagonally or leave the grid. A grid with no rows or no columns returns 0. Use a 64-bit integer accumulator in Java/C++; the answer can exceed a 32-bit integer. Input row and column order is meaningful.',
    constraints:['0 <= rows <= 200; 0 <= columns <= 200','All rows have equal length','0 <= grid[r][c] <= 1000000000','0 <= result <= 399000000000'],interface:'Solution.solve(grid) receives an integer matrix and returns long / long long / int.',inputSchema:gridSchema(1000000000),outputSchema:{kind:'safe-integer',minimum:0,maximum:399000000000},function:{arguments:[{name:'grid',type:'int[][]'}],returnType:'long'},
    visible:[{input:{grid:[[2,8,1],[3,1,4]]},expected:10,explanation:'Down, right, right visits costs 2+3+1+4=10, cheaper than the other two routes.'},{input:{grid:[]},expected:0,explanation:'An empty grid has no cells to charge.'},{input:{grid:[[9,0],[0,7]]},expected:16,explanation:'Either route pays both the starting 9 and finishing 7.'}],generate:costCases,oracle:minimumCost,independent:costIndependent,
    mutations:{'omit-starting-cost':({grid})=>minimumCost({grid})-(grid[0]?.[0]??0),'narrow-signed32-total':input=>minimumCost(input)|0,'local-cheapest-neighbor':({grid})=>{if(!grid.length||!grid[0].length)return 0;let r=0,c=0,sum=grid[0][0];while(r<grid.length-1||c<grid[0].length-1){if(c===grid[0].length-1||(r<grid.length-1&&grid[r+1][c]<grid[r][c+1]))r++;else c++;sum+=grid[r][c];}return sum;}},
    languages:{java:{reference:'class Solution { public long solve(int[][] grid) { int m=grid.length,n=m==0?0:grid[0].length;if(n==0)return 0;long[] dp=new long[n];Arrays.fill(dp,Long.MAX_VALUE/4);for(int r=0;r<m;r++)for(int c=0;c<n;c++)dp[c]=grid[r][c]+(r==0&&c==0?0:Math.min(dp[c],c>0?dp[c-1]:Long.MAX_VALUE/4));return dp[n-1]; } }'},cpp:{reference:'class Solution { public: long long solve(vector<vector<int>> grid) { int n=grid.empty()?0:grid[0].size();if(!n)return 0;const long long INF=LLONG_MAX/4;vector<long long> dp(n,INF);for(int r=0;r<(int)grid.size();r++)for(int c=0;c<n;c++)dp[c]=grid[r][c]+(r==0&&c==0?0:min(dp[c],c?dp[c-1]:INF));return dp[n-1]; } };'},python:{reference:'class Solution:\n    def solve(self, grid):\n        if not grid or not grid[0]:\n            return 0\n        dp = [float("inf")]*len(grid[0])\n        for r, row in enumerate(grid):\n            for c, cost in enumerate(row):\n                dp[c] = cost+(0 if r == 0 and c == 0 else min(dp[c], dp[c-1] if c else float("inf")))\n        return dp[-1]\n'}}},
  {...base,id:'dp-2d-03',slug:'longest-shared-ordered-subsequence',title:'Longest shared ordered subsequence',step:2,seed:'0xD2D03',
    skillIds:['dp.two-coordinate-state','dp.two-prefix-state','dp.common-subsequence'],prerequisites:['dp.two-coordinate-state'],checkpointIds:['dp-2d-04'],remedialIds:['dp-2d-01','dp-2d-02'],nextIds:['dp-2d-05','dp-2d-06'],
    objective:'Maximize a common subsequence length by matching or skipping positions in two prefixes.',rationale:'Keep two coordinates, now one prefix length per sequence. Matching values adds a diagonal transition.',
    statement:'Given two integer sequences a and b, return the greatest length of a sequence obtainable from each by deleting zero or more positions. Remaining positions must keep their original order, but do not need to be consecutive. Equality means equal integer values; repeated equal values at different positions remain separate positions. Return only the length, not a chosen subsequence or the number of choices. Either sequence may be empty, giving 0. For example, deleting the middle value of [4,9,4] leaves [4,4]. Changing the sequence order is not permitted.',
    constraints:['0 <= a.length,b.length <= 500','-1000000000 <= a[i],b[i] <= 1000000000','0 <= answer <= min(a.length,b.length)'],interface:'Solution.solve(a,b) receives two int[] / vector<int> / list[int] values and returns an int.',inputSchema:{kind:'object',properties:Object.fromEntries(['a','b'].map(k=>[k,{kind:'array',minLength:0,maxLength:500,items:{kind:'integer',minimum:-1000000000,maximum:1000000000}}]))},outputSchema:{kind:'integer',minimum:0,maximum:500},function:{arguments:[{name:'a',type:'int[]'},{name:'b',type:'int[]'}],returnType:'int'},semanticKey:commonSemanticKey,
    visible:[{input:{a:[4,9,4,2],b:[9,4,2,8]},expected:3,explanation:'The shared subsequence [9,4,2] has length 3; the sequences cannot share four positions in order.'},{input:{a:[],b:[3,4]},expected:0,explanation:'An empty sequence has no nonempty subsequence.'},{input:{a:[1,2,1],b:[1,1,2]},expected:2,explanation:'Either [1,1] or [1,2] works. Reordering to obtain three matches is forbidden.'}],generate:commonCases,oracle:commonLength,independent:subsequenceIndependent,
    mutations:{'multiset-intersection':({a,b})=>{const count=new Map();for(const x of b)count.set(x,(count.get(x)??0)+1);let n=0;for(const x of a)if(count.get(x)){n++;count.set(x,count.get(x)-1);}return n;},'require-contiguous-match':({a,b})=>{let best=0;for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){let n=0;while(i+n<a.length&&j+n<b.length&&a[i+n]===b[j+n])n++;best=Math.max(best,n);}return best;}},
    languages:{java:{reference:'class Solution { public int solve(int[] a,int[] b) { int[] dp=new int[b.length+1];for(int x:a){int diagonal=0;for(int j=1;j<=b.length;j++){int old=dp[j];dp[j]=x==b[j-1]?diagonal+1:Math.max(dp[j],dp[j-1]);diagonal=old;}}return dp[b.length]; } }'},cpp:{reference:'class Solution { public: int solve(vector<int> a,vector<int> b) { vector<int> dp(b.size()+1);for(int x:a){int diagonal=0;for(int j=1;j<=(int)b.size();j++){int old=dp[j];dp[j]=x==b[j-1]?diagonal+1:max(dp[j],dp[j-1]);diagonal=old;}}return dp[b.size()]; } };'},python:{reference:'class Solution:\n    def solve(self, a, b):\n        dp = [0]*(len(b)+1)\n        for x in a:\n            diagonal = 0\n            for j in range(1, len(b)+1):\n                old = dp[j]\n                dp[j] = diagonal+1 if x == b[j-1] else max(dp[j], dp[j-1])\n                diagonal = old\n        return dp[-1]\n'}}}
];
for(const d of definitions){
  const starters=buildFunctionStarters(d.function);for(const lang of ['java','cpp','python'])d.languages[lang].starter=starters[lang];
  if(d.semanticKey){const generate=d.generate;d.generate=()=>{const seen=new Set(d.visible.map(c=>d.semanticKey(c.input)));return generate().filter(c=>{const k=d.semanticKey(c.input);if(seen.has(k))return false;seen.add(k);return true;});};}
}
