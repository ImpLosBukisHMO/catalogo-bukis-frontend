import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import { getLoggedUserData } from "../services/user";

function readCachedAuth(): { isLoggedIn: boolean; isStaff: boolean } {
    try {
        const raw = localStorage.getItem("me");
        const token = localStorage.getItem("access") ?? localStorage.getItem("token");
        if (!raw || !token) return { isLoggedIn: false, isStaff: false };
        const me = JSON.parse(raw);
        return { isLoggedIn: true, isStaff: Boolean(me.is_staff) };
    } catch {
        return { isLoggedIn: false, isStaff: false };
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const cached = readCachedAuth();
    const [isLoggedIn, setIsLoggedIn] = useState(cached.isLoggedIn);
    const [isStaff, setIsStaff] = useState(cached.isStaff);
    const [isLoading, setIsLoading] = useState(!cached.isLoggedIn);
    const setLoggedOut = () => {
        setIsLoggedIn(false);
        setIsStaff(false);
        localStorage.removeItem("me");
        localStorage.removeItem("token");
        localStorage.removeItem("access");
    };

    const fetchAuth = async () => {
        try {
            const userData = await getLoggedUserData();
            localStorage.setItem("me", JSON.stringify(userData));
            setIsLoggedIn(true);
            setIsStaff(Boolean(userData.is_staff));
        } catch (e: unknown) {
            if ((e as { response?: { status?: number } }).response?.status === 401) {
                setIsLoggedIn(false);
                setIsStaff(false);
                localStorage.removeItem("me");
            }
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
