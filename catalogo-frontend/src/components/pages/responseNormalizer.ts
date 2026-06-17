/**
 * Normaliza las respuestas de la API para asegurar que siempre trabajamos con un array.
 * Soporta estructuras de Django Rest Framework (results), wrappers personalizados (datos)
 * y la respuesta directa de Axios (data).
 */
export const normalizeResponse = (d: unknown): unknown[] => {
  if (!d) return [];
  if (Array.isArray(d)) return d;

  // Si d es el objeto de respuesta de Axios, buscamos en d.data
  const body = (d as Record<string, unknown>)?.data !== undefined && !Array.isArray((d as Record<string, unknown>).data) 
    ? (d as Record<string, unknown>).data : d;

  if (Array.isArray(body)) return body;

  // Busca en las llaves comunes de respuesta de tu backend
  return (body as Record<string, unknown>)?.datos as unknown[] || 
         (body as Record<string, unknown>)?.results as unknown[] || 
         (body as Record<string, unknown>)?.items as unknown[] || 
         [];
};