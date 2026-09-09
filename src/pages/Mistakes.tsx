import { isEligibleAttempt } from "../utils/eligibility";
import { zh } from "../utils/labels";
import { Link } from "react-router-dom";
import { useStore } from "../context";
import { Heading, Empty } from "../components/Shared";
import { recurring } from "./Progress";
export function Mistakes() {
  const { attempts, assessments } = useStore(),
    valid = attempts.filter((a) => !a.demo && isEligibleAttempt(a));
  const errors = valid.flatMap((a) =>
    (assessments[a.id]?.problems ?? [])
      .filter((p) => p.type === "language_error")
      .map((p) => ({ p, a })),
  );
  const categories = [...new Set(errors.map((e) => e.p.category))];
  const repeat = recurring(valid, assessments);
  return (
    <>
      <Heading
        title="我的易错点"
        description="发现语言习惯，逐步减少反复出现的问题。"
      />
      <div className="card">
        <h2> 反复出现的问题 </h2>
        <p>最近 5 次已评记录中，至少有 2 次出现的类别。 </p>
        {repeat.length ? (
          <div className="row wrap">
            {repeat.map(([k, v]) => (
              <span className="pill" key={k}>
                {zh(k)} · {v.essays} 次记录{" "}
              </span>
            ))}
          </div>
        ) : (
          <p> 暂未发现反复出现的问题。 </p>
        )}
      </div>
      <p className="muted">
        这里只统计明确的语言错误；观点展开、具体论据等能力通过趋势图追踪。{" "}
      </p>
      {!categories.length ? (
        <Empty
          title="还没有语言问题记录"
          text="导入一次反馈，开始积累自己的语言问题库。"
        />
      ) : (
        <div className="two-col">
          {categories.map((category) => {
            const list = errors.filter((e) => e.p.category === category);
            return (
              <details className="card" key={zh(category)}>
                <summary>
                  {zh(category)}{" "}
                  <span className="count">
                    {list.reduce(
                      (n, e) => n + 1 + e.p.otherOccurrences.length,
                      0,
                    )}{" "}
                    次{" "}
                  </span>
                </summary>
                {list.map(({ p, a }) => (
                  <article className="mistake-detail" key={a.id}>
                    <blockquote>{p.originalQuote}</blockquote>
                    <p className="correction">{p.correction}</p>
                    {p.otherOccurrences.map((q, i) => (
                      <blockquote key={i}>{q}</blockquote>
                    ))}
                    <p>{p.howToImprove}</p>
                    <Link to={`/review/${a.id}`}>
                      {zh(a.topic)} ·{" "}
                      {new Date(a.createdAt).toLocaleDateString()} ·{" "}
                      {zh(a.version)} →
                    </Link>
                  </article>
                ))}
              </details>
            );
          })}
        </div>
      )}
    </>
  );
}
