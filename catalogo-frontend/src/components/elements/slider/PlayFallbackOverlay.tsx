type PlayFallbackOverlayProps = {
  onPlay: () => void;
};

export function PlayFallbackOverlay({ onPlay }: PlayFallbackOverlayProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
      <button
        type="button"
        onClick={onPlay}
        aria-label="Reproducir video de la oferta"
        className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-white/70"
      >
        Reproducir video
      </button>
    </div>
  );
}
