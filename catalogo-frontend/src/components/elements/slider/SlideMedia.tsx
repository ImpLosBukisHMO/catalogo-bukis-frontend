import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { BannerOfertaPublic } from "../../../types/bannerOferta";
import { resolveImageUrl } from "../../../utils/images";

type SlideMediaProps = {
  slide: BannerOfertaPublic;
  active: boolean;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  onVideoEnded: () => void;
  onPlayFailure: () => void;
};

export function SlideMedia({
  slide,
  active,
  videoRef,
  onVideoEnded,
  onPlayFailure,
}: SlideMediaProps) {
  const source = resolveImageUrl(slide.archivo) ?? slide.archivo;

  useEffect(() => {
    if (slide.tipo !== "video") return;

    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (!active) {
      videoElement.pause();
      videoElement.currentTime = 0;
      return;
    }

    const playResult = videoElement.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => {
        onPlayFailure();
      });
    }
  }, [active, onPlayFailure, slide.tipo, videoRef]);

  if (slide.tipo === "video") {
    return (
      <video
        ref={videoRef}
        key={slide.id}
        src={source}
        muted
        autoPlay={active}
        playsInline
        preload="metadata"
        onEnded={onVideoEnded}
        className="h-[360px] w-full bg-black object-cover"
      />
    );
  }

  return (
    <img
      src={source}
      alt="Oferta destacada"
      className="h-[360px] w-full bg-neutral-100 object-cover"
    />
  );
}
