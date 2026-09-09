import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStore } from "../context";
import { Heading, Missing } from "../components/Shared";
import { RevisionEvidence } from "../components/LearningEvidence";
import { paragraphTarget } from "../utils/learning";
import { zh } from "../utils/labels";
import { durationLabel, wordCount } from "../utils/scoring";
import type { FocusPractice as Practice } from "../types";

export function FocusPracticePage() {
  const { id } = useParams(),
    store = useStore(),
    attempt = store.attempts.find((a) => a.id === id),
    assessment = id ? store.assessments[id] : undefined;
  if (!attempt || !assessment) return <Missing />;
  return <PracticeEditor key={id} essayId={attempt.id} />;
}
function PracticeEditor({ essayId }: { essayId: string }) {
  const store = useStore(),
    attempt = store.attempts.find((a) => a.id === essayId)!,
    assessment = store.assessments[essayId],
    target = paragraphTarget(attempt.text, assessment);
  const [index, setIndex] = useState(target.index),
    [error, setError] = useState(""),
    [now, setNow] = useState(Date.now()),
    [completed, setCompleted] = useState<string | null>(null);
  const active = store.practices.find(
      (p) => p.essayId === essayId && !p.finishedAt,
    ),
    history = store.practices.filter(
      (p) => p.essayId === essayId && p.finishedAt,
    ),
    result = store.practices.find((p) => p.id === completed);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [active?.id]);
  function persist(p: Practice) {
    try {
      store.savePractice(p);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function start() {
    const original = target.paragraphs[index];
    if (!original) return;
    persist({
      id: crypto.randomUUID(),
      essayId,
      dimension: assessment.nextPriority.dimension,
      goal: assessment.nextPriority.action,
      original,
      paragraphIndex: index,
      revised: original,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      duration: 0,
      checks: [],
      reflection: "",
    });
    setNow(Date.now());
    setCompleted(null);
  }
  const elapsed = active
    ? Math.max(0, (now - new Date(active.startedAt).getTime()) / 1000)
    : 0;
  const checks = [
    "我让这段文字更直接地回答题目",
    "我补充或理清了为什么、如何、原因或结果",
    "我让信息更具体，没有编造事实",
    "我检查了英语表达，并保留了原来的立场",
  ];
  function finish() {
    if (
      !active ||
      !active.revised.trim() ||
      active.original.trim() === active.revised.trim()
    )
      return;
    const end = new Date();
    try {
      store.savePractice({
        ...active,
        finishedAt: end.toISOString(),
        duration: Math.max(
          0,
          (end.getTime() - new Date(active.startedAt).getTime()) / 1000,
        ),
      });
      setCompleted(active.id);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <Heading
        eyebrow="反馈之后，向前一步"
        title="5 分钟专项修改"
        description={`${zh(attempt.topic)} · ${zh(assessment.nextPriority.dimension)} · 每次只改一段`}
        action={
          <Link className="button" to={`/review/${essayId}`}>
            返回作文复盘
          </Link>
        }
      />
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {result ? (
        <>
          <div className="notice">
            这次修改已保存。你可以直接看到自己改了什么。
          </div>
          <RevisionEvidence practice={result} />
          <div className="row wrap">
            <Link className="button primary" to={`/review/${essayId}`}>
              回到复盘，看看变化
            </Link>
            <button onClick={() => setCompleted(null)}>再练一个段落</button>
          </div>
        </>
      ) : (
        <>
          <div className="card focus-brief">
            <span className="pill">
              {zh(active?.dimension ?? assessment.nextPriority.dimension)}
            </span>
            <h2>本次只做一件事</h2>
            <p>{active?.goal ?? assessment.nextPriority.action}</p>
            <small>
              这是专项训练，不给段落打完整作文分数。5
              分钟是建议时长，到时可以继续修改。
            </small>
          </div>
          {!active ? (
            <section className="card">
              <label>
                选择要练习的段落
                <select
                  aria-label="选择要练习的段落"
                  value={index}
                  onChange={(e) => setIndex(Number(e.target.value))}
                >
                  {target.paragraphs.map((_, i) => (
                    <option key={i} value={i}>
                      第 {i + 1} 段{i === target.index ? " · 根据反馈推荐" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div className="passage" lang="en">
                {target.paragraphs[index]}
              </div>
              <button
                className="primary"
                onClick={start}
                disabled={!target.paragraphs[index]}
              >
                开始 5 分钟修改
              </button>
            </section>
          ) : (
            <>
              <div className="card practice-timer row between">
                <span>
                  {elapsed >= 300
                    ? "建议的 5 分钟已到，可以继续完善"
                    : "建议剩余时间"}{" "}
                  <b role="timer">
                    {durationLabel(Math.max(0, 300 - elapsed))}
                  </b>
                </span>
                <span>
                  {wordCount(active.revised)} 词 · 已用 {durationLabel(elapsed)}
                </span>
                <small>草稿自动保存，离开后计时继续</small>
              </div>
              <div className="two-col focus-editor">
                <section className="card">
                  <h2>修改前</h2>
                  <div className="passage" lang="en">
                    {active.original}
                  </div>
                  <small>这段原文和完整考试原稿始终保留。</small>
                </section>
                <section className="card">
                  <label htmlFor="focus-text">修改后 · 用英文写</label>
                  <textarea
                    id="focus-text"
                    aria-label="专项修改内容"
                    spellCheck={false}
                    autoCorrect="off"
                    autoComplete="off"
                    autoCapitalize="off"
                    data-gramm="false"
                    data-gramm_editor="false"
                    data-enable-grammarly="false"
                    value={active.revised}
                    onChange={(e) =>
                      persist({ ...active, revised: e.target.value })
                    }
                  />
                </section>
              </div>
              <section className="card self-check">
                <h2>保存前，自己看一眼</h2>
                <p>
                  只勾选你认为这次做到了的项目，可以不勾选。这里记录的是你的自查。
                </p>
                {checks.map((c) => (
                  <label key={c}>
                    <input
                      type="checkbox"
                      checked={active.checks.includes(c)}
                      onChange={(e) =>
                        persist({
                          ...active,
                          checks: e.target.checked
                            ? [...active.checks, c]
                            : active.checks.filter((x) => x !== c),
                        })
                      }
                    />
                    {c}
                  </label>
                ))}
                <label htmlFor="reflection">
                  我具体改了什么？（可选，中文即可）
                </label>
                <textarea
                  id="reflection"
                  rows={2}
                  value={active.reflection}
                  onChange={(e) =>
                    persist({ ...active, reflection: e.target.value })
                  }
                  placeholder="例如：补充了公共交通如何让更多人减少开车。"
                />
                <button
                  className="primary"
                  onClick={finish}
                  disabled={
                    !active.revised.trim() ||
                    active.original.trim() === active.revised.trim()
                  }
                >
                  保存修改，查看前后对比
                </button>
                {active.original.trim() === active.revised.trim() && (
                  <small>先做一次实际修改，再保存对比。</small>
                )}
                <Link className="button" to="/">
                  先保存草稿，下次继续
                </Link>
              </section>
            </>
          )}
        </>
      )}
      {history.length > 0 && (
        <details className="practice-history">
          <summary>这篇作文的专项修改记录（{history.length} 次）</summary>
          {[...history].reverse().map((p) => (
            <RevisionEvidence key={p.id} practice={p} />
          ))}
        </details>
      )}
    </>
  );
}
