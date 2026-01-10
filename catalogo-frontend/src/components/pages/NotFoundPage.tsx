import NavBar from '../elements/NavBar';
import Footer from '../elements/Footer';

const NotFoundPage = () => {
    return (
        <>
            <title>Página no encontrada | Importaciones Los Bukis</title>
            <NavBar />
            <div>
                <h1 className='mt-6 pt-6 mb-5 has-text-weight-semibold is-size-2' style={{ margin: 0, textAlign: 'center' }}>
                    Ups... La página no se encuentra disponible.
                </h1>
                <h2 className='mb-6 pb-6 has-text-weight-semibold is-size-2' style={{ margin: 0, textAlign: 'center' }}>
                    Volver a <a href="/" className="general-link is-underlined">Inicio</a>.
                </h2>
            </div>
            <Footer style={{bottom: 0}}/>
        </>
    );
}

export default NotFoundPage;