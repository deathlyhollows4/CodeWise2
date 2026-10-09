import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validatePackInput} from '../packages/judge-adapter/src/content.mjs';
import {validateInput} from '../packages/judge-adapter/src/schema-validator.mjs';
const nodeLimit=200000,transportLimit=4*1024*1024;
function nodes(x){return 1+(Array.isArray(x)?x.reduce((n,v)=>n+nodes(v),0):x&&typeof x==='object'?Object.values(x).reduce((n,v)=>n+nodes(v),0):0);}
function upper(s){if(s.kind==='object')return 1+Object.values(s.properties).reduce((n,v)=>n+upper(v),0);if(s.kind==='array')return 1+s.maxLength*upper(s.items);return 1;}
function byteUpper(s){if(s.kind==='object')return 2+Object.entries(s.properties).reduce((n,[key,value])=>n+Buffer.byteLength(JSON.stringify(key))+1+byteUpper(value)+1,0);if(s.kind==='array')return 2+s.maxLength*(byteUpper(s.items)+1);if(s.kind==='string')return 2+6*s.maxLength;if(s.kind==='boolean')return 5;return 17;}
function lengths(x,prefix='',out={}){if(Array.isArray(x)||typeof x==='string')out[prefix]=x.length;if(x&&typeof x==='object')for(const [k,v] of Object.entries(x))if(!Array.isArray(x))lengths(v,prefix?`${prefix}.${k}`:k,out);return out;}
const rows=[];
for(const [topic,total] of [['binary-search',14],['dp-1d',24],['greedy',8]])for(let number=1;number<=total;number++){
 const id=`${topic}-${String(number).padStart(2,'0')}`,base=`content/problems/${id}`,raw=readFileSync(`${base}/problem.json`),manifest=JSON.parse(raw),hidden=readFileSync(`${base}/private/hidden-cases.jsonl`,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse),visible=JSON.parse(readFileSync(`${base}/visible-cases.json`)),cases=[...visible,...hidden];
 let bound=upper(manifest.inputSchema),boundExplanation='Schema maximum; each JSON primitive and container counts as one node.';
 // Both fields are scalar arrays; the explicit combined-length predicate is part of the legal input contract.
 if(id==='binary-search-13'){bound=1+2+100000;boundExplanation='Explicit combined-length maximum100000 across two scalar arrays, plus object and two array containers.';}
 const maxima={},valid=cases.every(c=>{for(const [key,length] of Object.entries(lengths(c.input)))maxima[key]=Math.max(maxima[key]??0,length);return validatePackInput({manifest},c.input)&&validateInput(manifest.outputSchema,c.expected);});
 rows.push({id,manifestSha256:createHash('sha256').update(raw).digest('hex'),legalInputNodeUpperBound:bound,outputNodeUpperBound:upper(manifest.outputSchema),legalInputJsonByteUpperBound:byteUpper(manifest.inputSchema),legalOutputJsonByteUpperBound:byteUpper(manifest.outputSchema),boundExplanation,maximumTestedInputNodes:Math.max(...cases.map(c=>nodes(c.input))),maximumTestedInputBytes:Math.max(...cases.map(c=>Buffer.byteLength(JSON.stringify(c.input)))),maximumTestedOutputBytes:Math.max(...cases.map(c=>Buffer.byteLength(JSON.stringify(c.expected)))),testedLengths:maxima,allStoredCasesValidate:valid,inputNodeCapCompatible:bound<=nodeLimit,outputNodeCapCompatible:upper(manifest.outputSchema)<=nodeLimit});
}
const passed=rows.every(r=>r.allStoredCasesValidate&&r.inputNodeCapCompatible&&r.outputNodeCapCompatible&&r.legalInputJsonByteUpperBound<transportLimit&&r.legalOutputJsonByteUpperBound<transportLimit);
const report={schemaVersion:1,command:'node scripts/audit-owned-domain-bounds.mjs',timestamp:new Date().toISOString(),runtime:process.version,platform:`${process.platform}-${process.arch}`,passed,nodeLimit,transportLimit,scope:'46 already authored owned Binary01-14, DP1D01-24 and Greedy01-08; read-only stored input/output validation and legal JSON node ceiling, not native execution or exhaustive numeric/algorithm proof',rows};
writeFileSync('docs/release-evidence/owned-domain-bounds.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({passed,packs:rows.length,maximumLegalNodes:Math.max(...rows.map(r=>r.legalInputNodeUpperBound)),report:'docs/release-evidence/owned-domain-bounds.json'}));
if(!passed)process.exitCode=1;
