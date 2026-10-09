import {definitions} from './linked-list-multilevel.mjs';
import {logicalCases} from './pack-builder.mjs';
import {writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
function topology(data){
 if(data.head===null)return [];
 const ids=new Map([[data.head,0]]),queue=[data.head],out=[];
 for(const node of queue){const row=[];for(const field of ['next','child']){const target=data[field][node];if(target===null){row.push(null);continue;}if(!ids.has(target)){ids.set(target,ids.size);queue.push(target);}row.push(ids.get(target));}out.push(row);}
 return out;
}
const cases=logicalCases(definitions[0]),shapes=new Set(cases.map(c=>JSON.stringify(topology(c.input.head))));
const report={timestamp:new Date().toISOString(),scope:'Trusted LL22 topology diversity; erase values/original row names, retain rooted ordered next/child edges; no native execution',source:'content/authoring/linked-list-multilevel.mjs',sourceHash:createHash('sha256').update(readFileSync('content/authoring/linked-list-multilevel.mjs')).digest('hex'),canonicalHidden:cases.length,distinctRootedTopologies:shapes.size,minimum:200,passed:shapes.size>=200,countedAsAdditionalHidden:false};
writeFileSync('docs/release-evidence/content-LL-multilevel-topology-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
