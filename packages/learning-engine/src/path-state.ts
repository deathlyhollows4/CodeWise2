import type { PublicProblem } from "../../contracts/src/index.ts";
import type { Evidence } from "./index.ts";
export function derivePathStates(
  catalogue: PublicProblem[],
  evidence: Evidence[],
) {
  return [...new Set(catalogue.map((p) => p.primaryTopic))]
    .sort()
    .map((topic) => {
      const entries = evidence.filter(
          (e) =>
            catalogue.find((p) => p.id === e.problemId)?.primaryTopic === topic,
        ),
        conceptual = entries.filter(
          (e) =>
            !e.review &&
            e.advancementEligible !== false &&
            ["accepted", "wrong_answer"].includes(e.outcome),
        ),
        independent = conceptual.filter(
          (e) => e.outcome === "accepted" && !e.assisted,
        );
      return {
        topic,
        workingStep: conceptual.at(-1)?.step ?? 1,
        highestIndependentStep: independent.length
          ? Math.max(...independent.map((e) => e.step))
          : null,
        lastEvidenceId: conceptual.at(-1)?.id ?? null,
        independentEvidenceIds: independent.map((e) => e.id),
        languageEvidence: Object.fromEntries(
          ["java", "cpp", "python"].map((language) => [
            language,
            entries.filter((e) => e.language === language).map((e) => e.id),
          ]),
        ),
      };
    });
}
