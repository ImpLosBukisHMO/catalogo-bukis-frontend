import API from "../api";

export type Address = {
  calle: string | null;
  colonia: string | null;
  codigo_postal: number | null;
  ciudad: string | null;
  estado: string | null;
  pais: string | null;
  usuario: number | null;
};

export async function createUserAddress(data: Address) {
  await API.post("/api/direcciones/", data, {
    headers: { Accept: "application/json" },
  });
}

export async function getUserAddress(id: number) {
  try {
    const res = await API.get(`/api/direcciones/usuario/${id}/`, {
      headers: { Accept: "application/json" },
    });
    return res.data.datos[0];
  } catch (error: unknown) {
    // Si el error es 404, retornamos null para que updateUserAddress sepa que debe crearla
    if ((error as { response?: { status?: number } }).response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function updateUserAddress(data: Address) {
  try {
    const detectedAddress = await getUserAddress(Number(data.usuario));

    // Address found.
    if (detectedAddress) {
      await API.put(`/api/direcciones/${detectedAddress.id}/`, data, {
        headers: { Accept: "application/json" },
      });
    }
    
    // Address not found.
    else {
      await createUserAddress(data);
    }
  } catch (error) {
    console.log(error);
  }
}
