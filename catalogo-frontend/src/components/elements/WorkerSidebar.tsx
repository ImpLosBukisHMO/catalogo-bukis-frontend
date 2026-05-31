import { Link, NavLink } from "react-router-dom";
import { logOut } from "../../services/user";

const WorkerSidebar = () => {
  return (
    <aside className="worker-sidebar">
      {/* Brand header */}
      <div style={{ padding: "1.5rem 1rem 1rem" }}>
        <p className="menu-label" style={{ fontSize: "0.7rem", marginBottom: "0.25rem" }}>
          Los Bukis
        </p>
        <p style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
          Panel Operaciones
        </p>
      </div>

      {/* Back-to-store link */}
      <div style={{ padding: "0.25rem 1rem 0.5rem" }}>
        <Link
          to="/"
          style={{
            display: "block",
            fontSize: "0.8rem",
            color: "#94a3b8",
            textDecoration: "none",
          }}
        >
          ← Volver a la tienda
        </Link>
      </div>

      {/* Navigation */}
      <nav className="menu" style={{ padding: "0.5rem 0" }}>
        <p className="menu-label">Navegación</p>
        <ul className="menu-list">
          <li>
            <NavLink to="/worker" end className={({ isActive }) => (isActive ? "is-active" : "")}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/worker/products"
              className={({ isActive }) => (isActive ? "is-active" : "")}
            >
              Productos
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/worker/orders"
              className={({ isActive }) => (isActive ? "is-active" : "")}
            >
              Pedidos
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Logout */}
      <div className="worker-sidebar-footer">
        <button
          className="button is-danger is-outlined is-fullwidth"
          onClick={() => { logOut().catch((err: unknown) => console.error("Error al cerrar sesión:", err)); }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
};

export default WorkerSidebar;
