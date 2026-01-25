import { useEffect, useState } from "react";
import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";
import HideShowPassword from "../elements/HideShowPassword";
import { Pencil, Save, Ban } from "lucide-react";
import { getLoggedUserData, updateUserData, type Usuario } from "../../services/user";
import {
    type Address, getUserAddress,
    updateUserAddress
} from "../../services/address";


const EditingButtons = (props: { isEditing: boolean, handleEditing: () => void, handleSave: () => void, handleCancel: () => void }) => {
    if (!props.isEditing) {
        return (
            <div className="mt-5" style={{ width: '100%' }}>
                <button className="mt-1 mx-auto p-1 px-2 custom-btn is-flex is-align-items-center is-justify-content-center"
                    onClick={props.handleEditing}>
                    <Pencil size={22} />
                    <p className='is-size-6 txt-white'>&nbsp;Modificar datos</p>
                </button>
            </div>
        );
    }
    else {
        return (
            <div className="mt-5 is-flex is-justify-content-center" style={{ width: '100%' }}>
                <button type="submit" className="mt-1 mx-3 p-1 px-2 custom-btn is-flex is-align-items-center is-justify-content-center"
                    onClick={props.handleSave}>
                    <Save size={22} />
                    <p className='is-size-6 txt-white'>&nbsp;Guardar datos</p>
                </button>
                <button type="reset" className="mt-1 mx-3 p-1 px-2 custom-btn is-flex is-align-items-center is-justify-content-center"
                    onClick={props.handleCancel}>
                    <Ban size={22} />
                    <p className='is-size-6 txt-white'>&nbsp;Cancelar</p>
                </button>
            </div>
        );
    }
}


const ProfilePage = () => {
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
        } catch (e: any) {
            console.log(e);
            if (e.response?.status === 401) {
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
        } catch (e: any) {
            console.log(e);
        }
    };

    useEffect(() => {
        fetchUserData();

        if (id) {
            fetchAddress();
        }

        if (!isEditing) {
            // Reset password inputs.
            setPassword(null);
            setPrevPassword(null);
            console.log(password)
        }
    }, [id]);


    return (
        <div>
            <title>Mi Perfil | Importaciones Los Bukis</title>
            <NavBar />
            <h1 className='mb-5 has-text-weight-bold is-size-2' style={{ margin: 0, textAlign: 'center' }}>
                Mi Perfil
            </h1>
            <div className="my-6 p-3 pb-5 mx-auto generic-container" style={{ width: '80%' }}>
                <p className="mb-4 is-size-3 has-text-centered has-text-weight-bold" style={{ color: 'black' }}>Datos generales</p>
                <div className="columns">
                    <div className="column">
                        <div>
                            <p className="is-size-5 has-text-weight-bold" style={{ color: 'black' }}>Nombre</p>
                            <input className="input custom-input" type="text" placeholder="Nombre completo." value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={!isEditing} />
                        </div>
                        <div>
                            <p className="is-size-5 mt-3 has-text-weight-bold" style={{ color: 'black' }}>Apellidos</p>
                            <input className="input custom-input" type="text" placeholder="Apellidos completos." value={apellidos} onChange={(e) => setApellidos(e.target.value)} disabled={!isEditing} />
                        </div>
                    </div>
                    <div className="column">
                        <div>
                            <p className="is-size-5 has-text-weight-bold" style={{ color: 'black' }}>Correo electrónico</p>
                            <input className="input custom-input" type="text" placeholder="Ej.: usuario@correo.com" value={correo} disabled={true} />
                        </div>
                        <div>
                            <p className="is-size-5 mt-3 has-text-weight-bold" style={{ color: 'black' }}>Teléfono</p>
                            <input className="input custom-input" type="text" placeholder="Ej: (+00) 000-000-0000" value={telefono} onChange={(e) => setTelefono(e.target.value)} disabled={!isEditing} />
                        </div>
                    </div>
                </div>

                <div>
                    <p className="is-size-5 has-text-weight-bold" style={{ color: 'black' }}>Contraseña</p>
                    <div className="is-flex">
                        <HideShowPassword className="mr-2" passwordVisibilityAction={togglePasswordVisibility}
                            passwordState={passwordVisible} disabled={!isEditing} />
                        <input className="input custom-input" type={passwordVisible} placeholder="Nueva contraseña." value={password || ""} onChange={(e) => setPassword(e.target.value)} disabled={!isEditing} />
                    </div>
                </div>

                <p className="mt-5 mb-4 is-size-3 has-text-centered has-text-weight-bold" style={{ color: 'black' }}>Dirección</p>
                <div className="columns">
                    <div className="column">
                        <div>
                            <p className="is-size-5 has-text-weight-bold" style={{ color: 'black' }}>Calle</p>
                            <input className="input custom-input" type="text" placeholder="Ej.: Nombre de la calle, número exterior." value={calle} onChange={(e) => setCalle(e.target.value)} disabled={!hasAddress || !isEditing} />
                        </div>
                        <div>
                            <p className="is-size-5 mt-3 has-text-weight-bold" style={{ color: 'black' }}>Colonia / Fraccionamiento / Residencial</p>
                            <input className="input custom-input" type="text" placeholder="Nombre de colonia, fraccionamiento o residencial." value={colonia} onChange={(e) => setColonia(e.target.value)} disabled={!hasAddress || !isEditing} />
                        </div>
                        <div>
                            <p className="is-size-5 mt-3 has-text-weight-bold" style={{ color: 'black' }}>Código Postal (C.P.)</p>
                            <input className="input custom-input" type="number" placeholder="Ej.: 0000" value={codigoPostal} onChange={(e) => setCodigoPostal(e.target.value)} disabled={!hasAddress || !isEditing} />
                        </div>
                    </div>
                    <div className="column">
                        <div>
                            <p className="is-size-5 has-text-weight-bold" style={{ color: 'black' }}>Estado</p>
                            <input className="input custom-input" type="text" placeholder="Nombre del estado." value={estado} onChange={(e) => setEstado(e.target.value)} disabled={!hasAddress || !isEditing} />
                        </div>
        
                        <div>
                            <p className="is-size-5 mt-3 has-text-weight-bold" style={{ color: 'black' }}>Ciudad / Municipio</p>
                            <input className="input custom-input" type="text" placeholder="Nombre de la ciudad o municipio." value={ciudad} onChange={(e) => setCiudad(e.target.value)} disabled={!hasAddress || !isEditing} />
                        </div>
                        <div>
                            <p className="is-size-5 mt-3 has-text-weight-bold" style={{ color: 'black' }}>País</p>
                            <input className="input custom-input" type="text" placeholder="Nombre del país." value={pais} onChange={(e) => setPais(e.target.value)} disabled={!hasAddress || !isEditing} />
                        </div>
                    </div>
                </div>
                <EditingButtons isEditing={isEditing} handleEditing={handleEditing} handleCancel={handleCancel} handleSave={handleSave} />
            </div>
            <Footer />
        </div>
    );
}

export default ProfilePage;