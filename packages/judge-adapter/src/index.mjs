import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {getPrivatePack,encodeCases,validateInput,validatePackInput,validationIdentity} from './content.mjs';
import {checkOutput} from './checkers.mjs';
export {loadCatalogue,getPrivatePack,getPublicProblem,getPublicLearningMetadata,getVerifiedReference,captureExecutionIdentity} from './content.mjs';
export {checkOutput} from './checkers.mjs';
const LANGUAGES=['java','cpp','python'];
export async function consumePhaseStream(response,language,onPhase){
 if(!response.ok||!response.headers.get('content-type')?.startsWith('application/x-ndjson')||!response.body)throw Error('Runner phase protocol unavailable');
 const reader=response.body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});let buffer='',bytes=0,stage=0,result;
 const record=async line=>{
  if(!line.trim())return;const event=JSON.parse(line);
  if(!event||typeof event!=='object'||Array.isArray(event)||Object.keys(event).length!==2||result!==undefined)throw Error('Invalid runner phase record');
  if(event.type==='phase'){
   if(event.phase==='compiling'&&language!=='python'&&stage===0)stage=1;
   else if(event.phase==='running'&&stage===(language==='python'?0:1))stage=2;
   else throw Error('Invalid runner phase transition');
   await onPhase(event.phase);
  }else if(event.type==='result'&&event.result&&['executed','compile_error','runtime_error','time_limit','memory_limit','output_limit','canceled','infrastructure_error'].includes(event.result.status)){
   if(event.result.status==='compile_error'&&(language==='python'||stage!==1))throw Error('Compile result lacks its actual compiler transition');
   if(['executed','runtime_error','memory_limit','output_limit'].includes(event.result.status)&&stage!==2)throw Error('Execution result lacks an actual running transition');result=event.result;
  }else throw Error('Invalid runner phase record');
 };
 try{
  while(true){const next=await reader.read();if(next.done)break;bytes+=next.value.byteLength;if(bytes>6000000)throw Error('Runner response too large');buffer+=decoder.decode(next.value,{stream:true});let end;while((end=buffer.indexOf('\n'))>=0){await record(buffer.slice(0,end));buffer=buffer.slice(end+1);}}
  buffer+=decoder.decode();if(buffer.trim())await record(buffer);if(result===undefined)throw Error('Missing runner result');return result;
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
function safeRuntime(raw){if(!raw)return undefined;const identity=raw.identity??{};return Object.fromEntries(Object.entries({identityHash:raw.identityHash,startIdentityHash:raw.startIdentityHash,bootId:identity.bootId,architecture:identity.architecture,languages:identity.languages,isolateRevision:identity.isolateRevision,cpuSeconds:raw.meta?.time,wallSeconds:raw.meta?.['time-wall'],memoryKb:raw.meta?.['max-rss'],phase:raw.phase}).filter(([,value])=>value!==undefined));}
export class JudgeAdapter {
 constructor({endpoint=process.env.CODEWISE_RUNNER_URL??'http://127.0.0.1:2358',token=process.env.CODEWISE_RUNNER_TOKEN,tokenFile=process.env.CODEWISE_RUNNER_TOKEN_FILE,fetchImpl=fetch}={}){
  const u=new URL(endpoint);if(u.protocol!=='http:'||!['127.0.0.1','[::1]'].includes(u.hostname)||u.username||u.password||u.search||u.hash||u.pathname!=='/')throw new Error('Runner endpoint must be fixed loopback HTTP');
  this.endpoint=u.origin;this.token=token;this.tokenFile=tokenFile;this.fetch=fetchImpl;
 }
 async headers(){const token=this.token??(this.tokenFile?(await readFile(this.tokenFile,'utf8')).trim():undefined);if(!token||token.length<32)throw new Error('Runner authentication not configured');return {'Authorization':`Bearer ${token}`,'Content-Type':'application/json'};}
 async request(path,init={}){const response=await this.fetch(this.endpoint+path,{...init,headers:await this.headers(),redirect:'error',signal:init.signal??AbortSignal.timeout(3000)});if(!response.ok)throw new Error(`Runner request failed (${response.status})`);const text=await response.text();if(Buffer.byteLength(text)>6000000)throw new Error('Runner response too large');return JSON.parse(text);}
 async readiness(){try{const h=await this.request('/health');const validIdentity=typeof h.identityHash==='string'&&/^[a-f0-9]{64}$/.test(h.identityHash);const ready=h.ready===true&&h.controlsVerified===true&&validIdentity&&LANGUAGES.every(l=>h.languages?.some(x=>x.id===l&&typeof x.version==='string'));return {ready,controlsVerified:ready,phaseEventsSupported:h.phaseEventsSupported===true,message:ready?'Isolated runner ready':!validIdentity?'Runner execution identity unavailable':h.message??'Runner validation required',languages:h.languages??[],...(validIdentity?{identityHash:h.identityHash}:{})};}catch{return {ready:false,controlsVerified:false,phaseEventsSupported:false,message:'Isolated runner unavailable. Set up the dedicated CodeWise2Runner Linux environment; editing remains available.',languages:[]};}}
 async execute({language,source,stdin,limits,signal,verification=false,onPhase}){
  if(!LANGUAGES.includes(language))throw new Error('Unsupported language');if(typeof source!=='string'||Buffer.byteLength(source)>200000||typeof stdin!=='string'||Buffer.byteLength(stdin)>8388608)throw new Error('Execution request exceeds limits');
  if(signal?.aborted)return {status:'canceled',diagnostics:'Canceled before runner execution'};
  const jobId=randomUUID();let cancellation;
  const cancel=()=>{cancellation=this.request('/cancel',{method:'POST',body:JSON.stringify({jobId}),signal:AbortSignal.timeout(7000)}).catch(()=>({cleanupComplete:false}));};
  signal?.addEventListener('abort',cancel,{once:true});
  try{const init={method:'POST',body:JSON.stringify({jobId,language,source,stdin,limits,...(verification?{verification:true}:{}),...(onPhase?{phaseStream:true}:{})}),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(70000)]):AbortSignal.timeout(70000)};if(onPhase){if(typeof onPhase!=='function')throw Error('Invalid phase callback');const response=await this.fetch(this.endpoint+'/execute',{...init,headers:await this.headers(),redirect:'error'});return await consumePhaseStream(response,language,onPhase);}return await this.request('/execute',init);}catch(e){if(signal?.aborted){const ack=cancellation?await cancellation:{cleanupComplete:false};return {status:'canceled',diagnostics:ack.cleanupComplete?'Isolated task canceled and workspace cleaned.':'Cancellation requested; cleanup remains bounded by the runner deadline.'};}return {status:'infrastructure_error',diagnostics:'Runner connection failed; no learning outcome recorded.'};}finally{signal?.removeEventListener('abort',cancel);}
 }
}
export async function readiness(){return new JudgeAdapter().readiness();}
export async function validateCustomInput(problemId,input){const p=await getPrivatePack(problemId);return validatePackInput(p,input);}
export async function judgePack({problemId,language,code,mode='submit',customInput,signal,adapter=new JudgeAdapter(),verification=false,privatePack,expectedIdentity,onPhase}){
 const pack=structuredClone(privatePack??await getPrivatePack(problemId));
 if(pack.manifest.id!==problemId)throw new Error('Trusted pack snapshot identity mismatch');
 const phases=mode==='submit'?[{name:'visible',cases:pack.visibleCases,public:true},{name:'hidden',cases:pack.hiddenCases,public:false}]:[{name:mode,cases:mode==='custom'?[{id:'custom',input:customInput}]:pack.visibleCases,public:true}];
 const total=phases.reduce((n,p)=>n+p.cases.length,0),counts={total,executed:0,passed:0,failed:0,notRun:total,...(mode==='custom'?{unverified:0}:{})};
 if(!LANGUAGES.includes(language)||!['run','submit','custom'].includes(mode)||typeof code!=='string'||Buffer.byteLength(code)>100000)throw new Error('Invalid judge request');
 if(expectedIdentity!==undefined&&(typeof expectedIdentity!=='string'||!/^[a-f0-9]{64}$/.test(expectedIdentity)||expectedIdentity!==await validationIdentity(pack,language)))return {status:'infrastructure_error',counts,diagnostics:'Trusted content changed after this job was queued. No code executed.'};
 if(mode==='custom'&&!validatePackInput(pack,customInput))throw new Error('Custom input violates constraints');
 const health=verification?null:await adapter.readiness();
 if(!verification && !health.ready)return {status:'infrastructure_error',counts,diagnostics:'Isolated runner not ready. Your code has been preserved.'};
 const wrapper=pack.languages[language].wrapper;if(wrapper.split('{{USER_CODE}}').length!==2)throw new Error('Invalid language wrapper');const source=wrapper.replace('{{USER_CODE}}',()=>code);
 const visible=[],runtimePhases=[];
 for(const phase of phases){
  if(signal?.aborted)return {status:'canceled',counts,diagnostics:'Canceled before the next isolated phase.',cases:visible,runtime:{phases:runtimePhases}};
  // Public example execution receives no future hidden input. Hidden execution
  // gets its own fresh isolated workspace and never supplies public result data.
  const raw=await adapter.execute({language,source,stdin:encodeCases(pack,phase.cases),limits:pack.manifest.limits,signal,verification,onPhase});runtimePhases.push({name:phase.name,...safeRuntime(raw.runtime)});
  const transportFailure=['canceled','infrastructure_error'].includes(raw.status)&&!raw.runtime;
  if(health?.identityHash&&!transportFailure&&(raw.runtime?.identityHash!==health.identityHash||raw.runtime?.startIdentityHash!==health.identityHash))return {status:'infrastructure_error',counts,diagnostics:'Runner identity changed or execution identity was unavailable. No acceptance recorded.',cases:visible,runtime:{phases:runtimePhases}};
  const stdout=String(raw.stdout??'');const lines=raw.status==='executed'?(stdout.trim()?stdout.trim().split('\n'):[]):stdout.split('\n').slice(0,-1);
  let malformed=raw.status==='executed'&&lines.length!==phase.cases.length;
  for(let i=0;i<Math.min(lines.length,phase.cases.length);i++){
   let actual;try{actual=JSON.parse(lines[i]);if(!validateInput(pack.manifest.outputSchema,actual))throw new Error();}catch{malformed=true;counts.executed++;counts.failed++;continue;}
   counts.executed++;const c=phase.cases[i],passed=mode==='custom'?false:checkOutput(pack.manifest.checker,c.expected,actual,{input:c.input});if(mode!=='custom'){passed?counts.passed++:counts.failed++;}else counts.unverified++;
   if(phase.public)visible.push({id:c.id,input:c.input,...(mode!=='custom'?{expected:c.expected}:{}),actual,passed});
  }
  counts.notRun=counts.total-counts.executed;
  if(raw.status!=='executed')return {status:raw.status,counts,diagnostics:!phase.public&&!['compile_error','infrastructure_error','canceled'].includes(raw.status)?'Hidden execution stopped. Complete earlier results were counted; hidden output remains private.':String(raw.diagnostics??'').slice(0,16000),cases:visible,runtime:{phases:runtimePhases}};
  if(malformed||counts.failed)return {status:mode==='custom'?'runtime_error':'wrong_answer',counts,diagnostics:malformed?'Expected exactly one valid structured result per case.':'Output differs from the required result.',cases:visible,runtime:{phases:runtimePhases}};
 }
 return {status:mode==='custom'?'executed':'accepted',counts,diagnostics:mode==='custom'?'Custom input executed; no trusted expected result supplied.':'All selected cases passed.',cases:visible,runtime:{phases:runtimePhases}};
}
