import {createHash} from 'node:crypto';
import {inputKey} from '../../packages/judge-adapter/src/canonical.mjs';
const hash = v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
export function firstRepeatedBySortedGroups(values){
 const ordered=values.map((value,index)=>({value,index})).sort((a,b)=>a.value-b.value||a.index-b.index);
 let earliest=Infinity;
 for(let i=1;i<ordered.length;i++)if(ordered[i].value===ordered[i-1].value)earliest=Math.min(earliest,ordered[i].index);
 return earliest===Infinity?-1:earliest;
}
export const definitions=[
{id:'arrays-hashing-01',slug:'running-total',title:'Running total',objective:'Accumulate signed values without losing negatives or overflowing a 32-bit result.',statement:'A sensor stores signed changes in order. Return the total change after every reading has been included. An empty list has total 0.\n\nEach change may be negative, zero, or positive. Return one integer; do not print intermediate totals.',visible:[[[4,-2,7],9,'Every signed reading contributes: 4 - 2 + 7 = 9.'],[[],0,'There are no changes.'],[[1000000000,1000000000,1000000000],3000000000,'Use a result type wide enough for the total.']],oracle:a=>a.reduce((x,y)=>x+y,0),independent:a=>{let p=0,n=0;for(const x of a)x>=0?p+=x:n-=x;return p-n;},java:'long result = 0; for (int value : values) result += value; return result;',cpp:'long long result=0; for(int value:values) result+=value; return result;',python:'return sum(values)',mutations:{'skip-first':a=>a.slice(1).reduce((x,y)=>x+y,0),'absolute-values':a=>a.reduce((x,y)=>x+Math.abs(y),0),'32-bit-overflow':a=>a.reduce((x,y)=>(x+y)|0,0)}},
{id:'arrays-hashing-02',slug:'negative-only-maximum',title:'Maximum signed reading',objective:'Maintain a running maximum initialized from valid input rather than zero.',statement:'Given a nonempty sequence of signed readings, return the largest reading. Repeated values are permitted. The sequence may contain only negative readings.\n\nReturn the reading itself, not its position.',visible:[[[3,-4,8,8],8,'The largest reading is 8, even when repeated.'],[[-6],-6,'The only reading is the maximum.'],[[-9,-2,-7],-2,'Zero is not an input value and must not be returned.']],oracle:a=>a.reduce((x,y)=>Math.max(x,y),a[0]),independent:a=>[...a].sort((x,y)=>x-y).at(-1),java:'long result = values[0]; for (int value : values) result = Math.max(result, value); return result;',cpp:'long long result=values[0]; for(int value:values) result=max(result,(long long)value); return result;',python:'return max(values)',mutations:{'zero-initialization':a=>Math.max(0,...a.slice(0,1000)),'minimum-instead':a=>a.reduce((x,y)=>Math.min(x,y),a[0]),'last-only':a=>a.at(-1)}},
{id:'arrays-hashing-03',slug:'first-repeated-position',title:'First repeated position',objective:'Use membership state to find the first position whose value was already seen.',statement:'Scan signed readings from left to right. Return the zero-based position of the first reading whose value occurred at an earlier position. If no reading repeats, return -1.\n\nThe required position is the later occurrence where the first repeat is detected, not the first occurrence of that value. Empty input is valid.',visible:[[[7,4,7,4],2,'At position 2, 7 has already occurred.'],[[],-1,'No reading repeats.'],[[5,2,2,5],2,'2 repeats before 5 repeats; its later position is 2.']],oracle:a=>{const seen=new Set();for(let i=0;i<a.length;i++){if(seen.has(a[i]))return i;seen.add(a[i]);}return -1;},independent:firstRepeatedBySortedGroups,java:'java.util.HashSet<Integer> seen = new java.util.HashSet<>(); for (int i=0;i<values.length;i++) if (!seen.add(values[i])) return i; return -1;',cpp:'unordered_set<int> seen; for(int i=0;i<(int)values.size();i++) if(!seen.insert(values[i]).second) return i; return -1;',python:'seen = set()\n        for i, value in enumerate(values):\n            if value in seen:\n                return i\n            seen.add(value)\n        return -1',mutations:{'first-occurrence':a=>{for(let i=0;i<a.length;i++)if(a.slice(i+1).includes(a[i]))return i;return -1;},'adjacent-only':a=>{for(let i=1;i<a.length;i++)if(a[i]===a[i-1])return i;return -1;},'sorted-repeat':a=>{const b=[...a].sort((x,y)=>x-y);for(let i=1;i<b.length;i++)if(b[i]===b[i-1])return i;return -1;}}}
];
export function validInput(def,input){return input && Object.keys(input).length===1 && Array.isArray(input.values) && input.values.length<=(100000) && (def.id!=='arrays-hashing-02'||input.values.length>0) && input.values.every(x=>Number.isInteger(x)&&Math.abs(x)<=1000000000);}
export function generate(def){
 const unordered=def.id!=='arrays-hashing-03',schema={kind:'integer-array',field:'values',unordered,deduplicate:def.id==='arrays-hashing-02'};
 const keyOf=a=>unordered?inputKey(schema,{values:a}):JSON.stringify({values:a});
 const visible=new Set(def.visible.map(([a])=>keyOf(a)));const used=new Set(visible),out=[];
 const add=(a,category)=>{const input={values:a};const key=keyOf(a);if(!validInput(def,input)||used.has(key))return;used.add(key);out.push({id:`hidden-${out.length+1}`,input,expected:def.oracle(a),category,inputHash:hash(key)});};
 // Keep maximum-size representatives before short semantically equivalent inputs.
 if(unordered){add(Array.from({length:100000},(_,i)=>i-50000),'performance-distinct');add(Array(100000).fill(-1000000000),'performance-negative');}
 if(unordered){for(let n=0;n<=12;n++)for(let negatives=0;negatives<=n;negatives++)for(let zeros=0;zeros<=n-negatives;zeros++)add([...Array(negatives).fill(-1),...Array(zeros).fill(0),...Array(n-negatives-zeros).fill(1)],'exhaustive-small-multisets');}
 else for(let n=0;n<=5;n++){const total=3**n;for(let k=0;k<total;k++){let z=k;const a=[];for(let j=0;j<n;j++){a.push(z%3-1);z=Math.floor(z/3);}add(a,'exhaustive-small');}}
 let seed=0xC02E;const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 for(let i=0;i<(unordered?400:80);i++)add(Array.from({length:1+next()%80},()=>((next()%2001)-1000)), 'seeded-random');
 add([1000000000,1000000000,1000000000],'wide-result');add([-1000000000,-1000000000,-1000000000],'negative-wide-result');add([9,2,9],'non-adjacent-repeat');
 add(Array.from({length:100000},(_,i)=>i-50000),'performance-distinct');add(Array(100000).fill(-1000000000),'performance-negative');
 return out;
}
export async function materialize(){
 throw Error('Legacy slice materialization is disabled: it would overwrite the central catalogue. Use node scripts/refresh-native-slice.mjs --ids=arrays-hashing-01,arrays-hashing-02 for explicit draft scalar refresh; use node scripts/materialize-selected.mjs --ids=... for registered packs.');
}
if(process.argv[1] && new URL('file:///'+process.argv[1].replaceAll('\\','/')).href===import.meta.url)await materialize();
