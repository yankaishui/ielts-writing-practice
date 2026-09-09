import { Link } from "react-router-dom";
import { useStore } from "../context";
import { paragraphTarget } from "../utils/learning";
import { zh } from "../utils/labels";
import type { Assessment, EssayAttempt } from "../types";
export function NextAction({
  attempt,
  assessment,
}: {
  attempt: EssayAttempt;
  assessment: Assessment;
}) {
  const { practices } = useStore(),
    target = paragraphTarget(attempt.text, assessment),
    pending = practices.find((p) => p.essayId === attempt.id && !p.finishedAt);
  return (
    <section className="card next-action">
      <div className="row between">
        <span className="eyebrow">这一次，先改好一个地方</span>
        <span className="pill">5 分钟专项练习</span>
      </div>
      <h2>{zh(assessment.nextPriority.dimension)}：下一步从这里开始</h2>
      <p>{assessment.nextPriority.reason}</p>
      {target.problem?.originalQuote && (
        <blockquote lang="en">{target.problem.originalQuote}</blockquote>
      )}
      <div className="action-goal">
        <b>本次只做一件事</b>
        <p>
          {assessment.nextPriority.action ||
            "选一段原文，针对这项能力完成一次有明确目的的修改。"}
        </p>
      </div>
      <Link className="button primary" to={`/focus/${attempt.id}`}>
        {pending ? "继续未完成的专项修改" : "花 5 分钟，改好这一段"} →
      </Link>
      <small>只练相关段落，原始作文保持不变。</small>
    </section>
  );
}
