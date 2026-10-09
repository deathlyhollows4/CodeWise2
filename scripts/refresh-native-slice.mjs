// Explicit draft-only refresh of legacy scalar packs; preserves every other pack.
import {readFile,writeFile} from 'node:fs/promises';
import {definitions,generate} from '../content/authoring/slice.mjs';
import {getPrivatePack,sha256,safePath} from '../packages/judge-adapter/src/content.mjs';
const argument=process.argv.find(a=>a.startsWith('--ids='));if(!argument)throw Error('Explicit IDs required');
const ids=argument.slice(6).split(',');if(new Set(ids).size!==ids.length||ids.some(id=>!['arrays-hashing-01','arrays-hashing-02'].includes(id)))throw Error('Only selected legacy scalar drafts may be refreshed');
for(const id of ids){
 const pack=await getPrivatePack(id);if(pack.manifest.status!=='draft')throw Error('Published pack cannot be refreshed');
 const def=definitions.find(d=>d.id===id),hidden=generate(def),text=hidden.map(c=>JSON.stringify(c)).join('\n')+'\n';if(hidden.length<200)throw Error('Canonical scalar suite below200');
 const manifest={...pack.manifest,inputSchema:{...pack.manifest.inputSchema,unordered:true,...(id==='arrays-hashing-02'?{deduplicate:true}:{})}};
 const suite={...pack.suite,generatorVersion:'r48-scalar-canonical-1',hiddenCount:hidden.length,suiteHash:sha256(text),categories:[...new Set(hidden.map(c=>c.category))],oracleStatus:'pending-trusted-audit',referenceStatus:'not-run'};
 const write=(name,value)=>writeFile(safePath(pack.root,name),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');
 await write('private/hidden-cases.jsonl',text);await write('private/suite-manifest.json',suite);await write('problem.json',manifest);
 await write('validation.json',{schemaVersion:1,version:manifest.version,suiteHash:suite.suiteHash,status:'pending',languages:Object.fromEntries(['java','cpp','python'].map(language=>[language,{status:'not-run',reason:'r48-canonical-suite-refresh'}])),independentReview:'pending'});
 console.log(JSON.stringify({id,hidden:hidden.length}));
}
