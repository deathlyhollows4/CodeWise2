import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {canonicalJson,inputKey} from './canonical.mjs';
import {resolve,sep} from 'node:path';import {fileURLToPath} from 'node:url';
import {customCheckerNames} from './custom-checkers.mjs';
import {hiddenCaseRequirement} from '../../contracts/src/hidden-case-requirement.mjs';
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const strings=x=>Array.isArray(x)&&x.every(v=>typeof v==='string'&&v.length>0);
const fail=m=>{throw new Error('Invalid problem pack: '+m);};
const hash=x=>createHash('sha256').update(x).digest('hex');
const HEX=/^[a-f0-9]{64}$/;
const reviewedCheckerSource=await readFile(new URL('./checkers.mjs',import.meta.url),'utf8');
const reviewedCustomCheckerSource=await readFile(new URL('./custom-checkers.mjs',import.meta.url),'utf8');
export function assertPackStructure(p){
 const m=p.manifest;
 if(!object(m)||m.schemaVersion!==1||!/^[a-z0-9-]+$/.test(m.id)||!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(m.version)||!['draft','validated','published'].includes(m.status))fail('identity/status');
 for(const k of ['slug','title','primaryTopic','objective','interface'])if(typeof m[k]!=='string'||!m[k].trim())fail(k);
 for(const k of ['skillIds','prerequisites','constraints','sourceIds','checkpointIds','remedialIds','nextIds','commonMistakes'])if(!strings(m[k]))fail(k);
 if(m.skillIds.length===0||m.sourceIds.length===0||m.constraints.length===0||!Number.isInteger(m.step)||m.step<1)fail('learning metadata');
 if(!object(m.limits))fail('limits');for(const k of ['cpuSeconds','wallSeconds','memoryKb','processes','outputBytes','fileKb','inputBytes'])if(!Number.isFinite(m.limits[k])||m.limits[k]<=0)fail('limits.'+k);
 if(!object(m.checker)||!['exact','sequence','set','multiset','numeric','custom'].includes(m.checker.kind))fail('unreviewed checker');if(m.checker.kind==='custom'&&!customCheckerNames.includes(m.checker.name))fail('unreviewed custom checker');
 if(m.checker.kind==='numeric')for(const k of ['absoluteTolerance','relativeTolerance'])if(m.checker[k]!==undefined&&(!Number.isFinite(m.checker[k])||m.checker[k]<0))fail('invalid tolerance');
 const schema=(s,depth=0)=>{if(!object(s)||depth>32)fail('input/output schema');if(s.labelFrequencyProfile!==undefined&&(s.kind!=='array'||typeof s.labelFrequencyProfile!=='boolean'||s.unordered!==true||s.deduplicate===true||s.items?.kind!=='integer'))fail('array frequency-profile canonical semantics');if(['integer','safe-integer','number','int64-string','boolean','null','json'].includes(s.kind))return;if(s.kind==='enum'){if(!Array.isArray(s.values)||s.values.length===0||s.values.some(v=>typeof v!=='string'))fail('enum');return;}if(s.kind==='integer-array'){if(typeof s.field!=='string'||![s.minLength,s.maxLength,s.minValue,s.maxValue].every(Number.isSafeInteger)||s.minLength<0||s.maxLength<s.minLength||s.maxValue<s.minValue)fail('integer-array schema');return;}if(s.kind==='string'){if(s.maxLength!==undefined&&(!Number.isInteger(s.maxLength)||s.maxLength<0))fail('string size');return;}if(s.kind==='nullable'){schema(s.value,depth+1);return;}if(s.kind==='array'){if(s.unordered!==undefined&&typeof s.unordered!=='boolean'||s.deduplicate!==undefined&&typeof s.deduplicate!=='boolean'||s.deduplicate===true&&s.unordered!==true)fail('array canonical semantics');if(s.maxLength!==undefined&&(!Number.isInteger(s.maxLength)||s.maxLength<0))fail('array size');schema(s.items,depth+1);return;}if(s.kind==='object'){if(!object(s.properties))fail('object properties');for(const s2 of Object.values(s.properties))schema(s2,depth+1);return;}fail('unknown schema kind');};schema(m.inputSchema);schema(m.outputSchema);
 if(typeof p.statement!=='string'||!p.statement.trim())fail('statement');
 const hiddenRequirement=hiddenCaseRequirement(m.id);
 if(!Array.isArray(p.visibleCases)||p.visibleCases.length!==3||!Array.isArray(p.hiddenCases)||p.hiddenCases.length<hiddenRequirement.minimum||hiddenRequirement.exact!==null&&p.hiddenCases.length!==hiddenRequirement.exact)fail('scoped cases');
 for(const c of p.visibleCases)if(!object(c)||typeof c.id!=='string'||typeof c.explanation!=='string'||!Object.hasOwn(c,'input')||!Object.hasOwn(c,'expected'))fail('visible case');
 for(const c of p.hiddenCases)if(!object(c)||typeof c.id!=='string'||typeof c.category!=='string'||!HEX.test(c.inputHash??'')||!Object.hasOwn(c,'input')||!Object.hasOwn(c,'expected'))fail('hidden case');
 const ids=[...p.visibleCases,...p.hiddenCases].map(c=>c.id);if(new Set(ids).size!==ids.length||ids.some(id=>!id.trim()))fail('duplicate/empty case IDs');
 const visibleKeys=new Set(p.visibleCases.map(c=>inputKey(m.inputSchema,c.input)));if(visibleKeys.size!==p.visibleCases.length)fail('duplicate visible logical input');
 const hiddenKeys=new Set();for(const c of p.hiddenCases){const key=inputKey(m.inputSchema,c.input);if(visibleKeys.has(key)||hiddenKeys.has(key))fail('duplicate/disjoint hidden logical input');if(hash(key)!==c.inputHash)fail('hidden canonical input hash');hiddenKeys.add(key);}
 if(!object(p.suite)||p.suite.schemaVersion!==1||p.suite.hiddenCount!==p.hiddenCases.length||!HEX.test(p.suite.suiteHash??''))fail('suite');
 if(!object(p.validation)||p.validation.schemaVersion!==1||p.validation.version!==m.version||!object(p.validation.languages))fail('validation record');
 for(const lang of ['java','cpp','python']){const l=p.languages[lang];if(!object(l)||['starter','wrapper','reference'].some(k=>typeof l[k]!=='string'||!l[k].trim())||l.wrapper.split('{{USER_CODE}}').length!==2)fail('language '+lang);}
 if(!object(p.provenance)||!['original','adapted','imported'].includes(p.provenance.origin)||!object(p.provenance.assets))fail('provenance');
 for(const kind of ['statement','examples','tests','references','explanation']){const a=p.provenance.assets[kind];if(!object(a)||typeof a.sourceId!=='string'||typeof a.license!=='string'||!a.license)fail('asset provenance '+kind);}
}
export const packIdentity=p=>hash(canonicalJson({reviewIdentityVersion:2,manifest:{...p.manifest,status:'content'},statement:p.statement,visible:p.visibleCases,suiteHash:p.suite.suiteHash,provenance:p.provenance,languages:Object.fromEntries(['java','cpp','python'].map(language=>[language,Object.fromEntries(['starter','wrapper','reference'].map(asset=>[asset,p.languages[language][asset]]))])),checkerSource:reviewedCheckerSource+(p.manifest.checker.kind==='custom'?reviewedCustomCheckerSource:'')}));
export async function assertPublicationReviews(p,root){
 const identity=packIdentity(p),read=async path=>JSON.parse(await readFile(root+'/'+path,'utf8'));
 const oracle=await read('private/oracle-evidence.json');
 if(oracle.status!=='passed'||oracle.contentIdentity!==identity||oracle.suiteHash!==p.suite.suiteHash||oracle.oracleChecks!==p.hiddenCases.length+3||oracle.hiddenUnique!==p.hiddenCases.length||!Array.isArray(oracle.mutations)||!oracle.mutations.length||oracle.mutations.some(m=>m.detected!==true))fail('missing/stale oracle or mutation evidence');
 for(const name of ['progression','diversity','rights']){const r=await read(`private/${name}-review.json`);if(r.status!=='passed'||r.contentIdentity!==identity||typeof r.reviewer!=='string'||!r.reviewer||typeof r.reviewedAt!=='string')fail('missing/stale '+name+' review');}
 if(p.provenance.origin!=='original')for(const a of Object.values(p.provenance.assets))if(a.origin!=='original'){
  const notice=a.noticePath??a.licenseEvidence;if(!a.sourceUrl||!a.revision||!notice)fail('import provenance pin/notice');
  const workspace=fileURLToPath(new URL('../../../',import.meta.url)),path=resolve(workspace,notice);
  if(!path.startsWith(resolve(workspace,'content','sources')+sep)&&!path.startsWith(resolve(workspace,'content','notices')+sep))fail('unsafe notice path');
  if(!(await readFile(path,'utf8')).trim())fail('empty notice');
 }
}
