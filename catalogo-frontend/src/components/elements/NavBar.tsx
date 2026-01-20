import { IoHome } from "react-icons/io5";
import { TiHeartFullOutline } from "react-icons/ti";
import { FaShoppingCart } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { Link, useLocation } from "react-router-dom";
import logoBukis from "/bukis_logo.png";

const NavBar = () => {
  const { pathname } = useLocation();

  return (
    <nav
      className="navbar mb-5 main-nav"
      style={{ zIndex: 2, position: "sticky" }}
      role="navigation"
      aria-label="main navigation"
    >
      <div className="navbar-brand pl-5">
        <Link className="navbar-item is-flex is-align-items-center main-nav" to="/">
          <img src={logoBukis} alt="logo-los-bukis" style={{ maxHeight: "3rem" }} />
          <p className="subtitle" style={{ color: "white", textAlign: "center", fontSize: "1.1rem" }}>
            Importaciones
            <br />
            Los Bukis
          </p>
        </Link>
      </div>

      <div className="navbar-menu pr-5">
        <div className="navbar-end">
          <Link className="navbar-item main-nav" to="/" style={{ color: "white" }}>
            {pathname === "/" ? (
              <>
                <IoHome size={24} />
                <p className="is-underlined">Inicio</p>
              </>
            ) : (
              <>
                <IoHome size={24} />
                <p>Inicio</p>
              </>
            )}
          </Link>

          <Link className="navbar-item main-nav" to="/favoritos" style={{ color: "white" }}>
            {pathname === "/favoritos" ? (
              <>
                <TiHeartFullOutline size={24} />
                <p className="is-underlined">Favoritos</p>
              </>
            ) : (
              <>
                <TiHeartFullOutline size={24} />
                <p>Favoritos</p>
              </>
            )}
          </Link>

          {/* AQUI EL CAMBIO: antes /pedidos y texto Pedidos */}
          <Link className="navbar-item main-nav" to="/carrito" style={{ color: "white" }}>
            {pathname === "/carrito" ? (
              <>
                <FaShoppingCart size={24} />
                <p className="is-underlined">Carrito</p>
              </>
            ) : (
              <>
                <FaShoppingCart size={24} />
                <p>Carrito</p>
              </>
            )}
          </Link>

          <Link className="navbar-item main-nav" to="/perfil" style={{ color: "white" }}>
            {pathname === "/perfil" ? (
              <>
                <CgProfile size={24} />
                <p className="is-underlined">Mi Perfil</p>
              </>
            ) : (
              <>
                <CgProfile size={24} />
                <p>Mi Perfil</p>
              </>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
