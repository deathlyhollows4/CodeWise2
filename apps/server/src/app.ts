import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join, resolve, extname } from "node:path";
import { z } from "zod";
import { UsageLedger } from "./usage-ledger.ts";
import { StreamBatcher } from "./stream-batcher.ts";
import {
  prepareTutorContext,
  TUTOR_PROMPT_VERSION,
  summarizeTutorSkills,
  publicGeneration,
  tutorOutputPolicy,
} from "./tutor-context.ts";
import { derivePathStates } from "../../../packages/learning-engine/src/path-state.ts";
import { projectProgressDashboard } from "./progress-dashboard.ts";
import { REVIEW_SCHEDULE_VERSION } from "../../../packages/learning-engine/src/review-calendar.ts";
import { RULE_VERSION } from "../../../packages/learning-engine/src/index.ts";
import {
  normalizeAssessment,
  startAssessment,
  advanceAssessment,
  stopAssessment,
} from "../../../packages/learning-engine/src/assessment.ts";
import {
  normalizeAttemptCode,
  ATTEMPT_HEURISTIC_VERSION,
} from "../../../packages/learning-engine/src/attempts.ts";
import {
  DraftSaveSchema,
  JobRequestSchema,
  TutorRequestSchema,
  PreferencesSchema,
  PublicProblemSchema,
  TopicQuotas,
  EXPECTED_QUESTIONS,
  LessonDocumentSchema,
  JudgeResultSchema,
  ExecutionIdentitySchema,
  VerifiedReferenceResultSchema,
  API_VERSION,
  AssessmentStateSchema,
  AssessmentStartSchema,
  LanguageSchema,
  RecommendationSchema,
  ProgressSchema,
  RunnerReadinessSchema,
  TutorStreamEventSchema,
  PublicLearningMetadataSchema,
} from "../../../packages/contracts/src/index.ts";
import {
  recommend,
  reviewDue,
} from "../../../packages/learning-engine/src/index.ts";
import {
  RateLimiter,
  localDate,
  estimateCost,
  pricingSnapshot,
} from "./usage.ts";
import { BackupSchema } from "./backup.ts";
import {
  MAX_BACKUP_REQUEST_BYTES,
  serializeBoundedBackup,
} from "./backup-limits.ts";
import { Store } from "./store.ts";
import type { ProfileOwner } from "./profile-owner.ts";
import { HistoryPages } from "./history-pages.ts";
import { sourceReviewRows } from "./source-reviews.ts";
import { SecretStore } from "./secrets.ts";
import { DeepSeek, ProviderError } from "./deepseek.ts";
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export function createApp(options: {
  dataDir: string;
  profileOwner?: ProfileOwner;
  catalogue?: any[];
  judge?: any;
  provider?: DeepSeek;
  port?: number;
  fixture?: boolean;
  internalFixtureIds?: string[];
  tutorFixture?: boolean;
  sources?: any[];
  learningMetadata?: (
    id: string,
    options: { expectedVersion?: string },
  ) => Promise<unknown>;
  onStop?: () => void;
}) {
  const store = new Store(options.dataDir, options.profileOwner),
    secrets = new SecretStore(options.dataDir),
    provider = options.provider ?? new DeepSeek();
  const usageLedger = new UsageLedger(store);
  const streamFlushers = new Map<string, () => void>();
  const fixtureIds = options.fixture ? (options.internalFixtureIds ?? []) : [];
  const catalogue = (options.catalogue ?? [])
    .map((p) => PublicProblemSchema.parse(p))
    .filter((p) => p.status === "published" || fixtureIds.includes(p.id));
  const versions = Object.assign(
    Object.create(null),
    store.meta("problemVersions") ?? {},
  );
  store.tx(() => {
    for (const p of catalogue) {
      const key = p.id + "@" + p.version;
      if (versions[key] && JSON.stringify(versions[key]) !== JSON.stringify(p))
        throw new Error(
          "Published content changed without a new version: " + p.id,
        );
      versions[key] = p;
    }
    store.setMeta("problemVersions", versions);
  });
  const historyPages = new HistoryPages(store, catalogue);
  const sessions = new Map<string, { csrf: string; expires: number }>();
  const active = new Map<string, AbortController>();
  const listeners = new Map<string, Set<ServerResponse>>();
  const rateLimiter = new RateLimiter();
  let queued = 0,
    closing = false;
  const runner = async () => {
    try {
      const health = RunnerReadinessSchema.parse(
        options.judge
          ? await options.judge.readiness()
          : {
              ready: false,
              message:
                "The isolated runner is not configured. Editing and saved work remain available.",
              languages: [],
              controlsVerified: false,
            },
      );
      if (
        options.judge &&
        !options.fixture &&
        typeof options.judge.captureExecutionIdentity !== "function"
      )
        return {
          ...health,
          ready: false,
          message:
            "The isolated sandbox may be configured, but trusted content binding is not installed. Normal execution jobs are unavailable.",
        };
      if (
        options.judge &&
        !options.fixture &&
        health.ready &&
        health.phaseEventsSupported !== true
      )
        return {
          ...health,
          ready: false,
          message:
            "The isolated sandbox is configured, but authenticated execution phase notifications are not available. Normal jobs require the reviewed runner update.",
        };
      return health;
    } catch {
      return {
        ready: false,
        message: "The isolated runner health check failed. Check Diagnostics.",
        languages: [],
        controlsVerified: false,
      };
    }
  };
  const keyMeta = () =>
    store.meta("keyMetadata") ?? {
      configured: false,
      masked: "",
      status: "unconfigured",
      lastChecked: null,
    };
  const testedCandidates = new Map<string, { models: string[]; at: string }>();
  const configuredModels = () => {
    const capabilities = store.meta("modelCapabilities");
    return capabilities && capabilities.keyVersion === keyMeta().version
      ? capabilities.models
      : [];
  };
  const problem = (id: string, version?: string) => {
    const p = version
      ? store.meta("problemVersions")?.[id + "@" + version]
      : catalogue.find((p) => p.id === id);
    if (!p)
      throw Object.assign(new Error("This published problem does not exist."), {
        status: 404,
        code: "NOT_FOUND",
      });
    return p;
  };
  const emit = (id: string, event: any) => {
    event = TutorStreamEventSchema.parse(event);
    const seq = store.event(id, event);
    queueMicrotask(() => {
      if (closing) return;
      if (
        store.events(id, seq - 1).some((e) => {
          const { seq: savedSeq, ...savedEvent } = e;
          return (
            savedSeq === seq &&
            JSON.stringify(savedEvent) === JSON.stringify(event)
          );
        })
      )
        for (const r of listeners.get(id) ?? [])
          r.write(`id: ${seq}\ndata: ${JSON.stringify(event)}\n\n`);
    });
  };
  const learningEvidence = () =>
    store.list("evidence").map((e) => {
      if (
        e.outcome !== "wrong_answer" ||
        typeof e.meaningfulConceptualAttempt === "boolean"
      )
        return e;
      const job = store.get("jobs", e.id),
        starter = job?.problemSnapshot?.starters?.[job.language];
      return typeof starter === "string"
        ? {
            ...e,
            meaningfulConceptualAttempt:
              normalizeAttemptCode(job.code, job.language) !==
              normalizeAttemptCode(starter, job.language),
          }
        : e;
    });
  const progress = () => {
    const evidence = store.list("evidence");
    const dashboard = projectProgressDashboard(
      catalogue,
      evidence,
      store.list("jobs"),
      store.meta("preferences").timezone,
    );
    const allReviews = evidence
      .filter((e) => e.outcome === "accepted")
      .map((e) => ({
        problemId: e.problemId,
        scheduleRuleVersion: REVIEW_SCHEDULE_VERSION,
        timezone: store.meta("preferences").timezone,
        dueAt: reviewDue(
          e.createdAt,
          evidence.filter(
            (x) =>
              x.problemId === e.problemId &&
              x.review &&
              x.outcome === "accepted" &&
              x.createdAt <= e.createdAt,
          ).length,
          store.meta("preferences").timezone,
        ),
      }))
      .filter(
        (e, i, a) => a.findLastIndex((x) => x.problemId === e.problemId) === i,
      );
    return {
      independent: dashboard.independent,
      assisted: dashboard.assisted,
      dashboard,
      evidence,
      paths: derivePathStates(catalogue, evidence),
      reviewQueue: allReviews.filter((x) => Date.parse(x.dueAt) <= Date.now()),
      scheduledReviews: allReviews,
      skills: [...new Set(catalogue.flatMap((p) => p.skillIds))].map(
        (skillId) => {
          const entries = evidence.filter((e) => e.skills?.includes(skillId));
          const good = entries.filter((e) => e.outcome === "accepted");
          const independent = good.filter((e) => !e.assisted);
          return {
            skillId,
            status: good.some((e) => e.review && !e.assisted)
              ? "reviewed_successfully"
              : independent.length
                ? "solved_independently"
                : good.length
                  ? "learned_with_help"
                  : entries.length
                    ? "practising"
                    : "not_assessed",
            workingStep: entries.at(-1)?.step ?? null,
            highestIndependentStep: independent.length
              ? Math.max(...independent.map((e) => e.step))
              : null,
            evidenceIds: entries.map((e) => e.id),
            languageEvidence: Object.fromEntries(
              ["java", "cpp", "python"].map((l) => [
                l,
                entries.filter((e) => e.language === l).map((e) => e.id),
              ]),
            ),
          };
        },
      ),
    };
  };
  const assessmentState = () => {
    const saved = store.meta("assessment");
    const normalized = normalizeAssessment(
      saved,
      catalogue,
      store.meta("preferences").language,
      new Date().toISOString(),
    );
    if (saved && saved.schemaVersion !== 2)
      store.setMeta("assessment", normalized);
    return normalized;
  };
  const currentAssessmentJobs = (a: any) => {
    if (a.status !== "active") return [];
    return store.db
      .prepare(
        `SELECT id,json_extract(data,'$.problemId') AS problemId,json_extract(data,'$.problemVersion') AS problemVersion,json_extract(data,'$.language') AS language,
json_extract(data,'$.mode') AS mode,json_extract(data,'$.review') AS review,json_extract(data,'$.status') AS status,json_extract(data,'$.createdAt') AS createdAt,json_extract(data,'$.finishedAt') AS finishedAt,
json_extract(data,'$.meaningfulConceptualAttempt') AS meaningfulConceptualAttempt,json_extract(data,'$.assessmentId') AS assessmentId,json_extract(data,'$.assessmentSelectedAt') AS assessmentSelectedAt,
json_extract(data,'$.assessmentAssisted') AS assessmentAssisted,json_extract(data,'$.result.counts') AS counts FROM jobs WHERE json_extract(data,'$.assessmentId')=? AND json_extract(data,'$.problemId')=? AND json_extract(data,'$.assessmentSelectedAt')=?
ORDER BY (json_extract(data,'$.status')='accepted' AND json_extract(data,'$.assessmentAssisted')=0) DESC,json_extract(data,'$.finishedAt') DESC LIMIT 100`,
      )
      .all(a.id, a.currentProblemId, a.currentSelectedAt)
      .map((row) => ({
        ...row,
        review: !!row.review,
        meaningfulConceptualAttempt: row.meaningfulConceptualAttempt === 1,
        assessmentAssisted:
          row.assessmentAssisted === null
            ? undefined
            : !!row.assessmentAssisted,
        result:
          typeof row.counts === "string"
            ? { counts: JSON.parse(row.counts) }
            : null,
      }));
  };
  const backup = () => ({
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    preferences: store.meta("preferences"),
    learningMetadata: {
      assessment: store.meta("assessment"),
      currentSelection: store.meta("currentSelection"),
      problemAnnotations: store.meta("problemAnnotations") ?? {},
      problemVersions: store.meta("problemVersions") ?? {},
      pendingChallenge: store.meta("pendingChallenge"),
    },
    drafts: store.db.prepare("SELECT * FROM drafts").all(),
    jobs: store.list("jobs"),
    generations: store.list("generations").map(publicGeneration),
    events: store.db.prepare("SELECT * FROM events").all(),
    assistance: store.db.prepare("SELECT * FROM assistance").all(),
    evidence: store.list("evidence"),
    recommendations: store.list("recommendations"),
    usageLedger: usageLedger.list(),
  });
  function pumpQueue() {
    if (closing) return;
    for (const job of store
      .list("jobs")
      .filter((j) => j.status === "queued" && !active.has(j.id))
      .slice(0, Math.max(0, 2 - queued)))
      void judgeJob(job);
  }
  async function judgeJob(job: any) {
    queued++;
    const controller = new AbortController();
    active.set(job.id, controller);
    try {
      const health = await runner();
      if (!health.ready || !health.controlsVerified)
        throw new Error(health.message);
      if (!job.executionIdentity && !options.fixture)
        throw new Error("Trusted execution identity is missing.");
      const result = JudgeResultSchema.parse(
        await options.judge.judgePack({
          problemId: job.problemId,
          pack: problem(job.problemId),
          language: job.language,
          code: job.code,
          mode: job.mode,
          customInput: job.customInput,
          signal: controller.signal,
          expectedIdentity: job.executionIdentity,
          onPhase: (phase: unknown) => {
            if (
              closing ||
              controller.signal.aborted ||
              typeof phase !== "string" ||
              !["compiling", "running"].includes(phase)
            )
              return;
            const current = store.get("jobs", job.id);
            if (
              !current ||
              !["queued", "compiling", "running"].includes(current.status)
            )
              return;
            job.status = phase;
            store.update("jobs", job);
          },
        }),
      );
      if (closing) return;
      if (controller.signal.aborted) {
        const canceled = store.get("jobs", job.id);
        if (canceled) {
          canceled.status = "canceled";
          canceled.result = { ...result, status: "canceled" };
          canceled.finishedAt = new Date().toISOString();
          store.update("jobs", canceled);
        }
        return;
      }
      job.status = result.status;
      job.result = result;
      job.finishedAt = new Date().toISOString();
      if (job.assessmentId)
        job.assessmentAssisted = store.assisted(job.problemId);
      store.tx(() => {
        store.update("jobs", job);
        if (
          job.mode === "submit" &&
          ["accepted", "wrong_answer"].includes(job.status)
        ) {
          const p = problem(job.problemId);
          const previous = store
            .list("evidence")
            .some((e) => e.problemId === p.id && e.outcome === "accepted");
          const languagePrevious = store
            .list("evidence")
            .some(
              (e) =>
                e.problemId === p.id &&
                e.language === job.language &&
                e.outcome === "accepted",
            );
          if (
            job.status !== "accepted" ||
            !previous ||
            job.review ||
            !languagePrevious
          ) {
            const e = {
              id: job.id,
              problemId: p.id,
              language: job.language,
              step: p.step,
              skills: p.skillIds,
              outcome: job.status,
              assisted: store.assisted(p.id),
              review: job.review,
              advancementEligible: !previous && !job.review,
              languageDemonstration: previous && !languagePrevious,
              ruleVersion: RULE_VERSION,
              codeHash: job.attemptHash ?? job.codeHash,
              meaningfulConceptualAttempt: job.meaningfulConceptualAttempt,
              classification:
                job.status === "accepted"
                  ? store.assisted(p.id)
                    ? "assisted"
                    : job.review
                      ? "review"
                      : "independent"
                  : "attempt",
              skillIds: p.skillIds,
              createdAt: job.finishedAt,
            };
            store.db
              .prepare("INSERT OR IGNORE INTO evidence VALUES (?,?)")
              .run(e.id, JSON.stringify(e));
          }
        }
      });
    } catch {
      if (closing || controller.signal.aborted) return;
      job.status = "infrastructure_error";
      job.finishedAt = new Date().toISOString();
      job.result = {
        status: job.status,
        counts: { total: 0, executed: 0, passed: 0, failed: 0, notRun: 0 },
        diagnostics:
          "The isolated execution service could not complete this job. Check Diagnostics and retry.",
      };
      store.update("jobs", job);
    } finally {
      queued--;
      active.delete(job.id);
      pumpQueue();
    }
  }
  async function tutor(g: any) {
    const credentialVersion = keyMeta().version;
    const controller = new AbortController();
    active.set(g.id, controller);
    let batchError: unknown;
    const batches = new StreamBatcher(
      (text) => {
        if (
          closing ||
          !store.get("generations", g.id) ||
          store.get("generations", g.id)?.deletedAt
        )
          return;
        const updated = { ...g, markdown: g.markdown + text };
        updated.contentHash = hash(updated.markdown);
        try {
          store.tx(() => {
            if (!g.markdown && g.problemId !== "settings-connection-test")
              store.assistance(
                g.problemId,
                g.action === "solution" || g.action === "idea_map"
                  ? "solution"
                  : g.action === "walkthrough"
                    ? "walkthrough"
                    : "hint",
              );
            store.update("generations", updated);
            emit(g.id, { type: "chunk", text });
          });
        } catch (error) {
          batchError = error;
          throw error;
        }
        Object.assign(g, updated);
      },
      (error) => {
        batchError = error;
        controller.abort();
      },
    );
    streamFlushers.set(g.id, () => batches.flush());
    try {
      const key =
        options.fixture && options.tutorFixture
          ? "fixture-key-not-real"
          : secrets.read();
      if (!key)
        throw new ProviderError("NO_KEY", "Add your DeepSeek key in Settings.");
      const prefs = store.meta("preferences");
      if (!prefs.model)
        throw new ProviderError(
          "NO_MODEL",
          "Test your key and choose an available model in Settings.",
        );
      const p =
        g.problemId === "settings-connection-test"
          ? {
              id: "settings-connection-test",
              version: "1",
              statement:
                "Explain what an array is in two simple sentences. Do not provide code.",
              constraints: [],
              visibleCases: [],
            }
          : (g.problemSnapshot ?? problem(g.problemId, g.problemVersion));
      g.status = "streaming";
      store.tx(() => {
        store.update("generations", g);
        usageLedger.dispatched(g.id);
        emit(g.id, { type: "status", status: "streaming" });
      });
      const prepared = g.contextMessages
        ? { messages: g.contextMessages }
        : prepareTutorContext({
            problem: {
              id: p.id,
              version: p.version,
              statement: p.statement,
              constraints: p.constraints,
              visibleCases: p.visibleCases,
            },
            language: g.language,
            code: g.code,
            action: g.action,
            prompt: g.prompt,
            judgeFeedback: g.sourceResultSnapshot,
            prior: store
              .list("generations")
              .filter(
                (x) =>
                  x.threadId === g.threadId &&
                  x.id !== g.id &&
                  x.status === "complete",
              ),
          });
      const result = await provider.stream(
        key,
        g.model,
        prepared.messages,
        g.maxOutputTokens ?? prefs.maxOutputTokens,
        AbortSignal.any([controller.signal, AbortSignal.timeout(90000)]),
        (text) => {
          if (
            closing ||
            controller.signal.aborted ||
            store.get("generations", g.id)?.deletedAt
          )
            return;
          batches.push(text);
        },
        {
          thinking: tutorOutputPolicy(
            g.action,
            g.maxOutputTokens ?? prefs.maxOutputTokens,
            g.hintDepth,
          ).thinking,
        },
      );
      batches.flush();
      if (
        closing ||
        controller.signal.aborted ||
        store.get("generations", g.id)?.deletedAt
      )
        return;
      g.status = result.finishReason === "length" ? "interrupted" : "complete";
      g.usage = result.usage ?? null;
      g.estimatedCostUsd =
        result.usage &&
        typeof result.usage.prompt_tokens === "number" &&
        typeof result.usage.completion_tokens === "number"
          ? estimateCost(
              g.model,
              result.usage.prompt_tokens ?? 0,
              result.usage.completion_tokens ?? 0,
            )
          : null;
      g.finishReason = result.finishReason;
      g.finishedAt = new Date().toISOString();
      g.document = LessonDocumentSchema.parse({
        schemaVersion: 1,
        title: g.title,
        markdown: g.markdown,
        sections: [{ id: "answer", kind: "general", markdown: g.markdown }],
        language: g.language,
        verification: "not-run",
      });
      store.tx(() => {
        store.update("generations", g);
        usageLedger.finalize(g);
        emit(g.id, { type: "status", status: g.status });
      });
    } catch (e) {
      if (closing) return;
      if (!batchError) {
        try {
          batches.flush();
        } catch (error) {
          batchError = error;
        }
      }
      if (
        e instanceof ProviderError &&
        keyMeta().version === credentialVersion &&
        ["INVALID_KEY", "UNREACHABLE", "RATE_LIMIT", "ACCESS_DENIED"].includes(
          e.code,
        )
      )
        store.setMeta("keyMetadata", {
          ...keyMeta(),
          status:
            e.code === "INVALID_KEY"
              ? "invalid"
              : e.code === "UNREACHABLE"
                ? "unreachable"
                : e.code === "RATE_LIMIT"
                  ? "rate_limited"
                  : "access_issue",
          lastTestedAt: new Date().toISOString(),
        });
      if (
        !store.get("generations", g.id) ||
        store.get("generations", g.id)?.deletedAt
      )
        return;
      g.status = controller.signal.aborted
        ? "canceled"
        : g.markdown
          ? "interrupted"
          : "failed";
      g.error = {
        code: e instanceof ProviderError ? e.code : "PROVIDER_ERROR",
        message:
          e instanceof ProviderError
            ? e.message
            : "The tutor request failed. Your saved request and partial answer remain available.",
      };
      // A failed/empty answer can still consume provider-reported tokens.
      if (e instanceof ProviderError && e.usage) {
        g.usage = e.usage;
        g.finishReason = e.finishReason ?? null;
        g.estimatedCostUsd =
          typeof e.usage.prompt_tokens === "number" &&
          typeof e.usage.completion_tokens === "number"
            ? estimateCost(
                g.model,
                e.usage.prompt_tokens,
                e.usage.completion_tokens,
              )
            : null;
      }
      g.finishedAt = new Date().toISOString();
      store.tx(() => {
        store.update("generations", g);
        usageLedger.finalize(g);
        emit(g.id, { type: "status", status: g.status, error: g.error });
      });
    } finally {
      batches.dispose();
      streamFlushers.delete(g.id);
      active.delete(g.id);
    }
  }
  const server = createServer(async (req, res) => {
    const requestId = randomUUID();
    const send = (data: any, status = 200, serialized?: string) => {
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(serialized ?? JSON.stringify(data));
    };
    try {
      const host = req.headers.host ?? "";
      const port =
        server.address() && typeof server.address() === "object"
          ? (server.address() as any).port
          : (options.port ?? 3000);
      const allowed = new Set([`localhost:${port}`, `127.0.0.1:${port}`]);
      if (!allowed.has(host))
        throw Object.assign(new Error("Unrecognized localhost host."), {
          status: 403,
          code: "HOST_REJECTED",
        });
      const url = new URL(req.url ?? "/", `http://${host}`),
        path = url.pathname;
      const sid = req.headers.cookie
        ?.split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("cw_session="))
        ?.slice(11);
      let session = sid ? sessions.get(sid) : null;
      if (path === "/api/bootstrap" && req.method === "GET") {
        if (req.headers.origin && req.headers.origin !== `http://${host}`)
          throw Object.assign(new Error("Cross-origin bootstrap denied."), {
            status: 403,
          });
        if (!session || session.expires < Date.now()) {
          const id = randomBytes(32).toString("hex");
          session = {
            csrf: randomBytes(32).toString("hex"),
            expires: Date.now() + 86400000,
          };
          sessions.set(id, session);
          res.setHeader(
            "Set-Cookie",
            `cw_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`,
          );
        }
        return send({
          apiVersion: API_VERSION,
          fixture: options.fixture ?? false,
          appVersion: "0.1.0",
          csrfToken: session.csrf,
          preferences: store.meta("preferences"),
          runner: await runner(),
          catalogue: {
            published: catalogue.filter((p) => p.status === "published").length,
            preview: catalogue.filter((p) => p.status !== "published").length,
            expected: EXPECTED_QUESTIONS,
          },
          key: keyMeta(),
          platform: {
            os: process.platform,
            arch: process.arch,
            node: process.version,
          },
          storagePath: options.dataDir,
        });
      }
      if (path.startsWith("/api/")) {
        if (!session || session.expires < Date.now())
          throw Object.assign(
            new Error("Reload the application to start a local session."),
            { status: 401, code: "SESSION_REQUIRED" },
          );
        if (!["GET", "HEAD"].includes(req.method ?? "")) {
          if (
            req.headers.origin !== `http://${host}` ||
            req.headers["x-csrf-token"] !== session.csrf
          )
            throw Object.assign(
              new Error("Local session security check failed."),
              { status: 403, code: "CSRF_REJECTED" },
            );
          if (!req.headers["content-type"]?.startsWith("application/json"))
            throw Object.assign(new Error("JSON content type required."), {
              status: 415,
            });
        }
      }
      const allowedMethods =
        path.startsWith("/api/problems/") && path.endsWith("/state")
          ? ["GET", "PATCH"]
          : path.endsWith("/cancel")
            ? ["POST"]
            : path.startsWith("/api/drafts/")
              ? ["GET", "PUT"]
              : path === "/api/settings"
                ? ["GET", "PUT"]
                : path === "/api/settings/key"
                  ? ["PUT", "DELETE"]
                  : path.startsWith("/api/library/") &&
                      !path.endsWith("/export")
                    ? ["GET", "PATCH", "DELETE"]
                    : ["/api/jobs", "/api/tutor"].includes(path)
                      ? path === "/api/jobs"
                        ? ["GET", "POST"]
                        : ["POST"]
                      : [
                            "/api/settings/key/test",
                            "/api/settings/tutor-test",
                            "/api/data/reset",
                            "/api/data/history/reset",
                            "/api/data/import",
                            "/api/data/import/preview",
                            "/api/assessment/start",
                            "/api/assessment/stop",
                            "/api/assessment/next",
                            "/api/learning/select",
                            "/api/lifecycle/stop",
                          ].includes(path)
                        ? ["POST"]
                        : ["GET"];
      if (
        path.startsWith("/api/") &&
        !allowedMethods.includes(req.method ?? "")
      )
        throw Object.assign(
          new Error("This route does not accept this HTTP method."),
          { status: 405, code: "METHOD_NOT_ALLOWED" },
        );
      if (
        path.startsWith("/api/") &&
        session &&
        !rateLimiter.take(
          session.csrf +
            (path.startsWith("/api/settings/key")
              ? ":secret"
              : req.method === "GET"
                ? ":read"
                : ":write"),
          path.startsWith("/api/settings/key")
            ? 20
            : req.method === "GET"
              ? 600
              : 120,
        )
      )
        throw Object.assign(
          new Error("Too many local requests. Wait a minute before retrying."),
          { status: 429, code: "RATE_LIMIT" },
        );
      let body: any = {};
      if (!["GET", "HEAD"].includes(req.method ?? "")) {
        const chunks: Buffer[] = [];
        let bytes = 0;
        const bodyLimit = [
          "/api/data/import",
          "/api/data/import/preview",
        ].includes(path)
          ? MAX_BACKUP_REQUEST_BYTES
          : 10000000;
        for await (const chunk of req.iterator({ destroyOnReturn: false })) {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          bytes += buffer.length;
          if (bytes > bodyLimit) {
            req.resume();
            res.setHeader("Connection", "close");
            throw Object.assign(new Error("Request exceeds the size limit."), {
              status: 413,
              code: "REQUEST_TOO_LARGE",
            });
          }
          chunks.push(buffer);
        }
        const raw = Buffer.concat(chunks, bytes).toString("utf8");
        body = JSON.parse(raw || "{}");
      }
      if (path === "/api/lifecycle/stop") {
        send({ stopping: true });
        setTimeout(() => {
          for (const c of active.values()) c.abort();
          store.recover();
          server.close();
          options.onStop?.();
        }, 50);
        return;
      }
      if (path === "/api/health")
        return send({
          database: "ready",
          runner: await runner(),
          platform: process.platform,
          arch: process.arch,
        });
      if (path === "/api/topics")
        return send(
          TopicQuotas.map(([id, name, quota]) => ({
            id,
            name,
            quota,
            count: catalogue.filter((p) => p.primaryTopic === id).length,
            independent: new Set(
              store
                .list("evidence")
                .filter(
                  (e) =>
                    e.outcome === "accepted" &&
                    !e.assisted &&
                    catalogue.find((p) => p.id === e.problemId)
                      ?.primaryTopic === id,
                )
                .map((e) => e.problemId),
            ).size,
            assisted: new Set(
              store
                .list("evidence")
                .filter(
                  (e) =>
                    e.outcome === "accepted" &&
                    e.assisted &&
                    !store
                      .list("evidence")
                      .some(
                        (x) =>
                          x.problemId === e.problemId &&
                          x.outcome === "accepted" &&
                          !x.assisted,
                      ) &&
                    catalogue.find((p) => p.id === e.problemId)
                      ?.primaryTopic === id,
                )
                .map((e) => e.problemId),
            ).size,
          })),
        );
      if (path === "/api/problems") {
        const completion = url.searchParams.get("completion"),
          assistance = url.searchParams.get("assistance"),
          historyLanguage = url.searchParams.get("historyLanguage"),
          bookmarked = url.searchParams.get("bookmarked");
        const entries = store.list("evidence"),
          annotations = store.meta("problemAnnotations") ?? {};
        return send(
          catalogue.filter(
            (p) =>
              (!completion ||
                (completion === "solved"
                  ? entries.some(
                      (e) => e.problemId === p.id && e.outcome === "accepted",
                    )
                  : completion === "unsolved"
                    ? !entries.some(
                        (e) => e.problemId === p.id && e.outcome === "accepted",
                      )
                    : true)) &&
              (!assistance ||
                (assistance === "independent"
                  ? entries.some(
                      (e) =>
                        e.problemId === p.id &&
                        e.outcome === "accepted" &&
                        !e.assisted,
                    )
                  : assistance === "assisted"
                    ? entries.some(
                        (e) =>
                          e.problemId === p.id &&
                          e.outcome === "accepted" &&
                          e.assisted,
                      )
                    : true)) &&
              (!historyLanguage ||
                store
                  .list("jobs")
                  .some(
                    (j) =>
                      j.problemId === p.id && j.language === historyLanguage,
                  )) &&
              (bookmarked !== "true" || annotations[p.id]?.bookmarked) &&
              (!url.searchParams.get("topic") ||
                p.primaryTopic === url.searchParams.get("topic")) &&
              (!url.searchParams.get("q") ||
                `${p.title} ${p.skillIds.join(" ")}`
                  .toLowerCase()
                  .includes(url.searchParams.get("q")!.toLowerCase())),
          ),
        );
      }
      if (path.startsWith("/api/problems/") && path.endsWith("/state")) {
        const id = path.split("/")[3];
        problem(id);
        const all = Object.assign(
          Object.create(null),
          store.meta("problemAnnotations") ?? {},
        );
        const annotation = Object.hasOwn(all, id)
          ? all[id]
          : { bookmarked: false, notes: "", tags: [] };
        if (req.method === "PATCH") {
          const patch = z
            .object({
              bookmarked: z.boolean().optional(),
              notes: z.string().max(30000).optional(),
              tags: z.array(z.string().max(80)).max(20).optional(),
            })
            .strict()
            .parse(body);
          Object.assign(annotation, patch);
          all[id] = annotation;
          store.setMeta("problemAnnotations", all);
        }
        const evidence = store
          .list("evidence")
          .filter((e) => e.problemId === id);
        return send({
          problemId: id,
          ...annotation,
          independent: evidence.some(
            (e) => e.outcome === "accepted" && !e.assisted,
          ),
          assisted: evidence.some(
            (e) => e.outcome === "accepted" && e.assisted,
          ),
          languages: Object.fromEntries(
            ["java", "cpp", "python"].map((l) => [
              l,
              {
                attempts: store
                  .list("jobs")
                  .filter((j) => j.problemId === id && j.language === l).length,
                independent: evidence.some(
                  (e) =>
                    e.language === l && e.outcome === "accepted" && !e.assisted,
                ),
              },
            ]),
          ),
        });
      }
      if (/^\/api\/problems\/[a-z0-9-]+\/learning-metadata$/.test(path)) {
        const id = path.split("/")[3];
        problem(id);
        const version = z
          .string()
          .min(1)
          .max(100)
          .optional()
          .parse(
            url.searchParams.has("version")
              ? url.searchParams.get("version")
              : undefined,
          );
        if (!options.learningMetadata)
          throw Object.assign(
            new Error(
              "Reviewed classifications are unavailable in this development fixture.",
            ),
            { status: 503, code: "LEARNING_METADATA_UNAVAILABLE" },
          );
        return send(
          PublicLearningMetadataSchema.parse(
            await options.learningMetadata(id, { expectedVersion: version }),
          ),
        );
      }
      if (path.startsWith("/api/problems/"))
        return send(
          problem(
            decodeURIComponent(path.slice(14)),
            url.searchParams.get("version") ?? undefined,
          ),
        );
      if (path.startsWith("/api/drafts/")) {
        const [, , , pid, lang] = path.split("/");
        const p = problem(pid);
        if (!["java", "cpp", "python"].includes(lang))
          throw new Error("Invalid language.");
        const existing = store.db
          .prepare(
            "SELECT code,revision,updated AS updatedAt FROM drafts WHERE problem=? AND language=?",
          )
          .get(pid, lang) ?? {
          code: p.starters[lang as "java"],
          revision: 0,
          updatedAt: null,
        };
        if (req.method === "GET") return send(existing);
        const data = DraftSaveSchema.parse(body);
        if (data.revision !== existing.revision)
          throw Object.assign(
            new Error(
              "A newer draft exists in another tab. Reload it before saving.",
            ),
            { status: 409, code: "DRAFT_CONFLICT" },
          );
        const revision = data.revision + 1,
          updatedAt = new Date().toISOString();
        store.db
          .prepare(
            "INSERT INTO drafts VALUES (?,?,?,?,?) ON CONFLICT(problem,language) DO UPDATE SET code=excluded.code,revision=excluded.revision,updated=excluded.updated",
          )
          .run(pid, lang, revision, data.code, updatedAt);
        return send({ code: data.code, revision, updatedAt });
      }
      if (path === "/api/jobs" && req.method === "GET")
        return send(historyPages.jobs(url.searchParams));
      if (path === "/api/jobs" && req.method === "POST") {
        const input = JobRequestSchema.parse(body);
        problem(input.problemId);
        const stateAtRequest = AssessmentStateSchema.safeParse(
          store.meta("assessment"),
        );
        const assessmentTag =
          stateAtRequest.success &&
          stateAtRequest.data.status === "active" &&
          stateAtRequest.data.currentProblemId === input.problemId &&
          stateAtRequest.data.language === input.language &&
          input.mode === "submit" &&
          !input.review
            ? {
                assessmentId: stateAtRequest.data.id,
                assessmentSelectedAt: stateAtRequest.data.currentSelectedAt,
              }
            : {};
        if (
          input.mode === "custom" &&
          options.judge?.validateCustomInput &&
          !(await options.judge.validateCustomInput(
            input.problemId,
            input.customInput,
          ))
        )
          throw Object.assign(
            new Error(
              "Custom input violates the problem input schema or constraints.",
            ),
            { status: 400, code: "INVALID_CUSTOM_INPUT" },
          );
        const old = store.get("jobs", input.idempotencyKey);
        if (old) return send(old);
        const publicSnapshot = problem(input.problemId);
        let executionIdentity: string | undefined;
        if (options.judge?.captureExecutionIdentity) {
          try {
            const captured = ExecutionIdentitySchema.parse(
              await options.judge.captureExecutionIdentity({
                problemId: input.problemId,
                language: input.language,
                expectedPublicSnapshot: publicSnapshot,
              }),
            );
            if (captured.version !== publicSnapshot.version)
              throw new Error("Version changed");
            executionIdentity = captured.identity;
          } catch {
            throw Object.assign(
              new Error(
                "The trusted question pack is unavailable or changed. Restart CodeWise2 to load the validated current version.",
              ),
              { status: 409, code: "CONTENT_IDENTITY_CHANGED" },
            );
          }
        } else if (options.judge && !options.fixture) {
          throw Object.assign(
            new Error(
              "The execution adapter cannot bind trusted content. Update or restart CodeWise2 before submitting.",
            ),
            { status: 503, code: "CONTENT_BINDING_UNAVAILABLE" },
          );
        }
        const racedReplay = store.get("jobs", input.idempotencyKey);
        if (racedReplay) return send(racedReplay);
        if (
          store
            .list("jobs")
            .filter((j) =>
              ["queued", "compiling", "running"].includes(j.status),
            ).length >= 8
        )
          throw Object.assign(new Error("The execution queue is full."), {
            status: 429,
          });
        const job = {
          ...input,
          ...assessmentTag,
          id: randomUUID(),
          status: "queued",
          result: null,
          executionIdentity,
          createdAt: new Date().toISOString(),
          problemSnapshot: publicSnapshot,
          codeHash: hash(input.code),
          attemptHash: hash(normalizeAttemptCode(input.code, input.language)),
          meaningfulConceptualAttempt:
            normalizeAttemptCode(input.code, input.language) !==
            normalizeAttemptCode(
              problem(input.problemId).starters[input.language],
              input.language,
            ),
          attemptHeuristicVersion: ATTEMPT_HEURISTIC_VERSION,
          problemVersion: problem(input.problemId).version,
        };
        store.insert("jobs", job);
        send(job, 202);
        pumpQueue();
        return;
      }
      if (path.startsWith("/api/jobs/")) {
        const id = path.split("/")[3],
          job = store.get("jobs", id);
        if (!job)
          throw Object.assign(new Error("Job not found."), { status: 404 });
        if (path.endsWith("/cancel")) {
          active.get(id)?.abort();
          if (!["queued", "running", "compiling"].includes(job.status))
            return send(job);
          job.status = "canceled";
          job.finishedAt = new Date().toISOString();
          store.update("jobs", job);
        }
        return send(job);
      }
      if (path === "/api/learning/select") {
        const input = z
          .object({ problemId: z.string(), mode: z.enum(["manual", "review"]) })
          .strict()
          .parse(body);
        problem(input.problemId);
        store.setMeta("currentSelection", {
          ...input,
          selectedAt: new Date().toISOString(),
        });
        return send({ selected: true, ...input });
      }
      if (path === "/api/assessment") return send(assessmentState());
      if (path === "/api/assessment/start") {
        const input = AssessmentStartSchema.parse(body);
        const assessment = startAssessment(
          catalogue,
          input.language,
          input.experience,
          new Date().toISOString(),
          fixtureIds,
        );
        store.setMeta("assessment", assessment);
        return send(assessment);
      }
      if (path === "/api/assessment/stop") {
        const current = assessmentState();
        const a = stopAssessment(
          current,
          new Date().toISOString(),
          catalogue,
          currentAssessmentJobs(current) as any,
        );
        store.setMeta("assessment", a);
        return send(a);
      }
      if (path === "/api/assessment/next") {
        const a = assessmentState();
        if (!a || a.status !== "active")
          throw new Error("Start an assessment first.");
        const jobs = currentAssessmentJobs(a);
        const next = advanceAssessment(
          a,
          catalogue,
          jobs as any,
          new Date().toISOString(),
          fixtureIds,
        );
        store.setMeta("assessment", next);
        return send(next);
      }
      if (path === "/api/progress")
        return send(ProgressSchema.parse(progress()));
      if (path === "/api/recommendation") {
        const requestedLanguage = LanguageSchema.parse(
          url.searchParams.get("language") ??
            store.meta("preferences").language,
        );
        let pending = store.meta("pendingChallenge");
        let resolvedFocus: string | undefined;
        if (
          pending &&
          store
            .list("evidence")
            .some(
              (e) =>
                e.outcome === "accepted" &&
                !e.review &&
                e.advancementEligible !== false &&
                e.problemId !== pending.sourceProblemId &&
                ![...(pending.teacherIds ?? []), pending.teacherId].includes(
                  e.problemId,
                ) &&
                Date.parse(e.createdAt) >= Date.parse(pending.createdAt) &&
                e.step >= pending.step &&
                (pending.resumeMode !== "same_step_checkpoint" ||
                  (e.step === pending.step &&
                    (
                      catalogue.find((p) => p.id === pending.sourceProblemId)
                        ?.checkpointIds ?? []
                    ).includes(e.problemId))) &&
                catalogue.find((p) => p.id === e.problemId)?.primaryTopic ===
                  pending.topic,
            )
        ) {
          resolvedFocus = pending.topic;
          store.setMeta("pendingChallenge", null);
          pending = null;
        }
        const r = recommend(
          catalogue,
          learningEvidence(),
          requestedLanguage,
          url.searchParams.get("topic") ??
            resolvedFocus ??
            (pending
              ? undefined
              : (store.meta("preferences").focusTopic ??
                catalogue.find(
                  (p) => p.id === store.meta("currentSelection")?.problemId,
                )?.primaryTopic ??
                undefined)),
          store.db
            .prepare(
              "SELECT DISTINCT problem FROM assistance WHERE kind='solution'",
            )
            .all()
            .map((r) => String(r.problem)),
          pending ?? undefined,
          fixtureIds,
        );
        if (r.pendingStep)
          store.setMeta("pendingChallenge", {
            topic: r.focusTopic,
            step: r.pendingStep,
            sourceProblemId: r.sourceProblemId,
            teacherId: r.problemId,
            teacherIds: [
              ...new Set(
                [
                  ...(pending?.teacherIds ?? []),
                  pending?.teacherId,
                  r.problemId,
                ].filter(Boolean),
              ),
            ].slice(-64),
            resumeMode: r.pendingMode ?? pending?.resumeMode ?? "next_step",
            createdAt: pending?.createdAt ?? new Date().toISOString(),
          });
        const selectedProblem = catalogue.find(
          (p: any) => p.id === r.problemId,
        );
        const publicRecommendation = {
          ...r,
          learningRequirement: selectedProblem
            ? [selectedProblem.objective, selectedProblem.learnerRationale]
                .filter(Boolean)
                .join(" ")
                .slice(0, 2000)
            : undefined,
        };
        store.db
          .prepare("INSERT INTO recommendations VALUES (?,?)")
          .run(randomUUID(), JSON.stringify(publicRecommendation));
        const preference = store.meta("preferences").reviewPreference;
        const dueReviews = progress().reviewQueue.length;
        const first =
          dueReviews > 0 &&
          (preference === "review-first" ||
            (preference === "balanced" && dueReviews >= 3))
            ? "review"
            : "challenge";
        return send(
          RecommendationSchema.parse({
            ...publicRecommendation,
            practicePresentation: {
              ruleVersion: "learning-settings-1",
              preference,
              first,
              dueReviews,
              reason:
                first === "review"
                  ? "Due review practice is shown first by your saved review preference; the next challenge remains available."
                  : "The next challenge is shown first; due reviews remain separately available.",
            },
          }),
        );
      }
      if (path === "/api/settings" && req.method === "GET")
        return send({
          preferences: store.meta("preferences"),
          key: keyMeta(),
          models: configuredModels(),
          usage: { ...usageLedger.summary(), pricingSnapshot },
        });
      if (path === "/api/settings" && req.method === "PUT") {
        const prefs = PreferencesSchema.parse({
          ...store.meta("preferences"),
          ...body,
        });
        new Intl.DateTimeFormat("en", { timeZone: prefs.timezone });
        if (prefs.model && !configuredModels().includes(prefs.model))
          throw new Error(
            "Choose a model returned by a successful connection test.",
          );
        store.setMeta("preferences", prefs);
        return send({
          preferences: prefs,
          key: keyMeta(),
          models: configuredModels(),
        });
      }
      if (path === "/api/settings/key/test") {
        const input = z
          .object({ key: z.string().min(8).max(500).optional() })
          .strict()
          .parse(body);
        const key = input.key ?? secrets.read();
        if (!key)
          throw new ProviderError("NO_KEY", "Enter a DeepSeek key first.");
        const testedVersion = keyMeta().version;
        let models: string[];
        try {
          models = await provider.models(key);
        } catch (e) {
          if (!input.key && keyMeta().version === testedVersion) {
            const status =
              e instanceof ProviderError
                ? e.code === "INVALID_KEY"
                  ? "invalid"
                  : e.code === "UNREACHABLE"
                    ? "unreachable"
                    : e.code === "RATE_LIMIT"
                      ? "rate_limited"
                      : "access_issue"
                : "unreachable";
            store.setMeta("keyMetadata", {
              ...keyMeta(),
              status,
              lastTestedAt: new Date().toISOString(),
            });
          }
          throw e;
        }
        const checkedAt = new Date().toISOString();
        if (input.key)
          testedCandidates.set(hash(input.key), { models, at: checkedAt });
        else if (keyMeta().version === testedVersion) {
          store.setMeta("modelCapabilities", {
            keyVersion: testedVersion,
            models,
            checkedAt,
          });
          store.setMeta("keyMetadata", {
            ...keyMeta(),
            status: "verified",
            lastChecked: checkedAt,
            lastTestedAt: checkedAt,
          });
        }
        return send({
          status: "verified",
          models,
          message:
            "Model listing succeeded. Tutor generation has not been tested.",
        });
      }
      if (path === "/api/settings/key" && req.method === "PUT") {
        const input = z
          .object({
            key: z.string().min(8).max(500),
            replace: z.boolean().optional(),
          })
          .strict()
          .parse(body);
        if (keyMeta().configured && !input.replace)
          throw Object.assign(
            new Error("Confirm intentional key replacement."),
            { status: 409 },
          );
        secrets.save(input.key);
        const candidate = testedCandidates.get(hash(input.key));
        const recent =
          candidate && Date.now() - Date.parse(candidate.at) < 600000;
        const version = randomUUID();
        store.setMeta(
          "modelCapabilities",
          recent
            ? {
                keyVersion: version,
                models: candidate.models,
                checkedAt: candidate.at,
              }
            : null,
        );
        store.setMeta("preferences", {
          ...store.meta("preferences"),
          model: "",
        });
        store.setMeta("keyMetadata", {
          version,
          configured: true,
          masked: `••••${input.key.slice(-4)}`,
          status: recent ? "verified" : "saved_unverified",
          lastChecked: recent ? candidate.at : null,
        });
        return send(keyMeta());
      }
      if (path === "/api/settings/key" && req.method === "DELETE") {
        if (body.confirmation !== "REMOVE")
          throw new Error("Confirm key removal.");
        for (const [id, c] of active)
          if (store.get("generations", id)) c.abort();
        secrets.remove();
        store.setMeta("modelCapabilities", null);
        store.setMeta("preferences", {
          ...store.meta("preferences"),
          model: "",
        });
        store.setMeta("keyMetadata", {
          configured: false,
          masked: "",
          status: "unconfigured",
          lastChecked: null,
        });
        return send(keyMeta());
      }
      if (
        (path === "/api/tutor" || path === "/api/settings/tutor-test") &&
        req.method === "POST"
      ) {
        const isTest = path.endsWith("tutor-test");
        if (isTest && body.consent !== true)
          throw new Error("Confirm potentially billable connection test.");
        const input = TutorRequestSchema.parse(
          isTest
            ? {
                problemId: "settings-connection-test",
                language: store.meta("preferences").language,
                code: "",
                action: "followup",
                prompt: "Explain what an array is in two simple sentences.",
                consent: true,
                idempotencyKey: randomUUID(),
              }
            : body,
        );
        const p = isTest
          ? {
              id: input.problemId,
              version: "1",
              title: "DeepSeek tutor connection test",
            }
          : problem(input.problemId);
        const old = store.get("generations", input.idempotencyKey);
        if (old) return send(publicGeneration(old));
        if (usageLedger.findIdempotency(input.idempotencyKey))
          throw Object.assign(
            new Error(
              "That request already exists in retained usage history. Start an explicit new generation with a new request ID.",
            ),
            { status: 409, code: "IDEMPOTENCY_RETAINED" },
          );
        const submission = input.submissionId
          ? store.get("jobs", input.submissionId)
          : null;
        if (
          input.submissionId &&
          (!submission ||
            submission.problemId !== input.problemId ||
            submission.language !== input.language)
        )
          throw new Error(
            "Submission context does not match this problem and language.",
          );
        const parent = input.parentId
          ? store.get("generations", input.parentId)
          : null;
        if (
          input.parentId &&
          (!parent || parent.deletedAt || parent.problemId !== input.problemId)
        )
          throw new Error(
            "This parent lesson is missing or belongs to another problem.",
          );
        if (
          submission?.problemVersion &&
          submission.problemVersion !== p.version
        )
          throw new Error(
            "The submission belongs to an older problem version. Open its archived saved lesson or start a new request for the current problem.",
          );
        const threadId = input.threadId ?? parent?.threadId ?? randomUUID();
        if (parent && parent.threadId !== threadId)
          throw new Error(
            "The parent lesson does not belong to this conversation.",
          );
        if (
          input.threadId &&
          store
            .list("generations")
            .some(
              (g) => g.threadId === threadId && g.problemId !== input.problemId,
            )
        )
          throw new Error(
            "Continue this conversation with its original associated problem.",
          );
        if (
          store
            .list("generations")
            .some(
              (g) =>
                g.threadId === threadId &&
                ["queued", "streaming"].includes(g.status),
            )
        )
          throw Object.assign(
            new Error("This conversation already has an active response."),
            { status: 409 },
          );
        let reference: any = null;
        if (
          !isTest &&
          input.action === "solution" &&
          options.judge?.getVerifiedReference
        ) {
          try {
            const candidate = VerifiedReferenceResultSchema.parse(
              await options.judge.getVerifiedReference(
                input.problemId,
                input.language,
                { expectedPublicSnapshot: p },
              ),
            );
            if (
              candidate.available &&
              candidate.language === input.language &&
              candidate.version === p.version
            )
              reference = candidate;
          } catch {
            reference = null;
          }
          const raced = store.get("generations", input.idempotencyKey);
          if (raced) return send(publicGeneration(raced));
          if (usageLedger.findIdempotency(input.idempotencyKey))
            throw Object.assign(
              new Error(
                "This request already exists in retained usage history.",
              ),
              { status: 409, code: "IDEMPOTENCY_RETAINED" },
            );
          if (
            store
              .list("generations")
              .some(
                (g) =>
                  g.threadId === threadId &&
                  ["queued", "streaming"].includes(g.status),
              )
          )
            throw Object.assign(
              new Error("This conversation already has an active response."),
              { status: 409 },
            );
        }
        const prefs = store.meta("preferences"),
          daily = usageLedger.day(prefs.timezone);
        // Reject incomplete setup before saving a generation or reserving usage.
        if (!(options.fixture && options.tutorFixture) && !secrets.read())
          throw Object.assign(
            new ProviderError("NO_KEY", "Add your DeepSeek key in Settings."),
            { status: 409 },
          );
        if (!prefs.model)
          throw Object.assign(
            new ProviderError(
              "NO_MODEL",
              "Test your key and choose an available model in Settings.",
            ),
            { status: 409 },
          );
        if (daily.length >= prefs.dailyRequests)
          throw Object.assign(
            new Error("Your local tutor request limit is reached."),
            { status: 429, code: "BUDGET_LIMIT" },
          );
        const snapshot = isTest
          ? {
              id: "settings-connection-test",
              version: "1",
              statement:
                "Explain what an array is in two simple sentences. Do not provide code.",
              constraints: [],
              visibleCases: [],
            }
          : problem(input.problemId);
        const resolvedCode = submission?.code ?? input.code;
        const prepared = prepareTutorContext({
          problem: {
            id: snapshot.id,
            version: snapshot.version,
            statement: snapshot.statement,
            constraints: snapshot.constraints,
            visibleCases: snapshot.visibleCases,
          },
          language: input.language,
          code: resolvedCode,
          action: input.action,
          prompt: input.prompt,
          judgeFeedback: submission?.result ?? null,
          knownSkills: isTest
            ? []
            : summarizeTutorSkills(
                [...snapshot.skillIds, ...snapshot.prerequisites],
                store.list("evidence"),
              ),
          parent,
          hintDepth: prefs.defaultHintDepth,
          verifiedReference: reference
            ? {
                code: reference.code,
                language: reference.language,
                version: reference.version,
                executionIdentity: reference.validationIdentity,
              }
            : null,
          prior: store
            .list("generations")
            .filter((g) => g.threadId === threadId && g.status === "complete"),
        });
        const inputBudgetTokens = prepared.inputBudgetTokens;
        const outputLimit = isTest
          ? 128
          : tutorOutputPolicy(
              input.action,
              prefs.maxOutputTokens,
              prefs.defaultHintDepth,
            ).maxOutputTokens;
        if (inputBudgetTokens > 250000)
          throw new Error(
            "This tutor context exceeds the safe input budget. Start a new conversation or shorten the code.",
          );
        if (
          daily.reduce((n, row) => n + UsageLedger.tokens(row), 0) +
            inputBudgetTokens +
            outputLimit >
          prefs.dailyTokens
        )
          throw Object.assign(
            new Error(
              "The conservative local token cap would be exceeded. Shorten the context or adjust Usage settings.",
            ),
            { status: 429, code: "TOKEN_LIMIT" },
          );
        const reserveCost = estimateCost(
          prefs.model,
          inputBudgetTokens,
          outputLimit,
        );
        const spent = daily.reduce((n, row) => n + UsageLedger.cost(row), 0);
        if (
          prefs.dailySpendUsd != null &&
          (reserveCost == null || spent + reserveCost > prefs.dailySpendUsd)
        )
          throw Object.assign(
            new Error(
              reserveCost == null
                ? "A verified pricing snapshot is unavailable for this model; disable the local spend cap or select a documented model."
                : "The conservative local tutor spend cap would be exceeded.",
            ),
            { status: 429, code: "SPEND_LIMIT" },
          );
        const generation = {
          sourceResultSnapshot: submission?.result ?? null,
          contextHash: hash(JSON.stringify(prepared.messages)),
          reservedCostUsd: reserveCost,
          estimatedCostUsd: null,
          pricingSnapshotDate: pricingSnapshot.checkedAt,
          inputBudgetTokens,
          maxOutputTokens: outputLimit,
          hintDepth:
            input.action === "hint" ? prefs.defaultHintDepth : undefined,
          referenceProvenance: reference
            ? {
                language: reference.language,
                version: reference.version,
                validationIdentity: reference.validationIdentity,
                verifiedAt: reference.verifiedAt,
                runtimeIdentity: reference.runtimeIdentity,
                basis: "historical-full-reference-execution",
              }
            : undefined,
          contextMessages: prepared.messages,
          ...input,
          code: submission?.code ?? input.code,
          id: randomUUID(),
          threadId,
          problemVersion: p.version,
          problemSnapshot: isTest ? undefined : problem(input.problemId),
          title: `${p.title} · ${input.action}`,
          status: "queued",
          markdown: "",
          document: null,
          bookmarked: false,
          notes: "",
          tags: [],
          createdAt: new Date().toISOString(),
          provider:
            options.fixture && options.tutorFixture ? "fixture" : "deepseek",
          model: prefs.model,
          promptVersion: TUTOR_PROMPT_VERSION,
          rendererVersion: 1,
          schemaVersion: 1,
          usage: null,
          verification: "not-run",
          version:
            store.list("generations").filter((g) => g.threadId === threadId)
              .length + 1,
        };
        store.tx(() => {
          store.insert("generations", generation);
          usageLedger.reserve(generation, outputLimit);
        });
        send(
          {
            ...publicGeneration(generation),
            ...(isTest
              ? {
                  message:
                    "Tutor test started. The saved output and truthful status will appear in Learning Library.",
                }
              : {}),
          },
          202,
        );
        void tutor(generation);
        return;
      }
      if (path.startsWith("/api/tutor/")) {
        const id = path.split("/")[3],
          g = store.get("generations", id);
        if (!g)
          throw Object.assign(new Error("Saved answer not found."), {
            status: 404,
          });
        if (path.endsWith("/events")) {
          res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
          });
          const after = Number(
            url.searchParams.get("after") ?? req.headers["last-event-id"] ?? 0,
          );
          for (const e of store.replay(
            id,
            Number.isSafeInteger(after) ? after : 0,
          ))
            res.write(
              `id: ${e.seq}\ndata: ${JSON.stringify(TutorStreamEventSchema.parse(e))}\n\n`,
            );
          const set = listeners.get(id) ?? new Set();
          set.add(res);
          listeners.set(id, set);
          req.on("close", () => set.delete(res));
          return;
        }
        if (path.endsWith("/cancel")) {
          if (!["queued", "streaming"].includes(g.status))
            return send(publicGeneration(g));
          streamFlushers.get(id)?.();
          Object.assign(g, store.get("generations", id));
          active.get(id)?.abort();
          g.status = "canceled";
          g.finishedAt = new Date().toISOString();
          store.tx(() => {
            store.update("generations", g);
            usageLedger.finalize(g);
            emit(g.id, { type: "status", status: "canceled" });
          });
        }
        return send(publicGeneration(g));
      }
      if (path === "/api/library") {
        const page = historyPages.library(url.searchParams);
        store.tx(() => {
          for (const summary of page.items)
            if (
              summary.problemId !== "settings-connection-test" &&
              summary.preview
            )
              store.assistance(
                summary.problemId,
                summary.action === "solution" || summary.action === "idea_map"
                  ? "solution"
                  : summary.action === "walkthrough"
                    ? "walkthrough"
                    : "hint",
              );
        });
        return send(page);
      }
      if (path.startsWith("/api/library/")) {
        const id = path.split("/")[3],
          g = store.get("generations", id);
        if (!g || g.deletedAt)
          throw Object.assign(new Error("Saved lesson not found."), {
            status: 404,
          });
        if (
          req.method === "GET" &&
          g.markdown &&
          g.problemId !== "settings-connection-test"
        )
          store.assistance(
            g.problemId,
            g.action === "solution" || g.action === "idea_map"
              ? "solution"
              : g.action === "walkthrough"
                ? "walkthrough"
                : "hint",
          );
        if (path.endsWith("/export")) {
          if (url.searchParams.get("format") === "markdown") {
            res.writeHead(200, {
              "Content-Type": "text/markdown; charset=utf-8",
              "Content-Disposition": `attachment; filename="lesson-${id}.md"`,
            });
            return res.end(g.markdown);
          }
          return send(publicGeneration(g));
        }
        if (req.method === "PATCH") {
          const patch = z
            .object({
              bookmarked: z.boolean().optional(),
              notes: z.string().max(30000).optional(),
              tags: z.array(z.string().max(80)).max(20).optional(),
            })
            .strict()
            .parse(body);
          Object.assign(g, patch);
          g.updatedAt = new Date().toISOString();
          store.update("generations", g);
        }
        if (req.method === "DELETE") {
          if (body.confirmation !== "DELETE")
            throw new Error("Confirm lesson deletion.");
          active.get(id)?.abort();
          if (["queued", "streaming"].includes(g.status)) {
            g.status = "canceled";
            g.finishedAt = new Date().toISOString();
            usageLedger.finalize(g);
          }
          g.deletedAt = new Date().toISOString();
          g.markdown = "";
          g.prompt = "";
          g.code = "";
          g.document = null;
          g.notes = "";
          g.tags = [];
          g.contextMessages = undefined;
          g.sourceResultSnapshot = null;
          store.tx(() => {
            store.update("generations", g);
            store.db.prepare("DELETE FROM events WHERE generation=?").run(id);
          });
        }
        return send(publicGeneration(g));
      }
      if (path === "/api/data/export") {
        const b = BackupSchema.parse(backup());
        return send(b, 200, serializeBoundedBackup(b));
      }
      if (path === "/api/data/import/preview" || path === "/api/data/import") {
        serializeBoundedBackup(body.backup);
        const b = BackupSchema.parse(body.backup);
        serializeBoundedBackup(b);
        const token = hash(JSON.stringify(b));
        const counts = {
          drafts: b.drafts.length,
          jobs: b.jobs.length,
          lessons: b.generations.length,
          evidence: b.evidence.length,
        };
        if (path.endsWith("/preview"))
          return send({
            counts,
            token,
            message:
              "Restore replaces learning data and preferences. The saved DeepSeek key is excluded.",
          });
        if (body.confirmation !== "RESTORE" || body.token !== token)
          throw new Error("Confirm the exact previewed backup.");
        if (active.size)
          throw Object.assign(
            new Error("Cancel active jobs before restoring."),
            { status: 409 },
          );
        writeFileSync(
          join(options.dataDir, `pre-restore-${Date.now()}.json`),
          serializeBoundedBackup(BackupSchema.parse(backup())),
          { mode: 0o600 },
        );
        store.tx(() => {
          store.db.exec(
            "DELETE FROM events; DELETE FROM generations; DELETE FROM jobs; DELETE FROM drafts; DELETE FROM assistance; DELETE FROM evidence; DELETE FROM recommendations;",
          );
          store.setMeta("preferences", b.preferences);
          store.setMeta("assessment", b.learningMetadata.assessment);
          store.setMeta(
            "currentSelection",
            b.learningMetadata.currentSelection,
          );
          store.setMeta(
            "problemAnnotations",
            b.learningMetadata.problemAnnotations,
          );
          store.setMeta("problemVersions", b.learningMetadata.problemVersions);
          store.setMeta(
            "pendingChallenge",
            b.learningMetadata.pendingChallenge,
          );
          for (const d of b.drafts)
            store.db
              .prepare("INSERT INTO drafts VALUES (?,?,?,?,?)")
              .run(d.problem, d.language, d.revision, d.code, d.updated);
          for (const j of b.jobs) store.insert("jobs", j);
          for (const g of b.generations) store.insert("generations", g);
          for (const e of b.events)
            store.db
              .prepare("INSERT INTO events VALUES (?,?,?)")
              .run(e.generation, e.seq, e.data);
          for (const a of b.assistance)
            store.db
              .prepare("INSERT INTO assistance VALUES (?,?,?,?)")
              .run(a.id, a.problem, a.kind, a.created);
          for (const t of ["evidence", "recommendations"] as const)
            for (const e of b[t]) {
              if (typeof e.id !== "string") e.id = randomUUID();
              store.db
                .prepare(`INSERT INTO ${t} VALUES (?,?)`)
                .run(String(e.id), JSON.stringify(e));
            }
          usageLedger.merge(b.usageLedger);
          store.recover();
        });
        historyPages.invalidate();
        return send({ restored: true, counts });
      }
      if (path === "/api/data/history/reset") {
        if (body.confirmation !== "DELETE ALL LESSONS")
          throw new Error(
            "Confirm deletion of all saved lessons, versions and lesson notes. Progress, minimal assistance evidence, usage accounting and credentials remain.",
          );
        const count = store.list("generations").length;
        for (const [id, c] of active)
          if (store.get("generations", id)) c.abort();
        for (const set of listeners.values())
          for (const response of set) response.end();
        listeners.clear();
        store.tx(() => {
          for (const g of store.list("generations"))
            if (["queued", "streaming"].includes(g.status)) {
              g.status = "canceled";
              g.finishedAt = new Date().toISOString();
              usageLedger.finalize(g);
            }
          store.db.exec("DELETE FROM events;DELETE FROM generations;");
        });
        historyPages.invalidate();
        return send({
          deletedLessons: count,
          preserved: [
            "progress",
            "assistance evidence",
            "credentials",
            "drafts",
            "problem notes",
            "usage accounting and budget reservations",
          ],
        });
      }
      if (path === "/api/data/reset") {
        if (body.confirmation !== "RESET PROGRESS")
          throw new Error("Confirm progress reset.");
        store.tx(() =>
          store.db.exec(
            "DELETE FROM evidence; DELETE FROM recommendations; DELETE FROM assistance;",
          ),
        );
        store.setMeta("pendingChallenge", null);
        store.setMeta("currentSelection", null);
        store.setMeta("assessment", null);
        return send({ reset: true });
      }
      if (path === "/api/sources")
        return send(
          options.sources
            ? sourceReviewRows(options.sources)
            : catalogue.map((p) => ({
                problemId: p.id,
                sourceIds: p.sourceIds,
                originType: options.fixture ? "test-fixture" : "unknown",
                note: options.fixture
                  ? "Excluded from release question bank"
                  : "See pinned content provenance record",
              })),
        );
      if (path.startsWith("/api/"))
        throw Object.assign(new Error("API route not found."), { status: 404 });
      const root = resolve("dist/web"),
        file = resolve(
          root,
          path === "/" ? "index.html" : `.${decodeURIComponent(path)}`,
        );
      if (
        !file.startsWith(root + "\\") &&
        !file.startsWith(root + "/") &&
        file !== join(root, "index.html")
      )
        throw Object.assign(new Error("Invalid path."), { status: 403 });
      const actual = existsSync(file) ? file : join(root, "index.html");
      if (existsSync(actual)) {
        res.writeHead(200, {
          "Content-Type":
            (
              {
                ".html": "text/html",
                ".js": "application/javascript",
                ".css": "text/css",
                ".svg": "image/svg+xml",
                ".woff2": "font/woff2",
              } as any
            )[extname(actual)] ?? "application/octet-stream",
          "X-Content-Type-Options": "nosniff",
        });
        res.end(readFileSync(actual));
      } else {
        res.writeHead(503, { "Content-Type": "text/plain" });
        res.end("Frontend build pending. Run npm run build.");
      }
    } catch (e: any) {
      const validation = e instanceof z.ZodError;
      send(
        {
          code: e.code ?? (validation ? "VALIDATION_ERROR" : "REQUEST_FAILED"),
          message: validation
            ? "Request did not match the API schema."
            : e instanceof ProviderError
              ? e.message
              : e.status
                ? e.message
                : "The request could not be completed. Check your input and retry.",
          recoveryAction: ["NO_KEY", "NO_MODEL"].includes(e.code)
            ? "Open AI & DeepSeek in Settings to finish tutor setup, then retry."
            : "Correct the input or reload the local application.",
          requestId,
        },
        e.status ?? (e instanceof ProviderError ? 502 : 400),
      );
    }
  });
  return {
    server,
    store,
    secrets,
    close: () => {
      if (closing) return;
      for (const flush of streamFlushers.values()) {
        try {
          flush();
        } catch {
          /* Failed commits remain unacknowledged. */
        }
      }
      closing = true;
      store.recover();
      for (const c of active.values()) c.abort();
      for (const set of listeners.values()) for (const res of set) res.end();
      server.close();
      store.close();
    },
  };
}
