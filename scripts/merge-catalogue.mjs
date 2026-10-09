import deliveryScope from '../packages/contracts/src/delivery-scope.json' with {type:'json'};
// Central catalogue writer only. Explicit build-time command, never app runtime.
import {writeFile,readFile} from 'node:fs/promises';import {topics,slots} from '../content/curriculum-plan.mjs';import {definitions} from '../content/authoring/registry.mjs';
const entries=[],authored=[];for(const def of definitions){const p=JSON.parse(await readFile(new URL(`../content/problems/${def.id}/problem.json`,import.meta.url),'utf8'));entries.push({id:p.id,path:`problems/${p.id}`,status:p.status});authored.push({id:p.id,title:p.title,primaryTopic:p.primaryTopic,objective:p.objective,step:p.step,skillIds:p.skillIds,prerequisites:p.prerequisites,approach:def.rationale??p.objective,commonErrors:p.commonMistakes,checkpointIds:p.checkpointIds,remedialIds:p.remedialIds,nextIds:p.nextIds,status:'authored-draft'});}
if(new Set(entries.map(e=>e.id)).size!==entries.length)throw new Error('Duplicate catalogue identity');
await writeFile(new URL('../content/catalogue.json',import.meta.url),JSON.stringify({schemaVersion:1,version:'0.1.0',expectedTotal:deliveryScope.questionTarget,scopeAmendment:deliveryScope.amendment,topics,problems:entries},null,2)+'\n');
await writeFile(new URL('../content/authored-plan.mjs',import.meta.url),'// Generated authored metadata; all publication reviews remain separate.\nexport const authoredPlan='+JSON.stringify(authored,null,2)+';\n');
const authoredById=new Map(authored.map(p=>[p.id,p]));
await writeFile(new URL('../content/curriculum-matrix.json',import.meta.url),JSON.stringify({schemaVersion:1,status:'authoring-plan',topics,slots:slots.map(p=>({...p,...(authoredById.get(p.id)??{})}))},null,2)+'\n');
