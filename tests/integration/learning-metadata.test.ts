import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createApp } from "../../apps/server/src/app.ts";
const loader: any = await import(
    new URL("../../packages/judge-adapter/src/index.mjs", import.meta.url).href
  ),
  validation: any = await import(
    new URL(
      "../../packages/judge-adapter/src/pack-validation.mjs",
      import.meta.url,
    ).href
  );
test("real approved metadata endpoint binds current version and private published access without changing core/saved snapshots or dispatching code", async () => {
  const root = join(process.cwd(), ".runtime", "tests");
  mkdirSync(root, { recursive: true });
  const problem = await loader.getPublicProblem("arrays-hashing-01"),
    pack = await loader.getPrivatePack(problem.id),
    identity = validation.packIdentity(pack),
    before = JSON.stringify(problem);
  assert.ok(pack.learningMetadata);
  const app = createApp({
    dataDir: mkdtempSync(join(root, "metadata-http-")),
    catalogue: [problem],
    learningMetadata: loader.getPublicLearningMetadata,
  });
  await new Promise<void>((resolve) =>
    app.server.listen(0, "127.0.0.1", resolve),
  );
  const base = `http://127.0.0.1:${(app.server.address() as any).port}`,
    bootstrap = await fetch(base + "/api/bootstrap"),
    cookie = bootstrap.headers.get("set-cookie")!.split(";")[0],
    boot: any = await bootstrap.json();
  const get = (path: string) =>
    fetch(base + path, { headers: { Cookie: cookie } });
  try {
    const response = await get(
      `/api/problems/${problem.id}/learning-metadata?version=${problem.version}`,
    );
    assert.equal(response.status, 200);
    const result: any = await response.json();
    assert.deepEqual(
      Object.keys(result).sort(),
      [
        "schemaVersion",
        "metadataVersion",
        "problemVersion",
        "problemId",
        "contentIdentity",
        "primaryTopic",
        "secondaryTopics",
        "approachTags",
        "rationale",
      ].sort(),
    );
    assert.equal(result.contentIdentity, identity);
    assert.equal(result.problemVersion, problem.version);
    const approval = JSON.parse(
      readFileSync("content/learning-tags-review.json", "utf8"),
    );
    assert.equal(result.metadataVersion, approval.metadataHash);
    assert.deepEqual(result.approachTags, pack.learningMetadata.approachTags);
    assert.equal(
      (
        await get(
          `/api/problems/${problem.id}/learning-metadata?version=retired-version`,
        )
      ).status,
      409,
    );
    assert.equal(
      (await get(`/api/problems/${problem.id}/learning-metadata?version=`))
        .status,
      400,
    );
    assert.equal(
      (await get("/api/problems/missing-99/learning-metadata")).status,
      404,
    );
    const wrong = await fetch(
      base + `/api/problems/${problem.id}/learning-metadata`,
      {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: base,
          "X-CSRF-Token": boot.csrfToken,
          "Content-Type": "application/json",
        },
        body: "{}",
      },
    );
    assert.equal(wrong.status, 405);
      assert.deepEqual(await (await get("/api/problems/" + problem.id)).json(), JSON.parse(before));
    assert.equal(
      validation.packIdentity(await loader.getPrivatePack(problem.id)),
      identity,
    );
    assert.equal(app.store.list("jobs").length, 0);
    assert.equal(app.store.list("generations").length, 0);
    assert.equal(app.store.list("evidence").length, 0);
      assert.deepEqual(app.store.meta("problemVersions")[problem.id + "@" + problem.version], JSON.parse(before));
  } finally {
    app.close();
  }
});
