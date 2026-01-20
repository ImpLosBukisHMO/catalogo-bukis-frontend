import { useEffect, useState } from "react";
import { getCarritoActual } from "../../services/carrito";
import type { CarritoResponse } from "../../types/carrito";

export default function CarritoPage() {
  const [data, setData] = useState<CarritoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const carrito = await getCarritoActual();
        setData(carrito);
      } catch (e: any) {
        setError(e?.message ?? "Error cargando carrito");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Carrito</h1>

      {loading && <p>Cargando...</p>}
      {error && <pre style={{ whiteSpace: "pre-wrap" }}>{error}</pre>}

      {data && (
        <>
          <p>
            <strong>ID:</strong> {data.id} <br />
            <strong>Estado:</strong> {data.estado} <br />
            <strong>Subtotal:</strong> {data.subtotal}
          </p>

          <h2>Items</h2>
          {data.items.length === 0 ? (
            <p>Sin items.</p>
          ) : (
            <ul>
              {data.items.map((it) => (
                <li key={it.id}>
                  {it.producto_nombre} ({it.color_nombre}) x {it.cantidad} — $
                  {it.subtotal_linea}
                </li>
              ))}
            </ul>
          )}

          <h3>JSON</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}
