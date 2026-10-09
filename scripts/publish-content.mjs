import { z } from "zod";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  existsSync,
  unlinkSync,
  openSync,
  closeSync,
} from "node:fs";
import { resolve, join, relative, isAbsolute } from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import deliveryScope from "../packages/contracts/src/delivery-scope.json" with { type: "json" };
import {
  getPrivatePack,
  referenceReceiptMatches,
} from "../packages/judge-adapter/src/content.mjs";
import {
  packIdentity,
  assertPublicationReviews,
} from "../packages/judge-adapter/src/pack-validation.mjs";
import { canonicalJson } from "../packages/judge-adapter/src/canonical.mjs";
const HEX = /^[a-f0-9]{64}$/,
  hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const GlobalPublicationApprovalSchema = z
  .object({
    schemaVersion: z.literal(1),
    status: z.literal("passed"),
    reviewer: z.string().min(1),
    reviewedAt: z.string().datetime(),
    contentMapHash: z.string().regex(HEX),
    taskReviewIds: z
      .array(z.string().regex(/^[a-z0-9-]+$/))
      .length(deliveryScope.questionTarget),
    runtimeIdentity: z.string().regex(HEX),
    curriculumEvidence: z
      .object({ path: z.string().min(1), sha256: z.string().regex(HEX) })
      .strict(),
  })
  .passthrough();
const workspace = process.cwd(),
  journalPath = resolve("content/publication-journal.json"),
  approvalPath = resolve("content/global-review.json"),
  reportPath = resolve("docs/release-evidence/publication-plan.json");
