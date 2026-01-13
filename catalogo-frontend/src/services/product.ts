const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function getProducts() {
  const url = `${API_BASE}/api/productos/`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error al cargar productos (${res.status}). ${text}`);
  }

  return res.json();
}

export async function getProductById(id: string | number) {
  const url = `${API_BASE}/api/productos/${id}/`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error al cargar producto (${res.status}). ${text}`);
  }

  return res.json();
}
