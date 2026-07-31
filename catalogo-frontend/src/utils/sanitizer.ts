/**
 * Sanitizador de entradas de usuario para el frontend.
 * Proporciona funciones para limpiar entradas contra XSS, inyecciones de script,
 * caracteres nulos y normalización de textos antes de enviar a la API o procesar.
 */

/**
 * Sanitiza una cadena de texto eliminando etiquetas HTML, scripts,
 * instrucciones javascript: y caracteres nulos/control.
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";

  return input
    // Eliminar caracteres nulos
    .replace(/\0/g, "")
    // Eliminar etiquetas <script> y su contenido de forma case-insensitive
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Eliminar atributos de evento en línea (ej: onload=, onerror=, onclick=)
    .replace(/on\w+\s*=\s*(['"]?)(?:(?!\1).)*\1/gi, "")
    // Eliminar esquemas de URL peligrosos (javascript:, data:text/html)
    .replace(/javascript\s*:/gi, "")
    .replace(/data\s*:\s*text\/html/gi, "")
    // Convertir corchetes de etiquetas HTML restantes a entidades de texto
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();
}

/**
 * Sanitiza un correo electrónico: remueve espacios, convierte a minúsculas
 * y elimina caracteres peligrosos o secuencias de inyección.
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== "string") return "";

  const clean = sanitizeInput(email)
    .toLowerCase()
    .replace(/\s+/g, ""); // Los correos no deben contener espacios

  return clean;
}

/**
 * Sanitiza una consulta de búsqueda removiendo scripts y limitando
 * la longitud para evitar cargas excesivas o abusos.
 */
export function sanitizeSearchQuery(query: string, maxLength: number = 100): string {
  if (typeof query !== "string") return "";

  const clean = sanitizeInput(query)
    // Reemplazar múltiples espacios consecutivos por uno solo
    .replace(/\s+/g, " ");

  return clean.slice(0, maxLength);
}

/**
 * Sanitiza un valor numérico/OTP asegurando que solo contenga dígitos.
 */
export function sanitizeNumeric(value: string): string {
  if (typeof value !== "string") return "";

  return value.replace(/\D/g, "");
}
