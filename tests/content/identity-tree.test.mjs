import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSemantics} from '../../packages/judge-adapter/src/semantic.mjs';
import {buildFunctionHarness,buildFunctionStarters} from '../../content/authoring/harness.mjs';
const rules=[{kind:'identity-tree',field:'data',maxNodes:2000,targetCount:2}];
test('tree targets denote existing original compact BFS slots even with repeated values',()=>{
 assert.equal(validateSemantics(rules,{data:{values:[4,4,4,null,4],targetIndices:[1,4]}}),true);
 assert.equal(validateSemantics(rules,{data:{values:[4],targetIndices:[0,0]}}),true);
 for(const data of [{values:[4,null,4],targetIndices:[0,1]},{values:[4],targetIndices:[0,1]},{values:[4,null,null,4],targetIndices:[0,3]},{values:[],targetIndices:[0,0]},{values:[4],targetIndices:[0]},{values:[4],targetIndices:[0,0.5]}])assert.equal(validateSemantics(rules,{data}),false);
});
test('native identity tree wrappers reuse original tree nodes and existing identity serialization',()=>{
 const contract={arguments:[{name:'data',type:'IdentityTree'}],returnType:'TreeNodeIdentity',readOnlyNodes:true},wrappers=buildFunctionHarness(contract),starters=buildFunctionStarters(contract);
 for(const [language,wrapper] of Object.entries(wrappers)){assert.ok(wrapper.includes('identity_tree'));assert.ok(wrapper.includes('tree_identity'));assert.ok(wrapper.includes('targetIndices'));assert.ok(wrapper.includes('snapshot_inputs'));assert.ok(wrapper.includes('check_inputs'));assert.ok(starters[language].includes('solve'));}
 assert.match(starters.java,/solve\(IdentityTree data\)/);assert.match(starters.cpp,/solve\(IdentityTree data\)/);
 assert.throws(()=>buildFunctionHarness({...contract,returnType:'IdentityTree'}),/explicit/);
});
test('fixed-length wildcard alphabet accepts only lowercase letters and question marks',()=>{
 const rule=[{kind:'alphabet',field:'patterns',alphabet:'lowercase-wildcard',each:true}];
 assert.equal(validateSemantics(rule,{patterns:['a?c','???','']}),true);
 for(const patterns of [['a*c'],['A?'],['a.'],[7]])assert.equal(validateSemantics(rule,{patterns}),false);
});
