import { sanitizeEmail, sanitizeInput } from "./sanitizer";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isEmailValid(email: string) {
    const cleanEmail = sanitizeEmail(email);
    return emailRegex.test(cleanEmail);
}

export function isPasswordValid(password: string) {
    // IMPORTANTE: NO sanitizar la contraseña antes de validarla o enviarla,
    // ya que alteraría caracteres legítimos como '<' o '>'.
    return passwordRegex.test(password);
}