import { useState } from "react";
import { logIn } from "../../services/user";
import Footer from "../elements/Footer";
import NavBar from "../elements/NavBar";

const LogInPage = () => {
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await logIn(correo, password);
        } catch (e: any) {
            setError('Credenciales inválidas');
        }
    };

    return (
        <>
            <NavBar />
            <div className="my-6 container generic-container" style={{width: '85%',}}>
                <div className="section">
                    <div className="columns is-centered">
                        <div className="column is-half">
                            <h1 className="title has-text-centered" style={{color: '#000'}}>Iniciar Sesión</h1>
                            <form onSubmit={handleSubmit}>
                                <div className="field">
                                    <label className="label" style={{color: '#000'}}>Correo electrónico</label>
                                    <div className="control">
                                        <input
                                            className="input custom-input"
                                            type="email"
                                            placeholder="usuario@correo.com"
                                            value={correo}
                                            onChange={(e) => setCorreo(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="field">
                                    <label className="label" style={{color: '#000'}}>Contraseña</label>
                                    <div className="control">
                                        <input
                                            className="input custom-input"
                                            type="password"
                                            placeholder="Contraseña"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
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
                                        <button className="button custom-btn is-fullwidth" type="submit">
                                            Iniciar Sesión
                                        </button>
                                    </div>
                                </div>
                            </form>
                            <div className="mt-4 has-text-centered">
                                <a className="custom-link" href="/registro">¿No tienes cuenta? Regístrate</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default LogInPage;