import { Component, type ReactNode, useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import WorkerSidebar from "./WorkerSidebar";
import { getLoggedUserData } from "../../services/user";

type GuardStatus = "loading" | "authorized" | "unauthorized" | "forbidden";

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
        <div
          style={{
            padding: "20px 24px",
            backgroundColor: "var(--worker-error-bg)",
            border: "1px solid var(--worker-error-border)",
            borderRadius: "10px",
            margin: "24px",
          }}
        >
          <h3
            style={{
              marginBottom: "8px",
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--worker-error-fg)",
            }}
          >
            Error en la página
          </h3>
          <pre
            style={{
              fontSize: "13px",
              whiteSpace: "pre-wrap",
              color: "var(--worker-ink-secondary)",
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
            }}
          >
            {(this.state.error as Error).message}
            {import.meta.env.DEV && "\n\n"}
            {import.meta.env.DEV && (this.state.error as Error).stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: "12px",
              padding: "7px 16px",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--worker-error-fg)",
              backgroundColor: "transparent",
              border: "1px solid var(--worker-error-border)",
              borderRadius: "6px",
              cursor: "pointer",
            }}
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
  const [status, setStatus] = useState<GuardStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const userData = await getLoggedUserData();
        if (cancelled) return;
        if (userData?.is_staff) {
          setStatus("authorized");
        } else {
          setStatus("forbidden");
        }
      } catch {
        if (!cancelled) setStatus("unauthorized");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Auth redirects — behavior unchanged from before migration ───────────
  if (status === "loading") return null;
  if (status === "unauthorized") return <Navigate to="/iniciar-sesion" replace />;
  if (status === "forbidden") return <Navigate to="/" replace />;

  // ─── Authorized branch — Tailwind worker shell ───────────────────────────
  // NOTE: .worker-scope and data-worker-theme are applied by WorkerThemeProvider
  // (via WorkerProviders in the route tree). Do NOT add a second wrapper here.
  return (
    <div
      className="wk:flex wk:min-h-screen"
      style={{ backgroundColor: "var(--worker-canvas)" }}
    >
      {/* Sidebar column */}
      <div style={{ flexShrink: 0 }}>
        <WorkerSidebar />
      </div>

      {/* Main content area */}
      <main
        className="wk:flex-1 wk:min-w-0"
        style={{
          backgroundColor: "var(--worker-canvas)",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            padding: "24px 28px",
            maxWidth: "1400px",
          }}
        >
          <PageErrorBoundary>
            <Outlet />
          </PageErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default WorkerLayout;
