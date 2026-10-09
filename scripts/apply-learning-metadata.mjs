import {readFile,writeFile} from 'node:fs/promises';
import {learningOverrides} from '../content/authoring/learning-overrides.mjs';
import {canonicalJson} from '../packages/judge-adapter/src/canonical.mjs';
const changed=[];
for(const [id,fields]of Object.entries(learningOverrides)){
 const root=new URL(`../content/problems/${id}/`,import.meta.url),path=new URL('problem.json',root),previous=JSON.parse(await readFile(path,'utf8')),next={...previous,...fields};
 if(canonicalJson(previous)===canonicalJson(next))continue;
 await writeFile(path,JSON.stringify(next,null,2)+'\n');
 const validation=JSON.parse(await readFile(new URL('validation.json',root),'utf8'));
 for(const language of ['java','cpp','python'])validation.languages[language]={status:'not-run',reason:'curriculum-metadata-identity-changed',historical:validation.languages[language]};
 validation.status='pending';await writeFile(new URL('validation.json',root),JSON.stringify(validation,null,2)+'\n');changed.push({id,fields:Object.keys(fields)});
}
await writeFile('docs/release-evidence/learning-metadata-changed.json',JSON.stringify({schemaVersion:1,generatedAt:new Date().toISOString(),changed},null,2)+'\n');console.log(JSON.stringify({changed:changed.map(p=>p.id)}));
