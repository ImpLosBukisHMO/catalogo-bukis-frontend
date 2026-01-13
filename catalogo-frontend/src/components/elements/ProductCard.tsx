import { FaCartPlus } from "react-icons/fa";
import { TiHeartFullOutline } from "react-icons/ti";
import { useNavigate } from "react-router";
import type { ProductCardVM } from "../../types/product";

type Props = {
  product: ProductCardVM;
  onAddToOrder?: (product: ProductCardVM) => void;
  onToggleFavorite?: (product: ProductCardVM) => void;
};

const ProductCard = ({ product, onAddToOrder, onToggleFavorite }: Props) => {
  const navigate = useNavigate();

  const { id, nombre, sku, precio, imagenUrl, disponible } = product;

  const goToDetail = () => navigate(`/producto/${id}`);

  return (
    <div
      className="mx-2 p-5 is-flex is-flex-direction-column is-align-items-center"
      style={{
        borderRadius: 12,
        border: "1px solid #c3c3c3",
        boxShadow: "0 2px 5px rgba(0,0,0,0.35)",
        backgroundColor: "#f5f5f5",
        cursor: "pointer",
      }}
      role="link"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") goToDetail();
      }}
    >
      <div>
            <img
            src={imagenUrl ?? "https://placehold.net/600x600.png"}
            alt={nombre}
            onError={(e) => {
                const img = e.currentTarget;
                img.onerror = null; // evita loop infinito
                img.src = "https://placehold.net/600x600.png";
            }}
            style={{
                width: "auto",
                height: 150,
                borderRadius: 12,
                border: "2px solid #c3c3c3",
                boxShadow: "0 4px 8px rgba(0,0,0,0.35)",
            }}
            />
      </div>

      <div className="mt-3" style={{ width: "100%" }}>
        <p className="is-size-5 has-text-weight-bold" style={{ color: "black" }}>
          {nombre}
        </p>

        <p className="is-size-7 has-text-weight-light" style={{ color: "black" }}>
          No. ítem: {sku}
        </p>

        <p className="is-size-7 has-text-weight-light" style={{ color: "black" }}>
          ${precio.toFixed(2)} MXN
        </p>

        {disponible ? (
          <p className="is-size-7 has-text-weight-light" style={{ color: "green" }}>
            Disponible
          </p>
        ) : (
          <p className="is-size-7 has-text-weight-light" style={{ color: "red" }}>
            No disponible
          </p>
        )}

        <div className="is-flex align-items-center my-1">
          <button
            className="mt-1 p-1 mr-3 custom-btn is-flex is-align-items-center is-justify-content-center"
            disabled={!disponible}
            onClick={(e) => {
              e.stopPropagation();
              onAddToOrder?.(product);
            }}
            style={{
              opacity: disponible ? 1 : 0.6,
              cursor: disponible ? "pointer" : "not-allowed",
            }}
          >
            <FaCartPlus size={20} />
            <p className="is-size-7">&nbsp;&nbsp;Añadir al pedido</p>
          </button>

          <button
            className="mt-1 p-1 favorite-product-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(product);
            }}
            aria-label="Agregar a favoritos"
          >
            <TiHeartFullOutline size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
