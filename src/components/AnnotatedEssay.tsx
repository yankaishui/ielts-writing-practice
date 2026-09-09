import { zh } from "../utils/labels";
import { useState } from "react";
import type { Assessment } from "../types";
interface Annotation {
  quote: string;
  label: string;
  kind: string;
  detail: string;
  action: string;
}
export function AnnotatedEssay({
  text,
  assessment,
}: {
  text: string;
  assessment?: Assessment;
}) {
  const [selected, setSelected] = useState<Annotation | null>(null);
  const annotations: Annotation[] = assessment
    ? [
        ...assessment.problems.flatMap((p) =>
          [p.originalQuote, ...p.otherOccurrences].map((quote) => ({
            quote,
            label: p.category,
            kind: p.type === "language_error" ? "language" : "writing",
            detail: p.explanation,
            action:
              quote === p.originalQuote
                ? [p.correction, p.howToImprove].filter(Boolean).join(" — ")
                : p.howToImprove,
          })),
        ),
        ...assessment.strengths.map((s) => ({
          quote: s.originalQuote,
          label: s.category,
          kind: "strength",
          detail: s.whyItWorks,
          action: "",
        })),
        ...assessment.upgrades.map((u) => ({
          quote: u.original,
          label: "Upgrade",
          kind: "upgrade",
          detail: u.reason,
          action: u.improved,
        })),
      ]
    : [];
  const spans: { start: number; end: number; a: Annotation }[] = [];
  for (const a of annotations) {
    if (!a.quote) continue;
    let from = 0,
      index = text.indexOf(a.quote, from);
    while (index >= 0) {
      const end = index + a.quote.length;
      if (!spans.some((s) => index < s.end && end > s.start)) {
        spans.push({ start: index, end, a });
        break;
      }
      from = end;
      index = text.indexOf(a.quote, from);
    }
  }
  spans.sort((a, b) => a.start - b.start);
  let cursor = 0;
  const parts = [];
  for (const s of spans) {
    parts.push(text.slice(cursor, s.start));
    parts.push(
      <button
        key={s.start}
        className={`annotation ${s.a.kind}`}
        aria-label={`${zh(s.a.label)}：${s.a.quote}`}
        onClick={() => setSelected(s.a)}
      >
        {s.a.quote}
        <sup>
          {s.a.kind === "language"
            ? "错"
            : s.a.kind === "writing"
              ? "议"
              : s.a.kind === "strength"
                ? "优"
                : "改"}
        </sup>
      </button>,
    );
    cursor = s.end;
  }
  parts.push(text.slice(cursor));
  return (
    <section className="card">
      <div className="row between">
        <h2> 原文标注 </h2>
        <small> 点击带标记的文字查看反馈 </small>
      </div>
      <div className="legend">
        <span> 错 · 语言错误 </span>
        <span> 议 · 写作问题 </span>
        <span> 优 · 值得保留 </span>
        <span> 改 · 表达优化 </span>
      </div>
      <div className="essay-text">{parts}</div>
      {selected && (
        <aside className="feedback-panel" aria-live="polite">
          <div className="row between">
            <h3>{zh(selected.label)}</h3>
            <button onClick={() => setSelected(null)} aria-label="关闭反馈">
              ×
            </button>
          </div>
          <p>{selected.detail}</p>
          {selected.action && (
            <>
              <b> 改进方法 / 建议表达 </b>
              <p>{selected.action}</p>
            </>
          )}
        </aside>
      )}
      <small>所有反馈都保留在下方卡片中，未匹配或重叠的引用也不会丢失。 </small>
    </section>
  );
}
