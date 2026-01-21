import { useEffect, useMemo, useState } from "react";

import Table from "../elements/Table";
import { getWorkerPedidos } from "../../services/worker";
import type { WorkerPedido } from "../../types/worker";

const ORDER_STATUSES = [
  "ALL",
  "PENDING",
  "PAID",
  "SHIPPED",
  "CANCELLED",
];

export default function WorkerOrdersPage() {
  const [pedidos, setPedidos] = useState<WorkerPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filtros
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState<string>(""); // yyyy-mm-dd
  const [dateTo, setDateTo] = useState<string>("");

  // fetch pedidos
  useEffect(() => {
    setLoading(true);
    setError(null);

    getWorkerPedidos()
      .then(setPedidos)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Error al cargar pedidos")
      )
      .finally(() => setLoading(false));
  }, []);

  // filtrado
  const filteredPedidos = useMemo(() => {
    return pedidos.filter((p) => {
      // estado
      if (statusFilter !== "ALL" && p.estado !== statusFilter) {
        return false;
      }

      const created = new Date(p.created_at);

      // desde
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (created < from) return false;
      }

      // hasta
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (created > to) return false;
      }

      return true;
    });
  }, [pedidos, statusFilter, dateFrom, dateTo]);

  const columns = [
    {
      header: "ID",
      render: (p: WorkerPedido) => p.public_id,
    },
    {
      header: "Cliente",
      render: (p: WorkerPedido) => p.cliente.nombre,
    },
    {
      header: "Correo",
      render: (p: WorkerPedido) => p.cliente.correo,
    },
    {
      header: "Estado",
      render: (p: WorkerPedido) => p.estado,
    },
    {
      header: "Items",
      render: (p: WorkerPedido) => p.items_count,
    },
    {
      header: "Total",
      render: (p: WorkerPedido) => `$${Number(p.precio_total).toFixed(2)}`,
    },
    {
      header: "Fecha",
      render: (p: WorkerPedido) =>
        new Date(p.created_at).toLocaleString(),
    },
  ];

  if (loading) return <p>Cargando pedidos...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <>
      <h1 style={{ marginBottom: 24 }}>Pedidos</h1>

      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        {/* Estado */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: "6px",
            border: "1px solid #d0d5dd",
            minWidth: 200,
          }}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "Todos los estados" : s}
            </option>
          ))}
        </select>

        {/* Fecha desde */}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: "6px",
            border: "1px solid #d0d5dd",
          }}
        />

        {/* Fecha hasta */}
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: "6px",
            border: "1px solid #d0d5dd",
          }}
        />
      </div>

      {/* Tabla */}
      <Table columns={columns} data={filteredPedidos} />
    </>
  );
}
