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
            <div className="content has-text-white py-2">
                <div className="columns is-mobile is-centered is-vcentered is-variable is-8 px-6">
                    
                    <div className="column is-narrow ml-6">
                        <p className="has-text-grey-light" style={{ fontSize: '0.90rem' }}>Teléfono:</p>
                        <a style={{ fontSize: '0.90rem' }} href="tel:+526622629875">
                            (+52) 662 262 9875
                        </a>
                    </div>

                    <div className="column is-narrow">
                        <p className="has-text-grey-light" style={{ fontSize: '0.90rem' }}>Encuéntranos en:</p>
                        <p style={{ fontSize: '0.85rem' }}>
                            Blvd. Solidaridad 118 A, Raquet Club II, 83200 Hermosillo, Sonora, México.
                        </p>
                    </div>


                    <div className="column has-text-right pr-6 ">

                        <div className="is-flex is-justify-content-flex-end is-align-items-center ">
                            <p className="mr-3 mb-0 has-text-grey-light" style={{ lineHeight: '1', fontSize: '0.90rem' }}>
                                Redes sociales:
                            </p>
                            <FaFacebook
                                className="social-network-icon"
                                size={32}
                                style={{ marginRight: 10, cursor: 'pointer' }}
                                onClick={() =>
                                    window.open(
                                        'https://www.facebook.com/profile.php?id=100063705263484',
                                        '_blank'
                                    )
                                }
                            />
                            <FaInstagram
                                className="social-network-icon"
                                size={32}
                                style={{ cursor: 'pointer' }}
                                onClick={() =>
                                    window.open(
                                        'https://www.instagram.com/bukisimportaciones/',
                                        '_blank'
                                    )
                                }
                            />
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