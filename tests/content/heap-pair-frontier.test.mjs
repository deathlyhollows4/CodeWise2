import test from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from '../../content/authoring/batches/heap-pair-frontier.mjs';
import {logicalCases} from '../../content/authoring/pack-builder.mjs';
test('Cartesian frontier matches BigInt full enumeration over512 bounded edge combinations',()=>{const d=definitions[0];let checked=0;const rows=[[],[-1],[0],[1],[-1,0],[-1,-1],[0,0],[-1,1]];for(const left of rows)for(const right of rows)for(let k=0;k<=7;k++){const input={left,right,k};assert.deepEqual(d.oracle(input),d.independent(input));checked++;}assert.equal(checked,512);assert.equal(logicalCases(d).length,60);});
