import { IoHome } from "react-icons/io5";
import { TiHeartFullOutline } from "react-icons/ti";
import { FaShoppingCart } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
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
                            window.location.pathname === "/" ? (<><IoHome size={24} /><p className='is-underlined'>Inicio</p></>) : (<><IoHome size={24} /><p>Inicio</p></>)
                        }
                    </a>
                    <a className="navbar-item main-nav" href="/favoritos" style={{ color: "white" }}>
                        {
                            window.location.pathname === "/favoritos" ? (<><TiHeartFullOutline size={24} /><p className='is-underlined'>Favoritos</p></>) : (<><TiHeartFullOutline size={24} /><p>Favoritos</p></>)
                        }
                    </a>
                    <a className="navbar-item main-nav" href="/pedidos" style={{ color: "white" }}>
                        {
                            window.location.pathname === "/pedidos" ? (<><FaShoppingCart size={24} /><p className='is-underlined'>Pedidos</p></>) : (<><FaShoppingCart size={24} /><p>Pedidos</p></>)
                        }
                    </a>
                    <a className="navbar-item main-nav" href="/perfil" style={{ color: "white" }}>
                        {
                            window.location.pathname === "/perfil" ? (<><CgProfile size={24} /><p className='is-underlined'>Mi Perfil</p></>) : (<><CgProfile size={24} /><p> Mi Perfil</p></>)
                        }
                    </a>
                </div>
            </div>
        </nav>
    )
}

export default NavBar;