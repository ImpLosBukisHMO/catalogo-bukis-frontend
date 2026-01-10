import { FaFacebook } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";

/*
TO DO:
- Change the 1st. division design to a more compact one (feel free to
  implement your design ideas).
*/

const Footer = (props: { style?: React.CSSProperties }) => {
    return (
        <footer className="pt-3 main-footer" style={props.style}>
            {/* 1st. division */}
            <div className="content has-text-centered has-text-white">
                <div className='is-flex-start'>
                    <div className=''>
                        <p className='mt-5'>Teléfono: (+52) 662 262 9875</p>
                    </div>
                    <div>
                        <p className='mt-5'>Encuéntranos en:</p>
                        <p style={{ fontSize: '0.85rem' }}>Blvd. Solidaridad 118 A, Raquet Club II, 83200 Hermosillo, Sonora, México.</p>
                    </div>
                    <div>
                        <p className='mt-5'>Visita nuestras redes sociales:</p>
                        <div className='is-flex align-items-center is-justify-content-center'>
                            <FaFacebook className="social-network-icon" size={36} style={{ marginRight: 12, cursor: 'pointer' }} onClick={() => window.open('https://www.facebook.com/profile.php?id=100063705263484', '_blank')} />
                            <FaInstagram className="social-network-icon" size={36} style={{ marginLeft: 12, cursor: 'pointer' }} onClick={() => window.open('https://www.instagram.com/bukisimportaciones/', '_blank')} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2nd. division */}
            <div className='py-3 is-flex align-items-center is-justify-content-center main-footer-2' style={{width:'100%'}}>
                <p>
                    Copyright &copy; {new Date().getFullYear()} Importaciones Los Bukis. Todos los derechos reservados.
                </p>
            </div>
        </footer>
    )
}

export default Footer;