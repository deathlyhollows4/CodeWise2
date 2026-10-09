// In-memory production pack-structure checks only. No materialization/native/publication.
import {definitions} from './graphs-thread-all.mjs';
import {buildFunctionHarness} from './harness.mjs';
import {assertPackStructure} from '../../packages/judge-adapter/src/pack-validation.mjs';
import {inputKey} from '../../packages/judge-adapter/src/canonical.mjs';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
const hash=x=>createHash('sha256').update(x).digest('hex');
const rows=[];
for(const d of definitions){
 const wrappers=buildFunctionHarness(d.function),hidden=d.generate().map((c,i)=>({...c,id:`hidden-${i+1}`,expected:d.oracle(c.input),inputHash:hash(inputKey(d.inputSchema,c.input))})),visible=d.visible.map((c,i)=>({id:`visible-${i+1}`,...c}));
 const suiteHash=hash(hidden.map(c=>JSON.stringify(c)).join('\n')+'\n');
 const manifest={schemaVersion:1,id:d.id,version:d.version??'1.0.0',slug:d.slug,title:d.title,primaryTopic:d.primaryTopic,skillIds:d.skillIds,prerequisites:d.prerequisites??[],step:d.step,status:'draft',objective:d.objective,constraints:d.constraints,interface:d.interface,inputSchema:d.inputSchema,outputSchema:d.outputSchema,checker:d.checker,harness:{encoding:'json-lines-v1'},languageFiles:Object.fromEntries(['java','cpp','python'].map(lang=>[lang,Object.fromEntries(['starter','wrapper','reference'].map(kind=>[kind,`languages/${lang}/${kind}.${{java:'java',cpp:'cpp',python:'py'}[lang]}`]))])),sourceIds:d.sourceIds??['codewise2-original'],checkpointIds:d.checkpointIds??[],remedialIds:d.remedialIds??[],nextIds:d.nextIds??[],rationale:d.rationale,commonMistakes:Object.keys(d.mutations),semanticConstraints:d.semanticConstraints??[],limits:{cpuSeconds:5,wallSeconds:15,memoryKb:262144,processes:64,outputBytes:4194304,fileKb:4096,inputBytes:8388608}};
 const p={manifest,statement:d.statement+'\n',visibleCases:visible,hiddenCases:hidden,suite:{schemaVersion:1,hiddenCount:hidden.length,suiteHash},validation:{schemaVersion:1,version:manifest.version,suiteHash,status:'pending',languages:Object.fromEntries(['java','cpp','python'].map(lang=>[lang,{status:'not-run',reason:'in-memory-source-preflight/no-native-validation'}]))},provenance:d.provenance,languages:Object.fromEntries(['java','cpp','python'].map(lang=>[lang,{starter:d.languages[lang].starter,reference:d.languages[lang].reference,wrapper:wrappers[lang]}]))};
 try{assertPackStructure(p);rows.push({id:d.id,structure:'passed-original-declared-checker',native:'not-run',materialized:false,productionChecker:d.checker});}
 catch(error){if(d.id!=='graphs-10'||d.checker.name!=='directed-euler-edge-use'||error.message!=='Invalid problem pack: unreviewed custom checker')throw error;
  const substitution={...p,manifest:{...manifest,checker:{kind:'exact'}}};assertPackStructure(substitution);
  rows.push({id:d.id,structure:'other-fields-passed-in-memory-only',native:'not-run',materialized:false,productionChecker:d.checker,integration:'blocked-pending-production-registry',error:error.message,temporaryCheckerSubstitution:'exact used only to exercise remaining assertPackStructure fields; not a production pass or stored manifest'});
 }
}
const paths=[...new Set(definitions.flatMap(d=>[d.generatorModule,...(d.authorDependencies??[])])),'content/authoring/graphs-thread-pack-preflight.mjs','content/authoring/graphs-thread-all.mjs','content/authoring/harness.mjs','content/authoring/structures.mjs','packages/judge-adapter/src/pack-validation.mjs','packages/judge-adapter/src/checkers.mjs','packages/judge-adapter/src/custom-checkers.mjs','packages/judge-adapter/src/canonical.mjs','packages/contracts/src/hidden-case-requirement.mjs','packages/contracts/src/delivery-scope.json'];
const sourceHashes={};for(const path of paths)sourceHashes[path]=hash(await readFile(path));
const report={status:rows.some(row=>row.integration==='blocked-pending-production-registry')?'source-structure-checked-with-explicit-integration-blocker':'passed-source-pack-structure',command:'node content/authoring/graphs-thread-pack-preflight.mjs',nativeExecution:'not-run',materialization:'none',publication:'not-claimed',productionReady:false,sourceHashes,rows};
await writeFile('docs/release-evidence/graphs-thread/pack-preflight.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,rows}));
