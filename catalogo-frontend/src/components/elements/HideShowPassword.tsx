import { Eye, EyeClosed } from "lucide-react";

const HideShowPassword = (props: {className?: string, passwordVisibilityAction: () => void, disabled?: boolean, passwordState?: string}) => {
    return (
        <>
            <button className={`button custom-btn ${props.className}`}
                type="button"
                style={{borderRadius: '10px'}}
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