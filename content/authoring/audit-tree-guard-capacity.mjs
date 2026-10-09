import {definitions as bst} from './trees-bst-updates.mjs';
import {definitions as traversals} from './trees-order-reconstruct.mjs';
import {logicalCases} from './pack-builder.mjs';
import {validateInput} from '../../packages/judge-adapter/src/schema-validator.mjs';
import {validateSemantics} from '../../packages/judge-adapter/src/semantic.mjs';
import {readFileSync,writeFileSync} from 'node:fs';

const report={timestamp:new Date().toISOString(),scope:'Trusted JSON/schema/source-capacity review only; no native reference execution',problems:[],insertionBoundaries:[],failures:[]};
for(const d of [...bst,...traversals]){
 const cases=[...d.visible,...logicalCases(d)];
 for(const c of cases){if(!validateSemantics(d.semanticConstraints,c.input))report.failures.push(d.id+': semantic rejection');if(!validateInput(d.outputSchema,c.expected))report.failures.push(d.id+': output schema rejection');}
 report.problems.push({id:d.id,checkedCases:cases.length});
 if(d.id==='trees-19')for(const c of cases)if(c.input.root.filter(v=>v!==null).length===2000){const nodes=c.expected.filter(v=>v!==null).length;report.insertionBoundaries.push({inputNodes:2000,key:c.input.value,outputNodes:nodes,serializedSlots:c.expected.length,schemaMaxSlots:d.outputSchema.maxLength,passed:validateInput(d.outputSchema,c.expected)});}
}
if(!report.insertionBoundaries.some(c=>c.outputNodes===2001))report.failures.push('No2001-node insertion boundary covered');
const structures=readFileSync('content/authoring/structures.mjs','utf8');
report.serializerSourceReview={file:'content/authoring/structures.mjs',python:structures.includes("len(queue)>200001"),cpp:structures.includes('q.size()>200001'),java:structures.includes('q.size()>200001'),note:'Queue includes null child slots; a2001-node result has4003 queue slots before trimming, below200001. This is source review, not execution.'};
writeFileSync('docs/release-evidence/content-tree-guard-output-capacity.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;
