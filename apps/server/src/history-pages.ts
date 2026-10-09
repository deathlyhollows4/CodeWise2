import {
  createHmac,
  randomBytes,
  createHash,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import { Store } from "./store.ts";
import {
  LibraryPageSchema,
  JobPageSchema,
  LanguageSchema,
  GenerationStatusSchema,
  JobStatusSchema,
  TutorRequestSchema,
  JobRequestSchema,
  type PublicProblem,
} from "../../../packages/contracts/src/index.ts";
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(value + "T00:00:00.000Z");
    return (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Use a valid calendar date");
const common = {
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
  cursor: z.string().min(1).max(2048).optional(),
  problemId: z.string().min(1).max(100).optional(),
  language: LanguageSchema.optional(),
};
const libraryQuery = z
  .object({
    ...common,
    q: z.string().max(200).default(""),
    status: GenerationStatusSchema.optional(),
    bookmarked: z.enum(["true", "false"]).optional(),
    topic: z.string().min(1).max(100).optional(),
    action: TutorRequestSchema.shape.action.optional(),
    threadId: z.string().uuid().optional(),
    from: date.optional(),
    to: date.optional(),
  })
  .strict()
  .refine(
    (q) => !q.from || !q.to || q.from <= q.to,
    "Start date must precede end date",
  );
const jobsQuery = z
  .object({
    ...common,
    status: JobStatusSchema.optional(),
    mode: JobRequestSchema.shape.mode.optional(),
  })
  .strict();
const cursorSchema = z
  .object({
    collection: z.enum(["library", "jobs"]),
    createdAt: z.string().datetime(),
    id: z.string().uuid(),
    queryHash: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
function clipped(value: unknown, max = 400) {
  const text = String(value ?? "");
  let end = Math.min(text.length, max);
  if (
    end < text.length &&
    end > 0 &&
    text.charCodeAt(end - 1) >= 0xd800 &&
    text.charCodeAt(end - 1) <= 0xdbff
  )
    end--;
  return text.slice(0, end);
}
function excerpt(value: unknown, query: unknown) {
  const text = String(value ?? ""),
    needle = String(query ?? "").toLowerCase();
  if (!needle) return "";
  const index = text.toLowerCase().indexOf(needle);
  if (index < 0) return "";
  let start = Math.max(0, index - 120);
  if (
    start > 0 &&
    text.charCodeAt(start) >= 0xdc00 &&
    text.charCodeAt(start) <= 0xdfff &&
    text.charCodeAt(start - 1) >= 0xd800 &&
    text.charCodeAt(start - 1) <= 0xdbff
  )
    start--;
  return clipped(text.slice(start));
}
function invalidCursor() {
  return Object.assign(
    new Error(
      "This history cursor expired or belongs to different filters. Reload the first page.",
    ),
    { status: 400, code: "CURSOR_INVALID" },
  );
}
export class HistoryPages {
  private secret = randomBytes(32);
  constructor(
    private store: Store,
    private catalogue: PublicProblem[],
  ) {
    store.db.function("cw2_fold", { deterministic: true }, (value) =>
      String(value ?? "").toLowerCase(),
    );
    store.db.function("cw2_preview", { deterministic: true }, (value) =>
      clipped(value),
    );
    store.db.function("cw2_excerpt", { deterministic: true }, (value, query) =>
      excerpt(value, query),
    );
    store.db
      .exec(`CREATE INDEX IF NOT EXISTS generations_history_order ON generations(json_extract(data,'$.createdAt') DESC,id DESC);
CREATE INDEX IF NOT EXISTS jobs_history_order ON jobs(json_extract(data,'$.createdAt') DESC,id DESC);`);
  }
  invalidate() {
    this.secret = randomBytes(32);
  }
  private signature(value: string) {
    return createHmac("sha256", this.secret).update(value).digest();
  }
  private queryHash(collection: string, query: Record<string, unknown>) {
    const { cursor: _cursor, ...filters } = query;
    return createHash("sha256")
      .update(JSON.stringify({ collection, filters }))
      .digest("hex");
  }
  private readCursor(
    raw: string | undefined,
    collection: "library" | "jobs",
    queryHash: string,
  ) {
    if (!raw) return null;
    try {
      const pieces = raw.split(".");
      if (pieces.length !== 2 || !/^[a-f0-9]{64}$/.test(pieces[1]))
        throw invalidCursor();
      if (
        !timingSafeEqual(
          this.signature(pieces[0]),
          Buffer.from(pieces[1], "hex"),
        )
      )
        throw invalidCursor();
      const cursor = cursorSchema.parse(
        JSON.parse(Buffer.from(pieces[0], "base64url").toString("utf8")),
      );
      if (cursor.collection !== collection || cursor.queryHash !== queryHash)
        throw invalidCursor();
      return cursor;
    } catch {
      throw invalidCursor();
    }
  }
  private encodeCursor(
    collection: "library" | "jobs",
    row: any,
    queryHash: string,
  ) {
    const value = Buffer.from(
      JSON.stringify({
        collection,
        createdAt: row.createdAt,
        id: row.id,
        queryHash,
      }),
    ).toString("base64url");
    return value + "." + this.signature(value).toString("hex");
  }
  private params(search: URLSearchParams) {
    const values: Record<string, string> = {};
    for (const [key, value] of search) {
      if (Object.hasOwn(values, key))
        throw Object.assign(
          new Error("History query parameters must occur once."),
          { status: 400 },
        );
      values[key] = value;
    }
    return values;
  }
  private select(
    table: "generations" | "jobs",
    projection: string,
    where: string[],
    params: Array<string | number>,
    cursor: z.infer<typeof cursorSchema> | null,
    pageSize: number,
  ) {
    this.store.db.exec("BEGIN");
    try {
      const base = where.length ? where.join(" AND ") : "1";
      const total = Number(
        this.store.db
          .prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE ${base}`)
          .get(...params)?.total ?? 0,
      );
      const limited = [...where],
        bindings = [...params];
      if (cursor) {
        limited.push(
          "(json_extract(data,'$.createdAt') < ? OR (json_extract(data,'$.createdAt') = ? AND id < ?))",
        );
        bindings.push(cursor.createdAt, cursor.createdAt, cursor.id);
      }
      bindings.push(pageSize + 1);
      const rows = this.store.db
        .prepare(
          `SELECT ${projection} FROM ${table} WHERE ${limited.length ? limited.join(" AND ") : "1"} ORDER BY json_extract(data,'$.createdAt') DESC,id DESC LIMIT ?`,
        )
        .all(...bindings);
      this.store.db.exec("COMMIT");
      return { total, rows };
    } catch (error) {
      this.store.db.exec("ROLLBACK");
      throw error;
    }
  }
  library(search: URLSearchParams) {
    const query = libraryQuery.parse(this.params(search)),
      hash = this.queryHash("library", query),
      cursor = this.readCursor(query.cursor, "library", hash);
    const where = ["json_extract(data,'$.deletedAt') IS NULL"],
      params: Array<string | number> = [];
    for (const key of [
      "problemId",
      "language",
      "status",
      "action",
      "threadId",
    ] as const)
      if (query[key] !== undefined) {
        where.push(`json_extract(data,'$.${key}') = ?`);
        params.push(query[key]!);
      }
    if (query.bookmarked !== undefined) {
      where.push("COALESCE(json_extract(data,'$.bookmarked'),0) = ?");
      params.push(query.bookmarked === "true" ? 1 : 0);
    }
    if (query.from) {
      where.push("json_extract(data,'$.createdAt') >= ?");
      params.push(query.from + "T00:00:00.000Z");
    }
    if (query.to) {
      where.push("json_extract(data,'$.createdAt') <= ?");
      params.push(query.to + "T23:59:59.999Z");
    }
    if (query.topic) {
      const ids = this.catalogue
        .filter((p) => p.primaryTopic === query.topic)
        .map((p) => p.id);
      where.push(
        `(json_extract(data,'$.problemSnapshot.primaryTopic') = ?${ids.length ? ` OR json_extract(data,'$.problemId') IN (${ids.map(() => "?").join(",")})` : ""})`,
      );
      params.push(query.topic, ...ids);
    }
    const searchText =
      "COALESCE(json_extract(data,'$.title'),'') || char(10) || COALESCE(json_extract(data,'$.prompt'),'') || char(10) || COALESCE(json_extract(data,'$.markdown'),'') || char(10) || COALESCE(json_extract(data,'$.notes'),'') || char(10) || COALESCE(json_extract(data,'$.code'),'')";
    if (query.q) {
      where.push(`instr(cw2_fold(${searchText}),?) > 0`);
      params.push(query.q.toLowerCase());
    }
    // The query text is bound in the WHERE clause. Excerpt generation below receives it as a safe SQL parameter too.
    const projection = `id,json_extract(data,'$.problemId') AS problemId,json_extract(data,'$.threadId') AS threadId,json_extract(data,'$.version') AS version,
json_extract(data,'$.language') AS language,json_extract(data,'$.action') AS action,json_extract(data,'$.status') AS status,json_extract(data,'$.title') AS title,
json_extract(data,'$.createdAt') AS createdAt,COALESCE(json_extract(data,'$.updatedAt'),json_extract(data,'$.finishedAt'),json_extract(data,'$.createdAt')) AS updatedAt,
json_extract(data,'$.bookmarked') AS bookmarked,json_extract(data,'$.tags') AS tags,cw2_preview(json_extract(data,'$.markdown')) AS preview,
json_extract(data,'$.provider') AS provider,json_extract(data,'$.model') AS model`;
    const selected = this.select(
        "generations",
        projection,
        where,
        params,
        cursor,
        query.pageSize,
      ),
      hasMore = selected.rows.length > query.pageSize;
    const visible = selected.rows.slice(0, query.pageSize);
    const items = visible.map((row) => ({
      ...row,
      bookmarked: !!row.bookmarked,
      tags: typeof row.tags === "string" ? JSON.parse(row.tags) : [],
      searchExcerpt: "",
    }));
    // Fetch at most one bounded excerpt per selected row, never full body records into application memory.
    if (query.q)
      for (const [index, item] of items.entries()) {
        const found = this.store.db
          .prepare(
            `SELECT cw2_excerpt(${searchText},?) AS excerpt FROM generations WHERE id=?`,
          )
          .get(query.q, visible[index].id);
        item.searchExcerpt = String(found?.excerpt ?? "");
      }
    return LibraryPageSchema.parse({
      items,
      nextCursor:
        hasMore && visible.length
          ? this.encodeCursor("library", visible.at(-1), hash)
          : null,
      total: selected.total,
      pageSize: query.pageSize,
    });
  }
  jobs(search: URLSearchParams) {
    const query = jobsQuery.parse(this.params(search)),
      hash = this.queryHash("jobs", query),
      cursor = this.readCursor(query.cursor, "jobs", hash),
      where: string[] = [],
      params: Array<string | number> = [];
    for (const key of ["problemId", "language", "status", "mode"] as const)
      if (query[key] !== undefined) {
        where.push(`json_extract(data,'$.${key}') = ?`);
        params.push(query[key]!);
      }
    const projection = `id,json_extract(data,'$.problemId') AS problemId,json_extract(data,'$.problemSnapshot.title') AS problemTitle,json_extract(data,'$.language') AS language,
json_extract(data,'$.mode') AS mode,json_extract(data,'$.status') AS status,json_extract(data,'$.createdAt') AS createdAt,json_extract(data,'$.finishedAt') AS finishedAt,
json_extract(data,'$.review') AS review,json_extract(data,'$.meaningfulConceptualAttempt') AS meaningfulConceptualAttempt,json_extract(data,'$.result.counts') AS counts`;
    const selected = this.select(
        "jobs",
        projection,
        where,
        params,
        cursor,
        query.pageSize,
      ),
      hasMore = selected.rows.length > query.pageSize,
      visible = selected.rows.slice(0, query.pageSize);
    const items = visible.map((row) => ({
      id: row.id,
      problemId: row.problemId,
      problemTitle: clipped(
        row.problemTitle ??
          this.catalogue.find((p) => p.id === row.problemId)?.title ??
          "Saved question",
        300,
      ),
      language: row.language,
      mode: row.mode,
      status: row.status,
      createdAt: row.createdAt,
      ...(row.finishedAt ? { finishedAt: row.finishedAt } : {}),
      review: !!row.review,
      ...(row.meaningfulConceptualAttempt !== null
        ? { meaningfulConceptualAttempt: !!row.meaningfulConceptualAttempt }
        : {}),
      counts: typeof row.counts === "string" ? JSON.parse(row.counts) : null,
    }));
    return JobPageSchema.parse({
      items,
      nextCursor:
        hasMore && visible.length
          ? this.encodeCursor("jobs", visible.at(-1), hash)
          : null,
      total: selected.total,
      pageSize: query.pageSize,
    });
  }
}
