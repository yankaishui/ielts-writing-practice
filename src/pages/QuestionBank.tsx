import { useStore } from "../context";
import { isEligibleAttempt } from "../utils/eligibility";
import { questionAliases } from "../data/questions";
import { CustomQuestion } from "../components/CustomQuestion";
import { zh } from "../utils/labels";
import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Shuffle } from "lucide-react";
import { questions } from "../data/questions";
import { questionTypes } from "../types";
import { Heading } from "../components/Shared";
export function QuestionBank() {
  const { customQuestions, attempts } = useStore();
  const allQuestions = [...questions, ...customQuestions];
  const completed = attempts
    .filter((a) => !a.demo && isEligibleAttempt(a))
    .sort((a, b) => b.finishTime.localeCompare(a.finishTime));
  const [type, setType] = useState(""),
    [topic, setTopic] = useState(""),
    [source, setSource] = useState("site");
  const [params] = useSearchParams(),
    quick = params.has("quick"),
    navigate = useNavigate();
  const list = allQuestions.filter(
    (q) =>
      (!type || q.questionType === type) &&
      (!topic || q.topic === topic) &&
      (source === "custom" ? Boolean(q.custom) : !q.custom),
  );
  const path = (id: string) =>
    `/exam/${id}${quick ? "?kind=Introduction" : ""}`;
  return (
    <>
      <Heading
        title={quick ? "选择段落练习题目" : "写作题库"}
        description="选一道题，静下心来，把观点写清楚。"
        action={
          <button
            className="primary"
            disabled={!list.length}
            onClick={() =>
              navigate(path(list[Math.floor(Math.random() * list.length)].id))
            }
          >
            <Shuffle size={17} /> 随机选题{" "}
          </button>
        }
      />
      {!quick && (
        <CustomQuestion
          open={params.has("custom")}
          topics={[...new Set(allQuestions.map((q) => q.topic))].sort()}
        />
      )}
      <div className="card filters">
        <label>
          题型{" "}
          <select
            aria-label="题型"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value=""> 全部题型 </option>
            {questionTypes.map((t) => (
              <option key={t} value={t}>
                {zh(t)}
              </option>
            ))}
          </select>
        </label>
        <label>
          话题{" "}
          <select
            aria-label="话题"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            <option value=""> 全部话题 </option>
            {[...new Set(allQuestions.map((q) => q.topic))].sort().map((t) => (
              <option key={t} value={t}>
                {zh(t)}
              </option>
            ))}
          </select>
        </label>
        <label>
          题目来源
          <select
            aria-label="题目来源"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="site">本网站</option>
            <option value="custom">用户新增</option>
          </select>
        </label>
        <span>{list.length} 道练习题 </span>
      </div>
      <div className="question-grid">
        {list.map((q, i) => {
          const history = completed.filter(
            (a) => (questionAliases[a.questionId] ?? a.questionId) === q.id,
          );
          return (
            <article className="card question" key={q.id}>
              <div className="row between">
                <span className="pill">{zh(q.topic)}</span>
                <small>{String(i + 1).padStart(2, "0")}</small>
              </div>
              <h3>{q.text}</h3>
              {history.length > 0 && (
                <Link
                  className="pill practiced-link"
                  to={`/review/${history[0].id}`}
                >
                  ✓ 已练习 {history.length} 次 · 查看最近复盘 →
                </Link>
              )}

              <div className="row between">
                <small>{zh(q.questionType)}</small>
                <Link className="button" to={path(q.id)}>
                  开始练习 →{" "}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      {!list.length && (
        <div className="empty card">
          没有同时符合筛选条件的题目，换一组筛选试试。{" "}
        </div>
      )}
    </>
  );
}
