import { isEligibleAttempt } from "./eligibility";
import type {
  Assessment,
  EssayAttempt,
  FocusPractice,
  SavedExpression,
} from "../types";

export function paragraphTarget(text: string, assessment: Assessment) {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
  const problem =
    assessment.problems.find(
      (p) => p.category === assessment.nextPriority.dimension,
    ) ??
    assessment.problems.find((p) => p.type === "writing_issue") ??
    assessment.problems[0];
  const quote = problem?.originalQuote;
  const index = quote ? paragraphs.findIndex((p) => p.includes(quote)) : -1;
  return {
    paragraphs,
    index: index >= 0 ? index : Math.min(1, Math.max(0, paragraphs.length - 1)),
    problem,
  };
}

export function nextPractice(
  attempts: EssayAttempt[],
  assessments: Record<string, Assessment>,
  practices: FocusPractice[],
) {
  const eligible = attempts.filter(
    (a) =>
      !a.demo &&
      isEligibleAttempt(a) &&
      a.kind === "Full Essay" &&
      assessments[a.id],
  );
  const pending = [...practices]
    .reverse()
    .find((p) => !p.finishedAt && eligible.some((a) => a.id === p.essayId));
  const attempt = pending
    ? eligible.find((a) => a.id === pending.essayId)
    : eligible.at(-1);
  return attempt
    ? {
        attempt,
        pending,
        assessment: assessments[attempt.id],
        completed: practices.filter(
          (p) => p.essayId === attempt.id && p.finishedAt,
        ),
      }
    : null;
}

// These are observations from stored evidence, never a claim of automatic grading.
export function missingRecurring(
  attempt: EssayAttempt,
  attempts: EssayAttempt[],
  assessments: Record<string, Assessment>,
) {
  const current = assessments[attempt.id];
  if (!current) return [];
  const previous = attempts
    .filter(
      (a) =>
        isEligibleAttempt(a) &&
        a.id !== attempt.id &&
        Boolean(a.demo) === Boolean(attempt.demo) &&
        a.kind === "Full Essay" &&
        a.version !== "Revision" &&
        a.createdAt < attempt.createdAt &&
        assessments[a.id],
    )
    .slice(-3);
  const categories = new Set(
    previous.flatMap((a) =>
      assessments[a.id].problems
        .filter((p) => p.type === "language_error")
        .map((p) => p.category),
    ),
  );
  return [...categories]
    .map((category) => ({
      category,
      essays: previous.filter((a) =>
        assessments[a.id].problems.some(
          (p) => p.type === "language_error" && p.category === category,
        ),
      ),
    }))
    .filter(
      ({ category, essays }) =>
        essays.length >= 2 &&
        !current.problems.some(
          (p) => p.type === "language_error" && p.category === category,
        ),
    );
}
export function reusedExpressions(
  attempt: EssayAttempt,
  expressions: SavedExpression[],
) {
  return expressions
    .filter(
      (e) =>
        e.sourceEssayId !== attempt.id &&
        e.dateSaved < attempt.createdAt &&
        e.expression.trim().length >= 3,
    )
    .flatMap((e) => {
      const escaped = e.expression
        .trim()
        .split(/\s+/)
        .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("\\s+");
      const regex = new RegExp(
        `(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`,
        "iu",
      );
      const match = regex.exec(attempt.text);
      return match ? [{ expression: e, quote: match[0] }] : [];
    })
    .filter(
      (e, i, all) =>
        all.findIndex(
          (x) =>
            x.expression.expression.toLowerCase() ===
            e.expression.expression.toLowerCase(),
        ) === i,
    )
    .slice(0, 3);
}
export function textDiff(
  before: string,
  after: string,
): { text: string; kind: "same" | "added" | "removed" }[] {
  const a = before.match(/\s+|\S+/g) ?? [],
    b = after.match(/\s+|\S+/g) ?? [];
  // Bound comparison memory for unusually long pasted passages.
  if (a.length * b.length > 250000)
    return [
      { text: before, kind: "removed" },
      { text: after, kind: "added" },
    ];
  const dp = Array.from(
    { length: a.length + 1 },
    () => new Uint16Array(b.length + 1),
  );
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: ReturnType<typeof textDiff> = [];
  let i = 0,
    j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      out.push({ text: a[i++], kind: "same" });
      j++;
    } else if (j < b.length && (i === a.length || dp[i][j + 1] >= dp[i + 1][j]))
      out.push({ text: b[j++], kind: "added" });
    else out.push({ text: a[i++], kind: "removed" });
  }
  return out;
}
