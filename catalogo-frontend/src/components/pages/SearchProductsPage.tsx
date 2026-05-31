import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Footer from "../elements/Footer";
import NavBar from "../elements/NavBar";
import ProductCard from "../elements/ProductCard";
import { Search } from "lucide-react";
import { getProducts, getProductById } from "../../services/product";
import { getCategories } from "../../services/category";
import { type Product, type ProductCardVM } from "../../types/product";
import { Category } from "../../services/category";
import { addFavorito } from "../../services/favoritos";


export default function SearchProductsPage() {
    const [searchParams] = useSearchParams();
    const productQuery = searchParams.get("query") || "";

    const [sideBarSearch, setSideBarSearch] = useState<string>('');
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
            const categoriesData = await getCategories();
            if (Array.isArray(categoriesData)) {
                setCategories(categoriesData);
            } else {
                console.error("La respuesta de categorías no es un arreglo:", categoriesData);
                setCategories([]);
            }
        } catch (e) {
            console.error("Error al obtener las categorías:", e);
            setError(e instanceof Error ? e.message : "Error desconocido al cargar las categorías.");
        }
    }

    const mainFetch = async () => {
        if (productQuery) {
            try {
                const productsData: Product[] = await getProducts();
                const filteredProducts = productsData.filter((p) =>
                    p.nombre.toLowerCase().includes(productQuery.toLowerCase())
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
        // Reset products.
        if ((sideBarSearch.length == 0 && filterCategories.length == 0 &&
            filterMinPrice == 0 && filterMaxPrice == 0) ||
            (sideBarSearch.length == 0 && filterCategories.length == 0 &&
                filterMinPrice == null && filterMaxPrice == null)) {
            await fetchProductData();
        }
        // Apply filter(s).
        else {
            const productsData: Product[] = await getProducts();
            const filteredProducts = productsData.filter((p) => {
                let hasCategory = false;
                let priceInRange = false;
                let hasProdQuery = false

                // Search query with filter 
                if (sideBarSearch.length > 0 && (filterCategories.length > 0 || Number(filterMinPrice) > 0 || Number(filterMaxPrice) > 0)) {
                    if (p.nombre.toLowerCase().includes(sideBarSearch.toLowerCase())) {
                        hasProdQuery = true;
                    }

                    if (filterCategories.includes(p.categoria)) {
                        hasCategory = true;
                    }

                    if ((Number(p.precio) >= filterMinPrice! && Number(p.precio) <= filterMaxPrice!) ||
                        (Number(filterMinPrice) <= 0 && Number(filterMaxPrice) <= 0)) {
                        priceInRange = true;
                    }

                    return (hasCategory && (priceInRange || hasProdQuery));
                }

                // Only search query.
                else if (sideBarSearch.length > 0) {
                    if (p.nombre.toLowerCase().includes(sideBarSearch.toLowerCase())) {
                        return true;
                    }
                }

                // Search without query.
                else {
                    if ((Number(p.precio) >= filterMinPrice! && Number(p.precio) <= filterMaxPrice!) ||
                        (Number(filterMinPrice) <= 0 && Number(filterMaxPrice) <= 0)) {
                        priceInRange = true;
                    }
                    if (filterCategories.includes(p.categoria)) {
                        hasCategory = true;
                    }

                    return hasCategory && priceInRange;
                }
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
        }
    }

    useEffect(() => {
        (async () => {
            setLoading(true);
            await fetchCategories();
            await mainFetch();
            setLoading(false);
        })();
    }, [])

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
                    className="notification"
                    style={{
                        position: "fixed", bottom: "1.5rem", right: "1.5rem",
                        zIndex: 999, maxWidth: 320,
                        background: favMsg.startsWith("Error") || favMsg.startsWith("Este") ? "#ffe0e0" : "#e6f9ee",
                        color: favMsg.startsWith("Error") || favMsg.startsWith("Este") ? "#c0392b" : "#1a7a3f",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                >
                    {favMsg}
                </div>
            )}
            <div className="columns is-flex ml-4 mr-1 is-aligned-items-center" style={{ height: '100%' }}>
                <div className="column is-one-fourth is-one-fifth generic-container"
                    style={{ marginRight: 0, flex: '0 0 20%' }}>
                    <p className="has-text-weight-semibold"
                        style={{ borderBottom: '1px solid #000', paddingBottom: '3px' }}>
                        Filtrar por:
                    </p>

                    <div className="mt-4">
                        <p className="has-text-weight-semibold">
                            Búsqueda
                        </p>

                        <form action={applyFilters}>
                            <input className="mt-2 input custom-input"
                                style={{ width: '95%' }}
                                value={sideBarSearch}
                                onChange={(e) => setSideBarSearch(e.target.value)}
                                placeholder="Busque un producto" />
                        </form>
                    </div>

                    <div className="mt-4" style={{ borderTop: '1px solid #000', paddingTop: '3px' }}>
                        <p className="has-text-weight-semibold">
                            Categoría
                        </p>
                        <div>
                            {categories.length === 0 && !loading && <p className="is-size-6 mt-2">Sin categorías</p>}
                            {
                                categories && categories.map((c) => (
                                    <label key={c.id} className="checkbox is-flex my-3" style={{ display: 'block' }}>
                                        <input
                                            onChange={() => {
                                                if (!filterCategories.includes(c.id)) {
                                                    setFilterCategories([...filterCategories, c.id])
                                                } else {
                                                    setFilterCategories(filterCategories.filter((f) => f !== c.id))
                                                }
                                            }}
                                            type="checkbox"
                                            className="ml-2" />
                                        <p className="ml-2">{c.nombre}</p>
                                    </label>
                                ))
                            }
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="pt-4 has-text-weight-semibold"
                            style={{ borderTop: '1px solid #000', paddingTop: '3px' }}>
                            Rango de precios (MXN)
                        </p>
                        <div className="my-3 is-align-items-center">
                            <p className="ml-2 mb-2">Mínimo</p>
                            <input type="number" min={1} placeholder="Ej.: 1.50" className="ml-2 custom-input" style={{ width: '70%', padding: '8px' }}
                                value={filterMinPrice || ""}
                                onChange={(e) => { setFilterMinPrice(Number(e.target.value)) }} />
                        </div>
                        <div className="is-align-items-center">
                            <p className="ml-2 mb-2">Máximo</p>
                            <input type="number" min={1} placeholder="Ej.: 1500.40" className="ml-2 custom-input" style={{ width: '70%', padding: '8px' }}
                                value={filterMaxPrice || ""}
                                onChange={(e) => { setFilterMaxPrice(Number(e.target.value)) }} />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 is-flex is-justify-content-center" style={{ borderTop: '1px solid #000', paddingTop: '3px' }}>
                        <button className="button custom-btn p-2 is-flex is-align-items-center is-justify-content-center"
                            onClick={applyFilters}
                            disabled={(Number(filterMinPrice) > Number(filterMaxPrice))}>
                            <Search size={20} className="mr-1" /><p className="is-size-7 txt-white">Aplicar filtro(s)</p>
                        </button>
                    </div>
                </div>

                <div className="column is-three-fourths is-four-fifths"
                    style={{ flex: '0 0 80%' }}>

                    {loading && <p style={{ textAlign: "center" }}>Cargando productos...</p>}
                    {error && <p style={{ textAlign: "center", color: "#dc0000" }}>{error}</p>}

                    <div className="ml-2 mb-1 is-flex"
                        style={{
                            position: 'relative', top: 0, paddingBottom: '3px',
                            borderBottom: "1px solid #7c7c7c"
                        }}>
                        {products.length == 0 && <p>{"No se encontró ningún producto."}</p>}
                        {products.length == 1 && <p>{`Se encontró ${products.length} producto.`}</p>}
                        {products.length > 1 && <p>{`Se encontraron ${products.length} productos.`}</p>}
                    </div>

                    {
                        products.length === 0 && !loading && (
                            <div className="is-flex is-flex-direction-column is-justify-content-center">
                                <p className="mt-6 mb-4 is-size-3 has-text-centered">
                                    Para encontrar productos puede:
                                </p>
                                <div className="mx-auto is-flex is-flex-direction-column is-justify-content-center">
                                    <li style={{ color: '#000' }}>
                                        <p className="my-3 is-size-5">
                                            Realizar cambios en la búsqueda.
                                        </p>
                                    </li>
                                    <li style={{ color: '#000' }}>
                                        <p className="my-3 is-size-5">
                                            Dar clic en el cuadro(s) a la izquierda de la categoría(s)
                                            <br />
                                            que busca para seleccionarla.
                                        </p>
                                    </li>
                                    <li style={{ color: '#000' }}>
                                        <p className="my-3 is-size-5">
                                            Ingresar el rango de precios deseado, de tal manera que
                                            <br />
                                            el precio el mínimo sea menor o igual al máximo.
                                        </p>
                                    </li>
                                </div>
                            </div>
                        )
                    }

                    {
                        products.length > 0 && !loading && (
                            <div className="fixed-grid has-1-cols-mobile has-2-cols-tablet has-4-cols-desktop">
                                <div className="grid" style={{ overflow: "scroll", maxHeight: '95vh', padding: '5px' }}>
                                    {
                                        products.map((p) => (
                                            <ProductCard key={p.id} product={p} onToggleFavorite={handleToggleFavorite} />
                                        ))
                                    }
                                </div>
                            </div>
                        )
                    }
                </div>
            </div>
            <Footer />
        </>
    )
}