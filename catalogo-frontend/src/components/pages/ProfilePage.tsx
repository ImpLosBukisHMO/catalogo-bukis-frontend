import { useEffect, useState } from "react";
import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";
import HideShowPassword from "../elements/HideShowPassword";
import { Pencil, Save, Ban, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getLoggedUserData, updateUserData, type Usuario } from "../../services/user";
import {
    type Address, getUserAddress,
    updateUserAddress
} from "../../services/address";


const EditingButtons = (props: { isEditing: boolean, handleEditing: () => void, handleSave: () => void, handleCancel: () => void }) => {
    const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl border border-bukis-red-800 bg-bukis-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-bukis-red-700 focus:outline-none focus:ring-2 focus:ring-bukis-red-600/35";

    if (!props.isEditing) {
        return (
            <div className="mt-6 flex w-full justify-center">
                <button className={buttonClass}
                    onClick={props.handleEditing}>
                    <Pencil size={22} />
                    <span>Modificar datos</span>
                </button>
            </div>
        );
    }
    else {
        return (
            <div className="mt-6 flex w-full flex-wrap justify-center gap-3">
                <button type="submit" className={buttonClass}
                    onClick={props.handleSave}>
                    <Save size={22} />
                    <span>Guardar datos</span>
                </button>
                <button type="reset" className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400/35"
                    onClick={props.handleCancel}>
                    <Ban size={22} />
                    <span>Cancelar</span>
                </button>
            </div>
        );
    }
}


