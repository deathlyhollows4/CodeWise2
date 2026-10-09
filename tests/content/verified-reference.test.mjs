import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getPrivatePack,getVerifiedReference,referenceReceiptMatches,publicProblem} from '../../packages/judge-adapter/src/content.mjs';
test('read-only reference accessor uses current complete selected-language evidence',async()=>{
 const pack=await getPrivatePack('arrays-hashing-01'),receipt=JSON.parse(await readFile(new URL('../../docs/release-evidence/validation-arrays-hashing-01-java.json',import.meta.url),'utf8'));
 assert.equal(await referenceReceiptMatches(pack,'java',receipt),true);
 const verified=await getVerifiedReference(pack.manifest.id,'java');assert.equal(verified.available,true);assert.equal(verified.code,pack.languages.java.reference);
 const snapshot=publicProblem(pack);assert.equal((await getVerifiedReference(pack.manifest.id,'java',{expectedPublicSnapshot:snapshot})).available,true);snapshot.statement+='\nChanged statement';assert.deepEqual(await getVerifiedReference(pack.manifest.id,'java',{expectedPublicSnapshot:snapshot}),{available:false,reason:'public-snapshot-changed'});
 assert.equal(await referenceReceiptMatches(pack,'python',receipt),false);
 for(const asset of ['reference','wrapper','starter']){const changed=structuredClone(pack);changed.languages.java[asset]+='\n';assert.equal(await referenceReceiptMatches(changed,'java',receipt),false);}
 for(const mutate of [r=>r.result.counts.notRun=1,r=>r.result.counts.passed--,r=>r.result.runtime.phases[1].bootId='different-boot',r=>r.result.runtime.phases[1].identityHash='0'.repeat(64),r=>r.result.status='runtime_error']){const changed=structuredClone(receipt);mutate(changed);assert.equal(await referenceReceiptMatches(pack,'java',changed),false);}
 const pending=structuredClone(pack);pending.validation.languages.java.status='failed';assert.equal(await referenceReceiptMatches(pending,'java',receipt),false);
 assert.deepEqual(await getVerifiedReference(pack.manifest.id,'ruby'),{available:false,reason:'unsupported-language'});
 assert.equal((await getVerifiedReference('unknown-problem-not-authored','java')).available,false);
});
