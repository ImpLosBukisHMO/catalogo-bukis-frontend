import { House, Heart, ShoppingCart, UserRound } from "lucide-react";
import logoBukis from '/bukis_logo.png';

/*
TO DO:
- Integrate with backend.
- Add a search bar that redirects to another page dedicated to search 
  products.
*/

const NavBar = () => {
    return (
        <nav className="navbar mb-5 main-nav" style={{ zIndex: 2, position: 'sticky' }} role="navigation" aria-label="main navigation">
            <div className="navbar-brand pl-5">
                <a className="navbar-item is-flex is-align-items-center main-nav" href="/">
                    <img src={logoBukis} alt="logo-los-bukis" style={{ maxHeight: "3rem" }} />
                    <p className="subtitle" style={{ color: "white", textAlign: 'center', fontSize: '1.1rem' }}>Importaciones<br />Los Bukis</p>
                </a>
            </div>
            <div className="navbar-menu pr-5">
                <div className="navbar-end">
                    <a className="navbar-item main-nav" href="/" style={{ color: "white" }}>
                        {
                            window.location.pathname === "/" ? (<><House size={24} /><p className='is-underlined txt-white'>Inicio</p></>) : (<><House size={24} /><p className='txt-white'>Inicio</p></>)
                        }
                    </a>
                    <a className="navbar-item main-nav" href="/favoritos" style={{ color: "white" }}>
                        {
                            window.location.pathname === "/favoritos" ? (<><Heart size={24} /><p className='is-underlined txt-white'>Favoritos</p></>) : (<><Heart size={24} /><p className='txt-white'>Favoritos</p></>)
                        }
                    </a>
                    <a className="navbar-item main-nav" href="/pedidos" style={{ color: "white" }}>
                        {
                            window.location.pathname === "/pedidos" ? (<><ShoppingCart size={24} /><p className='is-underlined txt-white'>Pedidos</p></>) : (<><ShoppingCart size={24} /><p className='txt-white'>Pedidos</p></>)
                        }
                    </a>
                    <a className="navbar-item main-nav" href="/perfil" style={{ color: "white" }}>
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