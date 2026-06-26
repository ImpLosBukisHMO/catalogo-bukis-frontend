import { describe, expect, it } from "vitest";
import {
  buildPublishReadinessIssues,
  getProductPublicationLabel,
  hasVariantDraftData,
} from "./workerProductFlow";

describe("workerProductFlow", () => {
  it("detects when the worker has not started the first variant", () => {
    expect(hasVariantDraftData({ colorId: "", item: "", stock: "", activo: true, imagesCount: 0 })).toBe(false);
    expect(hasVariantDraftData({ colorId: "", item: "", stock: "0", activo: true, imagesCount: 0 })).toBe(false);
    expect(hasVariantDraftData({ colorId: "2", item: "", stock: "", activo: true, imagesCount: 0 })).toBe(true);
    expect(hasVariantDraftData({ colorId: "", item: "", stock: "3", activo: true, imagesCount: 0 })).toBe(true);
  });

  it("lists publish blockers for incomplete draft data", () => {
    const issues = buildPublishReadinessIssues({
      product: { precio: "", categorias_ids: [] },
      variant: {
        colorId: "",
        item: "",
        stock: "",
        activo: false,
        imagesCount: 0,
      },
    });

    expect(issues.map((issue) => issue.code)).toEqual([
      "missing-category",
      "missing-variant",
    ]);
  });

  it("reports field-level blockers when a variant exists but is not publishable", () => {
    const issues = buildPublishReadinessIssues({
      product: { precio: "", categorias_ids: ["1"] },
      variant: {
        colorId: "",
        item: "",
        stock: "-2",
        activo: false,
        imagesCount: 0,
      },
    });

    expect(issues.map((issue) => issue.code)).toEqual([
      "missing-active-variant",
      "missing-color",
      "missing-sku",
      "missing-price",
      "invalid-stock",
      "missing-image",
    ]);
  });

  it("uses the product price as publish fallback and maps labels", () => {
    const issues = buildPublishReadinessIssues({
      product: { precio: "249.00", categorias_ids: ["1"] },
      variant: {
        colorId: "7",
        item: "SKU-1",
        stock: "0",
        activo: true,
        imagesCount: 1,
      },
    });

    expect(issues).toEqual([]);
    expect(getProductPublicationLabel("draft")).toBe("Borrador");
    expect(getProductPublicationLabel("active")).toBe("Publicado");
    expect(getProductPublicationLabel("archived")).toBe("Archivado");
  });
});
