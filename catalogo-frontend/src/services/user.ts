import API from "../api";

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

  if (res.status !== 200) {
    throw new Error(`Error al registrar un nuevo usuario (${res.status}).`);
  }

  await logIn(data.correo || "", data.password || "")
}


export async function logIn(correo: string, password: string) {
  // Remove token (especially if it's already expired).
  localStorage.removeItem("token");

  const data = {
    correo: correo,
    password: password
  };

  const res = await API.post("/api/login/", data, {
    headers: { Accept: "application/json" },
  });

  // Successful log-in.
  if (res.data && res.data.token) {
    localStorage.setItem("token", res.data.token);
    window.location.href = '/';
  } else {
    throw new Error(`Error al iniciar sesión: no se recibió el token del servidor.`);
  }
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

  const payload: any = {
    nombre: data.nombre,
    apellido: data.apellido,
    correo: data.correo,
    telefono: data.telefono,
  };

  if (data.password && data.password.trim() !== "") {
    payload.password = data.password;
  }

  const token = localStorage.getItem("token");

  try {
    await API.put(`/api/usuarios/${data.id}/`, payload, {
      headers: { 
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    throw new Error(`Error al actualizar los datos del usuario.`);
  }
}