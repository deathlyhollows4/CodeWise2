// Trusted JavaScript source-only audit. Never executes learner/native code or writes packs.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {buildFunctionHarness} from './harness.mjs';
import {validateInput} from '../../packages/judge-adapter/src/schema-validator.mjs';
import {inputKey,canonicalJson} from '../../packages/judge-adapter/src/canonical.mjs';
import {proposedSemantics as validateSemantics,productionSemantics} from './advanced-thread-semantic-proposal.mjs';
import {checkOutput} from '../../packages/judge-adapter/src/checkers.mjs';
import {customCheckerNames} from '../../packages/judge-adapter/src/custom-checkers.mjs';
const bytes=s=>Buffer.byteLength(s),nodes=x=>1+(Array.isArray(x)?x.reduce((s,v)=>s+nodes(v),0):x&&typeof x==='object'?Object.values(x).reduce((s,v)=>s+nodes(v),0):0);
const accepts=(d,input,expected,actual)=>{if(d.localChecker&&!customCheckerNames.includes(d.checker.name))return d.localChecker(input,actual);const accepted=checkOutput(d.checker,expected,actual,{input});if(d.localChecker)assert.equal(d.localChecker(input,actual),accepted,d.id+' production/local checker disagreement');return accepted;};
const wrongShapeValue=x=>Array.isArray(x)?(x.length?x.map((v,i)=>i===0?wrongShapeValue(v):v):[0]):typeof x==='boolean'?!x:x+1;
const digest=s=>createHash('sha256').update(s).digest('hex');
function authoredCases(d){
 const visible=new Set(d.visible.map(c=>inputKey(d.inputSchema,c.input))),unique=new Map();
 for(const c of d.generate()){assert(validateInput(d.inputSchema,c.input));assert(validateSemantics(d.semanticConstraints??[],c.input));assert(!d.valid||d.valid(c.input));const key=inputKey(d.inputSchema,c.input);if(visible.has(key)||unique.has(key))continue;const expected=d.oracle(c.input);if(Object.hasOwn(c,'expected'))assert.equal(canonicalJson(c.expected),canonicalJson(expected));unique.set(key,{...c,id:`hidden-${unique.size+1}`,expected,inputHash:digest(key)});}
 if(/^advanced-graphs-0[1-6]$/.test(d.id)){assert.equal(d.hiddenQuota,60);assert.equal(unique.size,60);}else assert(unique.size>=200);
 return [...unique.values()];
}
function domainBound(s){
 if(s.kind==='object'){const fields=Object.entries(s.properties);return {nodes:1+fields.reduce((n,[,v])=>n+domainBound(v).nodes,0),bytes:2+fields.reduce((n,[k,v])=>n+bytes(JSON.stringify(k))+1+domainBound(v).bytes+1,0)};}
 if(s.kind==='array'){const b=domainBound(s.items);return {nodes:1+s.maxLength*b.nodes,bytes:2+s.maxLength*(b.bytes+1)};}
 if(s.kind==='string')return {nodes:1,bytes:2+6*s.maxLength};
 if(s.kind==='boolean')return {nodes:1,bytes:5};
 return {nodes:1,bytes:Math.max(String(s.minimum??Number.MIN_SAFE_INTEGER).length,String(s.maximum??Number.MAX_SAFE_INTEGER).length)};
}
export async function audit(definitions,reportName){
 const rows=[];
 for(const d of definitions){
  assert.equal(d.visible.length,3);const hidden=authoredCases(d),all=[...d.visible,...hidden],keys=new Set(),runtimeGuardAvailable=productionSemantics(d.semanticConstraints??[],d.visible[0].input);
  const semanticVisible=new Set(d.visible.map(c=>(d.semanticKey??(x=>inputKey(d.inputSchema,x)))(c.input)));
  const semanticHidden=new Set();let independentChecks=0;
  for(const [i,c] of all.entries()){
   assert(validateInput(d.inputSchema,c.input),`${d.id} input schema ${i}`);assert(validateSemantics(d.semanticConstraints??[],c.input),`${d.id} semantic ${i}`);assert(!d.valid||d.valid(c.input));assert(validateInput(d.outputSchema,c.expected),`${d.id} output schema ${i}`);
   if(runtimeGuardAvailable)assert(productionSemantics(d.semanticConstraints??[],c.input),d.id+' production/proposal input guard disagreement');
   assert(accepts(d,c.input,c.expected,d.oracle(c.input)),`${d.id} primary ${i}`);assert(accepts(d,c.input,c.expected,d.independent(c.input)),`${d.id} independent ${i}`);independentChecks++;
   assert(accepts(d,c.input,c.expected,c.expected));if(d.checker.kind==='exact')assert(!accepts(d,c.input,c.expected,wrongShapeValue(c.expected)));
   const k=inputKey(d.inputSchema,c.input);assert(!keys.has(k),`${d.id} canonical duplicate`);keys.add(k);
   if(i>=3){const key=(d.semanticKey??(x=>inputKey(d.inputSchema,x)))(c.input);if(!semanticVisible.has(key))semanticHidden.add(key);}
  }
  if(d.hiddenQuota===60)assert.equal(semanticHidden.size,60,`${d.id} semantic hidden quota`);else assert(semanticHidden.size>=200,`${d.id} semantic hidden count`);
  const mutations=Object.entries(d.mutations).map(([name,fn])=>{const witness=all.findIndex(c=>!accepts(d,c.input,c.expected,fn(c.input)));assert(witness>=0,`${d.id} undetected ${name}`);return {name,detected:true,witness:witness<3?`visible-${witness+1}`:hidden[witness-3].id};});
  const wrappers=buildFunctionHarness(d.function),phases={};
  for(const [name,cases] of [['visible',d.visible],['hidden',hidden]]){
   const stdin=cases.map(c=>JSON.stringify(c.input)).join('\n')+'\n',stdout=cases.map(c=>JSON.stringify(c.expected)).join('\n')+'\n';
   const certificate={cases:cases.length,inputNodes:cases.reduce((s,c)=>s+nodes(c.input),0),outputNodes:1+cases.reduce((sum,c)=>sum+nodes(c.expected),0),stdinBytes:bytes(stdin),stdoutBytes:bytes(stdout),requestUpperBytes:bytes(JSON.stringify(stdin))+200000*6+2048,responseUpperBytes:bytes(JSON.stringify(stdout))+16384*6+65536+2048};
   assert(certificate.inputNodes+cases.length+1<=200000);assert(certificate.outputNodes<=200000);assert(certificate.stdinBytes<=8388608);assert(certificate.stdoutBytes<=4194304);assert(certificate.requestUpperBytes<=10000000);assert(certificate.responseUpperBytes<=6000000);phases[name]=certificate;
  }
  for(const lang of ['java','cpp','python']){assert(d.languages[lang].starter.includes('solve'));assert(d.languages[lang].reference.includes('solve'));assert.equal(wrappers[lang].split('{{USER_CODE}}').length,2);assert(bytes(wrappers[lang].replace('{{USER_CODE}}',d.languages[lang].reference))<=200000);}
  const domain={input:domainBound(d.inputSchema),output:domainBound(d.outputSchema)};assert(domain.input.nodes<=200000);assert(domain.output.nodes<=200000);assert(domain.input.bytes<=8388608);assert(domain.output.bytes<=4194304);
  assert(!validateInput(d.inputSchema,{}));assert(!validateInput(d.inputSchema,{...d.visible[0].input,unexpected:1}));assert(!validateInput(d.outputSchema,null));assert(!validateInput(d.outputSchema,Number.MAX_SAFE_INTEGER));
  for(const invalid of d.invalidInputs??[]){assert(!(validateInput(d.inputSchema,invalid)&&validateSemantics(d.semanticConstraints??[],invalid)),`${d.id} source proposal accepted invalid input`);if(runtimeGuardAvailable)assert(!(validateInput(d.inputSchema,invalid)&&productionSemantics(d.semanticConstraints??[],invalid)),d.id+' production guard accepted invalid input');}
  for(const arg of d.function.arguments.filter(a=>a.type==='int[][]')){const valid={...d.visible[0].input};assert(!validateInput(d.inputSchema,{...valid,[arg.name]:[[0],[0,0]]}));assert(!validateInput(d.inputSchema,{...valid,[arg.name]:[[-1]]}));assert(!validateInput(d.inputSchema,{...valid,[arg.name]:Array.from({length:201},()=>[])}));}
  for(const fixture of d.checkerFixtures??[]){for(const valid of fixture.valid)assert(accepts(d,fixture.input,null,valid),d.id+' rejected valid alternative');for(const invalid of fixture.invalid)assert(!accepts(d,fixture.input,null,invalid),d.id+' accepted invalid witness');}
  const categories=Object.fromEntries([...new Set(hidden.map(c=>c.category))].map(category=>[category,hidden.filter(c=>c.category===category).length]));
  const wrapperHashes=Object.fromEntries(['java','cpp','python'].map(lang=>[lang,digest(wrappers[lang])]));
  const fixtureChecks=(d.checkerFixtures??[]).reduce((sum,fixture)=>sum+fixture.valid.length+fixture.invalid.length,0);
  rows.push({id:d.id,hidden:hidden.length,semanticHidden:semanticHidden.size,runtimeInputGuard:runtimeGuardAvailable?'production-supported/source-cross-checked':'blocked-pending-production-semantic-registry/source-proposal-only',hiddenPolicy:d.hiddenQuota===60?'user-authorized-exact-60':'unchanged-minimum-200',curation:d.curation??null,categories,invalidInputChecks:(d.invalidInputs??[]).length,oracleChecks:independentChecks,checker:{...d.checker,integration:d.checker.kind==='custom'&&customCheckerNames.includes(d.checker.name)?'existing-production-registry/source-fixtures-checked':d.checkerStatus??'existing-declared-registry',fixtures:fixtureChecks},checkerChecks:d.checker.kind==='exact'?all.length*2:all.length,mutations,phases,publishedDomainBound:domain,wrapperHashes,maxRetained:hidden.filter(c=>c.category.startsWith('max-')).map(c=>({category:c.category,inputNodes:nodes(c.input),inputBytes:bytes(JSON.stringify(c.input)),expected:Array.isArray(c.expected)?{sha256:digest(canonicalJson(c.expected)),nodes:nodes(c.expected)}:c.expected,certificate:'independently-derived formula or explicit optimal witness; see author independent()'})),languages:'complete-source-and-typed-wrapper-only/native-not-run',publication:'not-published'});
 }
 const sources=[...new Set([...definitions.map(d=>d.generatorModule),...definitions.flatMap(d=>d.authorDependencies??[])]), 'content/authoring/advanced-thread-audit.mjs',...(reportName==='all'?['content/authoring/advanced-thread-all.mjs']:[]),...(definitions.some(d=>d.hiddenQuota===60)?['content/authoring/advanced-thread-curate.mjs']:[]),'content/authoring/advanced-thread-pack-preflight.mjs','content/authoring/harness.mjs','content/authoring/structures.mjs','content/authoring/pack-builder.mjs','packages/judge-adapter/src/canonical.mjs','packages/judge-adapter/src/schema-validator.mjs','packages/judge-adapter/src/semantic.mjs','packages/judge-adapter/src/edge-contracts.mjs','packages/judge-adapter/src/checkers.mjs','packages/judge-adapter/src/custom-checkers.mjs','packages/judge-adapter/src/pack-validation.mjs','packages/contracts/src/hidden-case-requirement.mjs','packages/contracts/src/delivery-scope.json'];const hashes={};for(const p of sources)hashes[p]=digest(await readFile(p));
 const report={status:rows.some(r=>r.runtimeInputGuard.startsWith('blocked'))?'passed-source-only-with-pending-semantic-integration':'passed-source-only',nativeExecution:'not-run',independentReview:'pending',command:`node content/authoring/advanced-thread-audit.mjs ${reportName}`,sourceHashes:hashes,limits:{sharedJsonNodes:200000,stdout:4194304,response:6000000,request:10000000,stdin:8388608,source:200000},rows};
 await mkdir('docs/release-evidence/advanced-thread',{recursive:true});await writeFile(`docs/release-evidence/advanced-thread/${reportName}.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,command:report.command,rows:report.rows.map(x=>({id:x.id,hidden:x.hidden,oracleChecks:x.oracleChecks,mutations:x.mutations.length,phases:x.phases})),sourceHashes:report.sourceHashes}));return report;
}
if(process.argv[1]?.endsWith('advanced-thread-audit.mjs')){const batch=process.argv[2]??'first';const m=await import(`./advanced-thread-${batch}.mjs`);await audit(m.definitions,batch);}
