import { describe, it, expect } from "vitest";
import { suppliedQuestions } from "./suppliedQuestions";
import { questions, questionAliases, findQuestion } from "./questions";
import { questionTypes } from "../types";

describe("user question import", () => {
  it("accounts for all 67 entries, including merged entries", () => {
    expect(suppliedQuestions).toHaveLength(67);
    expect(questions).toHaveLength(111);
    expect(questions.filter((q) => q.provided)).toHaveLength(66);
    for (const q of suppliedQuestions) {
      expect(
        questions.some((x) => x.id === (questionAliases[q.id] ?? q.id)),
      ).toBe(true);
      expect(questionTypes).toContain(q.questionType);
      expect(q.topic).toBeTruthy();
      expect(q.text).not.toMatch(/https?:|\]\(|\.[A-Z]/);
    }
  });
  it("merges equivalent tasks but preserves different requirements", () => {
    expect(questions.some((q) => q.id === "supplied-2023-64")).toBe(false);
    expect(questions.some((q) => q.id === "recalled-work-4")).toBe(false);
    expect(findQuestion("recalled-work-4")).toBeDefined();
    // All young offenders vs serious teenage offences are not interchangeable.
    expect(findQuestion("supplied-2023-38")).toBeDefined();
    expect(findQuestion("recalled-crime-and-punishment-3")).toBeDefined();
    // Work-at-home benefits vs whether only employees benefit have different tasks.
    expect(findQuestion("q4")).toBeDefined();
    expect(findQuestion("supplied-2024-22")).toBeDefined();
  });
  it("has no text or ID duplicates after punctuation normalization", () => {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
    expect(new Set(questions.map((q) => normalize(q.text))).size).toBe(
      questions.length,
    );
  });
});
