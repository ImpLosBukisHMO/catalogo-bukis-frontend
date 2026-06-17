/**
 * Normaliza las respuestas de la API para asegurar que siempre trabajamos con un array.
 * Soporta estructuras de Django Rest Framework (results), wrappers personalizados (datos)
 * y la respuesta directa de Axios (data).
 */
export const normalizeResponse = (d: any): any[] => {
  if (!d) return [];
  if (Array.isArray(d)) return d;

  // Si d es el objeto de respuesta de Axios, buscamos en d.data
  const body = d?.data !== undefined && !Array.isArray(d.data) ? d.data : d;

  if (Array.isArray(body)) return body;

  // Busca en las llaves comunes de respuesta de tu backend
  return body?.datos || body?.results || body?.items || [];
};