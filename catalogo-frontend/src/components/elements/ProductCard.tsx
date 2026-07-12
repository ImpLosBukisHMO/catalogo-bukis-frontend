import { useNavigate } from "react-router";
import { Box, Heart } from "lucide-react";
import type { ProductCardVM } from "../../types/product";

type Props = {
  product: ProductCardVM;
  className?: string;
  onToggleFavorite?: (product: ProductCardVM) => void;
  isLikedByUser: boolean;
};

const ProductCard = ({ product, className, onToggleFavorite, isLikedByUser = false }: Props) => {
  const navigate = useNavigate();
  const {
    id, nombre, precio, imagenUrl, disponible, categoria, descuento_especial
  } = product;

  const goToDetail = () => navigate(`/producto/${id}`);

  const specialDiscount = descuento_especial;
  const generalDiscount = categoria?.descuento;
  const productBasePrice = Number(precio) || 0;

  let finalProductPrice = productBasePrice;
  let hasDiscount = false;
  let percentage = 0;

  if (specialDiscount && specialDiscount.es_valido) {
    percentage = Number(specialDiscount.porcentaje) || 0;
    finalProductPrice = productBasePrice - (productBasePrice * percentage / 100);
    hasDiscount = true;
  } else if (generalDiscount && generalDiscount.es_valido) {
    percentage = Number(generalDiscount.porcentaje) || 0;
    finalProductPrice = productBasePrice - (productBasePrice * percentage / 100);
    hasDiscount = true;
  }

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
            img.onerror = null;
            img.src = "https://placehold.net/600x600.png";
          }}
          className="aspect-square w-full object-cover"
        />
      </div>

      <div className="mt-4 flex w-full flex-1 flex-col">
        <p className="line-clamp-2 text-lg font-bold leading-tight text-bukis-ink">
          {nombre}
        </p>

        <p className="my-2 font-semibold text-sm text-bukis-ink">
          <span className="underline">Categoría:</span> {categoria?.nombre}
        </p>

        <p className={`${hasDiscount ? "line-through" : ""} my-1 text-base font-semibold text-bukis-ink`}>
          $ {precio.toFixed(2)} MXN
        </p>

        <p
          style={hasDiscount ? { fontSize: "1.1em" } : {}}
          className="mb-4 text-base font-semibold text-bukis-red-700"
        >
          {hasDiscount ? `$ ${finalProductPrice.toFixed(2)} MXN (-${percentage.toFixed(2)} %)`
          : (<>&nbsp;</>)}
        </p>

        <div className="flex flex-1 flex-col">
          {disponible ? (
            <p className="mt-auto w-fit rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
              Disponible
            </p>
          ) : (
            <p className="mt-auto w-fit rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700 ring-1 ring-red-200">
              No disponible
            </p>
          )}
          <div className="mt-0 flex items-center gap-3 pt-4">
            <button
              className="cursor-pointer inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-bukis-red-800 bg-bukis-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-bukis-red-700 focus:outline-none focus:ring-2 focus:ring-bukis-red-600/35"
              onClick={(e) => {
                e.stopPropagation();
                goToDetail();
              }}
            >
              <Box size={24}/>
              <span>Ver producto</span>
            </button>

            <button
              className={
                `cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white
                ${
                  isLikedByUser ?
                  "text-bukis-red-600 border-bukis-red-600/60 transition hover:border-bukis-red-700 hover:text-bukis-red-700 focus:outline-none focus:ring-2 focus:ring-bukis-red-700/35" :
                  "text-neutral-500 border-neutral-400 transition hover:border-bukis-ink hover:text-bukis-ink focus:outline-none focus:ring-2 focus:ring-bukis-ink/35"
                }`
              }
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(product);
              }}
              aria-label="Agregar a favoritos"
            >
              <Heart size={24}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
