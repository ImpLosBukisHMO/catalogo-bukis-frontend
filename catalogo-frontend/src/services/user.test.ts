import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("./auth", () => ({
  login: vi.fn(),
}));

import API from "../api";
import { login } from "./auth";
import { getLoggedUserData, signUp, updateUserData } from "./user";

const mockedPost = vi.mocked(API.post);
const mockedGet = vi.mocked(API.get);
const mockedPut = vi.mocked(API.put);
const mockedLogin = vi.mocked(login);

describe("user service JWT-only flows", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("accepts a 201 signup response and establishes the JWT session once", async () => {
    mockedPost.mockResolvedValueOnce({ status: 201 } as never);

    await signUp({
      id: null,
      nombre: "Ana",
      apellido: "Pérez",
      correo: "ana@example.com",
      telefono: "555",
      password: "secret",
    });

    expect(mockedPost).toHaveBeenCalledTimes(1);
    expect(mockedLogin).toHaveBeenCalledWith("ana@example.com", "secret");
  });

  it("also accepts a 200 signup response without falling back to the legacy login endpoint", async () => {
    mockedPost.mockResolvedValueOnce({ status: 200 } as never);

    await signUp({
      id: null,
      nombre: "Luis",
      apellido: "Gómez",
      correo: "luis@example.com",
      telefono: "777",
      password: "secret",
    });

    expect(mockedPost).toHaveBeenCalledTimes(1);
    expect(mockedLogin).toHaveBeenCalledWith("luis@example.com", "secret");
  });

  it("loads the logged user through the shared interceptor instead of building a manual Authorization header", async () => {
    mockedGet.mockResolvedValueOnce({ status: 200, data: { id: 1 } } as never);
    localStorage.setItem("access", "jwt-access");

    await getLoggedUserData();

    expect(mockedGet).toHaveBeenCalledWith("/api/mi_usuario/", {
      headers: { Accept: "application/json" },
    });
  });

  it("updates the profile without reading the legacy token key or writing a manual Authorization header", async () => {
    mockedPut.mockResolvedValueOnce({ status: 200 } as never);
    localStorage.setItem("token", "legacy-token");

    await updateUserData({
      id: 9,
      nombre: "Marta",
      apellido: "Luna",
      correo: "marta@example.com",
      telefono: "123",
      password: null,
    });

    expect(mockedPut).toHaveBeenCalledWith(
      "/api/usuarios/9/",
      {
        nombre: "Marta",
        apellido: "Luna",
        correo: "marta@example.com",
        telefono: "123",
      },
      {
        headers: { Accept: "application/json" },
      },
    );
  });
});
