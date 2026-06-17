//import { useMemo, useState } from "react";
import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";
import API from "../../api";

import { useEffect, useMemo, useState } from "react";
import type { CartItemVM } from "../../types/cart";
import {
  getCarritoActual as getCart,
  updateItemCantidad as updateItem,
  deleteItem as removeItem,
} from "../../services/carrito";



export default function PedidoPage() {


  
  const [items, setItems] = useState<CartItemVM[]>([]);
  const [loading, setLoading] = useState(true);

  const totalArticulos = useMemo(
    () => items.reduce((acc, i) => acc + i.cantidad, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((acc, i) => acc + i.precio * i.cantidad, 0),
    [items]
  );


  const incrementarCantidad = async (item: CartItemVM) => {
    await updateItem(item.id, item.cantidad + 1);
    setItems(prev =>
      prev.map(i =>
        i.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i
      )
    );
  };

  const decrementarCantidad = async (item: CartItemVM) => {
    if (item.cantidad === 1) {
      await removeItem(item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      return;
    }

    await updateItem(item.id, item.cantidad - 1);
    setItems(prev =>
      prev.map(i =>
        i.id === item.id ? { ...i, cantidad: i.cantidad - 1 } : i
      )
    );
  };    

  useEffect(() => {
    getCart()
      .then(cart => {
        setItems(cart.items.map(item => ({
          id: item.id,
          variante: item.color_nombre ?? null,
          nombre: item.producto_nombre,
          precio: Number(item.precio_unitario),
          cantidad: item.cantidad,
          imagen: item.imagen ?? '',
        })));
      })
      .finally(() => setLoading(false));
  }, []);

  

  

  if (loading) {
    return (
      <>
        <NavBar />
        <p className="mt-12 text-center text-neutral-600">Cargando carrito...</p>
        <Footer />
      </>
    );
  }

  return (
    <>
      <title>Pedido | Importaciones Los Bukis</title>
      <NavBar />

      <div className="px-4 py-8 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            {/* Columna principal */}
            <div className="rounded-2xl border border-bukis-border bg-white p-6 shadow-bukis-soft">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-bold text-bukis-ink">Productos</h1>
                <span className="text-neutral-500">
                  {totalArticulos} artículos
                </span>
              </div>

              {/* Lista de productos */}
              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="min-h-[120px] rounded-xl border border-bukis-border bg-white p-4 shadow-bukis-soft"
                  >
                    <div className="flex items-start gap-4 sm:items-center">
                      {/* Imagen */}
                      <figure className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
                        <img
                          src={`${API.defaults.baseURL}${item.imagen}`} 
                          alt={item.nombre}
                          className="h-full w-full object-cover"
                        />
                      </figure>

                      {/* Detalles del Producto */}
                      <div className="flex-1">
                        <p className="font-semibold text-bukis-ink">
                          {item.nombre}
                        </p>
                        {item.variante && (
                          <p className="text-xs text-neutral-500">
                            {item.variante}
                          </p>
                        )}

                        {/* Controles de cantidad */}
                        <div className="mt-4 flex">
                          <div className="inline-flex items-center overflow-hidden rounded-full border-[3px] border-neutral-300">
                            <button
                              className="inline-flex items-center justify-center px-3 py-1 text-sm text-bukis-ink transition hover:bg-neutral-100"
                              onClick={() => decrementarCantidad(item)}
                            >
                              −
                            </button>

                            <span className="min-w-[24px] text-center text-xs font-semibold">
                              {item.cantidad}
                            </span>

                            <button
                              className="inline-flex items-center justify-center px-3 py-1 text-sm text-bukis-ink transition hover:bg-neutral-100"
                              onClick={() => incrementarCantidad(item)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="font-semibold text-bukis-ink">
                          $
                          {(item.precio * item.cantidad).toFixed(2)} MXN
                        </p>
                        <p className="text-xs text-neutral-500">
                          ${item.precio.toFixed(2)} c/u
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <p className="text-neutral-500">
                    No hay productos en el pedido.
                  </p>
                )}
              </div>
            </div>

            {/* Columna resumen */}
            <div className="sticky top-4 rounded-2xl border border-bukis-border bg-white p-6 shadow-bukis-soft">
              <h2 className="mb-4 text-lg font-bold text-bukis-ink">Resumen</h2>

              <div className="mb-2 flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">
                  ${subtotal.toFixed(2)} MXN
                </span>
              </div>

              <hr className="my-4 border-bukis-border" />

              <button className="w-full rounded-xl bg-bukis-red-700 px-4 py-3 font-semibold text-white transition hover:bg-bukis-red-800">
                Continuar pedido
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