function safeRelative(path) {
  const name = relative(workspace, resolve(path));
  if (name.startsWith("..") || isAbsolute(name))
    throw Error("Path outside publication workspace");
  return name.replaceAll("\\", "/");
}
function atomic(path, bytes) {
  mkdirSync(resolve(path, ".."), { recursive: true });
  const temp = path + "." + randomUUID() + ".tmp";
  try {
    writeFileSync(temp, bytes); // Replacement bytes remain in the same verified directory.
  } catch (error) {
    if (existsSync(temp)) unlinkSync(temp);
    throw error;
  }
  return temp;
}
// No credentials, learner databases or source/test bytes are changed: only manifest/validation statuses and catalogue.
function writeAtomic(path, bytes) {
  const temp = atomic(path, bytes);
  try {
    const { renameSync } = requireFs;
    renameSync(temp, path);
  } finally {
    if (existsSync(temp)) unlinkSync(temp);
  }
}
import * as requireFs from "node:fs";
function json(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
function allowed(path) {
  return (
    path === "content/catalogue.json" ||
    /^content\/problems\/[a-z0-9-]+\/(?:problem|validation)\.json$/.test(path)
  );
}
function restore(journal) {
  const backup = resolve(journal.backup),
    base = resolve(".runtime/publication-backups"),
    inside = relative(base, backup);
  if (inside.startsWith("..") || isAbsolute(inside) || !inside)
    throw Error("Unsafe publication backup path");
  for (const item of journal.files) {
    if (!allowed(item.path)) throw Error("Unexpected recovery target");
    const bytes = readFileSync(join(backup, item.path));
    if (hash(bytes) !== item.sha256) throw Error("Backup identity mismatch");
    writeAtomic(resolve(item.path), bytes);
  }
  unlinkSync(journalPath);
}
async function plan(runtimeIdentity) {
  if (!HEX.test(runtimeIdentity ?? ""))
    throw Error("Explicit approved --runtime=<64hex> is required");
  const catalogue = json("content/catalogue.json"),
    failures = [],
    packs = [],
    counts = {};
  if (
    catalogue.problems.length !== deliveryScope.questionTarget ||
    new Set(catalogue.problems.map((p) => p.id)).size !==
      deliveryScope.questionTarget
  )
    failures.push("Question scope/count mismatch");
  for (const entry of catalogue.problems) {
    try {
      const p = await getPrivatePack(entry.id),
        identity = packIdentity(p);
      counts[p.manifest.primaryTopic] =
        (counts[p.manifest.primaryTopic] ?? 0) + 1;
      await assertPublicationReviews(p, p.root);
      for (const language of deliveryScope.languages) {
        const receipt = json(
          `docs/release-evidence/validation-${entry.id}-${language}.json`,
        );
        if (
          receipt.runtimeIdentity !== runtimeIdentity ||
          !(await referenceReceiptMatches(p, language, receipt))
        )
          throw Error(
            "Missing/stale full current-runtime " + language + " receipt",
          );
      }
      packs.push({
        id: entry.id,
        contentIdentity: identity,
        version: p.manifest.version,
        hidden: p.hiddenCases.length,
        visible: p.visibleCases.length,
      });
    } catch (error) {
      failures.push(entry.id + ": " + error.message);
    }
  }
  for (const [id, , quota] of deliveryScope.topics)
    if (counts[id] !== quota) failures.push("Topic quota mismatch: " + id);
  const futureCatalogue = {
      ...catalogue,
      problems: catalogue.problems.map((entry) => ({
        ...entry,
        status: "published",
      })),
    },
    contentMap = packs
      .map((p) => [p.id, p.contentIdentity])
      .sort((a, b) => a[0].localeCompare(b[0]));
  const curriculumPath =
      "docs/release-evidence/authored-curriculum-final-learning5.json",
    curriculumBytes = readFileSync(curriculumPath),
    curriculum = JSON.parse(curriculumBytes);
  if (
    curriculum.problemCount !== deliveryScope.questionTarget ||
    curriculum.releasePassed !== true ||
    curriculum.sourceChangedDuringAudit ||
    curriculum.emptyFocusedEntries?.length !== deliveryScope.topics.length
  )
    failures.push("Final release curriculum gate missing/failed");
  for (const p of packs) {
    const actual = readFileSync(`content/problems/${p.id}/problem.json`);
    if (curriculum.sourceHashes?.[p.id] !== hash(actual))
      failures.push(p.id + ": curriculum manifest changed");
  }
  const report = {
    schemaVersion: 1,
    command:
      "node scripts/publish-content.mjs --preflight --runtime=" +
      runtimeIdentity,
    generatedAt: new Date().toISOString(),
    passed: failures.length === 0,
    runtimeIdentity,
    questionTarget: deliveryScope.questionTarget,
    languagePairs: packs.length * deliveryScope.languages.length,
    contentMapHash: hash(
      canonicalJson({ catalogue: futureCatalogue, contentMap }),
    ),
    taskReviewIds: packs.map((p) => p.id).sort(),
    packs,
    curriculumEvidence: { path: curriculumPath, sha256: hash(curriculumBytes) },
    failures,
    approvalSchema: {
      required: [
        "schemaVersion",
        "status",
        "reviewer",
        "reviewedAt",
        "contentMapHash",
        "taskReviewIds",
        "runtimeIdentity",
        "curriculumEvidence",
      ],
    },
    limitations: [
      "This preflight performs no publication, inference or native dispatch.",
      "Root independent global approval is required before status mutation.",
    ],
  };
  mkdirSync(resolve(reportPath, ".."), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  return { report, futureCatalogue };
}
async function main() {
  if (process.argv.includes("--recover")) {
    if (!existsSync(journalPath)) throw Error("No pending publication journal");
    restore(json(journalPath));
    console.log(
      "Publication status rollback completed; no process was killed.",
    );
    return;
  }
  if (existsSync(journalPath))
    throw Error(
      "Pending publication journal: use explicit --recover before any new publication",
    );
  const runtime = process.argv
      .find((arg) => arg.startsWith("--runtime="))
      ?.slice(10),
    { report, futureCatalogue } = await plan(runtime);
  console.log(
    JSON.stringify({
      passed: report.passed,
      packs: report.packs.length,
      contentMapHash: report.contentMapHash,
      failures: report.failures,
      report: safeRelative(reportPath),
    }),
  );
  if (!report.passed) {
    process.exitCode = 1;
    return;
  }
  if (!process.argv.includes("--publish")) return;
  const approval = GlobalPublicationApprovalSchema.parse(json(approvalPath));
  if (
    approval.contentMapHash !== report.contentMapHash ||
    approval.runtimeIdentity !== runtime ||
    canonicalJson([...new Set(approval.taskReviewIds)].sort()) !==
      canonicalJson(report.taskReviewIds) ||
    approval.curriculumEvidence.path !== report.curriculumEvidence.path ||
    approval.curriculumEvidence.sha256 !== report.curriculumEvidence.sha256
  )
    throw Error(
      "Independent global approval is missing/stale for this exact prospective publication",
    );
  const paths = [
      "content/catalogue.json",
      ...report.packs.flatMap((p) => [
        `content/problems/${p.id}/problem.json`,
        `content/problems/${p.id}/validation.json`,
      ]),
    ],
    backup = resolve(
      ".runtime/publication-backups",
      new Date().toISOString().replaceAll(/[:.]/g, "-") + "-" + randomUUID(),
    );
  mkdirSync(backup, { recursive: true });
  const files = paths.map((path) => ({
    path,
    sha256: hash(readFileSync(path)),
  }));
  for (const item of files) {
    const destination = join(backup, item.path);
    mkdirSync(resolve(destination, ".."), { recursive: true });
    copyFileSync(resolve(item.path), destination);
  }
  const journal = {
    schemaVersion: 1,
    backup,
    files,
    createdAt: new Date().toISOString(),
    contentMapHash: report.contentMapHash,
  };
  const fd = openSync(journalPath, "wx");
  try {
    writeFileSync(fd, JSON.stringify(journal, null, 2) + "\n");
  } finally {
    closeSync(fd);
  }
  try {
    for (const p of report.packs) {
      if (packIdentity(await getPrivatePack(p.id)) !== p.contentIdentity)
        throw Error("Pack changed after preflight: " + p.id);
    }
    for (const p of report.packs) {
      const path = resolve(`content/problems/${p.id}/validation.json`),
        validation = json(path);
      writeAtomic(
        path,
        JSON.stringify(
          { ...validation, status: "passed", independentReview: "passed" },
          null,
          2,
        ) + "\n",
      );
    }
    for (const p of report.packs) {
      const path = resolve(`content/problems/${p.id}/problem.json`),
        manifest = json(path);
      writeAtomic(
        path,
        JSON.stringify({ ...manifest, status: "published" }, null, 2) + "\n",
      );
    }
    writeAtomic(
      resolve("content/catalogue.json"),
      JSON.stringify(futureCatalogue, null, 2) + "\n",
    );
    const audit = spawnSync(process.execPath, ["scripts/audit-content.mjs"], {
      cwd: workspace,
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: 10000000,
    });
    writeFileSync(
      "docs/release-evidence/publication-release-audit.txt",
      (audit.stdout ?? "") + (audit.stderr ?? ""),
    );
    if (audit.status !== 0)
      throw Error("Final published release audit failed; see saved log");
    unlinkSync(journalPath);
    writeFileSync(
      "docs/release-evidence/publication-result.json",
      JSON.stringify(
        {
          schemaVersion: 1,
          published: true,
          questionCount: report.packs.length,
          contentMapHash: report.contentMapHash,
          runtimeIdentity: runtime,
          backup,
          completedAt: new Date().toISOString(),
          releaseAuditExitCode: audit.status,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(
      "243 questions published with unchanged status-neutral review/reference identities; backup retained.",
    );
  } catch (error) {
    try {
      restore(journal);
    } catch {
      throw Error(
        "Publication failure needs explicit --recover; startup remains blocked and backup is preserved.",
      );
    }
    throw error;
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
