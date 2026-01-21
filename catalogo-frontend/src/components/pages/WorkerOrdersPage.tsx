const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "20px",
};

const tableHeaderStyle = {
  textAlign: "left" as const,
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  color: "#6b7280",
  fontSize: "14px",
};

const tableCellStyle = {
  padding: "12px",
  borderBottom: "1px solid #f1f5f9",
};

const badgeStyle = (status: string) => {
  const base = {
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 500,
    display: "inline-block",
  };

  switch (status) {
    case "pendiente":
      return { ...base, backgroundColor: "#fef3c7", color: "#92400e" };
    case "completado":
      return { ...base, backgroundColor: "#dcfce7", color: "#166534" };
    case "cancelado":
      return { ...base, backgroundColor: "#fee2e2", color: "#991b1b" };
    default:
      return base;
  }
};

const WorkerOrdersPage = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 600 }}>Pedidos</h1>
        <p style={{ color: "#6b7280" }}>
          Historial y seguimiento de pedidos
        </p>
      </div>

      {/* Resumen rápido */}
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
          <p style={{ color: "#6b7280" }}>Pedidos completados</p>
          <h2 style={{ fontSize: "28px" }}>—</h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#6b7280" }}>Pedidos cancelados</p>
          <h2 style={{ fontSize: "28px" }}>—</h2>
        </div>
      </div>

      {/* Tabla de pedidos */}
      <div style={cardStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Pedido</th>
              <th style={tableHeaderStyle}>Cliente</th>
              <th style={tableHeaderStyle}>Fecha</th>
              <th style={tableHeaderStyle}>Total</th>
              <th style={tableHeaderStyle}>Estado</th>
              <th style={tableHeaderStyle}>Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td style={tableCellStyle}>—</td>
              <td style={tableCellStyle}>—</td>
              <td style={tableCellStyle}>—</td>
              <td style={tableCellStyle}>—</td>
              <td style={tableCellStyle}>
                <span style={badgeStyle("pendiente")}>Pendiente</span>
              </td>
              <td style={tableCellStyle}>Ver</td>
            </tr>
          </tbody>
        </table>

        <p style={{ color: "#6b7280", marginTop: "16px" }}>
          No hay pedidos para mostrar
        </p>
      </div>
    </div>
  );
};

export default WorkerOrdersPage;
