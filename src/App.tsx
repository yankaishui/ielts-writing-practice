import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  BookOpen,
  ChartNoAxesCombined,
  Clock3,
  FilePenLine,
  Home as HomeIcon,
  Library,
  Settings as SettingsIcon,
  SpellCheck,
} from "lucide-react";
import { Home } from "./pages/Home";
import { QuestionBank } from "./pages/QuestionBank";
import { Exam } from "./pages/Exam";
import { FeedbackImport } from "./pages/FeedbackImport";
import { Review } from "./pages/Review";
import { History } from "./pages/History";
import { Progress } from "./pages/Progress";
import { Mistakes } from "./pages/Mistakes";
import { Expressions, ExpressionReview } from "./pages/Expressions";
import { Settings } from "./pages/Settings";
import { Empty } from "./components/Shared";
import { FocusPracticePage } from "./pages/FocusPractice";
const nav = [
  { to: "/", label: "首页", icon: HomeIcon },
  { to: "/questions", label: "写作题库", icon: BookOpen },
  { to: "/history", label: "练习记录", icon: Clock3 },
  { to: "/progress", label: "学习进度", icon: ChartNoAxesCombined },
  { to: "/mistakes", label: "我的易错点", icon: SpellCheck },
  { to: "/expressions", label: "我的表达", icon: Library },
];
export default function App() {
  const location = useLocation(),
    isExam = location.pathname.startsWith("/exam/");
  return (
    <div className={`app-shell ${isExam ? "exam-shell" : ""}`}>
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <span className="brand-icon">
            <FilePenLine size={25} />
          </span>
          <div>
            雅思练习 <small> 写作练习工具 </small>
          </div>
        </NavLink>
        <div className="sidebar-caption"> 练习与复盘 </div>
        <nav aria-label="主导航">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/" || to === "/expressions"}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink className="settings-link" to="/settings">
            <SettingsIcon size={18} /> 设置{" "}
          </NavLink>
          <div className="privacy">
            <span className="privacy-dot" /> 保存在本机浏览器{" "}
            <small> 记录写作，也记录成长。 </small>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <div className="topbar">
          <span>
            IELTS <span className="muted"> / 大作文练习 </span>
          </span>
          <div className="topbar-actions">
            <nav className="tool-switcher" aria-label="切换练习工具">
              <a href="https://part1.yankaishui.com/practice">口语 Part 1</a>
              <a href="https://part2.yankaishui.com/">口语 Part 2&amp;3</a>
              <NavLink to="/" aria-current="page">写作 Task 2</NavLink>
            </nav>
            <span className="local-label">本地练习 <span className="privacy-dot" /></span>
            <a className="site-home-link" href="https://yankaishui.com/" aria-label="返回网站主页" title="返回网站主页"><HomeIcon size={22} /></a>
          </div>
        </div>
        <main key={location.pathname}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/questions" element={<QuestionBank />} />
            <Route path="/exam/:id" element={<Exam />} />
            <Route path="/feedback/:id" element={<FeedbackImport />} />
            <Route path="/review/:id" element={<Review />} />
            <Route path="/focus/:id" element={<FocusPracticePage />} />
            <Route path="/history" element={<History />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/mistakes" element={<Mistakes />} />
            <Route path="/expressions" element={<Expressions />} />
            <Route path="/expressions/review" element={<ExpressionReview />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="*"
              element={<Empty title="找不到这个页面" to="/" label="返回首页" />}
            />
          </Routes>
        </main>
        <footer>
          雅思 Task 2 写作练习 <span> 独立练习工具 · 无 AI 调用费用 </span>
        </footer>
      </div>
    </div>
  );
}
