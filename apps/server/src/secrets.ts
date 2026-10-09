import {
  randomBytes,
  randomUUID,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  chmodSync,
  unlinkSync,
  renameSync,
} from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
export class SecretStore {
  keyPath: string;
  secretPath: string;
  constructor(dir: string) {
    const protectedDir = join(dir, "credentials");
    mkdirSync(protectedDir, { recursive: true, mode: 0o700 });
    this.keyPath = join(protectedDir, "master.key");
    this.secretPath = join(dir, "deepseek.secret");
  }
  private dpapi(input: string, decrypt = false) {
    const expression = decrypt
      ? "[Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect([Convert]::FromBase64String([Console]::In.ReadToEnd()),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))"
      : "[Convert]::ToBase64String([Security.Cryptography.ProtectedData]::Protect([Text.Encoding]::UTF8.GetBytes([Console]::In.ReadToEnd()),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))";
    const script =
      "[void][Reflection.Assembly]::LoadWithPartialName('System.Security'); [Console]::Write(" +
      expression +
      ")";
    for (const exe of ["pwsh.exe", "powershell.exe"]) {
      const r = spawnSync(
        exe,
        ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script],
        { input, encoding: "utf8", windowsHide: true, timeout: 10000 },
      );
      if (r.status === 0 && r.stdout) return r.stdout.trim();
    }
    throw new Error("Windows credential protection failed.");
  }
  private atomicWrite(data: Buffer | string) {
    const temp = this.secretPath + "." + randomUUID() + ".tmp";
    try {
      writeFileSync(temp, data, { mode: 0o600, flag: "wx" });
      renameSync(temp, this.secretPath);
    } finally {
      if (existsSync(temp)) unlinkSync(temp);
    }
  }
  save(value: string) {
    if (process.platform === "win32") {
      this.atomicWrite(`DPAPI:${this.dpapi(value)}`);
      return;
    }
    if (!existsSync(this.keyPath))
      writeFileSync(this.keyPath, randomBytes(32), { mode: 0o600 });
    const key = readFileSync(this.keyPath);
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    this.atomicWrite(Buffer.concat([iv, cipher.getAuthTag(), data]));
    chmodSync(this.keyPath, 0o600);
    chmodSync(this.secretPath, 0o600);
  }
  read() {
    if (!existsSync(this.secretPath)) return null;
    const raw = readFileSync(this.secretPath);
    if (raw.subarray(0, 6).toString() === "DPAPI:")
      return this.dpapi(raw.subarray(6).toString(), true);
    const decipher = createDecipheriv(
      "aes-256-gcm",
      readFileSync(this.keyPath),
      raw.subarray(0, 12),
    );
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([
      decipher.update(raw.subarray(28)),
      decipher.final(),
    ]).toString("utf8");
  }
  remove() {
    if (existsSync(this.secretPath)) unlinkSync(this.secretPath);
  }
}
