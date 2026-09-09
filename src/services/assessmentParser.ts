import { z } from "zod";
import {
  dimensions,
  languageCategories,
  writingCategories,
  strengthCategories,
  type Assessment,
} from "../types";
const text = z.string().catch("");
const score = z.object({
  score: z.number().min(4).max(9).multipleOf(0.5),
  reason: text,
});
const diagnostic = z.number().min(0).max(10).multipleOf(0.5);
const common = {
  originalQuote: text,
  correction: text,
  explanation: text,
  howToImprove: text,
  otherOccurrences: z.array(z.string()).max(100).catch([]),
};
export const assessmentSchema = z
  .object({
    scores: z.object({
      taskResponse: score,
      coherenceCohesion: score,
      lexicalResource: score,
      grammaticalRangeAccuracy: score,
    }),
    diagnostics: z.object({
      taskUnderstanding: diagnostic,
      positionClarity: diagnostic,
      ideaDevelopment: diagnostic,
      supportingDetail: diagnostic,
      logicalOrganisation: diagnostic,
      vocabularyUse: diagnostic,
      grammarAccuracy: diagnostic,
      sentenceRange: diagnostic,
    }),
    problems: z
      .array(
        z.discriminatedUnion("type", [
          z.object({
            type: z.literal("language_error"),
            category: z.enum(languageCategories),
            confidence: z.enum(["High", "Medium"]),
            ...common,
          }),
          z.object({
            type: z.literal("writing_issue"),
            category: z.enum(writingCategories),
            confidence: z.null().default(null),
            ...common,
          }),
        ]),
      )
      .max(5)
      .default([]),
    strengths: z
      .array(
        z.object({
          category: z.enum(strengthCategories),
          originalQuote: text,
          whyItWorks: text,
        }),
      )
      .max(3)
      .default([]),
    upgrades: z
      .array(z.object({ original: text, improved: text, reason: text }))
      .max(3)
      .default([]),
    usefulExpressions: z
      .array(
        z.object({
          expression: text,
          meaning: text,
          example: text,
          source: z.enum(["Student", "Suggested"]),
        }),
      )
      .max(5)
      .default([]),
    nextPriority: z.object({
      dimension: z.enum(Object.values(dimensions)),
      reason: text,
      action: text,
    }),
  })
  .superRefine((a, ctx) => {
    const cats = a.problems
      .filter((p) => p.type === "language_error")
      .map((p) => p.category);
    if (new Set(cats).size !== cats.length)
      ctx.addIssue({
        code: "custom",
        path: ["problems"],
        message:
          "同类语言错误请合并为一个问题，其他出现位置放入 otherOccurrences。",
      });
  });
export function parseAssessment(
  raw: string,
): { ok: true; data: Assessment } | { ok: false; error: string } {
  try {
    const cleaned = raw.trim().replace(/```(?:json)?/gi, "");
    const start = cleaned.indexOf("{"),
      end = cleaned.lastIndexOf("}");
    if (start < 0 || end < start) throw new Error("No JSON object found.");
    const result = assessmentSchema.safeParse(
      JSON.parse(cleaned.slice(start, end + 1)),
    );
    if (!result.success)
      return {
        ok: false,
        error: result.error.issues
          .slice(0, 4)
          .map(
            (i) =>
              `${i.path.join(".")}：${i.code === "custom" ? i.message : "字段缺失、类型、范围或固定选项不符合要求。请复制格式修复指令让 AI 重新输出。"}`,
          )
          .join(" · "),
      };
    return { ok: true, data: result.data };
  } catch {
    return {
      ok: false,
      error: "JSON 格式不正确，请检查引号、逗号和括号，或使用格式修复指令。",
    };
  }
}
export const repairInstruction =
  "请按之前要求的 JSON 结构重新返回上一份评估，不要更改评分和分析结论。只修复格式：所有字段完整、属性名和固定枚举保持英文，同类语言错误合并到一个 problem，其他引用放入 otherOccurrences。所有解释性评语使用简体中文；原文引用、英文改正、表达和例句保持英文。只返回有效 JSON，不要 Markdown，不要代码围栏，不要在 JSON 前后添加说明。";
