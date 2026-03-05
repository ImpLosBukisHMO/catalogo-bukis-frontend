import { NavLink } from "react-router-dom";
import { brand, surface, ink, sp, r } from "./workerTheme";

/**
 * Active nav link: brand red left-border as "you are here" indicator.
 * Same visual language used for selected order in WorkerOrdersPage.
 */
const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  display: "block",
  padding: `${sp.sm}px ${sp.md}px`,
  paddingLeft: isActive ? sp.md - 3 : sp.md, // compensate for 3px border
  borderRadius: r.sm,
  textDecoration: "none",
  fontSize: 14,
  fontWeight: isActive ? 600 : 400,
  color: isActive ? ink.primary : ink.secondary,
  backgroundColor: isActive ? surface.card : "transparent",
  borderLeft: isActive ? `3px solid ${brand}` : "3px solid transparent",
  transition: "background-color 0.1s, color 0.1s",
});

const WorkerSidebar = () => {
  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        padding: `${sp["2xl"]}px`,
        borderRight: `1px solid ${surface.border}`,
        backgroundColor: surface.canvas,
        display: "flex",
        flexDirection: "column",
        gap: sp["3xl"],
      }}
    >
      {/* Brand identity */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: sp.sm, marginBottom: sp.xs }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: brand,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: brand,
              textTransform: "uppercase",
            }}
          >
            Los Bukis
          </span>
        </div>
        <p
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: ink.primary,
            margin: 0,
          }}
        >
          Panel Operaciones
        </p>
      </div>

      {/* Navigation */}
      <nav style={{ display: "flex", flexDirection: "column", gap: sp.xs }}>
        <NavLink to="/worker" end style={linkStyle}>
          Dashboard
        </NavLink>
        <NavLink to="/worker/products" style={linkStyle}>
          Productos
        </NavLink>
        <NavLink to="/worker/orders" style={linkStyle}>
          Pedidos
        </NavLink>
      </nav>
    </aside>
  );
};

export default WorkerSidebar;
