import API from "../api";
import { normalizeResponse } from "../components/pages/responseNormalizer";
import type { BannerOfertaPublic } from "../types/bannerOferta";

export async function getPublicBannerOfertas(): Promise<BannerOfertaPublic[]> {
  const res = await API.get("/api/banner-ofertas/");
  return normalizeResponse<BannerOfertaPublic>(res.data);
}
