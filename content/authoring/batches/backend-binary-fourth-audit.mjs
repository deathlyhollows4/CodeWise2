import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {definitions} from './backend-binary-fourth.mjs';
import {logicalCases} from '../pack-builder.mjs';
const packs=[];
for(const def of definitions){const hidden=logicalCases(def),all=[...def.visible,...hidden],mutations=Object.fromEntries(Object.keys(def.mutations).map(name=>[name,0]));for(const c of all){assert.deepEqual(def.independent(c.input),c.expected,def.id+': independent result mismatch');for(const [name,mutant]of Object.entries(def.mutations))if(JSON.stringify(mutant(c.input))!==JSON.stringify(c.expected))mutations[name]++;}for(const [name,count]of Object.entries(mutations))assert.ok(count>0,def.id+': surviving mutation '+name);packs.push({id:def.id,status:'draft',visible:def.visible.length,hidden:hidden.length,independentChecks:all.length,mutations,isolatedReferences:'not-run'});}
const report={schemaVersion:1,status:'passed-trusted-host-oracles-only',command:'node content/authoring/batches/backend-binary-fourth-audit.mjs',finishedAt:new Date().toISOString(),runtime:{node:process.version,platform:process.platform,architecture:process.arch},sourceHash:createHash('sha256').update(await readFile(new URL('./backend-binary-fourth.mjs',import.meta.url))).digest('hex'),packs,executionClaim:'Host expected-value checks only; no isolated reference/publication claim.'};
await writeFile(new URL('../../../docs/release-evidence/c-c-binary-fourth-oracles.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
