/**
 * WorkerDashboardPage — Operations cockpit for staff.
 *
 * Data: React Query (useWorkerPedidos + useWorkerVariants).
 * Styling: wk: Tailwind utilities + worker CSS variable tokens (no Bulma).
 * Fulfillment rail signature: present in queue pressure section header
 * (left accent strip) and status summary dots.
 */

import { useCallback, useMemo } from "react";
import { Flame, Eye, Sparkles, Clock, Package, AlertTriangle, TrendingDown, Box, ArrowRight, CheckCircle2, EyeOff } from "lucide-react";
import { useWorkerPedidos } from "../../queries/workerOrders";
import { 
  useWorkerVariants, 
  useDashboardKpiNovedades,
  useDashboardKpiMasVistos,
  useDashboardKpiMasVendidos,
  useDashboardKpiMenosVistos,
  useDashboardKpiMenosVendidos
} from "../../queries/workerProducts";
import { ESTADO_LABEL } from "../../types/worker";
import type { Product } from "../../types/product";
import { getPedidoStatusColor, getStockTone} from "../elements/workerTheme";
import { formatMoney } from "../../utils/normalizers";
import { resolveImageUrlOrPlaceholder } from "../../utils/images";

const STOCK_BAJO = 5;
// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="wk:space-y-6" aria-busy="true" aria-label="Cargando dashboard…">
      {/* KPI row */}
      <div className="wk:grid wk:grid-cols-2 wk:lg:grid-cols-5 wk:gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="wk:rounded-xl wk:animate-pulse"
            style={{
              height: 96,
              background: "var(--worker-bench)",
              border: "1px solid var(--worker-border-soft)",
            }}
          />
        ))}
      </div>
      {/* Body */}
      <div className="wk:grid wk:grid-cols-3 wk:gap-4">
        <div
          className="wk:col-span-2 wk:rounded-xl wk:animate-pulse"
          style={{ height: 240, background: "var(--worker-bench)", border: "1px solid var(--worker-border-soft)" }}
        />
        <div
          className="wk:rounded-xl wk:animate-pulse"
          style={{ height: 240, background: "var(--worker-bench)", border: "1px solid var(--worker-border-soft)" }}
        />
      </div>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function DashboardError({ message }: { message: string }) {
  return (
    <div
      className="wk:rounded-xl wk:p-4"
      role="alert"
      style={{
        background: "var(--worker-error-bg)",
        border: "1px solid var(--worker-error-border)",
        color: "var(--worker-error-fg)",
        fontSize: 14,
      }}
    >
      <strong>Error al cargar el dashboard:</strong>{" "}
      <span style={{ color: "var(--worker-ink-secondary)" }}>{message}</span>
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number;
  /** CSS variable expression or hex — the rail accent color for this KPI. */
  accentVar: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

function KpiCard({ label, value, accentVar, subtitle, icon }: KpiCardProps) {
  return (
    <div
      className="wk:rounded-2xl wk:p-5 wk:flex wk:flex-col wk:justify-between wk:relative wk:overflow-hidden wk:group hover:wk:shadow-md wk:transition-all wk:duration-300"
      style={{
        background: "var(--worker-shelf)",
        border: "1px solid var(--worker-border-soft)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
      }}
    >
      {/* Decorative background glow based on accent color */}
      <div 
        className="wk:absolute wk:-right-4 wk:-top-4 wk:w-20 wk:h-20 wk:rounded-full wk:opacity-10 wk:transition-transform wk:duration-300 group-hover:wk:scale-110"
        style={{ background: accentVar, filter: "blur(20px)" }}
      />

      <div className="wk:flex wk:items-start wk:justify-between wk:mb-3 wk:relative wk:z-10">
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--worker-ink-secondary)",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {label}
        </p>
        {icon && (
          <div 
            className="wk:p-2 wk:rounded-lg"
            style={{ 
              background: `color-mix(in srgb, ${accentVar} 15%, transparent)`,
              color: accentVar 
            }}
          >
            {icon}
          </div>
        )}
      </div>
      
      <div className="wk:relative wk:z-10">
        <p
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "var(--worker-ink)",
            margin: "0 0 4px",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em"
          }}
        >
          {value}
        </p>
        {subtitle && (
          <div className="wk:flex wk:items-center wk:gap-1.5">
            <span 
              className="wk:w-1.5 wk:h-1.5 wk:rounded-full" 
              style={{ background: accentVar }} 
            />
            <p style={{ fontSize: 12, color: "var(--worker-ink-tertiary)", margin: 0, fontWeight: 500 }}>
              {subtitle}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reusable Product List Card ───────────────────────────────────────────────

interface ProductItemData {
  id: number;
  nombre: string;
  precio: number;                   // Precio final con descuento aplicado. 
  precioOriginal: number | null;    // Precio original sin descuento.
  imagen: string | null;
  categoria?: string;
  stock: number;
  tag?: string;
}

interface ProductListCardProps {
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  products: ProductItemData[];
}

function ProductListCard({ title, icon, accentColor, products }: ProductListCardProps) {
  return (
    <div
      className="wk:rounded-2xl wk:overflow-hidden wk:flex wk:flex-col"
      style={{
        background: "var(--worker-shelf)",
        border: "1px solid var(--worker-border-soft)",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        height: "100%"
      }}
    >
      <div
        className="wk:flex wk:items-center wk:gap-3 wk:px-5 wk:py-4"
        style={{ borderBottom: "1px solid var(--worker-border-soft)" }}
      >
        <div 
          className="wk:p-2 wk:rounded-lg"
          style={{ 
            background: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
            color: accentColor 
          }}
        >
          {icon}
        </div>
        <h2
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--worker-ink)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
        <span
          className="wk:ml-auto wk:flex wk:items-center wk:justify-center"
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--worker-ink-secondary)",
            background: "var(--worker-bench)",
            border: "1px solid var(--worker-border-soft)",
            borderRadius: "50%",
            width: 24,
            height: 24,
          }}
        >
          {products.length}
        </span>
      </div>

      <div className="wk:p-2 wk:flex-1 wk:overflow-y-auto" style={{ maxHeight: 320 }}>
        {products.length === 0 ? (
          <div className="wk:flex wk:flex-col wk:items-center wk:justify-center wk:h-full wk:py-10 wk:opacity-50">
            <Box size={32} className="wk:mb-3" />
            <p style={{ fontSize: 13, fontWeight: 500 }}>Sin datos registrados</p>
          </div>
        ) : (
          <div className="wk:space-y-1">
            {products.map((item, idx) => (
              <div
                key={item.id}
                className="wk:flex wk:items-center wk:gap-3 wk:rounded-xl wk:px-3 wk:py-2.5 hover:wk:bg-[var(--worker-bench)] wk:transition-colors wk:group"
              >
                {/* Ranking number */}
                <span 
                  className="wk:w-4 wk:text-center wk:font-bold wk:text-[11px]" 
                  style={{ color: idx < 3 ? accentColor : "var(--worker-ink-muted)" }}
                >
                  {idx + 1}
                </span>

                <img
                  src={resolveImageUrlOrPlaceholder(item.imagen)}
                  alt={item.nombre}
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid var(--worker-border-soft)",
                    flexShrink: 0,
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = resolveImageUrlOrPlaceholder(null);
                  }}
                />
                <div className="wk:flex-1 wk:min-w-0">
                  <p
                    className="group-hover:wk:text-[var(--worker-ink)] wk:transition-colors"
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--worker-ink)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.nombre}
                  </p>
                  {item.categoria && (
                    <p style={{ fontSize: 11, color: "var(--worker-ink-tertiary)", margin: "2px 0 0", fontWeight: 500 }}>
                      {item.categoria}
                    </p>
                  )}
                </div>
                <div className="wk:text-right wk:pl-2">
                  {item.precioOriginal ? (
                    <>
                      <p
                        style={{
                          fontWeight: 700,
                          margin: 0,
                          fontSize: 13,
                          color: "var(--worker-inventory-fg)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatMoney(item.precio)}
                      </p>
                      <p
                        style={{
                          fontSize: 10,
                          color: "var(--worker-ink-muted)",
                          margin: "1px 0 0",
                          textDecoration: "line-through",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatMoney(item.precioOriginal)}
                      </p>
                    </>
                  ) : (
                    <p
                      style={{
                        fontWeight: 700,
                        margin: 0,
                        fontSize: 13,
                        color: "var(--worker-ink)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatMoney(item.precio)}
                    </p>
                  )}
                  <p style={{ fontSize: 11, color: "var(--worker-ink-muted)", margin: "2px 0 0", fontWeight: 500 }}>
                    Stock: <span style={{ color: item.stock <= STOCK_BAJO ? "var(--worker-error-fg)" : "inherit" }}>{item.stock}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WorkerDashboardPage() {
  const {
    data: pedidos = [],
    isLoading: loadingPedidos,
    isError: errorPedidos,
    error: pedidosError,
  } = useWorkerPedidos();

  const {
    data: variants = [],
    isLoading: loadingVariants,
    isError: errorVariants,
    error: variantsError,
  } = useWorkerVariants();

  const { data: rawNovedades = [], isLoading: loadNov, isError: errNov } = useDashboardKpiNovedades();
  const { data: rawMasVistos = [], isLoading: loadMasV, isError: errMasV } = useDashboardKpiMasVistos();
  const { data: rawMasVendidos = [], isLoading: loadMasVen, isError: errMasVen } = useDashboardKpiMasVendidos();
  const { data: rawMenosVistos = [], isLoading: loadMenosV, isError: errMenosV } = useDashboardKpiMenosVistos();
  const { data: rawMenosVendidos = [], isLoading: loadMenosVen, isError: errMenosVen } = useDashboardKpiMenosVendidos();

  const isLoading = loadingPedidos || loadingVariants || loadNov || loadMasV || loadMasVen || loadMenosV || loadMenosVen;
  const isError   = errorPedidos || errorVariants || errNov || errMasV || errMasVen || errMenosV || errMenosVen;
  const errorMsg  = isError
    ? (pedidosError instanceof Error ? pedidosError.message : null) ??
      (variantsError instanceof Error ? variantsError.message : "Error al cargar el dashboard")
    : null;

  // Derived summaries — memoized to avoid recalculation on unrelated renders.
  const pendientes = useMemo(
    () => pedidos.filter((p) => p.estado === "PENDING"),
    [pedidos]
  );
  const enProceso = useMemo(
    () => pedidos.filter((p) => ["APPROVED", "READY"].includes(p.estado)),
    [pedidos]
  );
  const sinStock = useMemo(
    () => variants.filter((v) => v.stock <= STOCK_BAJO),
    [variants]
  );
  const sinStockAgotados = useMemo(
    () => variants.filter((v) => v.stock === 0),
    [variants]
  );
  const stockBajoExacto = useMemo(
    () => variants.filter((v) => v.stock > 0 && v.stock <= STOCK_BAJO),
    [variants]
  );
  const enOferta = useMemo(
    () => variants.filter((v) => Boolean(v.producto?.descuento_especial || v.producto?.categoria?.descuento?.porcentaje)),
    [variants]
  );
  const activasTotal = useMemo(
    () => variants.filter((v) => v.activo),
    [variants]
  );
  const recientes = useMemo(
    () => [...pendientes].slice(0, 5),
    [pendientes]
  );

  // Group variants into unique products
  const uniqueProducts = useMemo(() => {
    const map = new Map<number, ProductItemData>();

    variants.forEach((v) => {
      if (!v.producto?.id) return;
      if (!map.has(v.producto.id)) {
        // v.producto.precio ya viene del backend con el descuento aplicado.
        // v.producto.precio_original es el precio base sin descuento.
        const precioFinal   = Number(v.producto.precio ?? 0);
        const precioBase    = Number(v.producto.precio_original ?? 0);
        const tieneDescuento =
          (v.producto.categoria?.descuento?.es_valido === true) ||
          (v.producto.descuento_especial?.es_valido === true);

        map.set(v.producto.id, {
          id: v.producto.id,
          nombre: v.producto.nombre,
          precio: precioFinal,
          precioOriginal: tieneDescuento && precioBase > precioFinal ? precioBase : null,
          imagen: v.imagen_principal,
          categoria: v.producto.categoria?.nombre,
          stock: v.stock,
        });
      } else {
        const existing = map.get(v.producto.id)!;
        existing.stock += v.stock;
        if (!existing.imagen && v.imagen_principal) {
          existing.imagen = v.imagen_principal;
        }
      }
    });

    return Array.from(map.values());
  }, [variants]);

  const mapToProductItemData = useCallback((products: Product[]): ProductItemData[] => {
    return products.map(p => {
      const existing = uniqueProducts.find(up => up.id === p.id);
      if (existing) return existing;
      return {
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio),
        precioOriginal: null,
        imagen: p.imagen,
        categoria: p.categoria?.nombre,
        stock: 0,
      };
    });
  }, [uniqueProducts]);

  const novedades = useMemo(() => mapToProductItemData(rawNovedades), [rawNovedades, mapToProductItemData]);
  const masVendidos = useMemo(() => mapToProductItemData(rawMasVendidos), [rawMasVendidos, mapToProductItemData]);
  const menosVendidos = useMemo(() => mapToProductItemData(rawMenosVendidos), [rawMenosVendidos, mapToProductItemData]);
  const masVistos = useMemo(() => mapToProductItemData(rawMasVistos), [rawMasVistos, mapToProductItemData]);
  const menosVistos = useMemo(() => mapToProductItemData(rawMenosVistos), [rawMenosVistos, mapToProductItemData]);

  if (isLoading) return <DashboardSkeleton />;
  if (isError && !pedidos.length && !variants.length)
    return <DashboardError message={errorMsg ?? "Error desconocido"} />;

  return (
    <div className="wk:space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="wk:flex wk:items-start wk:justify-between wk:flex-shrink-0">
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--worker-ink)",
              margin: 0,
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "var(--worker-ink-tertiary)", margin: "4px 0 0" }}>
            Resumen general de pedidos e inventario
          </p>
        </div>
        {/* Background refresh indicator */}
        {(loadingPedidos || loadingVariants) && (
          <span style={{ fontSize: 11, color: "var(--worker-ink-muted)", marginTop: 4 }}>
            Actualizando…
          </span>
        )}
      </div>

      {/* Soft error banner (partial — data may still be stale-visible) */}
      {isError && (pedidos.length > 0 || variants.length > 0) && (
        <div
          className="wk:rounded-lg wk:px-4 wk:py-2 wk:flex-shrink-0"
          style={{
            background: "var(--worker-dispatch-bg)",
            border: "1px solid var(--worker-dispatch-border)",
            color: "var(--worker-dispatch-fg)",
            fontSize: 13,
          }}
        >
          No se pudo actualizar algunos datos. Mostrando información anterior.
        </div>
      )}

      <div
        className="wk:space-y-6 wk:overflow-y-auto wk:pr-1.5"
        style={{
          maxHeight: "calc(100vh - 140px)",
          scrollbarWidth: "thin",
        }}
      >
        {/* ── KPIs ────────────────────────────────────────────────────────────── */}
        <div className="wk:grid wk:grid-cols-2 wk:lg:grid-cols-5 wk:gap-4">
          <KpiCard
            label="Pedidos pendientes"
            value={pendientes.length}
            accentVar="var(--worker-error-fg)"
            subtitle="Requieren atención"
            icon={<Clock size={18} strokeWidth={2.5} />}
          />
          <KpiCard
            label="En proceso"
            value={enProceso.length}
            accentVar="var(--worker-dispatch-fg)"
            subtitle="En preparación"
            icon={<Package size={18} strokeWidth={2.5} />}
          />
          <KpiCard
            label="Agotados (Stock 0)"
            value={sinStockAgotados.length}
            accentVar="var(--worker-error-fg)"
            subtitle="Sin existencias"
            icon={<AlertTriangle size={18} strokeWidth={2.5} />}
          />
          <KpiCard
            label={`Stock bajo (1-${STOCK_BAJO})`}
            value={stockBajoExacto.length}
            accentVar="var(--worker-dispatch-fg)"
            subtitle="Por reabastecer"
            icon={<TrendingDown size={18} strokeWidth={2.5} />}
          />
          <KpiCard
            label="Variantes activas"
            value={activasTotal.length}
            accentVar="var(--worker-rail)"
            subtitle={`${enOferta.length} en oferta`}
            icon={<Box size={18} strokeWidth={2.5} />}
          />
        </div>

        {/* ── Product Lists Section (Novedades, Más Vendidos, Más Vistos, Menos Vendidos, Menos Vistos y Alertas de Stock) ──────── */}
        <div className="wk:grid wk:grid-cols-1 wk:lg:grid-cols-3 wk:gap-4">
          <ProductListCard
            title="Novedades"
            icon={<Sparkles size={18} strokeWidth={2.5} />}
            accentColor="#10B981"
            products={novedades}
          />
          <ProductListCard
            title="Más Vendidos"
            icon={<Flame size={18} strokeWidth={2.5} />}
            accentColor="#EF4444"
            products={masVendidos}
          />
          <ProductListCard
            title="Más Vistos"
            icon={<Eye size={18} strokeWidth={2.5} />}
            accentColor="#3B82F6"
            products={masVistos}
          />
          <ProductListCard
            title="Menos Vendidos"
            icon={<TrendingDown size={18} strokeWidth={2.5} />}
            accentColor="#EF4444"
            products={menosVendidos}
          />
          <ProductListCard
            title="Menos Vistos"
            icon={<EyeOff size={18} strokeWidth={2.5} />}
            accentColor="#3B82F6"
            products={menosVistos}
          />
          <div
            className="wk:rounded-2xl wk:overflow-hidden wk:flex wk:flex-col"
            style={{
              background: "var(--worker-shelf)",
              border: "1px solid var(--worker-border-soft)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
            }}
          >
            <div
              className="wk:flex wk:items-center wk:gap-3 wk:px-5 wk:py-4 wk:flex-shrink-0"
              style={{ borderBottom: "1px solid var(--worker-border-soft)" }}
            >
              <div 
                className="wk:p-2 wk:rounded-lg"
                style={{ background: "var(--worker-dispatch-bg)", color: "var(--worker-dispatch-fg)" }}
              >
                <AlertTriangle size={18} strokeWidth={2.5} />
              </div>
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--worker-ink)",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                Alertas de stock
              </h2>
            </div>

            <div className="wk:p-2 wk:flex-1 wk:overflow-y-auto" style={{ maxHeight: 320 }}>
              {sinStock.length === 0 ? (
                <div className="wk:flex wk:flex-col wk:items-center wk:justify-center wk:py-12 wk:opacity-50 wk:h-full">
                  <CheckCircle2 size={40} className="wk:mb-3 wk:text-green-500" />
                  <p style={{ fontSize: 14, fontWeight: 500 }}>Inventario saludable</p>
                  <p style={{ fontSize: 12 }}>No hay alertas de stock bajo</p>
                </div>
              ) : (
                <div className="wk:space-y-1">
                  {sinStock.map((v) => {
                    const tone = getStockTone(v.stock);
                    const isOut = tone === "out";
                    const fgColor = isOut ? "var(--worker-error-fg)" : "var(--worker-dispatch-fg)";
                    const bgColor = isOut ? "var(--worker-error-bg)" : "var(--worker-dispatch-bg)";
                    
                    return (
                      <div
                        key={v.variant_id}
                        className="wk:flex wk:items-center wk:gap-3 wk:rounded-xl wk:px-3 wk:py-2.5 hover:wk:bg-[var(--worker-bench)] wk:transition-colors"
                      >
                        <div 
                          className="wk:w-8 wk:h-8 wk:rounded-lg wk:flex wk:items-center wk:justify-center wk:font-bold wk:text-sm"
                          style={{ background: bgColor, color: fgColor }}
                        >
                          {v.stock}
                        </div>
                        <div className="wk:flex-1 wk:min-w-0">
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--worker-ink)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {v.producto.nombre}
                          </p>
                          <div className="wk:flex wk:items-center wk:gap-1.5 wk:mt-1">
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background: v.color.hex,
                                border: "1px solid var(--worker-border)",
                                flexShrink: 0,
                                display: "inline-block",
                              }}
                            />
                            <p style={{ fontSize: 11, color: "var(--worker-ink-tertiary)", margin: 0, fontWeight: 500 }}>
                              {v.color.nombre}
                            </p>
                          </div>
                        </div>
                        <span
                          className="wk:px-2 wk:py-1 wk:rounded-md wk:text-[10px] wk:font-bold wk:uppercase"
                          style={{ background: bgColor, color: fgColor, letterSpacing: "0.05em" }}
                        >
                          {isOut ? "Agotado" : "Bajo"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Main Operations Section ─────────────────────────────────────────── */}
        <div className="w-full wk:gap-4">

          {/* ── Queue pressure — recent pending orders ───────────────────────── */}
          <div
            className="wk:lg:col-span-2 wk:rounded-2xl wk:overflow-hidden wk:flex wk:flex-col"
            style={{
              background: "var(--worker-shelf)",
              border: "1px solid var(--worker-border-soft)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
            }}
          >
            {/* Header */}
            <div
              className="wk:flex wk:items-center wk:justify-between wk:px-5 wk:py-4 wk:flex-shrink-0"
              style={{ borderBottom: "1px solid var(--worker-border-soft)" }}
            >
              <div className="wk:flex wk:items-center wk:gap-3">
                <div 
                  className="wk:p-2 wk:rounded-lg"
                  style={{ background: "var(--worker-error-bg)", color: "var(--worker-error-fg)" }}
                >
                  <Clock size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--worker-ink)",
                      margin: 0,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Últimos pedidos pendientes
                  </h2>
                  <p style={{ fontSize: 12, color: "var(--worker-ink-tertiary)", margin: "2px 0 0" }}>
                    Pedidos recientes que requieren atención
                  </p>
                </div>
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--worker-error-fg)",
                  background: "var(--worker-error-bg)",
                  border: "1px solid var(--worker-error-border)",
                  borderRadius: 20,
                  padding: "4px 12px",
                }}
              >
                {pendientes.length} pendientes
              </span>
            </div>

            {/* ── Status summary ─────────────────────────────────────────────────── */}
            <div
              className="wk:px-5 wk:py-3 wk:flex-shrink-0 wk:bg-[var(--worker-bench)]"
              style={{ borderBottom: "1px solid var(--worker-border-soft)" }}
            >
              <div className="wk:flex wk:flex-wrap wk:gap-3 wk:items-center">
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--worker-ink-tertiary)", textTransform: "uppercase" }}>
                  Vista general:
                </span>
                {Object.entries(ESTADO_LABEL).map(([key, label]) => {
                  const count   = pedidos.filter((p) => p.estado === key).length;
                  if (count === 0) return null; // Only show non-zero to reduce clutter
                  const dotColor = getPedidoStatusColor(key);
                  return (
                    <span
                      key={key}
                      className="wk:flex wk:items-center wk:gap-1.5 wk:rounded-md wk:px-2.5 wk:py-1"
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        background: "var(--worker-shelf)",
                        border: "1px solid var(--worker-border-soft)",
                        color: "var(--worker-ink-secondary)",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: dotColor,
                          flexShrink: 0,
                          boxShadow: `0 0 0 2px color-mix(in srgb, ${dotColor} 20%, transparent)`
                        }}
                      />
                      {label}:{" "}
                      <strong style={{ color: "var(--worker-ink)", fontVariantNumeric: "tabular-nums" }}>
                        {count}
                      </strong>
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="wk:p-2 wk:flex-1 wk:overflow-y-auto" style={{ maxHeight: 320 }}>
              {recientes.length === 0 ? (
                <div className="wk:flex wk:flex-col wk:items-center wk:justify-center wk:py-12 wk:opacity-50 wk:h-full">
                  <CheckCircle2 size={40} className="wk:mb-3 wk:text-green-500" />
                  <p style={{ fontSize: 14, fontWeight: 500 }}>No hay pedidos pendientes</p>
                  <p style={{ fontSize: 12 }}>¡Todo al día!</p>
                </div>
              ) : (
                <div className="wk:space-y-1">
                  {recientes.map((p) => (
                    <div
                      key={p.id}
                      className="wk:flex wk:items-center wk:justify-between wk:rounded-xl wk:px-4 wk:py-3 hover:wk:bg-[var(--worker-bench)] wk:transition-colors wk:group wk:cursor-pointer"
                      style={{ border: "1px solid transparent" }}
                    >
                      <div className="wk:flex wk:items-center wk:gap-4">
                        <div 
                          className="wk:w-10 wk:h-10 wk:rounded-full wk:flex wk:items-center wk:justify-center"
                          style={{ background: "var(--worker-error-bg)", color: "var(--worker-error-fg)" }}
                        >
                          <Package size={18} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, margin: 0, fontSize: 14, color: "var(--worker-ink)" }}>
                            {p.cliente.nombre}
                          </p>
                          <p className="wk:flex wk:items-center wk:gap-2" style={{ fontSize: 12, color: "var(--worker-ink-tertiary)", margin: "3px 0 0", fontWeight: 500 }}>
                            <span>{p.folio || `#${p.id}`}</span>
                            <span>•</span>
                            <span>{p.items_count} {p.items_count === 1 ? "artículo" : "artículos"}</span>
                            <span>•</span>
                            <span>{new Date(p.created_at).toLocaleDateString("es-MX", { day: 'numeric', month: 'short' })}</span>
                          </p>
                        </div>
                      </div>
                      <div className="wk:text-right wk:flex wk:items-center wk:gap-4">
                        <p
                          style={{
                            fontWeight: 700,
                            margin: 0,
                            fontSize: 15,
                            color: "var(--worker-ink)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {formatMoney(Number(p.precio_total))}
                        </p>
                        <ArrowRight size={18} className="wk:text-[var(--worker-ink-muted)] group-hover:wk:text-[var(--worker-ink)] wk:transition-colors wk:opacity-0 group-hover:wk:opacity-100 wk:-translate-x-2 group-hover:wk:translate-x-0 wk:duration-200" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>          
        </div>
      </div>
    </div>
  );
}
