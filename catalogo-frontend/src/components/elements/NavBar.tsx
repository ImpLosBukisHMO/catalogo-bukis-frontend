import { useEffect, useState } from "react";
import { House, Heart, ShoppingCart, UserRound, Search, Box } from "lucide-react";
import logoBukis from '/bukis_logo.png';
import { getLoggedUserData } from "../../services/user";

/*
TO DO:
- Integrate with backend.
- Add a search bar that redirects to another page dedicated to search 
  products.
- Add log-out when user is authenticated.
*/

type NavBarProps = {
    navBarQuery?: string | null;
}

const NavBar = ({navBarQuery}: NavBarProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const toggleNavMenu = () => setIsOpen(!isOpen);

    const handleQuery = (e: Event) => {
        e.preventDefault();
        
        if (searchQuery.length > 0) { 
            window.location.href = `/productos?query=${searchQuery}`
        } else {
            window.location.href = "/productos";
        }
    }

    const fetchUserData = async () => {
        try {
            await getLoggedUserData();
            setIsLoggedIn(true);
        } catch (e: any) {
            if (e.response?.status === 401) {
                console.log("Es necesario registrarse o iniciar sesión.")
            }
        }
    };

    useEffect(() => { (async () => await fetchUserData())(); }, []);

    return (
        <nav className="navbar mb-5 main-nav" style={{ zIndex: 2, position: 'sticky' }} role="navigation" aria-label="main navigation">
            <div className="navbar-brand">
                <a className="navbar-item is-flex is-align-items-center main-nav" href="/">
                    <img src={logoBukis} alt="logo-los-bukis" style={{ maxHeight: "3rem" }} />
                    <p className="subtitle" style={{ color: "white", textAlign: 'center', fontSize: '1.1rem' }}>Importaciones<br />Los Bukis</p>
                </a>
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
                    <div className="is-flex is-align-items-center"
                        style={{ backgroundColor: '#dd0000' }}>
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
                    <a className="navbar-item main-nav is-flex is-justify-content-center" href="/" style={{ color: "white" }}>
                        {
                            window.location.pathname === "/" ? (<><House size={24} /><p className='is-underlined txt-white'>Inicio</p></>) : (<><House size={24} /><p className='txt-white'>Inicio</p></>)
                        }
                    </a>
                    <a className="navbar-item main-nav is-flex is-justify-content-center" href="/productos" style={{ color: "white" }}>
                        {
                            window.location.pathname === "/productos" ? (<><Box size={24} /><p className='is-underlined txt-white'>Productos</p></>) : (<><Box size={24} /><p className='txt-white'>Productos</p></>)
                        }
                    </a>
                    <a className="navbar-item main-nav is-flex is-justify-content-center" href="/favoritos" style={{ color: "white" }}>
                        {
                            window.location.pathname === "/favoritos" ? (<><Heart size={24} /><p className='is-underlined txt-white'>Favoritos</p></>) : (<><Heart size={24} /><p className='txt-white'>Favoritos</p></>)
                        }
                    </a>
                    <a className="navbar-item main-nav is-flex is-justify-content-center" href="/pedidos" style={{ color: "white" }}>
                        {
                            window.location.pathname === "/pedidos" ? (<><ShoppingCart size={24} /><p className='is-underlined txt-white'>Carrito</p></>) : (<><ShoppingCart size={24} /><p className='txt-white'>Carrito</p></>)
                        }
                    </a>
                    <a className="navbar-item main-nav is-flex is-justify-content-center" href="/perfil" style={{ color: "white" }}>
                        {
                            window.location.pathname === "/perfil" ? (<><UserRound size={24} /><p className='is-underlined txt-white'>{isLoggedIn ? "Mi Perfil" : "Iniciar Sesión"}</p></>) : (<><UserRound size={24} /><p className='txt-white'>{isLoggedIn ? "Mi Perfil" : "Iniciar Sesión"}</p></>)
                        }
                    </a>
                </div>
            </div>
        </nav>
    )
}

export default NavBar;