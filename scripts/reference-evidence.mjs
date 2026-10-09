import {readJson,safePath,sha256} from '../packages/judge-adapter/src/content.mjs';
import {writeFile} from 'node:fs/promises';
export function referenceHistoryName(id,language,previous){if(!/^[a-z0-9-]+$/.test(id)||!['java','cpp','python'].includes(language))throw new Error('Invalid evidence identity');return `${id}-${language}-${sha256(JSON.stringify({validationIdentity:previous.validationIdentity,runtimeIdentity:previous.runtimeIdentity}))}.json`;}
export async function saveReferenceOutcome(pack,language,evidence,complete){
 const path=safePath(pack.root,'validation.json'),record=await readJson(path),r=evidence.result;
 record.languages[language]={status:complete?'passed':['wrong_answer','compile_error','runtime_error','time_limit','memory_limit'].includes(r.status)?'failed':'pending',validationIdentity:evidence.validationIdentity,runtimeIdentity:evidence.runtimeIdentity,executed:r.counts?.executed??0,passed:r.counts?.passed??0,executedAt:evidence.executedAt,evidencePath:`docs/release-evidence/validation-${pack.manifest.id}-${language}.json`,outcome:r.status};
 record.status=Object.values(record.languages).every(l=>l.status==='passed')?'references-passed-review-pending':'pending';
 await writeFile(path,JSON.stringify(record,null,2)+'\n');
}
