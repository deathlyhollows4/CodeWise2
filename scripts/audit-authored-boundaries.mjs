// Trusted authoring preflight only; never runs submitted/native reference code.
import {writeFile,readFile} from 'node:fs/promises';
import {definitions} from '../content/authoring/registry.mjs';
import {getPrivatePack,validateInput,encodeCases,sha256} from '../packages/judge-adapter/src/content.mjs';
import {inputKey} from '../packages/judge-adapter/src/canonical.mjs';
import {checkOutput} from '../packages/judge-adapter/src/checkers.mjs';
import {hiddenCaseRequirement} from '../packages/contracts/src/hidden-case-requirement.mjs';
const argument=process.argv.find(a=>a.startsWith('--ids='));if(!argument)throw Error('Explicit authoring IDs required');
const ids=argument.slice(6).split(',');if(new Set(ids).size!==ids.length||ids.some(id=>!/^[a-z0-9-]+$/.test(id)))throw Error('Invalid selected authoring IDs');
const nodes=value=>1+(Array.isArray(value)?value.reduce((n,v)=>n+nodes(v),0):value&&typeof value==='object'?Object.values(value).reduce((n,v)=>n+nodes(v),0):0);
const dimensions=input=>Object.fromEntries(Object.entries(input).filter(([,v])=>Array.isArray(v)).map(([field,v])=>[field,{length:v.length,maxStringLength:Math.max(0,...v.filter(x=>typeof x==='string').map(s=>s.length))}]));
const report={schemaVersion:1,scope:'trusted-retained-boundary-preflight',command:['node','scripts/audit-authored-boundaries.mjs',...process.argv.slice(2)].join(' '),generatedAt:new Date().toISOString(),nativeExecution:'not-run',packs:[],failures:[]};
for(const id of ids){
 const def=definitions.find(d=>d.id===id);if(!def)throw Error('Unknown authoring ID');const pack=await getPrivatePack(id),schema=def.inputSchema??{...pack.manifest.inputSchema,unordered:true,...(id==='arrays-hashing-02'?{deduplicate:true}:{})},output=def.outputSchema??pack.manifest.outputSchema;
 const hidden=def.generateCases(),visible=pack.visibleCases,keys=new Set(),errors=[];let maxOutputNodes=0;
 for(const c of [...visible,...hidden]){const key=inputKey(schema,c.input);if(keys.has(key))errors.push('Duplicate semantic input');keys.add(key);if(!validateInput(schema,c.input)||!validateInput(output,c.expected))errors.push('Input/output budget or schema rejected');const independently=def.independent(c.input);if(!checkOutput(pack.manifest.checker,c.expected,independently,{input:c.input})||!checkOutput(pack.manifest.checker,independently,c.expected,{input:c.input}))errors.push('Independent oracle mismatch');maxOutputNodes=Math.max(maxOutputNodes,nodes(c.expected));}
 const retained=hidden.filter(c=>/max|performance|wide|long-scan|large|upper-bound/.test(c.category)||Object.values(c.input).some(v=>Array.isArray(v)&&v.length>=1000)).map(c=>({id:c.id,category:c.category,dimensions:dimensions(c.input)}));
 const wire=[];for(const [name,cases] of [['visible',visible],['hidden',hidden]]){const stdout=cases.map(c=>JSON.stringify(c.expected)).join('\n')+'\n',stdin=encodeCases({...pack,manifest:{...pack.manifest,inputSchema:schema}},cases),outputBytes=Buffer.byteLength(stdout),inputBytes=Buffer.byteLength(stdin),responseUpperBytes=Buffer.byteLength(JSON.stringify(stdout))+16384*6+65536+2048,requestUpperBytes=Buffer.byteLength(JSON.stringify(stdin))+200000*6+2048;wire.push({name,inputBytes,outputBytes,responseUpperBytes,requestUpperBytes});if(inputBytes>pack.manifest.limits.inputBytes||outputBytes>pack.manifest.limits.outputBytes||responseUpperBytes>6000000||requestUpperBytes>10000000)errors.push('Aggregate transport/output budget exceeded');}
 const requirement=hiddenCaseRequirement(id);if(hidden.length<requirement.minimum||requirement.exact!==null&&hidden.length!==requirement.exact)errors.push('Canonical hidden count violates per-ID scope');
 const sourcePath=def.generatorModule??'content/authoring/slice.mjs',entry={id,sourcePath,sourceHash:sha256(await readFile(sourcePath)),hiddenUnique:hidden.length,oracleChecks:hidden.length+3,maxOutputNodes,retainedStress:retained,wire,errors};report.packs.push(entry);report.failures.push(...errors.map(error=>id+': '+error));
}
report.passed=report.failures.length===0;await writeFile('docs/release-evidence/authored-boundary-preflight.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,packs:report.packs.length,failures:report.failures}));process.exitCode=report.passed?0:1;
