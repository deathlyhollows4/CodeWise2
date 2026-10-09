import {
  spawn,
  execFile,
  type ChildProcessWithoutNullStreams,
} from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
const execute = promisify(execFile);
const distro = "CodeWise2Runner";
// Holds only an owned named-distro client. EOF terminates this Linux process and its Windows client gracefully.
const reader =
  'import json,os,sys\nprint(json.dumps({"pid":os.getpid(),"nonce":sys.argv[1]}),flush=True)\nsys.stdin.buffer.read()\n';
type LifetimeHooks = {
  platform?: string;
  spawn?: typeof spawn;
  identity?: (pid?: number) => Promise<any>;
};
function childEnvironment() {
  const env: NodeJS.ProcessEnv = {};
  for (const name of [
    "SystemRoot",
    "WINDIR",
    "PATH",
    "TEMP",
    "TMP",
    "USERPROFILE",
  ])
    if (process.env[name]) env[name] = process.env[name];
  return env;
}
export class WslLifetime {
  private child: ChildProcessWithoutNullStreams | null = null;
  private identity: any = null;
  private closing = false;
  private state: any = {
    status: "not_configured",
    message: "No app-owned runner lifetime client was needed.",
  };
  constructor(
    private dataDir: string,
    private workspace = process.cwd(),
    private configurationDir = this.dataDir,
    private hooks: LifetimeHooks = {},
  ) {}
  status() {
    return { status: this.state.status, message: this.state.message };
  }
  private record() {
    try {
      mkdirSync(this.dataDir, { recursive: true });
      writeFileSync(
        join(this.dataDir, `runner-app-lifetime-${process.pid}.json`),
        JSON.stringify(
          {
            ...this.state,
            appPid: process.pid,
            distro,
            identity: this.identity,
            policyReapplied: false,
            serviceChanged: false,
          },
          null,
          2,
        ),
        { mode: 0o600 },
      );
    } catch {
      // Metadata failure must never interrupt owned EOF cleanup or escape an exit listener.
      this.state.metadataPersisted = false;
    }
  }
  private async processIdentity(pid?: number) {
    if (this.hooks.identity) return this.hooks.identity(pid);
    const script = pid
      ? `$p=Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}'; if($p){[pscustomobject]@{pid=$p.ProcessId;name=$p.Name;commandLine=$p.CommandLine;creation=$p.CreationDate.ToUniversalTime().ToString('o')}|ConvertTo-Json -Compress}`
      : `[Security.Principal.WindowsIdentity]::GetCurrent().User.Value`;
    const { stdout } = await execute(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      {
        windowsHide: true,
        env: childEnvironment(),
        timeout: 10000,
        maxBuffer: 10000,
      },
    );
    return pid ? (stdout.trim() ? JSON.parse(stdout) : null) : stdout.trim();
  }
  async start() {
    if ((this.hooks.platform ?? process.platform) !== "win32")
      return this.status();
    if (
      this.child &&
      this.child.exitCode === null &&
      this.child.signalCode === null
    )
      return this.status();
    if (
      !existsSync(join(this.configurationDir, "runner.json")) ||
      !existsSync(join(this.configurationDir, "credentials", "runner", "token"))
    )
      return this.status();
    try {
      const installation = JSON.parse(
        readFileSync(
          join(
            this.workspace,
            "docs",
            "release-evidence",
            "runner-bootstrap-result.json",
          ),
          "utf8",
        ),
      );
      const sid = await this.processIdentity();
      if (
        installation.distro !== distro ||
        installation.distroCreatedByBootstrap !== true ||
        installation.ownerSid !== sid ||
        resolve(installation.workspace).toLowerCase() !==
          resolve(this.workspace).toLowerCase()
      )
        throw new Error("Dedicated runner ownership is not verified.");
      const nonce = randomUUID(),
        file = join(
          process.env.SystemRoot ?? "C:\\Windows",
          "System32",
          "wsl.exe",
        );
      const child = (this.hooks.spawn ?? spawn)(
        file,
        [
          "--distribution",
          distro,
          "--user",
          "root",
          "--cd",
          "/root",
          "--exec",
          "/usr/bin/python3",
          "-u",
          "-c",
          reader,
          nonce,
        ],
        {
          windowsHide: true,
          stdio: ["pipe", "pipe", "pipe"],
          env: childEnvironment(),
        },
      );
      this.child = child;
      child.stdin.on("error", () => {});
      child.stderr.on("data", () => {});
      child.once("exit", () => {
        if (!this.closing) {
          this.state = {
            status: "exited",
            message:
              "The app-owned runner lifetime client exited. Recheck runner readiness; no policy was automatically reapplied.",
            finishedAt: new Date().toISOString(),
          };
          this.record();
        }
      });
      const hello = await new Promise<any>((resolve, reject) => {
        let data = "";
        const timer = setTimeout(
          () =>
            reject(new Error("Named runner lifetime client did not start.")),
          15000,
        );
        const cleanup = () => clearTimeout(timer);
        child.once("error", (e) => {
          cleanup();
          reject(e);
        });
        child.once("exit", () => {
          cleanup();
          reject(new Error("Named runner lifetime client exited."));
        });
        child.stdout.on("data", (chunk) => {
          data += chunk.toString("utf8");
          if (data.length > 4096) {
            cleanup();
            reject(new Error("Unexpected lifetime handshake"));
            return;
          }
          if (data.includes("\n")) {
            cleanup();
            try {
              resolve(JSON.parse(data.split("\n")[0]));
            } catch {
              reject(new Error("Invalid lifetime handshake"));
            }
          }
        });
      });
      if (
        hello.nonce !== nonce ||
        !Number.isInteger(hello.pid) ||
        hello.pid <= 0
      )
        throw new Error("Named runner lifetime ownership handshake failed.");
      const identity = await this.processIdentity(child.pid);
      if (child.exitCode !== null || child.signalCode !== null)
        throw new Error("Lifetime client exited during identity verification.");
      if (
        !identity ||
        identity.pid !== child.pid ||
        identity.name.toLowerCase() !== "wsl.exe" ||
        !identity.commandLine.includes(distro) ||
        !identity.commandLine.includes(nonce)
      )
        throw new Error("Windows lifetime process identity was not verified.");
      this.identity = {
        ...identity,
        linuxPid: hello.pid,
        nonce,
        ownerSid: sid,
      };
      this.state = {
        status: "active",
        message:
          "The app holds its verified named-distro client until shutdown; no crash policy or shared service was changed.",
        startedAt: new Date().toISOString(),
      };
      this.record();
    } catch {
      this.child?.stdin.end();
      this.state = {
        status: "unavailable",
        message:
          "The app-owned named runner lifetime could not be verified. Inspect setup/readiness; no shared service or crash policy was changed.",
      };
      this.record();
    }
    return this.status();
  }
  async stop() {
    this.closing = true;
    const child = this.child;
    if (!child || child.exitCode !== null) return this.status();
    let current: any;
    try {
      current = await this.processIdentity(child.pid);
    } catch {
      child.stdin.end();
      this.state = {
        status: "stop_unverified",
        message:
          "Owned lifetime EOF was sent, but process lookup failed. App shutdown continues; no force-kill or shared shutdown was issued.",
        finishedAt: new Date().toISOString(),
      };
      this.record();
      return this.status();
    }
    if (
      !current ||
      !this.identity ||
      current.creation !== this.identity.creation ||
      current.commandLine !== this.identity.commandLine
    ) {
      this.state = {
        status: "ownership_changed",
        message:
          "Runner lifetime identity changed; no unrelated process was stopped.",
      };
      this.record();
      return this.status();
    }
    child.stdin.end();
    const exited = await new Promise<boolean>((resolve) => {
      if (child.exitCode !== null) return resolve(true);
      const timer = setTimeout(() => resolve(false), 10000);
      child.once("exit", () => {
        clearTimeout(timer);
        resolve(true);
      });
    });
    this.state = {
      status: exited ? "stopped" : "stop_pending",
      message: exited
        ? "Owned runner lifetime client ended by EOF. The distro/shared WSL service was not stopped."
        : "Owned lifetime EOF was sent, but exit is not confirmed; no force-kill or shared shutdown was issued.",
      finishedAt: new Date().toISOString(),
    };
    this.record();
    return this.status();
  }
}
