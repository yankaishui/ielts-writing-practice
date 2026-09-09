import type { EssayAttempt } from "../types";

export const MIN_FULL_ESSAY_WORDS = 150;
// Conservative, local checks only. This does not grade grammar or judge ideas.
export function essayEligibility(text: string) {
  const tokens = text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) ?? [];
  const english = tokens.filter((t) => /^[a-z]+(?:['’\-][a-z]+)*$/i.test(t));
  if (english.length < MIN_FULL_ESSAY_WORDS)
    return {
      eligible: false,
      reason:
        "这篇作文还不足 150 个英文单词，先存为草稿，写完后再计入练习统计。",
    };
  const lower = english.map((t) => t.toLowerCase());
  const counts = new Map<string, number>();
  for (const t of lower) counts.set(t, (counts.get(t) ?? 0) + 1);
  const hasEnglishStructure = lower.some((t) =>
    /^(the|a|an|is|are|was|were|be|been|of|to|for|and|but|or|in|on|with|that|this|it|they|we|i|can|should|will|have|has|do|does|not|as|by|from)$/.test(
      t,
    ),
  );
  const sentences = text
    .toLowerCase()
    .split(/[.!?]+/)
    .map((t) => t.trim().replace(/\s+/g, " "))
    .filter(Boolean);
  const repeatedSentence =
    sentences.length >= 4 && new Set(sentences).size === 1;
  const suspicious = lower.filter(
    (t) =>
      t.length > 30 ||
      /(.)\1{4}/.test(t) ||
      (t.length > 5 && !/[aeiouy]/.test(t)) ||
      /^(?:asdf|qwer|zxcv|hjkl)/.test(t),
  );
  if (
    !hasEnglishStructure ||
    repeatedSentence ||
    english.length / tokens.length < 0.6 ||
    counts.size < 15 ||
    [...counts.values()].reduce((max, n) => Math.max(max, n), 0) /
      english.length >
      0.3 ||
    suspicious.length / english.length > 0.4
  )
    return {
      eligible: false,
      reason:
        "内容中有大量重复字符或非英文文本，暂存为草稿。这里仅做基础文本检查，不判断语法、观点或写作水平。",
    };
  return { eligible: true, reason: "" };
}
export function isEligibleAttempt(a: EssayAttempt) {
  return a.kind === "Full Essay"
    ? essayEligibility(a.text).eligible
    : a.text.trim().length > 0;
}
