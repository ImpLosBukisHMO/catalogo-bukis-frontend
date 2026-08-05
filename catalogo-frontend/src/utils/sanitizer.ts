/**
 * Utilidades de normalización y sanitización de entradas de usuario.
 *
 * NOTA: React escapa automáticamente todo el contenido que se renderiza a través
 * de JSX, por lo que la sanitización anti-XSS (eliminación de <script>, eventos
 * inline, etc.) es redundante para valores que solo se muestran en el DOM vía JSX.
 *
 * Las funciones de este módulo se enfocan únicamente en:
 *  - Normalización de formatos (correo: minúsculas + sin espacios).
 *  - Restricción de tipo (OTP: solo dígitos).
 *  - Límites razonables de longitud (buscador).
 *
 * Si en el futuro se utiliza `dangerouslySetInnerHTML` o se construye HTML de
 * manera imperativa, se deberá añadir una librería dedicada (ej. DOMPurify)
 * y aplicarla específicamente en ese punto.
 */

/**
 * Normaliza un correo electrónico: elimina espacios y convierte a minúsculas.
 * No aplica sanitización anti-XSS porque React gestiona el escape en el DOM.
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase().replace(/\s+/g, "");
}

/**
 * Normaliza una consulta de búsqueda: colapsa espacios múltiples y la trunca
 * a una longitud máxima razonable para evitar cargas excesivas.
 * No aplica sanitización anti-XSS porque el valor se usa en parámetros de URL,
 * no en HTML sin escape.
 */
export function sanitizeSearchQuery(query: string, maxLength: number = 100): string {
  if (typeof query !== "string") return "";
  return query.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

/**
 * Restringe un valor numérico/OTP para que solo contenga dígitos.
 */
export function sanitizeNumeric(value: string): string {
  if (typeof value !== "string") return "";
  return value.replace(/\D/g, "");
}
