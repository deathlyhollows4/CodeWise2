import { test } from "node:test";
import assert from "node:assert/strict";
import { pagePath } from "../../apps/web/src/paged-data";
test("default Library request omits every empty optional enum/date filter", () => {
  const path = pagePath(
    "library?q=&language=&status=&bookmarked=&problemId=&topic=&action=&from=&to=",
    30,
    null,
  );
  const params = new URL(path, "http://localhost/").searchParams;
  assert.deepEqual(
    [...params],
    [
      ["q", ""],
      ["pageSize", "30"],
    ],
  );
});
test("meaningful false/zero/Unicode filters and opaque cursor survive encoding", () => {
  const path = pagePath(
    "jobs?review=false&offset=0&problemId=actual-id&q=%E6%A0%91",
    100,
    "signed+/=cursor",
  );
  const params = new URL(path, "http://localhost/").searchParams;
  assert.equal(params.get("review"), "false");
  assert.equal(params.get("offset"), "0");
  assert.equal(params.get("q"), "树");
  assert.equal(params.get("cursor"), "signed+/=cursor");
});
test("filter reset discards prior cursor and page requests remain bounded", () => {
  const params = new URL(
    pagePath("library?cursor=old&language=python&from=", 500, null),
    "http://localhost/",
  ).searchParams;
  assert.equal(params.has("cursor"), false);
  assert.equal(params.has("from"), false);
  assert.equal(params.get("language"), "python");
  assert.equal(params.get("pageSize"), "100");
});
