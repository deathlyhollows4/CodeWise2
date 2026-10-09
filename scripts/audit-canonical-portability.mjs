import {writeFile} from 'node:fs/promises';
import {getPrivatePack,readJson,contentRoot,safePath} from '../packages/judge-adapter/src/content.mjs';
import {canonicalJson,inputKey} from '../packages/judge-adapter/src/canonical.mjs';
function binaryNormalize(schema,input){
 if(schema.kind==='integer-array')return {[schema.field]:binaryNormalize({kind:'array',items:{kind:'integer'},unordered:schema.unordered,deduplicate:schema.deduplicate},input[schema.field])};
 if(schema.kind==='array'){const items=input.map(v=>binaryNormalize(schema.items,v));if(schema.trimTrailingNulls)while(items.length&&items.at(-1)===null)items.pop();if(schema.unordered)items.sort((a,b)=>{const x=canonicalJson(a),y=canonicalJson(b);return x<y?-1:x>y?1:0;});return schema.deduplicate?items.filter((v,i)=>i===0||canonicalJson(v)!==canonicalJson(items[i-1])):items;}
 if(schema.kind==='object')return Object.fromEntries(Object.keys(schema.properties).sort().map(k=>[k,binaryNormalize(schema.properties[k],input[k])]));if(schema.kind==='nullable')return input===null?null:binaryNormalize(schema.value,input);return input;
}
const catalogue=await readJson(safePath(contentRoot,'catalogue.json')),report={kind:'read-only-canonical-portability-audit',generatedAt:new Date().toISOString(),catalogueCount:catalogue.problems.length,changed:[],caseChecks:0};
for(const row of catalogue.problems){const p=await getPrivatePack(row.id);let hiddenChanged=0,visibleChanged=0;for(const [cases,hidden] of [[p.visibleCases,false],[p.hiddenCases,true]])for(const c of cases){report.caseChecks++;if(inputKey(p.manifest.inputSchema,c.input)!==canonicalJson(binaryNormalize(p.manifest.inputSchema,c.input)))hidden?hiddenChanged++:visibleChanged++;}if(hiddenChanged||visibleChanged)report.changed.push({id:row.id,hiddenChanged,visibleChanged});}
await writeFile('docs/release-evidence/canonical-portability-current-before-change.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
