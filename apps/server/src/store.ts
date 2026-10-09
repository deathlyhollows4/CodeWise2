import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { Preferences } from "../../../packages/contracts/src/index.ts";
import { LearningPreferencesSchema } from "../../../packages/contracts/src/index.ts";
export const defaultPreferences: Preferences = {
  displayName: "",
  language: "python",
  theme: "dark",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  fontSize: 15,
  tabWidth: 4,
  reducedMotion: false,
  autoExplain: false,
  maxOutputTokens: 2048,
  dailyRequests: 20,
  dailyTokens: 50000,
  dailySpendUsd: null,
  model: "",
  onboarded: false,
  focusTopic: null,
  reviewPreference: "balanced",
  defaultHintDepth: "concept",
};
function normalizeLearningPreferences(preferences: any) {
  const { focusTopic, reviewPreference, defaultHintDepth } = preferences;
  return {
    ...preferences,
    ...LearningPreferencesSchema.parse({
      focusTopic,
      reviewPreference,
      defaultHintDepth,
    }),
  };
}
import { ProfileOwner } from "./profile-owner.ts";
export class Store {
  db!: DatabaseSync;
  path: string;
  private owner: ProfileOwner;
  constructor(dir: string, owner?: ProfileOwner) {
    this.owner = owner ?? ProfileOwner.acquire(dir);
    try {
      this.owner.claimForStore(dir);
    } catch (error) {
      if (!owner) this.owner.release();
      throw error;
    }
    try {
      mkdirSync(dir, { recursive: true });
      this.path = join(dir, "codewise2.sqlite");
      this.db = new DatabaseSync(this.path);
      const version = Number(
        this.db.prepare("PRAGMA user_version").get()?.user_version ?? 0,
      );
      if (![0, 1].includes(version)) {
        this.db.close();
        throw new Error(
          `Unsupported database schema version ${version}; data was not changed.`,
        );
      }
      if (version === 0) {
        this.db.exec("BEGIN IMMEDIATE");
        try {
          this.db.exec(`
 CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS drafts(problem TEXT,language TEXT,revision INTEGER NOT NULL,code TEXT NOT NULL,updated TEXT NOT NULL,PRIMARY KEY(problem,language));
 CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,idem TEXT UNIQUE NOT NULL,data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS generations(id TEXT PRIMARY KEY,idem TEXT UNIQUE NOT NULL,data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS events(generation TEXT NOT NULL,seq INTEGER NOT NULL,data TEXT NOT NULL,PRIMARY KEY(generation,seq),FOREIGN KEY(generation) REFERENCES generations(id) ON DELETE CASCADE);
 CREATE TABLE IF NOT EXISTS assistance(id TEXT PRIMARY KEY,problem TEXT NOT NULL,kind TEXT NOT NULL,created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS evidence(id TEXT PRIMARY KEY,data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS recommendations(id TEXT PRIMARY KEY,data TEXT NOT NULL);
 PRAGMA user_version=1;`);
          if (!this.meta("preferences"))
            this.setMeta("preferences", defaultPreferences);
          else
            this.setMeta(
              "preferences",
              normalizeLearningPreferences(this.meta("preferences")),
            );
          for (const sql of [
            "SELECT code,revision,updated FROM drafts LIMIT 0",
            "SELECT id,idem,data FROM jobs LIMIT 0",
            "SELECT id,idem,data FROM generations LIMIT 0",
            "SELECT generation,seq,data FROM events LIMIT 0",
            "SELECT id,problem,kind,created FROM assistance LIMIT 0",
            "SELECT id,data FROM evidence LIMIT 0",
            "SELECT id,data FROM recommendations LIMIT 0",
          ])
            this.db.prepare(sql).all();
          this.db.exec("COMMIT");
        } catch (e) {
          this.db.exec("ROLLBACK");
          this.db.close();
          throw e;
        }
      }
      try {
        const saved = this.meta("preferences") ?? defaultPreferences;
        const normalized = normalizeLearningPreferences(saved);
        if (JSON.stringify(saved) !== JSON.stringify(normalized))
          this.tx(() => this.setMeta("preferences", normalized));
      } catch (error) {
        this.db.close();
        throw error;
      }
      this.db.exec(
        "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
      );
      this.recover();
    } catch (error) {
      try {
        this.db?.close();
      } catch {
        /* Initialization failure must release profile ownership. */
      }
      this.owner.release();
      throw error;
    }
  }
  meta(key: string) {
    const row = this.db.prepare("SELECT value FROM meta WHERE key=?").get(key);
    return row ? JSON.parse(String(row.value)) : null;
  }
  setMeta(key: string, value: unknown) {
    this.db
      .prepare(
        "INSERT INTO meta VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      )
      .run(key, JSON.stringify(value));
  }
  tx<T>(fn: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const v = fn();
      this.db.exec("COMMIT");
      return v;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  list(table: "jobs" | "generations" | "evidence" | "recommendations") {
    return this.db
      .prepare(`SELECT data FROM ${table} ORDER BY rowid`)
      .all()
      .map((r) => JSON.parse(String(r.data)));
  }
  get(table: "jobs" | "generations", id: string) {
    const r = this.db
      .prepare(`SELECT data FROM ${table} WHERE id=? OR idem=?`)
      .get(id, id);
    return r ? JSON.parse(String(r.data)) : null;
  }
  insert(table: "jobs" | "generations", data: any) {
    this.db
      .prepare(`INSERT INTO ${table} VALUES (?,?,?)`)
      .run(data.id, data.idempotencyKey, JSON.stringify(data));
  }
  update(table: "jobs" | "generations", data: any) {
    this.db
      .prepare(`UPDATE ${table} SET data=? WHERE id=?`)
      .run(JSON.stringify(data), data.id);
  }
  event(id: string, event: any) {
    const r = this.db
      .prepare(
        "SELECT COALESCE(MAX(seq),0)+1 AS n FROM events WHERE generation=?",
      )
      .get(id)!;
    const seq = Number(r.n);
    this.db
      .prepare("INSERT INTO events VALUES (?,?,?)")
      .run(id, seq, JSON.stringify(event));
    // The complete saved generation is the recovery snapshot; keep replay bounded.
    this.db
      .prepare("DELETE FROM events WHERE generation=? AND seq<=?")
      .run(id, seq - 128);
    return seq;
  }
  replay(id: string, after: number) {
    const retained = this.events(id, 0);
    const latest = retained.at(-1)?.seq ?? 0;
    if (
      retained.length &&
      (after === 0 || after < retained[0].seq - 1 || after > latest)
    ) {
      const generation = this.get("generations", id);
      return [
        {
          seq: latest,
          type: "snapshot",
          text: generation?.markdown ?? "",
          status: generation?.status,
        },
      ];
    }
    return retained.filter((event) => event.seq > after);
  }
  events(id: string, after: number) {
    return this.db
      .prepare(
        "SELECT seq,data FROM events WHERE generation=? AND seq>? ORDER BY seq",
      )
      .all(id, after)
      .map((r) => ({ seq: Number(r.seq), ...JSON.parse(String(r.data)) }));
  }
  assistance(problem: string, kind: string) {
    if (
      this.db
        .prepare("SELECT id FROM assistance WHERE problem=? AND kind=? LIMIT 1")
        .get(problem, kind)
    )
      return;
    this.db
      .prepare("INSERT INTO assistance VALUES (?,?,?,?)")
      .run(randomUUID(), problem, kind, new Date().toISOString());
  }
  assisted(problem: string) {
    return !!this.db
      .prepare(
        "SELECT id FROM assistance WHERE problem=? AND kind!='feedback_only' LIMIT 1",
      )
      .get(problem);
  }
  recover() {
    for (const table of ["jobs", "generations"] as const)
      for (const x of this.list(table))
        if (
          ["queued", "running", "compiling", "streaming"].includes(x.status)
        ) {
          x.status = "interrupted";
          x.finishedAt = new Date().toISOString();
          this.update(table, x);
          if (table === "generations")
            this.event(x.id, { type: "status", status: "interrupted" });
        }
  }
  close() {
    try {
      this.db.close();
    } finally {
      this.owner.release();
    }
  }
}
