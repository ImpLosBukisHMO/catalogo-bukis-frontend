import { Eye, EyeClosed } from "lucide-react";

const HideShowPassword = (props: {className?: string, passwordVisibilityAction: () => void, disabled?: boolean, passwordState?: string}) => {
    return (
        <>
            <button className={`inline-flex items-center justify-center rounded-xl border border-bukis-red-800 bg-bukis-red-600 px-3 py-2 text-white transition hover:bg-bukis-red-700 focus:outline-none focus:ring-2 focus:ring-bukis-red-600/35 disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ""}`}
                type="button"
                onClick={props.passwordVisibilityAction} 
                disabled={props.disabled}
                title={props.passwordState === "password"? "Ver contraseña" : "Ocultar contraseña"}
                >
                {props.passwordState === "password" || props.disabled === true ? <Eye size={22} /> : <EyeClosed size={22} />}
            </button>
        </>
    )
}

export default HideShowPassword;
