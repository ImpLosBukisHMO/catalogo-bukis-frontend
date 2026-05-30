import { useEffect, useState } from "react";
import { Briefcase, House, Heart, ShoppingCart, UserRound, Search, Box } from "lucide-react";
import { DoorOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import logoBukis from '/bukis_logo.png';
import { getLoggedUserData, logOut } from "../../services/user";

type NavBarProps = {
    navBarQuery?: string | null;
}

const NavBar = ({navBarQuery}: NavBarProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isStaff, setIsStaff] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { pathname } = useLocation();
    const toggleNavMenu = () => setIsOpen(!isOpen);
    const iconSize = 22;

    const handleQuery = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.length > 0) {
            window.location.href = `/productos?query=${searchQuery}`;
        } else {
            window.location.href = "/productos";
        }
    };

    const fetchUserData = async () => {
        try {
            const userData = await getLoggedUserData();
            setIsLoggedIn(true);
            setIsStaff(Boolean(userData.is_staff));
        } catch (e: any) {
            if (e.response?.status === 401) {
                console.log("Es necesario registrarse o iniciar sesión.");
            }
        }
    };

    useEffect(() => { (async () => await fetchUserData())(); }, []);

    return (
        <nav className="navbar mb-5 main-nav" style={{ zIndex: 2, position: 'sticky' }} role="navigation" aria-label="main navigation">
            <div className="navbar-brand">
                <Link className="navbar-item is-flex is-align-items-center main-nav" to="/">
                    <img src={logoBukis} alt="logo-los-bukis" style={{ maxHeight: "3rem" }} />
                    <p className="subtitle" style={{ color: "white", textAlign: 'center', fontSize: '1.1rem' }}>Importaciones<br />Los Bukis</p>
                </Link>
                <a
                    role="button"
                    className={`main-nav navbar-burger ${isOpen ? 'is-active' : ''}`}
                    style={{ color: '#fff' }}
                    aria-label="menu"
                    aria-expanded="false"
                    onClick={toggleNavMenu}>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                </a>
            </div>
            <div id="navbar-menu" className={`navbar-menu ${isOpen ? 'is-active' : ''}`} style={{ backgroundColor: '#dd0000' }}>
                <div className="navbar-start">
                    <div className="is-flex is-align-items-center" style={{ backgroundColor: '#dd0000' }}>
                        <div className="icon-container icon-container-search ml-5">
                            <Search size={28} />
                        </div>
                        <form className="mr-5" onSubmit={handleQuery} style={{width: '100%'}}>
                            <input className="input custom-input custom-input-search mr-5"
                                style={{ width: '100%' }}
                                type="text"
                                placeholder="Busque un producto"
                                defaultValue={navBarQuery || searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)} />
                        </form>
                    </div>
                </div>
                <div className="navbar-end">
                    <Link className="navbar-item main-nav is-flex is-justify-content-center" to="/" style={{ color: "white" }}>
                        <House size={iconSize} />
                        <p className={pathname === "/" ? "is-underlined txt-white" : "txt-white"}>Inicio</p>
                    </Link>
                    <Link className="navbar-item main-nav is-flex is-justify-content-center" to="/productos" style={{ color: "white" }}>
                        <Box size={iconSize} />
                        <p className={pathname === "/productos" ? "is-underlined txt-white" : "txt-white"}>Productos</p>
                    </Link>
                    <Link className="navbar-item main-nav is-flex is-justify-content-center" to="/favoritos" style={{ color: "white" }}>
                        <Heart size={iconSize} />
                        <p className={pathname === "/favoritos" ? "is-underlined txt-white" : "txt-white"}>Favoritos</p>
                    </Link>
                    <Link className="navbar-item main-nav is-flex is-justify-content-center" to="/carrito" style={{ color: "white" }}>
                        <ShoppingCart size={iconSize} />
                        <p className={pathname === "/carrito" ? "is-underlined txt-white" : "txt-white"}>Carrito</p>
                    </Link>
                    <Link className="navbar-item main-nav is-flex is-justify-content-center" to="/perfil" style={{ color: "white" }}>
                        <UserRound size={iconSize} />
                        <p className={pathname === "/perfil" ? "is-underlined txt-white" : "txt-white"}>
                            {isLoggedIn ? "Mi Perfil" : "Iniciar Sesión"}
                        </p>
                    </Link>
                    {isLoggedIn && isStaff && (
                        <Link className="navbar-item main-nav is-flex is-justify-content-center" to="/worker" style={{ color: "white" }}>
                            <Briefcase size={iconSize} />
                            <p className={pathname.startsWith("/worker") ? "is-underlined txt-white" : "txt-white"}>Panel de Trabajo</p>
                        </Link>
                    )}
                    {isLoggedIn && (
                        <a className="navbar-item main-nav is-flex is-justify-content-center" onClick={async () => await logOut()} style={{ color: "white", cursor: 'pointer' }}>
                            <DoorOpen size={iconSize} />
                            <p className='txt-white'>Cerrar Sesión</p>
                        </a>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
