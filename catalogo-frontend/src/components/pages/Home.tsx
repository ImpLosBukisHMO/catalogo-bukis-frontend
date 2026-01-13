import { useEffect, useState } from "react";
import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";
import ProductCard from "../elements/ProductCard";
import OfferSlider from "../elements/OfferSlider";
import { getProducts } from "../../services/product";
import type { Product, ProductCardVM } from "../../types/product";

function Home() {
  const [products, setProducts] = useState<ProductCardVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data: Product[] = await getProducts();
        console.log("primer producto", data[0]);


        const mapped: ProductCardVM[] = data.map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          sku: p.item ?? p.sku ?? "",
          precio: Number(p.precio),
          imagenUrl: p.imagen ?? p.imagenUrl ?? null,
          disponible: true,
        }));


        setProducts(mapped);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <title>Inicio | Importaciones Los Bukis</title>
      <NavBar />

      <h1 className="mb-5 has-text-weight-bold is-size-2" style={{ margin: 0, textAlign: "center" }}>
        {"¡Bienvenido(a)!"}
      </h1>

      <OfferSlider />

      <div>
        <h1 className="has-text-weight-bold is-size-2 py-5" style={{ margin: 0, textAlign: "center" }}>
          Productos destacados
        </h1>

        {loading && <p style={{ textAlign: "center" }}>Cargando productos...</p>}
        {error && <p style={{ textAlign: "center", color: "red" }}>{error}</p>}

        <div className="is-flex is-justify-content-center is-align-items-center" style={{ width: "100%" }}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      <Footer />
    </>
  );
}

export default Home;
