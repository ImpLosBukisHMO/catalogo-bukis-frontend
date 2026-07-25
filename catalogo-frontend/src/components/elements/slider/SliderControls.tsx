import { ArrowLeft, ArrowRight } from "lucide-react";

type SliderControlsProps = {
  onPrev: () => void;
  onNext: () => void;
};

const buttonClassName = "flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-black shadow-md transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/60";

export function SliderControls({ onPrev, onNext }: SliderControlsProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between px-4">
      <button
        type="button"
        onClick={onPrev}
        className={`pointer-events-auto ${buttonClassName}`}
        aria-label="Oferta anterior"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onNext}
        className={`pointer-events-auto ${buttonClassName}`}
        aria-label="Siguiente oferta"
      >
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}
