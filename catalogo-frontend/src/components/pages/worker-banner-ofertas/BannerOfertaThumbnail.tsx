import type { BannerOfertaWorker } from "../../../types/bannerOferta";
import { resolveImageUrl } from "../../../utils/images";

type BannerOfertaThumbnailProps = {
  banner: BannerOfertaWorker;
};

export function BannerOfertaThumbnail({ banner }: BannerOfertaThumbnailProps) {
  const source = resolveImageUrl(banner.archivo);

  if (!source) {
    return (
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 8,
          background: "var(--worker-bench)",
          border: "1px solid var(--worker-border-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          color: "var(--worker-ink-tertiary)",
        }}
      >
        N/A
      </div>
    );
  }

  if (banner.tipo === "video") {
    return (
      <video
        src={source}
        muted
        playsInline
        preload="metadata"
        style={{
          width: 48,
          height: 48,
          borderRadius: 8,
          objectFit: "cover",
          background: "#000",
          border: "1px solid var(--worker-border-soft)",
        }}
      />
    );
  }

  return (
    <img
      src={source}
      alt="Miniatura del banner"
      style={{
        width: 48,
        height: 48,
        borderRadius: 8,
        objectFit: "cover",
        border: "1px solid var(--worker-border-soft)",
        background: "var(--worker-bench)",
      }}
    />
  );
}
