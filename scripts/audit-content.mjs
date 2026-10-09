import deliveryScope from '../packages/contracts/src/delivery-scope.json' with {type:'json'};
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {definitions} from '../content/authoring/registry.mjs';
import {getPrivatePack,sha256,contentRoot,readJson,safePath,validateInput} from '../packages/judge-adapter/src/content.mjs';
import {topics,slots} from '../content/curriculum-plan.mjs';
import {inputKey,canonicalJson} from '../packages/judge-adapter/src/canonical.mjs';
import {packIdentity} from '../packages/judge-adapter/src/pack-validation.mjs';
import {checkOutput} from '../packages/judge-adapter/src/checkers.mjs';
const release=!process.argv.includes('--drafts');const failures=[],packs=[];
const idsArg=process.argv.find(arg=>arg.startsWith('--ids=')),selectedIds=idsArg?idsArg.slice(6).split(','):null;
if(selectedIds&&(release||!selectedIds.length||new Set(selectedIds).size!==selectedIds.length||selectedIds.some(id=>!/^[a-z0-9-]+$/.test(id))))throw Error('Selected audit IDs require explicit valid draft scope');
const catalogue=await readJson(safePath(contentRoot,'catalogue.json'));
if(selectedIds&&selectedIds.some(id=>!catalogue.problems.some(p=>p.id===id)))throw Error('Unknown selected audit ID');
if(new Set(catalogue.problems.map(p=>p.id)).size!==catalogue.problems.length||new Set(catalogue.problems.map(p=>p.path)).size!==catalogue.problems.length)failures.push('Duplicate catalogue IDs or paths');
const frozen=Object.fromEntries(deliveryScope.topics.map(([id,,quota])=>[id,quota]));
const target=deliveryScope.questionTarget;
const frozenKeys=Object.keys(frozen).sort();const topicKeys=rows=>rows.map(t=>t.id).sort();
if(topics.length!==18||new Set(topics.map(t=>t.id)).size!==18||canonicalJson(topicKeys(topics))!==canonicalJson(frozenKeys)||topics.some(t=>frozen[t.id]!==t.quota)||catalogue.topics.length!==18||new Set(catalogue.topics.map(t=>t.id)).size!==18||canonicalJson(topicKeys(catalogue.topics))!==canonicalJson(frozenKeys)||catalogue.topics.some(t=>frozen[t.id]!==t.quota))failures.push('Frozen topic quotas changed');
if(slots.length!==target||topics.reduce((n,t)=>n+t.quota,0)!==target)failures.push('Curriculum plan does not total '+target);
if(new Set(slots.map(s=>s.objective.toLowerCase())).size!==target)failures.push('Duplicate normalized objective in curriculum plan');
const publishedCounts=Object.fromEntries(topics.map(t=>[t.id,0]));
for(const entry of catalogue.problems.filter(entry=>!selectedIds||selectedIds.includes(entry.id))){
 try{
  const p=await getPrivatePack(entry.id),def=definitions.find(d=>d.id===entry.id);const errors=[];
  const visibleKeys=new Set(p.visibleCases.map(c=>inputKey(p.manifest.inputSchema,c.input)));const hiddenKeys=new Set();
  let oracleChecks=0;
  const privateCases=new Set(p.hiddenCases);
  for(const c of [...p.visibleCases,...p.hiddenCases]){
   if(!def||!validateInput(p.manifest.inputSchema,c.input)||(def.valid&&!def.valid(c.input))){errors.push('Invalid input/oracle unavailable');continue;}
   if(privateCases.has(c)){const key=inputKey(p.manifest.inputSchema,c.input);if(visibleKeys.has(key)||hiddenKeys.has(key))errors.push('Duplicate logical input');hiddenKeys.add(key);if(c.inputHash!==sha256(key))errors.push('Input hash mismatch');}
   const expected=def.independent(c.input);
   if(!checkOutput(p.manifest.checker,c.expected,expected,{input:c.input})||!checkOutput(p.manifest.checker,expected,c.expected,{input:c.input}))errors.push('Expected output differs from independent oracle');oracleChecks++;
  }
  const mutationEvidence=Object.entries(def?.mutations??{}).map(([name,fn])=>{const killed=[...p.visibleCases,...p.hiddenCases].find(c=>!checkOutput(p.manifest.checker,c.expected,fn(c.input),{input:c.input}));return {name,detected:!!killed,caseId:killed?.id};});
  if(mutationEvidence.some(x=>!x.detected))errors.push('Undetected listed mutation');
  const reproduced=def.generateCases().map(x=>JSON.stringify(x)).join('\n')+'\n';if(sha256(reproduced)!==p.suite.suiteHash)errors.push('Generator does not reproduce suite');
  const evidence={status:errors.length?'failed':'passed',kind:'trusted-oracle-and-mutation-audit',contentIdentity:packIdentity(p),suiteHash:p.suite.suiteHash,oracleChecks,hiddenUnique:hiddenKeys.size,mutations:mutationEvidence,languageExecution:'not-run'};
  await writeFile(safePath(p.root,'private/oracle-evidence.json'),JSON.stringify(evidence,null,2)+'\n');
  if(p.manifest.status==='published')publishedCounts[p.manifest.primaryTopic]++;
  if(release && p.manifest.status!=='published')errors.push('Not published: language references and independent review pending');
  packs.push({id:entry.id,status:p.manifest.status,visible:p.visibleCases.length,hidden:p.hiddenCases.length,evidence,errors});
  failures.push(...errors.map(e=>entry.id+': '+e));
 }catch(e){failures.push(entry.id+': '+e.message);}
}
const contentMap=packs.map(p=>[p.id,p.evidence.contentIdentity]).sort((a,b)=>a[0].localeCompare(b[0]));const contentMapHash=sha256(canonicalJson({catalogue,contentMap}));
if(release){if(Object.values(publishedCounts).reduce((a,b)=>a+b,0)!==target)failures.push('Exactly '+target+' published problems required');for(const t of topics)if(publishedCounts[t.id]!==t.quota)failures.push(`${t.title}: ${publishedCounts[t.id]}/${t.quota} published`);try{const global=await readJson(safePath(contentRoot,'global-review.json'));const exactIds=canonicalJson([...new Set(global.taskReviewIds)].sort())===canonicalJson(catalogue.problems.map(p=>p.id).sort());if(global.status!=='passed'||global.contentMapHash!==contentMapHash||new Set(global.taskReviewIds).size!==target||!exactIds||!global.reviewer)failures.push('Global task diversity review missing/stale');}catch{failures.push('Global task diversity review missing/stale');}}
const report={schemaVersion:1,command:['node','scripts/audit-content.mjs',...process.argv.slice(2)].join(' '),selectedIds,scope:release?'release-gates':selectedIds?'draft-selected-integrity-only':'draft-integrity-only',generatedAt:new Date().toISOString(),passed:failures.length===0,publishedCounts,plannedSlots:slots.length,contentMapHash,packs,failures,limitations:release&&failures.length===0?[]:['Draft integrity pass does not establish runtime execution or publication.','Global structural task diversity and progression review pending.']};
await mkdir('docs/release-evidence',{recursive:true});await writeFile(`docs/release-evidence/content-${release?'release':'draft'}-audit.json`,JSON.stringify(report,null,2)+'\n');
console.log(`${report.scope}: ${packs.length} authored packs, ${packs.reduce((n,p)=>n+p.hidden,0)} hidden cases; ${failures.length} failure(s).`);for(const f of failures)console.log('- '+f);process.exitCode=failures.length?1:0;
