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
        <div className="notification is-danger">
          <h3 style={{ marginBottom: "0.5rem", fontSize: 16, fontWeight: 600 }}>
            Error en la página
          </h3>
          <pre
            style={{
              fontSize: 13,
              whiteSpace: "pre-wrap",
            }}
          >
            {(this.state.error as Error).message}
            {import.meta.env.DEV && "\n\n"}
            {import.meta.env.DEV && (this.state.error as Error).stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            className="button is-outlined"
            style={{ marginTop: "1rem" }}
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

  if (status === "loading") return null;
  if (status === "unauthorized") return <Navigate to="/iniciar-sesion" replace />;
  if (status === "forbidden") return <Navigate to="/" replace />;

  return (
    <div className="columns is-gapless" style={{ minHeight: "100vh" }}>
      <div className="column is-narrow">
        <WorkerSidebar />
      </div>

      <div className="column">
        <section className="section worker-main">
          <PageErrorBoundary>
            <Outlet />
          </PageErrorBoundary>
        </section>
      </div>
    </div>
  );
};

export default WorkerLayout;
