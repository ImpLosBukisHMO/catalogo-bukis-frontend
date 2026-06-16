import { useState, useEffect } from "react";
import { signUp } from "../../services/user";
import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";
import { getLoggedUserData } from "../../services/user";
import HideShowPassword from "../elements/HideShowPassword";

const SignUpPage = () => {
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
            history.back();                // User already logged in (valid token).
        } catch (e: unknown) {
            if ((e as { response?: { status?: number } }).response?.status === 401) {
                console.log("Es necesario registrarse o iniciar sesión.")
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        try {
            await signUp({ id: null, nombre, apellido, correo, telefono, password });
        } catch {
            setError('Error al registrar usuario');
        }
    };

    const togglePasswordVisibility = () => {
        if (passwordVisible === "password") {
            setPasswordVisibility("text");
        } else {
            setPasswordVisibility("password");
        }    
    }

    const toggleConfirmPasswordVisibility = () => {
        if (confirmPasswordVisible === "password") {
            setConfirmPasswordVisibility("text");
        } else {
            setConfirmPasswordVisibility("password");
        }
    }

    useEffect(() => {
        fetchUserData();
    }, []);

    return (
        <>
            <NavBar />
            <main className="mx-auto mb-8 max-w-3xl rounded-2xl border border-bukis-border bg-bukis-surface p-6 shadow-bukis-soft sm:p-8">
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
                                            onChange={(e) => setCorreo(e.target.value)}
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
                                        <HideShowPassword passwordState={passwordVisible} 
                                            passwordVisibilityAction={togglePasswordVisibility}/>
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
                                        <HideShowPassword passwordState={confirmPasswordVisible}
                                            passwordVisibilityAction={toggleConfirmPasswordVisibility}/>
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
                                        <button className="w-full rounded-xl border border-bukis-red-800 bg-bukis-red-600 px-4 py-3 font-semibold text-white transition hover:bg-bukis-red-700 focus:outline-none focus:ring-2 focus:ring-bukis-red-600/35" type="submit">
                                            Registrarse
                                        </button>
                            </form>
                            <div className="mt-5 text-center">
                                <a className="font-medium text-bukis-red-700 underline-offset-4 hover:underline" href="/iniciar-sesion">¿Ya tienes cuenta? Inicia sesión</a>
                            </div>
            </main>
            <Footer />
        </>
    );
}

export default SignUpPage;
