import { useState } from "react";
import { Briefcase, House, Heart, ShoppingCart, UserRound, Search, Box, Menu, X } from "lucide-react";
import { DoorOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import logoBukis from '/bukis_logo.png';
import { logOut } from "../../services/user";
import { useAuth } from "../../context/useAuth";

type NavBarProps = {
    navBarQuery?: string | null;
}

const NavBar = ({navBarQuery}: NavBarProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const { isLoggedIn, isStaff, setLoggedOut } = useAuth();
    // TODO: use isLoading to show a skeleton/placeholder while auth state is being validated
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

    const linkClass = (isActive: boolean) =>
        `inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white/95 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/45 ${isActive ? "bg-white/15 underline underline-offset-4" : ""}`;

    return (
        <nav className="sticky top-0 z-20 mb-5 border-b border-red-950/20 bg-bukis-red-600 shadow-bukis-soft" role="navigation" aria-label="main navigation">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 lg:flex-nowrap lg:px-6">
                <Link className="flex shrink-0 items-center gap-3 rounded-xl px-2 py-1 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/45" to="/">
                    <img src={logoBukis} alt="logo-los-bukis" className="h-12 w-auto" />
                    <p className="text-center text-base font-semibold leading-tight text-white">Importaciones<br />Los Bukis</p>
                </Link>

                <button
                    type="button"
                    className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-xl text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/45 lg:hidden"
                    aria-label="menu"
                    aria-expanded={isOpen}
                    onClick={toggleNavMenu}>
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <div id="navbar-menu" className={`${isOpen ? "flex" : "hidden"} w-full flex-col gap-3 lg:flex lg:w-auto lg:flex-1 lg:flex-row lg:items-center lg:justify-between`}>
                    <form className="flex w-full min-w-0 items-center lg:max-w-sm xl:max-w-md" onSubmit={handleQuery}>
                        <div className="flex h-11 items-center rounded-l-xl border border-white/25 bg-white/15 px-3 text-white">
                            <Search size={22} />
                        </div>
                        <input className="h-11 min-w-0 flex-1 rounded-r-xl border border-l-0 border-white/25 bg-white px-3 text-sm text-bukis-ink placeholder:text-neutral-500 outline-none transition focus:border-white focus:ring-2 focus:ring-white/40"
                                type="text"
                                placeholder="Busque un producto"
                                defaultValue={navBarQuery || searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)} />
                    </form>

                    <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-end">
                    <Link className={linkClass(pathname === "/")} to="/">
                        <House size={iconSize} />
                        <span>Inicio</span>
                    </Link>
                    <Link className={linkClass(pathname === "/productos")} to="/productos">
                        <Box size={iconSize} />
                        <span>Productos</span>
                    </Link>
                    <Link className={linkClass(pathname === "/favoritos")} to="/favoritos">
                        <Heart size={iconSize} />
                        <span>Favoritos</span>
                    </Link>
                    <Link className={linkClass(pathname === "/carrito")} to="/carrito">
                        <ShoppingCart size={iconSize} />
                        <span>Carrito</span>
                    </Link>
                    <Link className={linkClass(pathname === "/perfil")} to="/perfil">
                        <UserRound size={iconSize} />
                        <span>
                            {isLoggedIn ? "Mi Perfil" : "Iniciar Sesión"}
                        </span>
                    </Link>
                    {isLoggedIn && isStaff && (
                        <Link className={linkClass(pathname.startsWith("/worker"))} to="/worker">
                            <Briefcase size={iconSize} />
                            <span>Panel de Trabajo</span>
                        </Link>
                    )}
                    {isLoggedIn && (
                        <button 
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white/95 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/45" 
                        onClick={async () => { setLoggedOut(); await logOut(); }} 
                        type="button">
                            <DoorOpen size={iconSize} />
                            <span>Cerrar Sesión</span>
                        </button>
                    )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
