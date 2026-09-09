import { useState } from "react";

export function TutorialVideo() {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <section className="card tutorial-section">
      <div className="row between wrap">
        <div>
          <h2>视频教学</h2>
          <p>跟着演示，完成第一次 AI 反馈导入。</p>
        </div>
        <button
          className="primary"
          aria-expanded={open}
          aria-controls="feedback-tutorial"
          onClick={() => {
            setOpen(!open);
            setFailed(false);
          }}
        >
          {open ? "收起演示" : "演示"}
        </button>
      </div>
      {open && (
        <div id="feedback-tutorial">
          <video
            aria-label="AI 反馈操作演示"
            controls
            playsInline
            preload="metadata"
            style={{
              display: "block",
              width: "100%",
              maxHeight: "75vh",
              background: "#111",
              marginTop: 16,
              borderRadius: 12,
            }}
            onError={() => setFailed(true)}
          >
            <source
              src={`${import.meta.env.BASE_URL}tutorials/ai-feedback-demo.mp4`}
              type="video/mp4"
            />
            你的浏览器不支持播放视频。
          </video>
          {failed && (
            <p role="alert">
              视频暂时无法播放，请
              <a
                href={`${import.meta.env.BASE_URL}tutorials/ai-feedback-demo.mp4`}
                target="_blank"
                rel="noopener noreferrer"
              >
                打开视频
              </a>
              重试。
            </p>
          )}
        </div>
      )}
    </section>
  );
}
