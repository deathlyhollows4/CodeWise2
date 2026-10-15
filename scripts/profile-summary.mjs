// Read-only recovery diagnostics. Never print lesson text, code, names or secrets.
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { statSync } from 'node:fs';
for (const directory of process.argv.slice(2)) {
  const path = join(directory, 'codewise2.sqlite');
  let db;
  try {
    db = new DatabaseSync(path, { readOnly: true });
    const tables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row => row.name));
    const counts = {};
    for (const name of ['drafts','jobs','generations','events','assistance','evidence','recommendations','usage_ledger']) {
      if (tables.has(name)) counts[name] = Number(db.prepare(`SELECT COUNT(*) AS n FROM ${name}`).get().n);
    }
    const dates = {};
    for (const name of ['jobs','generations']) {
      if (tables.has(name)) dates[name] = db.prepare(`SELECT MIN(json_extract(data,'$.createdAt')) AS first, MAX(json_extract(data,'$.createdAt')) AS latest FROM ${name}`).get();
    }
    const preferences = tables.has('meta') ? db.prepare("SELECT value FROM meta WHERE key='preferences'").get() : null;
    console.log(JSON.stringify({ directory, bytes:statSync(path).size, counts, dates, onboarded: preferences ? Boolean(JSON.parse(preferences.value).onboarded) : false }));
  } catch (error) {
    console.log(JSON.stringify({ directory, error:error.code ?? 'PROFILE_READ_FAILED' }));
  } finally { db?.close(); }
}
