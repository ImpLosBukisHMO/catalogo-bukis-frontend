import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../elements/NavBar", () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock("../elements/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

vi.mock("../../services/pedidos", () => ({
  getMiPedidoDetalle: vi.fn(),
  uploadComprobante: vi.fn(),
}));

vi.mock("../../services/comprobante", () => ({
  openProtectedComprobante: vi.fn(),
  fetchProtectedComprobante: vi.fn().mockResolvedValue({
    blob: new Blob([""], { type: "application/pdf" }),
    fileName: "comprobante.pdf",
  }),
}));

import PedidoDetallePage from "./PedidoDetallePage";
import { getMiPedidoDetalle, uploadComprobante } from "../../services/pedidos";
import { openProtectedComprobante, fetchProtectedComprobante } from "../../services/comprobante";
import type { PedidoDetalle } from "../../types/pedido";

const mockedGetMiPedidoDetalle = vi.mocked(getMiPedidoDetalle);
const mockedUploadComprobante = vi.mocked(uploadComprobante);
const mockedOpenProtectedComprobante = vi.mocked(openProtectedComprobante);
const mockedFetchProtectedComprobante = vi.mocked(fetchProtectedComprobante);

function buildPedido(overrides: Partial<PedidoDetalle> = {}): PedidoDetalle {
    return {
      id: 12,
      public_id: "pedido-12",
      folio: "12",
      estado: "APPROVED",
    precio_total: "120.00",
    subtotal_snapshot: "100.00",
    nota_cliente: null,
    nota_worker: null,
    denegado_razon: null,
    aprobado_eta: null,
    comprobante_pago_subido: false,
    comprobante_pago_nombre: null,
    comprobante_pago_url: null,
    created_at: "2026-01-01T00:00:00Z",
    items: [],
    cliente: {
      id: 1,
      nombre: "Test",
      apellido: "User",
      correo: "test@example.com",
      telefono: "5551234567",
      password: null,
    },
    ...overrides,
  };
}

function renderPage() {
  const router = createMemoryRouter(
    [{ path: "/pedidos/:id", element: <PedidoDetallePage /> }],
    { initialEntries: ["/pedidos/12"] },
  );
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("PedidoDetallePage", () => {
  beforeEach(() => {
    localStorage.setItem("access", "token");
    mockedGetMiPedidoDetalle.mockReset();
    mockedUploadComprobante.mockReset();
    mockedOpenProtectedComprobante.mockReset();
    mockedFetchProtectedComprobante.mockResolvedValue({
      blob: new Blob(["test"], { type: "application/pdf" }),
      fileName: "comprobante.pdf",
    });
  });

  it("shows the upload section only for approved pedidos with a hidden Spanish-controlled file input", async () => {
    mockedGetMiPedidoDetalle.mockResolvedValueOnce(buildPedido());

    renderPage();

    expect(await screen.findByText("Comprobante de pago")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seleccionar comprobante" })).toBeInTheDocument();
    expect(screen.getByLabelText("Seleccionar comprobante de pago")).toHaveAttribute("accept", "image/*,application/pdf");
    expect(screen.getByLabelText("Seleccionar comprobante de pago")).toHaveAttribute("capture", "environment");
    expect(screen.queryByText("Browse...")).not.toBeInTheDocument();
    expect(screen.queryByText("No file selected")).not.toBeInTheDocument();
  });

  it("hides the upload section for non-approved pedidos", async () => {
    mockedGetMiPedidoDetalle.mockResolvedValueOnce(buildPedido({ estado: "PENDING" }));

    renderPage();

    await screen.findByText("Pedido #12");
    expect(screen.queryByText("Comprobante de pago")).not.toBeInTheDocument();
  });

  it("shows the current proof card and opens it through the protected service", async () => {
    mockedGetMiPedidoDetalle.mockResolvedValueOnce(
      buildPedido({
        comprobante_pago_subido: true,
        comprobante_pago_nombre: "comprobante.pdf",
        comprobante_pago_url: "/api/mis-pedidos/12/comprobante/",
      }),
    );

    renderPage();

    expect(await screen.findByText("Comprobante actual")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver comprobante" }));

    expect(await screen.findByRole("heading", { name: "Comprobante" })).toBeInTheDocument();
  });

  it("shows a Spanish upload error when the upload fails", async () => {
    mockedGetMiPedidoDetalle.mockResolvedValueOnce(buildPedido());
    mockedUploadComprobante.mockRejectedValueOnce({
      response: { data: { error: "Archivo inválido." } },
    });

    renderPage();

    const input = await screen.findByLabelText("Seleccionar comprobante de pago");
    const file = new File(["pdf"], "comprobante.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText("Archivo inválido.")).toBeInTheDocument();
  });

  it("uploads the selected file through the FormData-backed service", async () => {
    mockedGetMiPedidoDetalle.mockResolvedValueOnce(buildPedido());
    mockedUploadComprobante.mockResolvedValueOnce(
      buildPedido({
        comprobante_pago_subido: true,
        comprobante_pago_nombre: "comprobante.pdf",
        comprobante_pago_url: "/api/mis-pedidos/12/comprobante/",
      }),
    );

    renderPage();

    const input = await screen.findByLabelText("Seleccionar comprobante de pago");
    const file = new File(["pdf"], "comprobante.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockedUploadComprobante).toHaveBeenCalledWith(12, file);
    });
    expect(await screen.findByText("Comprobante subido correctamente.")).toBeInTheDocument();
  });
});
