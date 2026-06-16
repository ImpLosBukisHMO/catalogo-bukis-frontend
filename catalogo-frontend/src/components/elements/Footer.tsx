import { Facebook, Instagram, MapPin, Phone } from 'lucide-react';

const Footer = (props: { style?: React.CSSProperties }) => {
    return (
        <footer className="border-t border-neutral-800 bg-neutral-950 text-white" style={props.style}>
            <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 text-sm sm:grid-cols-3 sm:items-center">
                    <div className="flex items-start gap-3">
                        <Phone className="mt-1 h-5 w-5 text-bukis-red-100" aria-hidden="true" />
                        <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Teléfono</p>
                        <a className="text-white transition hover:text-bukis-red-100 hover:underline" href="tel:+526622629875">
                            (+52) 662 262 9875
                        </a>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <MapPin className="mt-1 h-5 w-5 shrink-0 text-bukis-red-100" aria-hidden="true" />
                        <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Encuéntranos en</p>
                        <p className="leading-relaxed text-neutral-100">
                            Blvd. Solidaridad 118 A, Raquet Club II, 83200 Hermosillo, Sonora, México.
                        </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:justify-end">
                            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                                Redes sociales
                            </p>
                            <Facebook
                                className="h-9 w-9 cursor-pointer rounded-full p-2 text-white transition hover:bg-white/10 hover:text-bukis-red-100 focus:outline-none focus:ring-2 focus:ring-white/40"
                                size={32}
                                onClick={() =>
                                    window.open(
                                        'https://www.facebook.com/profile.php?id=100063705263484',
                                        '_blank'
                                    )
                                }
                            />
                            <Instagram
                                className="h-9 w-9 cursor-pointer rounded-full p-2 text-white transition hover:bg-white/10 hover:text-bukis-red-100 focus:outline-none focus:ring-2 focus:ring-white/40"
                                size={32}
                                onClick={() =>
                                    window.open(
                                        'https://www.instagram.com/bukisimportaciones/',
                                        '_blank'
                                    )
                                }
                            />
                    </div>
            </div> 

            <div className='flex w-full items-center justify-center border-t border-neutral-900 bg-black px-6 py-3 text-center text-xs text-neutral-300'>
                <p>
                    Copyright &copy; {new Date().getFullYear()} Importaciones Los Bukis. Todos los derechos reservados.
                </p>
            </div>
        </footer>
    )
}

export default Footer;
