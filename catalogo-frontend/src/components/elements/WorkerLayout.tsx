import { Component, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import WorkerSidebar from "./WorkerSidebar";
import { surface, sp, r, semantic, btn } from "./workerTheme";

class PageErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: sp["3xl"], color: semantic.danger.fg }}>
          <h3 style={{ marginBottom: sp.sm, fontSize: 16, fontWeight: 600 }}>
            Error en la página
          </h3>
          <pre
            style={{
              fontSize: 13,
              whiteSpace: "pre-wrap",
              background: semantic.danger.bg,
              border: `1px solid ${semantic.danger.border}`,
              padding: sp.lg,
              borderRadius: r.md,
              color: "#991b1b",
            }}
          >
            {(this.state.error as Error).message}
            {"\n\n"}
            {(this.state.error as Error).stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ ...btn.secondary, marginTop: sp.md }}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const WorkerLayout = () => {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: surface.canvas,
        color: surface.canvas,
      }}
    >
      <WorkerSidebar />

      <main
        style={{
          flex: 1,
          padding: sp["3xl"],
          minWidth: 0,
        }}
      >
        <PageErrorBoundary>
          <Outlet />
        </PageErrorBoundary>
      </main>
    </div>
  );
};

export default WorkerLayout;
