// Source-only contract proposal. Production registry remains owned by main judge.
export function eulerPossible({n,edges}){
 if(!edges.length)return true;const incoming=Array(n).fill(0),outgoing=Array(n).fill(0),undirected=Array.from({length:n},()=>[]);for(const[u,v]of edges){outgoing[u]++;incoming[v]++;undirected[u].push(v);undirected[v].push(u);}let plus=0,minus=0;for(let v=0;v<n;v++){const d=outgoing[v]-incoming[v];if(d===1)plus++;else if(d===-1)minus++;else if(d!==0)return false;}if(!((plus===0&&minus===0)||(plus===1&&minus===1)))return false;
 const root=outgoing.findIndex((v,i)=>v+incoming[i]>0),seen=new Set([root]),q=[root];for(let i=0;i<q.length;i++)for(const v of undirected[q[i]])if(!seen.has(v)){seen.add(v);q.push(v);}return outgoing.every((v,i)=>v+incoming[i]===0||seen.has(i));
}
export function checkEuler(input,actual){
 if(!input||!Number.isInteger(input.n)||input.n<0||input.n>500||!Array.isArray(input.edges)||input.edges.length>5000||input.edges.some(e=>!Array.isArray(e)||e.length!==2||e.some(v=>!Number.isInteger(v)||v<0||v>=input.n))||!Array.isArray(actual))return false;
 if(actual.length===1&&actual[0]===-1)return !eulerPossible(input);
 if(actual.length!==input.edges.length||actual.some(v=>!Number.isInteger(v)||v<0||v>=input.edges.length)||new Set(actual).size!==actual.length)return false;
 for(let i=1;i<actual.length;i++)if(input.edges[actual[i-1]][1]!==input.edges[actual[i]][0])return false;return true;
}
