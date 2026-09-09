import { isEligibleAttempt } from "../utils/eligibility";
import { zh } from "../utils/labels";
import { Link } from "react-router-dom";
import { ArrowUpRight, PenLine, Timer, ArrowRight } from "lucide-react";
import { useStore } from "../context";
import { stats, band, durationLabel } from "../utils/scoring";
import { Heading, Stat } from "../components/Shared";
import { storage } from "../services/storage";
import { nextPractice } from "../utils/learning";
export function Home() {
  const { attempts, assessments, practices } = useStore(),
    s = stats(attempts, assessments);
  const recent = attempts.filter(isEligibleAttempt).reverse().slice(0, 3);
  const draft = storage.draft();
  const next = nextPractice(attempts, assessments, practices);
  return (
    <>
      <Heading
        title={<>雅思写作练习 <span className="edition-badge">AI评分版</span></>}
        description="专注写作，心无旁骛。建议在电脑上使用，以获得最佳体验。"
      />
      {next && (
        <section className="card continue-practice">
          <div>
            <h2>
              {next.pending
                ? "上次的修改，还可以继续"
                : next.completed.length
                  ? "把上次练过的能力，再巩固一次"
                  : "继续上次的改进"}
            </h2>
            <p>
              <b>{zh(next.assessment.nextPriority.dimension)}</b> ·{" "}
              {zh(next.attempt.topic)}
            </p>
            <p>{next.pending?.goal ?? next.assessment.nextPriority.action}</p>
            <small>
              {next.pending
                ? "未完成的段落已保存，直接接着写即可。"
                : next.completed.length
                  ? `已留下 ${next.completed.length} 次专项修改，原文与改写都可以回看。`
                  : "不用重写整篇作文，先用 5 分钟改好一个段落。"}
            </small>
          </div>
          <div className="continue-actions">
            <Link className="button primary" to={`/focus/${next.attempt.id}`}>
              {next.pending
                ? "继续专项修改"
                : next.completed.length
                  ? "再练 5 分钟"
                  : "继续上次的改进"}{" "}
              →
            </Link>
            <Link to={`/review/${next.attempt.id}`}>
              回看这篇作文与修改记录
            </Link>
          </div>
        </section>
      )}
      <section className="practice-grid">
        <section className="practice-card full">
          <div className="row between">
            <span className="icon-tile">
              <PenLine size={23} />
            </span>
            <ArrowUpRight size={23} />
          </div>
          <div>
            <div className="eyebrow"> 完整模拟真实写作考试 </div>
            <h2> 完整作文 </h2>
            <p> 选题库或自定义题目，40 分钟，用自己的英语表达。 </p>
          </div>
          <div className="row between">
            <span> 大作文 · 至少 250 词 </span>
            <div className="home-essay-actions">
              <Link className="button primary" to="/questions">
                选择题目 <ArrowRight size={16} />
              </Link>
              <Link className="button" to="/questions?custom=1">
                自定义题目
              </Link>
            </div>
          </div>
        </section>
        <section className="practice-card">
          <div className="row between">
            <span className="icon-tile">
              <Timer size={23} />
            </span>
            <ArrowUpRight size={23} />
          </div>
          <div>
            <div className="eyebrow"> 一次专注一个段落 </div>
            <h2> 段落练习 </h2>
            <p> 从引言、主体段或结论开始练。 </p>
          </div>
          <div className="row between">
            <span> 引言 · 主体段 · 结论 </span>
            <Link className="button" to="/questions?quick=1">开始段落练习 <ArrowRight size={18} /></Link>
          </div>
        </section>
      </section>
      {draft?.started && (
        <div className="notice row between">
          <span>有一场未完成的练习已保存在本机，考试计时仍在继续。 </span>
          <Link to={draft.key} className="button">
            继续未完成的练习{" "}
          </Link>
        </div>
      )}
      {recent.length > 0 ? <>
      <div className="section-heading">
        <h2> 我的练习概况 </h2>
        <Link to="/progress"> 查看学习进度 → </Link>
      </div>
      <div className="stats-grid">
        <Stat label="已完成作文" value={s.essaysCompleted} />
        <Stat label="本周练习" value={s.sessionsThisWeek} />
        <Stat label="连续练习" value={`${s.currentStreak} 天`} />
        <Stat
          label="最近预估分数"
          value={s.latestBand?.toFixed(1) ?? "—"}
          note="仅供训练参考"
        />
      </div>
      <div className="card focus-summary">
        <span className="eyebrow"> 当前最需要加强的能力 </span>
        <h3>
          {s.weakestArea
            ? zh(s.weakestArea)
            : "从一篇作文开始，找到自己的突破口。"}
        </h3>
        <p>
          {s.weakestArea
            ? "下一次练习，专注解决一个具体问题。"
            : "完成作文并导入反馈，就能知道下一步该练什么。"}
        </p>
      </div>
      <div className="section-heading">
        <h2> 最近的练习 </h2>
        <Link to="/history"> 全部记录 → </Link>
      </div>
      {recent.length ? (
        <div className="card list">
          {recent.map((a) => (
            <Link className="history-row" key={a.id} to={`/review/${a.id}`}>
              <div>
                <strong>
                  {zh(a.topic)} <small>{a.demo ? "演示" : zh(a.kind)}</small>
                </strong>
                <p>
                  {zh(a.questionType)} ·{" "}
                  {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span>
                {a.wordCount} 词 · {durationLabel(a.duration)}
              </span>
              <b>
                {assessments[a.id]
                  ? band(assessments[a.id]).toFixed(1)
                  : "待导入反馈"}{" "}
                →
              </b>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card empty compact">
          <h3> 这里将留下你的第一篇作文。 </h3>
          <p>选择上方的题目开始练习，原稿与进步都会保留下来。 </p>
        </div>
      )}
      </> : <section className="card first-practice"><h2>从第一篇作文开始</h2><p>选题写作 → 导入 AI 点评 → 找到下一步练习重点</p><p>完成后，这里会展示你的练习记录和学习进度。</p></section>}
    </>
  );
}
