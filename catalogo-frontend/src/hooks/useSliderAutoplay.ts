import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BannerOfertaPublic } from "../types/bannerOferta";

export type AutoplayState =
  | { kind: "idle" }
  | { kind: "playing-image"; index: number }
  | { kind: "playing-video"; index: number }
  | { kind: "paused-by-user"; index: number }
  | { kind: "autoplay-blocked"; index: number };

function resolveState(
  slides: BannerOfertaPublic[],
  index: number,
  blocked: boolean,
  pausedByUser: boolean,
): AutoplayState {
  if (slides.length === 0) return { kind: "idle" };

  const currentSlide = slides[index] ?? slides[0];

  if (currentSlide.tipo === "video") {
    if (blocked) return { kind: "autoplay-blocked", index };
    if (pausedByUser) return { kind: "paused-by-user", index };
    return { kind: "playing-video", index };
  }

  if (pausedByUser) return { kind: "paused-by-user", index };
  return { kind: "playing-image", index };
}

export function useSliderAutoplay(
  slides: BannerOfertaPublic[],
  opts?: { imageDurationMs?: number },
) {
  const imageDurationMs = opts?.imageDurationMs ?? 5_000;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [index, setIndex] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [pausedByUser, setPausedByUser] = useState(false);
  const safeIndex = slides.length === 0 ? 0 : Math.min(index, slides.length - 1);

  const goTo = useCallback((nextIndex: number, options?: { pausedByUser?: boolean }) => {
    if (slides.length === 0) return;

    setBlocked(false);
    setPausedByUser(Boolean(options?.pausedByUser));
    setIndex(((nextIndex % slides.length) + slides.length) % slides.length);
  }, [slides.length]);

  const next = useCallback(() => {
    if (slides.length === 0) return;
    goTo(safeIndex + 1);
  }, [goTo, safeIndex, slides.length]);

  const prev = useCallback(() => {
    if (slides.length === 0) return;
    goTo(safeIndex - 1);
  }, [goTo, safeIndex, slides.length]);

  const onVideoEnded = useCallback(() => {
    if (slides.length === 0) return;
    next();
  }, [next, slides.length]);

  const onPlayFailure = useCallback(() => {
    setBlocked(true);
    setPausedByUser(false);
  }, []);

  useEffect(() => {
    const currentSlide = slides[safeIndex];

    if (!currentSlide || currentSlide.tipo !== "imagen") {
      return;
    }

    const timer = window.setTimeout(() => {
      setPausedByUser(false);
      next();
    }, imageDurationMs);

    return () => window.clearTimeout(timer);
  }, [imageDurationMs, next, safeIndex, slides]);

  const state = useMemo(
    () => resolveState(slides, safeIndex, blocked, pausedByUser),
    [blocked, pausedByUser, safeIndex, slides],
  );

  return {
    index: safeIndex,
    state,
    next,
    prev,
    goTo,
    onVideoEnded,
    onPlayFailure,
    videoRef,
  };
}
