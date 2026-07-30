import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { confirmAccount, reenviarConfirmacion } from "../../services/auth";
import { getLoggedUserData } from "../../services/user";
import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";

export default function ConfirmAccountPage() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [correo, setCorreo] = useState("");
    const [codigo, setCodigo] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [openResendLink, setOpenResendLink] = useState(false)
    const [emailResend, setEmailResend] = useState("");
    const [resendStatus, setResendStatus] = useState<{ tipo: "success" | "error"; msg: string; } | null>(null);
    const [loadingResend, setLoadingResend] = useState(false);
    
    const fetchUserData = async () => {
        try {
            await getLoggedUserData();
            history.back(); // Si ya está logueado, regresar
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error("Error: ", errorMessage)
        }
    };

    const toggleResendConfirmation = () => {
        if (openResendLink === true) {
            setOpenResendLink(false);
        }
        else { 
            setOpenResendLink(true);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!correo || !codigo) return;
        setStatus("loading");
        setMensaje("");
        
        try {
            const res = await confirmAccount(correo, codigo);
            setStatus("success");
            setMensaje(res.mensaje);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setStatus("error");
            setMensaje(errorMessage || "Error al confirmar la cuenta.");
            setEmailResend(correo);
        }
    };

    const handleReenviar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailResend) return;
        setLoadingResend(true);
        setResendStatus(null);

        try {
            const res = await reenviarConfirmacion(emailResend)
            setResendStatus({
                tipo: "success",
                msg: res.mensaje
            })
        } catch (e) {
            setResendStatus({
                tipo: "error",
                msg: e instanceof Error ? e.message : "Error desconocido al reenviar la confirmación."
            })
        } finally {
            setLoadingResend(false);
        }
    };

    return (
        <>
            <NavBar />
            <main className="mx-auto my-8 w-[90%] max-w-lg rounded-2xl border border-bukis-border bg-bukis-surface p-6 shadow-bukis-soft sm:p-8">
                <h1 className="text-center text-3xl font-bold text-bukis-ink mb-6">Confirmar Cuenta</h1>
                
                {status === "success" ? (
                    <div className="rounded-xl bg-green-50 px-4 py-6 text-center border border-green-200">
                        <h2 className="text-xl font-bold text-green-800 mb-2">¡Cuenta Confirmada! 🎉</h2>
                        <p className="text-green-700 mb-6">{mensaje}</p>
                        <Link
                            to="/iniciar-sesion"
                            className="inline-block rounded-xl border border-bukis-red-800 bg-bukis-red-600 px-6 py-3 font-semibold text-white transition hover:bg-bukis-red-700"
                        >
                            Iniciar Sesión
                        </Link>
                    </div>
                ) : (
                    <div>
                        <p className="text-center text-gray-600 mb-6 font-medium">
                            Ingresa tu correo y el código de 6 dígitos que te enviamos para activar tu cuenta.
                        </p>
                        
                        <form onSubmit={handleConfirm} className="space-y-4">
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
                            
                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className="w-full rounded-xl border border-bukis-red-800 bg-bukis-red-600 px-4 py-3 font-semibold text-white transition hover:bg-bukis-red-700 focus:outline-none focus:ring-2 focus:ring-bukis-red-600/35 disabled:opacity-60 mt-4"
                            >
                                {status === "loading" ? "Validando..." : "Confirmar Cuenta"}
                            </button>
                        </form>

                        <button
                            onClick={() => toggleResendConfirmation()}
                            className="w-full cursor-pointer text-bukis-red-600 px-4 py-3 font-semibold transition hover:text-bukis-red-700 focus:outline-none mt-4 hover:underline"
                        >
                            ¿Necesitas otro código de confirmación?
                        </button>
                        
                        {(openResendLink == true || status === "error") && (
                            <div className="mt-6 rounded-xl bg-red-50 p-5 border border-red-200 text-center">
                                {status === "error" && (
                                    <>
                                        <h3 className="font-bold text-red-800 mb-2">Error al confirmar ❌</h3>                                
                                        <hr className="my-4 border-red-200" />
                                    </>
                                )}
                                <h4 className="font-semibold text-red-900 mb-2">¿Necesitas un nuevo código?</h4>
                                <form onSubmit={handleReenviar} className="space-y-3">
                                    <input
                                        type="email"
                                        placeholder="Ingresa tu correo"
                                        value={emailResend}
                                        onChange={(e) => setEmailResend(e.target.value)}
                                        required
                                        className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loadingResend}
                                        className="w-full rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold text-white hover:bg-red-900 transition disabled:opacity-60"
                                    >
                                        {loadingResend ? "Enviando..." : "Reenviar código"}
                                    </button>
                                </form>
                                {resendStatus && (
                                    <p className={`mt-3 text-sm font-medium ${resendStatus.tipo === "success" ? "text-green-700" : "text-red-700"}`}>
                                        {resendStatus.msg}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>
            <Footer />
        </>
    );
}