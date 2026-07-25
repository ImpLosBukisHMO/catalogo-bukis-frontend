export type BannerOfertaTipo = "imagen" | "video";

export interface BannerOfertaPublic {
  id: number;
  tipo: BannerOfertaTipo;
  archivo: string;
  orden: number;
}

export interface BannerOfertaWorker extends BannerOfertaPublic {
  activo: boolean;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface CreateBannerOfertaInput {
  tipo: BannerOfertaTipo;
  archivo: File;
  orden: number;
  activo: boolean;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}

export type UpdateBannerOfertaMeta = Partial<
  Pick<BannerOfertaWorker, "tipo" | "orden" | "activo" | "fecha_inicio" | "fecha_fin">
>;

export type UpdateBannerOfertaInput =
  | { kind: "file"; id: number; data: FormData }
  | { kind: "meta"; id: number; data: UpdateBannerOfertaMeta };
