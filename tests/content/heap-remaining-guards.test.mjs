import test from 'node:test';import assert from 'node:assert/strict';
import {validateSemantics} from '../../packages/judge-adapter/src/semantic.mjs';
import {inputKey} from '../../packages/judge-adapter/src/canonical.mjs';
import {definitions as cover} from '../../content/authoring/batches/heap-cover.mjs';
import {definitions as skyline} from '../../content/authoring/batches/heap-skyline.mjs';
test('sorted timestamp feed guard supports ragged/empty feeds and rejects unsorted or invalid values',()=>{const r={kind:'sorted-rows',field:'feeds'};for(const feeds of [[[]],[[-2,-2,3],[]],[[0],[1,2,3]]])assert.equal(validateSemantics([r],{feeds}),true);for(const feeds of [[[2,1]],[[0.5]],[null],['wrong']])assert.equal(validateSemantics([r],{feeds}),false);});
test('skyline building guard enforces positive heights and strict bounded half-open spans',()=>{const r={kind:'skyline-building-rows',field:'buildings'};assert.equal(validateSemantics([r],{buildings:[[-1000000000,1000000000,1000000000]]}),true);for(const buildings of [[[2,2,1]],[[3,2,1]],[[0,2,0]],[[0,2,-1]],[[0,2,1,7]],[[0,2,1000000001]]])assert.equal(validateSemantics([r],{buildings}),false);});
test('feed/building canonical redundancy markers preserve actual inputs and meaningful timestamp geometry',()=>{const c=cover[0],a={feeds:[[0,2,2],[1,3],[0,2]]},b={feeds:[[1,3],[0,2]]};assert.equal(inputKey(c.inputSchema,a),inputKey(c.inputSchema,b));assert.deepEqual(a.feeds,[[0,2,2],[1,3],[0,2]]);const s=skyline[0];assert.equal(inputKey(s.inputSchema,{buildings:[[0,4,2],[0,4,2]]}),inputKey(s.inputSchema,{buildings:[[0,4,2]]}));});
