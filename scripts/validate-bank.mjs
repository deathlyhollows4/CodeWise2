import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {JudgeAdapter,judgePack} from '../packages/judge-adapter/src/index.mjs';
import {getPrivatePack,readJson,safePath,contentRoot,validationIdentity,sha256} from '../packages/judge-adapter/src/content.mjs';
import {deliveryScope,fullBankFailures} from './delivery-scope.mjs';
import {saveReferenceOutcome,referenceHistoryName} from './reference-evidence.mjs';
const slice=process.argv.includes('--slice');
const cacheOnly=process.argv.includes('--cache-only');
const idsArg=process.argv.find(a=>a.startsWith('--ids='));
if(idsArg&&!slice)throw new Error('--ids requires explicit --slice mode');
const selectedIds=idsArg?idsArg.slice(6).split(','):null;
if(selectedIds&&(!selectedIds.length||selectedIds.some(id=>!/^[a-z0-9-]+$/.test(id))||new Set(selectedIds).size!==selectedIds.length))throw new Error('Invalid or duplicate selected IDs');
const adapter=new JudgeAdapter();const health=await adapter.readiness();
const catalogue=await readJson(safePath(contentRoot,'catalogue.json'));const report={schemaVersion:1,scope:slice?'authored-slice-only':`full-${deliveryScope.questionTarget}-bank`,scopeAmendment:deliveryScope.amendment,command:['node','scripts/validate-bank.mjs',...process.argv.slice(2)].join(' '),argv:process.argv.slice(2),generatedAt:new Date().toISOString(),ready:health.ready,runtime:health,problems:[],passed:false,failures:[]};
const selected=catalogue.problems.filter(e=>!selectedIds||selectedIds.includes(e.id));
if(selectedIds&&selected.length!==selectedIds.length)throw new Error('Unknown selected problem ID');
report.selectedIds=selected.map(e=>e.id);
const authored=[];for(const entry of selected)authored.push(await getPrivatePack(entry.id));
report.snapshot=await Promise.all(authored.map(async pack=>({id:pack.manifest.id,version:pack.manifest.version,suiteHash:pack.suite.suiteHash,languages:Object.fromEntries(await Promise.all(['java','cpp','python'].map(async language=>[language,await validationIdentity(pack,language)])))})));
report.snapshotHash=sha256(JSON.stringify(report.snapshot));
await mkdir('docs/release-evidence',{recursive:true});await writeFile('docs/release-evidence/bank-validation-selected-snapshot.json',JSON.stringify({command:report.command,argv:report.argv,runtime:health,selectedIds:report.selectedIds,snapshotHash:report.snapshotHash,snapshot:report.snapshot},null,2)+'\n');
if(!slice)report.failures.push(...fullBankFailures(authored));
if(!health.ready){report.blocker=health.message;console.error(report.blocker);}else{
 for(const pack of authored){const entry={id:pack.manifest.id};for(const language of ['java','cpp','python']){
  const identity=await validationIdentity(pack,language),expectedTotal=pack.visibleCases.length+pack.hiddenCases.length;
  const complete=r=>r?.status==='accepted'&&r.counts?.total===expectedTotal&&r.counts.executed===expectedTotal&&r.counts.passed===expectedTotal&&r.counts.failed===0&&r.counts.notRun===0&&r.runtime?.phases?.length===2&&r.runtime.phases.every(p=>p.identityHash===health.identityHash&&p.startIdentityHash===health.identityHash&&typeof p.bootId==='string');
  const filename=`docs/release-evidence/validation-${entry.id}-${language}.json`;let previous;try{previous=JSON.parse(await readFile(filename,'utf8'));}catch{}
  const saveLanguage=evidence=>saveReferenceOutcome(pack,language,evidence,complete(evidence.result));
  if(previous?.validationIdentity===identity&&previous?.suiteHash===pack.suite.suiteHash&&previous?.version===pack.manifest.version&&previous?.runtimeIdentity===health.identityHash&&complete(previous?.result)){report.problems.push(previous);await saveLanguage(previous);continue;}
  if(cacheOnly){report.failures.push(`${entry.id}/${language}: current complete receipt missing; --cache-only refuses fresh dispatch`);continue;}
  if(previous){await mkdir('docs/release-evidence/history',{recursive:true});await writeFile(`docs/release-evidence/history/${referenceHistoryName(entry.id,language,previous)}`,JSON.stringify(previous,null,2)+'\n');}
  await saveLanguage({validationIdentity:identity,runtimeIdentity:health.identityHash,executedAt:new Date().toISOString(),result:{status:'not_run',counts:{executed:0,passed:0}}});
  const result=await judgePack({problemId:entry.id,language,code:pack.languages[language].reference,mode:'submit',adapter,privatePack:pack});
  if(result.status==='accepted'&&!complete(result)){result.status='infrastructure_error';result.diagnostics='Reference execution did not bind both phases to the selected runtime identity.';}
  const evidence={id:entry.id,version:pack.manifest.version,language,validationIdentity:identity,suiteHash:pack.suite.suiteHash,runtimeIdentity:health.identityHash,executedAt:new Date().toISOString(),result};await mkdir('docs/release-evidence',{recursive:true});await writeFile(filename,JSON.stringify(evidence,null,2)+'\n');report.problems.push(evidence);await saveLanguage(evidence);
 }}report.passed=authored.length>0&&report.failures.length===0&&report.problems.length===selected.length*3&&report.problems.every(p=>p.result.status==='accepted'&&p.result.counts.executed===p.result.counts.total&&p.result.counts.passed===p.result.counts.total&&p.result.counts.notRun===0);
}
await mkdir('docs/release-evidence',{recursive:true});await writeFile('docs/release-evidence/bank-validation.json',JSON.stringify(report,null,2)+'\n');process.exitCode=report.passed?0:1;
