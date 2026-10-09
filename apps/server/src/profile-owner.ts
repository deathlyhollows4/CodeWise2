import { DatabaseSync } from "node:sqlite";
import {
  mkdirSync,
  realpathSync,
  readFileSync,
  writeFileSync,
  renameSync,
  unlinkSync,
  existsSync,
  statSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
export class ProfileOwnerError extends Error {
  constructor(
    public code: "PROFILE_IN_USE" | "PROFILE_GUARD_UNAVAILABLE",
    message: string,
  ) {
    super(message);
  }
}
// A separate rollback-journal database holds an OS-backed exclusive lock. It never locks the learning database.
// Crash/reclaim serialization comes from SQLite's VFS, not PID reuse, timestamps or a JSON-marker delete race.
export class ProfileOwner {
  readonly profilePath: string;
  readonly instanceId = randomUUID();
  readonly metadataPath: string;
  private db: DatabaseSync | null = null;
  private claimed = false;
  private constructor(dir: string) {
    mkdirSync(dir, { recursive: true });
    this.profilePath = realpathSync(resolve(dir));
    this.metadataPath = join(this.profilePath, "profile-owner.json");
    let db: DatabaseSync | null = null;
    try {
      db = new DatabaseSync(
        join(this.profilePath, "profile-owner-lock.sqlite"),
      );
      db.exec("PRAGMA busy_timeout=0; PRAGMA journal_mode=DELETE;");
      const version = Number(
        db.prepare("PRAGMA user_version").get()?.user_version ?? 0,
      );
      if (![0, 1].includes(version))
        throw new Error("Unsupported ownership guard format");
      if (version === 0) db.exec("PRAGMA user_version=1");
      db.exec("BEGIN EXCLUSIVE");
      this.db = db;
      const temp = this.metadataPath + "." + this.instanceId + ".tmp";
      try {
        writeFileSync(
          temp,
          JSON.stringify({
            schemaVersion: 1,
            instanceId: this.instanceId,
            pid: process.pid,
            profilePath: this.profilePath,
            acquiredAt: new Date().toISOString(),
            executable: process.execPath,
            entrypoint: process.argv[1] ?? null,
            authority: "separate-sqlite-exclusive-vfs-lock",
            pidIsDiagnosticOnly: true,
            staleReclaim:
              "OS lock release plus atomic exclusive acquisition; no expiry or force-kill",
          }),
          { mode: 0o600 },
        );
        renameSync(temp, this.metadataPath);
      } finally {
        if (existsSync(temp)) unlinkSync(temp);
      }
    } catch (error: any) {
      try {
        db?.close();
      } catch {
        /* Process exit also releases the OS handle. */
      }
      this.db = null;
      if (error?.errcode === 5 || error?.errcode === 6)
        throw new ProfileOwnerError(
          "PROFILE_IN_USE",
          "Another CodeWise2 instance owns this data folder. Reuse or stop that instance before starting this profile again.",
        );
      throw new ProfileOwnerError(
        "PROFILE_GUARD_UNAVAILABLE",
        "The data-folder ownership guard could not be acquired. No learning recovery or port binding was attempted.",
      );
    }
  }
  static acquire(dir: string) {
    return new ProfileOwner(dir);
  }
  claimForStore(dir: string) {
    const canonical = realpathSync(resolve(dir));
    const matches =
      process.platform === "win32"
        ? canonical.toLowerCase() === this.profilePath.toLowerCase()
        : canonical === this.profilePath;
    if (!this.db || this.claimed || !matches)
      throw new ProfileOwnerError(
        "PROFILE_IN_USE",
        "The storage owner lease is inactive, already attached, or belongs to another data folder.",
      );
    this.claimed = true;
  }
  release() {
    const db = this.db;
    if (!db) return;
    this.db = null;
    // Remove only our diagnostic marker while the authoritative lock is STILL held. A successor cannot acquire yet.
    try {
      if (
        existsSync(this.metadataPath) &&
        statSync(this.metadataPath).size <= 8192
      ) {
        const marker = JSON.parse(readFileSync(this.metadataPath, "utf8"));
        if (marker.instanceId === this.instanceId)
          unlinkSync(this.metadataPath);
      }
    } catch {
      /* A stale diagnostic marker never prevents safe OS-lock recovery. */
    }
    try {
      db.exec("ROLLBACK");
    } catch {
      /* Closing releases the kernel lock even after an I/O error. */
    } finally {
      try {
        db.close();
      } catch {
        /* Shutdown exits also release OS handles; diagnostic metadata is never authoritative. */
      }
    }
  }
}
