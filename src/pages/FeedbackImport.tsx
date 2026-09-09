import { TutorialVideo } from "../components/TutorialVideo";
import { isEligibleAttempt } from "../utils/eligibility";
import { UnfinishedEssay } from "../components/UnfinishedEssay";
import { zh } from "../utils/labels";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Copy, Check, ArrowRight } from "lucide-react";
import { useStore } from "../context";
import { Heading, Missing, copyText } from "../components/Shared";
import { assessmentPrompt } from "../services/assessmentPrompt";
import {
  parseAssessment,
  repairInstruction,
} from "../services/assessmentParser";
import { chineseFeedbackPrompt } from "../services/feedbackLanguage";
export function FeedbackImport() {
  const { id } = useParams(),
    store = useStore(),
    a = store.attempts.find((a) => a.id === id),
    navigate = useNavigate();
  const [raw, setRaw] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  if (!a) return <Missing />;
  if (!isEligibleAttempt(a)) return <UnfinishedEssay attempt={a} />;
  if (a.kind !== "Full Essay")
    return (
      <div className="card">
        <h2> 段落练习已保存 </h2>
        <p> 段落练习不评完整 IELTS 大作文分数。 </p>
        <Link to={`/review/${a.id}`}> 查看练习 → </Link>
      </div>
    );
  const prompt = assessmentPrompt(a);
  function importResult() {
    const result = parseAssessment(raw);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (
      store.assessments[a!.id] &&
      !confirm("是否替换这篇作文已有的反馈？原稿不会改变。")
    )
      return;
    try {
      store.addAssessment(a!.id, result.data);
      navigate(`/review/${a!.id}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <Heading
        eyebrow="作文已保存 · 下一步"
        title="获取 AI 反馈"
        description="将评分指令交给你常用的 AI，再把结果带回来。"
      />
      <div className="notice">
        <Check size={17} /> {zh(a.version)}已保存 · {a.wordCount} 词 ·{" "}
        {zh(a.topic)}
      </div>

      {store.assessments[a.id] && (
        <details className="card">
          <summary>已有英文反馈？只转换评语语言，保留原评分</summary>
          <p>
            复制下面的指令发给 AI，再把返回的 JSON
            粘贴到本页导入。此操作不会自动调用模型。
          </p>
          <button
            onClick={() =>
              copyText(
                chineseFeedbackPrompt(store.assessments[a.id]),
                setMessage,
              )
            }
          >
            复制中文转换指令
          </button>
          <textarea
            aria-label="中文转换指令"
            readOnly
            rows={8}
            value={chineseFeedbackPrompt(store.assessments[a.id])}
          />
        </details>
      )}
      <div className="feedback-grid">
        <div>
          <section className="card step">
            <span className="step-number">01</span>
            <h2> 复制评分指令 </h2>
            <p>
              点击“复制评分指令”，再点击下方你常用的 AI
              工具，在聊天框中粘贴并发送，即可获得点评。将完整点评复制到右侧“粘贴
              AI
              结果”框内，再点击“导入反馈”。也可点击页面下方的“演示”按钮查看视频教学。
            </p>
            <button
              className="primary"
              onClick={() => copyText(prompt, setMessage)}
            >
              <Copy size={16} /> 复制评分指令{" "}
            </button>
            <details>
              <summary> 查看完整指令 / 手动复制 </summary>
              <textarea
                aria-label="评分指令"
                readOnly
                value={prompt}
                rows={14}
              />
            </details>
          </section>
          <section className="card step">
            <span className="step-number">02</span>
            <h2> 使用你常用的 AI </h2>
            <p>选择一个 AI 工具，粘贴评分指令并发送。</p>
            <div className="provider-list">
              {[
                ["ChatGPT", "https://chatgpt.com/"],
                ["DeepSeek", "https://chat.deepseek.com/"],
                ["Gemini", "https://gemini.google.com/app"],
                ["豆包", "https://www.doubao.com/chat/"],
                ["千问", "https://www.qianwen.com/"],
              ].map(([name, url]) => (
                <a
                  className="button"
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {name} ↗
                </a>
              ))}
            </div>
            <small>本工具未接入 AI API，不会自动发送你的作文。 </small>
          </section>
        </div>
        <section className="card step">
          <span className="step-number">03</span>
          <h2> 粘贴 AI 结果 </h2>
          <p>粘贴 AI 返回的完整点评，再点击“导入反馈”。</p>
          <label className="sr-only" htmlFor="ai-result">
            AI 反馈 JSON{" "}
          </label>
          <textarea
            id="ai-result"
            className="json-input"
            spellCheck={false}
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setError("");
            }}
            placeholder={'{\n  "scores": { … },\n  "diagnostics": { … }\n}'}
          />
          <button
            className="primary wide"
            disabled={!raw.trim()}
            onClick={importResult}
          >
            导入反馈 <ArrowRight size={17} />
          </button>
          {error && (
            <div className="error-box" role="alert">
              <b> 暂时无法识别 AI 返回的格式。 </b>
              <p>{error}</p>
              <button onClick={() => copyText(repairInstruction, setMessage)}>
                复制格式修复指令{" "}
              </button>
              <details>
                <summary> 格式修复指令 </summary>
                <p>{repairInstruction}</p>
              </details>
            </div>
          )}
        </section>
      </div>
      <p role="status" className="status-text">
        {message}
      </p>
      <Link to={`/review/${a.id}`}> 先查看原稿，稍后再导入反馈 → </Link>
      <TutorialVideo />
    </>
  );
}
