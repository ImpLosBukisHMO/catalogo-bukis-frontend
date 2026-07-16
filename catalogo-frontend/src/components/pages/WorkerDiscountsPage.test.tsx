import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkerThemeProvider } from "../providers/WorkerThemeProvider";
import { WorkerDiscountsPage } from "./WorkerDiscountsPage";
import { MemoryRouter } from "react-router";

const mockEditarDescuento = vi.fn();
const mockCrearDescuento = vi.fn();

vi.mock("../../queries/workerDescuentos", () => ({
  useWorkerDescuentos: () => ({
    data: [
      {
        id: 1,
        nombre: "Descuento Verano",
        tipo: "general",
        porcentaje: 15,
        activo: true,
        fecha_inicio: "2026-06-01T00:00:00Z",
        fecha_fin: "2026-08-31T23:59:59Z",
      },
      {
        id: 2,
        nombre: "Flash Sale",
        tipo: "especial",
        porcentaje: 50,
        activo: false,
        fecha_inicio: "2026-07-01T00:00:00Z",
        fecha_fin: "2026-07-02T00:00:00Z",
      }
    ],
    isLoading: false,
    isError: false,
    error: null,
    isFetching: false
  }),
  useEditarDescuento: () => ({ mutateAsync: mockEditarDescuento, isPending: false }),
  useWorkerTiposDescuento: () => ({ data: ["general", "especial"] }),
  useCrearDescuento: () => ({ mutateAsync: mockCrearDescuento, isPending: false }),
}));

vi.mock("@tanstack/react-query", () => {
  return {
    useQuery: () => ({
      data: [{ id: 1, nombre: "Ropa", descuento_general: 1 }],
      isLoading: false
    }),
    useMutation: () => ({
      mutate: vi.fn(),
      isPending: false
    }),
    useQueryClient: () => ({
      invalidateQueries: vi.fn()
    })
  };
});

// Avoid ResizeObserver error in tests if Dialog uses it
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

beforeEach(() => {
  mockEditarDescuento.mockClear();
  mockCrearDescuento.mockClear();
});

describe("WorkerDiscountsPage", () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <WorkerThemeProvider>
          <WorkerDiscountsPage />
        </WorkerThemeProvider>
      </MemoryRouter>
    );

  it("renders discounts in the table", async () => {
    renderPage();

    expect(screen.getByText("Descuento Verano")).toBeDefined();
    expect(screen.getByText("Flash Sale")).toBeDefined();
    expect(screen.getByText("15 %")).toBeDefined();
    expect(screen.getByText("50 %")).toBeDefined();
  });

  it("filters discounts by name", async () => {
    renderPage();

    const searchInput = screen.getByPlaceholderText("Buscar descuento por nombre…");
    fireEvent.change(searchInput, { target: { value: "flash" } });

    expect(screen.queryByText("Descuento Verano")).toBeNull();
    expect(screen.getByText("Flash Sale")).toBeDefined();
  });

  it("allows inline editing of a discount", async () => {
    renderPage();

    const editButtons = screen.getAllByTitle("Editar");
    fireEvent.click(editButtons[0]);

    const nameInput = screen.getByDisplayValue("Descuento Verano");
    expect(nameInput).toBeDefined();

    fireEvent.change(nameInput, { target: { value: "Descuento Invierno" } });

    const percentInput = screen.getByDisplayValue("15");
    fireEvent.change(percentInput, { target: { value: "20" } });

    const saveButton = screen.getByText("Guardar");
    fireEvent.click(saveButton);

    mockEditarDescuento.mockResolvedValueOnce({});

    await waitFor(() => {
      expect(screen.getByText(/Confirmar Cambios/i)).toBeDefined();
    });

    const confirmButton = screen.getByRole("button", { name: "Confirmar" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockEditarDescuento).toHaveBeenCalledWith({
        id: 1,
        data: expect.objectContaining({
          nombre: "Descuento Invierno",
          porcentaje: 20
        })
      });
    });
  });
});
