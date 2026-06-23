import { useContext } from "react";
import { AuthContext } from "./AuthContext";

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (import.meta.env.DEV && !ctx) {
        throw new Error("useAuth must be used inside <AuthProvider>");
    }
    return ctx;
};
