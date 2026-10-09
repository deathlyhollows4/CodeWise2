import test from 'node:test';
import assert from 'node:assert/strict';
import {captureExecutionIdentity,getPrivatePack,publicProblem,validationIdentity,encodeCases} from '../../packages/judge-adapter/src/content.mjs';
import {judgePack} from '../../packages/judge-adapter/src/index.mjs';
test('capture requires the trusted current public snapshot, including same-version statement changes',async()=>{
 const pack=await getPrivatePack('arrays-hashing-01'),snapshot=publicProblem(pack);
 const captured=await captureExecutionIdentity({problemId:pack.manifest.id,language:'java',expectedPublicSnapshot:snapshot});assert.equal(captured.identity,await validationIdentity(pack,'java'));assert.equal(captured.version,pack.manifest.version);
 await assert.rejects(()=>captureExecutionIdentity({problemId:pack.manifest.id,language:'java'}));snapshot.statement+='\nBenign changed prose';await assert.rejects(()=>captureExecutionIdentity({problemId:pack.manifest.id,language:'java',expectedPublicSnapshot:snapshot}),/snapshot changed/);
});
test('changed language assets fail before readiness or execution',async()=>{
 const pack=await getPrivatePack('arrays-hashing-01'),identity=await validationIdentity(pack,'java');pack.languages.java.wrapper+='\n';let calls=0;
 const adapter={readiness:async()=>{calls++;},execute:async()=>{calls++;}};
 const result=await judgePack({problemId:pack.manifest.id,language:'java',code:'benign fixture',expectedIdentity:identity,privatePack:pack,adapter});assert.equal(result.status,'infrastructure_error');assert.equal(result.counts.executed,0);assert.equal(calls,0);
});
test('one copied private snapshot supplies both phases despite external fixture mutation',async()=>{
 const pack=await getPrivatePack('arrays-hashing-01'),identity=await validationIdentity(pack,'java'),originalHidden=structuredClone(pack.hiddenCases),expectedHiddenInput=encodeCases(pack,originalHidden),runtimeIdentity='a'.repeat(64);let phase=0;
 const adapter={readiness:async()=>({ready:true,identityHash:runtimeIdentity}),execute:async({stdin})=>{
  const cases=phase++===0?pack.visibleCases:originalHidden;
  if(phase===1){pack.hiddenCases[0].input.values=[99];pack.hiddenCases[0].expected=99;pack.languages.java.wrapper='benign changed fixture';}
  if(phase===2)assert.equal(stdin,expectedHiddenInput);
  return {status:'executed',stdout:cases.map(c=>JSON.stringify(c.expected)).join('\n')+'\n',runtime:{identityHash:runtimeIdentity,startIdentityHash:runtimeIdentity,identity:{bootId:'fixture-boot'}}};
 }};
 const result=await judgePack({problemId:pack.manifest.id,language:'java',code:'benign fixture',expectedIdentity:identity,privatePack:pack,adapter});assert.equal(result.status,'accepted');assert.equal(phase,2);assert.equal(result.counts.notRun,0);
});
