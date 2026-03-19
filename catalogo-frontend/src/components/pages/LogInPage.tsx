import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../elements/Footer";
import NavBar from "../elements/NavBar";
import HideShowPassword from "../elements/HideShowPassword";
import { logIn, getLoggedUserData } from "../../services/user";
import { login, getMe, isWorker } from "../../services/auth";

const LogInPage = () => {
    const navigate = useNavigate();
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisibility] = useState<string>("password");

    // Si ya tiene sesión activa, redirigir
    const checkSession = async () => {
        try {
            await getLoggedUserData();
            navigate(-1 as any);
        } catch (e: any) {
            // No hay sesión, mostrar formulario
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Login con JWT (access + refresh) para los servicios nuevos
            await login(correo, password);
            // También hacer login con el sistema legacy para compatibilidad con axios/user.ts
            try { await logIn(correo, password); } catch (_) { /* continuar aunque falle el legacy */ }

            // Detectar si es worker y redirigir
            const me = await getMe();
            if (isWorker(me)) {
                navigate("/worker");
            } else {
                navigate("/");
            }
        } catch (err: any) {
            setError('Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setPasswordVisibility(prev => prev === "password" ? "text" : "password");
    };

    useEffect(() => {
        checkSession();
    }, []);

    return (
        <>
            <NavBar />
            <div className="my-6 container generic-container" style={{width: '85%'}}>
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
                                    <div className="control is-flex">
                                        <HideShowPassword passwordState={passwordVisible} className="mr-2"
                                        passwordVisibilityAction={togglePasswordVisibility}/>
                                        <input
                                            className="input custom-input"
                                            type={passwordVisible}
                                            placeholder="Contraseña"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                {error && (
                                    <p className="mt-5 has-text-centered" style={{color: "#dc0000"}}>
                                        Error: {error}
                                    </p>
                                )}
                                <div className="field">
                                    <div className="mt-5">
                                        <button
                                            className="button custom-btn is-fullwidth"
                                            type="submit"
                                            disabled={loading}
                                        >
                                            {loading ? "Iniciando sesión…" : "Iniciar Sesión"}
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
};

export default LogInPage;
