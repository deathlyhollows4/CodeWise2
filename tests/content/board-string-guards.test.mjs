import test from 'node:test';import assert from 'node:assert/strict';
import {validateSemantics} from '../../packages/judge-adapter/src/semantic.mjs';
test('board row guard permits empty board and rejects ragged, empty or oversized rows',()=>{
 const rule=[{kind:'rectangular-strings',field:'board',minColumns:1,maxColumns:4,maxRows:4}];
 for(const board of [[],['a'],['abcd','efgh','ijkl','mnop']])assert.equal(validateSemantics(rule,{board}),true);
 for(const board of [[''],['ab','c'],['abcde'],Array(5).fill('a'),[7]])assert.equal(validateSemantics(rule,{board}),false);
 assert.equal(validateSemantics([...rule,{kind:'alphabet',field:'board',alphabet:'lowercase',each:true}],{board:['AB']}),false);
});
test('parenthesis completion alphabet supports literal parentheses and one-position wildcard only',()=>{
 const rule=[{kind:'alphabet',field:'pattern',alphabet:'parentheses-wildcard'}];
 for(const pattern of ['','(??)','??'])assert.equal(validateSemantics(rule,{pattern}),true);
 for(const pattern of ['(*)','[?]','a?'])assert.equal(validateSemantics(rule,{pattern}),false);
});
