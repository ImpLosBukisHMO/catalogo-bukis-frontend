export type ProductPublicationState = "draft" | "active" | "archived";

export type CreateFlowProductInput = {
  precio: string;
  categorias_ids: string[];
};

export type CreateFlowVariantInput = {
  colorId: string;
  item: string;
  stock: string;
  activo: boolean;
  imagesCount: number;
  precio?: string;
};

export type PublishReadinessIssue = {
  code:
    | "missing-category"
    | "missing-variant"
    | "missing-active-variant"
    | "missing-color"
    | "missing-sku"
    | "missing-price"
    | "missing-stock"
    | "invalid-stock"
    | "missing-image";
  message: string;
};

export function hasVariantDraftData(variant: CreateFlowVariantInput): boolean {
  const normalizedStock = variant.stock.trim();

  return Boolean(
    variant.colorId.trim()
    || variant.item.trim()
    || (normalizedStock !== "" && normalizedStock !== "0")
    || variant.imagesCount > 0
  );
}

export function buildPublishReadinessIssues({
  product,
  variant,
}: {
  product: CreateFlowProductInput;
  variant: CreateFlowVariantInput;
}): PublishReadinessIssue[] {
  const issues: PublishReadinessIssue[] = [];

  if (product.categorias_ids.length === 0) {
    issues.push({
      code: "missing-category",
      message: "Agrega al menos una categoría antes de publicar.",
    });
  }

  if (!hasVariantDraftData(variant)) {
    issues.push({
      code: "missing-variant",
      message: "Crea la primera variante antes de publicar.",
    });
    return issues;
  }

  if (!variant.activo) {
    issues.push({
      code: "missing-active-variant",
      message: "Activa la primera variante para poder publicar.",
    });
  }

  if (!variant.colorId.trim()) {
    issues.push({
      code: "missing-color",
      message: "Selecciona un color para la primera variante.",
    });
  }

  if (!variant.item.trim()) {
    issues.push({
      code: "missing-sku",
      message: "Ingresa el SKU de la primera variante.",
    });
  }

  const effectivePrice = (variant.precio ?? "").trim() || product.precio.trim();
  if (!effectivePrice) {
    issues.push({
      code: "missing-price",
      message: "Ingresa un precio válido antes de publicar.",
    });
  }

  if (!variant.stock.trim()) {
    issues.push({
      code: "missing-stock",
      message: "Ingresa el stock de la primera variante.",
    });
  } else if (Number.isNaN(Number(variant.stock)) || Number(variant.stock) < 0) {
    issues.push({
      code: "invalid-stock",
      message: "El stock debe ser un número igual o mayor a 0.",
    });
  }

  if (variant.imagesCount === 0) {
    issues.push({
      code: "missing-image",
      message: "Agrega al menos una imagen para la primera variante.",
    });
  }

  return issues;
}

export function getProductPublicationLabel(estado?: string | null): string {
  switch (estado) {
    case "active":
      return "Publicado";
    case "archived":
      return "Archivado";
    case "draft":
    default:
      return "Borrador";
  }
}
