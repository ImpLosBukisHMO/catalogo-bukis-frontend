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

        const mapped: ProductCardVM[] = data.map((p: Product) => ({
          id: p.id,
          nombre: p.nombre,
          sku: p.item ?? "",
          precio: Number(p.precio),
          imagenUrl: p.imagen ?? null,
          disponible: true,
        }));


        setProducts(mapped);
      } catch (e) {
        console.error("Error al obtener los productos:", e);
        setError(e instanceof Error ? e.message : "Error desconocido al cargar productos.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <title>Inicio | Importaciones Los Bukis</title>
      <NavBar />

      <h1 className="mb-5 text-center text-4xl font-bold text-bukis-ink">
        {"¡Bienvenido(a)!"}
      </h1>

      <OfferSlider />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-center text-3xl font-bold text-bukis-ink">
          Productos destacados
        </h1>

        {loading && <p className="mt-6 text-center text-neutral-600">Cargando productos...</p>}
        {error && <p className="mt-6 text-center text-bukis-red-700">{error}</p>}

        <div className="mt-6 flex w-full gap-4 overflow-x-auto px-1 pb-4 snap-x snap-mandatory">
          {products.map((p) => (
            <div key={p.id} className="w-72 shrink-0 snap-start">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 pb-10">
        <h1 className='py-5 text-center text-3xl font-bold text-bukis-ink'>
          Nos ubicamos en:
        </h1>
        <div className='mb-6 flex justify-center'>
          <iframe className='min-h-[320px] w-full max-w-4xl rounded-2xl border border-neutral-300 shadow-bukis-soft' src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5117.699121661781!2d-110.99242163568606!3d29.0906510470514!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86ce840f0c532091%3A0xb230f207772b69bb!2sImportaciones%20Los%20Bukis!5e0!3m2!1ses-419!2smx!4v1767916805029!5m2!1ses-419!2smx" width="800" height="460" loading="lazy"></iframe>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default Home;
