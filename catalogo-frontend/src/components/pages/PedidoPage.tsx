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
  checkoutCart,
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
        setItems(cart.items);
      })
      .finally(() => setLoading(false));
  }, []);

  

  
  if (loading) {
    return (
      <>
        <NavBar />
        <p className="has-text-centered mt-6">Cargando carrito...</p>
        <Footer />
      </>
    );
  }

  return (
    <>
      <title>Pedido | Importaciones Los Bukis</title>
      <NavBar />

      <div
        className="container is-fluid"
        style={{
          paddingLeft: "clamp(1rem, 3vw, 3rem)",
          paddingRight: "clamp(1rem, 3vw, 3rem)",
          paddingTop: "2rem",
          paddingBottom: "2rem",
        }}
      >
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div className="columns is-variable is-6">
            {/* Columna principal */}
            <div className="column is-8">
              <div className="box">
                {/* Header */}
                <div className="is-flex is-justify-content-space-between is-align-items-center mb-4">
                  <h1 className="title is-4">Productos</h1>
                  <span className="has-text-grey">
                    {totalArticulos} artículos
                  </span>
                </div>

                {/* Lista de productos */}
                <div className="is-flex is-flex-direction-column" style={{ gap: "1rem" }}>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="box"
                      style={{ marginBottom: 0, minHeight: 120 }}
                    >
                      <div className="columns is-mobile is-vcentered">
                        {/* Imagen */}
                        <div className="column is-narrow">
                          <figure className="image is-64x64" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                              src={`${API.defaults.baseURL}${item.imagen}`} 
                              alt={item.nombre}
                              style={{
                                objectFit: "cover",
                                borderRadius: 6,
                              }}
                            />
                          </figure>
                        </div> 

                        {/* Detalles del Producto */}
                        <div className="column is-6">

                          {/* Nombre del producto */}
                          <p className="has-text-weight-semibold">
                            {item.nombre}
                          </p>
                          {/* Variante si aplica */}
                          {item.variante && (
                            <p className="is-size-7 has-text-grey">
                              {item.variante}
                            </p>
                          )}
                          
                          

                          {/* Controles de cantidad */}
                          <div
                            className="is-flex align-items-center"
                            style={{
                              marginTop: "1rem",
                            }}
                          >
                            <div
                              className="is-flex is-align-items-center"
                              style={{
                                border: "3px solid #dbdbdb",
                                borderRadius: "9999px",
                                overflow: "hidden",
                              }}
                            >
                              <button
                                className="button is-small is-white"
                                style={{ border: "none" }}
                                onClick={() => decrementarCantidad(item)}
                              >
                                −
                              </button>

                              <span
                                className="has-text-weight-semibold is-size-7"
                                style={{
                                  minWidth: 24,
                                  textAlign: "center",
                                }}
                              >
                                {item.cantidad}
                              </span>

                              <button
                                className="button is-small is-white"
                                style={{ border: "none" }}
                                onClick={() => incrementarCantidad(item)}
                              >
                                +
                              </button>
                            </div>
                          </div>

                        
                        
                        
                        </div>

                        <div className="column has-text-right">
                          <p className="has-text-weight-semibold">
                            $
                            {(item.precio * item.cantidad).toFixed(2)} MXN
                          </p>
                          <p className="is-size-7 has-text-grey">
                            ${item.precio.toFixed(2)} c/u
                          </p>
                        </div>
                      </div>
                    </div>
                    
                  ))}

                  {items.length === 0 && (
                    <p className="has-text-grey">
                      No hay productos en el pedido.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Columna resumen */}
            <div className="column is-4">
              <div
                className="box"
                style={{
                  position: "sticky",
                  top: "1rem",
                }}
              >
                <h2 className="title is-5 mb-4">Resumen</h2>

                <div className="is-flex is-justify-content-space-between mb-2">
                  <span>Subtotal:</span>
                  <span className="has-text-weight-semibold">
                    ${subtotal.toFixed(2)} MXN
                  </span>
                </div>

                <hr />

                <button className="button is-fullwidth has-text-white" style={{backgroundColor: "#d10000"}}>
                  Continuar pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}