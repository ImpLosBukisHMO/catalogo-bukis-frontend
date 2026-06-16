import axios from 'axios';
import { refreshAccessToken, logout } from '../services/auth';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000",
  withCredentials: true,
});

// Inyecta el JWT access token (nuevo sistema) o el token legacy
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access") ?? localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si recibe 401, intenta refrescar el JWT y reintentar; si falla, cierra sesión
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      // Si el backend dice que el token no es válido (token_not_valid),
      // limpiamos el token y reintentamos sin Authorization para endpoints públicos
      const errorCode = error.response?.data?.code;
      if (errorCode === "token_not_valid") {
        localStorage.removeItem("access");
        localStorage.removeItem("token");
        delete original.headers.Authorization;
        return API(original);
      }

      // Si no es token_not_valid, intentamos refrescar el token
      try {
        const newAccess = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${newAccess}`;
        return API(original);
      } catch {
        logout();
      }
    }
    return Promise.reject(error);
  }
);

export default API;
