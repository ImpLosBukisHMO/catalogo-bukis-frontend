import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";
import HideShowPassword from "../elements/HideShowPassword";
import { solicitarRecuperacionPassword, confirmarRecuperacionPassword } from "../../services/auth";
import { useAuth } from "../../context/useAuth";
import { isPasswordValid } from "../../utils/auth";
import { sanitizeEmail, sanitizeNumeric } from "../../utils/sanitizer";

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [error, setError] = useState("");
    
    // Step 1 fields
    const [correo, setCorreo] = useState("");
    
    // Step 2 fields
    const [codigo, setCodigo] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordVisible, setPasswordVisibility] = useState<string>("password");
    const [confirmPasswordVisible, setConfirmPasswordVisibility] = useState<string>("password");

    const { isLoggedIn, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && isLoggedIn) {
            navigate(-1);
        }
    }, [isLoading, isLoggedIn, navigate]);

    const togglePasswordVisibility = () => {
        setPasswordVisibility(prev => prev === "password" ? "text" : "password");
    };

    const toggleConfirmPasswordVisibility = () => {
        setConfirmPasswordVisibility(prev => prev === "password" ? "text" : "password");
    };

    const handleSolicitar = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCorreo = sanitizeEmail(correo);
        if (!cleanCorreo) return;
        
        setStatus("loading");
        setError("");
        
        try {
            await solicitarRecuperacionPassword(cleanCorreo);
            // Siempre avanzamos al paso 2, incluso si el correo no existe, por seguridad
            setStep(2);
            setStatus("idle");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setStatus("error");
            setError(errorMessage || "Error al solicitar la recuperación.");
        }
    };

    const handleConfirmar = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCorreo = sanitizeEmail(correo);
        const cleanCodigo = sanitizeNumeric(codigo);
        
        if (!cleanCorreo || !cleanCodigo || !password) return;
        
        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        if (!isPasswordValid(password)) {
            setError("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.");
            return;
        }

        setStatus("loading");
        setError("");
        
        try {
            await confirmarRecuperacionPassword(cleanCorreo, cleanCodigo, password);
            setStatus("success");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setStatus("error");
            setError(errorMessage || "Error al confirmar la recuperación.");
        }
    };

    return (
        <>
            <NavBar />
            <main className="mx-auto my-8 w-[90%] max-w-lg rounded-2xl border border-bukis-border bg-bukis-surface p-6 shadow-bukis-soft sm:p-8">
                <h1 className="text-center text-3xl font-bold text-bukis-ink mb-6">Recuperar Contraseña</h1>
                
                {status === "success" ? (
                    <div className="rounded-xl bg-green-50 px-4 py-6 text-center border border-green-200">
                        <h2 className="text-xl font-bold text-green-800 mb-2">¡Contraseña Cambiada! 🎉</h2>
                        <p className="text-green-700 mb-6">Tu contraseña ha sido actualizada exitosamente.</p>
                        <button
                            onClick={() => navigate("/iniciar-sesion")}
                            className="inline-block rounded-xl border border-bukis-red-800 bg-bukis-red-600 px-6 py-3 font-semibold text-white transition hover:bg-bukis-red-700"
                        >
                            Iniciar Sesión
                        </button>
                    </div>
                ) : (
                    <div>
                        {step === 1 ? (
                            <>
                                <p className="text-center text-gray-600 mb-6 font-medium">
                                    Ingresa el correo electrónico asociado a tu cuenta para recibir un código de recuperación.
                                </p>
                                <form onSubmit={handleSolicitar} className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-bukis-ink">Correo electrónico</label>
                                        <input
                                            type="email"
                                            value={correo}
                                            onChange={(e) => setCorreo(e.target.value)}
                                            placeholder="usuario@correo.com"
                                            required
                                            className="w-full rounded-xl border border-neutral-400 bg-white px-3 py-2 text-bukis-ink placeholder:text-neutral-500 outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/25"
                                        />
                                    </div>
                                    {error && (
                                        <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 ring-1 ring-red-200">
                                            {error}
                                        </p>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={status === "loading"}
                                        className="w-full rounded-xl border border-bukis-red-800 bg-bukis-red-600 px-4 py-3 font-semibold text-white transition hover:bg-bukis-red-700 focus:outline-none focus:ring-2 focus:ring-bukis-red-600/35 disabled:opacity-60"
                                    >
                                        {status === "loading" ? "Enviando..." : "Solicitar Código"}
                                    </button>
                                </form>
                                <div className="mt-5 text-center text-sm">
                                    <Link to="/iniciar-sesion" className="font-medium text-bukis-red-700 underline-offset-4 hover:underline">
                                        Volver al inicio de sesión
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-center text-gray-600 mb-6 font-medium">
                                    Hemos enviado un código a <span className="font-semibold">{correo}</span>. Ingrésalo junto con tu nueva contraseña.
                                </p>
                                <form onSubmit={handleConfirmar} className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-bukis-ink">Código de 6 dígitos</label>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={codigo}
                                            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                                            placeholder="123456"
                                            required
                                            className="w-full rounded-xl border border-neutral-400 bg-white px-3 py-2 text-center text-3xl font-bold tracking-[0.3em] text-bukis-ink outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/25"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-bukis-ink">Nueva Contraseña</label>
                                        <div className="flex gap-2">
                                            <HideShowPassword passwordState={passwordVisible} passwordVisibilityAction={togglePasswordVisibility}/>
                                            <input
                                                className="w-full rounded-xl border border-neutral-400 bg-white px-3 py-2 text-bukis-ink placeholder:text-neutral-500 outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/25"
                                                type={passwordVisible}
                                                placeholder="Ingrese nueva contraseña"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-bukis-ink">Confirmar Contraseña</label>
                                        <div className="flex gap-2">
                                            <HideShowPassword passwordState={confirmPasswordVisible} passwordVisibilityAction={toggleConfirmPasswordVisibility}/>
                                            <input
                                                className="w-full rounded-xl border border-neutral-400 bg-white px-3 py-2 text-bukis-ink placeholder:text-neutral-500 outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/25"
                                                type={confirmPasswordVisible}
                                                placeholder="Confirme su contraseña"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    {error && (
                                        <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 ring-1 ring-red-200">
                                            {error}
                                        </p>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={status === "loading"}
                                        className="w-full rounded-xl border border-bukis-red-800 bg-bukis-red-600 px-4 py-3 font-semibold text-white transition hover:bg-bukis-red-700 focus:outline-none focus:ring-2 focus:ring-bukis-red-600/35 disabled:opacity-60"
                                    >
                                        {status === "loading" ? "Guardando..." : "Cambiar Contraseña"}
                                    </button>
                                </form>
                                <div className="mt-5 flex flex-col gap-3 text-center text-sm">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="font-medium text-neutral-500 underline-offset-4 hover:underline"
                                    >
                                        ¿No te llegó el código? Cambiar correo
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </main>
            <Footer />
        </>
    );
}
