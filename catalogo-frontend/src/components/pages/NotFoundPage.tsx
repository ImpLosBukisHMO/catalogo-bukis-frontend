import NavBar from '../elements/NavBar';
import Footer from '../elements/Footer';

const NotFoundPage = () => {
    return (
        <>
            <title>Página no encontrada | Importaciones Los Bukis</title>
            <NavBar />
            <div className='mx-auto max-w-3xl px-4 py-20 text-center'>
                <h1 className='mb-5 text-4xl font-semibold text-bukis-ink'>
                    Ups... La página no se encuentra disponible.
                </h1>
                <h2 className='text-2xl font-semibold text-neutral-700'>
                    Volver a <a href="/" className="text-bukis-red-700 underline underline-offset-4 hover:text-bukis-red-800">Inicio</a>.
                </h2>
            </div>
            <Footer style={{bottom: 0}}/>
        </>
    );
}

export default NotFoundPage;
