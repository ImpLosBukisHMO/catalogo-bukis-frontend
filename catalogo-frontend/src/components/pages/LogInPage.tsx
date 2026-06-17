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
            navigate(-1);
        } catch {
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
            try { await logIn(correo, password); } catch { /* continuar aunque falle el legacy */ }

            // Detectar si es worker y redirigir
            const me = await getMe();
            if (isWorker(me)) {
                navigate("/worker");
            } else {
                navigate("/");
            }
        } catch {
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
            <main className="mx-auto my-8 w-[85%] max-w-3xl rounded-2xl border border-bukis-border bg-bukis-surface p-6 shadow-bukis-soft sm:p-8">
                            <h1 className="text-center text-3xl font-bold text-bukis-ink">Iniciar Sesión</h1>
                            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-bukis-ink">Correo electrónico</label>
                                        <input
                                            className="w-full rounded-xl border border-neutral-400 bg-white px-3 py-2 text-bukis-ink placeholder:text-neutral-500 outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/25"
                                            type="email"
                                            placeholder="usuario@correo.com"
                                            value={correo}
                                            onChange={(e) => setCorreo(e.target.value)}
                                            required
                                        />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-bukis-ink">Contraseña</label>
                                    <div className="flex gap-2">
                                        <HideShowPassword passwordState={passwordVisible}
                                        passwordVisibilityAction={togglePasswordVisibility}/>
                                        <input
                                            className="w-full rounded-xl border border-neutral-400 bg-white px-3 py-2 text-bukis-ink placeholder:text-neutral-500 outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/25"
                                            type={passwordVisible}
                                            placeholder="Contraseña"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                {error && (
                                    <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 ring-1 ring-red-200">
                                        Error: {error}
                                    </p>
                                )}
                                        <button
                                            className="w-full rounded-xl border border-bukis-red-800 bg-bukis-red-600 px-4 py-3 font-semibold text-white transition hover:bg-bukis-red-700 focus:outline-none focus:ring-2 focus:ring-bukis-red-600/35 disabled:cursor-not-allowed disabled:opacity-60"
                                            type="submit"
                                            disabled={loading}
                                        >
                                            {loading ? "Iniciando sesión…" : "Iniciar Sesión"}
                                        </button>
                            </form>
                            <div className="mt-5 text-center">
                                <a className="font-medium text-bukis-red-700 underline-offset-4 hover:underline" href="/registro">¿No tienes cuenta? Regístrate</a>
                            </div>
            </main>
            <Footer />
        </>
    );
};

export default LogInPage;
