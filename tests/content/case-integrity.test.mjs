import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';
import {getPrivatePack,sha256} from '../../packages/judge-adapter/src/content.mjs';
import {inputKey} from '../../packages/judge-adapter/src/canonical.mjs';
import {assertPackStructure,assertPublicationReviews,packIdentity} from '../../packages/judge-adapter/src/pack-validation.mjs';
test('private case IDs cannot bypass canonical uniqueness, hash or visible-disjoint checks',async()=>{
 const original=await getPrivatePack('math-geometry-15');
 const renamed=structuredClone(original);renamed.hiddenCases.forEach((c,i)=>c.id='private-case-'+i);assert.doesNotThrow(()=>assertPackStructure(renamed));
 const duplicate=structuredClone(renamed);duplicate.hiddenCases[1].input=Object.fromEntries(Object.entries(duplicate.hiddenCases[0].input).reverse());duplicate.hiddenCases[1].inputHash=duplicate.hiddenCases[0].inputHash;assert.throws(()=>assertPackStructure(duplicate),/duplicate\/disjoint hidden/);
 const collision=structuredClone(renamed);collision.hiddenCases[0].input=structuredClone(collision.visibleCases[0].input);collision.hiddenCases[0].inputHash=sha256(inputKey(collision.manifest.inputSchema,collision.hiddenCases[0].input));assert.throws(()=>assertPackStructure(collision),/duplicate\/disjoint hidden/);
 const wrongHash=structuredClone(renamed);wrongHash.hiddenCases[0].inputHash='0'.repeat(64);assert.throws(()=>assertPackStructure(wrongHash),/canonical input hash/);
 const duplicateId=structuredClone(renamed);duplicateId.hiddenCases[0].id=duplicateId.visibleCases[0].id;assert.throws(()=>assertPackStructure(duplicateId),/case IDs/);
});
test('publication evidence must certify the actual private canonical count',async()=>{
 const pack=await getPrivatePack('arrays-hashing-01'),prefix=join(tmpdir(),'codewise-case-review-'),directory=await mkdtemp(prefix);
 try{await mkdir(join(directory,'private'));await writeFile(join(directory,'private/oracle-evidence.json'),JSON.stringify({status:'passed',contentIdentity:packIdentity(pack),suiteHash:pack.suite.suiteHash,oracleChecks:pack.hiddenCases.length+3,hiddenUnique:0,mutations:[{detected:true}]}));await assert.rejects(assertPublicationReviews(pack,directory),/oracle or mutation/);}finally{assert.ok(resolve(directory).startsWith(resolve(prefix)));await rm(directory,{recursive:true,force:true});}
});
