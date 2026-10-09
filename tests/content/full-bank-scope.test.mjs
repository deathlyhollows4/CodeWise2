import test from 'node:test';
import assert from 'node:assert/strict';
import {deliveryScope,validateDeliveryScope,fullBankFailures} from '../../scripts/delivery-scope.mjs';
const cardinalityFixture=()=>deliveryScope.topics.flatMap(([id,,quota])=>Array.from({length:quota},(_,i)=>({manifest:{id:`${id}-${i+1}`,primaryTopic:id}})));
test('full-bank cardinality gate requires amended243 and exact topic quotas',()=>{
 const authored=cardinalityFixture();assert.equal(authored.length,243);assert.deepEqual(fullBankFailures(authored),[]);
 assert.ok(fullBankFailures(authored.slice(1)).some(m=>m.includes('243')));
 assert.ok(fullBankFailures([...authored,authored[0]]).some(m=>m.includes('Duplicate')));
 const wrong=structuredClone(authored);wrong[0].manifest.primaryTopic='graphs';assert.ok(fullBankFailures(wrong).some(m=>m.includes('arrays-hashing')));assert.ok(fullBankFailures(wrong).some(m=>m.includes('graphs')));
});
test('delivery scope cannot silently lower the agreed target or duplicate topics',()=>{
 for(const mutate of [s=>s.questionTarget=242,s=>s.topics[1]=s.topics[0],s=>s.minimumHiddenCasesPerQuestion=199,s=>s.languages=['java','cpp','ruby']]){const scope=structuredClone(deliveryScope);mutate(scope);assert.throws(()=>validateDeliveryScope(scope),/Invalid amended/);}
});
