import { MapPin, Phone } from 'lucide-react';

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
                            <svg className="h-9 w-9 cursor-pointer rounded-full p-1 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                                fill='#ffffff' xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 50 50"
                                onClick={() =>
                                    window.open(
                                        'https://www.facebook.com/profile.php?id=100063705263484',
                                        '_blank',
                                        'noopener,noreferrer'
                                    )}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        window.open(
                                            'https://www.facebook.com/profile.php?id=100063705263484',
                                            '_blank',
                                            'noopener,noreferrer'
                                        )
                                    }
                                }}
                            >
                                <path d="M25,3C12.85,3,3,12.85,3,25c0,11.03,8.125,20.137,18.712,21.728V30.831h-5.443v-5.783h5.443v-3.848 c0-6.371,3.104-9.168,8.399-9.168c2.536,0,3.877,0.188,4.512,0.274v5.048h-3.612c-2.248,0-3.033,2.131-3.033,4.533v3.161h6.588 l-0.894,5.783h-5.694v15.944C38.716,45.318,47,36.137,47,25C47,12.85,37.15,3,25,3z"></path>
                            </svg>
                            <svg className="h-9 w-9 cursor-pointer rounded-full p-1 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                                fill="#ffffff" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 50 50"
                                onClick={() =>
                                    window.open(
                                        'https://www.instagram.com/bukisimportaciones/',
                                        '_blank',
                                        'noopener,noreferrer'
                                    )
                                }
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        window.open(
                                            'https://www.instagram.com/bukisimportaciones/',
                                            '_blank',
                                            'noopener,noreferrer'
                                        )
                                    }
                                }}    
                            >
                                <path d="M 16 3 C 8.83 3 3 8.83 3 16 L 3 34 C 3 41.17 8.83 47 16 47 L 34 47 C 41.17 47 47 41.17 47 34 L 47 16 C 47 8.83 41.17 3 34 3 L 16 3 z M 37 11 C 38.1 11 39 11.9 39 13 C 39 14.1 38.1 15 37 15 C 35.9 15 35 14.1 35 13 C 35 11.9 35.9 11 37 11 z M 25 14 C 31.07 14 36 18.93 36 25 C 36 31.07 31.07 36 25 36 C 18.93 36 14 31.07 14 25 C 14 18.93 18.93 14 25 14 z M 25 16 C 20.04 16 16 20.04 16 25 C 16 29.96 20.04 34 25 34 C 29.96 34 34 29.96 34 25 C 34 20.04 29.96 16 25 16 z"></path>
                            </svg>
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
