import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {getPrivatePack} from '../../packages/judge-adapter/src/content.mjs';
import {packIdentity,assertPublicationReviews} from '../../packages/judge-adapter/src/pack-validation.mjs';
test('publication review identity binds all reviewed language assets',async()=>{
  const pack=await getPrivatePack('arrays-hashing-01'),root=await mkdtemp(join(tmpdir(),'codewise-review-'));
  try{
    await mkdir(join(root,'private'));
    const identity=packIdentity(pack);
    await writeFile(join(root,'private','oracle-evidence.json'),JSON.stringify({status:'passed',contentIdentity:identity,suiteHash:pack.suite.suiteHash,oracleChecks:pack.hiddenCases.length+3,hiddenUnique:pack.hiddenCases.length,mutations:[{detected:true}]}));
    for(const name of ['progression','diversity','rights'])await writeFile(join(root,'private',name+'-review.json'),JSON.stringify({status:'passed',contentIdentity:identity,reviewer:'benign-fixture',reviewedAt:'2026-10-08T00:00:00Z'}));
    await assertPublicationReviews(pack,root);
    for(const language of ['java','cpp','python'])for(const asset of ['starter','wrapper','reference']){
      const changed=structuredClone(pack);changed.languages[language][asset]+='\n';
      assert.notEqual(packIdentity(changed),identity,language+'/'+asset);
      await assert.rejects(()=>assertPublicationReviews(changed,root),/stale/);
    }
    const published=structuredClone(pack);published.manifest.status='published';
    assert.equal(packIdentity(published),identity);
  }finally{await rm(root,{recursive:true,force:true});}
});
