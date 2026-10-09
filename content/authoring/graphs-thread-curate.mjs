// User amendment: exactly 60 curated distinct hidden cases for graphs-01..13.
// This does not change the shared pack builder or the publication policy.
import assert from 'node:assert/strict';
import {checkOutput} from '../../packages/judge-adapter/src/checkers.mjs';
const accepts=(d,c,actual)=>d.localChecker?d.localChecker(c.input,actual):checkOutput(d.checker,c.expected,actual,{input:c.input});
import {inputKey,canonicalJson} from '../../packages/judge-adapter/src/canonical.mjs';
import {validateInput} from '../../packages/judge-adapter/src/schema-validator.mjs';
import {validateSemantics} from '../../packages/judge-adapter/src/semantic.mjs';
const shape=x=>Array.isArray(x)?`[${x.length}:${x.length?shape(x[0]):''}]`:typeof x==='string'?`str${x.length}`:typeof x==='object'?Object.entries(x).map(([k,v])=>`${k}:${shape(v)}`).join(';'):typeof x;
function features(c){const out=new Set([`category:${c.category}`,`shape:${shape(c.input)}`,`result:${typeof c.expected==='boolean'?c.expected:c.expected===0?'zero':c.expected>2147483647?'wide':c.expected<10?'small':'positive'}`]);
 for(const [field,value] of Object.entries(c.input)){
  if(typeof value==='number')out.add(`${field}:${value===0?'zero':value===1000?'max':value<10?'small':'middle'}`);
  if(typeof value==='string'){out.add(`${field}-empty:${value.length===0}`);out.add(`${field}-star:${value.includes('*')}`);out.add(`${field}-question:${value.includes('?')}`);out.add(`${field}-escaped:${/[\\\x00-\x1f]/.test(value)}`);}
  if(Array.isArray(value)){const flat=value.flat(Infinity);out.add(`${field}-zero:${flat.some(x=>x===0)}`);out.add(`${field}-wide:${flat.some(x=>x===1000000000||x===10000)}`);out.add(`${field}-repeated:${new Set(flat).size<flat.length}`);}
 }return out;
}
export function curateDefinition(d,boundaries=[]){
 assert(/^graphs-(0[1-9]|1[0-3])$/.test(d.id));const generate=d.generate;
 d.hiddenQuota=60;
 d.curation={policy:'user-authorized-exact-60',selection:'Retain every max stress, explicit boundary and detected mutation witness; then category/shape/value strata and deterministic feature novelty.',nativeExecution:'not-run'};
 d.generate=()=>{
  const semantic=d.semanticKey??(x=>inputKey(d.inputSchema,x));const seen=new Set(d.visible.map(c=>semantic(c.input))),canonicalSeen=new Set(d.visible.map(c=>inputKey(d.inputSchema,c.input))),pool=[];
  for(const c of [...boundaries,...generate()]){assert(validateInput(d.inputSchema,c.input));assert(validateSemantics(d.semanticConstraints??[],c.input));assert(!d.valid||d.valid(c.input));const k=semantic(c.input),canonical=inputKey(d.inputSchema,c.input);if(seen.has(k)||canonicalSeen.has(canonical))continue;seen.add(k);canonicalSeen.add(canonical);pool.push({...c,expected:d.oracle(c.input)});}
  const selected=[],indices=new Set(),covered=new Set();
  const take=i=>{if(i<0||indices.has(i))return;indices.add(i);selected.push(pool[i]);for(const f of features(pool[i]))covered.add(f);};
  for(let i=0;i<pool.length;i++)if(pool[i].category.startsWith('max-')||pool[i].category.startsWith('curated-boundary'))take(i);
  for(const mutation of Object.values(d.mutations))if(!d.visible.some(c=>!accepts(d,c,mutation(c.input))))take(pool.findIndex(c=>!accepts(d,c,mutation(c.input))));
  assert(selected.length<=60,'Mandatory coverage exceeds quota');
  while(selected.length<60){let best=-1,score=-1;for(let i=0;i<pool.length;i++)if(!indices.has(i)){const novelty=[...features(pool[i])].filter(f=>!covered.has(f)).length;if(novelty>score){score=novelty;best=i;}}assert(best>=0,d.id+': insufficient distinct candidates '+pool.length);take(best);}
  assert.equal(selected.length,60);return selected;
 };
}