const ProfilePage = () => {
    const navigate = useNavigate();
    // Editing and address states
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [hasAddress, setHasAddress] = useState<boolean>(false);
    const [passwordVisible, setPasswordVisibility] = useState<string>("password");

    // Default values
    const [id, setID] = useState<number | null>(null);
    const [nombre, setNombre] = useState<string | null>(null);
    const [apellidos, setApellidos] = useState<string | null>(null);
    const [correo, setCorreo] = useState<string | null>(null);
    const [telefono, setTelefono] = useState<string | null>(null);
    const [password, setPassword] = useState<string | null>(null);
    const [calle, setCalle] = useState<string | null>(null);
    const [colonia, setColonia] = useState<string | null>(null);
    const [codigoPostal, setCodigoPostal] = useState<number | null>(null);
    const [ciudad, setCiudad] = useState<string | null>(null);
    const [estado, setEstado] = useState<string | null>(null);
    const [pais, setPais] = useState<string | null>(null);

    // Previous values
    const [prevNombre, setPrevNombre] = useState<string | null>(null);
    const [prevApellidos, setPrevApellidos] = useState<string | null>(null);
    const [prevCorreo, setPrevCorreo] = useState<string | null>(null);
    const [prevTelefono, setPrevTelefono] = useState<string | null>(null);
    const [prevPassword, setPrevPassword] = useState<string | null>(null);
    const [prevCalle, setPrevCalle] = useState<string | null>(null);
    const [prevColonia, setPrevColonia] = useState<string | null>(null);
    const [prevCodigoPostal, setPrevCodigoPostal] = useState<number | null>(null);
    const [prevCiudad, setPrevCiudad] = useState<string | null>(null);
    const [prevEstado, setPrevEstado] = useState<string | null>(null);
    const [prevPais, setPrevPais] = useState<string | null>(null);

    // Handle editing.
    const handleEditing = () => {
        setIsEditing(!isEditing);
    }

    // Cancel changes.
    const handleCancel = () => {
        setNombre(prevNombre);
        setApellidos(prevApellidos);
        setCorreo(prevCorreo);
        setTelefono(prevTelefono);
        setPassword(prevPassword);
        setCalle(prevCalle);
        setColonia(prevColonia);
        setCodigoPostal(prevCodigoPostal);
        setCiudad(prevCiudad);
        setEstado(prevEstado);
        setPais(prevPais);
        handleEditing();
    }

    // Save changes.
    const handleSave = async () => {
        setIsEditing(!isEditing);
        setPasswordVisibility("password");

        try {
            const userPayload: Usuario = {
                id: id,
                nombre: nombre,
                apellido: apellidos,
                correo: correo,
                telefono: telefono,
                password: password
            }

            const addressPayload: Address = {
                calle: calle,
                colonia: colonia,
                codigo_postal: codigoPostal,
                ciudad: ciudad,
                estado: estado,
                pais: pais,
                usuario: id
            };

            await updateUserData(userPayload);
            await updateUserAddress(addressPayload);
            setPassword(null);
        } catch (error) {
            console.log("Error al guardar datos.", error)
        }
    }

    const togglePasswordVisibility = () => {
        if (passwordVisible === "password") {
            setPasswordVisibility("text");
        } else {
            setPasswordVisibility("password");
        }
    }

    const inputClass = "w-full rounded-xl border border-neutral-400 bg-white px-3 py-2 text-bukis-ink placeholder:text-neutral-500 outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/25 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-600";
    const labelClass = "mb-2 block text-sm font-semibold text-bukis-ink";

    const fetchUserData = async () => {
        try {
            const userData: Usuario = await getLoggedUserData();

            setID(userData.id);
            setNombre(userData.nombre);
            setApellidos(userData.apellido);
            setCorreo(userData.correo);
            setTelefono(userData.telefono);
            setPrevNombre(userData.nombre);
            setPrevApellidos(userData.apellido);
            setPrevCorreo(userData.correo);
            setPrevTelefono(userData.telefono);
            setPrevPassword(null)
        } catch (e: unknown) {
            console.log(e);
            if ((e as { response?: { status?: number } }).response?.status === 401) {
                window.location.href = "/iniciar-sesion";
            }
        }
    };

    const fetchAddress = async () => {
        try {
            const addressData = await getUserAddress(Number(id));

            if (addressData !== null) {
                setHasAddress(true);
                setCalle(addressData.calle);
                setColonia(addressData.colonia);
                setCodigoPostal(addressData.codigo_postal);
                setCiudad(addressData.ciudad);
                setEstado(addressData.estado);
                setPais(addressData.pais);
                setPrevCalle(addressData.calle);
                setPrevColonia(addressData.colonia);
                setPrevCodigoPostal(addressData.codigo_postal);
                setPrevCiudad(addressData.ciudad);
                setPrevEstado(addressData.estado);
                setPrevPais(addressData.pais);
            }
        } catch (e: unknown) {
            console.log(e);
        }
    };

    useEffect(() => {
        const load = async () => {
            await fetchUserData();
            if (id) await fetchAddress();
            if (!isEditing) {
                // Reset password inputs.
                setPassword(null);
                setPrevPassword(null);
            }
        };
        load();
    }, [id]);


    return (
        <div>
            <title>Mi Perfil | Importaciones Los Bukis</title>
            <NavBar />
            <h1 className='mb-5 text-center text-4xl font-bold text-bukis-ink'>
                Mi Perfil
            </h1>
            <div className="mx-auto my-6 w-[80%] rounded-2xl border border-bukis-border bg-bukis-surface p-5 shadow-bukis-soft">
                <p className="mb-5 text-center text-2xl font-bold text-bukis-ink">Datos generales</p>
                <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>Nombre</label>
                            <input className={inputClass} type="text" placeholder="Nombre completo." value={nombre ?? ''} onChange={(e) => setNombre(e.target.value)} disabled={!isEditing} />
                        </div>
                        <div>
                            <label className={labelClass}>Apellidos</label>
                            <input className={inputClass} type="text" placeholder="Apellidos completos." value={apellidos ?? ''} onChange={(e) => setApellidos(e.target.value)} disabled={!isEditing} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>Correo electrónico</label>
                            <input className={inputClass} type="text" placeholder="Ej.: usuario@correo.com" value={correo ?? ''} disabled={true} />
                        </div>
                        <div>
                            <label className={labelClass}>Teléfono</label>
                            <input className={inputClass} type="text" placeholder="Ej: (+00) 000-000-0000" value={telefono ?? ''} onChange={(e) => setTelefono(e.target.value)} disabled={!isEditing} />
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <label className={labelClass}>Contraseña</label>
                    <div className="flex gap-2">
                        <HideShowPassword passwordVisibilityAction={togglePasswordVisibility}
                            passwordState={passwordVisible} disabled={!isEditing} />
                        <input className={inputClass} type={passwordVisible} placeholder="Nueva contraseña." value={password || ""} onChange={(e) => setPassword(e.target.value)} disabled={!isEditing} />
                    </div>
                </div>

                <p className="mb-5 mt-8 text-center text-2xl font-bold text-bukis-ink">Dirección</p>
                <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>Calle</label>
                            <input className={inputClass} type="text" placeholder="Ej.: Nombre de la calle, número exterior." value={calle ?? ''} onChange={(e) => setCalle(e.target.value)} disabled={!hasAddress || !isEditing} />
                        </div>
                        <div>
                            <label className={labelClass}>Colonia / Fraccionamiento / Residencial</label>
                            <input className={inputClass} type="text" placeholder="Nombre de colonia, fraccionamiento o residencial." value={colonia ?? ''} onChange={(e) => setColonia(e.target.value)} disabled={!hasAddress || !isEditing} />
                        </div>
                        <div>
                            <label className={labelClass}>Código Postal (C.P.)</label>
                            <input className={inputClass} type="number" placeholder="Ej.: 0000" value={codigoPostal ?? ''} onChange={(e) => setCodigoPostal(e.target.value === '' ? null : Number(e.target.value))} disabled={!hasAddress || !isEditing} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>Estado</label>
                            <input className={inputClass} type="text" placeholder="Nombre del estado." value={estado ?? ''} onChange={(e) => setEstado(e.target.value)} disabled={!hasAddress || !isEditing} />
                        </div>
        
                        <div>
                            <label className={labelClass}>Ciudad / Municipio</label>
                            <input className={inputClass} type="text" placeholder="Nombre de la ciudad o municipio." value={ciudad ?? ''} onChange={(e) => setCiudad(e.target.value)} disabled={!hasAddress || !isEditing} />
                        </div>
                        <div>
                            <label className={labelClass}>País</label>
                            <input className={inputClass} type="text" placeholder="Nombre del país." value={pais ?? ''} onChange={(e) => setPais(e.target.value)} disabled={!hasAddress || !isEditing} />
                        </div>
                    </div>
                </div>
                <EditingButtons isEditing={isEditing} handleEditing={handleEditing} handleCancel={handleCancel} handleSave={handleSave} />
            </div>

            <div className="mx-auto mb-6 mt-4 flex w-[80%]">
                <button
                    className="inline-flex items-center gap-2 rounded-xl border border-bukis-red-800 bg-bukis-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-bukis-red-700 focus:outline-none focus:ring-2 focus:ring-bukis-red-600/35"
                    onClick={() => navigate("/pedidos")}
                >
                    <ClipboardList size={22} />
                    <span>Mis Pedidos</span>
                </button>
            </div>

            <Footer />
        </div>
    );
}

export default ProfilePage;
