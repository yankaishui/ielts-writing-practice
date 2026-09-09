import { zh } from "../utils/labels";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../context";
import { Heading, Empty } from "../components/Shared";
export function Expressions() {
  const store = useStore(),
    [filter, setFilter] = useState("All");
  const list = store.expressions.filter(
    (e) => filter === "All" || e.status === filter,
  );
  function update(id: string, status: "Learning" | "Mastered" | "Delete") {
    try {
      store.updateExpression(id, status);
    } catch (e) {
      alert((e as Error).message);
    }
  }
  return (
    <>
      <Heading
        title="我的表达"
        description="把原文与反馈中值得学习的英语表达留下来。"
        action={
          <Link className="button primary" to="/expressions/review">
            复习表达 →{" "}
          </Link>
        }
      />
      <div className="tabs">
        {["All", "Learning", "Mastered"].map((s) => (
          <button
            key={zh(s)}
            aria-pressed={s === filter}
            onClick={() => setFilter(s)}
          >
            {zh(s)}
          </button>
        ))}
      </div>
      {!list.length ? (
        <Empty
          title="这里还没有收藏的表达"
          text="在作文复盘中，收藏优点、优化表达或实用表达。"
          to="/history"
          label="打开练习记录"
        />
      ) : (
        <div className="two-col">
          {list.map((e) => (
            <article className="card feedback-card" key={e.id}>
              <div className="row between">
                <span className="pill">{zh(e.type)}</span>
                <small>{zh(e.status)}</small>
              </div>
              <h2>{e.expression}</h2>
              <p>{e.meaning}</p>
              <blockquote>{e.example}</blockquote>
              <Link to={`/review/${e.sourceEssayId}`}> 查看来源作文 → </Link>
              <small>
                {" "}
                已收藏 {new Date(e.dateSaved).toLocaleDateString()}
              </small>
              <div className="row">
                <button
                  onClick={() =>
                    update(
                      e.id,
                      e.status === "Learning" ? "Mastered" : "Learning",
                    )
                  }
                >
                  {e.status === "Learning" ? "标记为已掌握" : "还需练习"}
                </button>
                <button
                  className="danger-text"
                  onClick={() => {
                    if (confirm("确定删除这条收藏表达吗？"))
                      update(e.id, "Delete");
                  }}
                >
                  删除{" "}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
export function ExpressionReview() {
  const store = useStore(),
    [selected, setSelected] = useState<string | null>(null),
    [shown, setShown] = useState(false);
  const learning = store.expressions.filter((e) => e.status === "Learning");
  const [seed, setSeed] = useState(Math.random);
  const item =
    learning.find((e) => e.id === selected) ??
    learning[Math.floor(seed * learning.length)];
  function next(mastered: boolean) {
    if (!item) return;
    try {
      if (mastered) store.updateExpression(item.id, "Mastered");
      const choices = learning.filter((e) => e.id !== item.id);
      setSelected(
        choices[Math.floor(Math.random() * choices.length)]?.id ?? null,
      );
      setSeed(Math.random());
      setShown(false);
    } catch (e) {
      alert((e as Error).message);
    }
  }
  return (
    <>
      <Heading
        title="表达复习"
        description="先回忆含义，再看看自己是否真正理解。"
      />
      {!item ? (
        <Empty
          title="本轮复习已完成"
          text="暂时没有学习中的表达，可以添加新表达或回看收藏。"
          to="/expressions"
          label="我的表达"
        />
      ) : (
        <div className="card flashcard">
          <span className="eyebrow">{learning.length} 个表达待复习 </span>
          <h2>{item.expression}</h2>
          {shown ? (
            <>
              <p>{item.meaning || "未提供中文含义。"}</p>
              <blockquote>{item.example}</blockquote>
              <div className="row">
                <button onClick={() => next(false)}> 还需练习 </button>
                <button className="primary" onClick={() => next(true)}>
                  已掌握{" "}
                </button>
              </div>
            </>
          ) : (
            <button className="primary" onClick={() => setShown(true)}>
              显示含义{" "}
            </button>
          )}
        </div>
      )}
    </>
  );
}
