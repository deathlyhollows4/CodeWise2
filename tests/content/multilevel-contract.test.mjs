import test from 'node:test';
import assert from 'node:assert/strict';
import {multilevelInput} from '../../packages/judge-adapter/src/multilevel-contract.mjs';
import {buildFunctionHarness,buildFunctionStarters} from '../../content/authoring/harness.mjs';
test('multilevel input is one rooted hierarchy with unique combined incoming edges',()=>{
 assert.equal(multilevelInput({values:[7,7,4,9],next:[1,null,3,null],child:[2,null,null,null],head:0},2000),true);
 assert.equal(multilevelInput({values:[],next:[],child:[],head:null},2000),true);
 for(const data of [{values:[1,2],next:[1,null],child:[1,null],head:0},{values:[1,2],next:[1,null],child:[null,0],head:0},{values:[1,2],next:[null,null],child:[null,null],head:0},{values:[1],next:[null],child:[null],head:null},{values:[1],next:[3],child:[null],head:0}])assert.equal(multilevelInput(data,2000),false);
});
test('multilevel guard bounds deep hierarchies iteratively',()=>{
 const n=2000,data={values:Array(n).fill(1),next:Array(n).fill(null),child:Array.from({length:n},(_,i)=>i+1<n?i+1:null),head:0};
 assert.equal(multilevelInput(data,2000),true);assert.equal(multilevelInput(data,1999),false);
});
test('native multilevel output uses original identity and reciprocal links with preserved values',()=>{
 const contract={arguments:[{name:'head',type:'MultiListNode'}],returnType:'MultiListNodeIdentitySequence'},wrappers=buildFunctionHarness(contract),starters=buildFunctionStarters(contract);
 for(const wrapper of Object.values(wrappers)){assert.ok(wrapper.includes('multi_list'));assert.ok(wrapper.includes('multi_identity_sequence'));assert.ok(wrapper.includes('snapshot_inputs'));assert.ok(wrapper.includes('check_input_values'));assert.ok(wrapper.includes('prev'));assert.ok(wrapper.includes('child'));}
 assert.match(starters.java,/return null/);assert.match(starters.cpp,/MultiListNode\* solve/);
 assert.throws(()=>buildFunctionHarness({...contract,returnType:'MultiListNode'}),/explicit/);
});
