import { useEffect, useState } from "react";
import { useParams } from "react-router";
import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";
import { getProductById } from "../../services/product";
import type { Product } from "../../types/product";

export default function ProductoPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!id) {
          setError("No se recibió id de producto");
          return;
        }
        setLoading(true);
        const data: Product = await getProductById(id);
        setProduct(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <>
      <title>Producto | Importaciones Los Bukis</title>
      <NavBar />

      <div className="container" style={{ padding: "2rem" }}>
        {loading && <p>Cargando producto...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && product && (
          <div className="is-flex" style={{ gap: "2rem" }}>
            <div style={{ flex: "0 0 380px" }}>
              <img
                src={product.imagen ?? "https://placehold.net/600x600.png"}
                alt={product.nombre}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: "1px solid #c3c3c3",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <h1 className="has-text-weight-bold is-size-2" style={{ marginBottom: "0.5rem" }}>
                {product.nombre}
              </h1>

              <p style={{ marginBottom: "0.5rem" }}>
                <strong>No. ítem:</strong> {product.item}
              </p>

              <p style={{ marginBottom: "1rem" }}>
                <strong>Precio:</strong> ${Number(product.precio).toFixed(2)} MXN
              </p>

              <p style={{ marginBottom: "1rem" }}>
                <strong>Descripción:</strong> {product.descripcion}
              </p>

              <div className="content">
                <p>
                  <strong>Peso:</strong> {product.peso}
                </p>
                <p>
                  <strong>Medidas:</strong> {product.medidas}
                </p>
                <p>
                  <strong>Capacidad:</strong> {product.capacidad || "N/A"}
                </p>
                <p>
                  <strong>Categoría (id):</strong> {product.categoria}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
