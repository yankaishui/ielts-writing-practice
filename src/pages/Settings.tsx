import { useState } from "react";
import { useStore } from "../context";
import { storage } from "../services/storage";
import { Heading } from "../components/Shared";
export function Settings() {
  const store = useStore(),
    [message, setMessage] = useState(""),
    [clearStep, setClearStep] = useState(false);
  function download() {
    const blob = new Blob([storage.export()], { type: "application/json" }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `ielts-writing-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("备份已导出，请妥善保存。");
  }
  return (
    <>
      <Heading
        title="设置"
        description="练习保存在这个浏览器中，记得备份自己的积累。"
      />
      <section className="card settings-section">
        <h2> 我的数据 </h2>
        <p>
          无需账号，未使用云数据库或 AI
          API。作文、反馈、表达、专项修改和草稿都保存在本机浏览器。{" "}
        </p>
        <div className="row wrap">
          <button className="primary" onClick={download}>
            导出备份{" "}
          </button>
          <label className="button import-button">
            导入备份{" "}
            <input
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const text = await file.text();
                  if (
                    confirm("是否恢复此备份，并替换浏览器中现有的写作数据？")
                  ) {
                    storage.import(text);
                    store.reload();
                    setMessage("备份恢复成功。");
                  }
                } catch {
                  setMessage(
                    "导入失败：备份无效或存储不可用，现有数据未被替换。",
                  );
                }
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <small>
          备份包含作文与反馈等记录。清理浏览器或更换设备不会自动转移这些数据。{" "}
        </small>
      </section>
      <section className="card settings-section">
        <h2> 关于预估分数 </h2>
        <p>
          大作文预估分数取四项分数的平均值，再四舍五入到最近的 0.5
          分；中间值向上取。这是训练参考，并非雅思官方成绩。{" "}
        </p>
        <p>
          严格考试模式记录页面失焦或隐藏，无法禁止切换应用。浏览器扩展或输入法仍可能提供建议，模拟考试时请自行关闭。{" "}
        </p>
      </section>
      <section className="card settings-section danger-zone">
        <h2> 清空全部数据 </h2>
        <p>删除本工具保存在此浏览器中的作文、反馈、表达、专项修改和草稿。 </p>
        {clearStep ? (
          <div className="notice">
            <b> 请再次确认。若需要保留记录，请先导出备份。 </b>
            <button
              className="danger"
              onClick={() => {
                if (
                  confirm("最后确认：永久清空此浏览器中的全部雅思写作数据？")
                ) {
                  storage.clear();
                  store.reload();
                  setClearStep(false);
                  setMessage("全部写作数据已清空。");
                }
              }}
            >
              确认清空{" "}
            </button>
            <button onClick={() => setClearStep(false)}> 取消 </button>
          </div>
        ) : (
          <button className="danger-text" onClick={() => setClearStep(true)}>
            清空全部数据{" "}
          </button>
        )}
      </section>
      <p role="status">{message}</p>
    </>
  );
}
