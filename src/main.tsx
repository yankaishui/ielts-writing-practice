import { ScrollReset } from "./components/ScrollReset";
import { Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import { StoreProvider } from "./context";
import "./styles.css";
import "./design-refresh.css";
const Router = import.meta.env.BASE_URL === "/" ? BrowserRouter : HashRouter;
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="card empty">
        <h1> 页面暂时无法加载 </h1>
        <p>本机保存的数据没有被删除，请刷新页面重试。 </p>
        <button onClick={() => window.location.reload()}> 刷新页面 </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
window.addEventListener("storage-warning", (e) =>
  alert((e as CustomEvent<string>).detail),
);
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <Router>
      <ScrollReset />
      <StoreProvider>
        <App />
      </StoreProvider>
    </Router>
  </ErrorBoundary>,
);
