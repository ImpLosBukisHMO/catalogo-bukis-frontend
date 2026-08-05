import axios from 'axios';
import { refreshAccessToken } from '../services/auth';
import { BACKEND_BASE_URL } from '../utils/backend';

const API = axios.create({
  baseURL: BACKEND_BASE_URL,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

// Ya no necesitamos interceptor de request para inyectar token, las cookies viajan solas

// Si recibe 401, intenta refrescar la sesión (HttpOnly cookies) y reintentar.
// NO llama logout() al fallar — deja que el caller (AuthProvider, etc.) maneje el estado.
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Excluir endpoints de auth del retry para evitar loops
    const url = original?.url ?? '';
    const isAuthEndpoint = url.includes('/auth/') || url.includes('/logout');

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;

      // Intentamos refrescar el token vía endpoint (usa la cookie refresh_token)
      try {
        await refreshAccessToken();
        // Si tiene éxito, la cookie access_token se ha renovado. Reintentamos.
        return API(original);
      } catch {
        // El refresh falló (token expirado o usuario anónimo).
        // NO hacer logout con redirect — dejar que el caller maneje el error.
        // AuthProvider se encargará de marcar isLoggedIn = false.
      }
    }
    return Promise.reject(error);
  }
);

export default API;
