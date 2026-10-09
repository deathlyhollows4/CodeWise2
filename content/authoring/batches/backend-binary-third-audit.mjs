import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { definitions } from './backend-binary-third.mjs';
import { logicalCases } from '../pack-builder.mjs';
const witness=(input,index)=>Number.isInteger(index)&&index>=0&&index<input.values.length&&
  (!index||input.values[index]>input.values[index-1])&&
  (index===input.values.length-1||input.values[index]>input.values[index+1]);
const packs=[];
for(const def of definitions){
  const hidden=logicalCases(def),all=[...def.visible,...hidden],mutations=Object.fromEntries(Object.keys(def.mutations).map(name=>[name,0]));let distinctValidWitnesses=0;
  for(const c of all){
    const independent=def.independent(c.input),expected=c.expected;
    if(def.id==='binary-search-08') {
      assert.ok(witness(c.input,expected),def.id+': stored witness must satisfy local inequalities');
      assert.ok(witness(c.input,independent),def.id+': independent linear witness must satisfy local inequalities');
      if(independent!==expected)distinctValidWitnesses++;
    }else assert.deepEqual(independent,expected,def.id+': independent result mismatch');
    for(const [name,mutant] of Object.entries(def.mutations)){
      const actual=mutant(c.input);
      if(def.id==='binary-search-08'?!witness(c.input,actual):JSON.stringify(actual)!==JSON.stringify(expected))mutations[name]++;
    }
  }
  for(const [name,count]of Object.entries(mutations))assert.ok(count>0,def.id+': surviving mutation '+name);
  packs.push({id:def.id,status:'draft',visible:def.visible.length,hidden:hidden.length,independentChecks:all.length,nonuniqueWitnessComparisons:distinctValidWitnesses,mutations,isolatedReferences:'not-run',publication:'not-authorized'});
}
const sourceHash=createHash('sha256').update(await readFile(new URL('./backend-binary-third.mjs',import.meta.url))).digest('hex');
const report={schemaVersion:1,status:'passed-trusted-host-oracles-only',command:'node content/authoring/batches/backend-binary-third-audit.mjs',finishedAt:new Date().toISOString(),runtime:{node:process.version,platform:process.platform,architecture:process.arch},sourceHash,packs,executionClaim:'No learner/reference code executed by this host oracle audit. Actual isolated language validation and independent semantic review are separate.'};
await writeFile(new URL('../../../docs/release-evidence/c-c-binary-third-oracles.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
