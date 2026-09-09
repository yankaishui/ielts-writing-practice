import { zh } from "../utils/labels";
import { useRef, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { findQuestion } from "../data/questions";
import { useStore } from "../context";
import { useExam } from "../hooks/useExam";
import { storage } from "../services/storage";
import { durationLabel, wordCount } from "../utils/scoring";
import { Heading, Missing } from "../components/Shared";
import { questionTypes, type Question } from "../types";
import { isEligibleAttempt } from "../utils/eligibility";
import type { Draft, PracticeKind } from "../types";
export function Exam() {
  const { id } = useParams();
  const route = useLocation();
  const [params] = useSearchParams();
  const { attempts, customQuestions } = useStore();
  const snapshot =
    attempts.find(
      (a) => a.id === params.get("parent") && a.questionId === id,
    ) ?? attempts.find((a) => a.questionId === id);
  const customType = params.get("type");
  const custom =
    id?.startsWith("custom-") &&
    params.get("question")?.trim() &&
    questionTypes.some((t) => t === customType)
      ? {
          id,
          text: params.get("question")!.trim(),
          questionType: customType as Question["questionType"],
          topic: params.get("topic") || "Society",
        }
      : undefined;
  const q =
    (params.has("parent") && snapshot
      ? {
          id: snapshot.questionId,
          text: snapshot.question,
          topic: snapshot.topic,
          questionType: snapshot.questionType,
        }
      : undefined) ??
    customQuestions.find((q) => q.id === id) ??
    findQuestion(id) ??
    custom ??
    (snapshot
      ? {
          id: snapshot.questionId,
          text: snapshot.question,
          questionType: snapshot.questionType,
          topic: snapshot.topic,
        }
      : undefined);
  return q ? (
    <ExamSession question={q} key={id + route.search} />
  ) : (
    <Missing />
  );
}
function ExamSession({ question: q }: { question: Question }) {
  const [params] = useSearchParams(),
    location = useLocation(),
    navigate = useNavigate(),
    store = useStore();

  const parent = store.attempts.find((a) => a.id === params.get("parent"));
  const resume = params.has("resume") && parent && !isEligibleAttempt(parent);
  const revision = params.get("version") === "Revision" && parent;
  const requested = params.get("kind");
  const initialKind: PracticeKind =
    requested === "Body Paragraph" ||
    requested === "Conclusion" ||
    requested === "Introduction"
      ? requested
      : "Full Essay";
  const kind = initialKind;
  const [saveError, setSaveError] = useState("");
  const saved = useRef(false);
  const editor = useRef<HTMLTextAreaElement>(null);
  function submit(d: Draft, end: number) {
    if (saved.current || !d.started) return;
    const finish = Math.min(end, d.started + d.limit * 1000),
      duration = Math.max(0, (finish - d.started) / 1000),
      attemptId = crypto.randomUUID();
    try {
      store.addAttempt({
        id: attemptId,
        questionId: q.id,
        question: q.text,
        questionType: q.questionType,
        topic: q.topic,
        text: d.text,
        startTime: new Date(d.started).toISOString(),
        finishTime: new Date(finish).toISOString(),
        duration,
        wordCount: wordCount(d.text),
        focusEvents: d.focusEvents,
        totalTimeAway: d.focusEvents.reduce((n, f) => n + f.duration, 0),
        longestPause: Math.max(
          d.longestPause,
          (finish - (d.lastInput ?? d.started)) / 1000,
        ),
        inputEvents: d.inputEvents,
        createdAt: new Date().toISOString(),
        mode: d.mode,
        kind,
        version: resume
          ? "Exam"
          : revision
            ? "Revision"
            : parent
              ? "Rewrite"
              : "Exam",
        parentId: parent?.id,
        demo: parent?.demo,
      });
      saved.current = true;
      storage.saveDraft(null);
      navigate(
        kind === "Full Essay"
          ? `/feedback/${attemptId}`
          : `/review/${attemptId}`,
        { replace: true },
      );
    } catch (e) {
      setSaveError((e as Error).message);
    }
  }
  const exam = useExam(
      location.pathname + location.search,
      resume || revision ? parent!.text : "",
      initialKind === "Full Essay"
        ? 40
        : initialKind === "Body Paragraph"
          ? 15
          : 10,
      submit,
    ),
    d = exam.draft,
    words = wordCount(d.text);
  return (
    <>
      <Heading
        eyebrow={revision ? "修订练习 · 考试原稿保留" : "雅思写作模拟考试"}
        title={zh(kind)}
        description={
          d.started
            ? "规划和写作共用这段时间，由你自己安排。"
            : "准备好了再开始，点击开始后才会计时。"
        }
      />
      <div className="exam-layout">
        <section>
          <div className="card prompt-card">
            <span className="pill">{zh(q.topic)}</span>
            <small>{zh(q.questionType)}</small>
            <h2>{q.text}</h2>
            <p>
              {kind === "Full Essay"
                ? "说明你的理由，并结合自己的知识或经历给出相关例子。至少写 250 个英文单词。"
                : `只需针对这道题写${zh(kind)}。`}
            </p>
          </div>
          <div className="card writing-card">
            <div className="row between">
              <h3>{revision ? "修订版" : "你的作文"}</h3>
              <span className="muted"> 拼写检查已关闭 </span>
            </div>
            <label className="sr-only" htmlFor="essay">
              作文内容{" "}
            </label>
            <textarea
              id="essay"
              ref={editor}
              className="writing-area"
              value={d.text}
              onChange={(e) => exam.input(e.target.value)}
              disabled={!d.started || exam.remaining === 0}
              spellCheck={false}
              autoCorrect="off"
              autoComplete="off"
              autoCapitalize="off"
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
              placeholder="点击“开始考试”后，即可在这里写作……"
            />
            <div className="row between">
              <small>
                {d.started
                  ? "草稿已保存在本机"
                  : "写作过程中不提供纠错或提示。"}
              </small>
              <span className={words >= 250 ? "word-ready" : ""}>
                {words} 词{" "}
              </span>
            </div>
          </div>
        </section>
        <aside className="exam-controls card">
          <span className="eyebrow"> 剩余时间 </span>
          <div
            className={`timer ${exam.remaining < 300 && d.started ? "urgent" : ""}`}
            role="timer"
          >
            {durationLabel(exam.remaining)}
          </div>
          <div className="timer-meta">
            词数： <b className={words >= 250 ? "word-ready" : ""}>{words}</b>
            {kind === "Full Essay" && <span> / 250</span>}
          </div>
          {!d.started ? (
            <>
              <label>
                专注模式{" "}
                <select
                  aria-label="专注模式"
                  value={d.mode}
                  onChange={(e) =>
                    exam.configure({ mode: e.target.value as Draft["mode"] })
                  }
                >
                  <option value="Practice"> 自由练习模式 </option>
                  <option value="Strict"> 严格考试模式 </option>
                </select>
              </label>
              {initialKind !== "Full Essay" && (
                <>
                  <label>
                    练习部分{" "}
                    <select
                      aria-label="练习部分"
                      value={kind}
                      onChange={(e) => {
                        const next = new URLSearchParams(params);
                        next.set("kind", e.target.value);
                        navigate(location.pathname + "?" + next.toString(), {
                          replace: true,
                        });
                      }}
                    >
                      {["Introduction", "Body Paragraph", "Conclusion"].map(
                        (k) => (
                          <option key={k} value={k}>
                            {zh(k)}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    练习时长（分钟）{" "}
                    <input
                      aria-label="练习时长（分钟）"
                      type="number"
                      min="1"
                      max="120"
                      value={d.limit / 60}
                      onChange={(e) =>
                        exam.configure({
                          limit:
                            Math.max(
                              1,
                              Math.min(120, Number(e.target.value) || 1),
                            ) * 60,
                        })
                      }
                    />
                  </label>
                </>
              )}
              <button
                className="primary wide"
                onClick={() => {
                  const existing = storage.draft();
                  if (
                    existing?.started &&
                    existing.key !== d.key &&
                    !confirm("已有未完成的考试草稿，是否替换？")
                  )
                    return;
                  exam.start();
                  setTimeout(() => editor.current?.focus(), 0);
                }}
              >
                开始考试{" "}
              </button>
            </>
          ) : (
            <>
              <span className="pill">
                {d.mode === "Strict" ? "严格考试模式" : "自由练习模式"}
              </span>
              <button
                className="primary wide"
                onClick={() => {
                  if (
                    exam.remaining > 0 &&
                    !confirm("考试时间还未结束，确定现在交卷吗？")
                  )
                    return;
                  submit(exam.finish(), Date.now());
                }}
              >
                完成作文{" "}
              </button>
            </>
          )}
          <small>
            {d.mode === "Strict"
              ? "离开页面会被记录，但浏览器无法禁止切换应用。"
              : "自由练习不记录离开次数；严格考试模式才会记录。"}
          </small>
          {exam.notice && (
            <div role="status" className="notice">
              {exam.notice}
            </div>
          )}
          {(exam.error || saveError) && (
            <p role="alert" className="error">
              {exam.error || saveError}
            </p>
          )}
          <button
            className="text-button"
            onClick={() => {
              if (
                !d.started ||
                confirm("离开本次练习吗？草稿会保留，考试计时继续。")
              )
                navigate("/");
            }}
          >
            返回首页{" "}
          </button>
        </aside>
      </div>
    </>
  );
}
