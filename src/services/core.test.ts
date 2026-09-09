import { describe, it, expect } from "vitest";
import { demoAssessment, demoEssay } from "../data/demo";
import { parseAssessment } from "./assessmentParser";
import { band, wordCount, stats, languageCount } from "../utils/scoring";
import { assessmentPrompt } from "./assessmentPrompt";
import { closeAway } from "../hooks/useExam";
import type { EssayAttempt, Draft } from "../types";
describe("assessment contract", () => {
  it("imports demo with surrounding prose and markdown", () => {
    expect(
      parseAssessment(
        `Here it is:\n\`\`\`json\n${JSON.stringify(demoAssessment)}\n\`\`\``,
      ),
    ).toEqual({ ok: true, data: demoAssessment });
  });
  it("rejects invalid JSON and invalid scoring without throwing", () => {
    expect(parseAssessment("{oops").ok).toBe(false);
    const bad = structuredClone(demoAssessment);
    bad.scores.taskResponse.score = 6.2;
    expect(parseAssessment(JSON.stringify(bad)).ok).toBe(false);
    bad.scores.taskResponse.score = 10;
    expect(parseAssessment(JSON.stringify(bad)).ok).toBe(false);
  });
  it("defaults minor text and missing optional lists", () => {
    const a = JSON.parse(JSON.stringify(demoAssessment));
    delete a.strengths;
    delete a.scores.taskResponse.reason;
    const result = parseAssessment(JSON.stringify(a));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.strengths).toEqual([]);
      expect(result.data.scores.taskResponse.reason).toBe("");
    }
  });
  it("rejects invented categories and duplicate language groups", () => {
    const bad = structuredClone(demoAssessment);
    bad.problems[0].category = "Basic English";
    expect(parseAssessment(JSON.stringify(bad)).ok).toBe(false);
    bad.problems[0].category = "Spelling";
    bad.problems.push(bad.problems[0]);
    expect(parseAssessment(JSON.stringify(bad)).ok).toBe(false);
  });
  it("rounds 6.25 to 6.5 and 6.75 to 7.0", () => {
    const a = structuredClone(demoAssessment);
    Object.values(a.scores).forEach((s, i) => (s.score = i < 2 ? 6 : 6.5));
    expect(band(a)).toBe(6.5);
    Object.values(a.scores).forEach((s, i) => (s.score = i < 2 ? 6.5 : 7));
    expect(band(a)).toBe(7);
  });
  it("counts errors from occurrences only", () => {
    const a = structuredClone(demoAssessment);
    a.problems[0].otherOccurrences = ["a", "b", "c"];
    expect(languageCount(a)).toBe(4);
  });
  it("all demo quotes match the essay", () => {
    for (const p of demoAssessment.problems)
      expect(demoEssay).toContain(p.originalQuote);
    for (const s of demoAssessment.strengths)
      expect(demoEssay).toContain(s.originalQuote);
    for (const u of demoAssessment.upgrades)
      expect(demoEssay).toContain(u.original);
  });
  it("generates dynamic prompt with detailed contract", () => {
    const prompt = assessmentPrompt({
      question: "UNIQUE QUESTION",
      text: "UNIQUE ESSAY",
    } as EssayAttempt);
    expect(prompt).toContain("UNIQUE QUESTION");
    expect(prompt).toContain("UNIQUE ESSAY");
    expect(prompt).toContain("Stating an idea is NOT developing it");
    expect(prompt).toContain("Do not output any overall");
  });
});
describe("practice metrics", () => {
  it("counts apostrophes, hyphens and line breaks", () => {
    expect(wordCount("It's a long-term plan.\nGood idea!")).toBe(6);
    expect(wordCount("   ")).toBe(0);
  });
  it("counts calendar days across local midnight and ignores demo/revisions", () => {
    const make = (date: string, extra = {}) =>
      ({
        id: date,
        createdAt: date,
        wordCount: 260,
        text: demoEssay,
        kind: "Full Essay",
        version: "Exam",
        ...extra,
      }) as EssayAttempt;
    const a = [
      make("2026-09-05T12:00:00"),
      make("2026-09-06T12:00:00"),
      make("2026-09-07T12:00:00", { demo: true }),
    ];
    expect(stats(a, {}, new Date("2026-09-07T13:00:00")).currentStreak).toBe(2);
    expect(stats(a, {}, new Date("2026-09-07T13:00:00")).essaysCompleted).toBe(
      2,
    );
  });
  it("closes an away interval once", () => {
    const draft = { awayStarted: 1000, focusEvents: [] } as unknown as Draft;
    const once = closeAway(draft, 4000);
    expect(once.focusEvents).toHaveLength(1);
    expect(once.focusEvents[0].duration).toBe(3);
    expect(closeAway(once, 5000).focusEvents).toHaveLength(1);
  });
});
