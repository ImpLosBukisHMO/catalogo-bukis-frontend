import { NavLink } from "react-router-dom";

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  padding: "8px 12px",
  borderRadius: "6px",
  textDecoration: "none",
  color: isActive ? "#2563eb" : "#111",
  backgroundColor: isActive ? "#e0e7ff" : "transparent",
  fontWeight: isActive ? "600" : "400",
});

const WorkerSidebar = () => {
  return (
    <aside
      style={{
        width: "240px",
        padding: "24px",
        borderRight: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
      }}
    >
      <h3 style={{ marginBottom: "24px" }}>Worker Panel</h3>

      <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
