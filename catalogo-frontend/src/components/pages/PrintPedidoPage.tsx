import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getMiPedidoDetalle } from "../../services/pedidos";
import type { PedidoDetalle, PedidoItem } from "../../types/pedido";
import { formatMoney } from "../../utils/normalizers";

// NOTE: Uses the same company logo path as the NavBar
const LOGO_SRC = "/logo.png"; // Or whichever path is correct for this project

export default function PrintPedidoPage() {
  const { id } = useParams();
  const [pedido, setPedido] = useState<PedidoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getMiPedidoDetalle(Number(id));
        setPedido(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error cargando pedido para imprimir");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    // Cuando el pedido se haya cargado y renderizado, abrimos el diálogo de impresión
    if (pedido && !loading) {
      // Un pequeño timeout para asegurar que las imágenes se intenten cargar
      const t = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(t);
    }
  }, [pedido, loading]);

  if (loading) {
    return <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>Cargando información para imprimir...</div>;
  }

  if (error || !pedido) {
    return <div style={{ padding: "2rem", color: "red", fontFamily: "sans-serif" }}>Error: {error || "No se encontró el pedido"}</div>;
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif", maxWidth: "800px", margin: "0 auto", color: "#000", backgroundColor: "#fff" }}>
      {/* Header con Logo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #000", paddingBottom: "1rem", marginBottom: "2rem" }}>
        <div>
          {/* Please ensure this path matches the actual logo asset in public/ */}
          <img src={LOGO_SRC} alt="Los Bukis Logo" style={{ height: "60px", objectFit: "contain" }} />
        </div>
        <div style={{ textAlign: "right" }}>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold" }}>ORDEN DE COMPRA</h1>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "1.1rem" }}>Pedido #{pedido.id}</p>
        </div>
      </div>

      {/* Info del Cliente y Pedido */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", borderBottom: "1px solid #ccc", paddingBottom: "0.25rem" }}>Facturar a</h3>
          <p style={{ margin: "0.25rem 0", fontWeight: "bold" }}>{pedido.cliente.nombre}</p>
          <p style={{ margin: "0.25rem 0" }}>{pedido.cliente.correo}</p>
          <p style={{ margin: "0.25rem 0" }}>{pedido.cliente.telefono}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", borderBottom: "1px solid #ccc", paddingBottom: "0.25rem" }}>Detalles del Pedido</h3>
          <p style={{ margin: "0.25rem 0" }}><strong>Fecha:</strong> {new Date(pedido.created_at).toLocaleString("es-MX")}</p>
          <p style={{ margin: "0.25rem 0" }}><strong>Estado:</strong> {pedido.estado}</p>
        </div>
      </div>

      {/* Tabla de Artículos */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2rem" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #000" }}>
            <th style={{ textAlign: "left", padding: "0.75rem 0.5rem" }}>Artículo</th>
            <th style={{ textAlign: "left", padding: "0.75rem 0.5rem" }}>Color / No. Ítem</th>
            <th style={{ textAlign: "right", padding: "0.75rem 0.5rem" }}>Cant</th>
            <th style={{ textAlign: "right", padding: "0.75rem 0.5rem" }}>Precio Unit.</th>
            <th style={{ textAlign: "right", padding: "0.75rem 0.5rem" }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {pedido.items.map((item: PedidoItem, i: number) => {
            const descuento = Number(item.descuento_porcentaje_snapshot) || 0;
            const precioFinal = Number(item.precio_unitario_snapshot);
            const precioOriginal = descuento > 0 ? precioFinal / (1 - descuento / 100) : null;
            
            return (
              <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "0.75rem 0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "50px", height: "50px", border: "1px solid #ddd", borderRadius: "4px", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        {item.imagen_principal_snapshot ? (
                           <img src={item.imagen_principal_snapshot} alt={item.producto_nombre_snapshot} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        ) : (
                           <span>📦</span>
                        )}
                    </div>
                    <span style={{ fontWeight: "bold" }}>{item.producto_nombre_snapshot}</span>
                  </div>
                </td>
                <td style={{ padding: "0.75rem 0.5rem" }}>
                  <div style={{ marginBottom: "0.25rem" }}>{item.color_nombre_snapshot}</div>
                  <div style={{ fontSize: "0.85rem", color: "#666" }}>Ítem: {item.producto_item_snapshot}</div>
                </td>
                <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                  {item.cantidad}
                </td>
                <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                  {precioOriginal != null && (
                    <div style={{ textDecoration: "line-through", color: "#888", fontSize: "0.85rem" }}>{formatMoney(precioOriginal)}</div>
                  )}
                  <div>{formatMoney(precioFinal)}</div>
                  {descuento > 0 && <div style={{ fontSize: "0.8rem", color: "#d32f2f" }}>-{descuento.toFixed(2)}%</div>}
                </td>
                <td style={{ padding: "0.75rem 0.5rem", textAlign: "right", fontWeight: "bold" }}>
                  {formatMoney(Number(item.subtotal_linea_snapshot))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totales */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "2rem" }}>
        <table style={{ width: "300px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "0.5rem", textAlign: "right", fontWeight: "bold", fontSize: "1.25rem" }}>Total:</td>
              <td style={{ padding: "0.5rem", textAlign: "right", fontWeight: "bold", fontSize: "1.25rem" }}>{formatMoney(Number(pedido.precio_total))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notas */}
      {(pedido.nota_worker || pedido.denegado_razon) && (
        <div style={{ borderTop: "1px solid #ccc", paddingTop: "1rem" }}>
          <h4 style={{ margin: "0 0 0.5rem 0" }}>Notas del Pedido</h4>
          {pedido.nota_worker && <p style={{ margin: "0.25rem 0" }}><strong>Nota interna:</strong> {pedido.nota_worker}</p>}
          {pedido.denegado_razon && <p style={{ margin: "0.25rem 0", color: "#d32f2f" }}><strong>Razón de rechazo:</strong> {pedido.denegado_razon}</p>}
        </div>
      )}
    </div>
  );
}
