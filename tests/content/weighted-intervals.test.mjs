import test from 'node:test';import assert from 'node:assert/strict';
import {validateSemantics} from '../../packages/judge-adapter/src/semantic.mjs';
import {definitions} from '../../content/authoring/batches/intervals-weighted.mjs';
const rule={kind:'weighted-interval-rows',field:'segments'};
test('weighted range triples reject reversed/invalid rows and preserve signed zero-length endpoint semantics',()=>{for(const segments of [[],[[0,0,-7]],[[-1000000000,1000000000,1000000000]]])assert.equal(validateSemantics([rule],{segments}),true);for(const segments of [[[2,1,3]],[[0,1]],[[0,1,2,3]],[[0,1,0.5]],[[0,1,1000000001]],Array(50000).fill([0,1,1])])assert.equal(validateSemantics([rule],{segments}),false);});
test('same-coordinate signed event changes cannot create transient coverage maxima',()=>{const d=definitions[0];for(const input of [{segments:[[0,2,9],[2,4,9]]},{segments:[[0,4,8],[0,4,-8]]},{segments:[[0,0,1000000000]]}])assert.equal(d.oracle(input),d.independent(input));assert.equal(d.oracle({segments:[[0,2,9],[2,4,9]]}),9);assert.equal(d.oracle({segments:[[0,4,8],[0,4,-8]]}),0);});
