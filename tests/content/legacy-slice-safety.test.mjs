import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {firstRepeatedBySortedGroups,materialize} from '../../content/authoring/slice.mjs';
const brute=a=>{for(let i=0;i<a.length;i++)for(let j=0;j<i;j++)if(a[i]===a[j])return i;return -1;};
test('sorted-group independent oracle agrees with exhaustive original-position comparisons',()=>{
 let checked=0;for(let n=0;n<=8;n++)for(let encoded=0;encoded<3**n;encoded++){let state=encoded;const a=Array.from({length:n},()=>{const v=state%3-1;state=Math.floor(state/3);return v;});assert.equal(firstRepeatedBySortedGroups(a),brute(a));checked++;}assert.equal(checked,9841);
 assert.equal(firstRepeatedBySortedGroups(Array.from({length:100000},(_,i)=>i)),-1);
 assert.equal(firstRepeatedBySortedGroups([7,4,7,4]),2);
});
test('legacy materializer refuses before any catalogue write',async()=>{
 const before=await readFile('content/catalogue.json','utf8');await assert.rejects(materialize(),/central catalogue/);assert.equal(await readFile('content/catalogue.json','utf8'),before);
});
