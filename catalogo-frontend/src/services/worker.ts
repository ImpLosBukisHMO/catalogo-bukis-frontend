import type { WorkerVariant } from "../types/worker";
import { getAccessToken, refreshAccessToken } from "./auth";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function requestJSON<T>(url: string): Promise<T> {
  let access = getAccessToken();

  let res = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: access ? `Bearer ${access}` : "",
    },
  });

  // 🔁 Si el access token expiró, intentamos refresh automático
  if (res.status === 401) {
    try {
      access = await refreshAccessToken();
    } catch {
      throw new Error("Sesión expirada. Vuelve a iniciar sesión.");
    }

    // Reintento con nuevo access token
    res = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${access}`,
      },
    });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return res.json();
}

export async function getWorkerVariants(): Promise<WorkerVariant[]> {
  return requestJSON<WorkerVariant[]>(
    `${API_BASE}/api/worker/variants/`
  );
}
