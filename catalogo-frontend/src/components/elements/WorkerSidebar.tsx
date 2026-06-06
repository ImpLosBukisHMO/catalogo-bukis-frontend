import { NavLink, Link } from "react-router-dom";
import { logOut } from "../../services/user";
import { useWorkerTheme } from "../providers/useWorkerTheme";
import {
  WorkerDropdownRoot,
  WorkerDropdownTrigger,
  WorkerDropdownContent,
  WorkerDropdownItem,
  WorkerDropdownSeparator,
  WorkerDropdownLabel,
} from "../ui/worker/WorkerDropdown";

// ─── Nav route definitions ────────────────────────────────────────────────────

const NAV_ROUTES = [
  {
    label: "Dashboard",
    to: "/worker",
    end: true,
    // Fulfillment rail: Dashboard shows the queue overview — dispatch context
    railLabel: "Cola",
  },
  {
    label: "Productos",
    to: "/worker/products",
    end: false,
    // Fulfillment rail: Productos shows the stock shelf context
    railLabel: "Stock",
  },
  {
    label: "Pedidos",
    to: "/worker/orders",
    end: false,
    // Fulfillment rail: Pedidos shows the dispatch lane context
    railLabel: "Despacho",
  },
] as const;

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const WorkerSidebar = () => {
  const { theme, toggleTheme } = useWorkerTheme();

  const handleLogOut = () => {
    logOut().catch((err: unknown) =>
      console.error("Error al cerrar sesión:", err)
    );
  };

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        backgroundColor: "var(--worker-shelf)",
        borderRight: "1px solid var(--worker-border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* ── Brand header ─────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 16px 12px" }}>
        <p
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--worker-ink-muted)",
            margin: "0 0 3px",
          }}
        >
          Los Bukis
        </p>
        <p
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--worker-ink)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Panel Operaciones
        </p>
      </div>

      {/* ── Back-to-store ─────────────────────────────────────────────────── */}
      <div style={{ padding: "0 16px 12px" }}>
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            color: "var(--worker-ink-tertiary)",
            textDecoration: "none",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.color =
              "var(--worker-ink-secondary)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.color =
              "var(--worker-ink-tertiary)")
          }
        >
          ← Volver a la tienda
        </Link>
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div
        style={{
          height: "1px",
          backgroundColor: "var(--worker-border-soft)",
          margin: "0 16px 8px",
        }}
      />

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: "8px 0" }} aria-label="Worker navigation">
        <p
          style={{
            padding: "0 16px",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--worker-ink-muted)",
            marginBottom: "4px",
          }}
        >
          Navegación
        </p>

        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {NAV_ROUTES.map(({ label, to, end, railLabel }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 16px",
                  fontSize: "14px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? "var(--worker-rail)"
                    : "var(--worker-ink-secondary)",
                  textDecoration: "none",
                  // Fulfillment rail — active indicator as left border strip
                  borderLeft: isActive
                    ? "3px solid var(--worker-rail)"
                    : "3px solid transparent",
                  backgroundColor: isActive
                    ? "var(--worker-rail-soft)"
                    : "transparent",
                  transition: "background-color 0.12s, color 0.12s",
                })}
                // Additional hover via onMouseEnter/Leave since inline style
                // doesn't support :hover
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  if (!el.classList.contains("active") &&
                      el.getAttribute("aria-current") !== "page") {
                    el.style.backgroundColor = "var(--worker-bench)";
                    el.style.color = "var(--worker-ink)";
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  if (!el.classList.contains("active") &&
                      el.getAttribute("aria-current") !== "page") {
                    el.style.backgroundColor = "transparent";
                    el.style.color = "var(--worker-ink-secondary)";
                  }
                }}
              >
                <span>{label}</span>
                {/* Fulfillment rail label — contextual cue for active route */}
                <NavLink
                  to={to}
                  end={end}
                  tabIndex={-1}
                  style={({ isActive }) =>
                    isActive
                      ? {
                          fontSize: "9px",
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--worker-rail)",
                          backgroundColor: "var(--worker-rail-soft)",
                          border: "1px solid var(--worker-rail-border)",
                          borderRadius: "4px",
                          padding: "2px 5px",
                          textDecoration: "none",
                          pointerEvents: "none",
                        }
                      : { display: "none" }
                  }
                >
                  {railLabel}
                </NavLink>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Footer — session/profile dropdown ────────────────────────────── */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--worker-border-soft)",
        }}
      >
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={`Cambiar a tema ${theme === "dark" ? "claro" : "oscuro"}`}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "7px 10px",
            marginBottom: "8px",
            fontSize: "12px",
            color: "var(--worker-ink-tertiary)",
            backgroundColor: "transparent",
            border: "1px solid var(--worker-border-soft)",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "var(--worker-bench)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "transparent")
          }
        >
          <span>{theme === "dark" ? "☀ Tema claro" : "☾ Tema oscuro"}</span>
        </button>

        {/* Session/profile dropdown */}
        <WorkerDropdownRoot>
          <WorkerDropdownTrigger asChild>
            <button
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--worker-ink-secondary)",
                backgroundColor: "var(--worker-bench)",
                border: "1px solid var(--worker-border)",
                borderRadius: "6px",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "var(--worker-control-bg)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "var(--worker-bench)")
              }
            >
              {/* Staff avatar placeholder */}
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "var(--worker-rail-soft)",
                  border: "1px solid var(--worker-rail-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--worker-rail)",
                  flexShrink: 0,
                }}
              >
                OP
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>Sesión operador</span>
              <span
                style={{
                  fontSize: "10px",
                  color: "var(--worker-ink-muted)",
                }}
              >
                ▾
              </span>
            </button>
          </WorkerDropdownTrigger>

          <WorkerDropdownContent align="end" sideOffset={6}>
            <WorkerDropdownLabel>Cuenta</WorkerDropdownLabel>
            <WorkerDropdownSeparator />
            <WorkerDropdownItem
              destructive
              onSelect={handleLogOut}
              icon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              }
            >
              Cerrar sesión
            </WorkerDropdownItem>
          </WorkerDropdownContent>
        </WorkerDropdownRoot>
      </div>
    </aside>
  );
};

export default WorkerSidebar;
