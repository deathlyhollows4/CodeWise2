// Author quota only: preserve original vertex IDs and terminal game grading.
export function terminalGameStructuralKey({moves,targets}){
 const n=targets.length,matrix=moves.map((row,u)=>row.map(v=>targets[u]?0:v));
 const outgoing=matrix.map(row=>row.reduce((a,b)=>a+b,0)),incoming=Array.from({length:n},(_,v)=>matrix.reduce((a,row)=>a+row[v],0));
 if(n>8)return JSON.stringify({n,degrees:targets.map((color,u)=>[color,outgoing[u],incoming[u]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2])});
 const classes=new Map();for(let u=0;u<n;u++){const s=JSON.stringify([targets[u],outgoing[u],incoming[u],matrix[u][u]]);if(!classes.has(s))classes.set(s,[]);classes.get(s).push(u);}
 const groups=[...classes.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([,v])=>v),order=[];let best=null;
 function visit(g){if(g===groups.length){const candidate=JSON.stringify([order.map(u=>targets[u]),order.map(u=>order.map(v=>matrix[u][v]))]);if(best===null||candidate<best)best=candidate;return;}const members=groups[g],used=new Set();function perm(){if(used.size===members.length){visit(g+1);return;}for(const u of members)if(!used.has(u)){used.add(u);order.push(u);perm();order.pop();used.delete(u);}}perm();}visit(0);return best;
}
