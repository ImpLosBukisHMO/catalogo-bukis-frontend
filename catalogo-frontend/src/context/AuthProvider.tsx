import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import { getLoggedUserData } from "../services/user";

function readCachedAuth(): { isLoggedIn: boolean; isStaff: boolean } {
    try {
        const raw = localStorage.getItem("me");
        if (!raw) return { isLoggedIn: false, isStaff: false };
        const me = JSON.parse(raw);
        return { isLoggedIn: true, isStaff: Boolean(me.is_staff) };
    } catch {
        return { isLoggedIn: false, isStaff: false };
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const cached = readCachedAuth();
    // Optimismo inicial: si hay cache local, mostrar como logueado mientras verificamos.
    const [isLoggedIn, setIsLoggedIn] = useState(cached.isLoggedIn);
    const [isStaff, setIsStaff] = useState(cached.isStaff);
    // Siempre arrancamos en isLoading=true para verificar la cookie con el backend.
    const [isLoading, setIsLoading] = useState(true);

    const setLoggedOut = () => {
        setIsLoggedIn(false);
        setIsStaff(false);
        localStorage.removeItem("me");
    };

    const fetchAuth = async () => {
        setIsLoading(true);
        try {
            // Siempre consultamos al backend: la autenticación real es via cookie HttpOnly.
            // Si la cookie no existe o expiró, el backend devolverá 401.
            const userData = await getLoggedUserData();
            localStorage.setItem("me", JSON.stringify(userData));
            setIsLoggedIn(true);
            setIsStaff(Boolean(userData.is_staff));
        } catch {
            // Cualquier error (401, red, etc.) = sesión inválida
            setIsLoggedIn(false);
            setIsStaff(false);
            localStorage.removeItem("me");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchAuth(); }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, isStaff, isLoading, refresh: fetchAuth, setLoggedOut }}>
            {children}
        </AuthContext.Provider>
    );
}
