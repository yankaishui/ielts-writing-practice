import { Link } from "react-router-dom";
import { useStore } from "../context";
import {
  missingRecurring,
  reusedExpressions,
  textDiff,
} from "../utils/learning";
import { zh } from "../utils/labels";
import type { EssayAttempt, FocusPractice } from "../types";

export function RevisionEvidence({ practice: p }: { practice: FocusPractice }) {
  const diff = textDiff(p.original, p.revised);
  return (
    <article className="card revision-evidence">
      <div className="row between">
        <h3>{zh(p.dimension)} · 一次具体修改</h3>
        <small>
          {new Date(p.finishedAt ?? p.startedAt).toLocaleDateString("zh-CN")}
        </small>
      </div>
      <p>{p.goal}</p>
      <div className="two-col passage-pair">
        <section>
          <span className="eyebrow">修改前 · 原文保留</span>
          <div className="passage" lang="en">
            {diff
              .filter((x) => x.kind !== "added")
              .map((x, i) =>
                x.kind === "removed" ? (
                  <del key={i}>{x.text}</del>
                ) : (
                  <span key={i}>{x.text}</span>
                ),
              )}
          </div>
        </section>
        <section>
          <span className="eyebrow">修改后 · 你的练习</span>
          <div className="passage" lang="en">
            {diff
              .filter((x) => x.kind !== "removed")
              .map((x, i) =>
                x.kind === "added" ? (
                  <ins key={i}>{x.text}</ins>
                ) : (
                  <span key={i}>{x.text}</span>
                ),
              )}
          </div>
        </section>
      </div>
      {p.checks.length > 0 && (
        <p className="self-check-result">我的自查：{p.checks.join("；")}</p>
      )}
      {p.reflection && <p>我的修改思路：{p.reflection}</p>}
      <small>
        删除线标记删改内容，下划线标记新增内容。这是文字对比与个人自查，不是 AI
        评分，也不代表分数已提高。
      </small>
    </article>
  );
}
export function LearningEvidence({ attempt }: { attempt: EssayAttempt }) {
  const { attempts, assessments, practices, expressions } = useStore();
  const edits = practices.filter(
    (p) => p.essayId === attempt.id && p.finishedAt,
  );
  const missing = missingRecurring(attempt, attempts, assessments),
    reused = reusedExpressions(attempt, expressions);
  if (!edits.length && !missing.length && !reused.length) return null;
  return (
    <section className="learning-evidence">
      <div className="section-heading">
        <h2>看得见的变化</h2>
        <small>来自你的原文、练习与反馈记录</small>
      </div>
      {edits.slice(-3).map((p) => (
        <RevisionEvidence key={p.id} practice={p} />
      ))}
      {edits.length > 3 && (
        <Link to={`/focus/${attempt.id}`}>
          查看全部 {edits.length} 次专项修改 →
        </Link>
      )}
      <div className="two-col">
        {missing.slice(0, 3).map(({ category, essays }) => (
          <article className="card" key={category}>
            <span className="pill">反馈中的变化</span>
            <h3>{zh(category)}：本次未检出</h3>
            <p>
              此前最近 3 篇已评作文中，有 {essays.length}{" "}
              篇记录了这类问题；本次反馈没有记录。
            </p>
            <div className="row wrap">
              {essays.map((a) => (
                <Link key={a.id} to={`/review/${a.id}`}>
                  {new Date(a.createdAt).toLocaleDateString("zh-CN")} 的证据 →
                </Link>
              ))}
            </div>
            <small>
              每次反馈最多返回 5
              类问题；未检出不等于没有错误，也不代表已经掌握。
            </small>
          </article>
        ))}
        {reused.map(({ expression: e, quote }) => (
          <article className="card" key={e.id}>
            <span className="pill">收藏开始被用起来了</span>
            <h3>本篇出现了之前收藏的表达</h3>
            <blockquote lang="en">{quote}</blockquote>
            <p>{e.meaning}</p>
            <Link to={`/review/${e.sourceEssayId}`}>查看收藏来源 →</Link>
            <small>这是原文匹配记录，表达是否用得恰当仍需结合语境判断。</small>
          </article>
        ))}
      </div>
    </section>
  );
}
