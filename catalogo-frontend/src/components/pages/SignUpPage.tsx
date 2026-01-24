import { useState } from "react";
import { signUp } from "../../services/user";
import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";

const SignUpPage = () => {
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [correo, setCorreo] = useState('');
    const [telefono, setTelefono] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        try {
            await signUp({ nombre, apellido, correo, telefono, password });
        } catch (e: any) {
            setError('Error al registrar usuario');
        }
    };

    return (
        <>
            <NavBar />
            <div className="mb-5 generic-container container is-max-desktop">
                <div className="section">
                    <div className="columns is-centered">
                        <div className="column is-half">
                            <h1 className="title has-text-centered" style={{color: '#000',}}>
                                Registrarse
                            </h1>
                            <form onSubmit={handleSubmit}>
                                <div className="field">
                                    <label className="label" style={{color: '#000',}}>Nombre</label>
                                    <div className="control">
                                        <input
                                            className="input custom-input"
                                            type="text"
                                            placeholder="Nombre(s) del usuario."
                                            value={nombre}
                                            onChange={(e) => setNombre(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="field">
                                    <label className="label" style={{color: '#000',}}>Apellido</label>
                                    <div className="control">
                                        <input
                                            className="input custom-input"
                                            type="text"
                                            placeholder="Apellido(s) del usuario."
                                            value={apellido}
                                            onChange={(e) => setApellido(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="field">
                                    <label className="label" style={{color: '#000',}}>Correo electrónico</label>
                                    <div className="control">
                                        <input
                                            className="input custom-input"
                                            type="email"
                                            placeholder="Ej.: usuario@correo.com"
                                            value={correo}
                                            onChange={(e) => setCorreo(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="field">
                                    <label className="label" style={{color: '#000',}}>Teléfono</label>
                                    <div className="control">
                                        <input
                                            className="input custom-input"
                                            type="tel"
                                            placeholder="Ej.: (+00) 000-000-0000"
                                            value={telefono}
                                            onChange={(e) => setTelefono(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="field">
                                    <label className="label" style={{color: '#000',}}>Contraseña</label>
                                    <div className="control">
                                        <input
                                            className="input custom-input"
                                            type="password"
                                            placeholder="Ingrese una contraseña."
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="field">
                                    <label className="label" style={{color: '#000',}}>Confirmar Contraseña</label>
                                    <div className="control">
                                        <input
                                            className="input custom-input"
                                            type="password"
                                            placeholder="Confirme su contraseña"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                {error && (
                                    <div className="notification is-danger">
                                        {error}
                                    </div>
                                )}
                                <div className="field">
                                    <div className="control">
                                        <button className="mt-5 button is-primary is-fullwidth custom-btn" type="submit">
                                            Registrarse
                                        </button>
                                    </div>
                                </div>
                            </form>
                            <div className="mt-3 has-text-centered">
                                <a className="custom-link" href="/iniciar-sesion">¿Ya tienes cuenta? Inicia sesión</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer/>
        </>
    );
}

export default SignUpPage;