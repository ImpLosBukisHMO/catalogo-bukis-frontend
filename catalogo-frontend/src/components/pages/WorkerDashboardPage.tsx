const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "20px",
};

const WorkerDashboardPage = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 600 }}>Dashboard</h1>
        <p style={{ color: "#6b7280" }}>
          Resumen general de pedidos e inventario
        </p>
      </div>

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
        }}
      >
        <div style={cardStyle}>
          <p style={{ color: "#6b7280" }}>Pedidos pendientes</p>
          <h2 style={{ fontSize: "28px" }}>—</h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#6b7280" }}>Pedidos de hoy</p>
          <h2 style={{ fontSize: "28px" }}>—</h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#6b7280" }}>Productos sin stock</p>
          <h2 style={{ fontSize: "28px" }}>—</h2>
        </div>
      </div>

      {/* Secciones */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "16px",
        }}
      >
        <div style={cardStyle}>
          <h3>Pedidos recientes</h3>
          <p style={{ color: "#6b7280", marginTop: "8px" }}>
            No hay pedidos recientes
          </p>
        </div>

        <div style={cardStyle}>
          <h3>Alertas</h3>
          <p style={{ color: "#6b7280", marginTop: "8px" }}>
            Todo se encuentra en orden
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboardPage;
