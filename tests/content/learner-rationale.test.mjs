import test from 'node:test';
import assert from 'node:assert/strict';
import {learnerRationale} from '../../packages/judge-adapter/src/content.mjs';
test('learner rationale exposes bounded algorithm explanation and omits author status notes',()=>{
 assert.equal(learnerRationale({manifest:{id:'fixture',rationale:'A heap exposes the smallest retained candidate.'}}),'A heap exposes the smallest retained candidate.');
 for(const rationale of ['Checkpoint pending validation.','This draft is planned.','Runner unavailable.','x'.repeat(2001)])assert.equal(learnerRationale({manifest:{id:'fixture',rationale}}),undefined);
 const text=learnerRationale({manifest:{id:'arrays-hashing-03',rationale:'Pending validation.'}});assert.match(text,/remembering distinct values/);assert.doesNotMatch(text,/pending|validation/i);
});
