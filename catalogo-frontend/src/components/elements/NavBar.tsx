import { useState } from "react";
import { House, Heart, ShoppingCart, UserRound } from "lucide-react";
import logoBukis from '/bukis_logo.png';

/*
TO DO:
- Integrate with backend.
- Add a search bar that redirects to another page dedicated to search 
  products.
- Add log-out when user is authenticated.
*/

const NavBar = () => {
    const [isOpen, setIsOpen] = useState(false)
    const toggleNavMenu = () => setIsOpen(!isOpen)

    return (
        <nav className="navbar mb-5 main-nav" style={{ zIndex: 2, position: 'sticky' }} role="navigation" aria-label="main navigation">
            <div className="navbar-brand">
                <a className="navbar-item is-flex is-align-items-center main-nav" href="/">
                    <img src={logoBukis} alt="logo-los-bukis" style={{ maxHeight: "3rem" }} />
                    <p className="subtitle is-hidden-mobile" style={{ color: "white", textAlign: 'center', fontSize: '1.1rem' }}>Importaciones<br />Los Bukis</p>
                </a>
                <a 
                    role="button"
                    className={`main-nav navbar-burger ${isOpen ? 'is-active' : ''}`}
                    style={{color: '#fff'}}
                    aria-label="menu"
                    aria-expanded="false" 
                    onClick={toggleNavMenu}>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                </a>
            </div>
            <div id="navbar-menu" className={`navbar-menu ${isOpen ? 'is-active' : ''}`} style={{backgroundColor:'#dd0000'}}>
                <div className="navbar-start">
                    <div className="navbar-item" style={{backgroundColor:'#dd0000'}}>
                        <input className="input custom-input" type="text" placeholder="Busque un producto" />
                    </div>
                </div>
                <div className="navbar-end">
                    <a className="navbar-item main-nav is-flex is-justify-content-center" href="/" style={{ color: "white" }}>
                        {
                            window.location.pathname === "/" ? (<><House size={24} /><p className='is-underlined txt-white'>Inicio</p></>) : (<><House size={24} /><p className='txt-white'>Inicio</p></>)
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
                            window.location.pathname === "/perfil" ? (<><UserRound size={24} /><p className='is-underlined txt-white'>Mi Perfil</p></>) : (<><UserRound size={24} /><p className='txt-white'>Mi Perfil</p></>)
                        }
                    </a>
                </div>
            </div>
        </nav>
    )
}

export default NavBar;