import { NavLink, Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ClipboardList, LayoutDashboard, Moon, Package, Store, Sun, UserCircle } from "lucide-react";
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
    icon: LayoutDashboard,
  },
  {
    label: "Productos",
    to: "/worker/products",
    end: false,
    icon: Package,
  },
  {
    label: "Pedidos",
    to: "/worker/orders",
    end: false,
    icon: ClipboardList,
  },
] as const satisfies readonly {
  label: string;
  to: string;
  end: boolean;
  icon: LucideIcon;
}[];

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
      className="wk:flex wk:min-h-screen wk:w-[72px] wk:flex-shrink-0 wk:flex-col wk:border-r wk:bg-[var(--worker-shelf)]"
      style={{ borderColor: "var(--worker-border)" }}
    >
      {/* ── Brand header ─────────────────────────────────────────────────── */}
      <div className="wk:flex wk:flex-col wk:items-center wk:gap-2 wk:px-3 wk:py-4">
        <div
          className="wk:flex wk:h-11 wk:w-11 wk:items-center wk:justify-center wk:rounded-2xl wk:border wk:bg-[var(--worker-rail-soft)] wk:text-sm wk:font-bold wk:text-[var(--worker-rail)]"
          style={{ borderColor: "var(--worker-rail-border)" }}
          title="Panel Operaciones"
          aria-label="Panel Operaciones Los Bukis"
        >
          LB
        </div>
      </div>

      {/* ── Back-to-store ─────────────────────────────────────────────────── */}
      <div className="wk:flex wk:justify-center wk:px-3 wk:pb-3">
        <Link
          to="/"
          className="wk:flex wk:h-10 wk:w-10 wk:items-center wk:justify-center wk:rounded-xl wk:text-[var(--worker-ink-tertiary)] wk:transition hover:wk:bg-[var(--worker-bench)] hover:wk:text-[var(--worker-ink-secondary)] focus:wk:outline-none focus:wk:ring-2 focus:wk:ring-[var(--worker-rail-border)]"
          aria-label="Volver a la tienda"
          title="Volver a la tienda"
        >
          <Store size={20} aria-hidden="true" />
        </Link>
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div
        className="wk:mx-3 wk:h-px wk:bg-[var(--worker-border-soft)]"
      />

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="wk:flex-1 wk:px-3 wk:py-4" aria-label="Worker navigation">
        <ul className="wk:flex wk:list-none wk:flex-col wk:gap-2 wk:p-0 wk:m-0">
          {NAV_ROUTES.map(({ label, to, end, icon: Icon }) => (
            <li key={to} className="wk:m-0 wk:p-0">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `wk:flex wk:h-11 wk:w-11 wk:items-center wk:justify-center wk:rounded-2xl wk:border wk:transition focus:wk:outline-none focus:wk:ring-2 focus:wk:ring-[var(--worker-rail-border)] ${
                    isActive
                      ? "wk:border-[var(--worker-rail-border)] wk:bg-[var(--worker-rail-soft)] wk:text-[var(--worker-rail)]"
                      : "wk:border-transparent wk:text-[var(--worker-ink-secondary)] hover:wk:bg-[var(--worker-bench)] hover:wk:text-[var(--worker-ink)]"
                  }`
                }
                aria-label={label}
                title={label}
              >
                <Icon size={21} aria-hidden="true" />
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Footer — session/profile dropdown ────────────────────────────── */}
      <div
        className="wk:flex wk:flex-col wk:items-center wk:gap-2 wk:border-t wk:px-3 wk:py-3"
        style={{ borderColor: "var(--worker-border-soft)" }}
      >
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={`Cambiar a tema ${theme === "dark" ? "claro" : "oscuro"}`}
          title={theme === "dark" ? "Tema claro" : "Tema oscuro"}
          className="wk:flex wk:h-10 wk:w-10 wk:items-center wk:justify-center wk:rounded-xl wk:border wk:border-[var(--worker-border-soft)] wk:bg-transparent wk:text-[var(--worker-ink-tertiary)] wk:transition hover:wk:bg-[var(--worker-bench)] hover:wk:text-[var(--worker-ink)] focus:wk:outline-none focus:wk:ring-2 focus:wk:ring-[var(--worker-rail-border)]"
        >
          {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>

        {/* Session/profile dropdown */}
        <WorkerDropdownRoot>
          <WorkerDropdownTrigger asChild>
            <button
              className="wk:flex wk:h-10 wk:w-10 wk:items-center wk:justify-center wk:rounded-xl wk:border wk:border-[var(--worker-border)] wk:bg-[var(--worker-bench)] wk:text-[var(--worker-ink-secondary)] wk:transition hover:wk:bg-[var(--worker-control-bg)] focus:wk:outline-none focus:wk:ring-2 focus:wk:ring-[var(--worker-rail-border)]"
              aria-label="Cuenta de operador"
              title="Cuenta de operador"
            >
              <UserCircle size={20} aria-hidden="true" />
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
