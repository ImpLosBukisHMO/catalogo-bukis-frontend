/**
 * Normaliza las respuestas de la API para asegurar que siempre trabajamos con un array.
 * Soporta estructuras de Django Rest Framework (results), wrappers personalizados (datos)
 * y la respuesta directa de Axios (data).
 */
export function normalizeResponse<T>(d: unknown): T[] {
  if (!d) return [];
  if (Array.isArray(d)) return d as T[];
  if (typeof d !== "object") return [];

  const record = d as Record<string, unknown>;
  const candidates = [record.data, record.results, record.datos, record.items];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as T[];
  }

  if (record.data && typeof record.data === "object") {
    const nestedRecord = record.data as Record<string, unknown>;
    const nestedCandidates = [nestedRecord.data, nestedRecord.results, nestedRecord.datos, nestedRecord.items];

    for (const candidate of nestedCandidates) {
      if (Array.isArray(candidate)) return candidate as T[];
    }
  }

  return [];
}
