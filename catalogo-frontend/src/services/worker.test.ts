import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(),
  },
}));

import API from "../api";
import { getWorkerProductosSlim } from "./worker";

const mockedGet = vi.mocked(API.get);

describe("getWorkerProductosSlim", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  // Task 1.2 — URL assertion (RED: currently fails — missing ?page_size=100)
  it("calls /api/worker/productos/?page_size=100", async () => {
    // Backend contract: catalogo-bukis-backend#39 sets max_page_size=100.
    // The service MUST pass page_size=100 explicitly on every call.
    mockedGet.mockResolvedValueOnce({
      data: { results: [{ id: 1, nombre: "A" }] },
    });

    await getWorkerProductosSlim();

    expect(mockedGet).toHaveBeenCalledWith("/api/worker/productos/?page_size=100");
  });

  // Task 1.3 — happy-path shape: results array is returned as-is
  it("returns WorkerProductoSlim[] from a paginated response", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { results: [{ id: 1, nombre: "A" }, { id: 2, nombre: "B" }] },
    });

    const result = await getWorkerProductosSlim();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 1, nombre: "A" });
    expect(result[1]).toEqual({ id: 2, nombre: "B" });
  });

  // Task 1.4 — shape guard from issue #56: missing/null results → []
  it("returns [] when results is absent or null", async () => {
    mockedGet.mockResolvedValueOnce({ data: {} });

    const result = await getWorkerProductosSlim();

    expect(result).toEqual([]);
  });
});
