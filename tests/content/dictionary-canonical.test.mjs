import test from 'node:test';
import assert from 'node:assert/strict';
import {inputKey} from '../../packages/judge-adapter/src/canonical.mjs';
import {validateInput} from '../../packages/judge-adapter/src/schema-validator.mjs';
test('dictionary set canonicalization ignores declared order and duplicate roots without changing target order',()=>{
 const word={kind:'string'},dictionary={kind:'array',unordered:true,deduplicate:true,items:word},schema={kind:'object',properties:{roots:dictionary,words:{kind:'array',items:word}}};
 const a={roots:['cat','bat','cat'],words:['cattle','battery']},b={roots:['bat','cat'],words:['cattle','battery']};
 assert.equal(inputKey(schema,a),inputKey(schema,b));assert.equal(validateInput(schema,a),true);
 assert.notEqual(inputKey(schema,a),inputKey(schema,{...b,words:[...b.words].reverse()}));assert.deepEqual(a.roots,['cat','bat','cat']);
});
test('frequency arrays retain multiplicity and deduplication cannot discard ordered sequence entries',()=>{
 const multiset={kind:'array',unordered:true,items:{kind:'integer'}};assert.notEqual(inputKey(multiset,[1,1,2]),inputKey(multiset,[1,2]));
 assert.throws(()=>inputKey({...multiset,unordered:false,deduplicate:true},[1,2]),/declared unordered/);
});
test('legacy sum/max keys ignore input order while repeated-position keys preserve it',()=>{
 const base={kind:'integer-array',field:'values'};
 assert.equal(inputKey({...base,unordered:true},{values:[3,1,3]}),inputKey({...base,unordered:true},{values:[3,3,1]}));
 assert.notEqual(inputKey({...base,unordered:true},{values:[3,3,1]}),inputKey({...base,unordered:true},{values:[3,1]}));
 assert.equal(inputKey({...base,unordered:true,deduplicate:true},{values:[3,3,1]}),inputKey({...base,unordered:true,deduplicate:true},{values:[3,1]}));
 assert.notEqual(inputKey(base,{values:[3,1,3]}),inputKey(base,{values:[3,3,1]}));
});
