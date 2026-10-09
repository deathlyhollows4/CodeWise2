import test from 'node:test';
import assert from 'node:assert/strict';
import {logicalCases} from '../../content/authoring/pack-builder.mjs';
import {hiddenCaseRequirement} from '../../packages/contracts/src/hidden-case-requirement.mjs';
const definition=(id,count)=>({id,inputSchema:{kind:'object',properties:{x:{kind:'integer'}}},visible:[0,1,2].map(x=>({input:{x},expected:x})),generate:()=>Array.from({length:count},(_,i)=>({input:{x:i+3},category:'explicit-curated-fixture'})),oracle:({x})=>x});
test('new future IDs require exactly60 curated canonical inputs, never automatic truncation',()=>{
 assert.deepEqual(hiddenCaseRequirement('backtracking-03'),{minimum:60,exact:60});
 assert.equal(logicalCases(definition('backtracking-03',60)).length,60);
 for(const count of [59,61,200])assert.throws(()=>logicalCases(definition('backtracking-03',count)),/exact 60/);
});
test('completed IDs retain larger suites and the200minimum',()=>{
 assert.deepEqual(hiddenCaseRequirement('heap-09'),{minimum:200,exact:null});
 assert.equal(logicalCases(definition('heap-09',240)).length,240);
 assert.throws(()=>logicalCases(definition('heap-09',60)),/minimum 200/);
});
test('permuted duplicate candidates do not manufacture sixty semantic inputs',()=>{
 const d=definition('backtracking-03',60);d.inputSchema={kind:'object',properties:{x:{kind:'array',unordered:true,items:{kind:'integer'}}}};d.generate=()=>Array.from({length:60},(_,i)=>({input:{x:i%2?[1,2]:[2,1]},category:'duplicate-fixture'}));d.visible=[3,4,5].map(x=>({input:{x:[x]},expected:x}));d.oracle=()=>0;
 assert.throws(()=>logicalCases(d),/exact 60/);
});
