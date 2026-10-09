import {seeded,materializePack} from '../pack-builder.mjs';
function exactlySixty(fixed,make,visible){const excluded=new Set(visible.map(JSON.stringify)),keys=new Set(),out=[];const add=c=>{const key=JSON.stringify(c.input);if(!excluded.has(key)&&!keys.has(key)){keys.add(key);out.push(c);}};for(const c of fixed)add(c);for(let tries=0;out.length<60&&tries<10000;tries++)add(make());if(out.length!==60)throw Error('Curated exact60 distinct hidden inputs not satisfied');return out;}
function weighted({starts,durations,rewards}){const jobs=starts.map((start,i)=>({start,end:start+durations[i],reward:rewards[i]})).sort((a,b)=>a.end-b.end||a.start-b.start),dp=Array(jobs.length+1).fill(0);for(let i=0;i<jobs.length;i++){let lo=0,hi=i;while(lo<hi){const mid=Math.floor((lo+hi)/2);if(jobs[mid].end<=jobs[i].start)lo=mid+1;else hi=mid;}dp[i+1]=Math.max(dp[i],jobs[i].reward+dp[lo]);}return dp.at(-1);}
function weightedIndependent({starts,durations,rewards}){if(starts.length>12){if(starts.every((start,i)=>!i||starts[i-1]+durations[i-1]<=start))return rewards.reduce((a,b)=>a+b,0);if(starts.every((start,i)=>start+durations[i]>starts.at(-1)))return Math.max(...rewards);throw Error('Large schedule lacks independent structural certificate');}let best=0;for(let mask=0;mask<(1<<starts.length);mask++){let end=-1,total=0,valid=true;for(let i=0;i<starts.length;i++)if(mask&(1<<i)){if(starts[i]<end){valid=false;break;}end=starts[i]+durations[i];total+=rewards[i];}if(valid)best=Math.max(best,total);}return best;}
const weightedVisible=[{starts:[0,2,4],durations:[2,2,2],rewards:[5,6,7]},{starts:[0,1,3],durations:[4,1,2],rewards:[20,7,8]},{starts:[],durations:[],rewards:[]}];
function weightedCases(){const r=seeded(0xcc223),fixed=[{input:{starts:[0],durations:[1],rewards:[0]},category:'zero-reward-real-job'},{input:{starts:[0],durations:[1000000000],rewards:[1000000000]},category:'time-and-reward-upper-bound'},{input:{starts:[0,2],durations:[2,1],rewards:[9,11]},category:'touching-half-open-jobs-compatible'},{input:{starts:[0,1,2],durations:[1,5,1],rewards:[8,10,8]},category:'large-middle-job-versus-two-short-jobs'},{input:{starts:Array.from({length:50000},(_,i)=>i*3),durations:Array(50000).fill(2),rewards:Array(50000).fill(1000000000)},category:'upper-bound-50000-independent-jobs-int64-certificate'},{input:{starts:Array.from({length:50000},(_,i)=>i),durations:Array(50000).fill(100000),rewards:Array.from({length:50000},(_,i)=>1000000000-i)},category:'upper-bound-50000-all-overlap-max-reward-certificate'}];return exactlySixty(fixed,()=>{const n=r()%13,starts=[];let time=r()%4;for(let i=0;i<n;i++){time+=1+r()%4;starts.push(time);}return {input:{starts,durations:Array.from({length:n},()=>1+r()%15),rewards:Array.from({length:n},()=>r()%50)},category:'all-index-subsets-independent-schedule-optimum'};},weightedVisible);}
function wiggle({values}){if(!values.length)return 0;let up=1,down=1;for(let i=1;i<values.length;i++){if(values[i]>values[i-1])up=down+1;else if(values[i]<values[i-1])down=up+1;}return Math.max(up,down);}
function wiggleIndependent({values}){if(values.length>12){if(values.every((v,i)=>!i||v===values[0]))return 1;if(values.every((v,i)=>!i||v>values[i-1])||values.every((v,i)=>!i||v<values[i-1]))return Math.min(2,values.length);if(values.every((v,i)=>v===i%2))return values.length;throw Error('Large sequence lacks independent wiggle certificate');}let best=0;for(let mask=0;mask<(1<<values.length);mask++){let last,sign=0,count=0,valid=true;for(let i=0;i<values.length;i++)if(mask&(1<<i)){if(last!==undefined){const current=values[i]>last?1:values[i]<last?-1:0;if(!current||current===sign){valid=false;break;}sign=current;}last=values[i];count++;}if(valid)best=Math.max(best,count);}return best;}
const wiggleVisible=[{values:[1,7,4,9,2,5]},{values:[1,2,3,4]},{values:[]}];
function wiggleCases(){const r=seeded(0xcc224),fixed=[...[[0],[2,2],[1,1,2,2,1],[3,2,1],[-1000000000,1000000000,-1000000000],[1,3,2,2,4,1]].map(values=>({input:{values},category:'zero-differences-equal-plateaus-signs-and-extrema'})),{input:{values:Array(100000).fill(1000000000)},category:'upper-bound-all-equal-singleton-optimum'},{input:{values:Array.from({length:100000},(_,i)=>i)},category:'upper-bound-strict-increase-only-two-terms'},{input:{values:Array.from({length:100000},(_,i)=>100000-i)},category:'upper-bound-strict-decrease-only-two-terms'},{input:{values:Array.from({length:100000},(_,i)=>i%2)},category:'upper-bound-every-term-alternates'}];return exactlySixty(fixed,()=>({input:{values:Array.from({length:r()%13},()=>r()%15-7)},category:'all-index-subsets-independent-alternating-sign-optimum'}),wiggleVisible);}
const weightedLanguages={
 java:{starter:'class Solution {\n    public long solve(int[] starts, int[] durations, int[] rewards) {\n        // TODO: select a compatible profitable schedule.\n        return 0L;\n    }\n}\n',reference:`class Solution {
    public long solve(int[] starts, int[] durations, int[] rewards) {
        int n=starts.length;
        Integer[] order=new Integer[n];
        for(int i=0;i<n;i++) order[i]=i;
        java.util.Arrays.sort(order,(a,b)->Integer.compare(starts[a]+durations[a],starts[b]+durations[b]));
        long[] dp=new long[n+1];
        for(int i=0;i<n;i++) {
            int job=order[i],lo=0,hi=i;
            while(lo<hi) {
                int mid=lo+(hi-lo)/2,prior=order[mid];
                if(starts[prior]+durations[prior]<=starts[job]) lo=mid+1;
                else hi=mid;
            }
            dp[i+1]=Math.max(dp[i],rewards[job]+dp[lo]);
        }
        return dp[n];
    }
}
`},
 cpp:{starter:'class Solution {\npublic:\n    long long solve(vector<int> starts, vector<int> durations, vector<int> rewards) {\n        // TODO: select a compatible profitable schedule.\n        return 0LL;\n    }\n};\n',reference:`class Solution {
public:
    long long solve(vector<int> starts, vector<int> durations, vector<int> rewards) {
        int n=starts.size();
        vector<int> order(n);
        iota(order.begin(),order.end(),0);
        sort(order.begin(),order.end(),[&](int a,int b){return starts[a]+durations[a]<starts[b]+durations[b];});
        vector<long long> dp(n+1,0);
        for(int i=0;i<n;i++) {
            int job=order[i],lo=0,hi=i;
            while(lo<hi) {
                int mid=lo+(hi-lo)/2,prior=order[mid];
                if(starts[prior]+durations[prior]<=starts[job]) lo=mid+1;
                else hi=mid;
            }
            dp[i+1]=max(dp[i],rewards[job]+dp[lo]);
        }
        return dp[n];
    }
};
`},
 python:{starter:'class Solution:\n    def solve(self, starts, durations, rewards):\n        # TODO: select a compatible profitable schedule.\n        return 0\n',reference:`class Solution:
    def solve(self, starts, durations, rewards):
        jobs = sorted((start+duration, start, reward) for start, duration, reward in zip(starts, durations, rewards))
        dp = [0]*(len(jobs)+1)
        for i, (end, start, reward) in enumerate(jobs):
            lo, hi = 0, i
            while lo < hi:
                mid = (lo+hi)//2
                if jobs[mid][0] <= start:
                    lo = mid+1
                else:
                    hi = mid
            dp[i+1] = max(dp[i], reward+dp[lo])
        return dp[-1]
`}
};
const wiggleLanguages={java:{starter:'class Solution {\n    public int solve(int[] values) {\n        // TODO: choose an alternating-sign subsequence.\n        return 0;\n    }\n}\n',reference:'class Solution {\n    public int solve(int[] values) {\n        if(values.length==0) return 0;\n        int up=1,down=1;\n        for(int i=1;i<values.length;i++) {\n            if(values[i]>values[i-1]) up=down+1;\n            else if(values[i]<values[i-1]) down=up+1;\n        }\n        return Math.max(up,down);\n    }\n}\n'},cpp:{starter:'class Solution {\npublic:\n    int solve(vector<int> values) {\n        // TODO: choose an alternating-sign subsequence.\n        return 0;\n    }\n};\n',reference:'class Solution {\npublic:\n    int solve(vector<int> values) {\n        if(values.empty()) return 0;\n        int up=1,down=1;\n        for(int i=1;i<(int)values.size();i++) {\n            if(values[i]>values[i-1]) up=down+1;\n            else if(values[i]<values[i-1]) down=up+1;\n        }\n        return max(up,down);\n    }\n};\n'},python:{starter:'class Solution:\n    def solve(self, values):\n        # TODO: choose an alternating-sign subsequence.\n        return 0\n',reference:'class Solution:\n    def solve(self, values):\n        if not values:\n            return 0\n        up = down = 1\n        for i in range(1, len(values)):\n            if values[i] > values[i-1]:\n                up = down+1\n            elif values[i] < values[i-1]:\n                down = up+1\n        return max(up, down)\n'}};
const scalar={kind:'integer',minimum:0,maximum:1000000000},array=items=>({kind:'array',minLength:0,maxLength:50000,items}),common={primaryTopic:'dp-1d',generatorModule:'content/authoring/batches/backend-dp1-tenth.mjs',checker:{kind:'exact'}};
export const definitions=[{
 ...common,id:'dp-1d-23',slug:'maximum-reward-compatible-calendar-jobs',title:'Maximum compatible job reward',step:7,seed:'0xCC223',skillIds:['dp.weighted-compatible-predecessor','binary-search.compatible-end-bound'],prerequisites:['dp.one-dimensional-state','dp.take-or-skip','binary-search.halving'],checkpointIds:['dp-1d-21'],remedialIds:['dp-1d-01','dp-1d-03','binary-search-01','binary-search-02'],nextIds:[],objective:'Choose a maximum-reward nonoverlapping schedule by combining a job with the best compatible predecessor prefix.',rationale:'Jobs can overlap arbitrary earlier jobs, so take-or-skip decisions need a searched compatible end boundary rather than the immediately preceding job.',statement:'Three equal-length arrays describe jobs: job i starts at starts[i], lasts durations[i] time units and earns rewards[i] if completed. Starts are strictly increasing, so each job has a distinct start time; durations are positive. A job occupies the half-open interval [start, start+duration), so one job may end exactly when another begins. Choose any subset of nonoverlapping jobs and return the maximum total reward. Completing no jobs is allowed. Jobs cannot be split or partially rewarded. Reward is not a priority rule: taking the largest single reward or the earliest finish greedily can miss the best compatible combination. Use a 64-bit total; all reported answers remain JavaScript-safe.',constraints:['0 <= starts.length = durations.length = rewards.length <= 50000','Starts are strictly increasing, each in 0..1000000000','Each duration is in 1..1000000000; each reward is in 0..1000000000','The maximum total reward is 50000000000000; each end time is at most 2000000000'],interface:'Solution.solve(starts, durations, rewards) returns the maximum compatible total reward.',inputSchema:{kind:'object',properties:{starts:array(scalar),durations:array({kind:'integer',minimum:1,maximum:1000000000}),rewards:array(scalar)}},semanticConstraints:[{kind:'sorted',field:'starts'},{kind:'unique',field:'starts'},{kind:'lengths-equal',left:'starts',right:'durations'},{kind:'lengths-equal',left:'starts',right:'rewards'}],outputSchema:{kind:'safe-integer',minimum:0,maximum:50000000000000},function:{arguments:[{name:'starts',type:'int[]'},{name:'durations',type:'int[]'},{name:'rewards',type:'int[]'}],returnType:'long'},visible:[{input:weightedVisible[0],expected:18,explanation:'All three jobs touch at endpoints without overlapping, so their rewards add.'},{input:weightedVisible[1],expected:20,explanation:'The long first job earns 20, beating the compatible second and third jobs totaling 15.'},{input:weightedVisible[2],expected:0,explanation:'The empty schedule earns no reward.'}],generate:weightedCases,oracle:weighted,independent:weightedIndependent,mutations:{'only-largest-single-job':({rewards})=>Math.max(0,...rewards),'narrow-total-to-int32':input=>weighted(input)|0},languages:weightedLanguages,
},{
 ...common,id:'dp-1d-24',slug:'longest-strict-sign-alternating-subsequence',title:'Longest wiggle subsequence',step:4,seed:'0xCC224',skillIds:['dp.last-difference-sign-state','dp.opposite-direction-extension'],prerequisites:['dp.one-dimensional-state'],checkpointIds:['dp-1d-15','dp-1d-22'],remedialIds:['dp-1d-01'],nextIds:['dp-1d-09','dp-1d-16','dp-1d-17','dp-1d-20'],objective:'Maximize an indexed subsequence whose nonzero consecutive differences alternate sign.',rationale:'The next extension depends on whether the previous difference rose or fell, not on a globally increasing value frontier.',statement:'Choose a subsequence of values by deleting any number of elements without changing the order of the elements kept. For every consecutive pair kept, the difference must be nonzero, and the signs of consecutive differences must alternate positive, negative, positive, negative or the reverse. Return the longest possible number of elements kept. Empty input returns 0; a single kept element is valid and has length 1. Two distinct kept elements are valid. Equal adjacent kept values are not valid, but equal input values may be skipped. This is a subsequence, not necessarily a contiguous segment; it need not start by rising. Strictly increasing input of length at least 2 has answer 2 rather than its increasing-subsequence length.',constraints:['0 <= values.length <= 100000','Each value is in -1000000000..1000000000','The answer is between 0 and values.length'],interface:'Solution.solve(values) returns the maximum strict sign-alternating subsequence length.',inputSchema:{kind:'object',properties:{values:{kind:'array',minLength:0,maxLength:100000,items:{kind:'integer',minimum:-1000000000,maximum:1000000000}}}},outputSchema:{kind:'integer',minimum:0,maximum:100000},function:{arguments:[{name:'values',type:'int[]'}],returnType:'int'},visible:[{input:wiggleVisible[0],expected:6,explanation:'The consecutive differences rise, fall, rise, fall and rise, so every element can be kept.'},{input:wiggleVisible[1],expected:2,explanation:'All differences rise; keeping any two distinct elements is optimal.'},{input:wiggleVisible[2],expected:0,explanation:'There are no elements to keep.'}],generate:wiggleCases,oracle:wiggle,independent:wiggleIndependent,mutations:{'count-every-nonzero-difference':({values})=>values.length?1+values.slice(1).filter((v,i)=>v!==values[i]).length:0,'force-first-difference-positive':({values})=>{let up=values.length?1:0,down=0;for(let i=1;i<values.length;i++){if(values[i]>values[i-1])up=Math.max(up,down?down+1:2);else if(values[i]<values[i-1]&&up>1)down=up+1;}return Math.max(up,down);}},languages:wiggleLanguages,
}];
if(process.argv[1]?.endsWith('backend-dp1-tenth.mjs'))for(const def of definitions)console.log(await materializePack(def));
