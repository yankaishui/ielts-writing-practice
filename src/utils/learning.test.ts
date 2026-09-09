import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  textDiff,
  paragraphTarget,
  nextPractice,
  missingRecurring,
  reusedExpressions,
} from "./learning";
import { demoAssessment, demoEssay } from "../data/demo";
import { assessmentPrompt } from "../services/assessmentPrompt";
import {
  chineseFeedbackPrompt,
  needsChineseFeedback,
} from "../services/feedbackLanguage";
import { storage } from "../services/storage";
import type { EssayAttempt, FocusPractice, SavedExpression } from "../types";
const attempt = (id: string, date: string): EssayAttempt => ({
  id,
  questionId: "q1",
  question: "Question",
  questionType: "Two-part Question",
  topic: "Environment",
  text: demoEssay,
  startTime: date,
  finishTime: date,
  duration: 300,
  wordCount: 256,
  focusEvents: [],
  totalTimeAway: 0,
  longestPause: 4,
  inputEvents: 4,
  createdAt: date,
  mode: "Practice",
  kind: "Full Essay",
  version: "Exam",
});
const one = attempt("a", "2026-09-01T12:00:00.000Z"),
  two = attempt("b", "2026-09-02T12:00:00.000Z"),
  three = attempt("c", "2026-09-03T12:00:00.000Z");
const practice: FocusPractice = {
  id: "p1",
  essayId: "a",
  dimension: "Supporting Detail",
  goal: "补充机制",
  original: "Original paragraph.",
  revised: "Revised paragraph.",
  paragraphIndex: 0,
  startedAt: one.createdAt,
  finishedAt: null,
  duration: 0,
  checks: [],
  reflection: "",
};
describe("actionable learning evidence", () => {
  it("selects the paragraph containing the priority quote", () => {
    const t = paragraphTarget(demoEssay, demoAssessment);
    expect(t.index).toBe(2);
    expect(t.paragraphs[t.index]).toContain("public transport");
  });
  it("preserves both texts exactly when rendering a word diff", () => {
    for (const [a, b] of [
      ["A good idea.\n", "A better idea.\n"],
      ["", "New text."],
      ["Long text.", ""],
      ["Same text.", "Same text."],
      ["  Original\n text.", "\tNew text.\n"],
    ]) {
      const diff = textDiff(a, b);
      expect(
        diff
          .filter((x) => x.kind !== "added")
          .map((x) => x.text)
          .join(""),
      ).toBe(a);
      expect(
        diff
          .filter((x) => x.kind !== "removed")
          .map((x) => x.text)
          .join(""),
      ).toBe(b);
    }
  });
  it("prioritises an unfinished session over a newer assessment and excludes demos", () => {
    const next = nextPractice(
      [one, two, { ...three, demo: true }],
      { a: demoAssessment, b: demoAssessment, c: demoAssessment },
      [practice],
    );
    expect(next?.attempt.id).toBe("a");
    expect(next?.pending?.id).toBe("p1");
    expect(
      nextPractice([one, two], { a: demoAssessment, b: demoAssessment }, [
        { ...practice, finishedAt: two.createdAt },
      ])?.attempt.id,
    ).toBe("b");
  });
  it("only observes missing errors when repeated previously, not future records", () => {
    const clean = structuredClone(demoAssessment);
    clean.problems = clean.problems.filter((p) => p.type !== "language_error");
    expect(
      missingRecurring(three, [one, two, three], {
        a: demoAssessment,
        b: demoAssessment,
        c: clean,
      })[0].essays,
    ).toHaveLength(2);
    expect(
      missingRecurring(one, [one, two, three], {
        a: clean,
        b: demoAssessment,
        c: demoAssessment,
      }),
    ).toHaveLength(0);
  });
  it("matches expressions saved beforehand with whole-word boundaries and literal punctuation", () => {
    const e: SavedExpression = {
      id: "e",
      expression: "economic concerns",
      meaning: "经济担忧",
      example: "",
      sourceEssayId: "a",
      type: "Useful Expression",
      dateSaved: one.createdAt,
      status: "Learning",
    };
    expect(reusedExpressions(three, [e])).toHaveLength(1);
    expect(
      reusedExpressions({ ...three, text: "economical concerns" }, [e]),
    ).toHaveLength(0);
    expect(
      reusedExpressions(three, [
        { ...e, dateSaved: "2026-09-05T12:00:00.000Z" },
      ]),
    ).toHaveLength(0);
    expect(
      reusedExpressions({ ...three, text: "Use C++ carefully." }, [
        { ...e, expression: "C++" },
      ]),
    ).toHaveLength(1);
  });
  it("requires Chinese explanations while protecting English quotes and schema", () => {
    const prompt = assessmentPrompt(one);
    expect(prompt).toContain("所有解释性文字必须用简体中文");
    expect(prompt).toContain("originalQuote");
    expect(prompt).toContain("JSON 属性名及固定枚举值必须保留原样英文");
    expect(prompt).not.toContain("Use English for assessment explanations");
    expect(needsChineseFeedback(demoAssessment)).toBe(false);
    const english = structuredClone(demoAssessment);
    english.nextPriority.reason = "Needs more support.";
    expect(needsChineseFeedback(english)).toBe(true);
    const conversion = chineseFeedbackPrompt(english);
    expect(conversion).toContain("只翻译，不要重新评分");
    expect(conversion).toContain("Needs more support.");
  });
});
describe("backups preserve learning sessions and old data", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => values.get(k) ?? null,
      setItem: (k: string, v: string) => values.set(k, v),
      removeItem: (k: string) => values.delete(k),
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  it("restores a pre-update backup without losing its essays or scores", () => {
    storage.import(
      JSON.stringify({
        version: 1,
        attempts: [one],
        assessments: { a: demoAssessment },
        expressions: [],
        draft: null,
      }),
    );
    expect(storage.attempts()[0]).toEqual(one);
    expect(storage.assessments().a).toEqual(demoAssessment);
    expect(storage.practices()).toEqual([]);
  });
  it("round trips a draft practice and completed evidence with immutable original snapshot", () => {
    storage.import(
      JSON.stringify({
        version: 1,
        attempts: [one],
        assessments: { a: demoAssessment },
        expressions: [],
        practices: [practice],
      }),
    );
    const backup = storage.export();
    storage.clear();
    storage.import(backup);
    expect(storage.practices()[0]).toEqual(practice);
    expect(storage.attempts()[0].text).toBe(demoEssay);
  });
  it("rejects orphan practice references without modifying existing data", () => {
    storage.import(
      JSON.stringify({
        version: 1,
        attempts: [one],
        assessments: {},
        expressions: [],
      }),
    );
    const before = storage.export();
    expect(() =>
      storage.import(
        JSON.stringify({
          version: 1,
          attempts: [one],
          assessments: {},
          expressions: [],
          practices: [{ ...practice, essayId: "missing" }],
        }),
      ),
    ).toThrow();
    expect(storage.export()).toBe(before);
  });
});
