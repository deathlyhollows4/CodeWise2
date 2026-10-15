import { z } from "zod";

export const IDEA_MAP_MAX_CHARACTERS = 20000;
const nodeId = z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,31}$/);
export const IdeaMapSchema = z
  .object({
    version: z.literal(1),
    title: z.string().trim().min(1).max(120),
    nodes: z
      .array(
        z
          .object({
            id: nodeId,
            label: z.string().trim().min(1).max(140),
            kind: z.enum(["start", "process", "decision", "end"]),
            row: z.number().int().min(0).max(23),
            column: z.number().int().min(0).max(4),
          })
          .strict(),
      )
      .min(2)
      .max(24),
    edges: z
      .array(
        z
          .object({
            from: nodeId,
            to: nodeId,
            label: z.string().trim().min(1).max(40).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(48),
  })
  .strict()
  .superRefine((map, ctx) => {
    const ids = new Set<string>(),
      positions = new Set<string>(),
      edges = new Set<string>();
    for (const node of map.nodes) {
      const position = `${node.row}:${node.column}`;
      if (ids.has(node.id) || positions.has(position))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Node IDs and positions must be unique",
        });
      ids.add(node.id);
      positions.add(position);
    }
    if (
      !map.nodes.some((node) => node.kind === "start") ||
      !map.nodes.some((node) => node.kind === "end")
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Include start and end nodes",
      });
    for (const edge of map.edges) {
      const identity = `${edge.from}:${edge.to}`;
      if (!ids.has(edge.from) || !ids.has(edge.to) || edges.has(identity))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Edges must reference existing nodes and be unique",
        });
      edges.add(identity);
    }
  });
export type IdeaMap = z.infer<typeof IdeaMapSchema>;
export type IdeaMapParseResult =
  | { ok: true; map: IdeaMap }
  | { ok: false; error: string };

/** Parse a fenced definition body as data; never interpret model markup or code. */
export function parseIdeaMapDefinition(source: string): IdeaMapParseResult {
  if (source.length > IDEA_MAP_MAX_CHARACTERS)
    return { ok: false, error: "Idea map exceeds the supported size." };
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    return {
      ok: false,
      error: "Idea map definition is incomplete or invalid JSON.",
    };
  }
  const parsed = IdeaMapSchema.safeParse(value);
  return parsed.success
    ? { ok: true, map: parsed.data }
    : {
        ok: false,
        error: "Idea map does not match the supported graph format.",
      };
}
