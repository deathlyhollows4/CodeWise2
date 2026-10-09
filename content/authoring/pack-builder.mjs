import {hiddenCaseRequirement} from '../../packages/contracts/src/hidden-case-requirement.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildFunctionHarness,buildFunctionStarters} from './harness.mjs';
import {validateInput} from '../../packages/judge-adapter/src/content.mjs';
import {canonicalJson,inputKey} from '../../packages/judge-adapter/src/canonical.mjs';
import {learningOverrides} from './learning-overrides.mjs';
import {buildStatefulHarness} from './stateful.mjs';
import {checkOutput} from '../../packages/judge-adapter/src/checkers.mjs';
const root=new URL('../problems/',import.meta.url);
export const hash=x=>createHash('sha256').update(typeof x==='string'?x:canonicalJson(x)).digest('hex');
export function seeded(seed=0xc02e){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};}
export function integerArrays({minLength=0,maxLength=8,count=260,min=-20,max=20,seed=0xc02e}={}){const random=seeded(seed),out=[];for(let i=0;i<count;i++){const length=minLength+random()%(maxLength-minLength+1);out.push({input:{values:Array.from({length},()=>min+random()%(max-min+1))},category:'seeded-small'});}return out;}
export function scalarCases(field,{min=0,max=10000,count=260,seed=0xc02e}={}){const random=seeded(seed);return Array.from({length:count},()=>({input:{[field]:min+random()%(max-min+1)},category:'seeded-integer'}));}
export const integer={kind:'integer',minimum:-1000000000,maximum:1000000000};
export const arraySchema=(maxLength=100000,minLength=0)=>({kind:'object',properties:{values:{kind:'array',minLength,maxLength,items:integer}}});
export function logicalCases(def){const visible=new Set(def.visible.map(c=>inputKey(def.inputSchema,c.input)));const unique=new Map();for(const c of def.generate()){if(!validateInput(def.inputSchema,c.input)||def.valid&&!def.valid(c.input))throw new Error(def.id+': invalid generated case');const key=inputKey(def.inputSchema,c.input);if(visible.has(key)||unique.has(key))continue;const expected=def.oracle(c.input);if(Object.hasOwn(c,'expected')&&canonicalJson(c.expected)!==canonicalJson(expected))throw new Error(def.id+': imported expected value disagrees with oracle');unique.set(key,{...c,id:`hidden-${unique.size+1}`,expected,inputHash:hash(key)});}const requirement=hiddenCaseRequirement(def.id);if(unique.size<requirement.minimum||requirement.exact!==null&&unique.size!==requirement.exact)throw new Error(def.id+': hidden suite violates scoped '+(requirement.exact===null?'minimum '+requirement.minimum:'exact '+requirement.exact)+' case requirement; curate cases explicitly, never trim blindly');return [...unique.values()];}
export async function materializePack(def){
 if(!/^[a-z0-9-]+$/.test(def.id)||def.visible.length!==3)throw new Error('Invalid pack definition');
 const packRoot=new URL(def.id+'/',root);await mkdir(new URL('private/',packRoot),{recursive:true});
 const write=async(path,value)=>writeFile(new URL(path,packRoot),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');
 const wrappers=def.stateful?buildStatefulHarness(def.stateful):buildFunctionHarness(def.function),starters=def.function?buildFunctionStarters(def.function):null;const languageFiles={};
 for(const language of ['java','cpp','python']){const ext={java:'java',cpp:'cpp',python:'py'}[language];const dir=`languages/${language}/`;await mkdir(new URL(dir,packRoot),{recursive:true});languageFiles[language]={};for(const kind of ['starter','wrapper','reference']){const path=dir+kind+'.'+ext;languageFiles[language][kind]=path;let text=kind==='wrapper'?wrappers[language]:def.languages[language][kind];if(kind==='starter'&&starters&&typeof text==='string'&&!text.includes('\n'))text=starters[language];if(typeof text!=='string'||!text.length)throw new Error(def.id+': incomplete '+language+' '+kind);await write(path,text);}}
 const hidden=logicalCases(def);const suiteText=hidden.map(c=>JSON.stringify(c)).join('\n')+'\n';const suiteHash=hash(suiteText);
 const manifest={schemaVersion:1,id:def.id,version:def.version??'1.0.0',slug:def.slug,title:def.title,primaryTopic:def.primaryTopic,skillIds:def.skillIds,prerequisites:def.prerequisites??[],step:def.step,status:'draft',objective:def.objective,constraints:def.constraints,interface:def.interface,inputSchema:def.inputSchema,outputSchema:def.outputSchema,checker:def.checker??{kind:'exact'},harness:{encoding:'json-lines-v1'},languageFiles,sourceIds:['codewise2-original'],checkpointIds:def.checkpointIds??[],remedialIds:def.remedialIds??[],nextIds:def.nextIds??[],rationale:def.rationale,commonMistakes:Object.keys(def.mutations),limits:{cpuSeconds:5,wallSeconds:15,memoryKb:262144,processes:64,outputBytes:4194304,fileKb:4096,inputBytes:8388608}};
 for(const c of def.visible){const independent=def.independent(c.input),checker=def.checker??{kind:'exact'};if(!validateInput(def.inputSchema,c.input)||def.valid&&!def.valid(c.input)||!checkOutput(checker,c.expected,independent,{input:c.input})||!checkOutput(checker,independent,c.expected,{input:c.input}))throw new Error(def.id+': invalid visible example');}
 manifest.semanticConstraints=def.semanticConstraints??[];
 manifest.sourceIds=def.sourceIds??['codewise2-original'];
 Object.assign(manifest,learningOverrides[def.id]??{});
 await write('problem.json',manifest);await write('statement.md',def.statement+'\n');await write('visible-cases.json',def.visible.map((c,i)=>({id:`visible-${i+1}`,...c})));await write('private/hidden-cases.jsonl',suiteText);
 await write('private/suite-manifest.json',{schemaVersion:1,generator:def.generatorModule,generatorVersion:'1.0.0',seed:def.seed??'0xC02E',hiddenCount:hidden.length,suiteHash,categories:[...new Set(hidden.map(c=>c.category))],oracleStatus:'pending-trusted-audit',referenceStatus:'not-run'});
 await write('provenance.json',def.provenance??{origin:'original',author:'CodeWise2 development worker',reviewDate:'2026-10-08',reviewerType:'automated-author',rightsStatus:'original-no-imported-assets',assets:Object.fromEntries(['statement','examples','tests','references','explanation'].map(k=>[k,{origin:'original',sourceId:'codewise2-original',license:'project-owned'}])),independentReview:'pending'});
 await write('validation.json',{schemaVersion:1,version:manifest.version,suiteHash,status:'pending',languages:Object.fromEntries(['java','cpp','python'].map(l=>[l,{status:'not-run',reason:'pending-isolated-reference-validation'}])),independentReview:'pending'});
 return {id:def.id,hidden:hidden.length};
}
