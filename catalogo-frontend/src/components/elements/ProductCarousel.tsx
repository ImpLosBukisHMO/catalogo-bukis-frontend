import ProductCard from "./ProductCard";
import type { ProductCardVM } from "../../types/product";

type Props = {
  title: string;
  products: ProductCardVM[];
  onToggleFavorite: (product: ProductCardVM) => void;
  isLikedByUser: (productId: number) => boolean;
  className?: string;
};

export default function ProductCarousel({
  title,
  products,
  onToggleFavorite,
  isLikedByUser,
  className,
}: Props) {
  if (products.length === 0) return null;

  return (
    <section className={className ?? "mx-auto max-w-7xl px-4 py-8"}>
      <h2 className="text-2xl font-bold text-bukis-ink">{title}</h2>
      <div className="mt-6 flex w-full gap-4 overflow-x-auto px-1 pb-4 snap-x snap-mandatory">
        {products.map((product) => (
          <div key={product.id} className="w-72 shrink-0 snap-start">
            <ProductCard
              product={product}
              onToggleFavorite={onToggleFavorite}
              isLikedByUser={isLikedByUser(product.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
