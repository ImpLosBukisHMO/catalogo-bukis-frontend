import { useQuery } from "@tanstack/react-query";
import { getPublicBannerOfertas } from "../services/bannerOfertas";

export const publicBannerOfertasKey = ["banner-ofertas", "public"] as const;

export function usePublicBannerOfertas(enabled = true) {
  return useQuery({
    queryKey: publicBannerOfertasKey,
    queryFn: getPublicBannerOfertas,
    enabled,
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });
}
