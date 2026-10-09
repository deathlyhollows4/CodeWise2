import test from 'node:test';import assert from 'node:assert/strict';
import {validateSemantics} from '../../packages/judge-adapter/src/semantic.mjs';
import {checkOutput} from '../../packages/judge-adapter/src/checkers.mjs';
test('operation indices use the declared node array rather than operation count',()=>{const rules=[{kind:'range-by-length',field:'cuts',array:'head',minimum:0,maxOffset:-1}];assert.equal(validateSemantics(rules,{head:[7,8,9],cuts:[2]}),true);assert.equal(validateSemantics(rules,{head:[7],cuts:[0,0,1]}),false);assert.equal(validateSemantics([{kind:'range-by-length',field:'values',minimum:0,maxOffset:0}],{values:[2,1]}),true);});
test('sorted native links permit shared tails and reject descending edges',()=>{const rules=[{kind:'node-table',field:'data',links:['next'],heads:'heads',requireReachable:true,acyclicLinks:['next'],sortedLinks:['next']}];assert.equal(validateSemantics(rules,{data:{values:[7,7,7,8],next:[2,2,3,null],heads:[0,1]}}),true);assert.equal(validateSemantics(rules,{data:{values:[2,1],next:[1,null],heads:[0]}}),false);assert.equal(validateSemantics(rules,{data:{values:[1,2],next:[1,0],heads:[0]}}),false);});
test('zero-sum normalization accepts distinct terminal witnesses and rejects illegal deletions',()=>{const checker={kind:'custom',name:'zero-sum-list-normalization'},input={head:[1,2,-3,3,1]};assert.equal(checkOutput(checker,[3,4],[0,1,4],{input}),true);assert.equal(checkOutput(checker,[0,1,4],[3,4],{input}),true);for(const actual of [[0,4],[0,1,2,3,4],[4,3],[-1],[5]])assert.equal(checkOutput(checker,[3,4],actual,{input}),false);assert.equal(checkOutput(checker,[],[],{input:{head:[1,-1]}}),true);assert.equal(checkOutput(checker,[0],[0],{input:{head:[0]}}),false);});
test('tree node limit counts nodes while preserving compact sparse positions',()=>{const rules=[{kind:'tree-level',field:'root',maxNodes:2}];assert.equal(validateSemantics(rules,{root:[1,null,2,null,null]}),true);assert.equal(validateSemantics(rules,{root:[1,2,3]}),false);assert.equal(validateSemantics(rules,{root:[null,1]}),false);assert.equal(validateSemantics(rules,{root:[]}),true);});
test('circular node table requires one reachable permutation ring',()=>{
 const rules=[{kind:'node-table',field:'data',links:['next'],heads:'heads',requireReachable:true,uniqueLinks:['next']}];
 const accepts=data=>validateSemantics(rules,{data});
 assert.equal(accepts({values:[7,7,3],next:[2,0,1],heads:[0]}),true);
 assert.equal(accepts({values:[7,7,3],next:[1,2,2],heads:[0]}),false);
 assert.equal(accepts({values:[7,7,3],next:[1,0,2],heads:[0]}),false);
 assert.equal(accepts({values:[7],next:[null],heads:[0]}),false);
 assert.equal(accepts({values:[7],next:[0],heads:[0]}),true);
});
test('matrix sortedness checks columns and rows with empty shapes',()=>{
 const rules=[{kind:'matrix-sorted',field:'grid'}];
 for(const grid of [[],[[],[]],[[1,2],[2,3]]])assert.equal(validateSemantics(rules,{grid}),true);
 for(const grid of [[[1,2],[0,3]],[[2,1]],[[1],[2,3]]])assert.equal(validateSemantics(rules,{grid}),false);
});
test('strict local peak checker accepts distinct witnesses and rejects invalid positions',()=>{
 const checker={kind:'custom',name:'strict-local-peak'},input={values:[3,1,4]};
 assert.equal(checkOutput(checker,0,2,{input}),true);assert.equal(checkOutput(checker,2,0,{input}),true);
 for(const actual of [-1,1,3,0.5])assert.equal(checkOutput(checker,0,actual,{input}),false);
 assert.equal(validateSemantics([{kind:'adjacent-distinct',field:'values'}],{values:[3,3]}),false);
});
