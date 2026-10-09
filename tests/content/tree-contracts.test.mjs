import test from 'node:test';
import assert from 'node:assert/strict';
import {strictBst,compatibleTraversals} from '../../packages/judge-adapter/src/tree-contracts.mjs';
import {validateSemantics} from '../../packages/judge-adapter/src/semantic.mjs';

test('strict BST validates ancestor bounds and rejects duplicate values',()=>{
  assert.equal(strictBst([8,3,10,1,6,null,14,null,null,4,7,13]),true);
  assert.equal(strictBst([8,3,10,null,9]),false);
  assert.equal(strictBst([8,3,10,null,null,8]),false);
  assert.equal(strictBst([1,null,null,2]),false);
});
test('empty and deep compact BST inputs are bounded and iterative',()=>{
  for(const input of [[],[null],[null,null]])assert.equal(strictBst(input),true);
  const chain=[0];for(let i=1;i<2000;i++)chain.push(null,i);
  assert.equal(strictBst(chain),true);
  assert.equal(strictBst([null,1]),false);
  assert.equal(strictBst([1.5]),false);
});
test('same-set unique traversal permutations must have compatible partitions',()=>{
  assert.equal(compatibleTraversals([1,2,3],[2,1,3],2000),true);
  assert.equal(compatibleTraversals([1,3,2],[2,1,3],2000),false);
  assert.equal(compatibleTraversals([1,1],[1,1],2000),false);
  assert.equal(compatibleTraversals([1,2],[1,3],2000),false);
  assert.equal(compatibleTraversals([1],[1],0),false);
});
test('compatible traversal checks handle deep and empty domains without recursion',()=>{
  const chain=Array.from({length:2000},(_,i)=>i);
  assert.equal(compatibleTraversals(chain,chain,2000),true);
  assert.equal(compatibleTraversals([],[],2000),true);
  assert.equal(compatibleTraversals(chain,chain,1999),false);
  assert.equal(validateSemantics([{kind:'tree-traversal-pair',preorder:'pre',inorder:'ino',maxNodes:2000}],{pre:chain,ino:chain}),true);
  assert.equal(validateSemantics([{kind:'strict-bst',field:'root'}],{root:[5,2,9,null,6]}),false);
});
