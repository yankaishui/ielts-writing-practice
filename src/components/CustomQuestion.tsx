import { useStore } from "../context";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { questionTypes } from "../types";
import { zh } from "../utils/labels";
export function CustomQuestion({
  topics,
  open = false,
}: {
  topics: string[];
  open?: boolean;
}) {
  const store = useStore();
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [type, setType] = useState<string>(questionTypes[0]);
  const [topic, setTopic] = useState(topics[0]);
  const navigate = useNavigate();
  return (
    <details open={open || undefined} className="card custom-question">
      <summary>自己编写 / 粘贴作文题目</summary>
      <p>
        有想练的题目？在这里填写完整英文题目和作答要求，再选择题型与话题。点击“使用这道题”后，题目会自动加入题库的“自定义题”分类，并进入练习。
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            const question = store.saveCustomQuestion({
              id: "custom-" + crypto.randomUUID(),
              text: text.trim(),
              questionType: type as (typeof questionTypes)[number],
              topic,
              custom: true,
            });
            navigate("/exam/" + question.id);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <label>
          自定义作文题目
          <textarea
            required
            maxLength={5000}
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入或粘贴完整英文题目……"
          />
        </label>
        <div className="filters">
          <label>
            自定义题型
            <select
              aria-label="自定义题型"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {questionTypes.map((t) => (
                <option key={t} value={t}>
                  {zh(t)}
                </option>
              ))}
            </select>
          </label>
          <label>
            自定义话题
            <select
              aria-label="自定义话题"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              {topics.map((t) => (
                <option key={t} value={t}>
                  {zh(t)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="primary" disabled={!text.trim()}>
          使用这道题
        </button>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </form>
    </details>
  );
}
