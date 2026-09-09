import { z } from "zod";
import { assessmentSchema } from "./assessmentParser";
import {
  questionTypes,
  type Question,
  type EssayAttempt,
  type Assessment,
  type SavedExpression,
  type Draft,
  type FocusPractice,
} from "../types";
const prefix = "ielts-writing:v1:";
const customQuestionSchema = z.object({
  id: z.string().startsWith("custom-"),
  text: z.string().trim().min(1),
  questionType: z.enum(questionTypes),
  topic: z.string().min(1),
  custom: z.literal(true),
});
const focusSchema = z.object({
  startTime: z.iso.datetime(),
  returnTime: z.iso.datetime(),
  duration: z.number().nonnegative(),
});
export const attemptSchema = z.object({
  id: z.string().min(1),
  questionId: z.string(),
  question: z.string(),
  questionType: z.enum(questionTypes),
  topic: z.string(),
  text: z.string(),
  startTime: z.iso.datetime(),
  finishTime: z.iso.datetime(),
  duration: z.number().nonnegative(),
  wordCount: z.number().int().nonnegative(),
  focusEvents: z.array(focusSchema),
  totalTimeAway: z.number().nonnegative(),
  longestPause: z.number().nonnegative(),
  inputEvents: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  mode: z.enum(["Practice", "Strict"]),
  kind: z.enum(["Full Essay", "Introduction", "Body Paragraph", "Conclusion"]),
  version: z.enum(["Exam", "Revision", "Rewrite"]),
  parentId: z.string().optional(),
  demo: z.boolean().optional(),
});
const expressionSchema = z.object({
  id: z.string(),
  expression: z.string(),
  meaning: z.string(),
  example: z.string(),
  sourceEssayId: z.string(),
  type: z.enum(["Strength", "Useful Expression", "Upgrade"]),
  dateSaved: z.iso.datetime(),
  status: z.enum(["Learning", "Mastered"]),
});
const draftSchema = z.object({
  key: z.string(),
  text: z.string(),
  started: z.number().nullable(),
  limit: z.number().positive(),
  mode: z.enum(["Practice", "Strict"]),
  focusEvents: z.array(focusSchema),
  awayStarted: z.number().nullable(),
  lastInput: z.number().nullable(),
  longestPause: z.number().nonnegative(),
  inputEvents: z.number().int().nonnegative(),
});
export const focusPracticeSchema = z.object({
  id: z.string().min(1),
  essayId: z.string().min(1),
  dimension: z.string(),
  goal: z.string(),
  original: z.string().min(1),
  paragraphIndex: z.number().int().nonnegative(),
  revised: z.string(),
  startedAt: z.iso.datetime(),
  finishedAt: z.iso.datetime().nullable(),
  duration: z.number().nonnegative(),
  checks: z.array(z.string()),
  reflection: z.string(),
});
const backupSchema = z
  .object({
    version: z.literal(1),
    attempts: z.array(attemptSchema),
    assessments: z.record(z.string(), assessmentSchema),
    expressions: z.array(expressionSchema),
    draft: draftSchema.nullable().default(null),
    practices: z.array(focusPracticeSchema).default([]),
    customQuestions: z.array(customQuestionSchema).default([]),
  })
  .superRefine((b, ctx) => {
    if (
      new Set(b.customQuestions.map((q) => q.id)).size !==
      b.customQuestions.length
    )
      ctx.addIssue({ code: "custom", message: "自定义题目编号重复。" });
    const ids = new Set(b.attempts.map((a) => a.id));
    const practiceIds = new Set(b.practices.map((p) => p.id));
    if (
      practiceIds.size !== b.practices.length ||
      b.practices.some((p) => !ids.has(p.essayId))
    )
      ctx.addIssue({
        code: "custom",
        message: "专项练习编号重复，或找不到对应作文。",
      });
    if (ids.size !== b.attempts.length)
      ctx.addIssue({ code: "custom", message: "Duplicate essay IDs." });
    for (const id of Object.keys(b.assessments))
      if (!b.attempts.some((a) => a.id === id && a.kind === "Full Essay"))
        ctx.addIssue({
          code: "custom",
          message: "Assessment must belong to a full essay.",
        });
  });
