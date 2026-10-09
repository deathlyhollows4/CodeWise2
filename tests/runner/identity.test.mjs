import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,readdir,copyFile,mkdir,rm,cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {JudgeAdapter,judgePack,getPrivatePack} from '../../packages/judge-adapter/src/index.mjs';
import {validationIdentity} from '../../packages/judge-adapter/src/content.mjs';
import {saveReferenceOutcome,referenceHistoryName} from '../../scripts/reference-evidence.mjs';
const temporaryPrefix=join(tmpdir(),'codewise-identity-');
test('malformed prior evidence identities cannot choose archive paths',()=>{const filename=referenceHistoryName('arrays-hashing-01','cpp',{validationIdentity:'../../outside',runtimeIdentity:'C:\\private\\file'});assert.match(filename,/^arrays-hashing-01-cpp-[a-f0-9]{64}\.json$/);assert.throws(()=>referenceHistoryName('../outside','cpp',{}));});
test('production readiness fails closed on absent or malformed identity',async()=>{
 for(const identityHash of [undefined,'','not-a-hash','A'.repeat(64)]){
  const adapter=new JudgeAdapter({token:'fixture-token-'.repeat(4),fetchImpl:async()=>new Response(JSON.stringify({ready:true,controlsVerified:true,languages:['java','cpp','python'].map(id=>({id,version:'fixture'})),identityHash}),{status:200})});
  assert.equal((await adapter.readiness()).ready,false);
 }
});
test('transport cancellation keeps its honest outcome without fake runtime identity',async()=>{
 const adapter={readiness:async()=>({ready:true,identityHash:'a'.repeat(64)}),execute:async()=>({status:'canceled',diagnostics:'Owned task canceled'})};
 const result=await judgePack({problemId:'arrays-hashing-01',language:'cpp',code:'',adapter});assert.equal(result.status,'canceled');assert.equal(result.counts.executed,0);
});
test('runtime identity changes between grading phases cannot record acceptance',async()=>{
 const hash='a'.repeat(64),pack=await getPrivatePack('arrays-hashing-01');let calls=0;
 const adapter={readiness:async()=>({ready:true,identityHash:hash}),execute:async()=>({status:'executed',stdout:++calls===1?pack.visibleCases.map(c=>JSON.stringify(c.expected)).join('\n')+'\n':pack.hiddenCases.map(c=>JSON.stringify(c.expected)).join('\n')+'\n',runtime:{identityHash:calls===1?hash:'b'.repeat(64),startIdentityHash:hash,identity:{bootId:'fixture-boot'}}})};
 const result=await judgePack({problemId:pack.manifest.id,language:'cpp',code:'',adapter,privatePack:pack});
 assert.equal(result.status,'infrastructure_error');assert.equal(result.counts.passed,3);assert.equal(result.counts.executed,3);assert.equal(result.counts.notRun,pack.hiddenCases.length);
 assert.equal(result.runtime.phases[1].identityHash,'b'.repeat(64));
});
test('failed current rerun clears stale language acceptance without changing old receipt',async()=>{
 const directory=await mkdtemp(temporaryPrefix);
 try{
  await writeFile(join(directory,'validation.json'),JSON.stringify({languages:{cpp:{status:'passed',validationIdentity:'old'}},status:'references-passed-review-pending'}));
  const old={status:'passed',validationIdentity:'old'},evidence={validationIdentity:'new',runtimeIdentity:'runtime',executedAt:'fixture',result:{status:'wrong_answer',counts:{executed:3,passed:2}}};
  await saveReferenceOutcome({root:directory,manifest:{id:'fixture'}},'cpp',evidence,false);
  const record=JSON.parse(await readFile(join(directory,'validation.json'),'utf8'));
  assert.equal(record.languages.cpp.status,'failed');assert.equal(record.languages.cpp.validationIdentity,'new');assert.equal(record.status,'pending');assert.deepEqual(old,{status:'passed',validationIdentity:'old'});
 }finally{await cleanup(directory);}
});
async function cleanup(path){assert.ok(resolve(path).startsWith(resolve(temporaryPrefix)));await rm(path,{recursive:true,force:true});}
test('loaded trusted pack snapshot remains the judged source after its source file changes',async()=>{
 const directory=await mkdtemp(temporaryPrefix);
 try{
  const pack=await getPrivatePack('arrays-hashing-01'),path=join(directory,'wrapper.cpp');
  await writeFile(path,'// immutable snapshot A\n{{USER_CODE}}\n');
  const snapshot={...pack,languages:{...pack.languages,cpp:{...pack.languages.cpp,wrapper:await readFile(path,'utf8')}}};
  const identity=await validationIdentity(snapshot,'cpp');
  await writeFile(path,'// later filesystem version B\n{{USER_CODE}}\n');
  let judgedSource;
  const adapter={readiness:async()=>({ready:true}),execute:async request=>{judgedSource=request.source;return {status:'compile_error'};}};
  await judgePack({problemId:pack.manifest.id,language:'cpp',code:'// known trusted fixture',privatePack:snapshot,adapter});
  assert.equal(judgedSource,snapshot.languages.cpp.wrapper.replace('{{USER_CODE}}','// known trusted fixture'));
  assert.equal(await validationIdentity(snapshot,'cpp'),identity);
  assert.ok(!judgedSource.includes('version B'));
 }finally{await cleanup(directory);}
});
test('checker identity stays bound to the imported implementation after disk changes',async()=>{
 const directory=await mkdtemp(temporaryPrefix);
 try{
  const source=fileURLToPath(new URL('../../packages/judge-adapter/src/',import.meta.url)),destination=join(directory,'packages','judge-adapter','src');await mkdir(destination,{recursive:true});
  for(const name of await readdir(source))if(name.endsWith('.mjs'))await copyFile(join(source,name),join(destination,name));
  const contracts=fileURLToPath(new URL('../../packages/contracts/src/',import.meta.url)),contractCopy=join(directory,'packages','contracts','src');await mkdir(contractCopy,{recursive:true});
  for(const name of await readdir(contracts))if(name.endsWith('.mjs')||name.endsWith('.json'))await copyFile(join(contracts,name),join(contractCopy,name));
  // The real relative contract modules import Zod. Ship the actual dependency
  // inside this isolated tree instead of assuming an OS temp ancestor has it.
  await cp(fileURLToPath(new URL('../../node_modules/zod/',import.meta.url)),join(directory,'node_modules','zod'),{recursive:true});
  const imported=await import(pathToFileURL(join(destination,'content.mjs')).href),checks=await import(pathToFileURL(join(destination,'checkers.mjs')).href);
  const pack={manifest:{status:'draft',checker:{kind:'exact'}},statement:'fixture',visibleCases:[],suite:{suiteHash:'fixture'},languages:{cpp:{reference:'fixture',wrapper:'fixture',starter:'fixture'}}};
  const identity=await imported.validationIdentity(pack,'cpp');
  await writeFile(join(destination,'checkers.mjs'),'export function checkOutput(){return false;}\n');
  await writeFile(join(destination,'custom-checkers.mjs'),'export const customCheckerNames=[];\n');
  assert.equal(await imported.validationIdentity(pack,'cpp'),identity);
  assert.equal(checks.checkOutput({kind:'exact'},7,7),true);
 }finally{await cleanup(directory);}
});
