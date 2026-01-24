import { useEffect, useState } from "react";
import { useParams } from "react-router";
import ImageZoom from "react-image-zooom";
import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";
import { ShoppingCart, Heart } from "lucide-react";
import { getProductById } from "../../services/product";
import { getCategoryById } from "../../services/category";
import type { Product } from "../../types/product";

type Props = {
  onToggleFavorite?: (product: Product) => void;
};

export default function ProductPage({ onToggleFavorite }: Props) {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [productCategory, setProductCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorite, setFavorite] = useState(false);
  const [qty2Buy, setQty2Buy] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const handleProductQty = (e) => {
    setQty2Buy(e.target.value);
  }

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
        const category = await getCategoryById(data.categoria);
        setProductCategory(category.nombre);
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
      <div className="mb-5 is-flex is-justify-content-center" style={{ width: '100%', padding: '2rem', }}>
        {loading && <p>Cargando producto...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && product && (
          <div className="is-flex" style={{ gap: '5%', }}>
            <div className="is-flex is-flex-direction-column" style={{ flex: "0 0 47.5%", gap: "0.5rem" }}>
              <div className="zoomable-img is-flex is-justify-content-center">
                <ImageZoom
                  src={product.imagen ?? "https://placehold.net/600x600.png"}
                  alt={product.nombre}
                  zoom={350}
                  width={'500rem'}
                  height={"auto"}
                />
              </div>
              <div className="zoomable-img is-flex is-justify-content-center" style={{ gap: '0.5rem' }}>
                <button><img className="product-img-sidebar" src="https://placehold.net/600x600.png" alt="thumbnail" /></button>
                <button><img className="product-img-sidebar" src="https://placehold.net/600x600.png" alt="thumbnail" /></button>
                <button><img className="product-img-sidebar" src="https://placehold.net/600x600.png" alt="thumbnail" /></button>
                <button><img className="product-img-sidebar" src="https://placehold.net/600x600.png" alt="thumbnail" /></button>
                <button><img className="product-img-sidebar" src="https://placehold.net/600x600.png" alt="thumbnail" /></button>
              </div>
            </div>
            <div className="is-flex is-flex-direction-column" style={{ flex: "0 0 47.5%" }}>
              <h1 className="has-text-weight-bold is-size-2" style={{ marginBottom: "0.5rem" }}>
                {product.nombre}
              </h1>

              <p className="mb-1">
                <span className="is-size-4 product-attr">$ {Number(product.precio).toFixed(2)} MXN</span> (IVA incluido)
              </p>

              {product.disponible ? (
                <p className="is-size-6 mb-3" style={{ color: "green" }}>
                  Disponible
                </p>
              ) : (
                <p className="is-size-6 mb-3" style={{ color: "red" }}>
                  No disponible
                </p>
              )}

              <p className="product-attr mb-5">
                <strong className="product-label">Descripción:</strong> {product.descripcion || "N/A"}
              </p>

              <div className="is-flex mb-5">
                <p className="has-text-weight-semibold mr-3" style={{margin: 'auto 0',}}>Me gusta</p>
                <button
                  className="mt-1 p-1 favorite-product-btn"
                  style={{margin: 'auto 0',}}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite?.(product);
                  }}
                  aria-label="Agregar a favoritos"
                >
                  <Heart size={24} />
                </button>
              </div>

              <table className="is-fullwidth mb-5">
                <thead className="table-thead-1">
                  <tr>
                    <th colSpan={2} className="is-size-6" style={{ color: '#000' }}>
                      <p className="m-2 has-text-centered">Información adicional</p>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="table-body-1">
                    <td>
                      <p className="m-2 product-attr has-text-centered">
                        <strong className="product-label">Ítem (SKU)</strong>
                      </p>
                    </td>
                    <td>
                      <p className="m-2 product-attr has-text-centered">
                        {product.item}
                      </p>
                    </td>
                  </tr>
                  <tr className="table-body-1">
                    <td>
                      <p className="m-2 product-attr has-text-centered">
                        <strong className="product-label">Peso</strong>
                      </p>
                    </td>
                    <td>
                      <p className="m-2 product-attr has-text-centered">
                        {product.peso} kg
                      </p>
                    </td>
                  </tr>
                  <tr className="table-body-1">
                    <td>
                      <p className="m-2 product-attr has-text-centered">
                        <strong className="product-label">Medidas</strong>
                      </p>
                    </td>
                    <td>
                      <p className="m-2 product-attr has-text-centered">
                        {product.medidas}
                      </p>
                    </td>
                  </tr>
                  <tr className="table-body-1">
                    <td>
                      <p className="m-2 product-attr has-text-centered">
                        <strong className="product-label">Capacidad</strong>
                      </p>
                    </td>
                    <td>
                      <p className="m-2 product-attr has-text-centered">
                        {product.capacidad || "N/A"}
                      </p>
                    </td>
                  </tr>
                  <tr className="table-body-1">
                    <td>
                      <p className="m-2 product-attr has-text-centered">
                        <strong className="product-label">Categoría</strong>
                      </p>
                    </td>
                    <td>
                      <p className="m-2 product-attr has-text-centered">
                        {productCategory || "N/A"}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-3 product-attr is-flex">
                <div className="is-flex mr-3">
                  <p className="mr-3 has-text-weight-semibold" style={{ margin: 'auto 0', }}>Cantidad</p>
                  <input className="buy-qty-input" type="number" min={product.disponible ? 1 : 0} defaultValue={qty2Buy} onChange={handleProductQty} disabled={!product.disponible} />
                </div>
                <button
                  className="pt-1 pb-1 pl-2 pr-2 custom-btn is-flex is-align-items-center"
                  disabled={!product.disponible}
                  onClick={(e) => { e.stopPropagation(); }}
                  style={{
                    marginLeft: 'auto',
                    opacity: product.disponible ? 1 : 0.6,
                    cursor: product.disponible ? "pointer" : "not-allowed",
                  }}
                >
                  <ShoppingCart size={28} />
                  <p className="is-size-6 txt-white">&nbsp;&nbsp;Añadir al pedido</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
