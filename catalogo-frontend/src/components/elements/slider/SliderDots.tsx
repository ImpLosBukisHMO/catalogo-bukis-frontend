type SliderDotsProps = {
  activeIndex: number;
  total: number;
  onSelect: (index: number) => void;
};

export function SliderDots({ activeIndex, total, onSelect }: SliderDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2 border-t border-neutral-200 bg-white px-4 py-3">
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === activeIndex;

        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`Ir a diapositiva ${index + 1} de ${total}`}
            aria-current={isActive ? "true" : undefined}
            className={`h-2.5 w-2.5 rounded-full transition ${
              isActive ? "bg-bukis-red-600 scale-110" : "bg-neutral-300 hover:bg-neutral-400"
            }`}
          />
        );
      })}
    </div>
  );
}
