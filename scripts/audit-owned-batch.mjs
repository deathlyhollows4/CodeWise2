import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {hiddenCaseRequirement} from '../packages/contracts/src/hidden-case-requirement.mjs';
const modulePath=process.argv[2];
if(!/^content\/authoring\/batches\/backend-[a-z0-9-]+\.mjs$/.test(modulePath??''))throw Error('An explicit owned authoring batch path is required.');
const {definitions}=await import(pathToFileURL(resolve(modulePath)).href);
const scope=JSON.parse(readFileSync('packages/contracts/src/delivery-scope.json','utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex'),packs=[];
for(const definition of definitions){const base=`content/problems/${definition.id}`,hidden=readFileSync(`${base}/private/hidden-cases.jsonl`,'utf8').trim().split('\n').map(JSON.parse),visible=JSON.parse(readFileSync(`${base}/visible-cases.json`)),cases=[...visible,...hidden],kills=Object.fromEntries(Object.keys(definition.mutations).map(name=>[name,0]));
 assert.equal(visible.length,scope.visibleCasesPerQuestion);
 const requirement=hiddenCaseRequirement(definition.id);
 if(requirement.exact!==null)assert.equal(hidden.length,requirement.exact);else assert.ok(hidden.length>=requirement.minimum);
 for(const c of cases){assert.deepEqual(definition.oracle(c.input),c.expected);assert.deepEqual(definition.independent(c.input),c.expected);for(const [name,mutant] of Object.entries(definition.mutations))if(JSON.stringify(mutant(c.input))!==JSON.stringify(c.expected))kills[name]++;}
 assert.ok(Object.values(kills).every(count=>count>0));packs.push({id:definition.id,hidden: hidden.length,requiredHidden:requirement.minimum,exactHidden:requirement.exact!==null,visible:visible.length,independentChecks:cases.length,mutationKills:kills,manifestSha256:sha(`${base}/problem.json`),suiteSha256:sha(`${base}/private/hidden-cases.jsonl`)});
}
const report={schemaVersion:1,command:`node scripts/audit-owned-batch.mjs ${modulePath}`,timestamp:new Date().toISOString(),runtime:process.version,platform:`${process.platform}-${process.arch}`,passed:true,scope:'Trusted host independently authored oracles and named wrong-algorithm mutation checks; no native reference/learner execution or publication.',deliveryScopeSha256:sha('packages/contracts/src/delivery-scope.json'),sourceSha256:sha(modulePath),auditorSha256:sha('scripts/audit-owned-batch.mjs'),packs};
const target=`docs/release-evidence/${modulePath.split('/').at(-1).replace('.mjs','')}-independent.json`;writeFileSync(target,JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,packs:packs.length,independentChecks:packs.reduce((sum,p)=>sum+p.independentChecks,0),report:target}));
