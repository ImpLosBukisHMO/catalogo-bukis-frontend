/**
 * Normaliza las respuestas de la API para asegurar que siempre trabajamos con un array.
 * Soporta estructuras de Django Rest Framework (results), wrappers personalizados (datos)
 * y la respuesta directa de Axios (data).
 */
export function normalizeResponse<T>(d: unknown): T[] {
  if (!d) return [];
  if (Array.isArray(d)) return d as T[];

  // Si d es el objeto de respuesta de Axios, buscamos en d.data
  const body = (d as Record<string, unknown>)?.data !== undefined && !Array.isArray((d as Record<string, unknown>).data) 
    ? (d as Record<string, unknown>).data : d;

  if (Array.isArray(body)) return body as T[];

  const potentialArray = (body as Record<string, unknown>)?.datos || 
                         (body as Record<string, unknown>)?.results || 
                         (body as Record<string, unknown>)?.items;

  return Array.isArray(potentialArray) ? (potentialArray as T[]) : [];
}