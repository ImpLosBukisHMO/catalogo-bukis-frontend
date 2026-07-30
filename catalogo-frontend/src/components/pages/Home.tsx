import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";
import ProductCard from "../elements/ProductCard";
import OfferSlider from "../elements/OfferSlider";
import { getProductById, getProducts } from "../../services/product";
import type { Product, ProductCardVM, ProductDetail } from "../../types/product";
import { addFavorito, getFavoritos, removeFavorito } from "../../services/favoritos";
import { AuthContext } from "../../context/AuthContext";


function Home() {
  const [products, setProducts] = useState<ProductCardVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favMsg, setFavMsg] = useState<string | null>(null);
  const [favoritos, setFavoritos] = useState<{ id: number; producto_id: number }[]>([]);

  const isLoggedIn = useContext(AuthContext)?.isLoggedIn ?? false;

  useEffect(() => {
    const fetchFavoritos = async () => {
      if (isLoggedIn) {
        try {
          const data = await getFavoritos();
          const formattedData = data.map((f) => ({ id: f.id, producto_id: f.variante?.producto_id }))
          setFavoritos(formattedData);
        } catch (error) {
          console.error("Error al cargar errores favoritos.", error)
        }
      }
    }

    fetchFavoritos();
  }, [isLoggedIn])

  const isLikedByUser = (productID: number) => {
    return favoritos.some(f => f.producto_id === productID)
  }
  
  const handleToggleFavorite = async (product: ProductCardVM | ProductDetail) => {
    if (!localStorage.getItem("access") && !localStorage.getItem("token")) {
        window.location.href = "/iniciar-sesion";
        return;
    }

    try {
        const existingFav = favoritos.find(f => f.producto_id === product.id);
        if (existingFav) {
            await removeFavorito(existingFav.id);
            setFavoritos(prev => prev.filter(f => f.id !== existingFav.id));
            setFavMsg(`"${product.nombre}" eliminado de favoritos.`);
            setTimeout(() => setFavMsg(null), 3000);
            return;
        }

        const detail = await getProductById(product.id);
        const variantes = detail.variantes ?? [];
        const varianteId = (variantes.find((v: unknown) => (v as { disponible: boolean }).disponible) ?? variantes[0])?.id;
        if (!varianteId) {
            setFavMsg("Este producto no tiene variantes disponibles.");
            setTimeout(() => setFavMsg(null), 3000);
            return;
        }
        const newFav = await addFavorito(varianteId);
        setFavoritos(prev => [...prev, { id: newFav.id, producto_id: newFav.variante.producto_id }]);
        setFavMsg(`"${product.nombre}" agregado a favoritos.`);
        setTimeout(() => setFavMsg(null), 3000);
    } catch {
        setFavMsg("Error al actualizar favoritos.");
    }
    setTimeout(() => setFavMsg(null), 3000);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data: Product[] = await getProducts();

        const mapped: ProductCardVM[] = data.map((p: Product) => ({
          id: p.id,
          nombre: p.nombre,
          precio: Number(p.precio),
          imagenUrl: p.imagen ?? null,
          disponible: true,
          categoria: p.categoria ?? null,
          descuento_especial: p.descuento_especial ?? null,
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
        <div className="mt-4 flex justify-center">
          <Link
            to="/productos"
            className="inline-flex items-center justify-center rounded-xl border border-bukis-red-800 bg-bukis-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-bukis-red-700 focus:outline-none focus:ring-2 focus:ring-bukis-red-600/35"
          >
            Ver todo el catálogo
          </Link>
        </div>

        {loading && <p className="mt-6 text-center text-neutral-600">Cargando productos...</p>}
        {error && <p className="mt-6 text-center text-bukis-red-700">{error}</p>}

        {favMsg && (
          <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-bukis-ink px-4 py-3 text-white shadow-bukis-soft">
            {favMsg}
          </div>
        )}

        <div className="mt-6 flex w-full gap-4 overflow-x-auto px-1 pb-4 snap-x snap-mandatory">
          {products.map((p) => (
            <div key={p.id} className="w-72 shrink-0 snap-start">
              <ProductCard 
                product={p}
                onToggleFavorite={handleToggleFavorite}
                isLikedByUser={isLikedByUser(p.id)}
              />
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 pb-10">
        <h1 className='py-5 text-center text-3xl font-bold text-bukis-ink'>
          Nos ubicamos en:
        </h1>
        <div className='mb-6 flex justify-center'>
          <iframe className='min-h-80 w-full max-w-4xl rounded-2xl border border-neutral-300 shadow-bukis-soft' src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5117.699121661781!2d-110.99242163568606!3d29.0906510470514!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86ce840f0c532091%3A0xb230f207772b69bb!2sImportaciones%20Los%20Bukis!5e0!3m2!1ses-419!2smx!4v1767916805029!5m2!1ses-419!2smx" width="800" height="460" loading="lazy"></iframe>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default Home;
