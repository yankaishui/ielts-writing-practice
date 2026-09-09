import { isEligibleAttempt } from "../utils/eligibility";
import { zh } from "../utils/labels";
import { Link } from "react-router-dom";
import { useStore } from "../context";
import { Heading, Empty } from "../components/Shared";
import { band, durationLabel } from "../utils/scoring";
export function History() {
  const { attempts, assessments, practices } = useStore();
  const completed = attempts.filter(isEligibleAttempt);
  const unfinished = attempts.filter((a) => !isEligibleAttempt(a));
  return (
    <>
      <Heading
        title="练习记录"
        description="保留每次练习、每个版本，回看自己怎么一步步写得更好。"
      />
      {!completed.length ? (
        <Empty />
      ) : (
        <div className="card table-scroll">
          <table>
            <thead>
              <tr>
                <th> 日期 / 版本 </th>
                <th> 话题 / 题型 </th>
                <th> 词数 </th>
                <th> 用时 </th>
                <th> 预估分数 </th>
                <th> 下一步重点 </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[...completed].reverse().map((a) => (
                <tr key={a.id}>
                  <td>
                    {new Date(a.createdAt).toLocaleDateString()}
                    <small>
                      {zh(a.kind)} · {zh(a.version)}
                      {a.demo ? " · 演示" : ""}
                    </small>
                  </td>
                  <td>
                    {zh(a.topic)}
                    <small>{zh(a.questionType)}</small>
                  </td>
                  <td>{a.wordCount}</td>
                  <td>{durationLabel(a.duration)}</td>
                  <td>
                    {assessments[a.id]
                      ? band(assessments[a.id]).toFixed(1)
                      : "—"}
                  </td>
                  <td>
                    {zh(assessments[a.id]?.nextPriority.dimension) ||
                      (a.kind === "Full Essay" ? "待导入反馈" : "段落练习")}
                  </td>
                  <td>
                    <Link to={`/review/${a.id}`}> 查看复盘 → </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {unfinished.length > 0 && (
        <details className="card">
          <summary>未完成草稿（不计入统计）</summary>
          <p>内容仍保存在本机，随时可以继续写。</p>
          {unfinished.map((a) => (
            <p key={a.id}>
              <Link to={`/review/${a.id}`}>
                {zh(a.topic)} · {new Date(a.createdAt).toLocaleDateString()} ·
                查看草稿 →
              </Link>
            </p>
          ))}
        </details>
      )}
      {practices.length > 0 && (
        <section>
          <div className="section-heading">
            <h2>专项修改记录</h2>
            <small>段落练习独立保存，不改变整篇作文</small>
          </div>
          <div className="card list">
            {[...practices].reverse().map((p) => {
              const essay = attempts.find((a) => a.id === p.essayId);
              return (
                <Link
                  key={p.id}
                  className="history-row"
                  to={`/focus/${p.essayId}`}
                >
                  <div>
                    <strong>
                      {zh(p.dimension)}
                      {essay?.demo ? " · 演示" : ""}
                    </strong>
                    <p>
                      {zh(essay?.topic)} ·{" "}
                      {new Date(p.finishedAt ?? p.startedAt).toLocaleString(
                        "zh-CN",
                      )}
                    </p>
                  </div>
                  <span>
                    {p.finishedAt
                      ? "已完成 · " + durationLabel(p.duration)
                      : "草稿已保存"}
                  </span>
                  <b>{p.finishedAt ? "查看前后对比" : "继续修改"} →</b>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
