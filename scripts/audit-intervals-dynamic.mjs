import {writeFile,readFile} from 'node:fs/promises';
import {definitions} from '../content/authoring/batches/intervals-dynamic.mjs';
import {logicalCases,hash} from '../content/authoring/pack-builder.mjs';
import {canonicalJson} from '../packages/judge-adapter/src/canonical.mjs';
import {validateInput} from '../packages/judge-adapter/src/schema-validator.mjs';
import {validateSemantics} from '../packages/judge-adapter/src/semantic.mjs';
const d=definitions[0],cases=logicalCases(d),failures=[];let comparisons=0;const mutationHits=Object.fromEntries(Object.keys(d.mutations).map(k=>[k,0]));
for(const c of [...d.visible,...cases]){if(!validateInput(d.inputSchema,c.input)||!validateSemantics(d.semanticConstraints,c.input)||!validateInput(d.outputSchema,c.expected))failures.push('invalid-case');const actual=d.oracle(c.input),independent=d.independent(c.input);if(canonicalJson(actual)!==canonicalJson(c.expected)||canonicalJson(independent)!==canonicalJson(c.expected))failures.push('oracle-mismatch');comparisons++;for(const [name,mutation] of Object.entries(d.mutations))if(canonicalJson(mutation(c.input))!==canonicalJson(c.expected))mutationHits[name]++;}
if(Object.values(mutationHits).some(n=>!n))failures.push('surviving-mutation');
const report={kind:'trusted-author-model-audit',id:d.id,generatedAt:new Date().toISOString(),sourceHash:hash(await readFile('content/authoring/batches/intervals-dynamic.mjs','utf8')),hidden:cases.length,visible:d.visible.length,comparisons,mutationHits,maximumEncodedInputBytes:Math.max(...cases.map(c=>Buffer.byteLength(JSON.stringify(c.input)))),maximumOutputBytes:Math.max(...cases.map(c=>Buffer.byteLength(JSON.stringify(c.expected)))),failures,passed:failures.length===0,nativeReferenceExecution:'not-run'};
await writeFile('docs/release-evidence/intervals-dynamic-author-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(failures.length)process.exitCode=1;
