import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import API from "../api";
import { BACKEND_BASE_URL } from "../utils/backend";
import { uploadComprobante } from "./pedidos";
import { openProtectedComprobante } from "./comprobante";

const mockedGet = vi.mocked(API.get);
const mockedPatch = vi.mocked(API.patch);

describe("pedido comprobante services", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPatch.mockReset();
  });

  it("uploads the payment proof as multipart FormData", async () => {
    mockedPatch.mockResolvedValueOnce({
      data: {
        id: 12,
        estado: "APPROVED",
        comprobante_pago_subido: true,
        comprobante_pago_nombre: "comprobante.pdf",
        comprobante_pago_url: "/api/mis-pedidos/12/comprobante/",
      },
    });

    const file = new File(["pdf"], "comprobante.pdf", { type: "application/pdf" });
    await uploadComprobante(12, file);

    expect(mockedPatch).toHaveBeenCalledTimes(1);
    expect(mockedPatch.mock.calls[0][0]).toBe("/api/mis-pedidos/12/comprobante/");
    expect(mockedPatch.mock.calls[0][1]).toBeInstanceOf(FormData);
    expect(mockedPatch.mock.calls[0]).toHaveLength(2);
    const formData = mockedPatch.mock.calls[0][1] as FormData;
    expect(formData.get("comprobante_pago")).toBe(file);
  });

  it("opens the protected comprobante as a blob-backed tab", async () => {
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    mockedGet.mockResolvedValueOnce({
      data: blob,
      headers: { "content-disposition": 'inline; filename="comprobante.pdf"' },
    });
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:comprobante");
    URL.revokeObjectURL = vi.fn();
    const openSpy = vi.spyOn(window, "open").mockReturnValue({} as Window);

    await openProtectedComprobante("/api/mis-pedidos/12/comprobante/", "comprobante.pdf");

    expect(mockedGet).toHaveBeenCalledWith("/api/mis-pedidos/12/comprobante/", { responseType: "blob" });
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(openSpy).toHaveBeenCalledWith("blob:comprobante", "_blank", "noopener,noreferrer");

    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    openSpy.mockRestore();
  });

  it("normalizes same-origin absolute comprobante URLs to protected API paths", async () => {
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    mockedGet.mockResolvedValueOnce({
      data: blob,
      headers: {},
    });

    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:comprobante");
    URL.revokeObjectURL = vi.fn();
    const openSpy = vi.spyOn(window, "open").mockReturnValue({} as Window);

    await openProtectedComprobante(`${BACKEND_BASE_URL}/api/worker/pedidos/45/comprobante/`, "comprobante.pdf");

    expect(mockedGet).toHaveBeenCalledWith("/api/worker/pedidos/45/comprobante/", { responseType: "blob" });

    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    openSpy.mockRestore();
  });

  it("rejects absolute comprobante URLs that target another origin", async () => {
    await expect(
      openProtectedComprobante("https://evil.example/api/mis-pedidos/12/comprobante/", "comprobante.pdf"),
    ).rejects.toThrow("configured API origin");

    expect(mockedGet).not.toHaveBeenCalled();
  });

  it("rejects non-comprobante API paths before using the authenticated client", async () => {
    await expect(
      openProtectedComprobante("/api/worker/productos/99/", "comprobante.pdf"),
    ).rejects.toThrow("protected comprobante endpoint");

    expect(mockedGet).not.toHaveBeenCalled();
  });
});
