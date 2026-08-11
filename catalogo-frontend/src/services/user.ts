import API from "../api";
import { login } from "./auth";

/*
Use if needed:

const TOKEN_NAME: string = import.meta.env.VITE_TOKEN_NAME;
const ACCESS_NAME: string = import.meta.env.VITE_ACCESS_NAME;
const REFRESH_NAME: string = import.meta.env.VITE_REFRESH_NAME;
const ME_NAME: string = import.meta.env.VITE_ME_NAME;
*/

// User data. CAUTION: Privacy may be compromised, use carefully.
export type Usuario = {
  id: number | null;
  nombre: string | null;
  apellido: string | null;
  correo: string | null;
  telefono: string | null;
  password: string | null;
}


export async function signUp(data: Usuario) {
  const res = await API.post("/api/signup/", data, {
    headers: { Accept: "application/json" },
  });

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Error al registrar un nuevo usuario (${res.status}).`);
  }

  await login(data.correo || "", data.password || "");
}

export async function getLoggedUserData() {
  const res = await API.get("/api/mi_usuario/", {
    headers: { Accept: "application/json" },
  });

  if (res.status !== 200) {
    throw new Error(`Error al cargar la info del usuario (${res.status}).`);
  }

  return res.data;
}


export async function updateUserData(data: Usuario) {
  if (!data.id) throw new Error("ID de usuario no válido.");

  const payload: Record<string, unknown> = {
    nombre: data.nombre,
    apellido: data.apellido,
    correo: data.correo,
    telefono: data.telefono,
  };

  if (data.password && data.password.trim() !== "") {
    payload.password = data.password;
  }

  try {
    await API.put(`/api/usuarios/${data.id}/`, payload, {
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    throw new Error(`Error al actualizar los datos del usuario.`);
  }
}
