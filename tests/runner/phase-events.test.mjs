import test from 'node:test';
import assert from 'node:assert/strict';
import {consumePhaseStream,JudgeAdapter} from '../../packages/judge-adapter/src/index.mjs';
const response=events=>new Response(events.map(e=>JSON.stringify(e)).join('\n')+'\n',{headers:{'content-type':'application/x-ndjson'}});
test('C++/Java phase events precede results; Python reports only its actual run phase',async()=>{
 for(const language of ['cpp','java','python']){const expected=language==='python'?['running']:['compiling','running'],observed=[];const raw=await consumePhaseStream(response([...expected.map(phase=>({type:'phase',phase})),{type:'result',result:{status:'executed',stdout:'1\n'}}]),language,p=>observed.push(p));assert.deepEqual(observed,expected);assert.equal(raw.status,'executed');}
});
test('compile failure emits no invented running phase',async()=>{
 const observed=[];const raw=await consumePhaseStream(response([{type:'phase',phase:'compiling'},{type:'result',result:{status:'compile_error'}}]),'cpp',p=>observed.push(p));assert.deepEqual(observed,['compiling']);assert.equal(raw.status,'compile_error');
});
test('terminal error status must agree with the actually observed language stage',async()=>{
 for(const [language,events] of [['python',[{type:'result',result:{status:'compile_error'}}]],['python',[{type:'phase',phase:'running'},{type:'result',result:{status:'compile_error'}}]],['java',[{type:'phase',phase:'compiling'},{type:'phase',phase:'running'},{type:'result',result:{status:'compile_error'}}]],...['runtime_error','memory_limit','output_limit'].map(status=>['java',[{type:'phase',phase:'compiling'},{type:'result',result:{status}}]])])await assert.rejects(()=>consumePhaseStream(response(events),language,()=>{}));
 for(const status of ['time_limit','canceled','infrastructure_error'])assert.equal((await consumePhaseStream(response([{type:'result',result:{status}}]),'java',()=>{})).status,status);
});
test('phase parser rejects malformed order, duplicate results and missing transitions',async()=>{
 for(const events of [[{type:'phase',phase:'running'},{type:'result',result:{status:'executed'}}],[{type:'phase',phase:'compiling'},{type:'phase',phase:'compiling'}],[{type:'result',result:{status:'executed'}}],[{type:'result',result:{status:'infrastructure_error'}},{type:'result',result:{status:'infrastructure_error'}}]])await assert.rejects(()=>consumePhaseStream(response(events),'java',()=>{}));
 await assert.rejects(()=>consumePhaseStream(new Response(' '.repeat(6000001),{headers:{'content-type':'application/x-ndjson'}}),'python',()=>{}),/too large/);
});
test('phase callback runs while the response is still open rather than after final completion',async()=>{
 let release,observe;const observed=new Promise(resolve=>observe=resolve),encoder=new TextEncoder();
 const body=new ReadableStream({start(controller){controller.enqueue(encoder.encode('{"type":"phase","phase":"compiling"}\n'));release=()=>{controller.enqueue(encoder.encode('{"type":"phase","phase":"running"}\n{"type":"result","result":{"status":"executed"}}\n'));controller.close();};}});
 const pending=consumePhaseStream(new Response(body,{headers:{'content-type':'application/x-ndjson'}}),'java',phase=>{if(phase==='compiling')observe();});await observed;release();assert.equal((await pending).status,'executed');
});
test('adapter requests phase protocol only when a caller supplies a phase observer',async()=>{
 const payloads=[],observed=[];const adapter=new JudgeAdapter({token:'x'.repeat(32),fetchImpl:async(url,init)=>{payloads.push(JSON.parse(init.body));return response([{type:'phase',phase:'running'},{type:'result',result:{status:'executed',stdout:'1\n'}}]);}});
 const raw=await adapter.execute({language:'python',source:'benign fixture',stdin:'',limits:{},onPhase:p=>observed.push(p)});assert.equal(raw.status,'executed');assert.equal(payloads[0].phaseStream,true);assert.deepEqual(observed,['running']);
});
