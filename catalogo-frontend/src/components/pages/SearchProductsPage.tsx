import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import Footer from "../elements/Footer";
import NavBar from "../elements/NavBar";
import ProductCard from "../elements/ProductCard";
import { Search } from "lucide-react";
import PaginationControls from "../elements/PaginationControls";
import { getProductById, getProductsPage } from "../../services/product";
import { getCategories } from "../../services/category";
import { type Product, type ProductCardVM } from "../../types/product";
import type { Categoria } from "../../types/categoria";
import { addFavorito, getFavoritos, removeFavorito } from "../../services/favoritos";
import { productKeys } from "../../queries/productKeys";
import { formatMoney } from "../../utils/normalizers";
import {
    buildCatalogLocation,
    normalizeCatalogQuery,
    parseCatalogPageParam,
} from "../../utils/catalogNavigation";
import {
    CATALOG_PAGINATION_ARIA_LABEL,
    applyLocalCatalogFilters as applyLocalFilters,
    getCatalogResultsSummary as getResultsSummary,
} from "./catalogPresentation";

function mapProductToCardVM(product: Product): ProductCardVM {
    return {
        id: product.id,
        nombre: product.nombre,
        precio: Number(product.precio),
        imagenUrl: product.imagen ?? null,
        disponible: true,
        categoria: product.categoria,
        descuento_especial: product.descuento_especial,
    };
}

function isNotFoundError(error: unknown): boolean {
    return (error as { response?: { status?: number } })?.response?.status === 404;
}

