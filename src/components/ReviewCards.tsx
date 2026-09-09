import { zh } from "../utils/labels";
import { useState } from "react";
import { useStore } from "../context";
import type { Assessment, SavedExpression } from "../types";
export function ReviewCards({
  assessment: a,
  essayId,
}: {
  assessment: Assessment;
  essayId: string;
}) {
  const [tab, setTab] = useState("待改进");
  const store = useStore();
  function save(
    expression: string,
    meaning: string,
    example: string,
    type: SavedExpression["type"],
  ) {
    try {
      store.saveExpression({
        expression,
        meaning,
        example,
        sourceEssayId: essayId,
        type,
      });
    } catch (e) {
      alert((e as Error).message);
    }
  }
  const saveButton = (
    text: string,
    meaning: string,
    example: string,
    type: SavedExpression["type"],
  ) => (
    <button
      disabled={store.expressions.some(
        (e) => e.expression === text && e.sourceEssayId === essayId,
      )}
      onClick={() => save(text, meaning, example, type)}
    >
      {store.expressions.some(
        (e) => e.expression === text && e.sourceEssayId === essayId,
      )
        ? "已收藏"
        : type === "Upgrade"
          ? "收藏优化表达"
          : "收藏到我的表达"}
    </button>
  );
  return (
    <section>
      <div className="tabs" role="tablist">
        {["待改进", "值得保留", "表达优化", "实用表达"].map((t) => (
          <button
            role="tab"
            aria-selected={tab === t}
            key={t}
            onClick={() => setTab(t)}
          >
            {zh(t)}{" "}
            <span>
              {t === "待改进"
                ? a.problems.length
                : t === "值得保留"
                  ? a.strengths.length
                  : t === "表达优化"
                    ? a.upgrades.length
                    : a.usefulExpressions.length}
            </span>
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === "待改进" && (
          <div className="two-col">
            {(["writing_issue", "language_error"] as const).map((type) => (
              <section key={type}>
                <h2 className="subheading">
                  {type === "writing_issue" ? "写作质量" : "语言习惯"}
                </h2>
                {a.problems
                  .filter((p) => p.type === type)
                  .map((p, i) => (
                    <article className="card feedback-card" key={i}>
                      <div className="row between">
                        <h3>
                          {zh(p.category)}
                          {type === "language_error"
                            ? ` ×${1 + p.otherOccurrences.length}`
                            : ""}
                        </h3>
                        {p.confidence && (
                          <small>{zh(p.confidence)} 置信度 </small>
                        )}
                      </div>
                      <blockquote>
                        {p.originalQuote || "未提供精确原文。"}
                      </blockquote>
                      {p.correction && (
                        <p className="correction">→ {p.correction}</p>
                      )}
                      <p>{p.explanation}</p>
                      <b> 怎么改进 </b>
                      <p>{p.howToImprove || "未提供具体行动。"}</p>
                      {p.otherOccurrences.length > 0 && (
                        <details>
                          <summary>
                            其他出现位置（ {p.otherOccurrences.length})
                          </summary>
                          {p.otherOccurrences.map((o, j) => (
                            <blockquote key={j}>{o}</blockquote>
                          ))}
                        </details>
                      )}
                    </article>
                  ))}
                {!a.problems.some((p) => p.type === type) && (
                  <div className="card muted">
                    {type === "language_error"
                      ? "本次未检出明确的语言错误。"
                      : "本次未列出写作质量问题。"}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
        {tab === "值得保留" && (
          <div className="two-col">
            {a.strengths.map((s, i) => (
              <article className="card feedback-card" key={i}>
                <span className="pill">{zh(s.category)}</span>
                <blockquote>{s.originalQuote}</blockquote>
                <p>{s.whyItWorks}</p>
                {saveButton(
                  s.originalQuote,
                  s.whyItWorks,
                  s.originalQuote,
                  "Strength",
                )}
              </article>
            ))}
            {!a.strengths.length && (
              <p> 本次没有特别列出的优点，无须凑数量。 </p>
            )}
          </div>
        )}
        {tab === "表达优化" && (
          <div className="two-col">
            {a.upgrades.map((u, i) => (
              <article className="card feedback-card" key={i}>
                <small> 原文 </small>
                <blockquote>{u.original}</blockquote>
                <div>↓</div>
                <small> 建议改写 </small>
                <p className="correction">{u.improved}</p>
                <p>{u.reason}</p>
                {saveButton(u.improved, u.reason, u.improved, "Upgrade")}
              </article>
            ))}
            {!a.upgrades.length && <p> 本次没有表达优化建议。 </p>}
          </div>
        )}
        {tab === "实用表达" && (
          <div className="two-col">
            {a.usefulExpressions.map((e, i) => (
              <article className="card feedback-card" key={i}>
                <span className="pill">{zh(e.source)}</span>
                <h3>{e.expression}</h3>
                <p>{e.meaning}</p>
                <blockquote>{e.example}</blockquote>
                {saveButton(
                  e.expression,
                  e.meaning,
                  e.example,
                  "Useful Expression",
                )}
              </article>
            ))}
            {!a.usefulExpressions.length && <p> 本次没有列出实用表达。 </p>}
          </div>
        )}
      </div>
    </section>
  );
}
