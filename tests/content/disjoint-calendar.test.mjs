import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSemantics} from '../../packages/judge-adapter/src/semantic.mjs';
const rule={kind:'disjoint-closed-pairs',field:'calendar'};
test('disjoint closed calendar validates empty/point ranges and rejects overlap/contact/reordering',()=>{for(const calendar of [[],[[1,1]],[[1,2],[3,4]]])assert.equal(validateSemantics([rule],{calendar}),true);for(const calendar of [[[1,3],[3,4]],[[2,3],[1,1]],[[3,2]],[[1,2,3]]])assert.equal(validateSemantics([rule],{calendar}),false);});
