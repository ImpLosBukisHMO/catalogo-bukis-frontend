import API from "../api";

type SignUpData = {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  password: string;
};


export async function signUp(data: SignUpData) {
  const res = await API.post("/api/signup/", data, {
    headers: { Accept: "application/json" },
  });

  if (res.status !== 200) {
    throw new Error(`Error al registrar un nuevo usuario (${res.status}).`);
  }

  await logIn(data.correo, data.password)
}

export async function logIn(correo: string, password: string) {
  // Limpiamos cualquier token previo para evitar errores 401 por tokens expirados
  localStorage.removeItem("token");

  const data = {
    correo: correo,
    password: password
  };

  const res = await API.post("/api/login/", data, {
    headers: { Accept: "application/json" },
  });

  // Axios se encarga de lanzar un error para respuestas no-2xx.
  // Si llegamos aquí, la respuesta es exitosa (ej. status 200).
  if (res.data && res.data.token) {
    localStorage.setItem("token", res.data.token);
    setTimeout(()=>{
      window.location.href = '/';
    }, 2000)
  } else {
    console.error("Inicio de sesión exitoso pero no se recibió token.", res.data);
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