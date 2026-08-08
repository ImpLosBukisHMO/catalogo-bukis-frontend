import { sanitizeEmail } from "./sanitizer";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isEmailValid(email: string) {
    const cleanEmail = sanitizeEmail(email);
    return emailRegex.test(cleanEmail);
}

/**
 * Validación mínima de contraseña en el frontend: solo longitud >= 8 caracteres.
 * La complejidad real (mayúsculas, números, símbolos) es responsabilidad del backend
 * (ComplexPasswordValidator). El frontend debe capturar y mostrar los DRFValidationError
 * que devuelva el backend si no se cumplen los criterios de complejidad.
 *
 * IMPORTANTE: NO sanitizar la contraseña antes de validarla o enviarla,
 * ya que alteraría caracteres legítimos como '<' o '>'.
 */
export function isPasswordValid(password: string): boolean {
    return password.length >= 8;
}