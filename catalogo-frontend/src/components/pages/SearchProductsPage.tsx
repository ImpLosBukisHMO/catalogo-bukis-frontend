import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Footer from "../elements/Footer";
import NavBar from "../elements/NavBar";
import ProductCard from "../elements/ProductCard";
import { Search } from "lucide-react";
import { getProducts, getProductById } from "../../services/product";
import { getCategories } from "../../services/category";
import { type Product, type ProductCardVM } from "../../types/product";
import type { Category } from "../../services/category";
import { addFavorito } from "../../services/favoritos";
import { stripDiacritics } from "../../utils/normalizers";

const normalizeSearchText = (value: string) => stripDiacritics(value).toLowerCase();

export default function SearchProductsPage() {
    const [searchParams] = useSearchParams();
    const productQuery = searchParams.get("query") || "";

    const [sideBarSearch, setSideBarSearch] = useState<string>(productQuery);
    const [products, setProducts] = useState<ProductCardVM[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [filterCategories, setFilterCategories] = useState<number[]>([]);
    const [filterMinPrice, setFilterMinPrice] = useState<number | null>(null);
    const [filterMaxPrice, setFilterMaxPrice] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [favMsg, setFavMsg] = useState<string | null>(null);

    const fetchProductData = async () => {
        try {
            const productsData: Product[] = await getProducts();
            const mappedProducts: ProductCardVM[] = productsData.map((p: Product) => ({
                id: p.id,
                nombre: p.nombre,
                sku: p.item ?? "",
                precio: Number(p.precio),
                imagenUrl: p.imagen ?? null,
                disponible: true,
            }));
            setProducts(mappedProducts);
        } catch (e) {
            console.error("Error al obtener los productos:", e);
            setError(e instanceof Error ? e.message : "Error desconocido al cargar productos.");
        }
    }

    const fetchCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (e) {
            console.error("Error al obtener las categorías:", e);
            setError(e instanceof Error ? e.message : "Error desconocido al cargar las categorías.");
        }
    }

    const mainFetch = async () => {
        if (productQuery) {
            try {
                const productsData: Product[] = await getProducts();
                const normalizedQuery = normalizeSearchText(productQuery);
                const filteredProducts = productsData.filter((p) =>
                    normalizeSearchText(p.nombre).includes(normalizedQuery)
                );
                const mappedProducts: ProductCardVM[] = filteredProducts.map((p: Product) => ({
                    id: p.id,
                    nombre: p.nombre,
                    sku: p.item ?? "",
                    precio: Number(p.precio),
                    imagenUrl: p.imagen ?? null,
                    disponible: true,
                }));
                setProducts(mappedProducts);
            } catch (e) {
                console.error("Error al obtener los productos:", e);
                setError(e instanceof Error ? e.message : "Error desconocido al cargar productos.");
            }
        } else {
            await fetchProductData();
        }
    }

    const applyFilters = async () => {
        setLoading(true);
        try {
            const productsData: Product[] = await getProducts();
            const filteredProducts = productsData.filter((p: Product) => {
                const normalizedSearch = normalizeSearchText(sideBarSearch);
                const matchesSearch = normalizedSearch === "" ||normalizeSearchText(p.nombre).includes(normalizedSearch)
                const productCats: number[] = p.categorias || []
                const matchesCategory = filterCategories.length === 0 || productCats.some(cat => filterCategories.includes(cat));
                const price = Number(p.precio);
                const matchesPrice = (filterMinPrice === null || price >= filterMinPrice) && (filterMaxPrice === null || price <= filterMaxPrice);
                return matchesSearch && matchesCategory && matchesPrice;
            });
            const mappedProducts: ProductCardVM[] = filteredProducts.map((p: Product) => ({
                id: p.id,
                nombre: p.nombre,
                sku: p.item ?? "",
                precio: Number(p.precio),
                imagenUrl: p.imagen ?? null,
                disponible: true,
            }));
            setProducts(mappedProducts);
            setError("");
        } catch {
            setError("Error al filtrar productos");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setSideBarSearch(productQuery);
        (async () => {
            setLoading(true);
            await fetchCategories();
            await mainFetch();
            setLoading(false);
        })();
    }, [productQuery])

    const handleToggleFavorite = async (product: ProductCardVM) => {
        if (!localStorage.getItem("access")) {
            window.location.href = "/iniciar-sesion";
            return;
        }
        try {
            const detail = await getProductById(product.id);
            const variantes = detail.variantes ?? [];
            const varianteId = (variantes.find((v: unknown) => (v as { disponible: boolean }).disponible) ?? variantes[0])?.id;
            if (!varianteId) {
                setFavMsg("Este producto no tiene variantes disponibles.");
                setTimeout(() => setFavMsg(null), 3000);
                return;
            }
            await addFavorito(varianteId);
            setFavMsg(`"${product.nombre}" agregado a favoritos.`);
        } catch {
            setFavMsg("Error al agregar a favoritos.");
        }
        setTimeout(() => setFavMsg(null), 3000);
    };

    return (
        <>
            <NavBar navBarQuery={productQuery || ""} />
            {favMsg && (
                <div
                    className={`fixed bottom-6 right-6 z-999 max-w-xs rounded-2xl px-4 py-3 text-sm font-medium shadow-bukis-soft ${favMsg.startsWith("Error") || favMsg.startsWith("Este") ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"}`}
                >
                    {favMsg}
                </div>
            )}
            <main className="mx-auto grid max-w-7xl gap-6 px-4 pb-10 lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="h-fit rounded-2xl border border-bukis-border bg-bukis-surface p-5 shadow-bukis-soft">
                    <p className="border-b border-neutral-300 pb-2 font-semibold text-bukis-ink">
                        Filtrar por:
                    </p>

                    <div className="mt-4">
                        <p className="font-semibold text-bukis-ink">
                            Búsqueda
                        </p>

                        <form action={applyFilters}>
                            <input className="mt-2 w-full rounded-xl border border-neutral-400 bg-white px-3 py-2 text-bukis-ink placeholder:text-neutral-500 outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/25"
                                value={sideBarSearch}
                                onChange={(e) => setSideBarSearch(e.target.value)}
                                placeholder="Busque un producto" />
                        </form>
                    </div>

                    <div className="mt-4 border-t border-neutral-300 pt-4">
                        <p className="font-semibold text-bukis-ink">
                            Categoría
                        </p>
                        <div>
                            {categories.length === 0 && !loading && <p className="mt-2 text-sm text-neutral-600">Sin categorías</p>}
                            {
                                categories && categories.map((c) => (
                                    <label key={c.id} className="my-3 flex items-center gap-2 text-sm text-bukis-ink">
                                        <input
                                            onChange={() => {
                                                if (c.id === null) return;
                                                if (!filterCategories.includes(c.id)) {
                                                    setFilterCategories([...filterCategories, c.id])
                                                } else {
                                                    setFilterCategories(filterCategories.filter((f) => f !== c.id))
                                                }
                                            }}
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-neutral-400 text-bukis-red-600 focus:ring-bukis-red-600/30" />
                                        <span>{c.nombre}</span>
                                    </label>
                                ))
                            }
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="border-t border-neutral-300 pt-4 font-semibold text-bukis-ink">
                            Rango de precios (MXN)
                        </p>
                        <div className="my-3">
                            <p className="mb-2 text-sm text-neutral-600">Mínimo</p>
                            <input type="number" min={0} placeholder="Ejemplo: 1.50" className="w-full rounded-xl border border-neutral-400 bg-white px-3 py-2 text-bukis-ink placeholder:text-neutral-500 outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/25"
                                value={(Number(filterMinPrice) > 0) ? String(filterMinPrice) : ""}
                                onChange={(e) => { setFilterMinPrice((Number(e.target.value) > 0 ? Number(e.target.value) : null))}} />
                        </div>
                        <div>
                            <p className="mb-2 text-sm text-neutral-600">Máximo</p>
                            <input type="number" min={0} placeholder="Ejemplo: 100.00" className="w-full rounded-xl border border-neutral-400 bg-white px-3 py-2 text-bukis-ink placeholder:text-neutral-500 outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/25"
                                value={(Number(filterMaxPrice) > 0) ? String(filterMaxPrice) : ""}
                                onChange={(e) => { setFilterMaxPrice((Number(e.target.value) > 0 ? Number(e.target.value) : null)) }} />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-center border-t border-neutral-300 pt-4">
                        <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-bukis-red-800 bg-bukis-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-bukis-red-700 focus:outline-none focus:ring-2 focus:ring-bukis-red-600/35 disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={applyFilters}
                            disabled={(Number(filterMinPrice) > Number(filterMaxPrice))}>
                            <Search size={20} /><span>Aplicar filtro(s)</span>
                        </button>
                    </div>
                </aside>

                <section>

                    {loading && <p className="text-center text-neutral-600">Cargando productos...</p>}
                    {error && <p className="text-center text-bukis-red-700">{error}</p>}

                    <div className="mb-4 border-b border-neutral-300 pb-2 text-sm text-neutral-700">
                        {products.length == 0 && <p>{"No se encontró ningún producto."}</p>}
                        {products.length == 1 && <p>{`Se encontró ${products.length} producto.`}</p>}
                        {products.length > 1 && <p>{`Se encontraron ${products.length} productos.`}</p>}
                    </div>

                    {
                        products.length === 0 && !loading && (
                            <div className="flex flex-col items-center justify-center text-bukis-ink">
                                <p className="mb-4 mt-6 text-center text-2xl font-semibold">
                                    Para encontrar productos puede:
                                </p>
                                <ul className="mx-auto list-disc space-y-3 text-lg">
                                    <li>
                                        <p>
                                            Realizar cambios en la búsqueda.
                                        </p>
                                    </li>
                                    <li>
                                        <p>
                                            Dar clic en el cuadro(s) a la izquierda de la categoría(s)
                                            <br />
                                            que busca para seleccionarla.
                                        </p>
                                    </li>
                                    <li>
                                        <p>
                                            Ingresar el rango de precios deseado, de tal manera que
                                            <br />
                                            el precio el mínimo sea menor o igual al máximo.
                                        </p>
                                    </li>
                                </ul>
                            </div>
                        )
                    }

                    {
                        products.length > 0 && !loading && (
                            <div>
                                <div className="grid max-h-[95vh] grid-cols-1 gap-4 overflow-auto p-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                    {
                                        products.map((p) => (
                                            <ProductCard key={p.id} product={p} onToggleFavorite={handleToggleFavorite} />
                                        ))
                                    }
                                </div>
                            </div>
                        )
                    }
                </section>
            </main>
            <Footer />
        </>
    )
}
