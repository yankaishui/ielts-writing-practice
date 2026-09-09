import { isEligibleAttempt } from "../utils/eligibility";
import { zh } from "../utils/labels";
import { Link, useParams } from "react-router-dom";
import { useStore } from "../context";
import { Heading, Missing, Stat } from "../components/Shared";
import { DiagnosticRadar } from "../components/DiagnosticRadar";
import { AnnotatedEssay } from "../components/AnnotatedEssay";
import { ReviewCards } from "../components/ReviewCards";
import { UnfinishedEssay } from "../components/UnfinishedEssay";
import { NextAction } from "../components/NextAction";
import { LearningEvidence } from "../components/LearningEvidence";
import { needsChineseFeedback } from "../services/feedbackLanguage";
import { band, durationLabel, extremes } from "../utils/scoring";
import {
  dimensions,
  scoreLabels,
  type Dimension,
  type ScoreKey,
} from "../types";
export function Review() {
  const { id } = useParams(),
    { attempts, assessments } = useStore(),
    a = attempts.find((a) => a.id === id);
  if (!a) return <Missing />;
  if (!isEligibleAttempt(a)) return <UnfinishedEssay attempt={a} />;
  const feedback = assessments[a.id],
    ex = feedback ? extremes(feedback) : null;
  const habits = feedback?.problems
    .filter((p) => p.type === "language_error")
    .sort((a, b) => b.otherOccurrences.length - a.otherOccurrences.length);
  return (
    <>
      <Heading
        eyebrow={`${zh(a.topic)} · ${zh(a.questionType)}`}
        title="作文复盘"
        description={`${new Date(a.createdAt).toLocaleString("zh-CN")} · ${zh(a.kind)} · ${zh(a.version)}${a.demo ? " · 演示 / 开发测试" : ""}`}
        action={
          a.kind === "Full Essay" ? (
            <Link className="button" to={`/feedback/${a.id}`}>
              {feedback ? "重新导入反馈" : "获取 AI 反馈"} →
            </Link>
          ) : undefined
        }
      />
      <div className="review-meta">
        <span>{a.wordCount} 词 </span>
        <span>{durationLabel(a.duration)} 写作用时 </span>
        <span>
          离开页面： {a.focusEvents.length}
          {a.mode === "Practice" ? "（未启用追踪）" : ""}
        </span>
        <span>
          {a.version === "Exam" ? "考试原稿 · 已锁定" : "独立版本 · 已保存"}
        </span>
      </div>
      {feedback && ex ? (
        <>
          {needsChineseFeedback(feedback) && (
            <div className="notice">
              这份历史反馈仍是英文。新版评分指令要求中文评语；你也可以保留原评分，只请
              AI 翻译说明。
              <Link to={`/feedback/${a.id}`}>获取中文转换指令 →</Link>
            </div>
          )}
          <NextAction attempt={a} assessment={feedback} />
          <div className="review-summary">
            <div className="card band-card">
              <span> 大作文预估分数 </span>
              <strong>{band(feedback).toFixed(1)}</strong>
              <small> 仅供训练参考，非雅思官方成绩。 </small>
            </div>
            <div className="summary-grid">
              <Stat
                label="当前优势"
                value={zh(dimensions[ex.strongest[0] as Dimension])}
                note={`${ex.strongest[1].toFixed(1)} / 10`}
              />
              <Stat
                label="最需加强"
                value={zh(dimensions[ex.weakest[0] as Dimension])}
                note={`${ex.weakest[1].toFixed(1)} / 10`}
              />
              <Stat
                label="下一步重点"
                value={zh(feedback.nextPriority.dimension)}
                note={feedback.nextPriority.action}
              />
              <Stat
                label="主要语言习惯"
                value={
                  habits?.[0]
                    ? `${zh(habits[0].category)} ×${habits[0].otherOccurrences.length + 1}`
                    : "未检出明确错误"
                }
                note="按反馈中的原文出现次数统计"
              />
            </div>
          </div>
          <div className="two-col">
            <DiagnosticRadar scores={feedback.diagnostics} />
            <section className="card">
              <h2> 雅思四项评分 </h2>
              {Object.entries(scoreLabels).map(([k, label]) => (
                <div className="criterion" key={k}>
                  <div className="row between">
                    <h3>{zh(label)}</h3>
                    <b>{feedback.scores[k as ScoreKey].score.toFixed(1)}</b>
                  </div>
                  <p>
                    {feedback.scores[k as ScoreKey].reason ||
                      "未提供具体原因。"}
                  </p>
                </div>
              ))}
            </section>
          </div>
        </>
      ) : (
        <div className="notice">
          {a.kind === "Full Essay"
            ? "作文已保存，导入 AI 反馈后即可查看能力画像。"
            : "段落练习已完成。段落练习不评完整 IELTS 分数。"}
        </div>
      )}
      <details className="card">
        <summary> 题目与练习详情 </summary>
        <p>{a.question}</p>
        <p>
          开始： {new Date(a.startTime).toLocaleString()} · 结束：{" "}
          {new Date(a.finishTime).toLocaleString()}
        </p>
        <p>
          累计离开： {durationLabel(a.totalTimeAway)} · 最长停顿：{" "}
          {durationLabel(a.longestPause)} · 输入变化次数： {a.inputEvents}
        </p>
        <small>
          仅统计输入变化次数，不记录逐个按键。最长停顿包含首次输入前和最后输入后的时间。{" "}
        </small>
        {a.focusEvents.map((f, i) => (
          <p key={i}>
            离开 {i + 1}: {new Date(f.startTime).toLocaleTimeString()} →{" "}
            {new Date(f.returnTime).toLocaleTimeString()} ·{" "}
            {f.duration.toFixed(1)} 秒{" "}
          </p>
        ))}
      </details>
      <AnnotatedEssay text={a.text} assessment={feedback} />
      <LearningEvidence attempt={a} />
      {feedback && <ReviewCards assessment={feedback} essayId={a.id} />}
      <div className="card revision-bar">
        <div>
          <h2> 把反馈用到下一次写作中 </h2>
          <p> 修订与重写都会保存为独立版本。 </p>
        </div>
        <div className="row">
          <Link
            className="button"
            to={`/exam/${a.questionId}?parent=${a.id}&version=Revision${a.kind !== "Full Essay" ? `&kind=${encodeURIComponent(a.kind)}` : ""}`}
          >
            修订整篇作文{" "}
          </Link>
          <Link
            className="button primary"
            to={`/exam/${a.questionId}?parent=${a.id}${a.kind !== "Full Essay" ? `&kind=${encodeURIComponent(a.kind)}` : ""}`}
          >
            从头重新写{" "}
          </Link>
        </div>
      </div>
    </>
  );
}
