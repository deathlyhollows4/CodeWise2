import {validateInput} from './schema-validator.mjs';
export {validateInput} from './schema-validator.mjs';
import {readFile,readdir} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {assertPackStructure,assertPublicationReviews} from './pack-validation.mjs';
import {currentLearningMetadata,LearningMetadataError} from './learning-metadata.mjs';
import {validateSemantics} from './semantic.mjs';
import {canonicalJson} from './canonical.mjs';
import {hiddenCaseRequirement} from '../../contracts/src/hidden-case-requirement.mjs';
export const contentRoot=fileURLToPath(new URL('../../../content/',import.meta.url));
export const sha256=v=>createHash('sha256').update(v).digest('hex');
// Match imported checker implementation lifetime, rather than later filesystem edits.
const checkerSource=await readFile(new URL('./checkers.mjs',import.meta.url),'utf8');
const customCheckerSource=await readFile(new URL('./custom-checkers.mjs',import.meta.url),'utf8');
export async function validationIdentity(pack,language){const {status,...contract}=pack.manifest;const checkerCode=checkerSource+(pack.manifest.checker.kind==='custom'?customCheckerSource:'');return sha256(JSON.stringify({contract,statement:pack.statement,visible:pack.visibleCases,suiteHash:pack.suite.suiteHash,reference:pack.languages[language].reference,wrapper:pack.languages[language].wrapper,starter:pack.languages[language].starter,checkerCode}));}
export async function captureExecutionIdentity({problemId,language,expectedPublicSnapshot}){
 if(!['java','cpp','python'].includes(language)||!expectedPublicSnapshot)throw Error('Trusted problem snapshot and language required');
 const pack=await getPrivatePack(problemId);
 if(canonicalJson(publicProblem(pack))!==canonicalJson(expectedPublicSnapshot))throw Error('Trusted problem snapshot changed');
 return {identity:await validationIdentity(pack,language),version:pack.manifest.version};
}
export async function referenceReceiptMatches(pack,language,receipt){
 if(!['java','cpp','python'].includes(language))return false;
 const identity=await validationIdentity(pack,language),total=pack.visibleCases.length+pack.hiddenCases.length,current=pack.validation.languages[language],result=receipt?.result,counts=result?.counts,phases=result?.runtime?.phases;
 return receipt?.id===pack.manifest.id&&receipt.version===pack.manifest.version&&receipt.language===language&&receipt.validationIdentity===identity&&receipt.suiteHash===pack.suite.suiteHash&&/^[a-f0-9]{64}$/.test(receipt.runtimeIdentity??'')&&typeof receipt.executedAt==='string'&&Number.isFinite(Date.parse(receipt.executedAt))&&current?.status==='passed'&&current.validationIdentity===identity&&current.executed===total&&current.passed===total&&current.runtimeIdentity===receipt.runtimeIdentity&&result?.status==='accepted'&&counts?.total===total&&counts.executed===total&&counts.passed===total&&counts.failed===0&&counts.notRun===0&&(counts.unverified??0)===0&&Array.isArray(phases)&&phases.length===2&&phases.every(p=>p.identityHash===receipt.runtimeIdentity&&p.startIdentityHash===receipt.runtimeIdentity&&typeof p.bootId==='string'&&p.bootId.length>0&&p.bootId===phases[0].bootId);
}
// Server-only evidence accessor. It never dispatches code or asserts current runner health.
export async function getVerifiedReference(problemId,language,{expectedPublicSnapshot}={}){
 if(!['java','cpp','python'].includes(language))return {available:false,reason:'unsupported-language'};
 try{
  const pack=await getPrivatePack(problemId),evidenceRoot=fileURLToPath(new URL('../../../docs/release-evidence/',import.meta.url));
  if(expectedPublicSnapshot!==undefined&&canonicalJson(publicProblem(pack))!==canonicalJson(expectedPublicSnapshot))return {available:false,reason:'public-snapshot-changed'};
  const receipt=await readJson(safePath(evidenceRoot,`validation-${pack.manifest.id}-${language}.json`));
  if(!await referenceReceiptMatches(pack,language,receipt))return {available:false,reason:'current-reference-not-verified'};
  return {available:true,code:pack.languages[language].reference,language,version:pack.manifest.version,validationIdentity:receipt.validationIdentity,verifiedAt:receipt.executedAt,runtimeIdentity:receipt.runtimeIdentity};
 }catch{return {available:false,reason:'current-reference-not-verified'};}
}
export async function readJson(path){return JSON.parse(await readFile(path,'utf8'));}
export function safePath(root,relative){if(typeof relative!=='string'||relative.includes('\\')||relative.includes('\0'))throw new Error('Invalid content path');const p=resolve(root,relative);if(!p.startsWith(resolve(root)+sep))throw new Error('Unsafe content path');return p;}
export async function getPrivatePack(id){
 if(!/^[a-z0-9-]+$/.test(id))throw new Error('Invalid problem id');
 const root=safePath(contentRoot,'problems/'+id),manifest=await readJson(safePath(root,'problem.json'));
 if(manifest.id!==id||manifest.schemaVersion!==1)throw new Error('Invalid pack identity');
 const statement=await readFile(safePath(root,'statement.md'),'utf8');const visibleCases=await readJson(safePath(root,'visible-cases.json'));
 const suiteText=await readFile(safePath(root,'private/hidden-cases.jsonl'),'utf8');
 const hiddenCases=suiteText.trim().split('\n').filter(Boolean).map(x=>JSON.parse(x));const suite=await readJson(safePath(root,'private/suite-manifest.json'));
 if(suite.suiteHash!==sha256(suiteText))throw new Error('Suite hash mismatch');
 const validation=await readJson(safePath(root,'validation.json'));const provenance=await readJson(safePath(root,'provenance.json'));
 const languages={};for(const lang of ['java','cpp','python']){const files=manifest.languageFiles?.[lang];if(!files)throw new Error('Language files missing');languages[lang]={};for(const kind of ['starter','wrapper','reference'])languages[lang][kind]=await readFile(safePath(root,files[kind]),'utf8');}
 const hiddenRequirement=hiddenCaseRequirement(id);
 if(visibleCases.length!==3||hiddenCases.length<hiddenRequirement.minimum||hiddenRequirement.exact!==null&&hiddenCases.length!==hiddenRequirement.exact)throw new Error('Scoped case count requirement failed');
 const pack={root,manifest,statement,visibleCases,hiddenCases,suite,validation,provenance,languages};
 assertPackStructure(pack);
 for(const c of [...visibleCases,...hiddenCases])if(!validatePackInput(pack,c.input)||!validateInput(manifest.outputSchema,c.expected))throw new Error('Case schema/semantic validation failed');
 if(manifest.status==='published'){
  if(validation.suiteHash!==suite.suiteHash||validation.independentReview!=='passed')throw new Error('Publication gates failed');
  for(const l of ['java','cpp','python']){const v=validation.languages?.[l];if(v?.status!=='passed'||v.validationIdentity!==await validationIdentity(pack,l)||v.executed!==hiddenCases.length+visibleCases.length||v.passed!==v.executed||!v.runtimeIdentity)throw new Error('Language publication gate failed');}
  await assertPublicationReviews(pack,root);
  pack.learningMetadata=currentLearningMetadata(pack);
 }
 return pack;
}
export async function getPublicLearningMetadata(id,{expectedVersion}={}){
 const pack=await getPrivatePack(id);
 if(expectedVersion!==undefined&&expectedVersion!==pack.manifest.version){const error=new LearningMetadataError('LEARNING_METADATA_VERSION_MISMATCH','Classification is unavailable for this saved question version. Open the current question to view its current labels.');error.status=409;throw error;}
 return pack.learningMetadata??currentLearningMetadata(pack);
}
export function learnerRationale(pack){
 const manifest=pack.manifest;
 const text=manifest.id==='arrays-hashing-03'?'A left-to-right scan already visits each value. A set adds one new idea: remembering distinct values so a repeated reading can be detected at its original position.':manifest.learnerRationale??manifest.rationale;
 if(typeof text!=='string'||!text.trim()||text.length>2000||/\b(?:draft|planned|pending|not-run|validation|publication|unavailable)\b/i.test(text))return undefined;
 return text.trim();
}
export function publicProblem(pack){const m=pack.manifest;return {schemaVersion:1,id:m.id,version:m.version,slug:m.slug,title:m.title,primaryTopic:m.primaryTopic,skillIds:m.skillIds,prerequisites:m.prerequisites,step:m.step,status:m.status,statement:pack.statement,objective:m.objective,constraints:m.constraints,interface:m.interface,...(learnerRationale(pack)?{learnerRationale:learnerRationale(pack)}:{}),inputSchema:m.inputSchema,outputSchema:m.outputSchema,semanticConstraints:m.semanticConstraints??[],visibleCases:pack.visibleCases.map(({id,input,expected,explanation})=>({id,input,expected,explanation})),starters:Object.fromEntries(['java','cpp','python'].map(l=>[l,pack.languages[l].starter])),sourceIds:m.sourceIds,checkpointIds:m.checkpointIds,remedialIds:m.remedialIds,nextIds:m.nextIds};}
export async function getPublicProblem(id){return publicProblem(await getPrivatePack(id));}
export async function loadCatalogue({includeDrafts=false}={}){const cat=await readJson(safePath(contentRoot,'catalogue.json'));if(new Set(cat.problems.map(p=>p.id)).size!==cat.problems.length||new Set(cat.problems.map(p=>p.path)).size!==cat.problems.length)throw new Error('Duplicate catalogue identity');const out=[];for(const entry of cat.problems){if(entry.path!==`problems/${entry.id}`)throw new Error('Catalogue path mismatch');const pack=await getPrivatePack(entry.id);if(pack.manifest.status==='published'||includeDrafts)out.push(publicProblem(pack));}return out;}
export function validatePackInput(pack,input){return validateInput(pack.manifest.inputSchema,input)&&validateSemantics(pack.manifest.semanticConstraints??[],input);}
export function encodeCases(pack,cases){for(const c of cases)if(!validatePackInput(pack,c.input))throw new Error('Input violates published constraints');if(pack.manifest.harness?.encoding==='json-lines-v1')return cases.map(c=>JSON.stringify(c.input)).join('\n')+'\n';return `${cases.length}\n`+cases.map(c=>`${c.input.values.length}\n${c.input.values.join(' ')}\n`).join('');}
