import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SignUpPage from "./SignUpPage";
import { getLoggedUserData, signUp } from "../../services/user";

const mockedNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

vi.mock("../../services/user", () => ({
  signUp: vi.fn(),
  getLoggedUserData: vi.fn(),
}));

vi.mock("../elements/NavBar", () => ({ default: () => <div data-testid="navbar" /> }));
vi.mock("../elements/Footer", () => ({ default: () => <div data-testid="footer" /> }));
vi.mock("../elements/HideShowPassword", () => ({
  default: ({ passwordVisibilityAction }: { passwordVisibilityAction: () => void }) => (
    <button type="button" onClick={passwordVisibilityAction}>toggle</button>
  ),
}));

describe("SignUpPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getLoggedUserData).mockRejectedValue({ response: { status: 401 } });
  });

  it("navigates to the storefront after a successful JWT-only signup flow", async () => {
    vi.mocked(signUp).mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("Nombre(s) del usuario."), { target: { value: "Ana" } });
    fireEvent.change(screen.getByPlaceholderText("Apellido(s) del usuario."), { target: { value: "Pérez" } });
    fireEvent.change(screen.getByPlaceholderText("Ej.: usuario@correo.com"), { target: { value: "ana@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Ej.: (+00) 000-000-0000"), { target: { value: "555" } });
    fireEvent.change(screen.getByPlaceholderText("Ingrese una contraseña."), { target: { value: "secret" } });
    fireEvent.change(screen.getByPlaceholderText("Confirme su contraseña"), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrarse" }));

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith({
        id: null,
        nombre: "Ana",
        apellido: "Pérez",
        correo: "ana@example.com",
        telefono: "555",
        password: "secret",
      });
    });
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith("/");
    });
  });
});
