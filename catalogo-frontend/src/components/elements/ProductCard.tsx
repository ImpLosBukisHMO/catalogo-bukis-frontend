import { CornerDownRight, Heart } from "lucide-react";
import { useNavigate } from "react-router";
import type { ProductCardVM } from "../../types/product";

type Props = {
  product: ProductCardVM;
  className?: string;
  onToggleFavorite?: (product: ProductCardVM) => void;
};

const ProductCard = ({ product, className, onToggleFavorite }: Props) => {
  const navigate = useNavigate();
  const { id, nombre, sku, precio, imagenUrl, disponible } = product;
  const goToDetail = () => navigate(`/producto/${id}`);

  return (
    <div
      className={`mx-2 flex h-full flex-col rounded-2xl border border-bukis-border bg-bukis-surface p-5 shadow-bukis-soft transition hover:-translate-y-0.5 hover:shadow-lg ${className ?? ""}`}
      tabIndex={0}
    >
      <div className="w-full overflow-hidden rounded-xl border border-neutral-300 bg-white shadow-sm">
        <img
          src={imagenUrl || "https://placehold.net/600x600.png"}
          alt={nombre}
          onError={(e) => {
            const img = e.currentTarget;
            img.onerror = null; // evita loop infinito
            img.src = "https://placehold.net/600x600.png";
          }}
          className="aspect-square w-full object-cover"
        />
      </div>

      <div className="mt-4 flex w-full flex-1 flex-col">
        <p className="line-clamp-2 text-lg font-bold leading-tight text-bukis-ink">
          {nombre}
        </p>

        <p className="mt-2 text-base font-semibold text-bukis-red-700">
          $ {precio.toFixed(2)} MXN
        </p>

        <p className="mt-1 text-xs text-neutral-500">
          Ítem (SKU): {sku}
        </p>

        {disponible ? (
          <p className="mt-3 w-fit rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
            Disponible
          </p>
        ) : (
          <p className="mt-3 w-fit rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700 ring-1 ring-red-200">
            No disponible
          </p>
        )}

        <div className="mt-auto flex items-center gap-3 pt-4">
          <button
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-bukis-red-800 bg-bukis-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-bukis-red-700 focus:outline-none focus:ring-2 focus:ring-bukis-red-600/35"
            onClick={(e) => {
              e.stopPropagation();
              goToDetail();
            }}
          >
            <CornerDownRight size={20} />
            <span>Ver producto</span>
          </button>

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-500 transition hover:border-bukis-red-600 hover:text-bukis-red-600 focus:outline-none focus:ring-2 focus:ring-bukis-red-600/35"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(product);
            }}
            aria-label="Agregar a favoritos"
          >
            <Heart size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
