// Reviewed bounded declarative edge contracts; no algorithm or learner execution.
export function validateEdgeRows(rule,input){
 if(!rule||!input||!['weighted-edges','capacity-edges'].includes(rule.kind)||typeof rule.field!=='string'||typeof rule.vertices!=='string'||!/^[A-Za-z][A-Za-z0-9_]*$/.test(rule.field)||!/^[A-Za-z][A-Za-z0-9_]*$/.test(rule.vertices)||![rule.directed,rule.allowSelfLoops,rule.allowDuplicates].every(v=>typeof v==='boolean'))return false;
 if(rule.kind==='weighted-edges'){
  if(![rule.minWeight,rule.maxWeight].every(Number.isSafeInteger)||rule.minWeight>rule.maxWeight||rule.minWeight< -1000000000||rule.maxWeight>1000000000)return false;
 }else if(rule.directed!==true||![rule.minCapacity,rule.maxCapacity,rule.minCost,rule.maxCost].every(Number.isSafeInteger)||rule.minCapacity<0||rule.minCapacity>rule.maxCapacity||rule.maxCapacity>10||rule.minCost<0||rule.minCost>rule.maxCost||rule.maxCost>1000000000)return false;
 const n=input[rule.vertices],rows=input[rule.field];
 if(!Number.isSafeInteger(n)||n<(rule.kind==='capacity-edges'?2:0)||n>500||!Array.isArray(rows)||rows.length>5000)return false;
 const seen=new Set(),width=rule.kind==='weighted-edges'?3:4;
 for(const row of rows){
  if(!Array.isArray(row)||row.length!==width||!row.every(Number.isSafeInteger)||row[0]<0||row[0]>=n||row[1]<0||row[1]>=n||!rule.allowSelfLoops&&row[0]===row[1])return false;
  const key=rule.directed?`${row[0]},${row[1]}`:`${Math.min(row[0],row[1])},${Math.max(row[0],row[1])}`;
  if(!rule.allowDuplicates&&seen.has(key))return false;seen.add(key);
  if(rule.kind==='weighted-edges'){if(row[2]<rule.minWeight||row[2]>rule.maxWeight)return false;}
  else if(row[2]<rule.minCapacity||row[2]>rule.maxCapacity||row[3]<rule.minCost||row[3]>rule.maxCost)return false;
 }
 return true;
}
