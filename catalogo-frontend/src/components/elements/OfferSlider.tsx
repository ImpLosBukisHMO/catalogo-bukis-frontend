import { ArrowLeft, ArrowRight } from 'lucide-react';

const OfferSlider = () => {
    return (
        <div className="w-full overflow-hidden rounded-2xl border border-neutral-300 bg-neutral-200 shadow-bukis-soft">
            <div className="w-full bg-black px-4 py-3 text-center text-white">
                <p className='text-xl font-semibold text-white'>¡Aprovecha nuestras ofertas!</p>
            </div>
            <div className="h-[360px] bg-neutral-300">
                <div className="flex h-full w-full items-center justify-between px-6">
                    <ArrowLeft className="h-12 w-12 cursor-pointer rounded-full bg-white p-3 text-black shadow-md transition hover:shadow-lg active:shadow" />
                    <ArrowRight className="h-12 w-12 cursor-pointer rounded-full bg-white p-3 text-black shadow-md transition hover:shadow-lg active:shadow" />
                </div>
            </div>
        </div>
    );
}

export default OfferSlider;
