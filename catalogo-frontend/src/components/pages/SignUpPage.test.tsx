import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SignUpPage from "./SignUpPage";
import { signUp } from "../../services/user";
import { getLoggedUserData } from "../../services/user";

// ─── Mocks de elementos de layout ────────────────────────────────────────────
vi.mock("../elements/NavBar", () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock("../elements/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

vi.mock("../elements/HideShowPassword", () => ({
  default: ({ passwordVisibilityAction }: { passwordVisibilityAction: () => void }) => (
    <button type="button" onClick={passwordVisibilityAction} data-testid="toggle-pwd">
      👁
    </button>
  ),
}));

// ─── Mocks de servicios ───────────────────────────────────────────────────────
vi.mock("../../services/user", () => ({
  signUp: vi.fn(),
  getLoggedUserData: vi.fn(),
}));

const mockedSignUp = vi.mocked(signUp);
const mockedGetLoggedUserData = vi.mocked(getLoggedUserData);

// ─── Helper de renderizado ────────────────────────────────────────────────────
function renderSignUpPage() {
  return render(
    <MemoryRouter>
      <SignUpPage />
    </MemoryRouter>,
  );
}

// ─── Helper para rellenar el formulario ──────────────────────────────────────
function fillForm({
  nombre = "Juan",
  apellido = "Pérez",
  correo = "juan@example.com",
  telefono = "5551234567",
  password = "MiPassword1!",
  confirmPassword = "MiPassword1!",
}: {
  nombre?: string;
  apellido?: string;
  correo?: string;
  telefono?: string;
  password?: string;
  confirmPassword?: string;
} = {}) {
  fireEvent.change(screen.getByPlaceholderText(/Nombre\(s\) del usuario/i), {
    target: { value: nombre },
  });
  fireEvent.change(screen.getByPlaceholderText(/Apellido\(s\) del usuario/i), {
    target: { value: apellido },
  });
  fireEvent.change(screen.getByPlaceholderText(/usuario@correo\.com/i), {
    target: { value: correo },
  });
  fireEvent.change(screen.getByPlaceholderText(/\(\+00\)/i), {
    target: { value: telefono },
  });

  const [pwdInput, confirmInput] = screen.getAllByPlaceholderText(
    /contraseña/i,
  ) as HTMLInputElement[];
  fireEvent.change(pwdInput, { target: { value: password } });
  fireEvent.change(confirmInput, { target: { value: confirmPassword } });
}

// =============================================================================
describe("SignUpPage", () => {
  beforeEach(() => {
    // Usuario no autenticado por defecto: getLoggedUserData rechaza con 401
    mockedGetLoggedUserData.mockRejectedValue({
      response: { status: 401 },
    });
    mockedSignUp.mockReset();
  });

  // ── Renderizado básico ─────────────────────────────────────────────────────
  it("renders the registration form with all fields", () => {
    renderSignUpPage();
    expect(screen.getByRole("heading", { name: /Registrarse/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nombre\(s\) del usuario/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Apellido\(s\) del usuario/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/usuario@correo\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/\(\+00\)/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Registrarse/i })).toBeInTheDocument();
  });

  it("shows a link to the login page", () => {
    renderSignUpPage();
    expect(screen.getByRole("link", { name: /Ya tienes cuenta/i })).toHaveAttribute(
      "href",
      "/iniciar-sesion",
    );
  });

  // ── Validación de contraseñas ──────────────────────────────────────────────
  it("shows an error when passwords do not match", async () => {
    renderSignUpPage();
    fillForm({ password: "Password1!", confirmPassword: "OtroPassword1!" });

    fireEvent.click(screen.getByRole("button", { name: /Registrarse/i }));

    expect(
      await screen.findByText(/Las contraseñas no coinciden/i),
    ).toBeInTheDocument();
    expect(mockedSignUp).not.toHaveBeenCalled();
  });

  // ── Registro exitoso ───────────────────────────────────────────────────────
  it("shows the email confirmation screen after a successful registration", async () => {
    mockedSignUp.mockResolvedValue({ status: 201, data: { mensaje: "ok" } } as never);

    renderSignUpPage();
    fillForm({ correo: "nuevo@example.com" });
    fireEvent.click(screen.getByRole("button", { name: /Registrarse/i }));

    // Pantalla de confirmación por correo
    expect(
      await screen.findByRole("heading", { name: /Registro casi completado/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/nuevo@example\.com/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Ir a Iniciar Sesión/i }),
    ).toHaveAttribute("href", "/iniciar-sesion");
  });

  it("calls signUp with the correct payload", async () => {
    mockedSignUp.mockResolvedValue({ status: 201, data: {} } as never);

    renderSignUpPage();
    fillForm({
      nombre: "Ana",
      apellido: "López",
      correo: "ana@test.com",
      telefono: "5557654321",
      password: "Segura2024!",
      confirmPassword: "Segura2024!",
    });
    fireEvent.click(screen.getByRole("button", { name: /Registrarse/i }));

    await waitFor(() => {
      expect(mockedSignUp).toHaveBeenCalledWith({
        id: null,
        nombre: "Ana",
        apellido: "López",
        correo: "ana@test.com",
        telefono: "5557654321",
        password: "Segura2024!",
      });
    });
  });

  // ── Error en el API ────────────────────────────────────────────────────────
  it("shows an error message when the API call fails (e.g. duplicate email)", async () => {
    mockedSignUp.mockRejectedValue(new Error("Usuario ya registrado"));

    renderSignUpPage();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /Registrarse/i }));

    expect(
      await screen.findByText(/Error al registrar usuario/i),
    ).toBeInTheDocument();
  });

  // ── Formulario no visible tras registro exitoso ────────────────────────────
  it("hides the registration form after a successful submission", async () => {
    mockedSignUp.mockResolvedValue({ status: 201, data: {} } as never);

    renderSignUpPage();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /Registrarse/i }));

    // El formulario desaparece
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /Registrarse/i }),
      ).not.toBeInTheDocument();
    });
  });
});
