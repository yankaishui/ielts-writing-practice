import type { ReactNode } from "react";
import { Link } from "react-router-dom";
export function Heading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}
export function Empty({
  title = "还没有练习记录",
  text = "从第一篇作文开始，积累自己的进步。",
  to = "/questions",
  label = "选择题目",
}: {
  title?: string;
  text?: string;
  to?: string;
  label?: string;
}) {
  return (
    <div className="empty card">
      <span className="empty-symbol">↗</span>
      <h2>{title}</h2>
      <p>{text}</p>
      <Link className="button primary" to={to}>
        {label}
      </Link>
    </div>
  );
}
export function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: string;
}) {
  return (
    <div className="stat card">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}
export function Missing() {
  return (
    <Empty
      title="找不到这篇作文"
      text="记录可能已删除，或保存在其他浏览器中。"
      to="/history"
      label="返回练习记录"
    />
  );
}
export async function copyText(text: string, setMessage: (s: string) => void) {
  try {
    await navigator.clipboard.writeText(text);
    setMessage("已复制到剪贴板。");
  } catch {
    setMessage("暂时无法自动复制，请选中文本后手动复制。");
  }
}
