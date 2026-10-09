import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSemantics} from '../../packages/judge-adapter/src/semantic.mjs';
const rule={kind:'pair-ranges',field:'intervals',ordered:true,firstMin:-10,firstMax:10,secondMin:-10,secondMax:10};
test('ordered endpoint pairs allow point ranges and refuse reversed endpoints',()=>{assert.equal(validateSemantics([rule],{intervals:[[-10,-10],[-3,10]]}),true);assert.equal(validateSemantics([rule],{intervals:[[3,2]]}),false);assert.equal(validateSemantics([{...rule,ordered:'true'}],{intervals:[[1,2]]}),false);assert.equal(validateSemantics([{...rule,ordered:false}],{intervals:[[3,2]]}),true);});
