// Trusted source-only proposal; production semantic registry remains main-judge owned.
import {validateSemantics} from '../../packages/judge-adapter/src/semantic.mjs';
export function proposedSemantics(rules,input){
 for(const r of rules){if(!['weighted-edges','capacity-edges'].includes(r.kind)){if(!validateSemantics([r],input))return false;continue;}
  if(typeof r.field!=='string'||typeof r.vertices!=='string'||!/^[A-Za-z][A-Za-z0-9_]*$/.test(r.field)||!/^[A-Za-z][A-Za-z0-9_]*$/.test(r.vertices)||[r.directed,r.allowSelfLoops,r.allowDuplicates].some(v=>typeof v!=='boolean'))return false;
  if(r.kind==='weighted-edges'){if(![r.minWeight,r.maxWeight].every(Number.isSafeInteger)||r.minWeight>r.maxWeight||r.minWeight<-1000000000||r.maxWeight>1000000000)return false;}
  else if(r.directed!==true||![r.minCapacity,r.maxCapacity,r.minCost,r.maxCost].every(Number.isSafeInteger)||r.minCapacity<0||r.maxCapacity>10||r.minCapacity>r.maxCapacity||r.minCost<0||r.maxCost>1000000000||r.minCost>r.maxCost)return false;
  const n=input[r.vertices],rows=input[r.field];if(!Number.isSafeInteger(n)||n<(r.kind==='capacity-edges'?2:0)||n>500||!Array.isArray(rows)||rows.length>5000)return false;
  const keys=new Set();for(const row of rows){const width=r.kind==='weighted-edges'?3:4;if(!Array.isArray(row)||row.length!==width||!row.every(Number.isSafeInteger)||row[0]<0||row[0]>=n||row[1]<0||row[1]>=n||!r.allowSelfLoops&&row[0]===row[1])return false;
   const key=r.directed===false?[Math.min(row[0],row[1]),Math.max(row[0],row[1])].join(','):row.slice(0,2).join(',');if(!r.allowDuplicates&&keys.has(key))return false;keys.add(key);
   if(r.kind==='weighted-edges'){if(!Number.isSafeInteger(r.minWeight)||!Number.isSafeInteger(r.maxWeight)||r.minWeight>r.maxWeight||row[2]<r.minWeight||row[2]>r.maxWeight)return false;}
   else if(![r.minCapacity,r.maxCapacity,r.minCost,r.maxCost].every(Number.isSafeInteger)||r.minCapacity>r.maxCapacity||r.minCost>r.maxCost||row[2]<r.minCapacity||row[2]>r.maxCapacity||row[3]<r.minCost||row[3]>r.maxCost)return false;
  }
 }return true;
}
export const productionSemantics=(rules,input)=>validateSemantics(rules,input);
