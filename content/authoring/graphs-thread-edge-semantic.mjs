// Source-only structural quota keys. ID-based native inputs/outputs remain unchanged.
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
const cache=new Map();
function graphKey({n,edges},directed,ignoreIsolates){
 const vertices=ignoreIsolates?[...new Set(edges.flat())].sort((a,b)=>a-b):Array.from({length:n},(_,i)=>i),k=vertices.length;
 if(!k)return ignoreIsolates?'empty-edge-set':JSON.stringify([0,[]]);
 const ids=new Map(vertices.map((v,i)=>[v,i])),rows=edges.map(([u,v])=>[ids.get(u),ids.get(v)]),out=Array(k).fill(0),incoming=Array(k).fill(0);
 for(const[u,v]of rows){out[u]++;incoming[v]++;if(!directed){out[v]++;incoming[u]++;}}
 if(k>8)return JSON.stringify({vertices:k,edges:rows.length,degrees:out.map((v,i)=>[v,incoming[i]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1])});
 const matrix=Array.from({length:k},()=>Array(k).fill(0));for(const[u,v]of rows){matrix[u][v]++;if(!directed)matrix[v][u]++;}
 const raw=JSON.stringify([directed,matrix]);if(cache.has(raw))return cache.get(raw);
 const diagonal=matrix[0][0],off=k>1?matrix[0][1]:0;
 if(matrix.every((row,u)=>row.every((v,w)=>v===(u===w?diagonal:off)))){const result=JSON.stringify([k,matrix]);cache.set(raw,result);return result;}
 // Isomorphisms preserve degree/loop classes. Only class-internal bijections are needed.
 const byClass=new Map();for(let v=0;v<k;v++){const signature=JSON.stringify([out[v],incoming[v],matrix[v][v]]);if(!byClass.has(signature))byClass.set(signature,[]);byClass.get(signature).push(v);}
 const groups=[...byClass.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([,members])=>members),map=Array(k);let best=null;
 function group(at,start){if(at===groups.length){const renamed=Array.from({length:k},()=>Array(k).fill(0));for(let u=0;u<k;u++)for(let v=0;v<k;v++)renamed[map[u]][map[v]]=matrix[u][v];const key=JSON.stringify(renamed);if(best===null||key<best)best=key;return;}
  const members=groups[at],used=Array(members.length).fill(false);function assign(position){if(position===members.length){group(at+1,start+members.length);return;}for(let i=0;i<members.length;i++)if(!used[i]){used[i]=true;map[members[i]]=start+position;assign(position+1);used[i]=false;}}assign(0);
 }group(0,0);const result=JSON.stringify([k,best]);cache.set(raw,result);return result;
}
export const directedStructuralKey=input=>graphKey(input,true,false);
export const eulerStructuralKey=input=>graphKey(input,true,true);
export const bridgeStructuralKey=input=>graphKey(input,false,true);
function leastRotation(values){const n=values.length;let a=0,b=1,offset=0;while(a<n&&b<n&&offset<n){const x=values[(a+offset)%n],y=values[(b+offset)%n];if(x===y){offset++;continue;}if(x>y){a+=offset+1;if(a===b)a++;}else{b+=offset+1;if(a===b)b++;}offset=0;}return Math.min(a,b);}
// Isomorphism-invariant inward-tree hashes and directed cycle rotations. Collisions only
// merge non-isomorphic structures, so distinct keys give a conservative geometry bound.
export function functionalStructuralKey({next}){const n=next.length,degree=Array(n).fill(0),children=Array.from({length:n},()=>[]),queue=[];for(const v of next)degree[v]++;for(let u=0;u<n;u++)if(!degree[u])queue.push(u);const nodeHash=u=>hash('N('+children[u].sort().join('|')+')');for(let i=0;i<queue.length;i++){const u=queue[i],v=next[u];children[v].push(nodeHash(u));if(--degree[v]===0)queue.push(v);}const seen=Array(n).fill(false),components=new Map();for(let u=0;u<n;u++)if(degree[u]&&!seen[u]){const sequence=[];let v=u;do{seen[v]=true;sequence.push(nodeHash(v));v=next[v];}while(v!==u);const start=leastRotation(sequence),rotated=Array.from({length:sequence.length},(_,i)=>sequence[(start+i)%sequence.length]),key=JSON.stringify([sequence.length,hash(JSON.stringify(rotated))]);components.set(key,(components.get(key)??0)+1);}return JSON.stringify({n,components:[...components.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0)});}
