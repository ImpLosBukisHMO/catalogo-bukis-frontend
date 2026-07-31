import { useState, useEffect } from "react";
import { signUp } from "../../services/user";
import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";
import { getLoggedUserData } from "../../services/user";
import HideShowPassword from "../elements/HideShowPassword";
import { Link } from "react-router-dom";

import { sanitizeInput, sanitizeEmail } from "../../utils/sanitizer";
import { isEmailValid, isPasswordValid } from "../../utils/auth";

const SignUpPage = () => {
    // Messages.
    const [successfulRegistration, setSuccessfulRegistration] = useState(false);

    // Password visibility.
    const [passwordVisible, setPasswordVisibility] = useState("password");
    const [confirmPasswordVisible, setConfirmPasswordVisibility] = useState("password");

    // New user data.
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [correo, setCorreo] = useState('');
    const [telefono, setTelefono] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const fetchUserData = async () => {
        try {
            await getLoggedUserData();
            history.back();             // User already logged in (valid token).
        } catch (e: unknown) {
            if ((e as { response?: { status?: number } }).response?.status === 401) {
                console.log("Es necesario registrarse o iniciar sesión.");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEmailValid(correo)) {
            setError("El correo electrónico no tiene un formato válido.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        if (!isPasswordValid(password)) {
            setError("La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).");
            return;
        }

        setError("");
        try {
            const cleanNombre = sanitizeInput(nombre);
            const cleanApellido = sanitizeInput(apellido);
            const cleanCorreo = sanitizeEmail(correo);
            const cleanTelefono = sanitizeInput(telefono);
            const res = await signUp({
                id: null,
                nombre: cleanNombre,
                apellido: cleanApellido,
                correo: cleanCorreo,
                telefono: cleanTelefono,
                password
            });
            if (res.status < 400) setSuccessfulRegistration(true);
        } catch {
            setError("Error al registrar usuario. Es posible que dicho usuario ya esté registrado.");
        }
    };

    const togglePasswordVisibility = () => {
        setPasswordVisibility(passwordVisible === "password" ? "text" : "password");
    };

    const toggleConfirmPasswordVisibility = () => {
        setConfirmPasswordVisibility(confirmPasswordVisible === "password" ? "text" : "password");
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    return (
        <>
            <NavBar />
            <main className="mx-auto mb-8 max-w-3xl rounded-2xl border border-bukis-border bg-bukis-surface p-6 shadow-bukis-soft sm:p-8">
                {successfulRegistration ? (
                    <div className="py-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
                            📧
                        </div>
                        <h1 className="text-2xl font-bold text-bukis-ink">
                            ¡Registro casi completado!
                        </h1>
                        <p className="mt-3 text-neutral-600">
                            Hemos enviado un enlace de confirmación a{" "}
                            <span className="font-semibold text-bukis-ink">{correo}</span>.
                        </p>
                        <p className="mt-2 text-sm text-neutral-500">
                            Por favor revisa tu bandeja de entrada (y la carpeta de spam) para activar tu cuenta antes de iniciar sesión.
                        </p>
                        <div className="mt-6">
                            <Link
                                to="/confirmar-cuenta"
                                state={{ email: correo }}
                                className="inline-block rounded-xl border border-bukis-red-800 bg-bukis-red-600 px-6 py-3 font-semibold text-white transition hover:bg-bukis-red-700"
                            >
                                Ingresar código de confirmación
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <h1 className="text-center text-3xl font-bold text-bukis-ink">
                            Registrarse
                        </h1>
                        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-bukis-ink">Nombre</label>
                                <input
                                    className="w-full rounded-xl border border-neutral-400 bg-white px-3 py-2 text-bukis-ink placeholder:text-neutral-500 outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/25"
                                    type="text"
                                    placeholder="Nombre(s) del usuario."
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-bukis-ink">Apellido</label>
                                <input
                                    className="w-full rounded-xl border border-neutral-400 bg-white px-3 py-2 text-bukis-ink placeholder:text-neutral-500 outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/25"
                                    type="text"
                                    placeholder="Apellido(s) del usuario."
                                    value={apellido}
                                    onChange={(e) => setApellido(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-bukis-ink">Correo electrónico</label>
                                <input
                                    className="w-full rounded-xl border border-neutral-400 bg-white px-3 py-2 text-bukis-ink placeholder:text-neutral-500 outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/25"
                                    type="email"
                                    placeholder="Ej.: usuario@correo.com"
                                    value={correo}
                                    onChange={(e) => setCorreo(sanitizeEmail(e.target.value))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-bukis-ink">Teléfono</label>
                                <input
                                    className="w-full rounded-xl border border-neutral-400 bg-white px-3 py-2 text-bukis-ink placeholder:text-neutral-500 outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/25"
                                    type="tel"
                                    placeholder="Ej.: (+00) 000-000-0000"
                                    value={telefono}
                                    onChange={(e) => setTelefono(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-bukis-ink">Contraseña</label>
                                <div className="flex gap-2">
                                    <HideShowPassword passwordState={passwordVisible} passwordVisibilityAction={togglePasswordVisibility}/>
                                    <input
                                        className="w-full rounded-xl border border-neutral-400 bg-white px-3 py-2 text-bukis-ink placeholder:text-neutral-500 outline-none transition focus:border-bukis-red-600 focus:ring-2 focus:ring-bukis-red-600/25"
                                        type={passwordVisible}
                                        placeholder="Ingrese una contraseña."
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
                                    Error: {error}
                                </p>
                            )}
                            <button type="submit" className="w-full rounded-xl border border-bukis-red-800 bg-bukis-red-600 px-4 py-3 font-semibold text-white transition hover:bg-bukis-red-700 focus:outline-none focus:ring-2 focus:ring-bukis-red-600/35">
                                Registrarse
                            </button>
                        </form>
                        <div className="mt-5 flex flex-col gap-3 text-center text-sm">
                            <Link to="/iniciar-sesion" className="font-medium text-bukis-red-700 underline-offset-4 hover:underline">
                                ¿Ya tienes cuenta? Inicia sesión
                            </Link>
                            <Link to="/confirmar-cuenta" className="font-medium text-neutral-500 underline-offset-4 hover:underline">
                                ¿Tienes un código de confirmación pendiente?
                            </Link>
                        </div>
                    </>
                )}
            </main>
            <Footer />
        </>
    );
};

export default SignUpPage;
