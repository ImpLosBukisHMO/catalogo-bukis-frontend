import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../elements/Footer";
import NavBar from "../elements/NavBar";
import HideShowPassword from "../elements/HideShowPassword";
import { logIn } from "../../services/user";
import { login, getMe, isWorker, reenviarConfirmacion } from "../../services/auth";
import { useAuth } from "../../context/useAuth";

import { sanitizeEmail } from "../../utils/sanitizer";
import { isEmailValid } from "../../utils/auth";

const LogInPage = () => {
    const navigate = useNavigate();
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisibility] = useState<string>("password");
    const [showResend, setShowResend] = useState(false);
    const [resendStatus, setResendStatus] = useState("");

    const auth = useAuth();
    const { isLoggedIn, isLoading } = auth;

    // Si ya tiene sesión activa, redirigir
    useEffect(() => {
        if (!isLoading && isLoggedIn) {
            navigate(-1);
        }
    }, [isLoading, isLoggedIn, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setShowResend(false)
        setResendStatus("")

        if (!isEmailValid(correo)) {
            setError("El correo electrónico no tiene un formato válido.");
            setLoading(false);
            return;
        }

        try {
            const cleanCorreo = sanitizeEmail(correo);
            // Login con JWT (access + refresh) para los servicios nuevos
            await login(cleanCorreo, password);
            // También hacer login con el sistema legacy para compatibilidad con axios/user.ts
            try { await logIn(cleanCorreo, password); } catch { /* continuar aunque falle el legacy */ }

            // Detectar si es worker y redirigir
            const me = await getMe();

            // Actualizar el AuthProvider para que NavBar y páginas protegidas
            // detecten la sesión inmediatamente.
            await auth.refresh();

            navigate(isWorker(me) ? "/worker" : "/");
        } catch(err: unknown) {
            const status = (err as { status?: number }).status;
            const errorMessage = err instanceof Error ? err.message : String(err);

            if (status === 429) {
                // Rate limiter: demasiados intentos
                setError(errorMessage);
            } else if (errorMessage.toLowerCase().includes("confirm")) {
                setError('Tu cuenta aún no ha sido activada.');
                setShowResend(true);
            } else if (errorMessage && !errorMessage.includes("No active account")) {
                setError(errorMessage);
            } else {
                setError('Credenciales inválidas. Verifica tu correo y contraseña.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReenviar = async () => {
        setResendStatus("Enviando...");
        try {
            const cleanCorreo = sanitizeEmail(correo);
            const res = await reenviarConfirmacion(cleanCorreo);
            setResendStatus(`✅ ${res.mensaje}`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setResendStatus(`❌ Error: ${errorMessage}`);
        }
    }

    const togglePasswordVisibility = () => {
        setPasswordVisibility(prev => prev === "password" ? "text" : "password");
    };

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
                                    <div className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 ring-1 ring-red-200">
                                        <p>Error: {error}</p>
                                        
                                        {showResend && (
                                            <div className="mt-3">
                                                <button 
                                                    type="button" 
                                                    onClick={handleReenviar}
                                                    className="underline hover:text-red-900 font-semibold"
                                                >
                                                    Haz clic aquí para reenviar el correo de confirmación
                                                </button>
                                                {resendStatus && <p className="mt-1 text-xs">{resendStatus}</p>}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <button
                                    className="w-full rounded-xl border border-bukis-red-800 bg-bukis-red-600 px-4 py-3 font-semibold text-white transition hover:bg-bukis-red-700 focus:outline-none focus:ring-2 focus:ring-bukis-red-600/35 disabled:cursor-not-allowed disabled:opacity-60"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? "Iniciando sesión…" : "Iniciar Sesión"}
                                </button>
                            </form>
                            <div className="mt-5 flex flex-col gap-3 text-center text-sm">
                                <a className="font-medium text-bukis-red-700 underline-offset-4 hover:underline" href="/registro">¿No tienes cuenta? Regístrate</a>
                                <a className="font-medium text-neutral-500 underline-offset-4 hover:underline" href="/recuperar-password">¿Olvidaste tu contraseña?</a>
                            </div>
            </main>
            <Footer />
        </>
    );
};

export default LogInPage;
