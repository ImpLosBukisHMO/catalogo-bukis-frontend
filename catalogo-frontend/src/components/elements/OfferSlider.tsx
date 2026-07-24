import { useEffect } from "react";
import { useSliderAutoplay } from "../../hooks/useSliderAutoplay";
import { usePublicBannerOfertas } from "../../queries/publicBannerOfertas";
import { isBannerOfertasEnabled } from "../../utils/featureFlags";
import { PlaceholderSlide } from "./slider/PlaceholderSlide";
import { PlayFallbackOverlay } from "./slider/PlayFallbackOverlay";
import { SlideMedia } from "./slider/SlideMedia";
import { SliderControls } from "./slider/SliderControls";
import { SliderDots } from "./slider/SliderDots";

const OfferSlider = () => {
  const publicBannerQuery = usePublicBannerOfertas(isBannerOfertasEnabled);
  const slides = !isBannerOfertasEnabled || publicBannerQuery.isError
    ? []
    : publicBannerQuery.data ?? [];

  const { index, state, goTo, onPlayFailure, onVideoEnded, videoRef } = useSliderAutoplay(slides);

  useEffect(() => {
    if (publicBannerQuery.isError) {
      console.warn("[banner-ofertas] fetch failed", publicBannerQuery.error);
    }
  }, [publicBannerQuery.error, publicBannerQuery.isError]);

  const currentSlide = slides[index];
  const showPlaceholder = slides.length === 0;
  const showControls = slides.length > 1;

  const handleRetryPlayback = () => {
    const playResult = videoRef.current?.play();
    goTo(index);

    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => {
        onPlayFailure();
      });
    }
  };

  return (
    <section className="mx-auto mb-8 w-full max-w-7xl px-4">
      <div className="w-full overflow-hidden rounded-2xl border border-neutral-300 bg-white shadow-bukis-soft">
        <div className="w-full bg-black px-4 py-3 text-center text-white">
          <p className="text-xl font-semibold text-white">¡Aprovecha nuestras ofertas!</p>
        </div>

        <div className="relative">
          {showPlaceholder || !currentSlide ? (
            <PlaceholderSlide />
          ) : (
            <>
              <SlideMedia
                slide={currentSlide}
                active
                videoRef={videoRef}
                onVideoEnded={onVideoEnded}
                onPlayFailure={onPlayFailure}
              />

              {state.kind === "autoplay-blocked" && (
                <PlayFallbackOverlay onPlay={handleRetryPlayback} />
              )}
            </>
          )}

          {showControls && (
            <SliderControls
              onPrev={() => goTo(index - 1)}
              onNext={() => goTo(index + 1)}
            />
          )}
        </div>

        {showControls && (
          <SliderDots
            activeIndex={index}
            total={slides.length}
            onSelect={goTo}
          />
        )}
      </div>
    </section>
  );
};

export default OfferSlider;
