import { createContext } from "react";

export type AuthState = {
    isLoggedIn: boolean;
    isStaff: boolean;
    isLoading: boolean;
    refresh: () => Promise<void>;
    setLoggedOut: () => void;
};

export const AuthContext = createContext<AuthState | undefined>(undefined);
