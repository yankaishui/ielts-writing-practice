import { describe, it, expect } from "vitest";
import { demoEssay } from "../data/demo";
import { essayEligibility, isEligibleAttempt } from "./eligibility";
import { stats } from "./scoring";
import { questions } from "../data/questions";
import { questionTypes, type EssayAttempt } from "../types";

describe("training inclusion", () => {
  const words = demoEssay.match(/[a-z]+(?:['’\-][a-z]+)*/gi)!;
  it("uses actual English text at the 150-word boundary", () => {
    expect(essayEligibility(words.slice(0, 149).join(" ")).eligible).toBe(
      false,
    );
    expect(essayEligibility(words.slice(0, 150).join(" ")).eligible).toBe(true);
    expect(essayEligibility(demoEssay).eligible).toBe(true);
  });
  it("rejects obvious filler while allowing imperfect English", () => {
    for (const text of [
      "asdfgh ".repeat(200),
      "abc ".repeat(200),
      "中文 ".repeat(200),
      "12345 ".repeat(200),
      "qwerty uiop asdf zxcv ".repeat(60),
    ])
      expect(essayEligibility(text).eligible).toBe(false);
    expect(
      essayEligibility(
        demoEssay
          .replaceAll("governments", "goverments")
          .replaceAll("are", "is"),
      ).eligible,
    ).toBe(true);
  });
  it("does not impose full-essay limits on paragraph practice", () => {
    expect(
      isEligibleAttempt({
        kind: "Introduction",
        text: "I believe this change is useful.",
      } as EssayAttempt),
    ).toBe(true);
    expect(
      isEligibleAttempt({ kind: "Introduction", text: " " } as EssayAttempt),
    ).toBe(false);
  });
  it("ignores stale inflated word counts in legacy statistics", () => {
    const a = {
      id: "short",
      text: "I stopped here.",
      kind: "Full Essay",
      wordCount: 999,
      version: "Exam",
      createdAt: new Date().toISOString(),
    } as EssayAttempt;
    expect(stats([a], {}).essaysCompleted).toBe(0);
    expect(stats([a], {}).sessionsThisWeek).toBe(0);
    expect(stats([a], {}).currentStreak).toBe(0);
  });
});
describe("expanded bank", () => {
  it("preserves original IDs and classifies all sourced questions", () => {
    expect(questions).toHaveLength(111);
    expect(new Set(questions.map((q) => q.id)).size).toBe(111);
    expect(questions[0].id).toBe("q1");
    expect(questions.filter((q) => q.source)).toHaveLength(22);
    for (const q of questions) {
      expect(questionTypes).toContain(q.questionType);
      expect(q.topic).toBeTruthy();
      if (q.source) expect(new URL(q.source.url).protocol).toBe("https:");
    }
  });
});
