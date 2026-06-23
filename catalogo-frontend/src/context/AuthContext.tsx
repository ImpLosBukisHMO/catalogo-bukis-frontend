import { createContext } from "react";

export type AuthState = {
    isLoggedIn: boolean;
    isStaff: boolean;
    isLoading: boolean;
    refresh: () => Promise<void>;
    setLoggedOut: () => void;
};

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthState>({
    isLoggedIn: false,
    isStaff: false,
    isLoading: true,
    refresh: async () => {},
    setLoggedOut: () => {},

});
