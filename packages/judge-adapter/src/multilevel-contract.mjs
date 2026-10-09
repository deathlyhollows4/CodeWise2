// Pure JSON contract for one rooted next/child hierarchy. prev is derived from next.
export function multilevelInput(data,maxNodes){
 if(!data||typeof data!=='object'||!Number.isInteger(maxNodes)||maxNodes<0||maxNodes>100000||!Array.isArray(data.values)||data.values.length>maxNodes||data.values.some(v=>!Number.isSafeInteger(v)))return false;
 const n=data.values.length,valid=i=>i===null||Number.isInteger(i)&&i>=0&&i<n;
 if(!['next','child'].every(field=>Array.isArray(data[field])&&data[field].length===n&&data[field].every(valid))||!valid(data.head))return false;
 if(n===0)return data.head===null;if(data.head===null)return false;
 const incoming=new Uint8Array(n);
 for(let i=0;i<n;i++)for(const field of ['next','child']){const target=data[field][i];if(target!==null&&++incoming[target]>1)return false;}
 if(incoming[data.head]!==0)return false;
 const seen=new Set([data.head]),queue=[data.head];
 for(let cursor=0;cursor<queue.length;cursor++)for(const field of ['next','child']){const target=data[field][queue[cursor]];if(target!==null){if(seen.has(target))return false;seen.add(target);queue.push(target);}}
 return seen.size===n;
}