export default function SearchProductsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const pageParam = parseCatalogPageParam(searchParams.get("page"));
    const productQuery = normalizeCatalogQuery(searchParams.get("query"));

    const [sideBarSearch, setSideBarSearch] = useState<string>(productQuery);
    const [categories, setCategories] = useState<Categoria[]>([]);
    const [filterCategories, setFilterCategories] = useState<number[]>([]);
    const [filterMinPrice, setFilterMinPrice] = useState<number | null>(null);
    const [filterMaxPrice, setFilterMaxPrice] = useState<number | null>(null);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categoriesWarning, setCategoriesWarning] = useState<string | null>(null);
    const [favMsg, setFavMsg] = useState<string | null>(null);
    const [favoritos, setFavoritos] = useState<{ id: number; producto_id: number }[]>([]);

    const productsQuery = useQuery({
        queryKey: productKeys.list({ page: pageParam.page, query: productQuery }),
        queryFn: () => getProductsPage({ page: pageParam.page, query: productQuery }),
        enabled: !pageParam.isInvalid,
    });

    const visibleProducts = useMemo(() => {
        const items = productsQuery.data?.items ?? [];

        return applyLocalFilters(items, {
            categories: filterCategories,
            minPrice: filterMinPrice,
            maxPrice: filterMaxPrice,
            query: productQuery,
        })
            .map(mapProductToCardVM);
    }, [filterCategories, filterMaxPrice, filterMinPrice, productQuery, productsQuery.data?.items]);

    const hasOutOfRangePage =
        pageParam.page > 1 &&
        Boolean(productsQuery.data) &&
        (productsQuery.data?.items.length ?? 0) === 0;
    const hasRecoverablePageError = pageParam.page > 1 && isNotFoundError(productsQuery.error);
    const showInvalidPageRecovery = pageParam.isInvalid || hasOutOfRangePage || hasRecoverablePageError;
    const productsErrorMessage =
        productsQuery.isError && !showInvalidPageRecovery
            ? productsQuery.error instanceof Error
                ? productsQuery.error.message
                : "Error desconocido al cargar productos."
            : null;
    const loading = categoriesLoading || productsQuery.isLoading;

    const submitCanonicalSearch = (event?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
        event?.preventDefault();

        const nextQuery = normalizeCatalogQuery(sideBarSearch);
        const nextSearchParams = new URLSearchParams();

        nextSearchParams.set("page", "1");
        if (nextQuery) {
            nextSearchParams.set("query", nextQuery);
        }

        setSearchParams(nextSearchParams);
    };

    useEffect(() => {
        setSideBarSearch(productQuery);
    }, [productQuery]);

    useEffect(() => {
        let isMounted = true;

        const fetchCategories = async () => {
            try {
                const data = await getCategories();
                if (isMounted) {
                    setCategories(data);
                    setCategoriesWarning(null);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
                if (isMounted) {
                    setCategoriesWarning("No pudimos cargar las categorías. Los filtros por categoría podrían no estar disponibles.");
                }
            } finally {
                if (isMounted) {
                    setCategoriesLoading(false);
                }
            }
        };

        fetchCategories();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const fetchFavoriteProducts = async () => {
            try {
                const data = await getFavoritos();
                const formattedData = data.map(f => ({ 
                    id: f.id, producto_id: f.variante.producto_id
                }))
                setFavoritos(formattedData)
            } catch (error) {
                setFavMsg(`Error al obtener productos favoritos: ${error}`)
            }
        }
        fetchFavoriteProducts()
    }, [])

    const isLikedByUser = (productID: number) => {
        return Boolean(favoritos.some(f => f.producto_id == productID))
    }

    const handleToggleFavorite = async (product: ProductCardVM) => {
        if (!localStorage.getItem("access")) {
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

                        <form onSubmit={submitCanonicalSearch}>
                            <input className="mt-2 w-full rounded-xl border border-neutral-400 bg-white px-3 py-2 text-bukis-ink placeholder:text-neutral-500 outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/25"
                                type="search"
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
                            {categoriesWarning && (
                                <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" role="status">
                                    {categoriesWarning}
                                </p>
                            )}
                            {categories.length === 0 && !categoriesLoading && <p className="mt-2 text-sm text-neutral-600">Sin categorías</p>}
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
                            <p className="mb-2 text-sm text-neutral-600"><span className="font-semibold">Mínimo</span> ({formatMoney(1)} en adelante)</p>
                            <input type="number" min={1} placeholder="Ejemplo: 1.00" className="w-full rounded-xl border border-neutral-400 bg-white px-3 py-2 text-bukis-ink placeholder:text-neutral-500 outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/25"
                                value={(Number(filterMinPrice) > 0) ? String(filterMinPrice) : ""}
                                onChange={(e) => { setFilterMinPrice((Number(e.target.value) > 0 ? Number(e.target.value) : null))}} />
                        </div>
                        <div>
                            <p className="mb-2 text-sm text-neutral-600"><span className="font-semibold">Máximo</span> (mayor que el precio mínimo)</p>
                            <input type="number" min={1} placeholder="Ejemplo: 100.00" className="w-full rounded-xl border border-neutral-400 bg-white px-3 py-2 text-bukis-ink placeholder:text-neutral-500 outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/25"
                                value={(Number(filterMaxPrice) > 0) ? String(filterMaxPrice) : ""}
                                onChange={(e) => { setFilterMaxPrice((Number(e.target.value) > 0 ? Number(e.target.value) : null)) }} />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-center border-t border-neutral-300 pt-4">
                        <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-bukis-red-800 bg-bukis-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-bukis-red-700 focus:outline-none focus:ring-2 focus:ring-bukis-red-600/35 disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={submitCanonicalSearch}
                            disabled={filterMaxPrice !== null && (Number(filterMinPrice) > Number(filterMaxPrice))}>
                            <Search size={20} /><span>Aplicar filtro(s)</span>
                        </button>
                    </div>
                </aside>

                <section>

                    {loading && <p className="text-center text-neutral-600">Cargando productos...</p>}
                    {productsErrorMessage && <p className="text-center text-bukis-red-700">{productsErrorMessage}</p>}

                    {!loading && !productsErrorMessage && !showInvalidPageRecovery && (
                        <div className="mb-4 border-b border-neutral-300 pb-2 text-sm text-neutral-700">
                            <p>{getResultsSummary(productsQuery.data?.count ?? 0)}</p>
                        </div>
                    )}

                    {
                        !loading && showInvalidPageRecovery && (
                            <div className="rounded-2xl border border-bukis-red-200 bg-red-50 px-6 py-8 text-center text-bukis-ink">
                                <p className="text-2xl font-semibold">No encontramos resultados para esta página.</p>
                                <p className="mt-3 text-sm text-neutral-700">
                                    Revise el número de página o vuelva al inicio del catálogo para continuar navegando.
                                </p>
                                <Link
                                    className="mt-6 inline-flex items-center justify-center rounded-xl border border-bukis-red-800 bg-bukis-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-bukis-red-700 focus:outline-none focus:ring-2 focus:ring-bukis-red-600/35"
                                    to={buildCatalogLocation({ page: 1, query: productQuery })}
                                >
                                    Ir a la página 1
                                </Link>
                            </div>
                        )
                    }

                    {
                        visibleProducts.length === 0 && !loading && !productsErrorMessage && !showInvalidPageRecovery && (
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
                        visibleProducts.length > 0 && !loading && !productsErrorMessage && !showInvalidPageRecovery && (
                            <div>
                                <div className="grid grid-cols-1 gap-4 p-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                    {
                                        visibleProducts.map((p) => (
                                            <ProductCard 
                                                key={p.id} 
                                                product={p} 
                                                onToggleFavorite={handleToggleFavorite} 
                                                isLikedByUser={isLikedByUser(p.id)}
                                            />
                                        ))
                                    }
                                </div>
                                {productsQuery.data && (
                                    <PaginationControls
                                        ariaLabel={CATALOG_PAGINATION_ARIA_LABEL}
                                        page={pageParam.page}
                                        count={productsQuery.data.count}
                                        hasPrevious={Boolean(productsQuery.data.previous)}
                                        hasNext={Boolean(productsQuery.data.next)}
                                        query={productQuery}
                                    />
                                )}
                            </div>
                        )
                    }
                </section>
            </main>
            <Footer />
        </>
    )
}
