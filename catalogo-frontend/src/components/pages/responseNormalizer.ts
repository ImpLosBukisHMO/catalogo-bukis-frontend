/**
 * Normaliza las respuestas de la API para asegurar que siempre trabajamos con un array.
 * Soporta estructuras de Django Rest Framework (results), wrappers personalizados (datos)
 * y la respuesta directa de Axios (data).
 */
export type PagedResponse<T> = {
  items: T[];
  count: number;
  next: string | null;
  previous: string | null;
};

function extractArrayCandidate<T>(d: unknown): T[] {
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

export function normalizeResponse<T>(d: unknown): T[] {
  return extractArrayCandidate<T>(d);
}

export function normalizePagedResponse<T>(d: unknown): PagedResponse<T> {
  const items = extractArrayCandidate<T>(d);

  if (!d || Array.isArray(d) || typeof d !== "object") {
    return {
      items,
      count: items.length,
      next: null,
      previous: null,
    };
  }

  const record = d as Record<string, unknown>;

  return {
    items,
    count: typeof record.count === "number" ? record.count : items.length,
    next: typeof record.next === "string" ? record.next : null,
    previous: typeof record.previous === "string" ? record.previous : null,
  };
}
