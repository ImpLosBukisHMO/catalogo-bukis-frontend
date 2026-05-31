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
