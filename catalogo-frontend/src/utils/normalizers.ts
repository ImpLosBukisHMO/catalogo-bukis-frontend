export function stripDiacritics(q: string): string {
    return q.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

export function formatMoney(n: number) {
    return `$ ${n.toFixed(2)} MXN`;
}

export function variantePendingCopy(isCreating: boolean, isUploading: boolean): string {
  if (isCreating) return "Creando variante…";
  if (isUploading) return "Subiendo fotos…";
  return "Guardar variante";
}