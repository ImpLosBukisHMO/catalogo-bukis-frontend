import API from "../api";

export type Address = {
  calle: string | null;
  colonia: string | null;
  codigo_postal: number | null;
  ciudad: string | null;
  estado: string | null;
  pais: string | null;
  usuario: number | null;
}

export async function createUserAddress(data: Address) {
  await API.post("/api/direcciones/", data, {
    headers: { Accept: "application/json" },
  }); 
}

export async function getUserAddress(id: number) {
  const res = await API.get(`/api/direcciones/usuario/${id}/`, {
    headers: { Accept: "application/json" },
  });

  if (res.status !== 200) {
    return null;
  }

  return res.data.datos[0];
}

export async function updateUserAddress(data: Address) {
  const detectedAddress = await getUserAddress(data.usuario);

  // Address found.
  if (detectedAddress.status == 200) {
    const addressData = detectedAddress.data.datos[0];
    await API.put(`/api/direcciones/${addressData.id}/`, data, {
      headers: { Accept: "application/json" },
    });
  }

  // Address not found.
  else if (detectedAddress.status == 404){
    await createUserAddress(data);
  }
}