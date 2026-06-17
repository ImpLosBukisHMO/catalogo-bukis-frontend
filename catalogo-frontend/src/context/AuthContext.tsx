import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getLoggedUserData } from "../services/user";

type AuthState = {
    isLoggedIn: boolean;
    isStaff: boolean;
    isLoading: boolean;
    refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
    isLoggedIn: false,
    isStaff: false,
    isLoading: true,
    refresh: async () => {},
});

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

    const [isLoggedIn, setIsLoggedIn] = useState(cached.isLoggedIn);
    const [isStaff, setIsStaff] = useState(cached.isStaff);
    const [isLoading, setIsLoading] = useState(!cached.isLoggedIn); // skip loading if we have cache

    const fetchAuth = async () => {
        try {
            const userData = await getLoggedUserData();
            localStorage.setItem("me", JSON.stringify(userData)); // keep cache fresh
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
        <AuthContext.Provider value={{ isLoggedIn, isStaff, isLoading, refresh: fetchAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);