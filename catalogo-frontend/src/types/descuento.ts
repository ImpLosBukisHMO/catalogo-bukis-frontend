export type Discount = {
  id: number;
  nombre: string;
  tipo: string;
  porcentaje: number;
  activo: boolean;
  fecha_inicio: Date;
  fecha_fin: Date;
  es_valido: boolean;
};
