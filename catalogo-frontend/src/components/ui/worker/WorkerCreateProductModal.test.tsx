import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkerThemeProvider } from "../../providers/WorkerThemeProvider";
import { WorkerCreateProductModal } from "./WorkerCreateProductModal";

const mockCrearProducto = vi.fn();
const mockEditarProducto = vi.fn();
const mockCrearVariante = vi.fn();
const mockSubirImagen = vi.fn();
const mockEditarVariante = vi.fn();

vi.mock("../../../queries/workerProducts", () => ({
  useCrearProducto: () => ({ mutateAsync: mockCrearProducto, isPending: false }),
  useEditarProducto: () => ({ mutateAsync: mockEditarProducto, isPending: false }),
  useCrearVariante: () => ({ mutateAsync: mockCrearVariante, isPending: false }),
  useSubirImagen: () => ({ mutateAsync: mockSubirImagen, isPending: false }),
  useEditarVariante: () => ({ mutateAsync: mockEditarVariante, isPending: false }),
}));

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });

  global.URL.createObjectURL = vi.fn(() => "blob:preview");
  global.URL.revokeObjectURL = vi.fn();
});

beforeEach(() => {
  mockCrearProducto.mockReset();
  mockEditarProducto.mockReset();
  mockCrearVariante.mockReset();
  mockSubirImagen.mockReset();
  mockEditarVariante.mockReset();
});

function TestHarness() {
  const [open, setOpen] = useState(true);

  return (
    <WorkerThemeProvider>
      <button type="button" onClick={() => setOpen(true)}>
        Reabrir modal
      </button>
      <WorkerCreateProductModal
        open={open}
        onOpenChange={setOpen}
        categorias={[{ id: 1, nombre: "Vasos" }]}
        colores={[{ id: 1, nombre: "Rojo", hex: "#ff0000" }]}
        productos={[]}
      />
    </WorkerThemeProvider>
  );
}

function fillField(label: string, value: string) {
  const labelNode = screen.getByText(new RegExp(`^${label}`));
  const field = labelNode.parentElement?.querySelector("input, textarea, select");
  if (!(field instanceof HTMLElement)) {
    throw new Error(`Field not found for label: ${label}`);
  }

  fireEvent.change(field, { target: { value } });
}

function uploadMainProductImage() {
  const fileInputs = document.querySelectorAll('input[type="file"]');
  const galleryInput = fileInputs[1];

  fireEvent.change(galleryInput, {
    target: {
      files: [new File(["image"], "product.png", { type: "image/png" })],
    },
  });
}

function uploadVariantImage() {
  const galleryInput = document.querySelector('input[type="file"][multiple]');

  if (!(galleryInput instanceof HTMLInputElement)) {
    throw new Error("Variant gallery input not found");
  }

  fireEvent.change(galleryInput, {
    target: {
      files: [new File(["variant-image"], "variant.png", { type: "image/png" })],
    },
  });
}

function fillGeneralStep() {
  fillField("Nombre", "Mate imperial");
  fillField("Precio", "249.99");
  fillField("Peso", "0.8");
  fillField("Medidas", "10x10x15");
  fillField("Descripción", "Mate de algarrobo");
  uploadMainProductImage();
}

const createdProduct = {
  id: 77,
  nombre: "Mate imperial",
  imagen: "/product.png",
  descripcion: "Mate de algarrobo",
  precio: "249.99",
  peso: "0.8",
  medidas: "10x10x15",
  capacidad: null,
  disponible: false,
  estado: "draft",
  categorias: [],
  created_at: "2026-06-23T00:00:00Z",
  updated_at: "2026-06-23T00:00:00Z",
};

describe("WorkerCreateProductModal", () => {
  it("permite guardar borrador sin variante y reabre limpio tras cerrar éxito", async () => {
    mockCrearProducto.mockResolvedValue(createdProduct);

    render(<TestHarness />);

    fillGeneralStep();

    fireEvent.click(screen.getByRole("button", { name: "Continuar a la variante" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar a publicación" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));

    expect(await screen.findByText("Producto guardado")).toBeInTheDocument();
    expect(mockCrearProducto).toHaveBeenCalledTimes(1);
    expect(mockCrearVariante).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    fireEvent.click(screen.getByRole("button", { name: "Reabrir modal" }));

    expect(await screen.findByText("Nuevo producto")).toBeInTheDocument();
    expect(screen.queryByText("Producto guardado")).not.toBeInTheDocument();
  });

  it("bloquea el reintento ciego cuando ya se creó el producto y falla la variante", async () => {
    mockCrearProducto.mockResolvedValue(createdProduct);
    mockCrearVariante.mockRejectedValue(new Error("Falló la variante"));

    render(<TestHarness />);

    fillGeneralStep();

    fireEvent.click(screen.getByRole("button", { name: "Continuar a la variante" }));
    fillField("Color", "1");
    fillField("SKU", "SKU-ROJO-1");
    fillField("Stock", "5");

    fireEvent.click(screen.getByRole("button", { name: "Continuar a publicación" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));

    expect(await screen.findByText(/ya se creó como borrador/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar para evitar duplicados" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar borrador" })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mockCrearProducto).toHaveBeenCalledTimes(1);
      expect(mockCrearVariante).toHaveBeenCalledTimes(1);
    });
  });

  it("muestra guía de creación parcial cuando falla la carga de imágenes tras crear producto y variante", async () => {
    mockCrearProducto.mockResolvedValue(createdProduct);
    mockCrearVariante.mockResolvedValue({
      id: 91,
      item: "SKU-ROJO-1",
      color: 1,
      stock: 5,
      activo: false,
    });
    mockSubirImagen.mockRejectedValue(new Error("Falló la carga de imágenes"));

    render(<TestHarness />);

    fillGeneralStep();

    fireEvent.click(screen.getByRole("button", { name: "Continuar a la variante" }));
    fillField("Color", "1");
    fillField("SKU", "SKU-ROJO-1");
    fillField("Stock", "5");
    uploadVariantImage();

    fireEvent.click(screen.getByRole("button", { name: "Continuar a publicación" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));

    expect(await screen.findByText(/su primera variante ya fueron creados, pero falló la carga de imágenes/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar para evitar duplicados" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar borrador" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publicar producto" })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mockCrearProducto).toHaveBeenCalledTimes(1);
      expect(mockCrearVariante).toHaveBeenCalledTimes(1);
      expect(mockSubirImagen).toHaveBeenCalledTimes(1);
    });
  });
});
