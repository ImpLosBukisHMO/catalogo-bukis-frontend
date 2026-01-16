import axios from "axios";
import API from "../api";

export async function getProducts() {
  const res = await API.get("/api/productos/", {
    headers: { Accept: "application/json" },
  });

  if (res.status !== 200) {
    throw new Error(`Error al cargar productos (${res.status}).`);
  }

  console.log("Respuesta de productos:", res.data);
  return res.data;
}

export async function getProductById(id: string | number) {
  const res = await API.get(`/api/productos/${id}/`, {
    headers: { Accept: "application/json" },
  });

  if (res.status !== 200) {
    throw new Error(`Error al cargar producto (${res.status}).`);
  }

  return res.data;
}