export function read<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
  const raw = localStorage.getItem(prefix + key);
  if (!raw) return fallback;
  try {
    const result = schema.safeParse(JSON.parse(raw));
    if (result.success) return result.data;
  } catch {
    /* Keep damaged data intact for recovery. */
  }
  window.dispatchEvent(
    new CustomEvent("storage-warning", {
      detail: `无法读取 ${key}，已保留原始存储副本，请先备份再修改。`,
    }),
  );
  return fallback;
}
export function write(key: string, value: unknown) {
  try {
    localStorage.setItem(prefix + key, JSON.stringify(value));
  } catch {
    throw new Error(
      "浏览器无法保存数据，可能存储空间已满或不可用。请先备份，再释放空间。",
    );
  }
}
export const storage = {
  customQuestions: (): Question[] => {
    const saved = read<Question[]>(
      "customQuestions",
      z.array(customQuestionSchema),
      [],
    );
    const recovered = storage
      .attempts()
      .filter((a) => a.questionId.startsWith("custom-"))
      .map((a) => ({
        id: a.questionId,
        text: a.question,
        questionType: a.questionType,
        topic: a.topic,
        custom: true,
      }));
    const draft = storage.draft();
    if (draft) {
      try {
        const url = new URL(draft.key, "https://local.invalid");
        const candidate = customQuestionSchema.safeParse({
          id: url.pathname.split("/").at(-1),
          text: url.searchParams.get("question"),
          questionType: url.searchParams.get("type"),
          topic: url.searchParams.get("topic"),
          custom: true,
        });
        if (candidate.success) recovered.push(candidate.data);
      } catch {
        /* A legacy draft URL may not contain a recoverable question. */
      }
    }
    return [
      ...new Map([...recovered, ...saved].map((q) => [q.id, q])).values(),
    ];
  },
  attempts: () => read<EssayAttempt[]>("attempts", z.array(attemptSchema), []),
  assessments: () =>
    read<Record<string, Assessment>>(
      "assessments",
      z.record(z.string(), assessmentSchema),
      {},
    ),
  expressions: () =>
    read<SavedExpression[]>("expressions", z.array(expressionSchema), []),
  draft: () => read<Draft | null>("draft", draftSchema.nullable(), null),
  saveDraft: (draft: Draft | null) => write("draft", draft),
  practices: () =>
    read<FocusPractice[]>("practices", z.array(focusPracticeSchema), []),
  export: () =>
    JSON.stringify(
      {
        version: 1,
        attempts: storage.attempts(),
        assessments: storage.assessments(),
        expressions: storage.expressions(),
        draft: storage.draft(),
        practices: storage.practices(),
        customQuestions: storage.customQuestions(),
      },
      null,
      2,
    ),
  import: (raw: string) => {
    const b = backupSchema.parse(JSON.parse(raw));
    const next = {
      attempts: b.attempts,
      assessments: b.assessments,
      expressions: b.expressions,
      draft: b.draft,
      practices: b.practices,
      customQuestions: b.customQuestions,
    };
    const old = Object.fromEntries(
      Object.keys(next).map((k) => [k, localStorage.getItem(prefix + k)]),
    );
    try {
      Object.entries(next).forEach(([k, v]) => write(k, v));
    } catch (e) {
      Object.entries(old).forEach(([k, v]) => {
        if (v === null) localStorage.removeItem(prefix + k);
        else localStorage.setItem(prefix + k, v);
      });
      throw e;
    }
  },
  clear: () =>
    [
      "attempts",
      "assessments",
      "expressions",
      "draft",
      "practices",
      "customQuestions",
    ].forEach((k) => localStorage.removeItem(prefix + k)),
};
