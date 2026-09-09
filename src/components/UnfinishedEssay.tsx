import { Link } from "react-router-dom";
import type { EssayAttempt } from "../types";
import { essayEligibility } from "../utils/eligibility";
import { Heading } from "./Shared";
export function UnfinishedEssay({ attempt: a }: { attempt: EssayAttempt }) {
  return (
    <>
      <Heading
        title="草稿已保存"
        description="这次先写到这里，准备好后可以继续。"
      />
      <section className="card">
        <p>
          {essayEligibility(a.text).reason || "空白练习已保留，不计入统计。"}
        </p>
        <p>
          不会计入作文数量、连续练习天数或分数趋势。150
          词只是本站的统计门槛，完整 Task 2 仍以至少 250 词为目标。
        </p>
        <Link
          className="button primary"
          to={`/exam/${a.questionId}?parent=${a.id}&resume=1${a.kind !== "Full Essay" ? `&kind=${encodeURIComponent(a.kind)}` : ""}`}
        >
          继续写这篇草稿
        </Link>
        <p className="muted">继续时会重新开始一次计时，完成后另存为新记录。</p>
        <Link to="/">返回首页</Link>
      </section>
      <section className="card">
        <h2>{a.question}</h2>
        <div style={{ whiteSpace: "pre-wrap" }}>
          {a.text || "（尚未输入内容）"}
        </div>
      </section>
    </>
  );
}
