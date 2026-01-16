import { ArrowLeft, ArrowRight } from 'lucide-react';

const OfferSlider = () => {
    return (
        <div className="offer-slider" style={{ width: '100%' }}>
            <div style={{
                width: '100%', margin: 0, textAlign: 'center', backgroundColor: '#000',
                color: '#fff'
            }}>
                <p className='is-size-4' style={{ padding: 10, fontSize: 22 }}>¡Aprovecha nuestras ofertas!</p>
            </div>
            <div style={{backgroundColor: '#9e9e9eff', height: '360px' }}>
                <div style={{ width: '100%', display: 'flex', gap: '85%' , alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <ArrowLeft className="slider-btn" size={'3rem'} color="#000000" />
                    <ArrowRight className="slider-btn" size={'3rem'} color="#000000" />
                </div>
            </div>
        </div>
    );
}

export default OfferSlider;