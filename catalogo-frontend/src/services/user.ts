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

  if (res.status > 201) {
    throw new Error(`Error al registrar un nuevo usuario (${res.status}).`);
  }

  return res
}


export async function logIn(correo: string, password: string) {
  const data = {
    correo: correo,
    password: password
  };

  // El backend establece las cookies HttpOnly (access_token, refresh_token).
  // No necesitamos guardar nada en localStorage.
  // La redirección la maneja el componente que llama a esta función.
  await API.post("/api/login/", data, {
    headers: { Accept: "application/json" },
  });
}

export async function logOut(onClearAuth?: () => void) {
  try {
    // Las cookies se envían automáticamente por withCredentials: true.
    await API.post("/api/logout/", {}, {
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    console.error("Error al cerrar sesión en el servidor:", error);
  } finally {
    // Limpiar caché local y estado de auth
    onClearAuth?.();
    localStorage.removeItem("me");
    window.location.href = '/';
  }
}

export async function getLoggedUserData() {
  // Las cookies se envían automáticamente por withCredentials: true.
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
    // Las cookies se envían automáticamente por withCredentials: true.
    await API.put(`/api/usuarios/${data.id}/`, payload, {
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    throw new Error(`Error al actualizar los datos del usuario.`);
  }
}