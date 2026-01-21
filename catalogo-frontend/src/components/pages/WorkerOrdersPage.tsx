// src/components/pages/WorkerOrdersPage.tsx
import { useEffect, useMemo, useState } from "react";
import Table from "../elements/Table";
import type { WorkerPedido } from "../../types/worker";
import { getWorkerPedidos } from "../../services/worker";

export default function WorkerOrdersPage() {
  const [pedidos, setPedidos] = useState<WorkerPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getWorkerPedidos()
      .then((data) => setPedidos(data))
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Error desconocido";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const columns = useMemo(
    () => [
      {
        header: "ID",
        render: (p: WorkerPedido) => p.public_id,
      },
      {
        header: "Cliente",
        render: (p: WorkerPedido) => p.cliente?.nombre ?? "-",
      },
      {
        header: "Correo",
        render: (p: WorkerPedido) => p.cliente?.correo ?? "-",
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
        render: (p: WorkerPedido) => {
          const n = Number(p.precio_total);
          return Number.isFinite(n) ? `$${n.toFixed(2)}` : p.precio_total;
        },
      },
      {
        header: "Fecha",
        render: (p: WorkerPedido) => new Date(p.created_at).toLocaleString(),
      },
    ],
    []
  );

  if (loading) return <p>Cargando pedidos...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Pedidos</h1>
      <Table columns={columns} data={pedidos} />
    </div>
  );
}
