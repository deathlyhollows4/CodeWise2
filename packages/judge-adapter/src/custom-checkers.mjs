// Trusted reviewed application registry. No executable checker code is imported from packs.
export const customCheckerNames=['topological-order','sudoku-solution','n-queens-placement','strict-local-peak','zero-sum-list-normalization','directed-euler-edge-use'];
export function customCheck(name,input,actual){
 switch(name){
  case 'directed-euler-edge-use':return directedEulerEdgeUse(input,actual);
  case 'zero-sum-list-normalization':{
   const values=input?.head;if(!Array.isArray(values)||values.length>100000||values.some(v=>!Number.isSafeInteger(v))||!Array.isArray(actual)||actual.some((id,i)=>!Number.isInteger(id)||id<0||id>=values.length||i>0&&id<=actual[i-1]))return false;
   const prefix=[0];for(const value of values){const next=prefix.at(-1)+value;if(!Number.isSafeInteger(next))return false;prefix.push(next);}
   let previous=-1,sum=0;const seen=new Set([0]);for(const id of actual){if(prefix[id]-prefix[previous+1]!==0)return false;sum+=values[id];if(seen.has(sum))return false;seen.add(sum);previous=id;}
   return prefix[values.length]-prefix[previous+1]===0;
  }
  case 'strict-local-peak':{
   const values=input?.values;
   return Array.isArray(values)&&Number.isInteger(actual)&&actual>=0&&actual<values.length&&(actual===0||values[actual]>values[actual-1])&&(actual===values.length-1||values[actual]>values[actual+1]);
  }
  case 'topological-order':{
   if(!input||!Number.isInteger(input.n)||input.n<0||!Array.isArray(input.edges)||!Array.isArray(actual))return false;
   const n=input.n;if(n===0)return actual.length===0;
   if(actual.length===0){const degree=Array(n).fill(0),next=Array.from({length:n},()=>[]);for(const [a,b]of input.edges){degree[b]++;next[a].push(b);}const q=[];for(let i=0;i<n;i++)if(degree[i]===0)q.push(i);for(let i=0;i<q.length;i++)for(const v of next[q[i]])if(--degree[v]===0)q.push(v);return q.length<n;}
   if(actual.length!==n||actual.some(v=>!Number.isInteger(v)||v<0||v>=n)||new Set(actual).size!==n)return false;
   const position=Array(n);actual.forEach((v,i)=>position[v]=i);return input.edges.every(([a,b])=>position[a]<position[b]);
  }
  case 'sudoku-solution':{
   const given=input?.grid;if(!Array.isArray(given)||given.length!==9||!Array.isArray(actual)||actual.length!==9||actual.some(r=>!Array.isArray(r)||r.length!==9||r.some(v=>!Number.isInteger(v)||v<1||v>9)))return false;
   for(let i=0;i<9;i++){if(new Set(actual[i]).size!==9||new Set(actual.map(r=>r[i])).size!==9)return false;for(let j=0;j<9;j++)if(given[i]?.[j]!==0&&given[i]?.[j]!==actual[i][j])return false;}
   for(let r=0;r<9;r+=3)for(let c=0;c<9;c+=3){const block=[];for(let i=r;i<r+3;i++)for(let j=c;j<c+3;j++)block.push(actual[i][j]);if(new Set(block).size!==9)return false;}return true;
  }
  case 'n-queens-placement':{
   const n=input?.n;if(!Number.isInteger(n)||n<0||!Array.isArray(actual))return false;if((n===2||n===3)&&actual.length===0)return true;if(actual.length!==n||actual.some(v=>!Number.isInteger(v)||v<0||v>=n)||new Set(actual).size!==n)return false;const a=new Set(),b=new Set();for(let row=0;row<n;row++){const p=row-actual[row],q=row+actual[row];if(a.has(p)||b.has(q))return false;a.add(p);b.add(q);}return true;
  }
  default:throw new Error('Unreviewed custom checker');
 }
}

// Edge-ID witness validation is independent of any Hierholzer reference output.
function directedEulerEdgeUse(input,actual){
 if(!input||!Number.isInteger(input.n)||input.n<0||input.n>500||!Array.isArray(input.edges)||input.edges.length>5000||!Array.isArray(actual))return false;
 const {n,edges}=input,m=edges.length;
 if(edges.some(edge=>!Array.isArray(edge)||edge.length!==2||edge.some(v=>!Number.isInteger(v)||v<0||v>=n)))return false;
 if(actual.length===1&&actual[0]===-1){
  if(m===0)return false;
  const parent=Array.from({length:n},(_,i)=>i),incoming=new Int32Array(n),outgoing=new Int32Array(n);
  const find=v=>{while(parent[v]!==v){parent[v]=parent[parent[v]];v=parent[v];}return v;};
  for(const [from,to]of edges){outgoing[from]++;incoming[to]++;parent[find(from)]=find(to);}
  let plus=0,minus=0,root=-1;
  for(let v=0;v<n;v++){const delta=outgoing[v]-incoming[v];if(delta===1)plus++;else if(delta===-1)minus++;else if(delta!==0)return true;
   if(incoming[v]+outgoing[v]>0){const component=find(v);if(root===-1)root=component;else if(component!==root)return true;}}
  return !((plus===0&&minus===0)||(plus===1&&minus===1));
 }
 if(actual.length!==m)return false;
 const used=new Uint8Array(m);
 for(let i=0;i<m;i++){const edge=actual[i];if(!Number.isInteger(edge)||edge<0||edge>=m||used[edge])return false;used[edge]=1;if(i>0&&edges[actual[i-1]][1]!==edges[edge][0])return false;}
 return true;
}
