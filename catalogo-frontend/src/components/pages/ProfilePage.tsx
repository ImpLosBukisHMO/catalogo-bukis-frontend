import { useState } from "react";
import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";
import { RiPencilFill } from "react-icons/ri";
import { FaRegSave } from "react-icons/fa";
import { GiCancel } from "react-icons/gi";


/*
TO DO:
- Integrate with backend.
- Manage changes when saving or cancelling edits.
*/

const EditingButtons = (props:{isEditing: boolean, handleEditing: () => void}) => {
    if (props.isEditing == false) {
        return (
            <div className="mt-5" style={{ width: '100%' }}>
                <button className="mt-1 mx-auto p-1 px-2 custom-btn is-flex is-align-items-center is-justify-content-center"
                    onClick={props.handleEditing}>
                    <RiPencilFill size={22} />
                    <p className='is-size-5'>&nbsp;Modificar datos</p>
                </button>
            </div>
        );
    }
    else {
        return (
            <div className="mt-5 is-flex is-justify-content-center" style={{ width: '100%' }}>
                <button className="mt-1 mx-3 p-1 px-2 custom-btn is-flex is-align-items-center is-justify-content-center"
                    onClick={props.handleEditing}>
                    <FaRegSave size={22} />
                    <p className='is-size-5'>&nbsp;Guardar datos</p>
                </button>
                <button className="mt-1 mx-3 p-1 px-2 custom-btn is-flex is-align-items-center is-justify-content-center"
                    onClick={props.handleEditing}>
                    <GiCancel size={22} />
                    <p className='is-size-5'>&nbsp;Cancelar</p>
                </button>
            </div>
        );
    }
}

const ProfilePage = () => {
    const [isEditing, setIsEditing] = useState(false);

    const handleEditing = () => {
        setIsEditing(!isEditing);
    }

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
                            <input className="input custom-input" type="text" placeholder="Nombre completo." disabled={!isEditing} />
                        </div>
                        <div>
                            <p className="is-size-5 mt-3 has-text-weight-bold" style={{ color: 'black' }}>Correo electrónico</p>
                            <input className="input custom-input" type="text" placeholder="Ej.: usuario@correo.com" disabled={true} />
                        </div>
                    </div>
                    <div className="column">
                        <div>
                            <p className="is-size-5 has-text-weight-bold" style={{ color: 'black' }}>Apellidos</p>
                            <input className="input custom-input" type="text" placeholder="Apellidos completos." disabled={!isEditing} />
                        </div>
                        <div>
                            <p className="is-size-5 mt-3 has-text-weight-bold" style={{ color: 'black' }}>Teléfono</p>
                            <input className="input custom-input" type="text" placeholder="Ej: (+00) 000-000-0000" disabled={!isEditing} />
                        </div>
                    </div>
                </div>

                <p className="mt-5 mb-4 is-size-3 has-text-centered has-text-weight-bold" style={{ color: 'black' }}>Dirección</p>
                <div className="columns">
                    <div className="column">
                        <div>
                            <p className="is-size-5 has-text-weight-bold" style={{ color: 'black' }}>Calle</p>
                            <input className="input custom-input" type="text" placeholder="Ej.: Nombre de la calle, número exterior de la casa." disabled={!isEditing} />
                        </div>
                        <div>
                            <p className="is-size-5 mt-3 has-text-weight-bold" style={{ color: 'black' }}>Código Postal (C.P.)</p>
                            <input className="input custom-input" type="number" placeholder="Ej.: 0000" disabled={!isEditing} />
                        </div>
                        <div>
                            <p className="is-size-5 mt-3 has-text-weight-bold" style={{ color: 'black' }}>Estado</p>
                            <input className="input custom-input" type="text" placeholder="Nombre del estado." disabled={!isEditing} />
                        </div>
                    </div>
                    <div className="column">
                        <div>
                            <p className="is-size-5 has-text-weight-bold" style={{ color: 'black' }}>Colonia / Fraccionamiento / Residencial</p>
                            <input className="input custom-input" type="text" placeholder="Nombre de colonia, fraccionamiento o residencial." disabled={!isEditing} />
                        </div>
                        <div>
                            <p className="is-size-5 mt-3 has-text-weight-bold" style={{ color: 'black' }}>Ciudad / Municipio</p>
                            <input className="input custom-input" type="text" placeholder="Nombre de la ciudad o municipio." disabled={!isEditing} />
                        </div>
                        <div>
                            <p className="is-size-5 mt-3 has-text-weight-bold" style={{ color: 'black' }}>País</p>
                            <input className="input custom-input" type="text" placeholder="Nombre del país." disabled={!isEditing} />
                        </div>
                    </div>
                </div>
                <EditingButtons isEditing={isEditing} handleEditing={handleEditing} />
            </div>
            <Footer />
        </div>
    );
}

export default ProfilePage;