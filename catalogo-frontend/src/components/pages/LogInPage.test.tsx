import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LogInPage from "./LogInPage";
import { getMe, isWorker, login } from "../../services/auth";

const mockedNavigate = vi.fn();
const legacyLogIn = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

vi.mock("../elements/Footer", () => ({ default: () => <div data-testid="footer" /> }));
vi.mock("../elements/NavBar", () => ({ default: () => <div data-testid="navbar" /> }));
vi.mock("../elements/HideShowPassword", () => ({
  default: ({ passwordVisibilityAction }: { passwordVisibilityAction: () => void }) => (
    <button type="button" onClick={passwordVisibilityAction}>toggle</button>
  ),
}));

vi.mock("../../context/useAuth", () => ({
  useAuth: () => ({ isLoggedIn: false, isLoading: false }),
}));

vi.mock("../../services/auth", () => ({
  login: vi.fn(),
  getMe: vi.fn(),
  isWorker: vi.fn(),
}));

vi.mock("../../services/user", () => ({
  logIn: legacyLogIn,
}));

describe("LogInPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the flow JWT-only and redirects workers to the worker panel", async () => {
    vi.mocked(login).mockResolvedValue({ access: "a", refresh: "r" });
    vi.mocked(getMe).mockResolvedValue({
      id: 1,
      nombre: "Ana",
      apellido: "Pérez",
      correo: "ana@example.com",
      telefono: "555",
      is_admin: false,
      is_staff: true,
      is_superuser: false,
    });
    vi.mocked(isWorker).mockReturnValue(true);

    render(
      <MemoryRouter>
        <LogInPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("usuario@correo.com"), { target: { value: "ana@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Contraseña"), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar Sesión" }));

    expect(await screen.findByRole("button", { name: "Iniciando sesión…" })).toBeInTheDocument();
    await waitFor(() => {
      expect(legacyLogIn).not.toHaveBeenCalled();
      expect(mockedNavigate).toHaveBeenCalledWith("/worker");
    });
  });

  it("redirects regular users to the storefront after JWT login without calling legacy login", async () => {
    vi.mocked(login).mockResolvedValue({ access: "a", refresh: "r" });
    vi.mocked(getMe).mockResolvedValue({
      id: 2,
      nombre: "Luis",
      apellido: "Gómez",
      correo: "luis@example.com",
      telefono: "777",
      is_admin: false,
      is_staff: false,
      is_superuser: false,
    });
    vi.mocked(isWorker).mockReturnValue(false);

    render(
      <MemoryRouter>
        <LogInPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("usuario@correo.com"), { target: { value: "luis@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Contraseña"), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar Sesión" }));

    await waitFor(() => {
      expect(legacyLogIn).not.toHaveBeenCalled();
      expect(mockedNavigate).toHaveBeenCalledWith("/");
    });
  });
});
