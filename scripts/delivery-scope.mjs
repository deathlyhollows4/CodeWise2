import {hiddenCaseRequirement} from '../packages/contracts/src/hidden-case-requirement.mjs';
import contract from '../packages/contracts/src/delivery-scope.json' with {type:'json'};
const topicIds=['arrays-hashing','two-pointers','sliding-window','stack','binary-search','linked-list','trees','heap','backtracking','tries','graphs','advanced-graphs','dp-1d','dp-2d','greedy','intervals','math-geometry','bit-manipulation'];
export function validateDeliveryScope(value){
 if(value?.schemaVersion!==1||!['2026-10-08-half-unstarted-topics','2026-10-08-half-unstarted-topics-and-leftover-hidden60'].includes(value.amendment)||value.originalQuestionTarget!==300||value.questionTarget!==243||value.visibleCasesPerQuestion!==3||value.minimumHiddenCasesPerQuestion!==200||!Array.isArray(value.languages)||[...value.languages].sort().join(',')!=='cpp,java,python'||!Array.isArray(value.topics)||value.topics.length!==18||new Set(value.topics.map(row=>row?.[0])).size!==18||value.topics.some(row=>!Array.isArray(row)||row.length!==3||!topicIds.includes(row[0])||typeof row[1]!=='string'||!row[1]||!Number.isInteger(row[2])||row[2]<1)||value.topics.reduce((n,row)=>n+row[2],0)!==value.questionTarget)throw Error('Invalid amended delivery scope');
 hiddenCaseRequirement('arrays-hashing-01',value);if(value.amendment.endsWith('hidden60')&&value.hiddenCaseOverrides?.length!==52)throw Error('Invalid hidden-case cutoff scope');
 return value;
}
validateDeliveryScope(contract);
export const deliveryScope=Object.freeze({...contract,languages:Object.freeze([...contract.languages]),topics:Object.freeze(contract.topics.map(row=>Object.freeze([...row])))});
export function fullBankFailures(authored){
 const failures=[];if(authored.length!==deliveryScope.questionTarget)failures.push(`Expected ${deliveryScope.questionTarget} complete packs, found ${authored.length}`);
 if(new Set(authored.map(p=>p.manifest.id)).size!==authored.length)failures.push('Duplicate full-bank problem IDs');
 for(const [id,,quota] of deliveryScope.topics){const count=authored.filter(p=>p.manifest.primaryTopic===id).length;if(count!==quota)failures.push(`${id}: ${count}/${quota} authored`);}
 return failures;
}
