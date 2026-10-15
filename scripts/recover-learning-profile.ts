import { DatabaseSync, backup } from 'node:sqlite';
import { readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { join, resolve, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { BackupSchema } from '../apps/server/src/backup.ts';
import { publicGeneration } from '../apps/server/src/tutor-context.ts';

const [mode, sourceDirectory, recoveryDirectory, targetDirectory, address = 'http://127.0.0.1:3000'] = process.argv.slice(2);
if (!['prepare', 'build'].includes(mode) || !sourceDirectory || !recoveryDirectory || !targetDirectory) throw new Error('Provide mode, source profile, private recovery folder, and new target profile.');
const repositoryRoot = realpathSync(fileURLToPath(new URL('../', import.meta.url)));
for (const directory of [recoveryDirectory, targetDirectory]) {
  const relation = relative(repositoryRoot, realpathSync(resolve(directory)));
  if (!relation || (!isAbsolute(relation) && relation !== '..' && !relation.startsWith('..'+sep))) throw new Error('Learning data and backups must stay outside the source repository.');
}
const counts = (value: any) => ({ jobs:value.jobs.length, lessons:value.generations.length, drafts:value.drafts.length, evidence:value.evidence.length });
const hash = (value: any) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const stable = (value: any) => { const { exportedAt: _, ...records } = value; return hash(records); };
function fromDatabase(directory: string) {
  const db = new DatabaseSync(join(directory, 'codewise2.sqlite'), { readOnly:true });
  try {
    db.exec('BEGIN');
    const meta = (key: string) => { const row = db.prepare('SELECT value FROM meta WHERE key=?').get(key); return row ? JSON.parse(String(row.value)) : null; };
    const list = (table: string) => db.prepare(`SELECT data FROM ${table} ORDER BY rowid`).all().map(row => JSON.parse(String(row.data)));
    const value = BackupSchema.parse({schemaVersion:1, exportedAt:new Date().toISOString(), preferences:meta('preferences'),
      learningMetadata:{assessment:meta('assessment'),currentSelection:meta('currentSelection'),pendingChallenge:meta('pendingChallenge'),problemAnnotations:meta('problemAnnotations') ?? {},problemVersions:meta('problemVersions') ?? {}},
      drafts:db.prepare('SELECT * FROM drafts').all(), jobs:list('jobs'), generations:list('generations').map(publicGeneration),
      events:db.prepare('SELECT * FROM events').all(), assistance:db.prepare('SELECT * FROM assistance').all(), evidence:list('evidence'), recommendations:list('recommendations'),usageLedger:meta('tutorUsage') ?? []});
    db.exec('COMMIT');
    return value;
  } finally { db.close(); }
}
function union(oldRows: any[], newRows: any[], key: (row:any) => string) {
  return [...new Map([...oldRows, ...newRows].map(row => [key(row),row])).values()];
}
function merge(old: any, current: any) {
  const byId = (row:any) => row.id ?? hash(row);
  const draftMap = new Map(old.drafts.map((row:any) => [row.problem+'\0'+row.language,row]));
  for (const row of current.drafts) {
    const key = row.problem+'\0'+row.language, previous:any = draftMap.get(key);
    if (!previous || row.updated >= previous.updated) draftMap.set(key,row);
  }
  const value = BackupSchema.parse({...current, exportedAt:new Date().toISOString(),drafts:[...draftMap.values()],
    jobs:union(old.jobs,current.jobs,byId),generations:union(old.generations,current.generations,byId),
    events:union(old.events,current.events,row => row.generation+'\0'+row.seq),assistance:union(old.assistance,current.assistance,byId),
    evidence:union(old.evidence,current.evidence,byId),recommendations:[...old.recommendations,...current.recommendations],usageLedger:union(old.usageLedger,current.usageLedger,byId),
    learningMetadata:{...current.learningMetadata, assessment:current.learningMetadata.assessment ?? old.learningMetadata.assessment,
      problemVersions:{...old.learningMetadata.problemVersions,...current.learningMetadata.problemVersions},problemAnnotations:{...old.learningMetadata.problemAnnotations,...current.learningMetadata.problemAnnotations}}});
  for (const table of ['jobs','generations'] as const) {
    if (new Set(value[table].map(row => row.idempotencyKey)).size !== value[table].length) throw new Error('Conflicting request identities; originals preserved and no recovery applied.');
    if (value[table].some(row => ['queued','running','compiling','streaming'].includes(row.status))) throw new Error('Wait for current grading/AI work to finish before recovery.');
  }
  return value;
}

if (mode === 'prepare') {
  const old = fromDatabase(sourceDirectory);
  const response = await fetch(address+'/api/bootstrap');
  if (!response.ok) throw new Error('Current app bootstrap failed.');
  const boot:any = await response.json();
  if (boot.fixture || !boot.csrfToken || !boot.catalogue) throw new Error('Refusing recovery against a fixture or unrelated service.');
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  const exported = await fetch(address+'/api/data/export', {headers:{Cookie:cookie ?? ''}});
  if (!exported.ok) throw new Error('Current learning export failed.');
  const current = BackupSchema.parse(await exported.json());
  const merged = merge(old,current);
  for (const [name,value] of [['older-learning.json',old],['current-learning.json',current],['combined-learning.json',merged]] as const) {
    writeFileSync(join(recoveryDirectory,name),JSON.stringify(value),{flag:'wx',mode:0o600});
  }
  const source = new DatabaseSync(join(sourceDirectory,'codewise2.sqlite'),{readOnly:true});
  try { await backup(source,join(recoveryDirectory,'older-snapshot.sqlite')); } finally {source.close();}
  const preview = await fetch(address+'/api/data/import/preview',{method:'POST',headers:{Cookie:cookie ?? '',Origin:address,'X-CSRF-Token':boot.csrfToken,'Content-Type':'application/json'},body:JSON.stringify({backup:merged})});
  if (!preview.ok) throw new Error('The current app rejected the combined learning-backup preview. Originals and backup copies remain intact.');
  const result:any = await preview.json();
  writeFileSync(join(recoveryDirectory,'manifest.json'),JSON.stringify({sourceDirectory,targetDirectory:resolve(targetDirectory),address,counts:counts(merged),currentHash:stable(current),combinedHash:hash(merged),previewCounts:result.counts}),{flag:'wx',mode:0o600});
  console.log(JSON.stringify({prepared:true,older:counts(old),current:counts(current),combined:counts(merged),appPreviewAccepted:true,recoveryDirectory,targetDirectory}));
} else {
  const manifest = JSON.parse(readFileSync(join(recoveryDirectory,'manifest.json'),'utf8'));
  if (resolve(targetDirectory) !== manifest.targetDirectory) throw new Error('Recovery target changed.');
  const merged = BackupSchema.parse(JSON.parse(readFileSync(join(recoveryDirectory,'combined-learning.json'),'utf8')));
  if (hash(merged) !== manifest.combinedHash) throw new Error('The prepared recovery changed.');
  const path = join(targetDirectory,'codewise2.sqlite');
  if (existsSync(path)) throw new Error('Target database already exists; no data overwritten.');
  const source = new DatabaseSync(join(recoveryDirectory,'older-snapshot.sqlite'),{readOnly:true});
  try { await backup(source,path); } finally {source.close();}
  const db = new DatabaseSync(path);
  try {
    db.exec('PRAGMA foreign_keys=ON; BEGIN IMMEDIATE; DELETE FROM events; DELETE FROM generations; DELETE FROM jobs; DELETE FROM drafts; DELETE FROM assistance; DELETE FROM evidence; DELETE FROM recommendations;');
    const meta = (key:string,value:any) => db.prepare('INSERT INTO meta VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,JSON.stringify(value));
    meta('preferences',merged.preferences);
    for (const [key,value] of Object.entries(merged.learningMetadata)) meta(key,value);
    meta('tutorUsage',merged.usageLedger);
    for (const row of merged.drafts) db.prepare('INSERT INTO drafts VALUES (?,?,?,?,?)').run(row.problem,row.language,row.revision,row.code,row.updated);
    for (const table of ['jobs','generations'] as const) for (const row of merged[table]) db.prepare(`INSERT INTO ${table} VALUES (?,?,?)`).run(row.id,row.idempotencyKey,JSON.stringify(row));
    for (const row of merged.events) db.prepare('INSERT INTO events VALUES (?,?,?)').run(row.generation,row.seq,row.data);
    for (const row of merged.assistance) db.prepare('INSERT INTO assistance VALUES (?,?,?,?)').run(row.id,row.problem,row.kind,row.created);
    for (const row of merged.evidence) db.prepare('INSERT INTO evidence VALUES (?,?)').run(row.id,JSON.stringify(row));
    // Recommendation.id is a problem identifier, not the recommendation row ID.
    // Preserve every historical suggestion, including repeated suggestions.
    for (const [index,row] of merged.recommendations.entries()) db.prepare('INSERT INTO recommendations VALUES (?,?)').run('recovered-'+index+'-'+hash(row),JSON.stringify(row));
    db.exec('COMMIT');
    if (db.prepare('PRAGMA integrity_check').get()?.integrity_check !== 'ok' || db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Recovered database integrity verification failed; originals untouched.');
  } finally { db.close(); }
  const recovered = fromDatabase(targetDirectory);
  if (stable(recovered) !== stable(merged)) throw new Error('Recovered records do not exactly match the prepared combined backup.');
  console.log(JSON.stringify({built:true,counts:counts(recovered),integrityVerified:true,recordsVerified:true,targetDirectory}));
}
